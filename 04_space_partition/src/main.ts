const DEBUG: boolean = true;
const ITERATION_LIMIT: number = 100;
const MIN_DELTA: number = 1 << 5;
const MIN_SPLIT: number = (1 << 3) + 1;
const PAD: number = MIN_SPLIT >> 1;
const PAD_DOUBLE: number = PAD << 1;

interface Global {
    width: number;
    height: number;
}

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

interface Point {
    x: number;
    y: number;
    horizontal: boolean;
}

interface Tuple {
    edges: Edge[];
    points: Point[];
}

interface Color {
    red: number;
    green: number;
    blue: number;
    alpha: number;
}

const GLOBAL: Global = {
    width: 0,
    height: 0,
};
const DARK_GRAY: Color = {
    red: 64,
    green: 64,
    blue: 64,
    alpha: 255,
};
const WHITE: Color = {
    red: 255,
    green: 255,
    blue: 255,
    alpha: 255,
};
const BLUE: Color = {
    red: 75,
    green: 155,
    blue: 250,
    alpha: 255,
};
const ORANGE: Color = {
    red: 250,
    green: 155,
    blue: 75,
    alpha: 255,
};
const MAROON: Color = {
    red: 110,
    green: 66,
    blue: 86,
    alpha: 255,
};
const PALE_BLUE: Color = {
    red: 66,
    green: 86,
    blue: 110,
    alpha: 255,
};

function setColor(buffer: ImageData, index: number, color: Color) {
    buffer.data[index] = color.red;
    buffer.data[index + 1] = color.green;
    buffer.data[index + 2] = color.blue;
    buffer.data[index + 3] = color.alpha;
}

function setVerticalLine(buffer: ImageData,
                         x: number,
                         yStart: number,
                         yEnd: number) {
    const start: number = ((yStart * GLOBAL.width) + x) << 2;
    const end: number = ((yEnd * GLOBAL.width) + x) << 2;
    const widthColor: number = GLOBAL.width << 2;
    for (let i: number = start + widthColor; i < end; i += widthColor) {
        setColor(buffer, i, WHITE);
    }
    if (DEBUG) {
        setColor(buffer, start, BLUE);
    } else {
        setColor(buffer, start, WHITE);
    }
    if (DEBUG) {
        setColor(buffer, end, BLUE);
    } else {
        setColor(buffer, end, WHITE);
    }
}

function setHorizontalLine(buffer: ImageData,
                           xStart: number,
                           xEnd: number,
                           y: number) {
    const yWidth: number = y * GLOBAL.width;
    const start: number = (yWidth + xStart) << 2;
    const end: number = (yWidth + xEnd) << 2;
    for (let i: number = start + 4; i < end; i += 4) {
        setColor(buffer, i, WHITE);
    }
    if (DEBUG) {
        setColor(buffer, start, BLUE);
    } else {
        setColor(buffer, start, WHITE);
    }
    if (DEBUG) {
        setColor(buffer, end, BLUE);
    } else {
        setColor(buffer, end, WHITE);
    }
}

