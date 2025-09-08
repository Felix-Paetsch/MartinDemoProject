import { Bridge, PluginEnvironment, PluginIdentWithInstanceId } from "../../../../lib/src/pluginSystem/plugin_lib/exports";
import { Result } from "../../../../lib/src/utils/exports";

const current_plugins: PluginIdentWithInstanceId[] = [];
export default async function (env: PluginEnvironment) {
    console.log("<< STARTING MAIN PLUGIN >>");
    create_div();

    const button = document.getElementById('main-plugin-button');
    await handShake(env);
    await handShake(env);
    button!.addEventListener('click', () => handShake(env));

    const library = await env.get_library({
        name: "test",
        version: "1.0.0"
    });

    if (library.is_error) {
        throw library.error;
    }

    const lib = library.value;
    const exposed = await lib.exposed_functions();
    console.log(exposed);
    const res = await lib.call("hi", "Martin");
    console.log(res);
}

async function handShake(env: PluginEnvironment) {
    const res_1 = await env.get_plugin({
        name: "foo",
        version: "1.0.0"
    });

    env.log("My lof");

    if (res_1.is_error) {
        console.log(res_1);
        throw res_1;
    }

    const mp = res_1.value;
    current_plugins.push(mp.plugin_ident);

    // ts cant infer type on its own for some reason
    const res_2: Result<Bridge, Error> = await mp.bridge();
    if (res_2.is_error) {
        throw res_2.error;
    }

    const bridge = res_2.value;
    bridge.on((data) => {
        if (data === "close") {
            const index = current_plugins.indexOf(mp.plugin_ident);
            if (index !== -1) {
                current_plugins.splice(index, 1);
            }
        }
        if (data === "close right") {
            const index = current_plugins.indexOf(mp.plugin_ident);
            if (index !== current_plugins.length - 1) {
                env.send_kernel_message("close", current_plugins[index + 1]!);
            }
        }
    });
}

// Create a new div and append it to #add
// Set the content to be some html I will provide.
const create_div = () => {
    const div = document.createElement('div');
    div.id = 'main';
    div.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        ">
            <h3 style="margin: 0 0 10px 0; font-size: 18px;">🚀 Click to open iframe</h3>
            <button id="main-plugin-button" style="
                margin-top: 15px;
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 5px;
                color: white;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
            ">Click Me</button>
        </div>
    `;

    // Append to the app container
    const appContainer = document.getElementById('app');
    if (appContainer) {
        appContainer.appendChild(div);
    }
}