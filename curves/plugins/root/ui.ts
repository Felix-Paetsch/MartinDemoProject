import { UILibraryLocalCallbacks } from "../../lib/ui/exports"
import { UIWindow } from "../../lib/ui/methods/local";

UILibraryLocalCallbacks.on_window(
    (w: UIWindow) => {
        document.body.appendChild(w);
    }
);
