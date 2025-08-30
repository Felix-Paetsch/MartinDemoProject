import { AbstractLibraryImplementation } from "pc-messaging-kernel/pluginSystem/library";
import { Json } from "pc-messaging-kernel/utils";

export default class LibraryImplementation extends AbstractLibraryImplementation {
    exposes(): string[] {
        return ["hello"];
    }

    call(fn: string, args: readonly Json[]): Json | Promise<Json> {
        if (fn === "hello") {
            return "Hello " + args[0];
        }
        throw new Error("Function not found");
    }
}