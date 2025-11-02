import { Address, Middleware } from "../../../messaging/exports";

export class ExternalReference {
    public is_removed = false;

    constructor(
        readonly address: Address,
        readonly on_remove: () => void | Promise<void> = () => Promise.resolve(),
    ) { }

    async remove() {
        if (this.is_removed) return Promise.resolve();
        return await this.on_remove();
    }
}
