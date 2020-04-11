const CANVAS_SCALE: number = 3;

const DARK_GRAY: number = 112;
const LIGHT_GRAY: number = 224;
const WHITE: number = 255;

const OPAQUE: number = 255;
const TRANSPARENT: number = 40;

const RADIUS: number = 91;
const RADIUS_SQUARED: number = RADIUS * RADIUS;

const APERTURE: number = 0.499;

const SPEED: number = 0.75;

interface Coords {
    x: number;
    y: number;
}

interface Octal {
    xMult: number;
    yMult: number;
    loopStart: number;
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
                       buffer: Uint8ClampedArray, current: Coords,
                       octal: Octal) {
    if (octal.slopeStart < octal.slopeEnd) {
        return;
    }
    let nextStart: number = octal.slopeStart;
    const yEnd: number = RADIUS + 1;
    for (let dY: number = octal.loopStart; dY < yEnd; dY++) {
        let blocked: boolean = false;
        const y: number = current.y + (dY * octal.yMult);
        const yDelta: number = y - current.y;
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
            const x: number = current.x + (dX * octal.xMult);
            const xDelta: number = x - current.x;
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
                    setMaskColRow(canvas, mask, buffer, current, {
                        xMult: octal.xMult,
                        yMult: octal.yMult,
                        loopStart: dY + 1,
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
                       buffer: Uint8ClampedArray, current: Coords,
                       octal: Octal) {
    if (octal.slopeStart < octal.slopeEnd) {
        return;
    }
    let nextStart: number = octal.slopeStart;
    const xEnd: number = RADIUS + 1;
    for (let dX: number = octal.loopStart; dX < xEnd; dX++) {
        let blocked: boolean = false;
        const x: number = current.x + (dX * octal.xMult);
        const xDelta: number = x - current.x;
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
            const y: number = current.y + (dY * octal.yMult);
            const yDelta: number = y - current.y;
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
                    setMaskRowCol(canvas, mask, buffer, current, {
                        xMult: octal.xMult,
                        yMult: octal.yMult,
                        loopStart: dX + 1,
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
                 buffer: Uint8ClampedArray, current: Coords) {
    mask.fill(TRANSPARENT);
    mask[(current.y * canvas.width) + current.x] = OPAQUE;
    setMaskColRow(canvas, mask, buffer, current, {
        xMult: 1,
        yMult: 1,
        loopStart: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskColRow(canvas, mask, buffer, current, {
        xMult: 1,
        yMult: -1,
        loopStart: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskColRow(canvas, mask, buffer, current, {
        xMult: -1,
        yMult: 1,
        loopStart: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskColRow(canvas, mask, buffer, current, {
        xMult: -1,
        yMult: -1,
        loopStart: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskRowCol(canvas, mask, buffer, current, {
        xMult: 1,
        yMult: 1,
        loopStart: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskRowCol(canvas, mask, buffer, current, {
        xMult: 1,
        yMult: -1,
        loopStart: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskRowCol(canvas, mask, buffer, current, {
        xMult: -1,
        yMult: 1,
        loopStart: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskRowCol(canvas, mask, buffer, current, {
        xMult: -1,
        yMult: -1,
        loopStart: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
}

function doStep(canvas: HTMLCanvasElement, mask: Uint8ClampedArray,
                buffer: Uint8ClampedArray, current: Coords, target: Coords,
                move: Coords, speed: Coords) {
    if ((current.x === target.x) && (current.y === target.y)) {
        return;
    }
    move.x += speed.x;
    move.y += speed.y;
    const next: Coords = {
        x: Math.round(move.x),
        y: Math.round(move.y),
    };
    if ((current.x === next.x) && (current.y === next.y)) {
        return;
    }
    const index: number = (next.y * canvas.width) + next.x;
    if (buffer[index] === WHITE) {
        buffer[(current.y * canvas.width) + current.x] = WHITE;
        buffer[index] = LIGHT_GRAY;
        setMask(canvas, mask, buffer, next);
        current.x = next.x;
        current.y = next.y;
    } else {
        speed.x = 0;
        speed.y = 0;
        move.x = current.x;
        move.y = current.y;
        target.x = current.y;
        target.y = current.y;
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
    const current: Coords = {
        x: 0,
        y: 0,
    };
    const target: Coords = {
        x: 0,
        y: 0,
    };
    const move: Coords = {
        x: 0.0,
        y: 0.0,
    };
    const speed: Coords = {
        x: 0.0,
        y: 0.0,
    };
    canvas.addEventListener("mousedown", function(event: MouseEvent) {
        const x: number =
            (event.x + window.pageXOffset - canvas.offsetLeft) >> CANVAS_SCALE;
        const y: number =
            (event.y + window.pageYOffset - canvas.offsetTop) >> CANVAS_SCALE;
        speed.x = 0.0;
        speed.y = 0.0;
        if ((current.x !== x) && (current.y !== y)) {
            const xDelta: number = x - current.x;
            const yDelta: number = y - current.y;
            const slope: number = Math.abs(yDelta / xDelta);
            const ySlope = slope / (slope + 1);
            const xSlope = 1.0 - ySlope;
            if (current.x < x) {
                speed.x = xSlope * SPEED;
            } else {
                speed.x = -xSlope * SPEED;
            }
            if (current.y < y) {
                speed.y = ySlope * SPEED;
            } else {
                speed.y = -ySlope * SPEED;
            }
        } else if ((current.x === x) && (current.y !== y)) {
            if (current.y < y) {
                speed.y = SPEED;
            } else {
                speed.y = -SPEED;
            }
        } else if ((current.x !== x) && (current.y === y)) {
            if (current.x < x) {
                speed.x = SPEED;
            } else {
                speed.x = -SPEED;
            }
        } else {
            return;
        }
        const index: number = (y * canvas.width) + x;
        if (mask[index] === OPAQUE) {
            target.x = x;
            target.y = y;
        } else {
            target.x = current.x;
            target.y = current.y;
        }
    });
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
                current.x = x;
                current.y = y;
                target.x = x;
                target.y = y;
                move.x = x;
                move.y = y;
                break;
            }
        }
        buffer[(current.y * canvas.width) + current.x] = LIGHT_GRAY;
        setMask(canvas, mask, buffer, current);
        setImage(ctx, image, buffer, mask);
    }
    const loop: () => void = function() {
        doStep(canvas, mask, buffer, current, target, move, speed);
        setImage(ctx, image, buffer, mask);
        requestAnimationFrame(loop);
    };
    loop();
};
