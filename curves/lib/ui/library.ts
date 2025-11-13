import { LocalLibrary } from "pc-messaging-kernel/libraries";
import { create_window } from "./methods/local/index";

export default new LocalLibrary.RecordLibrary(
    {
        create_window
    } as const,
    {

    },
    "ui_library"
);
