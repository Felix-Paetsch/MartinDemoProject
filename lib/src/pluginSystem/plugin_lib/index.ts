import { PluginEnvironment } from "./plugin_env/plugin_env";

export type Plugin = (env: PluginEnvironment) => Promise<void>;