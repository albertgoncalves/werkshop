/* NOTE:
 * `https://rembound.com/articles/drawing-pixels-with-html5-canvas-and-javascript`
 */

window.onload = function() {
    const canvas: HTMLCanvasElement =
        document.getElementById("canvas") as HTMLCanvasElement;
    const ctx: CanvasRenderingContext2D =
        canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    const width: number = canvas.width;
    const height: number = canvas.height;
    const buffer: ImageData = ctx.createImageData(width, height);
    function loop(t: number) {
        const offset: number = Math.floor(t >>> 4);
        for (let y: number = 0; y < height; y++) {
            const yT0: number = (y + offset) & 255;
            const yT1: number = (((y << 1) + offset) & 255);
            const yT2: number = (((y << 2) + offset) & 255);
            const yOffset: number = y * width;
            for (let x: number = 0; x < width; x++) {
                const red: number = ((x + offset) & 255) ^ yT0;
                const green: number = (((x << 1) + offset) & 255) ^ yT1;
                const blue: number = (((x << 2) + offset) & 255) ^ yT2;
                const index: number = (yOffset + x) << 2;
                buffer.data[index] = red;
                buffer.data[index + 1] = green;
                buffer.data[index + 2] = blue;
                buffer.data[index + 3] = 255;
            }
        }
        ctx.putImageData(buffer, 0, 0);
        window.requestAnimationFrame(loop);
    }
    loop(0);
};
