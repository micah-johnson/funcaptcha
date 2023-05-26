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
//import { SocksClient } from "socks";
const agentConnectionTable = new Map();
function req(url, options, proxy, http1) {
    return __awaiter(this, void 0, void 0, function* () {
        if (http1) {
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
            let req = http2.request(url, Object.assign({ agent }, options));
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
