export const mapBoth = <
    MaybeError,
    SuccessResult,
    ErrorResult
>(
    a: MaybeError,
    cb: (arg: Exclude<MaybeError, Error>) => SuccessResult,
    cbErr: (arg: MaybeError & Error) => ErrorResult
) => {
    if (a instanceof Error) return cbErr(a);
    return cb(a as Exclude<MaybeError, Error>);
};

export const mapBothAsync = async <
    MaybeError,
    SuccessResult,
    ErrorResult
>(
    b: MaybeError,
    cb: (arg: Exclude<MaybeError, Error>) => SuccessResult,
    cbErr: (arg: MaybeError & Error) => ErrorResult
) => {
    const a = await b;
    if (a instanceof Error) return cbErr(a);
    return cb(a as Exclude<MaybeError, Error>);
};

export const mapSuccess = <
    MaybeError,
    SuccessResult
>(
    a: MaybeError,
    cb: (arg: Exclude<MaybeError, Error>) => SuccessResult
) => {
    if (a instanceof Error) return a;
    return cb(a as Exclude<MaybeError, Error>);
};

export const mapSuccessAsync = async <
    MaybeError,
    SuccessResult
>(
    b: Promise<MaybeError>,
    cb: (arg: Exclude<MaybeError, Error>) => SuccessResult
) => {
    const a = await b;
    if (a instanceof Error) return a;
    return await cb(a as Exclude<MaybeError, Error>);
};

export const mapError = <
    MaybeError,
    ErrorResult
>(
    a: MaybeError,
    cb: (arg: MaybeError & Error) => ErrorResult
) => {
    if (a instanceof Error) return cb(a);
    return a as Exclude<MaybeError, Error>;
};

export const mapErrorAsync = async <
    MaybeError,
    ErrorResult
>(
    b: Promise<MaybeError>,
    cb: (arg: MaybeError & Error) => ErrorResult
) => {
    const a = await b;
    if (a instanceof Error) return cb(a);
    return a as Exclude<MaybeError, Error>;
};

export const localizeErrorAsync = async <E>(errProm: E) => {
    const err = await errProm;
    return localizeError(err);
}

export const localizeError = <E>(err: E) => {
    if (!(err instanceof Error)) return err as Exclude<E, Error>;

    try {
        // In all modern environments this shouldnt fail.
        const originalStack = err.stack!;
        const localStack = (new Error()).stack!;

        (err as any).originalStack = originalStack;
        const newStackArr = [
            originalStack.split("\n")[0],
            ...localStack.split("\n").slice(1)
        ]

        Object.defineProperty(err, "stack", {
            value: newStackArr.join("\n"),
            writable: true,
            configurable: true
        });
    } catch { }

    return err as E & Error & {
        originalStack?: string
    };
}

export const throwHere = <E extends Error>(err: E): E => {
    throw localizeError(err);
}
