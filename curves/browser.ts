import { Logging } from "../../../lib/src/messaging/exports";
import "../local_plugins/main.css";
import { KernelImpl } from "./kernel/index";
import { Failure } from "../../../lib/src/messaging/exports";

declare global {
    var logInverstigator: Logging.LogInvestigator
}

Failure.setAnomalyHandler((e) => {
    console.log(e);
    throw e;
});
Failure.setErrorHandler((e) => {
    console.log(e);
    throw e;
});

globalThis.logInverstigator = new Logging.LogInvestigator();
const kernel = new KernelImpl();
kernel.start() //.then(r => console.log(r));
