import { Address } from "../../../messaging/exports";

export class ExternalReference {
    public is_removed = false;
    public is_removing = false;

    constructor(
        readonly address: Address,
        readonly on_remove: () => void | Promise<void> = () => Promise.resolve(),
    ) { }

    async remove() {
        if (this.is_removing) return Promise.resolve();
        this.is_removing = true;
        await this.on_remove();
        this.is_removing = false;
        this.is_removed = true;
    }
}
