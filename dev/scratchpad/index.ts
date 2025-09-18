import { Cause, Effect } from "effect";

const p1 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve("Promise 1")
    }, 5000);
})

let resolve: (value: string) => void;
let reject: (reason?: any) => void;
const p2 = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
})

await Promise.race([p1, p2]);
/*
function hello_old_world() {
    Error.stackTraceLimit = Infinity;
    const fn = Effect.fn("test")(function* () {
        console.log("Exploding");
        return yield* Effect.fail(new Error("Boom!"));
    })

    fn().pipe(
        Effect.catchAllCause(cause => Effect.gen(function* () {
            if (Cause.isFailType(cause)) {
                console.log(
                    cause.error.stack!
                        .split("\n")
                        .filter(line => !line.includes("/node_modules/.vite/deps/effect"))
                        .join("\n")
                );
                console.log(
                    Cause.prettyErrors(cause)
                );
                console.log(
                    Cause.prettyErrors(cause)[0]
                );
            }
            return cause;
        })),
        Effect.runSync
    )
}

hello_old_world();

Effect.gen(function* () {
    const cause = yield* Effect.cause(
        Effect.failCause(Cause.fail("Oh no!")).pipe(
            Effect.ensuring(Effect.failCause(Cause.die("Boom!")))
        )
    )
    console.log(Cause.prettyErrors(cause))
}).pipe(Effect.runPromise)

Effect.gen(function* () {
    const cause = yield* Effect.cause(
        Effect.all(
            [
                Effect.failCause(Cause.fail("Oh no!")),
                Effect.failCause(Cause.die("Boom!1")),
                Effect.failCause(Cause.die("Boom!2"))
            ],
            { concurrency: 3 }
        )
    )
    console.log(cause);
    console.log(Cause.prettyErrors(cause))
}).pipe(Effect.runPromise)

const cause = yield* Effect.cause(

    Effect.all([

      Effect.fail("error 1"),

      Effect.die("defect"),

      Effect.fail("error 2")

    ])

  )


const testFunc = Effect.fn("testSpan")(function* <N extends number>(n: N) {
    yield* Effect.annotateCurrentSpan("ANNOTATING", n) // Attach metadata to the span
    return yield* Effect.fail(new Error("Boom!")) // Simulate failure
})

const effect = Effect.fn("effect")(function* () {
    return yield* testFunc(100)
})

const prettyErr = effect().pipe(
    Effect.catchAllCause(
        (e) => Effect.gen(function* () {
            console.log(e);
            const er = Cause.prettyErrors(e)[0];
            // console.log(er.span);
            return er
        })
    ),
    Effect.runSync
)

const e = new Error("wha");
console.log(e.stack);
//console.log(e);
//console.log(chalk.blue("vvvvvv"))
//console.log(e.message);

/*
cause,
toString,
message
prepareStackTrace
stack
*/
//const eWithCause = new Error("", {
//    cause: new Error("wha")
//})
// Cause, Message, Name, Stack
//console.log(prettyErr);
//console.log(prettyErr.cause);

/*
import { Effect, Console, Cause } from "effect"


const testFunc = Effect.fn("testSpan")(function* <N extends number>(n: N) {
    yield* Effect.annotateCurrentSpan("ANNOTATING", n) // Attach metadata to the span
    return yield* Effect.fail(new Error("Boom!")) // Simulate failure
})

const effect = Effect.fn("effect")(function* () {
    return yield* testFunc(100)
})


effect().pipe(
    Effect.catchAllCause(
        (e) => Effect.gen(function* () {
            const er = Cause.prettyErrors(e)[0];
            // console.log(er.span);
            console.log(Cause.pretty(e))
            return yield* Effect.logError(e)
        })
    ),
    Effect.runFork
)
    */
