import { FileContents, FileDescriptor, FileReference } from "../shared/file";

export function read(file: FileReference): FileContents {

}

export function descriptor(file: FileReference): FileDescriptor {

}

export function create(uuid: UUID): FileReference {

}

export function write(file: FileContents): void {

}

export function patch(file: FileContents, a: null, b: null) {

}

export function subscribe(file: FileReference, cb: () => void, key?: string): void {

}

export function unsubscribe(file: FileReference, cb: string | (() => void)) { }

export function allFiles(): FileDescriptor[] { }
