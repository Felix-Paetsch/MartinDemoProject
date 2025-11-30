import { FileReference } from "../../types/base"
import { Address } from "pc-messaging-kernel/messaging"

export type Subscription = {
    fr: FileReference,
    key: string,
    address: Address
}
