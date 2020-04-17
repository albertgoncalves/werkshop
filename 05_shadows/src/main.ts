const DEBUG: boolean = true;

const CANVAS_SCALE: number = 3;

const ALPHA_OPAQUE: number = 255;
const ALPHA_TRANSPARENT: number = 48;

const COLOR_DARKGRAY: number = 112;
const COLOR_LIGHTGRAY: number = 224;
const COLOR_WHITE: number = 255;

const VISIBLE: number = ALPHA_OPAQUE;
const HIDDEN: number = ALPHA_TRANSPARENT;

const BLOCK: number = COLOR_DARKGRAY;
const EMPTY: number = COLOR_WHITE;
const PLAYER: number = COLOR_LIGHTGRAY;

const RADIUS: number = 91;
const RADIUS_SQUARED: number = RADIUS * RADIUS;

const APERTURE: number = 0.5;

const KEY_UP: string = "i";
const KEY_DOWN: string = "k";
const KEY_LEFT: string = "j";
const KEY_RIGHT: string = "l";

const SPEED: number = 0.65;
const FRAME_MS: number = (1 / 60) * 1000;

let WIDTH: number = 0;
let HEIGHT: number = 0;
let WIDTH_BOUND: number = 0;
let HEIGHT_BOUND: number = 0;

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

interface Directions {
    up: number;
    down: number;
    left: number;
    right: number;
}

interface State {
    time: number|null;
}

function setVerticalLine(buffer: Uint8ClampedArray,
                         x: number,
                         yStart: number,
                         yEnd: number) {
    const start: number = (yStart * WIDTH) + x;
    const end: number = (yEnd * WIDTH) + x;
    for (let i: number = start; i <= end; i += WIDTH) {
        buffer[i] = BLOCK;
    }
}

function setHorizontalLine(buffer: Uint8ClampedArray,
                           xStart: number,
                           xEnd: number,
                           y: number) {
    const yWidth: number = y * WIDTH;
    const start: number = yWidth + xStart;
    const end: number = yWidth + xEnd;
    for (let i: number = start; i <= end; ++i) {
        buffer[i] = BLOCK;
    }
}

function setImage(ctx: CanvasRenderingContext2D,
                  image: ImageData,
                  buffer: Uint8ClampedArray,
                  mask: Uint8ClampedArray) {
    for (let i: number = buffer.length - 1; 0 <= i; --i) {
        const color: number = buffer[i];
        const index: number = i << 2;
        image.data[index] = color;
        image.data[index + 1] = color;
        image.data[index + 2] = color;
        image.data[index + 3] = mask[i];
    }
    ctx.putImageData(image, 0, 0);
}

function getBlocked(buffer: Uint8ClampedArray, x: number, y: number): boolean {
    return ((x < 0) || (y < 0) || (WIDTH <= x) || (HEIGHT <= y) ||
            (buffer[(WIDTH * y) + x] !== EMPTY));
}

