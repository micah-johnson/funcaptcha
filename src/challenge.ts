import request from "./http";
import { TokenInfo } from "./session";
import util from "./util";
import crypt from "./crypt";
import { assert } from "console";
import type { Session } from "./session";
import WindMouse from "windmouse";
import { getToken } from "./api";

interface ChallengeOptions {
    userAgent?: string;
    proxy?: string;
}

interface ChallengeData {
    token: string;
    tokenInfo: TokenInfo;
    session_token: string;
    challengeID: string;
    game_data: {
        gameType: number;
        customGUI: {
            _guiFontColr: string;
            _challenge_imgs: string[];
            api_breaker: any;
            encrypted_mode: number;
            example_images: {
                correct: string;
                incorrect: string;
            }
        };
        waves: number;
        instruction_string: string;
        game_variant: string;
    };
    game_sid: string;
    lang: string;
    string_table: {
        [key: string]: string;
    },
    string_table_prefixes: string[]
}

enum MouseBIOEnum {
    MOVE = 0,
    DOWN = 1,
    UP = 2
}

interface AnswerResponse {
    response: "not answered" | "answered";
    solved?: boolean;
    incorrect_guess?: number;
    score?: number;
    decryption_key?: string;
    time_end?: number;
    time_end_seconds?: number;
}

export abstract class Challenge {
    public data: ChallengeData;
    public imgs: Promise<Buffer>[];
    public wave: number = 0;
    protected key: string;
    protected userAgent: string;
    protected proxy: string;
    protected fakeMLastPos: [x: number, y: number] = [0, 0];
    protected BIOT = Date.now();

    get solved() {
        return this.session.passed;
    }

    constructor(data: ChallengeData, challengeOptions: ChallengeOptions, public session: Session) {
        this.data = data;
        this.userAgent = challengeOptions.userAgent;
        this.proxy = challengeOptions.proxy;

        const tokenData = data.tokenInfo;

        // Preload images (one image at a time)
        let imgResolve: ((buf: Buffer) => void)[] = [];
        this.imgs = new Array(data.game_data.customGUI._challenge_imgs.length).fill(0);
        for (let i = 0; i < this.imgs.length; i++) {
            this.imgs[i] = new Promise((resolve) => {
                imgResolve.push(resolve);
            });
        }

        (async () => {
            for (let i = 0; i < this.imgs.length; i++) {
                let url = data.game_data.customGUI._challenge_imgs[i];
                let req = await request(url, {
                    method: "GET",
                    headers: {
                        "User-Agent": this.userAgent,
                        "Referer": `https://client-api.arkoselabs.com/fc/assets/ec-game-core/game-core/1.12.0/standard/index.html?session=${this.data.session_token}&r=${tokenData.r}&meta=${tokenData.meta}&metabgclr=${tokenData.metabgclr}&metaiconclr=${encodeURIComponent(tokenData.metaiconclr)}&maintxtclr=${encodeURIComponent(tokenData.maintxtclr)}&guitextcolor=${encodeURIComponent(tokenData.guitextcolor)}&pk=${tokenData.pk}&at=${tokenData.at}&ag=${tokenData.ag}&cdn_url=${encodeURIComponent(tokenData.cdn_url)}&lurl=${encodeURIComponent(tokenData.lurl)}&surl=${encodeURIComponent(tokenData.surl)}&smurl=${encodeURIComponent(tokenData.smurl)}&theme=default`
                    }
                }, this.proxy);
                imgResolve[i](req.body);

                await new Promise(r => setTimeout(r, 1000));
            }
        })();

        if (data.game_data.customGUI.encrypted_mode) {
            // Preload decryption key
            this.getKey();
        }
    }

    async getImage(wave?: number): Promise<Buffer> {
        let img = await this.imgs[typeof wave === "number" ? wave : this.wave];
        try {
            JSON.parse(img.toString()); // Image is encrypted
            img = Buffer.from(
                crypt.decrypt(img.toString(), await this.getKey()),
                "base64"
            );
        } catch (err) {
            // Image is not encrypted
            // All good!
        }
        return img;
    }

    protected async getKey() {
        if (this.key) return this.key;
        let response = await request(
            this.data.tokenInfo.surl,
            {
                method: "POST",
                path: "/fc/ekey/",
                headers: {
                    "User-Agent": this.userAgent,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Referer": this.data.tokenInfo.surl,
                },
                body: util.constructFormData({
                    session_token: this.data.session_token,
                    game_token: this.data.challengeID,
                }),
            },
            this.proxy
        );
        this.key = JSON.parse(response.body.toString()).decryption_key;
        return this.key;
    }

    abstract answer(answer: number): Promise<AnswerResponse>;

    get gameType() {
        return this.data.game_data.gameType;
    }

    get variant() {
        return this.data.game_data.game_variant;
    }

