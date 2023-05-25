import { PNG } from "pngjs";

const baseFingerprint: {
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
} = {
    DNT: "unknown", // Do not track On/Off | Previous Value: 1
    L: "en-US", // Browser language
    D: 24, // Screen color depth (in bits)
    PR: 1, // Pixel ratio
    S: [1920, 1200], // Screen resolution
    AS: [1920, 1200], // Available screen resolution
    TO: 9999, // Timezone offset
    SS: true, // Screen orientation (landscape/portrait)
    LS: true, // Local storage available
    IDB: true, // IndexedDB available
    B: false, // addBehaviour support
    ODB: true, // OpenDatabase support
    CPUC: "unknown", // CPU Class
    PK: "Win32", // Platform
    CFP: `canvas winding:yes~canvas fp:data:image/png;base64,${Buffer.from(
        Math.random().toString()
    ).toString("base64")}`, // Canvas fingerprint (if canvas is supported)
    FR: false, // Fake screen resolution?
    FOS: false, // Fake OS?
    FB: false, // Fake Browser?
    JSF: [
        "Andale Mono",
        "Arial",
        "Arial Black",
        "Arial Hebrew",
        "Arial MT",
        "Arial Narrow",
        "Arial Rounded MT Bold",
        "Arial Unicode MS",
        "Bitstream Vera Sans Mono",
        "Book Antiqua",
        "Bookman Old Style",
        "Calibri",
        "Cambria",
        "Cambria Math",
        "Century",
        "Century Gothic",
        "Century Schoolbook",
        "Comic Sans",
        "Comic Sans MS",
        "Consolas",
        "Courier",
        "Courier New",
        "Garamond",
        "Geneva",
        "Georgia",
        "Helvetica",
        "Helvetica Neue",
        "Impact",
        "Lucida Bright",
        "Lucida Calligraphy",
        "Lucida Console",
        "Lucida Fax",
        "LUCIDA GRANDE",
        "Lucida Handwriting",
        "Lucida Sans",
        "Lucida Sans Typewriter",
        "Lucida Sans Unicode",
        "Microsoft Sans Serif",
        "Monaco",
        "Monotype Corsiva",
        "MS Gothic",
        "MS Outlook",
        "MS PGothic",
        "MS Reference Sans Serif",
        "MS Sans Serif",
        "MS Serif",
        "MYRIAD",
        "MYRIAD PRO",
        "Palatino",
        "Palatino Linotype",
        "Segoe Print",
        "Segoe Script",
        "Segoe UI",
        "Segoe UI Light",
        "Segoe UI Semibold",
        "Segoe UI Symbol",
        "Tahoma",
        "Times",
        "Times New Roman",
        "Times New Roman PS",
        "Trebuchet MS",
        "Verdana",
        "Wingdings",
        "Wingdings 2",
        "Wingdings 3",
    ], // Checked fonts
    P: [
        'Chrome PDF Viewer::Portable Document Format::application/pdf~pdf,text/pdf~pdf', 
        'Chromium PDF Viewer::Portable Document Format::application/pdf~pdf,text/pdf~pdf', 
        'Microsoft Edge PDF Viewer::Portable Document Format::application/pdf~pdf,text/pdf~pdf', 
        'PDF Viewer::Portable Document Format::application/pdf~pdf,text/pdf~pdf', 
        'WebKit built-in PDF::Portable Document Format::application/pdf~pdf,text/pdf~pdf'
    ], // Plugins (standard and CONSTANT)
    T: [0, false, false], // Touch screen (maxTouchPoints, TouchEvent event listener support, ontouchstart support)
    H: 24, // Cpu threads
    SWF: false, // Flash support
};

