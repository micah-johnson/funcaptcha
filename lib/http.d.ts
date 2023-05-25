/// <reference types="node" />
/// <reference types="node" />
import * as http2 from "http2-wrapper";
declare function req(url: string, options: http2.RequestOptions & {
    body?: string;
}, proxy?: string): Promise<{
    headers: import("http").IncomingHttpHeaders;
    body: Buffer;
    status: number;
}>;
export default req;