    get instruction() {
        return this.data.string_table[`${this.data.game_data.gameType}.instructions-${this.data.game_data.game_variant}`] || this.data.string_table[`${this.data.game_data.gameType}.touch_done_info${this.data.game_data.game_variant ? `_${this.data.game_data.game_variant}` : ""}`];
    }

    get waves() {
        return this.data.game_data.waves;
    }
}

export class Challenge1 extends Challenge {
    private answerHistory = [];
    public increment;

    constructor(data: ChallengeData, challengeOptions: ChallengeOptions, session: Session) {
        super(data, challengeOptions, session);

        // But WHY?!
        let clr = data.game_data.customGUI._guiFontColr
        this.increment = parseInt(clr ? clr.replace("#", "").substring(3) : "28", 16)
        this.increment = this.increment > 113 ? this.increment / 10 : this.increment
    }

    private round(num: number): string {
        return (Math.round(num * 10) / 10).toFixed(2);
    }

    async answer(answer: number): Promise<AnswerResponse> {
        if (answer >= 0 && answer <= Math.round(360 / 51.4) - 1)
            this.answerHistory.push(this.round(answer * this.increment));
        else
            this.answerHistory.push(this.round(answer))

        let encrypted = await crypt.encrypt(
            this.answerHistory.toString(),
            this.data.session_token
        );
        let req = await request(
            this.data.tokenInfo.surl,
            {
                method: "POST",
                path: "/fc/ca/",
                headers: {
                    "User-Agent": this.userAgent,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: util.constructFormData({
                    session_token: this.data.session_token,
                    game_token: this.data.challengeID,
                    guess: encrypted,
                }),
            },
            this.proxy
        );
        let reqData = JSON.parse(req.body.toString()) as AnswerResponse;
        this.key = reqData.decryption_key || "";
        this.wave++;

        if (reqData.solved) {
            this.session.passed = true;
        }

        return reqData;
    }
}

export class Challenge3 extends Challenge {
    private answerHistory = [];

    constructor(data: ChallengeData, challengeOptions: ChallengeOptions, session: Session) {
        super(data, challengeOptions, session);
    }

    async answer(tile: number): Promise<AnswerResponse> {
        assert(tile >= 0 && tile <= 5, "Tile must be between 0 and 5");
        const apiBreaker = this.data.game_data.customGUI.api_breaker
        let pos: number[] | Object = util.tileToLoc(tile);
        // @ts-ignore
        if (typeof (apiBreaker) === "object" && apiBreaker.key && apiBreaker.value) {
            pos = {
                x: pos[0],
                y: pos[1],
                px: (pos[0] / 100).toString(),
                py: (pos[1] / 100).toString(),
            }

            const apiBreakerFunctions = util.apiBreakers2.type_3

            this.answerHistory.push(
                // @ts-ignore
                apiBreakerFunctions.key[apiBreaker.key](
                    // @ts-ignore
                    util.breakerValue(apiBreaker.value || ["alpha"], apiBreakerFunctions.value)(pos)
                )
            );
        } else {
            this.answerHistory.push(
                util.apiBreakers[
                    apiBreaker || "default"
                ](pos)
            );
        }

        let encrypted = await crypt.encrypt(
            JSON.stringify(this.answerHistory),
            this.data.session_token
        );
        let requestedId = await crypt.encrypt(JSON.stringify({}), `REQUESTED${this.data.session_token}ID`);
        let { cookie: tCookie, value: tValue } = util.getTimestamp();
        console.log(`https://client-api.arkoselabs.com/fc/gc/?token=${this.data.token.replace("|", "&")}`)
        let req = await request(
            this.data.tokenInfo.surl,
            {
                method: "POST",
                path: "/fc/ca/",
                headers: {
                    "User-Agent": this.userAgent,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-Newrelic-Timestamp": tValue,
                    "X-Requested-ID": requestedId,
                    "X-Requested-With": "XMLHttpRequest",
                    "Referer": `https://client-api.arkoselabs.com/fc/gc/?token=${this.data.token.replace("|", "&")}`
                },
                body: util.constructFormData({
                    session_token: this.data.session_token,
                    game_token: this.data.challengeID,
                    guess: encrypted,
                    analytics_tier: this.data.tokenInfo.at,
                    sid: this.data.tokenInfo.r,
                    bio: this.data.tokenInfo.mbio && "eyJtYmlvIjoiMTI1MCwwLDE0NywyMDQ7MTg5NCwwLDE1MSwyMDA7MTk2MCwxLDE1MiwxOTk7MjAyOSwyLDE1MiwxOTk7MjU3NSwwLDE1NSwxOTU7MjU4NSwwLDE1NiwxOTA7MjU5NSwwLDE1OCwxODU7MjYwNCwwLDE1OSwxODA7MjYxMywwLDE2MCwxNzU7MjYyMSwwLDE2MSwxNzA7MjYzMCwwLDE2MywxNjU7MjY0MCwwLDE2NCwxNjA7MjY1MCwwLDE2NSwxNTU7MjY2NCwwLDE2NiwxNTA7MjY3NywwLDE2NiwxNDQ7MjY5NCwwLDE2NywxMzk7MjcyMCwwLDE2NywxMzM7Mjc1NCwwLDE2NywxMjc7Mjc4MywwLDE2NywxMjE7MjgxMiwwLDE2NywxMTU7Mjg0MywwLDE2NywxMDk7Mjg2MywwLDE2NywxMDM7Mjg3NSwwLDE2Niw5ODsyOTA1LDAsMTY1LDkzOzMyMzIsMCwxNjUsOTk7MzI2MiwwLDE2NSwxMDU7MzI5OSwwLDE2NCwxMTA7MzM0MCwwLDE2MSwxMTU7MzM3MiwwLDE1NywxMjA7MzM5NSwwLDE1MywxMjQ7MzQwOCwwLDE0OCwxMjc7MzQyMCwwLDE0MywxMzA7MzQyOSwwLDEzOCwxMzE7MzQ0MSwwLDEzMywxMzQ7MzQ1MCwwLDEyOCwxMzU7MzQ2MSwwLDEyMywxMzg7MzQ3NiwwLDExOCwxNDA7MzQ4OSwwLDExMywxNDI7MzUwMywwLDEwOCwxNDM7MzUxOCwwLDEwMywxNDQ7MzUzNCwwLDk4LDE0NTszNTU2LDAsOTMsMTQ2OzM2MTUsMCw4OCwxNDg7MzY2MiwwLDgzLDE1MTszNjgzLDAsNzgsMTU0OzM3MDEsMCw3MywxNTc7MzcyNSwwLDY5LDE2MTszNzkzLDEsNjgsMTYyOzM4NTEsMiw2OCwxNjI7IiwidGJpbyI6IiIsImtiaW8iOiIifQ=="
                }),
            },
            this.proxy
        );
        let reqData = JSON.parse(req.body.toString()) as AnswerResponse;
        this.key = reqData.decryption_key || "";
        this.wave++;

        if (reqData.solved) {
            this.session.passed = true;
        }

        return reqData;
    }
}

export class Challenge4 extends Challenge {
    private answerHistory = [];

