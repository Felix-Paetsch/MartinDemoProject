export function sync_iframe_position(iframe: HTMLIFrameElement, el: HTMLDivElement) {
    const rec = el.getBoundingClientRect();

    iframe.style.position = "fixed";
    iframe.style.top = `${rec.top}px`;
    iframe.style.left = `${rec.left}px`;
    iframe.style.width = `${rec.width}px`;
    iframe.style.height = `${rec.height}px`;
    iframe.style.zIndex = el.style.zIndex;
}

export function init_iframe_sync(
    iframe: HTMLIFrameElement,
    el: HTMLDivElement
): () => void {
    const sync = () => sync_iframe_position(iframe, el);
    const resizeObserver = new ResizeObserver(sync);
    resizeObserver.observe(el);

    window.addEventListener("scroll", sync, true);
    window.addEventListener("resize", sync);

    // --- Animation frame-based sync (good for continuous position changes like CSS transitions) ---
    let running = true;
    function rafLoop() {
        if (!running) return;
        sync();
        requestAnimationFrame(rafLoop);
    }
    requestAnimationFrame(rafLoop);

    sync();

    return () => {
        running = false;
        resizeObserver.disconnect();
        window.removeEventListener("scroll", sync, true);
        window.removeEventListener("resize", sync);
    };
}
