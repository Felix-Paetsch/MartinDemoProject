import { Message } from "../../messaging/core/message";
import { Json } from "../../utils/json";

export abstract class AbstractLibraryImplementation {
    protected _disposed = false;
    abstract exposes(msg: Message): string[];
    abstract call(fn: string, args: readonly Json[], msg: Message): Json | Promise<Json>;

    is_disposed(): boolean {
        return this._disposed;
    }

    dispose(): void {
        this._disposed = true;
    }

    static from_object<Args extends Json[]>(
        obj: Record<string, (...args: Args) => Json | Promise<Json>>,
        dispose: () => void = () => { }
    ): AbstractLibraryImplementation {
        return new ConcreteLibraryImplementation(
            () => Object.keys(obj),
            (fn, args) => {
                if (Object.keys(obj).includes(fn) && typeof obj[fn] === "function") {
                    return obj[fn](...args as Args);
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
        if (this._disposed) { return; }
        super.dispose();
        this.__dispose.bind(this)();
    }
}