const languages = [
    "af",
    "af-ZA",
    "ar",
    "ar-AE",
    "ar-BH",
    "ar-DZ",
    "ar-EG",
    "ar-IQ",
    "ar-JO",
    "ar-KW",
    "ar-LB",
    "ar-LY",
    "ar-MA",
    "ar-OM",
    "ar-QA",
    "ar-SA",
    "ar-SY",
    "ar-TN",
    "ar-YE",
    "az",
    "az-AZ",
    "az-AZ",
    "be",
    "be-BY",
    "bg",
    "bg-BG",
    "bs-BA",
    "ca",
    "ca-ES",
    "cs",
    "cs-CZ",
    "cy",
    "cy-GB",
    "da",
    "da-DK",
    "de",
    "de-AT",
    "de-CH",
    "de-DE",
    "de-LI",
    "de-LU",
    "dv",
    "dv-MV",
    "el",
    "el-GR",
    "en",
    "en-AU",
    "en-BZ",
    "en-CA",
    "en-CB",
    "en-GB",
    "en-IE",
    "en-JM",
    "en-NZ",
    "en-PH",
    "en-TT",
    "en-US",
    "en-ZA",
    "en-ZW",
    "eo",
    "es",
    "es-AR",
    "es-BO",
    "es-CL",
    "es-CO",
    "es-CR",
    "es-DO",
    "es-EC",
    "es-ES",
    "es-ES",
    "es-GT",
    "es-HN",
    "es-MX",
    "es-NI",
    "es-PA",
    "es-PE",
    "es-PR",
    "es-PY",
    "es-SV",
    "es-UY",
    "es-VE",
    "et",
    "et-EE",
    "eu",
    "eu-ES",
    "fa",
    "fa-IR",
    "fi",
    "fi-FI",
    "fo",
    "fo-FO",
    "fr",
    "fr-BE",
    "fr-CA",
    "fr-CH",
    "fr-FR",
    "fr-LU",
    "fr-MC",
    "gl",
    "gl-ES",
    "gu",
    "gu-IN",
    "he",
    "he-IL",
    "hi",
    "hi-IN",
    "hr",
    "hr-BA",
    "hr-HR",
    "hu",
    "hu-HU",
    "hy",
    "hy-AM",
    "id",
    "id-ID",
    "is",
    "is-IS",
    "it",
    "it-CH",
    "it-IT",
    "ja",
    "ja-JP",
    "ka",
    "ka-GE",
    "kk",
    "kk-KZ",
    "kn",
    "kn-IN",
    "ko",
    "ko-KR",
    "kok",
    "kok-IN",
    "ky",
    "ky-KG",
    "lt",
    "lt-LT",
    "lv",
    "lv-LV",
    "mi",
    "mi-NZ",
    "mk",
    "mk-MK",
    "mn",
    "mn-MN",
    "mr",
    "mr-IN",
    "ms",
    "ms-BN",
    "ms-MY",
    "mt",
    "mt-MT",
    "nb",
    "nb-NO",
    "nl",
    "nl-BE",
    "nl-NL",
    "nn-NO",
    "ns",
    "ns-ZA",
    "pa",
    "pa-IN",
    "pl",
    "pl-PL",
    "ps",
    "ps-AR",
    "pt",
    "pt-BR",
    "pt-PT",
    "qu",
    "qu-BO",
    "qu-EC",
    "qu-PE",
    "ro",
    "ro-RO",
    "ru",
    "ru-RU",
    "sa",
    "sa-IN",
    "se",
    "se-FI",
    "se-FI",
    "se-FI",
    "se-NO",
    "se-NO",
    "se-NO",
    "se-SE",
    "se-SE",
    "se-SE",
    "sk",
    "sk-SK",
    "sl",
    "sl-SI",
    "sq",
    "sq-AL",
    "sr-BA",
    "sr-BA",
    "sr-SP",
    "sr-SP",
    "sv",
    "sv-FI",
    "sv-SE",
    "sw",
    "sw-KE",
    "syr",
    "syr-SY",
    "ta",
    "ta-IN",
    "te",
    "te-IN",
    "th",
    "th-TH",
    "tl",
    "tl-PH",
    "tn",
    "tn-ZA",
    "tr",
    "tr-TR",
    "tt",
    "tt-RU",
    "ts",
    "uk",
    "uk-UA",
    "ur",
    "ur-PK",
    "uz",
    "uz-UZ",
    "uz-UZ",
    "vi",
    "vi-VN",
    "xh",
    "xh-ZA",
    "zh",
    "zh-CN",
    "zh-HK",
    "zh-MO",
    "zh-SG",
    "zh-TW",
    "zu",
    "zu-ZA",
];

