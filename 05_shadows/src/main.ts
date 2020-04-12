const CANVAS_SCALE: number = 3;

const OPAQUE: number = 255;
const TRANSPARENT: number = 40;

const DARK_GRAY: number = 112;
const LIGHT_GRAY: number = 224;
const WHITE: number = 255;

const WALL: number = DARK_GRAY;
const FLOOR: number = WHITE;
const PLAYER: number = LIGHT_GRAY;

const RADIUS: number = 91;
const RADIUS_SQUARED: number = RADIUS * RADIUS;

const APERTURE: number = 0.499;

const SPEED: number = 0.65;

let WIDTH: number = 0;
let HEIGHT: number = 0;

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

interface Keys {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
}

function setVerticalLine(buffer: Uint8ClampedArray, x: number, yStart: number,
                         yEnd: number) {
    const start: number = (yStart * WIDTH) + x;
    const end: number = (yEnd * WIDTH) + x;
    for (let i: number = start; i <= end; i += WIDTH) {
        buffer[i] = WALL;
    }
}

function setHorizontalLine(buffer: Uint8ClampedArray, xStart: number,
                           xEnd: number, y: number) {
    const yWidth: number = y * WIDTH;
    const start: number = yWidth + xStart;
    const end: number = yWidth + xEnd;
    for (let i: number = start; i <= end; i++) {
        buffer[i] = WALL;
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

function getBlocked(buffer: Uint8ClampedArray, x: number, y: number) {
    return ((x < 0) || (y < 0) || (WIDTH <= x) || (HEIGHT <= y) ||
            (buffer[(WIDTH * y) + x] !== FLOOR));
}

function setMaskColRow(mask: Uint8ClampedArray, buffer: Uint8ClampedArray,
                       current: Coords, octal: Octal) {
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
        const yWidth: number = y * WIDTH;
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
                (0 <= x) && (x < WIDTH) && (0 <= y) && (y < HEIGHT))
            {
                mask[yWidth + x] = OPAQUE;
            }
            if (blocked) {
                if (getBlocked(buffer, x, y)) {
                    nextStart = lSlope;
                    continue;
                } else {
                    blocked = false;
                    octal.slopeStart = nextStart;
                }
            } else {
                if ((getBlocked(buffer, x, y)) && (dY < RADIUS)) {
                    blocked = true;
                    setMaskColRow(mask, buffer, current, {
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

function setMaskRowCol(mask: Uint8ClampedArray, buffer: Uint8ClampedArray,
                       current: Coords, octal: Octal) {
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
            const yWidth: number = y * WIDTH;
            if (((xDeltaSquared + (yDelta * yDelta)) < RADIUS_SQUARED) &&
                (0 <= x) && (x < WIDTH) && (0 <= y) && (y < HEIGHT))
            {
                mask[yWidth + x] = OPAQUE;
            }
            if (blocked) {
                if (getBlocked(buffer, x, y)) {
                    nextStart = lSlope;
                    continue;
                } else {
                    blocked = false;
                    octal.slopeStart = nextStart;
                }
            } else {
                if ((getBlocked(buffer, x, y)) && (dX < RADIUS)) {
                    blocked = true;
                    setMaskRowCol(mask, buffer, current, {
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

function setMask(mask: Uint8ClampedArray, buffer: Uint8ClampedArray,
                 current: Coords) {
    mask.fill(TRANSPARENT);
    mask[(current.y * WIDTH) + current.x] = OPAQUE;
    setMaskColRow(mask, buffer, current, {
        xMult: 1,
        yMult: 1,
        loopStart: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskColRow(mask, buffer, current, {
        xMult: 1,
        yMult: -1,
        loopStart: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskColRow(mask, buffer, current, {
        xMult: -1,
        yMult: 1,
        loopStart: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskColRow(mask, buffer, current, {
        xMult: -1,
        yMult: -1,
        loopStart: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskRowCol(mask, buffer, current, {
        xMult: 1,
        yMult: 1,
        loopStart: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskRowCol(mask, buffer, current, {
        xMult: 1,
        yMult: -1,
        loopStart: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskRowCol(mask, buffer, current, {
        xMult: -1,
        yMult: 1,
        loopStart: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
    setMaskRowCol(mask, buffer, current, {
        xMult: -1,
        yMult: -1,
        loopStart: 1,
        slopeStart: 1.0,
        slopeEnd: 0.0,
    });
}

function doJump(mask: Uint8ClampedArray, buffer: Uint8ClampedArray,
                current: Coords, target: Coords, move: Coords) {
    if ((current.x === target.x) && (current.y === target.y)) {
        return;
    }
    const index: number = (target.y * WIDTH) + target.x;
    if (buffer[index] === FLOOR) {
        buffer[(current.y * WIDTH) + current.x] = FLOOR;
        buffer[index] = PLAYER;
        setMask(mask, buffer, target);
        current.x = target.x;
        current.y = target.y;
    } else {
        target.x = current.x;
        target.y = current.y;
        move.x = current.x;
        move.y = current.y;
    }
}

window.onload = function() {
    const canvas: HTMLCanvasElement =
        document.getElementById("canvas") as HTMLCanvasElement;
    WIDTH = canvas.width;
    HEIGHT = canvas.height;
    const ctx: CanvasRenderingContext2D =
        canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    const n: number = WIDTH * HEIGHT;
    const image: ImageData = ctx.createImageData(WIDTH, HEIGHT);
    const buffer: Uint8ClampedArray = new Uint8ClampedArray(n);
    const mask: Uint8ClampedArray = new Uint8ClampedArray(n);
    buffer.fill(FLOOR);
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
    const keys: Keys = {
        up: false,
        down: false,
        left: false,
        right: false,
    };
    canvas.addEventListener("mousedown", function(event: MouseEvent) {
        const x: number =
            (event.x + window.pageXOffset - canvas.offsetLeft) >> CANVAS_SCALE;
        const y: number =
            (event.y + window.pageYOffset - canvas.offsetTop) >> CANVAS_SCALE;
        const index: number = (y * WIDTH) + x;
        if (mask[index] === OPAQUE) {
            target.x = x;
            target.y = y;
            move.x = x;
            move.y = y;
        } else {
            target.x = current.x;
            target.y = current.y;
            move.x = current.x;
            move.y = current.y;
        }
    }, false);
    canvas.setAttribute("tabindex", "0");
    canvas.focus();
    canvas.addEventListener("keydown", function(event: KeyboardEvent) {
        switch (event.key) {
        case "ArrowUp": {
            event.preventDefault();
            if (event.repeat) {
                return;
            }
            keys.up = true;
            break;
        }
        case "ArrowDown": {
            event.preventDefault();
            if (event.repeat) {
                return;
            }
            keys.down = true;
            break;
        }
        case "ArrowLeft": {
            event.preventDefault();
            if (event.repeat) {
                return;
            }
            keys.left = true;
            break;
        }
        case "ArrowRight": {
            event.preventDefault();
            if (event.repeat) {
                return;
            }
            keys.right = true;
            break;
        }
        }
    }, false);
    canvas.addEventListener("keyup", function(event: KeyboardEvent) {
        switch (event.key) {
        case "ArrowUp": {
            event.preventDefault();
            if (event.repeat) {
                return;
            }
            keys.up = false;
            break;
        }
        case "ArrowDown": {
            event.preventDefault();
            if (event.repeat) {
                return;
            }
            keys.down = false;
            break;
        }
        case "ArrowLeft": {
            event.preventDefault();
            if (event.repeat) {
                return;
            }
            keys.left = false;
            break;
        }
        case "ArrowRight": {
            event.preventDefault();
            if (event.repeat) {
                return;
            }
            keys.right = false;
            break;
        }
        }
    }, false);
    {
        setVerticalLine(buffer, 6, 10, 15);
        setVerticalLine(buffer, 6, 19, 40);
        setVerticalLine(buffer, 18, 8, 21);
        setVerticalLine(buffer, 25, 10, 20);
        setVerticalLine(buffer, 32, 30, 40);
        setVerticalLine(buffer, 32, 46, 51);
        setVerticalLine(buffer, 45, 7, 11);
        setVerticalLine(buffer, 45, 15, 21);
        setVerticalLine(buffer, 55, 3, 10);
        setVerticalLine(buffer, 55, 13, 20);
        setVerticalLine(buffer, 55, 23, 29);
        setVerticalLine(buffer, 55, 32, 37);
        setVerticalLine(buffer, 55, 42, 50);
        setHorizontalLine(buffer, 7, 24, 5);
        setHorizontalLine(buffer, 10, 19, 17);
        setHorizontalLine(buffer, 22, 31, 17);
        setHorizontalLine(buffer, 12, 25, 26);
        setHorizontalLine(buffer, 29, 44, 26);
        setHorizontalLine(buffer, 3, 24, 54);
        setHorizontalLine(buffer, 27, 59, 56);
        for (let _: number = 100; 0 < _; _--) {
            const x: number = Math.floor(Math.random() * WIDTH);
            const y: number = Math.floor(Math.random() * HEIGHT);
            const index = (y * WIDTH) + x;
            if (buffer[index] === FLOOR) {
                buffer[index] = PLAYER;
                current.x = x;
                current.y = y;
                target.x = x;
                target.y = y;
                move.x = x;
                move.y = y;
                break;
            }
        }
        setMask(mask, buffer, current);
        setImage(ctx, image, buffer, mask);
    }
    const widthBound: number = WIDTH - 1;
    const heightBound: number = HEIGHT - 1;
    const loop: () => void = function() {
        if (keys.up && (0 < current.y)) {
            move.y -= SPEED;
        }
        if (keys.down && (current.y < heightBound)) {
            move.y += SPEED;
        }
        if (keys.left && (0 < current.x)) {
            move.x -= SPEED;
        }
        if (keys.right && (current.x < widthBound)) {
            move.x += SPEED;
        }
        if (keys.up || keys.down || keys.left || keys.right) {
            target.x = Math.round(move.x);
            target.y = Math.round(move.y);
        }
        doJump(mask, buffer, current, target, move);
        setImage(ctx, image, buffer, mask);
        requestAnimationFrame(loop);
    };
    loop();
};
