import {
    GLOBAL,
} from "./global";

import {
    Coords,
    setMask,
} from "./shadows";

import {
    Edge,
    getPartitions,
    getSplitEdges,
} from "./space_partition";

/* NOTE: `GLOBAL.empty === 0`! */
const PLAYER: number = 1;
const BLOCK: number = 2;

const KEY_UP: string = "i";
const KEY_DOWN: string = "k";
const KEY_LEFT: string = "j";
const KEY_RIGHT: string = "l";

const FRAME_STEP: number = 8.0;
const FRAME_SPEED: number = 0.475;

let WIDTH_BOUND: number = 0;
let HEIGHT_BOUND: number = 0;

interface Directions {
    up: number;
    down: number;
    left: number;
    right: number;
}

interface State {
    framePrevTime: number;
    frameIncrements: number;
    debugPrevTime: number;
    debugCount: number;
    keyCount: number;
}

function setVerticalLine(buffer: Uint8ClampedArray,
                         x: number,
                         yStart: number,
                         yEnd: number) {
    const start: number = (yStart * GLOBAL.width) + x;
    const end: number = (yEnd * GLOBAL.width) + x;
    for (let i: number = start; i <= end; i += GLOBAL.width) {
        buffer[i] = BLOCK;
    }
}

function setHorizontalLine(buffer: Uint8ClampedArray,
                           xStart: number,
                           xEnd: number,
                           y: number) {
    const yWidth: number = y * GLOBAL.width;
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
    const n: number = buffer.length - 1;
    let j: number = n << 2;
    for (let i: number = n; 0 <= i; --i) {
        switch (buffer[i]) {
        case GLOBAL.empty: {
            image.data[j] = 240;
            image.data[j + 1] = 240;
            image.data[j + 2] = 240;
            break;
        }
        case PLAYER: {
            image.data[j] = 240;
            image.data[j + 1] = 95;
            image.data[j + 2] = 85;
            break;
        }
        case BLOCK: {
            image.data[j] = 170;
            image.data[j + 1] = 165;
            image.data[j + 2] = 160;
            break;
        }
        }
        image.data[j + 3] = mask[i];
        j -= 4;
    }
    ctx.putImageData(image, 0, 0);
}

function getKeyUp(buffer: Uint8ClampedArray,
                  keys: Directions,
                  current: Coords): boolean {
    return ((keys.up !== 0) && (keys.down === 0) && (keys.left < keys.up) &&
            (keys.right < keys.up) && (0 < current.y) &&
            (buffer[((current.y - 1) * GLOBAL.width) + current.x] ===
             GLOBAL.empty));
}

function getKeyDown(buffer: Uint8ClampedArray,
                    keys: Directions,
                    current: Coords): boolean {
    return ((keys.down !== 0) && (keys.up === 0) && (keys.left < keys.down) &&
            (keys.right < keys.down) && (current.y < HEIGHT_BOUND) &&
            (buffer[((current.y + 1) * GLOBAL.width) + current.x] ===
             GLOBAL.empty));
}

function getKeyLeft(buffer: Uint8ClampedArray,
                    keys: Directions,
                    current: Coords): boolean {
    return (
        (keys.left !== 0) && (keys.right === 0) && (keys.up < keys.left) &&
        (keys.down < keys.left) && (0 < current.x) &&
        (buffer[(current.y * GLOBAL.width) + current.x - 1] === GLOBAL.empty));
}

function getKeyRight(buffer: Uint8ClampedArray,
                     keys: Directions,
                     current: Coords): boolean {
    return (
        (keys.right !== 0) && (keys.left === 0) && (keys.up < keys.right) &&
        (keys.down < keys.right) && (current.x < WIDTH_BOUND) &&
        (buffer[(current.y * GLOBAL.width) + current.x + 1] === GLOBAL.empty));
}