let screenRes = [
    [1920, 1080],
    [1920, 1200],
    [2048, 1080],
    [2560, 1440],
    [1366, 768],
    [1440, 900],
    [1536, 864],
    [1680, 1050],
    [1280, 1024],
    [1280, 800],
    [1280, 720],
    [1600, 1200],
    [1600, 900],
];
function randomScreenRes() {
    return screenRes[Math.floor(Math.random() * screenRes.length)];
}

// Get fingerprint
function getFingerprint(canvasFp?: string, randomCanvasFp?: boolean) {
    let fingerprint = { ...baseFingerprint }; // Create a copy of the base fingerprint

    // Randomization time!
    fingerprint["DNT"] = "unknown"; //Math.round(Math.random());
    fingerprint["L"] = languages[Math.floor(Math.random() * languages.length)];
    fingerprint["D"] = [24, 32][
        Math.floor(Math.random() * 2)
    ]; // common value only: 24bit/32bit
    fingerprint["PR"] = [1, 1.25, 1.5, 1.75][
        Math.floor(Math.random() * 4)
    ]; // common value only: 1, 1.25, 1.5, 1.75
    fingerprint["S"] = randomScreenRes().map(x => x / fingerprint["PR"]); // change screen res to match pixel ratio
    fingerprint["AS"] = fingerprint["S"]; //[fingerprint["S"][0], fingerprint["S"][1] - 40]
    fingerprint["TO"] = (Math.floor(Math.random() * 24) - 12) * 60; // timezone SHOULD be based on current IP
    fingerprint["SS"] = true; //Math.random() > 0.5;
    fingerprint["LS"] = true; //Math.random() > 0.5;
    fingerprint["IDB"] = true; //Math.random() > 0.5;
    fingerprint["B"] = false; // IE-only signature, SHOULD NOT EXIST //Math.random() > 0.5;
    fingerprint["ODB"] = true; // WebSQL, MUST be disabled after November 7, 2023 (Chromium 119). Might TODO base on UA. //Math.random() > 0.5;
    fingerprint["CPUC"] = "unknown"; /*["68K", "Alpha", "PPC", "x86", "Other", "unknown"][
        Math.floor(Math.random() * 5)
    ];*/
    fingerprint["PK"] = "Win32" // This SHOULD be based on User Agent. 
    /*[
        "HP-UX",
        "Mac68K",
        "MacPPC",
        "SunOS",
        "Win16",
        "Win32",
        "WinCE",
    ][Math.floor(Math.random() * 7)];*/

    let rdCanvas: string;
    if (typeof randomCanvasFp === "undefined" || randomCanvasFp) {
        // attempt to randomize canvas fingerprint by generating a random 300x150 PNG image
        let png = new PNG({
            height: 150,
            width: 300,
        });

        for (let y = 0; y < png.height; y++) {
            for (let x = 0; x < png.width; x++) {
                let idx = (png.width * y + x) << 2;

                png.data[idx] = Math.floor(Math.random() * 256);
                png.data[idx + 1] = Math.floor(Math.random() * 256);
                png.data[idx + 2] = Math.floor(Math.random() * 256);
                png.data[idx + 3] = 0xFF;
            }
        }
        var buffer = PNG.sync.write(png, { 
            colorType: 6, 
            bitDepth: 8
        });

        rdCanvas = `data:image/png;base64,${buffer.toString("base64")}`;
    }
    fingerprint["CFP"] = canvasFp ?? rdCanvas ?? false; // We CAN randomize data, block canvas fingerprinting, or BYOP

    /*`canvas winding:yes~canvas fp:data:image/png;base64,${Buffer.from(
        Math.random().toString()
    ).toString("base64")}`;*/ //canvasFp || ''; // Canvas Fingerprint

    fingerprint["FR"] = false; // Fake Resolution
    fingerprint["FOS"] = false; // Fake Operating System
    fingerprint["FB"] = false; // Fake Browser

    // Standard Windows fonts
    fingerprint["JSF"] = ['Arial', 'Arial Black', 'Arial Narrow', 'Book Antiqua', 'Bookman Old Style', 'Calibri', 'Cambria', 'Cambria Math', 'Century', 'Century Gothic', 'Century Schoolbook', 'Comic Sans MS', 'Consolas', 'Courier', 'Courier New', 'Garamond', 'Georgia', 'Helvetica', 'Impact', 'Lucida Bright', 'Lucida Calligraphy', 'Lucida Console', 'Lucida Fax', 'Lucida Handwriting', 'Lucida Sans', 'Lucida Sans Typewriter', 'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Monotype Corsiva', 'MS Gothic', 'MS PGothic', 'MS Reference Sans Serif', 'MS Sans Serif', 'MS Serif', 'Palatino Linotype', 'Segoe Print', 'Segoe Script', 'Segoe UI', 'Segoe UI Light', 'Segoe UI Semibold', 'Segoe UI Symbol', 'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Wingdings', 'Wingdings 2', 'Wingdings 3']; //fingerprint["JSF"].filter(() => Math.random() > 0.5);

    //fingerprint["P"] = fingerprint["P"].filter(() => Math.random() > 0.5);
    let randomizeTouch = Math.random() > 0.5;
    fingerprint["T"] = randomizeTouch ? [
        Math.floor(Math.random() * 8),
        false, //Math.random() > 0.5,
        false //Math.random() > 0.5,
    ] : [0, false, false]; // Touch Support [maxTouchPoints, touchEvent emit support, is touchStart listened]
    fingerprint["H"] = 2 ** Math.floor(Math.random() * 3);
    fingerprint["SWF"] = fingerprint["SWF"]; // RIP Flash

    return fingerprint;
}

