"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const http2 = require("http2-wrapper");
const undici_1 = require("undici");
const tls = require("tls");
//import { SocksClient } from "socks";
const agentConnectionTable = new Map();
function req(url, options, proxy, http1Only = false) {
    return __awaiter(this, void 0, void 0, function* () {
        if (http1Only) {
            let auth = undefined;
            if (proxy) {
                let proxyUrl = new URL(proxy);
                if (proxyUrl.username && proxyUrl.password) {
                    auth = Buffer.from(proxyUrl.username + ":" + proxyUrl.password).toString("base64");
                }
            }
            let dispatcher = proxy ? new undici_1.ProxyAgent({
                uri: proxy,
                auth
            }) : undefined;
            //@ts-ignore
            let req = yield (0, undici_1.request)(url, Object.assign(Object.assign({}, options), { dispatcher }));
            return {
                headers: req.headers,
                body: Buffer.from(yield req.body.arrayBuffer()),
                status: req.statusCode
            };
        }
        else {
            const resolveAlpnProxy = new URL('https://username:password@localhost:8000');
            const connect = (options, callback) => __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => {
                    const host = `${options.host}:${options.port}`;
                    (() => __awaiter(this, void 0, void 0, function* () {
                        try {
                            const request = yield http2.auto(resolveAlpnProxy, {
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
                                const tlsSocket = tls.connect(Object.assign(Object.assign({}, options), { socket }), callback);
                                resolve(tlsSocket);
                            });
                        }
                        catch (error) {
                            reject(error);
                        }
                    }))();
                });
            });
            // This is required to prevent leaking real IP address on ALPN negotiation
            const resolveProtocol = http2.auto.createResolveProtocol(new Map(), new Map(), connect);
            let agent = undefined;
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
            let req = yield http2.auto(url, Object.assign({ agent,
                resolveProtocol }, options));
            if (options.body)
                req.write(options.body);
            req.end();
            let res = yield new Promise((resolve, reject) => {
                req.once("response", resolve);
                req.once("error", reject);
            });
            const body = [];
            res.on("data", (chunk) => body.push(chunk));
            yield new Promise((resolve, reject) => {
                res.once("end", resolve);
                res.once("error", reject);
            });
            return {
                headers: res.headers,
                body: Buffer.concat(body),
                status: res.statusCode
            };
        }
    });
}
exports.default = req;
