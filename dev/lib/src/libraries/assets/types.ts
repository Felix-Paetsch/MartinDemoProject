import { type UUID } from "../../utils/uuid";
import { Json } from "../../utils/json";
import { FileDescriptionS, FileEventS, FileS, FileTypeS, MetaDataS } from "./schemas";
import { Schema } from "effect";
import { RecencyTokenS } from "./schemas";

export type FileType = Schema.Schema.Type<typeof FileTypeS>;

export type FileReference = UUID;
export type FileContents = Json;
export type FileDescription = Schema.Schema.Type<typeof FileDescriptionS>

export type MetaData = Schema.Schema.Type<typeof MetaDataS>
export type File = Schema.Schema.Type<typeof FileS>

export type FileStore = Map<FileReference, File>;
export type RecencyToken = Schema.Schema.Type<typeof RecencyTokenS>

export type FileEvent = Schema.Schema.Type<typeof FileEventS>;