window.onload = function() {
    const canvas: HTMLCanvasElement =
        document.getElementById("canvas") as HTMLCanvasElement;
    GLOBAL.width = canvas.width;
    GLOBAL.height = canvas.height;
    WIDTH_BOUND = GLOBAL.width - 1;
    HEIGHT_BOUND = GLOBAL.height - 1;
    canvas.setAttribute("tabindex", "0");
    canvas.focus();
    const ctx: CanvasRenderingContext2D =
        canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    const image: ImageData = ctx.createImageData(GLOBAL.width, GLOBAL.height);
    const n: number = GLOBAL.width * GLOBAL.height;
    const mask: Uint8ClampedArray = new Uint8ClampedArray(n);
    const buffer: Uint8ClampedArray = new Uint8ClampedArray(n);
    buffer.fill(GLOBAL.empty);
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
    const keys: Directions = {
        up: 0,
        down: 0,
        left: 0,
        right: 0,
    };
    const state: State = {
        framePrevTime: 0.0,
        frameIncrements: 0.0,
        debugPrevTime: 0.0,
        debugCount: 0,
        keyCount: 0,
    };
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
            keys.up = ++state.keyCount;
            debugKeyAction.innerHTML = "pressed <strong>up</strong>";
            debugKeysState.innerHTML = "<em>" + JSON.stringify(keys) + "</em>";
            break;
        }
        case KEY_DOWN: {
            event.preventDefault();
            if (event.repeat) {
                return;
            }
            keys.down = ++state.keyCount;
            debugKeyAction.innerHTML = "pressed <strong>down</strong>";
            debugKeysState.innerHTML = "<em>" + JSON.stringify(keys) + "</em>";
            break;
        }
        case KEY_LEFT: {
            event.preventDefault();
            if (event.repeat) {
                return;
            }
            keys.left = ++state.keyCount;
            debugKeyAction.innerHTML = "pressed <strong>left</strong>";
            debugKeysState.innerHTML = "<em>" + JSON.stringify(keys) + "</em>";
            break;
        }
        case KEY_RIGHT: {
            event.preventDefault();
            if (event.repeat) {
                return;
            }
            keys.right = ++state.keyCount;
            debugKeyAction.innerHTML = "pressed <strong>right</strong>";
            debugKeysState.innerHTML = "<em>" + JSON.stringify(keys) + "</em>";
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
            debugKeyAction.innerHTML = "released <strong>up</strong>";
            debugKeysState.innerHTML = "<em>" + JSON.stringify(keys) + "</em>";
            break;
        }
        case KEY_DOWN: {
            event.preventDefault();
            if (event.repeat) {
                return;
            }
            keys.down = 0;
            debugKeyAction.innerHTML = "released <strong>down</strong>";
            debugKeysState.innerHTML = "<em>" + JSON.stringify(keys) + "</em>";
            break;
        }
        case KEY_LEFT: {
            event.preventDefault();
            if (event.repeat) {
                return;
            }
            keys.left = 0;
            debugKeyAction.innerHTML = "released <strong>left</strong>";
            debugKeysState.innerHTML = "<em>" + JSON.stringify(keys) + "</em>";
            break;
        }
        case KEY_RIGHT: {
            event.preventDefault();
            if (event.repeat) {
                return;
            }
            keys.right = 0;
            debugKeyAction.innerHTML = "released <strong>right</strong>";
            debugKeysState.innerHTML = "<em>" + JSON.stringify(keys) + "</em>";
            break;
        }
        }
    }, false);
    {
        const edges: Edge[] = getSplitEdges(getPartitions([{
            xLower: 0,
            xUpper: WIDTH_BOUND,
            yLower: 0,
            yUpper: HEIGHT_BOUND,
            horizontal: false,
        }]));
        for (let i: number = edges.length - 1; 0 <= i; --i) {
            const edge: Edge = edges[i];
            if (edge.x1 === edge.x2) {
                setVerticalLine(buffer, edge.x1, edge.y1, edge.y2);
            } else if (edge.y1 === edge.y2) {
                setHorizontalLine(buffer, edge.x1, edge.x2, edge.y1);
            }
        }
        for (let _: number = 100; 0 < _; --_) {
            const x: number = Math.floor(Math.random() * GLOBAL.width);
            const y: number = Math.floor(Math.random() * GLOBAL.height);
            const index: number = (y * GLOBAL.width) + x;
            if (buffer[index] === GLOBAL.empty) {
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
    const loop: (frameTime: number) => void = function(frameTime: number) {
        state.frameIncrements += frameTime - state.framePrevTime;
        while (FRAME_STEP < state.frameIncrements) {
            if ((keys.up | keys.down | keys.left | keys.right) === 0) {
                move.x = current.x;
                move.y = current.y;
                state.keyCount = 0;
            } else if (getKeyUp(buffer, keys, current)) {
                move.x = current.x;
                move.y -= FRAME_SPEED;
                target.y = Math.round(move.y);
            } else if (getKeyDown(buffer, keys, current)) {
                move.x = current.x;
                move.y += FRAME_SPEED;
                target.y = Math.round(move.y);
            } else if (getKeyLeft(buffer, keys, current)) {
                move.x -= FRAME_SPEED;
                move.y = current.y;
                target.x = Math.round(move.x);
            } else if (getKeyRight(buffer, keys, current)) {
                move.x += FRAME_SPEED;
                move.y = current.y;
                target.x = Math.round(move.x);
            }
            if ((target.x !== current.x) || (target.y !== current.y)) {
                buffer[(current.y * GLOBAL.width) + current.x] = GLOBAL.empty;
                buffer[(target.y * GLOBAL.width) + target.x] = PLAYER;
                current.x = target.x;
                current.y = target.y;
            }
            state.frameIncrements -= FRAME_STEP;
        }
        setMask(mask, buffer, target);
        setImage(ctx, image, buffer, mask);
        ++state.debugCount;
        const debugElapsed: number = frameTime - state.debugPrevTime;
        if (1000 < debugElapsed) {
            debugFPS.innerHTML = "<strong>" +
                ((state.debugCount / debugElapsed) * 1000).toFixed(2) +
                "</strong> fps";
            state.debugPrevTime = frameTime;
            state.debugCount = 0;
        }
        state.framePrevTime = frameTime;
        requestAnimationFrame(loop);
    };
    loop(0);
};
