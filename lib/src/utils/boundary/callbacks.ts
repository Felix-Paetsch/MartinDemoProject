export class CallbackError extends Error {
    constructor(readonly error: Error) {
        // @ts-ignore
        super("Callback Error", { cause: error });
        Object.setPrototypeOf(this, new.target.prototype);
    }

    override get message() {
        return `${this.error.name} ${this.error.message}`;
    }

    override get stack(): string | undefined {
        return `CallbackError: ${this.message}\n${super.stack}\n<><><> Original Error <><><>\n${this.error.stack}`;
    }

    override toString() {
        return this.stack ?? this.message;
    }
}
