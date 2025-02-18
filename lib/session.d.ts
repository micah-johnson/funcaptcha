import { GetTokenResult } from "./api";
import { Challenge } from "./challenge";
export interface TokenInfo {
    token: string;
    r: string;
    metabgclr: string;
    mainbgclr: string;
    guitextcolor: string;
    metaiconclr: string;
    meta_height: string;
    meta_width: string;
    meta: string;
    pk: string;
    dc: string;
    at: string;
    cdn_url: string;
    lurl: string;
    surl: string;
    smurl: string;
    kbio: boolean;
    mbio: boolean;
    tbio: boolean;
    sup?: string;
    challenge_url_cdn: string;
    ag: string;
    maintxtclr: string;
}
export interface SessionOptions {
    userAgent?: string;
    proxy?: string;
}
export declare class Session {
    token: string;
    tokenInfo: TokenInfo;
    passed: boolean;
    private tokenRaw;
    private userAgent;
    private proxy;
    constructor(token: string | GetTokenResult, sessionOptions?: SessionOptions);
    getChallenge(): Promise<Challenge | null>;
    getEmbedUrl(): string;
}
