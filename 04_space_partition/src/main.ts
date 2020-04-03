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

interface Partition {
    xLower: number;
    xUpper: number;
    yLower: number;
    yUpper: number;
    horizontal: boolean;
}

function setPartitions(buffer: ImageData, width: number,
                       _partition: Partition) {
    const stack: Partition[] = [_partition];
    let partition: Partition|undefined = stack.pop();
    while (partition) {
        if (partition.horizontal) {
            const yDelta: number = partition.yUpper - partition.yLower;
            let y: number;
            y = Math.floor(Math.random() * yDelta) + partition.yLower;
            while (((y - MIN_SPLIT) < partition.yLower) ||
                   (partition.yUpper < (y + MIN_SPLIT))) {
                y = Math.floor(Math.random() * yDelta) + partition.yLower;
            }
            setHorizontalLine(buffer, width, partition.xLower,
                              partition.xUpper, y);
            if (MIN_DELTA < (partition.xUpper - partition.xLower)) {
                stack.push({
                    xLower: partition.xLower,
                    xUpper: partition.xUpper,
                    yLower: partition.yLower,
                    yUpper: y,
                    horizontal: false,
                });
                stack.push({
                    xLower: partition.xLower,
                    xUpper: partition.xUpper,
                    yLower: y,
                    yUpper: partition.yUpper,
                    horizontal: false,
                });
            }
        } else {
            const xDelta: number = partition.xUpper - partition.xLower;
            let x: number;
            x = Math.floor(Math.random() * xDelta) + partition.xLower;
            while (((x - MIN_SPLIT) < partition.xLower) ||
                   (partition.xUpper < (x + MIN_SPLIT))) {
                x = Math.floor(Math.random() * xDelta) + partition.xLower;
            }
            setVerticalLine(buffer, width, x, partition.yLower,
                            partition.yUpper);
            if (MIN_DELTA < (partition.yUpper - partition.yLower)) {
                stack.push({
                    xLower: partition.xLower,
                    xUpper: x,
                    yLower: partition.yLower,
                    yUpper: partition.yUpper,
                    horizontal: true,
                });
                stack.push({
                    xLower: x,
                    xUpper: partition.xUpper,
                    yLower: partition.yLower,
                    yUpper: partition.yUpper,
                    horizontal: true,
                });
            }
        }
        partition = stack.pop();
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
    setPartitions(buffer, width, {
        xLower: 0,
        xUpper: width,
        yLower: 0,
        yUpper: height,
        horizontal: true,
    });
    console.timeEnd("setPartitions(...)");
    ctx.putImageData(buffer, 0, 0);
    console.log("Done!");
};
