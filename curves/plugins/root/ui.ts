import { BrowserPlatform } from "pc-messaging-kernel/kernel";

export class Canvas extends BrowserPlatform.Canvas {
    private el: HTMLDivElement;
    constructor() {
        super();

        const app = document.getElementById("app")!;
        this.el = document.createElement("div");
        app.appendChild(this.el);
    }
    element(): HTMLDivElement {
        return this.el;
    }
}
