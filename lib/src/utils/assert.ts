import { MaybePromise } from "./promisify";

const CONF = {
    fail_on_asserts: true,
    execute_assert_fun: true
} as const;

export const assertFun = async (fun: () => MaybePromise<void | string | Error | boolean>, error?: string) => {
    if (!CONF.execute_assert_fun) return;
    const res = await fun();
    let err: Error | null = null;
    if (res === false) {
        err = new Error(error || "ASSERT NOT PASSED");
    } else if (typeof res === "string") {
        err = new Error(res);
    } else if (res instanceof Error) {
        err = res;
    }

    if (!err) return true;

    if (CONF.fail_on_asserts) {
        throw err;
    } else {
        console.warn("ASSERT NOT PASSED: ", err);
        console.warn("========================");
        console.warn(err.stack);
        return false;
    }
}

export const assert = (bool: boolean, error?: string) => {
    if (!bool) {
        if (CONF.fail_on_asserts) {
            throw new Error(error || "ASSERT NOT PASSED");
        } else {
            console.warn("ASSERT NOT PASSED: ", error);
            console.warn("========================");
            console.warn((new Error(error)).stack);
            return false;
        }
    }
    return true;
}
