const DARK_GRAY = 32;
const WHITE = 255;
const MIN_DELTA = 64;
const MIN_SPLIT = 8;

function setVerticalLine(buffer: ImageData, width: number, x: number,
                         yStart: number, yEnd: number) {
    const start: number = (yStart * width) + x;
    const end: number = (yEnd * width) + x;
    for (let i: number = start; i < end; i += width) {
        const index: number = i << 2;
        buffer.data[index] = WHITE;
        buffer.data[index + 1] = WHITE;
        buffer.data[index + 2] = WHITE;
    }
}

function setHorizontalLine(buffer: ImageData, width: number, xStart: number,
                           xEnd: number, y: number) {
    const yWidth: number = y * width;
    const start: number = yWidth + xStart;
    const end: number = yWidth + xEnd;
    for (let i: number = start; i < end; i++) {
        const index: number = i << 2;
        buffer.data[index] = WHITE;
        buffer.data[index + 1] = WHITE;
        buffer.data[index + 2] = WHITE;
    }
}

function setPartitions(buffer: ImageData, width: number, xLower: number,
                       xUpper: number, yLower: number, yUpper: number,
                       horizontal: boolean) {
    if (horizontal) {
        const yDelta: number = yUpper - yLower;
        if (MIN_DELTA < yDelta) {
            let y: number;
            y = Math.floor(Math.random() * yDelta) + yLower;
            while (((y - MIN_SPLIT) < yLower) || (yUpper < (y + MIN_SPLIT))) {
                y = Math.floor(Math.random() * yDelta) + yLower;
            }
            setHorizontalLine(buffer, width, xLower, xUpper, y);
            setPartitions(buffer, width, xLower, xUpper, yLower, y, false);
            setPartitions(buffer, width, xLower, xUpper, y, yUpper, false);
        }
    } else {
        const xDelta: number = xUpper - xLower;
        if (MIN_DELTA < xDelta) {
            let x: number;
            x = Math.floor(Math.random() * xDelta) + xLower;
            while (((x - MIN_SPLIT) < xLower) || (xUpper < (x + MIN_SPLIT))) {
                x = Math.floor(Math.random() * xDelta) + xLower;
            }
            setVerticalLine(buffer, width, x, yLower, yUpper);
            setPartitions(buffer, width, xLower, x, yLower, yUpper, true);
            setPartitions(buffer, width, x, xUpper, yLower, yUpper, true);
        }
    }
}

window.onload = function() {
    const canvas: HTMLCanvasElement =
        document.getElementById("canvas") as HTMLCanvasElement;
    const ctx: CanvasRenderingContext2D =
        canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    const width: number = canvas.width;
    const height: number = canvas.height;
    const buffer: ImageData = ctx.createImageData(width, height);
    console.time("for (let i: num...");
    for (let i: number = width * height; 0 <= i; i--) {
        const index: number = i << 2;
        buffer.data[index] = DARK_GRAY;
        buffer.data[index + 1] = DARK_GRAY;
        buffer.data[index + 2] = DARK_GRAY;
        buffer.data[index + 3] = 255;
    }
    console.timeEnd("for (let i: num...");
    console.time("setPartitions(...)");
    setPartitions(buffer, width, 0, width, 0, height, true);
    console.timeEnd("setPartitions(...)");
    ctx.putImageData(buffer, 0, 0);
    console.log("Done!");
};