function setMaskColRow(mask: Uint8ClampedArray,
                       buffer: Uint8ClampedArray,
                       current: Coords,
                       octal: Octal) {
    if (octal.slopeStart < octal.slopeEnd) {
        return;
    }
    let nextStart: number = octal.slopeStart;
    const yEnd: number = RADIUS + 1;
    for (let dY: number = octal.loopStart; dY < yEnd; ++dY) {
        let blocked: boolean = false;
        let visible: boolean = false;
        const y: number = current.y + (dY * octal.yMult);
        const yDelta: number = y - current.y;
        const yDeltaSquared: number = yDelta * yDelta;
        const yWidth: number = y * WIDTH;
        for (let dX: number = dY; 0 <= dX; --dX) {
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
                mask[yWidth + x] = VISIBLE;
                visible = true;
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
        if (blocked || (!visible)) {
            return;
        }
    }
}

function setMaskRowCol(mask: Uint8ClampedArray,
                       buffer: Uint8ClampedArray,
                       current: Coords,
                       octal: Octal) {
    if (octal.slopeStart < octal.slopeEnd) {
        return;
    }
    let nextStart: number = octal.slopeStart;
    const xEnd: number = RADIUS + 1;
    for (let dX: number = octal.loopStart; dX < xEnd; ++dX) {
        let blocked: boolean = false;
        let visible: boolean = false;
        const x: number = current.x + (dX * octal.xMult);
        const xDelta: number = x - current.x;
        const xDeltaSquared: number = xDelta * xDelta;
        for (let dY: number = dX; 0 <= dY; --dY) {
            const lSlope: number = (dY - APERTURE) / (dX + APERTURE);
            if (octal.slopeStart < lSlope) {
                continue;
            }
            const rSlope: number = (dY + APERTURE) / (dX - APERTURE);
            if (rSlope < octal.slopeEnd) {
                break;
            }
            const y: number = current.y + (dY * octal.yMult);
            const yWidth: number = y * WIDTH;
            const yDelta: number = y - current.y;
            if (((xDeltaSquared + (yDelta * yDelta)) < RADIUS_SQUARED) &&
                (0 <= x) && (x < WIDTH) && (0 <= y) && (y < HEIGHT))
            {
                mask[yWidth + x] = VISIBLE;
                visible = true;
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
        if (blocked || (!visible)) {
            return;
        }
    }
}

function setMask(mask: Uint8ClampedArray,
                 buffer: Uint8ClampedArray,
                 current: Coords) {
    mask.fill(HIDDEN);
    mask[(current.y * WIDTH) + current.x] = VISIBLE;
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

function getKeyUp(buffer: Uint8ClampedArray,
                  keys: Directions,
                  current: Coords): boolean {
    return ((keys.up !== 0) && (keys.down === 0) && (keys.left < keys.up) &&
            (keys.right < keys.up) && (0 < current.y) &&
            (buffer[((current.y - 1) * WIDTH) + current.x] === EMPTY));
}

function getKeyDown(buffer: Uint8ClampedArray,
                    keys: Directions,
                    current: Coords): boolean {
    return ((keys.down !== 0) && (keys.up === 0) && (keys.left < keys.down) &&
            (keys.right < keys.down) && (current.y < HEIGHT_BOUND) &&
            (buffer[((current.y + 1) * WIDTH) + current.x] === EMPTY));
}

function getKeyLeft(buffer: Uint8ClampedArray,
                    keys: Directions,
                    current: Coords): boolean {
    return ((keys.left !== 0) && (keys.right === 0) && (keys.up < keys.left) &&
            (keys.down < keys.left) && (0 < current.x) &&
            (buffer[(current.y * WIDTH) + current.x - 1] === EMPTY));
}

function getKeyRight(buffer: Uint8ClampedArray,
                     keys: Directions,
                     current: Coords): boolean {
    return ((keys.right !== 0) && (keys.left === 0) &&
            (keys.up < keys.right) && (keys.down < keys.right) &&
            (current.x < WIDTH_BOUND) &&
            (buffer[(current.y * WIDTH) + current.x + 1] === EMPTY));
}

window.onload = function() {
    const canvas: HTMLCanvasElement =
        document.getElementById("canvas") as HTMLCanvasElement;
    WIDTH = canvas.width;
    HEIGHT = canvas.height;
    const n: number = WIDTH * HEIGHT;
    if (n === 0) {
        return;
    }
    WIDTH_BOUND = WIDTH - 1;
    HEIGHT_BOUND = HEIGHT - 1;
    canvas.setAttribute("tabindex", "0");
    canvas.focus();
    const ctx: CanvasRenderingContext2D =
        canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    const image: ImageData = ctx.createImageData(WIDTH, HEIGHT);
    const mask: Uint8ClampedArray = new Uint8ClampedArray(n);
    const buffer: Uint8ClampedArray = new Uint8ClampedArray(n);
    buffer.fill(EMPTY);
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
    const state: State = {
        time: null,
    };
    const keys: Directions = {
        up: 0,
        down: 0,
        left: 0,
        right: 0,
    };
    canvas.addEventListener("mousedown", function(event: MouseEvent) {
        const x: number =
            (event.x + window.pageXOffset - canvas.offsetLeft) >> CANVAS_SCALE;
        const y: number =
            (event.y + window.pageYOffset - canvas.offsetTop) >> CANVAS_SCALE;
        const index: number = (y * WIDTH) + x;
        if (buffer[index] === EMPTY) {
            target.x = x;
            target.y = y;
            move.x = x;
            move.y = y;
        }
    }, false);
    let keyCounter: number = 0;
    const debugKeyAction: HTMLElement =
        document.getElementById("debug-key-action") as HTMLElement;
    const debugKeysState: HTMLElement =
        document.getElementById("debug-keys-state") as HTMLElement;
    canvas.addEventListener("keydown", function(event: KeyboardEvent) {
        switch (event.key) {
            case KEY_UP: {
                event.preventDefault();
                if (event.repeat) {
                    return;
                }
                keys.up = ++keyCounter;
                if (DEBUG) {
                    debugKeyAction.innerHTML = "pressed <strong>up</strong>";
                    debugKeysState.innerHTML =
                        "<em>" + JSON.stringify(keys) + "</em>";
                }
                break;
            }
            case KEY_DOWN: {
                event.preventDefault();
                if (event.repeat) {
                    return;
                }
                keys.down = ++keyCounter;
                if (DEBUG) {
                    debugKeyAction.innerHTML = "pressed <strong>down</strong>";
                    debugKeysState.innerHTML =
                        "<em>" + JSON.stringify(keys) + "</em>";
                }
                break;
            }
            case KEY_LEFT: {
                event.preventDefault();
                if (event.repeat) {
                    return;
                }
                keys.left = ++keyCounter;
                if (DEBUG) {
                    debugKeyAction.innerHTML = "pressed <strong>left</strong>";
                    debugKeysState.innerHTML =
                        "<em>" + JSON.stringify(keys) + "</em>";
                }
                break;
            }
            case KEY_RIGHT: {
                event.preventDefault();
                if (event.repeat) {
                    return;
                }
                keys.right = ++keyCounter;
                if (DEBUG) {
                    debugKeyAction.innerHTML =
                        "pressed <strong>right</strong>";
                    debugKeysState.innerHTML =
                        "<em>" + JSON.stringify(keys) + "</em>";
                }
                break;
            }
        }
    }, false);
    canvas.addEventListener("keyup", function(event: KeyboardEvent) {
        switch (event.key) {
            case KEY_UP: {
                event.preventDefault();
                if (event.repeat) {
                    return;
                }
                keys.up = 0;
                if (DEBUG) {
                    debugKeyAction.innerHTML = "released <strong>up</strong>";
                    debugKeysState.innerHTML =
                        "<em>" + JSON.stringify(keys) + "</em>";
                }
                break;
            }
            case KEY_DOWN: {
                event.preventDefault();
                if (event.repeat) {
                    return;
                }
                keys.down = 0;
                if (DEBUG) {
                    debugKeyAction.innerHTML =
                        "released <strong>down</strong>";
                    debugKeysState.innerHTML =
                        "<em>" + JSON.stringify(keys) + "</em>";
                }
                break;
            }
            case KEY_LEFT: {
                event.preventDefault();
                if (event.repeat) {
                    return;
                }
                keys.left = 0;
                if (DEBUG) {
                    debugKeyAction.innerHTML =
                        "released <strong>left</strong>";
                    debugKeysState.innerHTML =
                        "<em>" + JSON.stringify(keys) + "</em>";
                }
                break;
            }
            case KEY_RIGHT: {
                event.preventDefault();
                if (event.repeat) {
                    return;
                }
                keys.right = 0;
                if (DEBUG) {
                    debugKeyAction.innerHTML =
                        "released <strong>right</strong>";
                    debugKeysState.innerHTML =
                        "<em>" + JSON.stringify(keys) + "</em>";
                }
                break;
            }
        }
    }, false);
    {
        setVerticalLine(buffer, 6, 10, 15);
        setVerticalLine(buffer, 6, 19, 40);
        setVerticalLine(buffer, 18, 8, 21);
        setVerticalLine(buffer, 25, 10, 20);
        setVerticalLine(buffer, 32, 33, 40);
        setVerticalLine(buffer, 32, 46, 51);
        setVerticalLine(buffer, 45, 7, 11);
        setVerticalLine(buffer, 45, 15, 21);
        setVerticalLine(buffer, 55, 3, 9);
        setVerticalLine(buffer, 55, 13, 19);
        setVerticalLine(buffer, 55, 23, 28);
        setVerticalLine(buffer, 55, 32, 37);
        setVerticalLine(buffer, 55, 42, 50);
        setHorizontalLine(buffer, 7, 24, 5);
        setHorizontalLine(buffer, 10, 19, 17);
        setHorizontalLine(buffer, 22, 31, 17);
        setHorizontalLine(buffer, 12, 25, 26);
        setHorizontalLine(buffer, 29, 44, 26);
        setHorizontalLine(buffer, 3, 24, 54);
        setHorizontalLine(buffer, 27, 59, 56);
        for (let _: number = 100; 0 < _; --_) {
            const x: number = Math.floor(Math.random() * WIDTH);
            const y: number = Math.floor(Math.random() * HEIGHT);
            const index = (y * WIDTH) + x;
            if (buffer[index] === EMPTY) {
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
    const debugFPS: HTMLElement =
        document.getElementById("debug-fps") as HTMLElement;
    let frameCounter: number = 0;
    let frameStart: number = performance.now();
    const loop: (t: number) => void = function(t: number) {
        if ((keys.up !== 0) || (keys.down !== 0) || (keys.left !== 0) ||
            (keys.right !== 0))
        {
            if (getKeyUp(buffer, keys, current)) {
                const speed: number =
                    ((state.time !== null) && (state.time < t))
                    ? ((t - state.time) / FRAME_MS) * SPEED
                    : SPEED;
                move.x = current.x;
                move.y -= speed;
                target.y = Math.round(move.y);
            } else if (getKeyDown(buffer, keys, current)) {
                const speed: number =
                    ((state.time !== null) && (state.time < t))
                    ? ((t - state.time) / FRAME_MS) * SPEED
                    : SPEED;
                move.x = current.x;
                move.y += speed;
                target.y = Math.round(move.y);
            } else if (getKeyLeft(buffer, keys, current)) {
                const speed: number =
                    ((state.time !== null) && (state.time < t))
                    ? ((t - state.time) / FRAME_MS) * SPEED
                    : SPEED;
                move.x -= speed;
                move.y = current.y;
                target.x = Math.round(move.x);
            } else if (getKeyRight(buffer, keys, current)) {
                const speed: number =
                    ((state.time !== null) && (state.time < t))
                    ? ((t - state.time) / FRAME_MS) * SPEED
                    : SPEED;
                move.x += speed;
                move.y = current.y;
                target.x = Math.round(move.x);
            }
        } else if ((move.x !== current.x) || (move.y !== current.y)) {
            move.x = current.x;
            move.y = current.y;
            keyCounter = 0;
        }
        if ((target.x !== current.x) || (target.y !== current.y)) {
            buffer[(current.y * WIDTH) + current.x] = EMPTY;
            buffer[(target.y * WIDTH) + target.x] = PLAYER;
            setMask(mask, buffer, target);
            current.x = target.x;
            current.y = target.y;
        }
        setImage(ctx, image, buffer, mask);
        state.time = t;
        if (DEBUG) {
            ++frameCounter;
            const frameStop: number = performance.now();
            const delta: number = frameStop - frameStart;
            if (1000 < delta) {
                debugFPS.innerHTML = "<strong>" +
                    ((frameCounter / delta) * 1000).toFixed(2) +
                    "</strong> fps";
                frameStart = frameStop;
                frameCounter = 0;
            }
        }
        requestAnimationFrame(loop);
    };
    loop(0);
};
