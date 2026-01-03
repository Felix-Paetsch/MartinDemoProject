import { Json } from "../../utils/exports";
import { Address } from "../../messaging/exports";
import { add_library, addressToMessagePartner } from "./index";
import { call_local_library_method, call_plugin_method } from "./protocol";
import { PluginEnvironment, PluginMessagePartner } from "../../pluginSystem/exports";

const local_library_mps: Map<Address.StringSerializedAddress, Promise<PluginMessagePartner | Error>> = new Map();

export default abstract class Library {
    constructor(
        readonly name: string
    ) {
        add_library(name, this);
    }

    async call_library_method(
        env: PluginEnvironment, name: string, ...args: Json[]
    ): Promise<Json | Error> {
        let mp: Error | PluginMessagePartner = new Error("No plugin initialized yet");

        const existing_mp_promise = local_library_mps.get(env.address.toString());
        if (existing_mp_promise) {
            mp = await existing_mp_promise;
        }

        if (mp instanceof Error) {
            const new_mp_promise = env.get_plugin({
                "name": "local_library"
            });

            local_library_mps.set(env.address.toString(), new_mp_promise);
            mp = await new_mp_promise;
            if (mp instanceof Error) {
                return mp;
            }

            env.on_remove(() => {
                local_library_mps.delete(env.address.toString());
            })
        }

        return mp.run_message_partner_protocol(
            call_local_library_method,
            {
                lib: this.name,
                method: name,
                args
            }
        )
    }

    async call_plugin_method(
        address: Address,
        name: string,
        ...args: Json[]
    ): Promise<Json | Error> {
        const mp = addressToMessagePartner(address);
        if (!mp) return new Error("MessagePartner not found.");
        return mp.run_message_partner_protocol(
            call_plugin_method,
            {
                lib: this.name,
                method: name,
                args
            }
        );
    }

    abstract evalue_library_method(address: Address, name: string, ...args: Json[]): Json | Error | Promise<Json | Error>;
    abstract evalue_plugin_method(env: PluginEnvironment, name: string, ...args: Json[]): Json | Error | Promise<Json | Error>;

    on_message_partner_remove(a: Address): Promise<void> {
        return Promise.resolve();
    }
}
