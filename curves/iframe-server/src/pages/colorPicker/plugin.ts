import { Plugin } from "pc-messaging-kernel/pluginSystem";
import * as Assets from "../../../../lib/assets/exports";
import { ColorPickerAPI } from "./ui.js";
import { Box } from "../colorDisplay/ui";
import { add_middleware } from "../../shared/middleware";

export const plugin: Plugin = async (env) => {
    add_middleware(env);

    let id: number = -1;
    env.on_plugin_request((mp) => {
        setTimeout(() => {
            mp.on_message((m) => {
                const tm = m as { type: "click" } | { type: "id", id: number, color: string }
                if (tm.type == "id") {
                    id = tm.id;
                    ColorPickerAPI.setColor(tm.color);
                } else {
                    ColorPickerAPI.flash();
                }
            });
        }, 500)
    });

    const af = await Assets.manage_file(env, "colorFile");
    if (af instanceof Error) throw af;

    af.subscribe((e) => {
        if (e.type == "CHANGE_FILE_CONTENT") {
            const boxes: Box[] = e.contents as any;
            const own_box = boxes.find(b => b.id === id);
            if (!own_box) {
                return env.remove_self()
            }

            return ColorPickerAPI.setColor(own_box.color);
        }

        throw new Error(`Unexpected file event! ${JSON.stringify(e)}`);
    });

    ColorPickerAPI.onColorChange(async (c: string) => {
        const file = await af.file();
        if (file instanceof Error) throw file;
        const contents = file.contents;

        const boxes: Box[] = contents as any;
        const own_box = boxes.find(b => b.id === id);
        if (!own_box) {
            return env.remove_self()
        }
        own_box.color = c;
        af.write(boxes);
    });
};
