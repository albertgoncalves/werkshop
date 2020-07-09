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

window.onload = function() {
    const canvas: HTMLCanvasElement =
        document.getElementById("canvas") as HTMLCanvasElement;
    const ctx: CanvasRenderingContext2D =
        canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    const buffer: ImageData = ctx.createImageData(canvas.width, canvas.height);
    const decay: number = 2;
    const spread: number = 4.0;
    const halfSpread: number = spread / 2.0;
    const epsilon: number = 0.015;
    const n: number = canvas.width * canvas.height * 4;
    const initRect: Rect = {
        x: 20,
        y: 20,
        width: 24,
        height: 24,
    };
    let rect: Rect = {
        ...initRect,
    };
    const color: Color = {
        red: 12,
        green: 18,
        blue: 24,
        alpha: 4,
    };
    function loop() {
        rect.x += Math.round((Math.random() * spread) - halfSpread - epsilon);
        rect.y += Math.round((Math.random() * spread) - halfSpread - epsilon);
        for (let i: number = 0; i < n; i += 4) {
            buffer.data[i] = Math.max(buffer.data[i] - decay, 0);
            buffer.data[i + 1] = Math.max(buffer.data[i + 1] - decay, 0);
            buffer.data[i + 2] = Math.max(buffer.data[i + 2] - decay, 0);
            buffer.data[i + 3] = Math.max(buffer.data[i + 3] - decay, 0);
        }
        let reset: boolean = true;
        for (let y: number = rect.y + rect.height - 1; rect.y <= y; --y) {
            if (y < 0) {
                break;
            }
            if (canvas.height <= y) {
                continue;
            }
            const offset: number = (y << 2) * canvas.width;
            for (let x: number = rect.x + rect.width - 1; rect.x <= x; --x) {
                if (x < 0) {
                    break;
                }
                if (canvas.width <= x) {
                    continue;
                }
                const i: number = (x << 2) + offset;
                buffer.data[i] = Math.min(buffer.data[i] + color.red, 255);
                buffer.data[i + 1] =
                    Math.min(buffer.data[i + 1] + color.green, 255);
                buffer.data[i + 2] =
                    Math.min(buffer.data[i + 2] + color.blue, 255);
                buffer.data[i + 3] =
                    Math.min(buffer.data[i + 3] + color.alpha, 255);
                if (reset) {
                    reset = false;
                }
            }
        }
        if (reset) {
            rect = {
                ...initRect,
            };
        }
        ctx.putImageData(buffer, 0, 0);
        window.requestAnimationFrame(loop);
    }
    loop();
};
