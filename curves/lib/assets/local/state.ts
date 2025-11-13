import { Address } from "cluster";
import { FileReference, File, SubscriptionId } from "../types";
import { systemFiles } from "./system_files";

export const Store: Record<FileReference, File> = {};
for (const sf of systemFiles) {
    Store[sf.meta_data.fileReference] = sf;
}

export const Subscriptions: {
    address: Address,
    fr: FileReference,
    subscriptionId: SubscriptionId
}[] = [];

