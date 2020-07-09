interface Global {
    width: number;
    height: number;
}

interface Color {
    red: number;
    green: number;
    blue: number;
    alpha: number;
}

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

const GLOBAL: Global = {
    width: 0,
    height: 0,
};

function setRect(buffer: ImageData, rect: Rect, color: Color) {
    for (let y: number = 0; y < rect.height; ++y) {
        const offset: number = ((rect.y + y) << 2) * GLOBAL.width;
        for (let x: number = 0; x < rect.width; ++x) {
            const i: number = ((rect.x + x) << 2) + offset;
            buffer.data[i] = Math.min(buffer.data[i] + color.red, 255);
            buffer.data[i + 1] =
                Math.min(buffer.data[i + 1] + color.green, 255);
            buffer.data[i + 2] =
                Math.min(buffer.data[i + 2] + color.blue, 255);
            buffer.data[i + 3] =
                Math.min(buffer.data[i + 3] + color.alpha, 255);
        }
    }
}

window.onload = function() {
    const canvas: HTMLCanvasElement =
        document.getElementById("canvas") as HTMLCanvasElement;
    const ctx: CanvasRenderingContext2D =
        canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    GLOBAL.width = canvas.width;
    GLOBAL.height = canvas.height;
    const halfWidth: number = GLOBAL.width / 2.0;
    const halfHeight: number = GLOBAL.height / 2.0;
    const n: number = GLOBAL.width * GLOBAL.height * 4;
    if (n === 0) {
        return;
    }
    const rect: Rect = {
        x: 64,
        y: 64,
        width: 128,
        height: 128,
    };
    if ((rect.x < 0.0) || (GLOBAL.width <= (rect.x + rect.width)) ||
        (rect.y < 0.0) || (GLOBAL.height <= (rect.y + rect.height)) ||
        (rect.width < 0.0) || (halfWidth <= rect.width) ||
        (rect.height < 0.0) || (halfHeight <= rect.height))
    {
        return;
    }
    const color: Color = {
        red: 6,
        green: 9,
        blue: 12,
        alpha: 8,
    };
    const decay: number = 1;
    const spread: number = 32.0;
    const halfSpread: number = spread / 2.0;
    const buffer: ImageData = ctx.createImageData(GLOBAL.width, GLOBAL.height);
    function loop() {
        {
            let x = rect.x + (Math.random() * spread) - halfSpread;
            while ((x < 0.0) || (GLOBAL.width <= (x + rect.width))) {
                x = rect.x + (Math.random() * spread) - halfSpread;
            }
            rect.x = x;
        }
        {
            let y = rect.y + (Math.random() * spread) - halfSpread;
            while ((y < 0.0) || (GLOBAL.height <= (y + rect.height))) {
                y = rect.y + (Math.random() * spread) - halfSpread;
            }
            rect.y = y;
        }
        {
            let width = rect.width + (Math.random() * spread) - halfSpread;
            while ((width < 0.0) || (halfWidth <= width)) {
                width = rect.width + (Math.random() * spread) - halfSpread;
            }
            rect.width = width;
        }
        {
            let height = rect.height + (Math.random() * spread) - halfSpread;
            while ((height < 0.0) || (halfHeight <= height)) {
                height = rect.height + (Math.random() * spread) - halfSpread;
            }
            rect.height = height;
        }
        for (let i: number = 0; i < n; i += 4) {
            buffer.data[i] = Math.max(buffer.data[i] - decay, 0);
            buffer.data[i + 1] = Math.max(buffer.data[i + 1] - decay, 0);
            buffer.data[i + 2] = Math.max(buffer.data[i + 2] - decay, 0);
            buffer.data[i + 3] = Math.max(buffer.data[i + 3] - decay, 0);
        }
        setRect(buffer, rect, color);
        ctx.putImageData(buffer, 0, 0);
        window.requestAnimationFrame(loop);
    }
    loop();
};
