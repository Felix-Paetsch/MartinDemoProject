import {
    applyPatch,
    createPatch,
    Operation as O
} from 'rfc6902';
import {
    AddOperation as Add,
    RemoveOperation as Remove,
    MoveOperation as Move,
    ReplaceOperation as Replace,
    CopyOperation as Copy,
    TestOperation as Test,
} from 'rfc6902/diff';
import * as Patch from 'rfc6902/patch';

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type ReadonlyJson = string | number | boolean | null | readonly Json[] | Readonly<{ [key: string]: ReadonlyJson }>

export namespace JsonPatch {
    export const apply = function (obj: Json, operations: Operation[]): Error | Json {
        const res = applyPatch(obj, operations);
        const err = res.find(e => e instanceof Error);
        if (err) return err;
        return obj;
    }
    export const create = createPatch;

    export type JSONPointer = string;

    export type Operation = O;
    export type AddOperation = Add;
    export type RemoveOperation = Remove;
    export type MoveOperation = Move;
    export type ReplaceOperation = Replace;
    export type CopyOperation = Copy;
    export type TestOperation = Test;

    export const MissingError = Patch.MissingError;
    export type MissingError = typeof Patch.MissingError;
    export const TestError = Patch.TestError;
    export type TestError = typeof Patch.TestError;
    export const InvalidOperationError = Patch.InvalidOperationError;
    export type InvalidOperationError = typeof Patch.InvalidOperationError;
}
