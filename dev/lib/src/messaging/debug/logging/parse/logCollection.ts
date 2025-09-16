import { DefaultFormatter, Formatter } from "./formatter";
import type LogInvestigator from "./logInverstigator";
import { LogProcessor } from "../index";
import { Log, MessageLog, DataLog } from "../log";
import { Address } from "../../../core/address";
import { Message } from "../../../core/message";

export class LogCollection {
    constructor(
        readonly investigator: LogInvestigator,
        readonly logs: Log[],
        public formatter: Formatter = DefaultFormatter
    ) { }

    log: LogProcessor = (log: Log) => {
        this.logs.push(log);
    }

    print(log?: Log) {
        if (log) {
            this.#new_log_collection([log]).print();
        } else {
            console.log(this.logs.map(log => this.formatter(log)).join("\n"));
        }
    }

    set_formatter(formatter: Formatter) {
        this.formatter = formatter;
        return this;
    }

    push(...logs: Log[]) {
        this.logs.push(...logs);
    }

    filter(predicate: (log: Log) => boolean): LogCollection {
        return this.#new_log_collection(this.logs.filter(predicate));
    }

    messages(): MessageLogCollection {
        return new MessageLogCollection(
            this.investigator,
            this.logs.filter(log => log.type === "Message"),
            this.formatter
        );
    }

    data(): DataLogCollection {
        return new DataLogCollection(
            this.investigator,
            this.logs.filter(log => log.type === "Data"),
            this.formatter
        );
    }

    group_by<Key>(cb: (l: Log) => Key) {
        const map: Map<Key, LogCollection> = new Map();
        for (let log of this.logs) {
            const key = cb(log);
            if (map.has(key)) {
                map.get(key)?.push(log)
            } else {
                map.set(key, this.#new_log_collection([log]));
            }
        }
        return map;
    }

    #new_log_collection(logs: Log[]) {
        return new LogCollection(this.investigator, logs, this.formatter);
    }
}

export class MessageLogCollection extends LogCollection {
    constructor(
        readonly investigator: LogInvestigator,
        readonly logs: MessageLog[],
        public formatter: Formatter = DefaultFormatter
    ) {
        super(investigator, logs, formatter);
    }

    push(...logs: MessageLog[]) {
        this.logs.push(...logs);
    }

    filter(predicate: (log: MessageLog) => boolean): MessageLogCollection {
        return this.#new_log_collection(this.logs.filter(predicate));
    }

    group_by<Key>(cb: (l: MessageLog) => Key) {
        const map: Map<Key, MessageLogCollection> = new Map();
        for (let log of this.logs) {
            const key = cb(log);
            if (map.has(key)) {
                map.get(key)?.push(log)
            } else {
                map.set(key, this.#new_log_collection([log]));
            }
        }
        return map;
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
        return this.#new_log_collection(logs);
    }

    last_message_logs() {
        const logs = [];
        for (const log of this.logs) {
            if (this.message(log).logs[this.message(log).logs.length - 1] === log) {
                logs.push(log);
            }
        }
        return this.#new_log_collection(logs);
    }

    #new_log_collection(logs: MessageLog[]): MessageLogCollection {
        return new MessageLogCollection(this.investigator, logs, this.formatter);
    }
}


export class DataLogCollection extends LogCollection {
    constructor(
        readonly investigator: LogInvestigator,
        readonly logs: DataLog[],
        public formatter: Formatter = DefaultFormatter
    ) {
        super(investigator, logs, formatter);
    }

    filter(predicate: (log: DataLog) => boolean): DataLogCollection {
        return this.#new_log_collection(this.logs.filter(predicate));
    }

    group_by<Key>(cb: (l: DataLog) => Key) {
        const map: Map<Key, DataLogCollection> = new Map();
        for (let log of this.logs) {
            const key = cb(log);
            if (map.has(key)) {
                map.get(key)?.push(log)
            } else {
                map.set(key, this.#new_log_collection([log]));
            }
        }
        return map;
    }

    #new_log_collection(logs: DataLog[]): DataLogCollection {
        return new DataLogCollection(this.investigator, logs, this.formatter);
    }
}
