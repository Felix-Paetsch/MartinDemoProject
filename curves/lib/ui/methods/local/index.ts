import { LocalCallbackMap } from "../../root/index";
import { uuidv4 } from "pc-messaging-kernel/utils";

export type UIWindow = HTMLDivElement;
export async function create_window() {
    const newDiv = document.createElement('div');
    newDiv.id = 'plugin_div_' + uuidv4();

    newDiv.textContent = 'Hello, this is my new div!';
    newDiv.style.padding = '10px';
    newDiv.style.backgroundColor = '#f0f0f0';

    await LocalCallbackMap.on_window(newDiv);
    return newDiv.id;
}
