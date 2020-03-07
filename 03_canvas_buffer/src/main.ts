/* NOTE:
 * `https://rembound.com/articles/drawing-pixels-with-html5-canvas-and-javascript`
 */

window.onload = function() {
    const canvas: HTMLCanvasElement =
        document.getElementById("canvas") as HTMLCanvasElement;
    const ctx: CanvasRenderingContext2D =
        canvas.getContext("2d") as CanvasRenderingContext2D;
    const width: number = canvas.width;
    const height: number = canvas.height;
    const buffer: ImageData = ctx.createImageData(width, height);
    function loop(t: number) {
        const offset: number = Math.floor(t / 16);
        for (let x: number = 0; x < width; x++) {
            for (let y: number = 0; y < height; y++) {
                const index: number = ((y * width) + x) * 4;
                const red: number =
                    ((x + offset) % 256) ^ ((y + offset) % 256);
                const green: number =
                    (((2 * x) + offset) % 256) ^ (((2 * y) + offset) % 256);
                const blue: number =
                    (((4 * x) + offset) % 256) ^ (((4 * y) + offset) % 256);
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