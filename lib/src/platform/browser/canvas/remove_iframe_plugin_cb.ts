import { KernelEnvironment, PluginReference } from "../../../pluginSystem/exports";
import { assert } from "../../../utils/assert";

export async function terminate_plugin(pref: PluginReference) {
    const kernel = KernelEnvironment.singleton;
    assert(!!kernel);

    await kernel!.remove_plugin(pref);
}

