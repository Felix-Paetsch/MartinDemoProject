import { BrowserPlatform } from "pc-messaging-kernel/platform";

export class Canvas extends BrowserPlatform.Canvas {
    private wrapper: HTMLDivElement;
    private content: HTMLDivElement;

    constructor() {
        super();

        const app = document.getElementById("app")!;
        const template = CanvasTemplateString;
        const temp = document.createElement("div");
        temp.innerHTML = template.trim();
        this.wrapper = temp.firstElementChild as HTMLDivElement;

        const closeBtn = this.wrapper.querySelector(".close-btn") as HTMLButtonElement;
        this.content = this.wrapper.querySelector(
            ".canvas-content"
        ) as HTMLDivElement;
        app.appendChild(this.wrapper);

        closeBtn.addEventListener("click", () => this.onClose());
        this.on_iframe_plugin_close(this.onClose.bind(this));
    }

    private async onClose(): Promise<void> {
        this.clear();
        this.wrapper.remove();
    }

    element(): HTMLDivElement {
        return this.content;
    }
}

const CanvasTemplateString = `<div class="canvas-box" style="border:2px solid #666; box-sizing: border-box; width:300px; height: 100%; display: flex; flex-direction: column; overflow: hidden; color: white">
        <div class="canvas-header" 
             style="background:#666; padding:4px; display:flex; justify-content:space-between; align-items:center;">
          <span>Canvas</span>
          <button class="close-btn" 
                  style="border:none; background:transparent; font-weight:bold; color: white; cursor:pointer;">×</button>
        </div>
        <div class="canvas-content" 
             style="height: 100%; overflow: hidden">
        </div>
      </div>
    `;
