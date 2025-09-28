import { type UUID } from "../../utils/uuid";
import { Json } from "../../utils/json";

export type FileType = "LOCAL" | "SYSTEM";
export type SystemFile = "LISTDIR";

export type FileReference = UUID;
export type FileContents = Json;

export type JSONPointer = any;

export type FileDescriptor = {
    own_reference: FileReference
    type: FileType,
}
export type File = {
    descr: FileDescriptor,
    contents: FileContents
}

export type FileStore = Map<FileReference, File>;
export type RecencyToken = any;

// Alternative: FileReference


export type FileEvent = {
    "type": "DELETE",
    "token": RecencyToken
} | {
    "type": "CHANGE",
    "contents": FileContents,
    "descriptor": FileDescriptor,
    "changedAt": JSONPointer,
    "token": RecencyToken
}

function subscribe(to: FileReference, cb: (
    event: FileEvent
) => {}, subscription_key?: string) { }
function unsubscribe(from: FileReference, what: any) { }

function create(fr: FileReference, contents: FileContents = ""): FileDescriptor { }
function Delete(fr: FileReference): void { }

// Allow for recency tokens
function update(fr: FileReference, token: RecencyToken, contents: FileContents = "") { }
function patch(fr: FileReference, token: RecencyToken, patches: any[]) { }
function write(fr: FileReference, token: RecencyToken, data: FileContents): FileDescriptor { }

function read(fr: FileReference): FileContents { }
function file(fr: FileReference): File { }
function descriptor(fr: FileReference): FileDescriptor { }

class ManagedFile {
    constructor() { }

    file() { }
    read() { }
    write() { }
    descriptor() { }
    sync() { }
    subscribe() { }
    unsubscribe() { }
    delete() { }

    static create() { }
}