import * as Util from "util";

type ColorFn = (...args: any[]) => string;

/**
 * Try to load Node’s util.format. If not available (browser), fallback.
 */
let format: (...args: any[]) => string;
try {
    // @ts-ignore - util isn't available in browser
    format = Util.format;
} catch {
    // Fallback for browsers (no %s substitution, just join)
    format = (...args: any[]) => args.join(" ");
}

const ANSI_COLORS = {
    black: 30,
    red: 31,
    green: 32,
    yellow: 33,
    blue: 34,
    magenta: 35,
    cyan: 36,
    white: 37,
    gray: 90,
    grey: 90,

    brightRed: 91,
    brightGreen: 92,
    brightYellow: 93,
    brightBlue: 94,
    brightMagenta: 95,
    brightCyan: 96,
    brightWhite: 97,
} as const;

// Background colors
const ANSI_BG_COLORS: {
    [K in keyof typeof ANSI_COLORS]: number;
} = Object.fromEntries(
    Object.entries(ANSI_COLORS).map(([name, code]) => [name, code + 10])
) as any;

function supportsColor(): boolean {
    return !!(
        typeof process !== "undefined" &&
        process.stdout &&
        process.stdout.isTTY
    );
}

function colorize(
    openCode: number,
    closeCode: number,
    ...args: any[]
): string {
    const str = format(...args);
    if (!supportsColor()) return str;
    return `\x1b[${openCode}m${str}\x1b[${closeCode}m`;
}

// Chalk type
type Chalk = {
    [K in keyof typeof ANSI_COLORS]: ColorFn;
} & {
    [K in keyof typeof ANSI_BG_COLORS as `bg${Capitalize<K & string>}`]: ColorFn;
};

// Implementation with Proxy
const chalk: Chalk = new Proxy({} as Chalk, {
    get(_, prop: string): ColorFn {
        // Background color (bgRed, bgBlue, etc.)
        if (prop.startsWith("bg") && prop.length > 2) {
            const colorName = (prop[2]!.toLowerCase() + prop.slice(3)) as keyof typeof ANSI_BG_COLORS;
            const code = ANSI_BG_COLORS[colorName];
            return (...args: any[]) =>
                code ? colorize(code, 49, ...args) : format(...args);
        } else {
            // Foreground color
            const code = ANSI_COLORS[prop as keyof typeof ANSI_COLORS];
            return (...args: any[]) =>
                code ? colorize(code, 39, ...args) : format(...args);
        }
    },
});

export default chalk;