function getPartitions(stack: Partition[]): Edge[] {
    const edges: Edge[] = [];
    let partition: Partition|undefined = stack.pop();
    while (partition) {
        if (partition.horizontal) {
            const yDelta: number = partition.yUpper - partition.yLower;
            for (let i: number = ITERATION_LIMIT; 0 < i; --i) {
                const y: number =
                    Math.floor(Math.random() * yDelta) + partition.yLower;
                if (!(((y - MIN_SPLIT) < partition.yLower) ||
                      (partition.yUpper < (y + MIN_SPLIT))))
                {
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
            for (let i: number = ITERATION_LIMIT; 0 < i; --i) {
                const x: number =
                    Math.floor(Math.random() * xDelta) + partition.xLower;
                if (!(((x - MIN_SPLIT) < partition.xLower) ||
                      (partition.xUpper < (x + MIN_SPLIT))))
                {
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

function getSplitEdges(preEdges: Edge[]): Tuple {
    const edges: Edge[] = [];
    const points: Point[] = [];
    for (let i: number = preEdges.length - 1; 0 <= i; --i) {
        const edge: Edge = preEdges[i];
        if (edge.x1 === edge.x2) {
            const x: number = edge.x1;
            const neighbors: number[] = [edge.y1, edge.y2];
            for (let j: number = preEdges.length - 1; 0 <= j; --j) {
                if (i === j) {
                    continue;
                }
                const candidate: Edge = preEdges[j];
                if ((candidate.y1 === candidate.y2) &&
                    /* NOTE: `edge.y1` *should* always be lower than `edge.y2`!
                     */
                    ((edge.y1 < candidate.y1) && (candidate.y1 < edge.y2)) &&
                    ((candidate.x1 === x) || (candidate.x2 === x)))
                {
                    neighbors.push(candidate.y1);
                }
            }
            neighbors.sort(function(a, b) {
                return a - b;
            });
            for (let k: number = neighbors.length - 1; 0 < k; --k) {
                const y1: number = neighbors[k - 1];
                const y2: number = neighbors[k];
                const yDelta: number = y2 - y1;
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
                        points.push({
                            x,
                            y: ySplit,
                            horizontal: true,
                        });
                    }
                }
            }
        } else if (edge.y1 === edge.y2) {
            const y: number = edge.y1;
            const neighbors: number[] = [edge.x1, edge.x2];
            for (let j: number = preEdges.length - 1; 0 <= j; --j) {
                if (i === j) {
                    continue;
                }
                const candidate: Edge = preEdges[j];
                if ((candidate.x1 === candidate.x2) &&
                    /* NOTE: `edge.x1` *should* always be lower than `edge.x2`!
                     */
                    ((edge.x1 < candidate.x1) && (candidate.x1 < edge.x2)) &&
                    ((candidate.y1 === y) || (candidate.y2 === y)))
                {
                    neighbors.push(candidate.x1);
                }
            }
            neighbors.sort(function(a, b) {
                return a - b;
            });
            for (let k: number = neighbors.length - 1; 0 < k; --k) {
                const x1: number = neighbors[k - 1];
                const x2: number = neighbors[k];
                const xDelta: number = x2 - x1;
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
                        points.push({
                            x: xSplit,
                            y,
                            horizontal: false,
                        });
                    }
                }
            }
        }
    }
    return {
        edges,
        points,
    };
}

function setEdges(buffer: ImageData, edges: Edge[]) {
    for (let i: number = edges.length - 1; 0 <= i; --i) {
        const edge: Edge = edges[i];
        if (edge.x1 === edge.x2) {
            setVerticalLine(buffer, edge.x1, edge.y1, edge.y2);
        } else if (edge.y1 === edge.y2) {
            setHorizontalLine(buffer, edge.x1, edge.x2, edge.y1);
        }
    }
}

function getBufferColor(buffer: ImageData, index: number): Color {
    return {
        red: buffer.data[index],
        green: buffer.data[index + 1],
        blue: buffer.data[index + 2],
        alpha: buffer.data[index + 3],
    };
}

function compareColors(a: Color, b: Color): boolean {
    return (a.red === b.red) && (a.green === b.green) && (a.blue === b.blue) &&
        (a.alpha === b.alpha);
}

function getBlocked(buffer: ImageData, a: number, b: number): boolean {
    return (!compareColors(getBufferColor(buffer, a), DARK_GRAY)) ||
        compareColors(getBufferColor(buffer, b), WHITE) ||
        compareColors(getBufferColor(buffer, b), BLUE);
}

function setPointToLine(buffer: ImageData, point: Point) {
    if (point.horizontal) {
        const offset: number = point.y * GLOBAL.width;
        for (let x: number = point.x - 1; 0 <= x; --x) {
            const index: number = (x + offset) << 2;
            const xPad: number = x - PAD;
            if ((xPad < 0) ||
                (getBlocked(buffer, index, (xPad + offset) << 2))) {
                break;
            }
            setColor(buffer, index, MAROON);
        }
        for (let x: number = point.x + 1; x < GLOBAL.width; ++x) {
            const index: number = (x + offset) << 2;
            const xPad: number = x + PAD;
            if ((GLOBAL.width <= xPad) ||
                (getBlocked(buffer, index, (xPad + offset) << 2)))
            {
                break;
            }
            setColor(buffer, index, MAROON);
        }
    } else {
        for (let y: number = point.y - 1; 0 <= y; --y) {
            const index: number = (point.x + (y * GLOBAL.width)) << 2;
            const yPad: number = y - PAD;
            if (yPad < 0) {
                break;
            }
            const padIndex: number = (point.x + (yPad * GLOBAL.width)) << 2;
            if (getBlocked(buffer, index, padIndex)) {
                break;
            }
            setColor(buffer, index, PALE_BLUE);
        }
        for (let y: number = point.y + 1; y < GLOBAL.height; ++y) {
            const index: number = (point.x + (y * GLOBAL.width)) << 2;
            const yPad: number = y + PAD;
            if (GLOBAL.height <= yPad) {
                break;
            }
            const padIndex: number = (point.x + (yPad * GLOBAL.width)) << 2;
            if (getBlocked(buffer, index, padIndex)) {
                break;
            }
            setColor(buffer, index, PALE_BLUE);
        }
    }
}

function setPoints(buffer: ImageData, points: Point[]) {
    for (let i: number = points.length - 1; 0 <= i; --i) {
        const point: Point = points[i];
        const index: number = (point.x + (point.y * GLOBAL.width)) << 2;
        setColor(buffer, index, ORANGE);
        setPointToLine(buffer, point);
    }
}

window.onload = function() {
    const canvas: HTMLCanvasElement =
        document.getElementById("canvas") as HTMLCanvasElement;
    GLOBAL.width = canvas.width;
    GLOBAL.height = canvas.height;
    const ctx: CanvasRenderingContext2D =
        canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    const buffer: ImageData = ctx.createImageData(GLOBAL.width, GLOBAL.height);
    const n: number = (GLOBAL.width * GLOBAL.height) << 2;
    {
        console.time("setColor(buffer, ..., DARK_GRAY)  ");
        for (let i: number = 0; i < n; i += 4) {
            setColor(buffer, i, DARK_GRAY);
        }
        console.timeEnd("setColor(buffer, ..., DARK_GRAY)  ");
    }
    console.time("getSplitEdges(getPartitions(...)) ");
    const tuple: Tuple = getSplitEdges(getPartitions([{
        xLower: 0,
        xUpper: GLOBAL.width - 1,
        yLower: 0,
        yUpper: GLOBAL.height - 1,
        horizontal: false,
    }]));
    console.timeEnd("getSplitEdges(getPartitions(...)) ");
    {
        console.time("setEdges(buffer, tuple.edges)     ");
        setEdges(buffer, tuple.edges);
        console.timeEnd("setEdges(buffer, tuple.edges)     ");
    }
    {
        console.time("setPoints(buffer, tuple.points)   ");
        setPoints(buffer, tuple.points);
        console.timeEnd("setPoints(buffer, tuple.points)   ");
    }
    {
        console.time("ctx.putImageData(buffer, 0, 0)    ");
        ctx.putImageData(buffer, 0, 0);
        console.timeEnd("ctx.putImageData(buffer, 0, 0)    ");
    }
    console.log("Done!");
};
