import * as http2 from "http2-wrapper";
import { request, ProxyAgent } from "undici";
import type Dispatcher from "undici/types/dispatcher";
import * as tls from "tls";
//import { SocksClient } from "socks";

const agentConnectionTable = new Map<string, http2.Agent>();

async function req<T extends boolean>(
    url: string,
    options: T extends true ?
        http2.RequestOptions & { body?: string } :
        T extends false ?
        Omit<Dispatcher.RequestOptions, 'origin' | 'path' | 'method'> & Partial<Pick<Dispatcher.RequestOptions, 'method'>> :
        never,
    proxy?: string,
    http1Only: T = false as T
) {
    if (http1Only) {
        let auth = undefined;
        if (proxy) {
            let proxyUrl = new URL(proxy);
            if (proxyUrl.username && proxyUrl.password) {
                auth = Buffer.from(proxyUrl.username + ":" + proxyUrl.password).toString("base64")
            }
        }
        let dispatcher = proxy ? new ProxyAgent({
            uri: proxy,
            auth
        }) : undefined;

        //@ts-ignore
        let req = await request(url, {
            ...options,
            dispatcher
        });
        return {
            headers: req.headers,
            body: Buffer.from(await req.body.arrayBuffer()),
            status: req.statusCode
        };
    } else {
        const resolveAlpnProxy = new URL('https://username:password@localhost:8000');
        const connect = async (options: tls.ConnectionOptions, callback: () => void) => new Promise<tls.TLSSocket>((resolve, reject) => {
            const host = `${options.host}:${options.port}`;

            (async () => {
                try {
                    const request = await http2.auto(resolveAlpnProxy, {
                        method: 'CONNECT',
                        headers: {
                            host
                        },
                        path: host
                    });

                    request.end();

                    request.once('error', reject);

                    request.once('connect', (response, socket, head) => {
                        if (head.length > 0) {
                            reject(new Error(`Unexpected data before CONNECT tunnel: ${head.length} bytes`));

                            socket.destroy();
                            return;
                        }

                        const tlsSocket = tls.connect({
                            ...options,
                            socket
                        }, callback);

                        resolve(tlsSocket);
                    });
                } catch (error) {
                    reject(error);
                }
            })();
        });

        // This is required to prevent leaking real IP address on ALPN negotiation
        const resolveProtocol = http2.auto.createResolveProtocol(new Map(), new Map(), connect);

        let agent: http2.Agent | undefined = undefined;
        if (proxy) {
            // proxy is expected to be a http proxy
            let proxyUrl = new URL(proxy);
            if (proxyUrl.protocol !== "http:") {
                throw new Error("Only http proxy is supported");
            }

            agent = new http2.proxies.Http2OverHttp({
                proxyOptions: {
                    url: proxyUrl
                }
            });
        }

        //@ts-ignore
        let req = await http2.auto(url, {
            agent,
            resolveProtocol,
            ...options
        });
        if (options.body) req.write(options.body);
        req.end();

        let res = await new Promise<http2.IncomingMessage>((resolve, reject) => {
            req.once("response", resolve);
            req.once("error", reject);
        });

        const body: Buffer[] = [];
        res.on("data", (chunk) => body.push(chunk));
        await new Promise<void>((resolve, reject) => {
            res.once("end", resolve);
            res.once("error", reject);
        });

        return {
            headers: res.headers,
            body: Buffer.concat(body),
            status: res.statusCode
        };
    }
}

export default req;
