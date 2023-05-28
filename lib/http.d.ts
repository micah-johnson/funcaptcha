/// <reference types="node" />
import * as http2 from "http2-wrapper";
import type Dispatcher from "undici/types/dispatcher";
declare function req<T extends boolean>(url: string, options: T extends true ? http2.RequestOptions & {
    body?: string;
} : T extends false ? Omit<Dispatcher.RequestOptions, 'origin' | 'path' | 'method'> & Partial<Pick<Dispatcher.RequestOptions, 'method'>> : never, proxy?: string, http1Only?: T): Promise<{
    headers: import("undici/types/header").IncomingHttpHeaders;
    body: Buffer;
    status: number;
}>;
export default req;
