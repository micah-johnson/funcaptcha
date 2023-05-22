import * as http2 from "http2-wrapper";
import type Dispatcher from "undici/types/dispatcher";
import { SocksClient } from "socks";

const agentConnectionTable = new Map<string, http2.Agent>();

async function req(url: string, options: http2.RequestOptions & { body?: string }, proxy?: string) {
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

    let req = http2.request(url, options);
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
    };
}

export default req;
