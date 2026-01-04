import { Schema } from "effect";
import {
    MessageLogSchema,
    DataLogSchema,
    LogSchema,
    DataToLog,
    MessageToLog
} from "../../effect/logs";
import {
    Message
} from "../../core/message";
import { Json } from "../../../utils/json";

export type MessageLog = Schema.Schema.Type<typeof MessageLogSchema>;
export type DataLog = Schema.Schema.Type<typeof DataLogSchema>;
export type Log = Schema.Schema.Type<typeof LogSchema>;

export const ToLog = (log: Json | Message): Log => Schema.decodeSync(Schema.Union(MessageToLog, DataToLog))(log);
