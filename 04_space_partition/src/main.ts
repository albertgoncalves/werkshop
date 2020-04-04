const DARK_GRAY: number = 64;
const WHITE: number = 255;
const COLOR_R: number = 255;
const COLOR_G: number = 75;
const COLOR_B: number = 10;

const MIN_DELTA: number = 32;
const MIN_SPLIT: number = 4;
const N: number = 128;

interface Partition {
    xLower: number;
    xUpper: number;
    yLower: number;
    yUpper: number;
    horizontal: boolean;
}

interface Edge {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

function setVerticalLine(buffer: ImageData, width: number, x: number,
                         yStart: number, yEnd: number) {
    {
        const index: number = (((yStart + 1) * width) + x) << 2;
        buffer.data[index] = COLOR_R;
        buffer.data[index + 1] = COLOR_G;
        buffer.data[index + 2] = COLOR_B;
    }
    {
        const index: number = (((yEnd - 1) * width) + x) << 2;
        buffer.data[index] = COLOR_R;
        buffer.data[index + 1] = COLOR_G;
        buffer.data[index + 2] = COLOR_B;
    }
    const start: number = ((yStart + 2) * width) + x;
    const end: number = ((yEnd - 1) * width) + x;
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
    const start: number = (yWidth + xStart) + 1;
    const end: number = (yWidth + xEnd) - 1;
    {
        const index: number = start << 2;
        buffer.data[index] = COLOR_R;
        buffer.data[index + 1] = COLOR_G;
        buffer.data[index + 2] = COLOR_B;
    }
    {
        const index: number = end << 2;
        buffer.data[index] = COLOR_R;
        buffer.data[index + 1] = COLOR_G;
        buffer.data[index + 2] = COLOR_B;
    }
    for (let i: number = start + 1; i < end; i++) {
        const index: number = i << 2;
        buffer.data[index] = WHITE;
        buffer.data[index + 1] = WHITE;
        buffer.data[index + 2] = WHITE;
    }
}

function getPartitions(stack: Partition[]): Edge[] {
    const edges: Edge[] = [];
    let partition: Partition|undefined = stack.pop();
    while (partition) {
        if (partition.horizontal) {
            const yDelta: number = partition.yUpper - partition.yLower;
            for (let i: number = N; 0 < i; i--) {
                const y =
                    Math.floor(Math.random() * yDelta) + partition.yLower;
                if (!(((y - MIN_SPLIT) < partition.yLower) ||
                      (partition.yUpper < (y + MIN_SPLIT)))) {
                    edges.push({
                        x1: partition.xLower,
                        y1: y,
                        x2: partition.xUpper,
                        y2: y,
                    });
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
                    break;
                }
            }
        } else {
            const xDelta: number = partition.xUpper - partition.xLower;
            for (let i: number = N; 0 < i; i--) {
                const x =
                    Math.floor(Math.random() * xDelta) + partition.xLower;
                if (!(((x - MIN_SPLIT) < partition.xLower) ||
                      (partition.xUpper < (x + MIN_SPLIT)))) {
                    edges.push({
                        x1: x,
                        y1: partition.yLower,
                        x2: x,
                        y2: partition.yUpper,
                    });
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
                    break;
                }
            }
        }
        partition = stack.pop();
    }
    return edges;
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
    for (let i: number = (width * height) - 1; 0 <= i; i--) {
        const index: number = i << 2;
        buffer.data[index] = DARK_GRAY;
        buffer.data[index + 1] = DARK_GRAY;
        buffer.data[index + 2] = DARK_GRAY;
        buffer.data[index + 3] = 255;
    }
    console.timeEnd("for (let i: num...");
    console.time("setPartitions(...)");
    const edges: Edge[] = getPartitions([{
        xLower: -1,
        xUpper: width,
        yLower: -1,
        yUpper: height,
        horizontal: true,
    }]);
    for (let i: number = edges.length - 1; 0 <= i; i--) {
        const edge: Edge = edges[i];
        if (edge.x1 === edge.x2) {
            setVerticalLine(buffer, width, edge.x1, edge.y1, edge.y2);
        } else if (edge.y1 === edge.y2) {
            setHorizontalLine(buffer, width, edge.x1, edge.x2, edge.y1);
        }
    }
    console.timeEnd("setPartitions(...)");
    ctx.putImageData(buffer, 0, 0);
    console.log("Done!");
};
