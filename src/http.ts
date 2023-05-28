import * as http2 from "http2-wrapper";
import { request, ProxyAgent } from "undici";
import type Dispatcher from "undici/types/dispatcher";
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
    http1: T = false as T
) {
    if (http1) {
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
        let req = http2.request(url, {
            agent,
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
