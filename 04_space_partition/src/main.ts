function setVerticalLine(buffer: ImageData, width: number, x: number,
                         yStart: number, yEnd: number) {
    const start: number = (yStart * width) + x;
    const end: number = (yEnd * width) + x;
    for (let i: number = start; i < end; i += width) {
        const index: number = i << 2;
        buffer.data[index] = 0;
        buffer.data[index + 1] = 0;
        buffer.data[index + 2] = 0;
        buffer.data[index + 3] = 255;
    }
}

function setHorizontalLine(buffer: ImageData, width: number, xStart: number,
                           xEnd: number, y: number) {
    const yWidth: number = y * width;
    const start: number = yWidth + xStart;
    const end: number = yWidth + xEnd;
    for (let i: number = start; i < end; i++) {
        const index: number = i << 2;
        buffer.data[index] = 0;
        buffer.data[index + 1] = 0;
        buffer.data[index + 2] = 0;
        buffer.data[index + 3] = 255;
    }
}

window.onload = function() {
    const canvas: HTMLCanvasElement =
        document.getElementById("canvas") as HTMLCanvasElement;
    const ctx: CanvasRenderingContext2D =
        canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    const width: number = canvas.width;
    const height: number = canvas.height;
    const buffer: ImageData = ctx.createImageData(width, height);
    {
        const xStart: number = 0;
        const xEnd: number = width;
        const y: number = Math.floor(Math.random() * height);
        setHorizontalLine(buffer, width, xStart, xEnd, y);
        {
            const yStart: number = 0;
            const yEnd: number = y;
            const x: number = Math.floor(Math.random() * width);
            setVerticalLine(buffer, width, x, yStart, yEnd);
        }
        {
            const yStart: number = y;
            const yEnd: number = height;
            const x: number = Math.floor(Math.random() * width);
            setVerticalLine(buffer, width, x, yStart, yEnd);
        }
    }
    ctx.putImageData(buffer, 0, 0);
    console.log("Ready!");
};
