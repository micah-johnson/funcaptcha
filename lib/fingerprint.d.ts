declare function getFingerprint(canvasFp?: string, randomCanvasFp?: boolean): {
    DNT: string;
    L: string;
    D: number;
    PR: number;
    S: number[];
    AS: number[];
    TO: number;
    SS: boolean;
    LS: boolean;
    IDB: boolean;
    B: boolean;
    ODB: boolean;
    CPUC: string;
    PK: string;
    CFP: string | boolean;
    FR: boolean;
    FOS: boolean;
    FB: boolean;
    JSF: string[];
    P: string[];
    T: (number | boolean)[];
    H: number;
    SWF: boolean;
};
declare function prepareF(fingerprint: any): string;
declare function prepareFe(fingerprint: any): any[];
declare const _default: {
    getFingerprint: typeof getFingerprint;
    prepareF: typeof prepareF;
    prepareFe: typeof prepareFe;
};
export default _default;
