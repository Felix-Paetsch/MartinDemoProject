import { Message } from "../../messaging/base/message";
import { Json } from "../../utils/json";

export abstract class AbstractLibraryImplementation {
    private _disposed = false;
    abstract exposes(msg: Message): string[];
    abstract call(fn: string, args: readonly Json[], msg: Message): Json | Promise<Json>;

    is_disposed(): boolean {
        return this._disposed;
    }

    dispose(): void {
        if (this._disposed) {
            throw new Error("Library already disposed");
        }
        this._disposed = true;
    }

    static from_object(
        obj: Record<string, (...args: Json[]) => Json>,
        dispose: () => void = () => { }
    ): AbstractLibraryImplementation {
        return new ConcreteLibraryImplementation(
            () => Object.keys(obj),
            (fn, args) => {
                if (Object.keys(obj).includes(fn) && typeof obj[fn] === "function") {
                    return obj[fn](...args);
                }
                throw new Error("Function not found");
            },
            dispose
        );
    }

    static from_methods(
        exposes: (msg: Message) => string[],
        call: (fn: string, args: readonly Json[], msg: Message) => Json | Promise<Json>,
        dispose: () => void = () => { }
    ): AbstractLibraryImplementation {
        return new ConcreteLibraryImplementation(
            exposes,
            call,
            dispose
        );
    }
}

class ConcreteLibraryImplementation extends AbstractLibraryImplementation {
    constructor(
        readonly exposes: (msg: Message) => string[],
        readonly call: (fn: string, args: readonly Json[], msg: Message) => Json | Promise<Json>,
        readonly __dispose: () => void
    ) {
        super();

        this.exposes = exposes.bind(this);
        this.call = call.bind(this);
    }

    dispose(): void {
        this.__dispose.bind(this)();
        super.dispose();
    }
}