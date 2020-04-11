const DEBUG: boolean = true;

const CANVAS_SCALE: number = 3;

const DARK_GRAY: number = 112;
const LIGHT_GRAY: number = 224;
const WHITE: number = 255;

const OPAQUE: number = 255;
const TRANSPARENT: number = 0;

const RADIUS: number = 91;
const RADIUS_SQUARED: number = RADIUS * RADIUS;

const APERTURE: number = 0.499;

const SPEED: number = 0.35;

interface Coords {
    x: number;
    y: number;
}

interface Octal {
    xMult: number;
    yMult: number;
    start: number;
    slopeStart: number;
    slopeEnd: number;
}

function setVerticalLine(canvas: HTMLCanvasElement, buffer: Uint8ClampedArray,
                         x: number, yStart: number, yEnd: number) {
    const start: number = (yStart * canvas.width) + x;
    const end: number = (yEnd * canvas.width) + x;
    for (let i: number = start; i <= end; i += canvas.width) {
        buffer[i] = DARK_GRAY;
    }
}

function setHorizontalLine(canvas: HTMLCanvasElement,
                           buffer: Uint8ClampedArray, xStart: number,
                           xEnd: number, y: number) {
    const yWidth: number = y * canvas.width;
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

function getBlocked(canvas: HTMLCanvasElement, buffer: Uint8ClampedArray,
                    x: number, y: number) {
    return ((x < 0) || (y < 0) || (canvas.width <= x) ||
            (canvas.height <= y) ||
            (buffer[(canvas.width * y) + x] !== WHITE));
}

function setMaskColRow(canvas: HTMLCanvasElement, mask: Uint8ClampedArray,
                       buffer: Uint8ClampedArray, position: Coords,
                       octal: Octal) {
    if (octal.slopeStart < octal.slopeEnd) {
        return;
    }
    let nextStart: number = octal.slopeStart;
    const yEnd: number = RADIUS + 1;
    for (let dY: number = octal.start; dY < yEnd; dY++) {
        let blocked: boolean = false;
        const y: number = position.y + (dY * octal.yMult);
        const yDelta: number = y - position.y;
        const yDeltaSquared: number = yDelta * yDelta;
        const yWidth: number = y * canvas.width;
        for (let dX: number = dY + 1; - 1 < dX; dX--) {
            const lSlope: number = (dX - APERTURE) / (dY + APERTURE);
            if (octal.slopeStart < lSlope) {
                continue;
            }
            const rSlope: number = (dX + APERTURE) / (dY - APERTURE);
            if (rSlope < octal.slopeEnd) {
                break;
            }
            const x: number = position.x + (dX * octal.xMult);
            const xDelta: number = x - position.x;
            if ((((xDelta * xDelta) + yDeltaSquared) < RADIUS_SQUARED) &&
                (0 <= x) && (x < canvas.width) && (0 <= y) &&
                (y < canvas.height)) {
                mask[yWidth + x] = OPAQUE;
            }
            if (blocked) {
                if (getBlocked(canvas, buffer, x, y)) {
                    nextStart = lSlope;
                    continue;
                } else {
                    blocked = false;
                    octal.slopeStart = nextStart;
                }
            } else {
                if ((getBlocked(canvas, buffer, x, y)) && (dY < RADIUS)) {
                    blocked = true;
                    setMaskColRow(canvas, mask, buffer, position, {
                        xMult: octal.xMult,
                        yMult: octal.yMult,
                        start: dY + 1,
                        slopeStart: nextStart,
                        slopeEnd: rSlope,
                    });
                    nextStart = lSlope;
                }
            }
        }
        if (blocked) {
            break;
        }
    }
}

function setMaskRowCol(canvas: HTMLCanvasElement, mask: Uint8ClampedArray,
                       buffer: Uint8ClampedArray, position: Coords,
                       octal: Octal) {
    if (octal.slopeStart < octal.slopeEnd) {
        return;
    }
    let nextStart: number = octal.slopeStart;
    const xEnd: number = RADIUS + 1;
    for (let dX: number = octal.start; dX < xEnd; dX++) {
        let blocked: boolean = false;
        const x: number = position.x + (dX * octal.xMult);
        const xDelta: number = x - position.x;
        const xDeltaSquared: number = xDelta * xDelta;
        for (let dY: number = dX + 1; - 1 < dY; dY--) {
            const lSlope: number = (dY - APERTURE) / (dX + APERTURE);
            if (octal.slopeStart < lSlope) {
                continue;
            }
            const rSlope: number = (dY + APERTURE) / (dX - APERTURE);
            if (rSlope < octal.slopeEnd) {
                break;
            }
            const y: number = position.y + (dY * octal.yMult);
            const yDelta: number = y - position.y;
            const yWidth: number = y * canvas.width;
            if (((xDeltaSquared + (yDelta * yDelta)) < RADIUS_SQUARED) &&
                (0 <= x) && (x < canvas.width) && (0 <= y) &&
                (y < canvas.height)) {
                mask[yWidth + x] = OPAQUE;
            }
            if (blocked) {
                if (getBlocked(canvas, buffer, x, y)) {
                    nextStart = lSlope;
                    continue;
                } else {
                    blocked = false;
                    octal.slopeStart = nextStart;
                }
            } else {
                if ((getBlocked(canvas, buffer, x, y)) && (dX < RADIUS)) {
                    blocked = true;
                    setMaskRowCol(canvas, mask, buffer, position, {
                        xMult: octal.xMult,
                        yMult: octal.yMult,
                        start: dX + 1,
                        slopeStart: octal.slopeStart,
                        slopeEnd: rSlope,
                    });
                    nextStart = lSlope;
                }
            }
        }
        if (blocked) {
            break;
        }
    }
}

function setMask(canvas: HTMLCanvasElement, mask: Uint8ClampedArray,
                 buffer: Uint8ClampedArray, position: Coords) {
    mask.fill(TRANSPARENT);
    mask[(position.y * canvas.width) + position.x] = OPAQUE;
    setMaskColRow(canvas, mask, buffer, position, {
        xMult: 1,
        yMult: 1,
        start: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskColRow(canvas, mask, buffer, position, {
        xMult: 1,
        yMult: -1,
        start: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskColRow(canvas, mask, buffer, position, {
        xMult: -1,
        yMult: 1,
        start: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskColRow(canvas, mask, buffer, position, {
        xMult: -1,
        yMult: -1,
        start: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskRowCol(canvas, mask, buffer, position, {
        xMult: 1,
        yMult: 1,
        start: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskRowCol(canvas, mask, buffer, position, {
        xMult: 1,
        yMult: -1,
        start: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskRowCol(canvas, mask, buffer, position, {
        xMult: -1,
        yMult: 1,
        start: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskRowCol(canvas, mask, buffer, position, {
        xMult: -1,
        yMult: -1,
        start: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
}

function doStep(canvas: HTMLCanvasElement, mask: Uint8ClampedArray,
                buffer: Uint8ClampedArray, position: Coords, target: Coords,
                move: Coords) {
    if (move.x < target.x) {
        move.x += SPEED;
    } else if (target.x < move.x) {
        move.x -= SPEED;
    }
    if (move.y < target.y) {
        move.y += SPEED;
    } else if (target.y < move.y) {
        move.y -= SPEED;
    }
    const x: number = Math.round(move.x);
    const y: number = Math.round(move.y);
    const index: number = (y * canvas.width) + x;
    if (buffer[index] === WHITE) {
        buffer[(position.y * canvas.width) + position.x] = WHITE;
        buffer[index] = LIGHT_GRAY;
        position.x = x;
        position.y = y;
        if (DEBUG) {
            console.time("setMask");
            setMask(canvas, mask, buffer, position);
            console.timeEnd("setMask");
        } else {
            setMask(canvas, mask, buffer, position);
        }
    }
    if (buffer[index] !== LIGHT_GRAY) {
        target.x = position.x;
        target.y = position.y;
    }
}

window.onload = function() {
    const canvas: HTMLCanvasElement =
        document.getElementById("canvas") as HTMLCanvasElement;
    const ctx: CanvasRenderingContext2D =
        canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    const n: number = canvas.width * canvas.height;
    const image: ImageData = ctx.createImageData(canvas.width, canvas.height);
    const buffer: Uint8ClampedArray = new Uint8ClampedArray(n);
    const mask: Uint8ClampedArray = new Uint8ClampedArray(n);
    buffer.fill(WHITE);
    const position: Coords = {
        x: 0,
        y: 0,
    };
    {
        setVerticalLine(canvas, buffer, 6, 10, 40);
        setVerticalLine(canvas, buffer, 25, 10, 20);
        setVerticalLine(canvas, buffer, 18, 8, 21);
        setVerticalLine(canvas, buffer, 55, 3, 50);
        setVerticalLine(canvas, buffer, 32, 30, 48);
        setHorizontalLine(canvas, buffer, 7, 24, 5);
        setHorizontalLine(canvas, buffer, 10, 31, 17);
        setHorizontalLine(canvas, buffer, 12, 44, 26);
        setHorizontalLine(canvas, buffer, 3, 24, 54);
        setHorizontalLine(canvas, buffer, 27, 59, 56);
        for (let _: number = 100; 0 < _; _--) {
            const x: number = Math.floor(Math.random() * canvas.width);
            const y: number = Math.floor(Math.random() * canvas.height);
            if (buffer[(y * canvas.width) + x] === WHITE) {
                position.x = x;
                position.y = y;
                break;
            }
        }
        buffer[(position.y * canvas.width) + position.x] = LIGHT_GRAY;
        if (DEBUG) {
            console.time("setMask");
            setMask(canvas, mask, buffer, position);
            console.timeEnd("setMask");
        } else {
            setMask(canvas, mask, buffer, position);
        }
        setImage(ctx, image, buffer, mask);
    }
    const target: Coords = {
        x: position.x,
        y: position.y,
    };
    const move: Coords = {
        x: position.x,
        y: position.y,
    };
    canvas.addEventListener("mousedown", function(event: MouseEvent) {
        target.x =
            (event.x + window.pageXOffset - canvas.offsetLeft) >> CANVAS_SCALE;
        target.y =
            (event.y + window.pageYOffset - canvas.offsetTop) >> CANVAS_SCALE;
    });
    const loop = function() {
        doStep(canvas, mask, buffer, position, target, move);
        setImage(ctx, image, buffer, mask);
        requestAnimationFrame(loop);
    };
    loop();
};
