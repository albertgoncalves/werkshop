const DEBUG: boolean = false;

const CANVAS_SCALE: number = 4;

const DARK_GRAY: number = 112;
const LIGHT_GRAY: number = 224;
const WHITE: number = 255;

const OPAQUE: number = 255;
const TRANSPARENT: number = 0;

const RADIUS: number = 47;
const RADIUS_SQUARED: number = RADIUS * RADIUS;

const APERTURE: number = 0.375;

interface Position_ {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Octal {
    xMult: number;
    yMult: number;
    start: number;
    slopeStart: number;
    slopeEnd: number;
}

function setVerticalLine(buffer: Uint8ClampedArray, width: number, x: number,
                         yStart: number, yEnd: number) {
    const start: number = (yStart * width) + x;
    const end: number = (yEnd * width) + x;
    for (let i: number = start; i <= end; i += width) {
        buffer[i] = DARK_GRAY;
    }
}

function setHorizontalLine(buffer: Uint8ClampedArray, width: number,
                           xStart: number, xEnd: number, y: number) {
    const yWidth: number = y * width;
    const start: number = yWidth + xStart;
    const end: number = yWidth + xEnd;
    for (let i: number = start; i <= end; i++) {
        buffer[i] = DARK_GRAY;
    }
}

function setImage(ctx: CanvasRenderingContext2D, image: ImageData,
                  buffer: Uint8ClampedArray, mask: Uint8ClampedArray) {
    for (let i: number = buffer.length - 1; 0 <= i; i--) {
        const color: number = buffer[i];
        const index: number = i << 2;
        image.data[index] = color;
        image.data[index + 1] = color;
        image.data[index + 2] = color;
        image.data[index + 3] = mask[i];
    }
    ctx.putImageData(image, 0, 0);
}

function getBlocked(buffer: Uint8ClampedArray, position: Position_, x: number,
                    y: number) {
    return ((x < 0) || (y < 0) || (position.width <= x) ||
            (position.height <= y) ||
            (buffer[(position.width * y) + x] !== WHITE));
}

function setMaskColRow(mask: Uint8ClampedArray, buffer: Uint8ClampedArray,
                       position: Position_, octal: Octal) {
    if (octal.slopeStart < octal.slopeEnd) {
        return;
    }
    let nextStart: number = octal.slopeStart;
    const yEnd: number = -RADIUS - 1;
    for (let dY: number = -octal.start; yEnd < dY; dY--) {
        let blocked: boolean = false;
        const y: number = position.y + (dY * octal.yMult);
        const yDelta: number = y - position.y;
        const yDeltaSquared: number = yDelta * yDelta;
        const yWidth: number = y * position.width;
        for (let dX: number = dY - 1; dX < 1; dX++) {
            const rSlope: number = (dX + APERTURE) / (dY - APERTURE);
            if (octal.slopeStart < rSlope) {
                continue;
            }
            const lSlope: number = (dX - APERTURE) / (dY + APERTURE);
            if (lSlope < octal.slopeEnd) {
                break;
            }
            const x: number = position.x + (dX * octal.xMult);
            const xDelta: number = x - position.x;
            if ((((xDelta * xDelta) + yDeltaSquared) < RADIUS_SQUARED) &&
                (0 <= x) && (x < position.width) && (0 <= y) &&
                (y < position.height)) {
                mask[yWidth + x] = OPAQUE;
            }
            if (blocked) {
                if (getBlocked(buffer, position, x, y)) {
                    nextStart = rSlope;
                    continue;
                } else {
                    blocked = false;
                    octal.slopeStart = nextStart;
                }
            } else {
                const yCurrent: number = -dY;
                if ((getBlocked(buffer, position, x, y)) &&
                    (yCurrent < RADIUS)) {
                    blocked = true;
                    setMaskColRow(mask, buffer, position, {
                        xMult: octal.xMult,
                        yMult: octal.yMult,
                        start: yCurrent + 1,
                        slopeStart: nextStart,
                        slopeEnd: lSlope,
                    });
                    nextStart = rSlope;
                }
            }
        }
        if (blocked) {
            break;
        }
    }
}

function setMaskRowCol(mask: Uint8ClampedArray, buffer: Uint8ClampedArray,
                       position: Position_, octal: Octal) {
    if (octal.slopeStart < octal.slopeEnd) {
        return;
    }
    let nextStart: number = octal.slopeStart;
    const xEnd: number = -RADIUS - 1;
    for (let dX: number = -octal.start; xEnd < dX; dX--) {
        let blocked: boolean = false;
        const x: number = position.x + (dX * octal.xMult);
        const xDelta: number = x - position.x;
        const xDeltaSquared: number = xDelta * xDelta;
        for (let dY: number = dX - 1; dY < 1; dY++) {
            const rSlope: number = (dY + APERTURE) / (dX - APERTURE);
            if (octal.slopeStart < rSlope) {
                continue;
            }
            const lSlope: number = (dY - APERTURE) / (dX + APERTURE);
            if (lSlope < octal.slopeEnd) {
                break;
            }
            const y: number = position.y + (dY * octal.yMult);
            const yDelta: number = y - position.y;
            const yWidth: number = y * position.width;
            if (((xDeltaSquared + (yDelta * yDelta)) < RADIUS_SQUARED) &&
                (0 <= x) && (x < position.width) && (0 <= y) &&
                (y < position.height)) {
                mask[yWidth + x] = OPAQUE;
            }
            if (blocked) {
                if (getBlocked(buffer, position, x, y)) {
                    nextStart = rSlope;
                    continue;
                } else {
                    blocked = false;
                    octal.slopeStart = nextStart;
                }
            } else {
                const xCurrent: number = -dX;
                if ((getBlocked(buffer, position, x, y)) &&
                    (xCurrent < RADIUS)) {
                    blocked = true;
                    setMaskRowCol(mask, buffer, position, {
                        xMult: octal.xMult,
                        yMult: octal.yMult,
                        start: xCurrent + 1,
                        slopeStart: octal.slopeStart,
                        slopeEnd: lSlope,
                    });
                    nextStart = rSlope;
                }
            }
        }
        if (blocked) {
            break;
        }
    }
}

function setMask(mask: Uint8ClampedArray, buffer: Uint8ClampedArray,
                 position: Position_) {
    mask.fill(TRANSPARENT);
    mask[(position.y * position.width) + position.x] = OPAQUE;
    setMaskColRow(mask, buffer, position, {
        xMult: 1,
        yMult: 1,
        start: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskColRow(mask, buffer, position, {
        xMult: 1,
        yMult: -1,
        start: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskColRow(mask, buffer, position, {
        xMult: -1,
        yMult: 1,
        start: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskColRow(mask, buffer, position, {
        xMult: -1,
        yMult: -1,
        start: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskRowCol(mask, buffer, position, {
        xMult: 1,
        yMult: 1,
        start: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskRowCol(mask, buffer, position, {
        xMult: 1,
        yMult: -1,
        start: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskRowCol(mask, buffer, position, {
        xMult: -1,
        yMult: 1,
        start: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskRowCol(mask, buffer, position, {
        xMult: -1,
        yMult: -1,
        start: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
}

function doMove(ctx: CanvasRenderingContext2D, image: ImageData,
                mask: Uint8ClampedArray, buffer: Uint8ClampedArray,
                position: Position_, x: number, y: number) {
    const index: number = (y * position.width) + x;
    if (buffer[index] === WHITE) {
        buffer[(position.y * position.width) + position.x] = WHITE;
        buffer[index] = LIGHT_GRAY;
        position.x = x;
        position.y = y;
        if (DEBUG) {
            console.time("setMask(mask, buffer, position)");
            setMask(mask, buffer, position);
            console.timeEnd("setMask(mask, buffer, position)");
        } else {
            setMask(mask, buffer, position);
        }
        setImage(ctx, image, buffer, mask);
    }
}

window.onload = function() {
    const canvas: HTMLCanvasElement =
        document.getElementById("canvas") as HTMLCanvasElement;
    const ctx: CanvasRenderingContext2D =
        canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    const position: Position_ = {
        x: 15,
        y: 15,
        width: canvas.width,
        height: canvas.height,
    };
    const n: number = position.width * position.height;
    const image: ImageData =
        ctx.createImageData(position.width, position.height);
    const buffer: Uint8ClampedArray = new Uint8ClampedArray(n);
    const mask: Uint8ClampedArray = new Uint8ClampedArray(n);
    buffer.fill(WHITE);
    {
        setVerticalLine(buffer, position.width, 6, 10, 20);
        setVerticalLine(buffer, position.width, 25, 10, 20);
        setVerticalLine(buffer, position.width, 18, 8, 21);
        setHorizontalLine(buffer, position.width, 7, 24, 5);
        setHorizontalLine(buffer, position.width, 7, 24, 26);
        setHorizontalLine(buffer, position.width, 10, 20, 17);
        buffer[(position.y * position.width) + position.x] = LIGHT_GRAY;
        if (DEBUG) {
            console.time("setMask(mask, buffer, position)");
            setMask(mask, buffer, position);
            console.timeEnd("setMask(mask, buffer, position)");
        } else {
            setMask(mask, buffer, position);
        }
        setImage(ctx, image, buffer, mask);
    }
    canvas.addEventListener("mousedown", function(event: MouseEvent) {
        const x: number =
            (event.x + window.pageXOffset - canvas.offsetLeft) >> CANVAS_SCALE;
        const y: number =
            (event.y + window.pageYOffset - canvas.offsetTop) >> CANVAS_SCALE;
        doMove(ctx, image, mask, buffer, position, x, y);
    });
    canvas.setAttribute("tabindex", "0");
    canvas.focus();
    canvas.addEventListener("keydown", function(event: KeyboardEvent) {
        switch (event.code) {
        case "ArrowUp": {
            event.preventDefault();
            const y: number = position.y - 1;
            if (0 <= y) {
                doMove(ctx, image, mask, buffer, position, position.x, y);
            }
            break;
        }
        case "ArrowDown": {
            event.preventDefault();
            const y: number = position.y + 1;
            if (y < position.height) {
                doMove(ctx, image, mask, buffer, position, position.x, y);
            }
            break;
        }
        case "ArrowLeft": {
            event.preventDefault();
            const x: number = position.x - 1;
            if (0 <= x) {
                doMove(ctx, image, mask, buffer, position, x, position.y);
            }
            break;
        }
        case "ArrowRight": {
            event.preventDefault();
            const x: number = position.x + 1;
            if (x < position.width) {
                doMove(ctx, image, mask, buffer, position, x, position.y);
            }
            break;
        }
        }
    });
};
