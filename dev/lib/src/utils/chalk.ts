type ColorFn = (str: string) => string;

const ANSI_COLORS: Record<string, number> = {
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
};

// Background color lookup
const ANSI_BG_COLORS: Record<string, number> = {};
for (const [name, code] of Object.entries(ANSI_COLORS)) {
    ANSI_BG_COLORS[name] = code + 10;
}

// Color support check
function supportsColor(): boolean {
    return !!process.stdout.isTTY;
}

// Wrap with ANSI or just return raw string
function colorize(openCode: number, closeCode: number, str: string): string {
    if (!supportsColor()) return str;
    return `\x1b[${openCode}m${str}\x1b[${closeCode}m`;
}

// Main chalk type: foreground colors and background colors
type Chalk = {
    [K in keyof typeof ANSI_COLORS]: ColorFn;
} & {
    [K in keyof typeof ANSI_BG_COLORS as `bg${Capitalize<K & string>}`]: ColorFn;
};

// Chalk implementation through Proxy
const chalk: Chalk = new Proxy(
    {} as Chalk,
    {
        get(_, prop: string): ColorFn {
            if (prop.startsWith("bg") && prop.length > 2) {
                // background colors e.g. bgRed
                const colorName =
                    prop[2]!.toLowerCase() + prop.slice(3); // bgRed -> red
                const code = ANSI_BG_COLORS[colorName];
                if (!code) return (str: string) => str;
                return (str: string) => colorize(code, 49, str);
            } else {
                // foreground colors
                const code = ANSI_COLORS[prop];
                if (!code) return (str: string) => str;
                return (str: string) => colorize(code, 39, str);
            }
        },
    }
);

export default chalk;