    constructor(data: ChallengeData, challengeOptions: ChallengeOptions, session: Session) {
        super(data, challengeOptions, session);

        // always start from top or left edge
        this.fakeMLastPos = Math.round(Math.random()) ?
            [Math.round(Math.random() * 250), 0] :
            [0, Math.round(Math.random() * 200)];
    }

    async answer(tile: number): Promise<AnswerResponse> {
        assert(tile >= 0 && tile <= 5, "Tile must be between 0 and 5");
        const apiBreaker = this.data.game_data.customGUI.api_breaker

        // @ts-ignore
        if (typeof (apiBreaker) === "object" && apiBreaker.key && apiBreaker.value) {
            const apiBreakerFunctions = util.apiBreakers2.type_4

            this.answerHistory.push(
                // @ts-ignore
                apiBreakerFunctions.key[apiBreaker.key](
                    // @ts-ignore
                    util.breakerValue(apiBreaker.value, apiBreakerFunctions.value)({ index: tile })
                )
            );
        } else {
            throw "Invalid API breaker"
        }

        let encrypted = await crypt.encrypt(
            JSON.stringify(this.answerHistory),
            this.data.session_token
        );
        let requestedId = await crypt.encrypt(JSON.stringify({ sc: [ 17 + Math.ceil(Math.random() * 268), 198 + Math.ceil(Math.random() * 30) ] }), `REQUESTED${this.data.session_token}ID`);
        let { cookie: tCookie, value: tValue } = util.getTimestamp();

        let fakeMBIO: [deltaT: number, type: MouseBIOEnum, x: number, y: number][] = [];

        let fakeMouse = new WindMouse(Math.floor(Math.random() * 10));
        let waitTimes = 0;
        if (tile !== 0) {
            let nextButtonPos = [
                Math.floor(Math.random() * 18) + 237,
                Math.floor(Math.random() * 18) + 153
            ] as [number, number];
            let points = await fakeMouse.GeneratePoints({
                startX: this.fakeMLastPos[0],
                startY: this.fakeMLastPos[1],
                endX: nextButtonPos[0],
                endY: nextButtonPos[1],
                gravity: Math.ceil(Math.random() * 2) + 8,
                wind: Math.ceil(Math.random() * 2) + 4,
                minWait: 2,
                maxWait: 8,
                maxStep: 6,
                targetArea: 4,
            });

            fakeMBIO.push(...points.map(v => (waitTimes = v[2], [(Date.now() - this.BIOT) + v[2], MouseBIOEnum.MOVE, v[0], v[1]]) as [number, number, number, number]));

            this.fakeMLastPos = nextButtonPos;
            // mouse click last 25+-5ms (click "tile" times)
            for (let i = 0; i < tile; i++) {
                let clickTime = Math.floor(Math.random() * 10) + 20;
                fakeMBIO.push([(Date.now() - this.BIOT) + waitTimes, MouseBIOEnum.DOWN, this.fakeMLastPos[0], this.fakeMLastPos[1]]);
                waitTimes += clickTime;
                fakeMBIO.push([(Date.now() - this.BIOT) + waitTimes, MouseBIOEnum.UP, this.fakeMLastPos[0], this.fakeMLastPos[1]]);
                // wait 350+-50ms between clicks (time to read)
                waitTimes += Math.floor(Math.random() * 100) + 300;
            }
        }

        // move mouse to next button (avoid button edge by 4px)
        /*
        height: 30
        width: 266.3999938964844
        x: 0
        y: 199.63333129882812
        */
        let nextButtonPos = [
            Math.floor(Math.random() * 258) + 4,
            Math.floor(Math.random() * 26) + 204
        ] as [number, number];
        let points = await fakeMouse.GeneratePoints({
            startX: this.fakeMLastPos[0],
            startY: this.fakeMLastPos[1],
            endX: nextButtonPos[0],
            endY: nextButtonPos[1],
            gravity: Math.ceil(Math.random() * 2) + 8,
            wind: Math.ceil(Math.random() * 2) + 4,
            minWait: 2,
            maxWait: 8,
            maxStep: 6,
            targetArea: 4
        });

        fakeMBIO.push(...points.map(v => [(Date.now() - this.BIOT) + v[2], MouseBIOEnum.MOVE, v[0], v[1]] as [number, number, number, number]));
        waitTimes += points.at(-1)[2];
        // click
        let clickTime = Math.floor(Math.random() * 10) + 20;
        fakeMBIO.push([(Date.now() - this.BIOT) + waitTimes, MouseBIOEnum.DOWN, this.fakeMLastPos[0], this.fakeMLastPos[1]]);
        waitTimes += clickTime;
        fakeMBIO.push([(Date.now() - this.BIOT) + waitTimes, MouseBIOEnum.UP, this.fakeMLastPos[0], this.fakeMLastPos[1]]);

        // mbio maximum length is 149
        fakeMBIO.splice(149);
        this.fakeMLastPos = nextButtonPos;

        await new Promise(r => setTimeout(r, waitTimes));

        const tokenData = this.data.tokenInfo

        const formData = {
            session_token: this.data.session_token,
            game_token: this.data.challengeID,
            sid: tokenData.r,
            guess: encrypted,
            render_type: "canvas",
            analytics_tier: tokenData.at,
            bio: tokenData.mbio && Buffer.from(JSON.stringify({
                mbio: fakeMBIO.map(v => v.join(",")).join(";"),
                tbio: "",
                kbio: ""
            })).toString("base64")
        }

        const headers = {
            "User-Agent": this.userAgent,
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Newrelic-Timestamp": tValue,
            "X-Requested-ID": requestedId,
            "Cookie": tCookie,
            "X-Requested-With": "XMLHttpRequest",
            "Referer": `https://client-api.arkoselabs.com/fc/assets/ec-game-core/game-core/1.12.0/standard/index.html?session=${this.data.session_token}&r=${tokenData.r}&meta=${tokenData.meta}&metabgclr=${tokenData.metabgclr}&metaiconclr=${encodeURIComponent(tokenData.metaiconclr)}&maintxtclr=${encodeURIComponent(tokenData.maintxtclr)}&guitextcolor=${encodeURIComponent(tokenData.guitextcolor)}&pk=${tokenData.pk}&at=${tokenData.at}&ag=${tokenData.ag}&cdn_url=${encodeURIComponent(tokenData.cdn_url)}&lurl=${encodeURIComponent(tokenData.lurl)}&surl=${encodeURIComponent(tokenData.surl)}&smurl=${encodeURIComponent(tokenData.smurl)}&theme=default`,
        }

        let req = await request(
            this.data.tokenInfo.surl,
            {
                method: "POST",
                path: "/fc/ca/",
                headers,
                body: util.constructFormData(formData),
            },
            this.proxy
        );
        let reqData = JSON.parse(req.body.toString()) as AnswerResponse;
        this.key = reqData.decryption_key || "";
        this.wave++;

        // reset fake mouse timer
        this.BIOT = Date.now();

        if (reqData.solved) {
            this.session.passed = true;
        }

        return reqData;
    }

    get instruction() {
        return this.data.string_table[`4.instructions-${this.data.game_data.instruction_string}`]?.replace(/<\/*\w+>/g, '');
    }
}
