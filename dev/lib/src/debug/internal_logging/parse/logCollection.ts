import { Severity } from "../../internal_logging/logging/severity";
import { Address } from "../../../messaging/core/address";
import { Message } from "../../../messaging/core/message";
import { DataLog, Log, MessageLog } from "../../../advanced_messaging/logging";
import { DefaultFormatter, Formatter } from "../logging/parse/formatter";
import { DataLogEntry, LogEntry, MessageLogEntry } from "./logEntry";
import type LogInvestigator from "./logInverstigator";

export class LogCollection {
    constructor(
        readonly investigator: LogInvestigator,
        readonly logs: LogEntry[],
        public formatter: Formatter = DefaultFormatter
    ) { }

    to_array(): Log[] {
        return this.logs.map(log => log.log);
    }

    to_string(): string {
        return this.logs.map(log => this.formatter(log)).join("\n");
    }

    print(logEntry?: LogEntry) {
        if (logEntry) {
            this.new_log_collection([logEntry]).print();
        } else {
            console.log(this.to_string());
        }
    }

    push(...logs: LogEntry[]) {
        this.logs.push(...logs);
    }

    set_formatter(formatter: Formatter) {
        this.formatter = formatter;
        return this;
    }

    filter(predicate: (log: LogEntry) => boolean): LogCollection {
        return this.new_log_collection(this.logs.filter(predicate));
    }

    new_log_collection(logs: LogEntry[]): LogCollection {
        return new LogCollection(this.investigator, logs, this.formatter);
    }

    messages(): MessageLogCollection {
        return new MessageLogCollection(this.investigator, this.logs.filter(log => log.type === "Message"));
    }

    data(): DataLogCollection {
        return new DataLogCollection(this.investigator, this.logs.filter(log => log.type === "Data"));
    }
}

export class MessageLogCollection extends LogCollection {
    constructor(
        readonly investigator: LogInvestigator,
        readonly logs: MessageLogEntry[],
        public formatter: Formatter = DefaultFormatter
    ) {
        super(investigator, logs, formatter);
    }

    to_array(): MessageLog[] {
        return this.logs.map(log => log.log);
    }

    push(...logs: MessageLogEntry[]) {
        this.logs.push(...logs);
    }

    filter(predicate: (log: MessageLogEntry) => boolean): MessageLogCollection {
        return this.new_log_collection(this.logs.filter(predicate));
    }

    from(a: Address) {
        return this.filter(log => log.meta_data.annotation?.source === a.serialize());
    }

    to(a: Address) {
        return this.filter(log => log.meta_data.annotation?.target === a.serialize());
    }

    at_sender() {
        return this.filter(log => {
            return log.meta_data.annotation?.at_source;
        });
    }

    at_reciever() {
        return this.filter(log => {
            return log.meta_data.annotation?.at_target;
        });
    }

    errors() {

    }

    no_errors() {

    }

    message(ident: string | Message | MessageLog): LogCollection {
        const strIdent = typeof ident === "string" ? ident : ident.meta_data.annotation?.message_id;
        return this.filter(log => log.meta_data.annotation?.message_id === strIdent);
    }

    first_message_logs() {
        const logs = [];
        for (const log of this.logs) {
            if (this.message(log).logs[0] === log) {
                logs.push(log);
            }
        }
        return this.new_log_collection(logs);
    }

    last_message_logs() {
        const logs = [];
        for (const log of this.logs) {
            if (this.message(log).logs[this.message(log).logs.length - 1] === log) {
                logs.push(log);
            }
        }
        return this.new_log_collection(logs);
    }

    first_of_chain(ident: string | Message | MessageLog) {
        return this.message_chain(ident).logs[0] || null
    }

    uses_protocol(protocol: string): LogCollection {
        return this.filter(log => log.meta_data.protocol === protocol);
    }

    message_chain(ident: string | Message | MessageLog): LogCollection {
        let strIdent: string | null = null;
        if (typeof ident === "string") {
            strIdent = ident;
        } else {
            strIdent = ident.meta_data.chain_message?.msg_chain_uid ?? null;
        }

        return this.filter((log: MessageLogEntry) => {
            return log.meta_data.chain_message?.msg_chain_uid === strIdent;
        });
    }

    new_log_collection(logs: MessageLogEntry[]): MessageLogCollection {
        return new MessageLogCollection(this.investigator, logs, this.formatter);
    }
}


export class DataLogCollection extends LogCollection {
    constructor(
        readonly investigator: LogInvestigator,
        readonly logs: DataLogEntry[],
        public formatter: Formatter = DefaultFormatter
    ) {
        super(investigator, logs, formatter);
    }

    to_array(): DataLog[] {
        return this.logs.map(log => log.log);
    }

    filter(predicate: (log: DataLogEntry) => boolean): DataLogCollection {
        return this.new_log_collection(this.logs.filter(predicate));
    }

    new_log_collection(logs: DataLogEntry[]): DataLogCollection {
        return new DataLogCollection(this.investigator, logs, this.formatter);
    }

    severity(severity: Severity): DataLogCollection {
        return this.filter(log => log.log.data.severity === severity);
    }
}