function prepareF(fingerprint) {
    let f = [];
    let keys = Object.keys(fingerprint);
    for (let i = 0; i < keys.length; i++) {
        if (fingerprint[keys[i]].join) f.push(fingerprint[keys[i]].join(";"));
        else f.push(fingerprint[keys[i]]);
    }
    return f.join("~~~");
}

function prepareFe(fingerprint) {
    let fe = [];
    let keys = Object.keys(fingerprint);
    for (let i = 0; i < keys.length; i++) {
        switch (keys[i]) {
            case "CFP":
                fe.push(`${keys[i]}:${cfpHash(fingerprint[keys[i]])}`);
                break;
            case "P":
                fe.push(
                    `${keys[i]}:${fingerprint[keys[i]].map(
                        (v) => v.split("::")[0]
                    )}`
                );
                break;
            default:
                fe.push(`${keys[i]}:${fingerprint[keys[i]]}`);
                break;
        }
    }

    return fe;
}

function cfpHash(H8W) {
    var l8W, U8W;
    if (!H8W) return "";
    if (Array.prototype.reduce)
        return H8W.split("").reduce(function (p8W, z8W) {
            p8W = (p8W << 5) - p8W + z8W.charCodeAt(0);
            return p8W & p8W;
        }, 0);
    l8W = 0;
    if (H8W.length === 0) return l8W;
    for (var k8W = 0; k8W < H8W.length; k8W++) {
        U8W = H8W.charCodeAt(k8W);
        l8W = (l8W << 5) - l8W + U8W;
        l8W = l8W & l8W;
    }
    return l8W;
}

export default {
    getFingerprint,
    prepareF,
    prepareFe,
};
