import { Plugin } from "pc-messaging-kernel/pluginSystem";
import { Logging, MessagePartner, PluginEnvironment } from "pc-messaging-kernel";
import { Box, ColorDisplayAPI } from "./ui.js";
import * as Assets from "../../../../lib/assets/exports";
import { add_middleware } from "../../shared/middleware";

export const plugin: Plugin = async (env) => {
    add_middleware(env);

    set_up_file_event_stuff(env);
    set_up_color_picker_stuff(env);
};

let cf: Assets.ManagedFile | null = null;
async function set_up_file_event_stuff(env: PluginEnvironment) {
    const r = await Assets.create_managed_file(env, "colorFile");
    if (r instanceof Error) throw r;
    cf = r;

    ColorDisplayAPI.onCloseClick(() => {
        update_asset()
    });
    ColorDisplayAPI.onAddClick(() => {
        update_asset()
    });

    update_asset();

    const res = await cf.subscribe((e) => {
        if (e.type == "CHANGE_FILE_CONTENT") {
            return update_boxes(e.contents as Box[]);
        }

        throw new Error(`Unexpected file event! ${JSON.stringify(e)}`);
    });
}

async function update_asset() {
    const res = await cf?.write(ColorDisplayAPI.getBoxes());
}

function update_boxes(new_boxes: Box[]) {
    ColorDisplayAPI.syncBoxes(new_boxes);
}


// ================

type ColorPicker = {
    mp: MessagePartner,
    color_id: number
}

let colorPickers: ColorPicker[] = [];
async function set_up_color_picker_stuff(env: PluginEnvironment) {
    ColorDisplayAPI.onColorClick(async (id, color) => {
        const cp = colorPickers.find(cp => cp.color_id === id);
        if (cp) {
            cp.mp.send_message({
                type: "click"
            });
            return;
        }

        const mp = await env.get_plugin({
            name: "color_picker"
        });

        if (mp instanceof Error) {
            throw mp;
        }

        colorPickers.push({
            mp,
            color_id: id
        });

        mp.on_remove(() => {
            colorPickers = colorPickers.filter(p => p.color_id !== id);
        });

        mp.on_message_listener_registered(() => {
            mp.send_message({
                type: "id",
                color: color,
                id: id
            });
        });
    })
}

