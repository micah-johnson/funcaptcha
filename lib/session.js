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
exports.Session = void 0;
const challenge_1 = require("./challenge");
const http_1 = require("./http");
const util_1 = require("./util");
let parseToken = (token) => Object.fromEntries(token
    .split("|")
    .map((v) => v.split("=").map((v) => decodeURIComponent(v))));
class Session {
    constructor(token, sessionOptions) {
        var _a;
        this.passed = false;
        if (typeof token === "string") {
            this.token = token;
        }
        else {
            this.token = token.token;
            this.tokenRaw = token;
        }
        if (!this.token.startsWith("token="))
            this.token = "token=" + this.token;
        this.tokenInfo = parseToken(this.token);
        this.tokenInfo.mbio = typeof (token) !== "string" ? (_a = token.mbio) !== null && _a !== void 0 ? _a : false : false;
        this.passed = this.tokenInfo.sup === "1";
        this.userAgent = (sessionOptions === null || sessionOptions === void 0 ? void 0 : sessionOptions.userAgent) || util_1.default.DEFAULT_USER_AGENT;
        this.proxy = sessionOptions === null || sessionOptions === void 0 ? void 0 : sessionOptions.proxy;
    }
    getChallenge() {
        return __awaiter(this, void 0, void 0, function* () {
            // Do not attempt to get challenge if already passed
            if (this.passed)
                return null;
            const requestData = {
                token: this.tokenInfo.token,
                sid: this.tokenInfo.r,
                render_type: "canvas",
                lang: "",
                isAudioGame: undefined,
                analytics_tier: this.tokenInfo.at,
                apiBreakerVersion: undefined
            };
            if (this.tokenRaw && this.tokenRaw.challenge_url_cdn.includes('game_core')) {
                requestData.apiBreakerVersion = "green";
                requestData.isAudioGame = false;
            }
            else {
                requestData["data%5Bstatus%5D"] = "init";
            }
            let res = yield (0, http_1.default)(this.tokenInfo.surl, {
                path: "/fc/gfct/",
                method: "POST",
                body: util_1.default.constructFormData(requestData),
                headers: {
                    "User-Agent": this.userAgent,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Sec-Fetch-Site": "same-origin",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Dest": "empty",
                    "Origin": this.tokenInfo.surl,
                    "Referer": this.getEmbedUrl(),
                    "X-Requested-With": "XMLHttpRequest",
                    "X-NewRelic-Timestamp": Date.now().toString()
                },
            }, this.proxy);
            let data = JSON.parse(res.body.toString());
            data.token = this.token;
            data.tokenInfo = this.tokenInfo;
            if (data.error === "DENIED ACCESS") {
                // Do not need to solve challenge
                return null;
            }
            if (data.game_data.gameType == 1) {
                return new challenge_1.Challenge1(data, {
                    proxy: this.proxy,
                    userAgent: this.userAgent,
                }, this);
            }
            else if (data.game_data.gameType == 3) {
                return new challenge_1.Challenge3(data, {
                    proxy: this.proxy,
                    userAgent: this.userAgent,
                }, this);
            }
            else if (data.game_data.gameType == 4) {
                return new challenge_1.Challenge4(data, {
                    proxy: this.proxy,
                    userAgent: this.userAgent,
                }, this);
            }
            else {
                throw new Error("Unsupported game type: " + data.game_data.gameType);
            }
            //return res.body.toString()
        });
    }
    getEmbedUrl() {
        //https://client-api.arkoselabs.com/fc/assets/ec-game-core/game-core/1.12.0/standard/index.html
        return `${this.tokenInfo.surl}/fc/assets/ec-game-core/game-core/1.12.0/standard/index.html?${util_1.default.constructFormData(this.tokenInfo)}`;
    }
}
exports.Session = Session;
