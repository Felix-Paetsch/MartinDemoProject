export function mapBoth<
    MaybeError,
    SuccessResult,
    ErrorResult
>(
    a: MaybeError,
    cb: (arg: Exclude<MaybeError, Error>) => SuccessResult,
    cbErr: (arg: MaybeError & Error) => ErrorResult,
) {
    if (a instanceof Error) return cbErr(a);
    return cb(a as Exclude<MaybeError, Error>);
}

export async function mapBothAsync<
    MaybeError,
    SuccessResult,
    ErrorResult
>(
    b: MaybeError,
    cb: (arg: Exclude<MaybeError, Error>) => SuccessResult,
    cbErr: (arg: MaybeError & Error) => ErrorResult,
) {
    const a = await b;
    if (a instanceof Error) return cbErr(a);
    return cb(a as Exclude<MaybeError, Error>);
}

export function mapSuccess<
    MaybeError,
    SuccessResult
>(
    a: MaybeError,
    cb: (arg: Exclude<MaybeError, Error>) => SuccessResult,
) {
    if (a instanceof Error) return a;
    return cb(a as Exclude<MaybeError, Error>);
}


export async function mapSuccessAsync<
    MaybeError,
    SuccessResult,
>(
    b: Promise<MaybeError>,
    cb: (arg: Exclude<MaybeError, Error>) => SuccessResult,
) {
    const a = await b;
    if (a instanceof Error) return a;
    return await cb(a as Exclude<MaybeError, Error>);
}

export function mapError<
    MaybeError,
    ErrorResult
>(
    a: MaybeError,
    cb: (arg: MaybeError & Error) => ErrorResult,
) {
    if (a instanceof Error) return cb(a);
    return a as Exclude<MaybeError, Error>;
}


export async function mapErrorAsync<
    MaybeError,
    ErrorResult
>(
    b: Promise<MaybeError>,
    cb: (arg: MaybeError & Error) => ErrorResult,
) {
    const a = await b;
    if (a instanceof Error) return cb(a);
    return a as Exclude<MaybeError, Error>;
}
