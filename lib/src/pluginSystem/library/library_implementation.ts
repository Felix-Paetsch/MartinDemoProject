import { Message } from "../../messaging/base/message";
import { Json } from "../../utils/json";

export abstract class AbstractLibraryImplementation {
    abstract exposes(msg: Message): string[];
    abstract call(fn: string, args: readonly Json[], msg: Message): Json | Promise<Json>;
}