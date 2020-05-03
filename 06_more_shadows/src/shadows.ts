import {
    GLOBAL,
} from "./global";

const VISIBLE: number = 255;
const HIDDEN: number = 48;

const APERTURE: number = 0.5;

const RADIUS: number = 182;
const RADIUS_SQUARED: number = RADIUS * RADIUS;

export interface Coords {
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

function getBlocked(buffer: Uint8ClampedArray, x: number, y: number): boolean {
    return ((x < 0) || (y < 0) || (GLOBAL.width <= x) ||
            (GLOBAL.height <= y) ||
            (buffer[(GLOBAL.width * y) + x] !== GLOBAL.empty));
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
        const yWidth: number = y * GLOBAL.width;
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
                (0 <= x) && (x < GLOBAL.width) && (0 <= y) &&
                (y < GLOBAL.height))
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
            const yWidth: number = y * GLOBAL.width;
            const yDelta: number = y - current.y;
            if (((xDeltaSquared + (yDelta * yDelta)) < RADIUS_SQUARED) &&
                (0 <= x) && (x < GLOBAL.width) && (0 <= y) &&
                (y < GLOBAL.height))
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

export function setMask(mask: Uint8ClampedArray,
                        buffer: Uint8ClampedArray,
                        current: Coords) {
    mask.fill(HIDDEN);
    mask[(current.y * GLOBAL.width) + current.x] = VISIBLE;
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
