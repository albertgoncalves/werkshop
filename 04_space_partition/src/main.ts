const DEBUG: boolean = true;

const DARK_GRAY: number = 64;
const GRAY: number = 128;
const WHITE: number = 255;
const COLOR_R: number = 75;
const COLOR_G: number = 155;
const COLOR_B: number = 250;

const MIN_DELTA: number = 1 << 5;
const MIN_SPLIT: number = (1 << 3) + 1;
const PAD: number = MIN_SPLIT >> 1;
const PAD_HALF: number = PAD >> 1;
const PAD_DOUBLE: number = PAD << 1;
const N: number = 100;

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
    const start: number = ((yStart + 1) * width) + x;
    const end: number = (yEnd * width) + x;
    for (let i: number = start; i < end; i += width) {
        const index: number = i << 2;
        buffer.data[index] = WHITE;
        buffer.data[index + 1] = WHITE;
        buffer.data[index + 2] = WHITE;
    }
    {
        const index: number = ((yStart * width) + x) << 2;
        if (DEBUG) {
            buffer.data[index] = COLOR_R;
            buffer.data[index + 1] = COLOR_G;
            buffer.data[index + 2] = COLOR_B;
        } else {
            buffer.data[index] = WHITE;
            buffer.data[index + 1] = WHITE;
            buffer.data[index + 2] = WHITE;
        }
    }
    {
        const index: number = end << 2;
        if (DEBUG) {
            buffer.data[index] = COLOR_R;
            buffer.data[index + 1] = COLOR_G;
            buffer.data[index + 2] = COLOR_B;
        } else {
            buffer.data[index] = WHITE;
            buffer.data[index + 1] = WHITE;
            buffer.data[index + 2] = WHITE;
        }
    }
}

function setHorizontalLine(buffer: ImageData, width: number, xStart: number,
                           xEnd: number, y: number) {
    const yWidth: number = y * width;
    const start: number = yWidth + xStart;
    const end: number = yWidth + xEnd;
    for (let i: number = start + 1; i < end; i++) {
        const index: number = i << 2;
        buffer.data[index] = WHITE;
        buffer.data[index + 1] = WHITE;
        buffer.data[index + 2] = WHITE;
    }
    {
        const index: number = start << 2;
        if (DEBUG) {
            buffer.data[index] = COLOR_R;
            buffer.data[index + 1] = COLOR_G;
            buffer.data[index + 2] = COLOR_B;
        } else {
            buffer.data[index] = WHITE;
            buffer.data[index + 1] = WHITE;
            buffer.data[index + 2] = WHITE;
        }
    }
    {
        const index: number = end << 2;
        if (DEBUG) {
            buffer.data[index] = COLOR_R;
            buffer.data[index + 1] = COLOR_G;
            buffer.data[index + 2] = COLOR_B;
        } else {
            buffer.data[index] = WHITE;
            buffer.data[index + 1] = WHITE;
            buffer.data[index + 2] = WHITE;
        }
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

function getSplitEdges(preEdges: Edge[]): Edge[] {
    const edges: Edge[] = [];
    for (let i: number = preEdges.length - 1; 0 <= i; i--) {
        const edge: Edge = preEdges[i];
        if (edge.x1 === edge.x2) {
            const x: number = edge.x1;
            const neighbors: number[] = [edge.y1, edge.y2];
            for (let j: number = preEdges.length - 1; 0 <= j; j--) {
                if (i === j) {
                    continue;
                }
                const candidate: Edge = preEdges[j];
                /* NOTE: `y1` *should* always be lower than `y2`! */
                if ((candidate.y1 === candidate.y2) &&
                    ((edge.y1 < candidate.y1) && (candidate.y1 < edge.y2)) &&
                    ((candidate.x1 === x) || (candidate.x2 === x))) {
                    neighbors.push(candidate.y1);
                }
            }
            neighbors.sort(function(a, b) {
                return a - b;
            });
            for (let k: number = neighbors.length - 1; 0 < k; k--) {
                const y1: number = neighbors[k - 1];
                const y2: number = neighbors[k];
                const yDelta = y2 - y1;
                if (yDelta !== 0) {
                    if (yDelta <= MIN_SPLIT) {
                        edges.push({
                            x1: x,
                            y1,
                            x2: x,
                            y2,
                        });
                    } else {
                        const ySplit: number =
                            Math.floor(Math.random() * (yDelta - PAD_DOUBLE)) +
                            y1 + PAD;
                        edges.push({
                            x1: x,
                            y1,
                            x2: x,
                            y2: ySplit - PAD,
                        });
                        edges.push({
                            x1: x,
                            y1: ySplit + PAD,
                            x2: x,
                            y2,
                        });
                    }
                }
            }
        } else if (edge.y1 === edge.y2) {
            const y: number = edge.y1;
            const neighbors: number[] = [edge.x1, edge.x2];
            for (let j: number = preEdges.length - 1; 0 <= j; j--) {
                if (i === j) {
                    continue;
                }
                const candidate: Edge = preEdges[j];
                /* NOTE: `x1` *should* always be lower than `x2`! */
                if ((candidate.x1 === candidate.x2) &&
                    ((edge.x1 < candidate.x1) && (candidate.x1 < edge.x2)) &&
                    ((candidate.y1 === y) || (candidate.y2 === y))) {
                    neighbors.push(candidate.x1);
                }
            }
            neighbors.sort(function(a, b) {
                return a - b;
            });
            for (let k: number = neighbors.length - 1; 0 < k; k--) {
                const x1: number = neighbors[k - 1];
                const x2: number = neighbors[k];
                const xDelta = x2 - x1;
                if (xDelta !== 0) {
                    if (xDelta <= MIN_SPLIT) {
                        edges.push({
                            x1,
                            y1: y,
                            x2,
                            y2: y,
                        });
                    } else {
                        const xSplit: number =
                            Math.floor(Math.random() * (xDelta - PAD_DOUBLE)) +
                            x1 + PAD;
                        edges.push({
                            x1,
                            y1: y,
                            x2: xSplit - PAD,
                            y2: y,
                        });
                        edges.push({
                            x1: xSplit + PAD,
                            y1: y,
                            x2,
                            y2: y,
                        });
                    }
                }
            }
        }
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
    {
        console.time("for (let i: num...");
        for (let i: number = (width * height) - 1; 0 <= i; i--) {
            const index: number = i << 2;
            buffer.data[index] = DARK_GRAY;
            buffer.data[index + 1] = DARK_GRAY;
            buffer.data[index + 2] = DARK_GRAY;
            buffer.data[index + 3] = 255;
        }
        console.timeEnd("for (let i: num...");
    }
    {
        console.time("getSplitEdges(...)");
        const edges: Edge[] = getSplitEdges(getPartitions([{
            xLower: 0,
            xUpper: width - 1,
            yLower: 0,
            yUpper: height - 1,
            horizontal: false,
        }]));
        console.timeEnd("getSplitEdges(...)");
        console.time("for (let i: num...");
        for (let i: number = edges.length - 1; 0 <= i; i--) {
            const edge: Edge = edges[i];
            if (edge.x1 === edge.x2) {
                setVerticalLine(buffer, width, edge.x1, edge.y1, edge.y2);
            } else if (edge.y1 === edge.y2) {
                setHorizontalLine(buffer, width, edge.x1, edge.x2, edge.y1);
            }
        }
        console.timeEnd("for (let i: num...");
    }
    {
        console.time("ctx.putImageDat...");
        ctx.putImageData(buffer, 0, 0);
        console.timeEnd("ctx.putImageDat...");
    }
    console.log("Done!");
};
