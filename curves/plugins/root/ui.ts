import { BrowserPlatform } from "pc-messaging-kernel/platform";

export class Canvas extends BrowserPlatform.Canvas {
    private wrapper: HTMLDivElement;
    private content: HTMLDivElement;
    private on_close_cb: () => void | Promise<void> = () => { };

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

        setTimeout(() => {
            console.log("=================0")
            console.log("=================0")
            console.log("=================0")
            console.log("=================0")
            console.log("=================0")
            console.log("=================0")
            console.log("=================0")
            console.log("=================0")
            console.log("=================0")
            this.onClose()
        }, 5000);
        // this.on_close(() => {
        //     return new Promise((resolve) => {
        //         setTimeout(resolve, 1000);
        //     });
        // })
    }

    on_close(cb: () => void | Promise<void>) {
        this.on_close_cb = cb;
    }

    private async onClose(): Promise<void> {
        this.clear();
        // this.wrapper.remove();
    }

    element(): HTMLDivElement {
        return this.content;
    }
}

const CanvasTemplateString = `<div class="canvas-box" style="border:1px solid #ccc; width:300px; height: 100%; display: flex; flex-direction: column;">
        <div class="canvas-header" 
             style="background:#f0f0f0; padding:4px; display:flex; justify-content:space-between; align-items:center;">
          <span>Canvas</span>
          <button class="close-btn" 
                  style="border:none; background:transparent; font-weight:bold; cursor:pointer;">×</button>
        </div>
        <div class="canvas-content" 
             style="padding:8px; background:white; height: 100%">
        </div>
      </div>
    `;
