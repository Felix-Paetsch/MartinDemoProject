export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type ReadonlyJson = string | number | boolean | null | readonly Json[] | Readonly<{ [key: string]: ReadonlyJson }>
