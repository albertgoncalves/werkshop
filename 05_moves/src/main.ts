const CANVAS_SCALE: number = 4;

const DARK_GRAY: number = 32;
const GRAY: number = 208;

const OPAQUE_1: number = 255;
const OPAQUE_2: number = 215;
const OPAQUE_3: number = 175;
const OPAQUE_4: number = 135;
const TRANSPARENT: number = 0;

const RADIUS: number = 12;
const RADIUS_SQUARED: number = RADIUS * RADIUS;

const K: number = 0.495;

interface Position_ {
    x: number;
    y: number;
}

interface Octal {
    xMult: number;
    yMult: number;
    xStart: number;
    yStart: number;
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
    for (let i: number = buffer.length; 0 <= i; i--) {
        const color: number = buffer[i];
        const index: number = i << 2;
        image.data[index] = color;
        image.data[index + 1] = color;
        image.data[index + 2] = color;
        image.data[index + 3] = mask[i];
    }
    ctx.putImageData(image, 0, 0);
}

function setMaskColRow(mask: Uint8ClampedArray, position: Position_,
                       octal: Octal, width: number, height: number) {
    for (let dY: number = octal.yStart; dY < RADIUS; dY++) {
        const y: number = position.y + (dY * octal.yMult);
        if ((y < 0) || (height < y)) {
            break;
        }
        const yWidth: number = y * width;
        const yDelta = y - position.y;
        const yDeltaSquared = yDelta * yDelta;
        for (let dX: number = octal.xStart; dX <= dY; dX++) {
            const x: number = position.x + (dX * octal.xMult);
            if ((x < 0) || (width <= x)) {
                break;
            }
            const xDelta = x - position.x;
            if (((xDelta * xDelta) + yDeltaSquared) < RADIUS_SQUARED) {
                if (octal.xMult === 1) {
                    mask[yWidth + x] = OPAQUE_1;
                } else {
                    mask[yWidth + x] = OPAQUE_2;
                }
            }
        }
    }
}

function setMaskRowCol(mask: Uint8ClampedArray, position: Position_,
                       octal: Octal, width: number, height: number) {
    for (let dX: number = octal.xStart; dX < RADIUS; dX++) {
        const x: number = position.x + (dX * octal.xMult);
        if ((x < 0) || (width <= x)) {
            break;
        }
        const xDelta: number = x - position.x;
        for (let dY: number = octal.yStart; dY <= dX; dY++) {
            const y: number = position.y + (dY * octal.yMult);
            if ((y < 0) || (height < y)) {
                break;
            }
            const yWidth: number = y * width;
            const yDelta = y - position.y;
            if (((xDelta * xDelta) + (yDelta * yDelta)) < RADIUS_SQUARED) {
                if (octal.yMult === 1) {
                    mask[yWidth + x] = OPAQUE_3;
                } else {
                    mask[yWidth + x] = OPAQUE_4;
                }
            }
        }
    }
}

function setMask(mask: Uint8ClampedArray, position: Position_, width: number,
                 height: number) {
    mask.fill(TRANSPARENT);
    mask[(position.y * width) + position.x] = OPAQUE_1;
    setMaskColRow(mask, position, {
        xMult: 1,
        yMult: 1,
        xStart: 0,
        yStart: 1,
    },
                  width, height);
    setMaskColRow(mask, position, {
        xMult: 1,
        yMult: -1,
        xStart: 0,
        yStart: 1,
    },
                  width, height);
    setMaskColRow(mask, position, {
        xMult: -1,
        yMult: 1,
        xStart: 0,
        yStart: 1,
    },
                  width, height);
    setMaskColRow(mask, position, {
        xMult: -1,
        yMult: -1,
        xStart: 0,
        yStart: 1,
    },
                  width, height);
    setMaskRowCol(mask, position, {
        xMult: 1,
        yMult: 1,
        xStart: 1,
        yStart: 0,
    },
                  width, height);
    setMaskRowCol(mask, position, {
        xMult: 1,
        yMult: -1,
        xStart: 1,
        yStart: 0,
    },
                  width, height);
    setMaskRowCol(mask, position, {
        xMult: -1,
        yMult: 1,
        xStart: 1,
        yStart: 0,
    },
                  width, height);
    setMaskRowCol(mask, position, {
        xMult: -1,
        yMult: -1,
        xStart: 1,
        yStart: 0,
    },
                  width, height);
}

window.onload = function() {
    const canvas: HTMLCanvasElement =
        document.getElementById("canvas") as HTMLCanvasElement;
    const ctx: CanvasRenderingContext2D =
        canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    const width: number = canvas.width;
    const height: number = canvas.height;
    const n: number = width * height;
    const image: ImageData = ctx.createImageData(width, height);
    const buffer: Uint8ClampedArray = new Uint8ClampedArray(n);
    const mask: Uint8ClampedArray = new Uint8ClampedArray(n);
    buffer.fill(GRAY);
    const position: Position_ = {
        x: 15,
        y: 15,
    };
    {
        setVerticalLine(buffer, width, 6, 10, 20);
        setVerticalLine(buffer, width, 25, 10, 20);
        setHorizontalLine(buffer, width, 7, 24, 5);
        setHorizontalLine(buffer, width, 7, 24, 26);
        buffer[(position.y * width) + position.x] = DARK_GRAY;
        setMask(mask, position, width, height);
        setImage(ctx, image, buffer, mask);
    }
    canvas.addEventListener("mousedown", function(event: MouseEvent) {
        const x = (event.x - canvas.offsetLeft) >> CANVAS_SCALE;
        const y = (event.y - canvas.offsetTop) >> CANVAS_SCALE;
        const index: number = (y * width) + x;
        if (buffer[index] === GRAY) {
            buffer[(position.y * width) + position.x] = GRAY;
            buffer[index] = DARK_GRAY;
            position.x = x;
            position.y = y;
            mask.fill(TRANSPARENT);
            mask[(position.y * width) + position.x] = OPAQUE_1;
            setMask(mask, position, width, height);
            setImage(ctx, image, buffer, mask);
        }
    });
};
