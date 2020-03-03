"use strict";

interface Node_ {
    xOrigin: number;
    x: number;
    y: number;
}

function main() {
    const canvas: HTMLCanvasElement =
        document.getElementById("canvas") as HTMLCanvasElement;
    const n: number = (Math.floor(Math.random() * 4) + 3);
    const nodes: Node_[] = new Array(n);
    const nodeHeight: number = 45;
    const nodeWidth: number = 60;
    const nodeHalfHeight: number = nodeHeight / 2;
    const nodeHalfWidth: number = nodeWidth / 2;
    const canvasHalfHeight: number = canvas.height / 2;
    const canvasWidthSlice: number = canvas.width / n;
    {
        /* NOTE: Initialize `nodes` */
        const k: number = 15;
        const kHalf: number = k / 2;
        for (let i: number = 0; i < n; i++) {
            const xOrigin: number =
                (canvasWidthSlice * (i + 0.5)) - nodeHalfWidth;
            nodes[i] = {
                xOrigin,
                x: xOrigin + (Math.random() * k) - kHalf,
                y: canvasHalfHeight - nodeHalfHeight + (Math.random() * k) -
                    kHalf,
            };
        }
    }
    {
        /* NOTE: Draw everything */
        const ctx: CanvasRenderingContext2D =
            canvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.imageSmoothingEnabled = true;
        const color: string = "hsl(0, 0%, 20%)";
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.65;
        {
            /* NOTE: Draw `nodes` surroundings */
            const yOver: number = canvasHalfHeight - nodeHeight;
            const yUnder: number = canvasHalfHeight + nodeHeight;
            ctx.setLineDash([2.25, 3]);
            const canvasPadWidth: number = 10;
            ctx.strokeRect(canvasPadWidth, yUnder,
                           canvasWidthSlice - (canvasPadWidth * 2),
                           yOver - yUnder);
            ctx.beginPath();
            for (let i: number = 1; i < n; i++) {
                const node: Node_ = nodes[i];
                const xOriginOffset: number = node.xOrigin + nodeWidth;
                ctx.moveTo(node.xOrigin, yOver);
                ctx.lineTo(xOriginOffset, yOver);
                ctx.moveTo(node.xOrigin, yUnder);
                ctx.lineTo(xOriginOffset, yUnder);
            }
            ctx.stroke();
        }
        {
            /* NOTE: Draw `nodes` rects and pointers */
            const radius: number = 2.5;
            const twicePi: number = Math.PI * 2;
            const nodeThreeQuarterWidth: number = nodeWidth * 0.75;
            ctx.setLineDash([]);
            ctx.beginPath();
            for (let i: number = 1; i < n; i++) {
                const nodeFrom: Node_ = nodes[i - 1];
                const nodeTo: Node_ = nodes[i];
                const xFrom: number = nodeFrom.x + nodeThreeQuarterWidth;
                const yFrom: number = nodeFrom.y + nodeHalfHeight;
                const yTo: number = nodeTo.y + nodeHalfHeight;
                ctx.strokeRect(nodeFrom.x, nodeFrom.y, nodeWidth, nodeHeight);
                ctx.moveTo(xFrom + radius, yFrom);
                ctx.arc(xFrom, yFrom, radius, 0, twicePi);
                ctx.moveTo(nodeTo.x + radius, yTo);
                ctx.arc(nodeTo.x, yTo, radius, 0, twicePi);
                ctx.moveTo(xFrom, yFrom);
                ctx.lineTo(nodeTo.x, yTo);
            }
            ctx.stroke();
            ctx.fill();
        }
        {
            /* NOTE: Draw `nodes` separator details */
            ctx.setLineDash([1, 2]);
            ctx.beginPath();
            const m: number = n - 1;
            for (let i: number = 0; i < m; i++) {
                const node: Node_ = nodes[i];
                const xSep: number = node.x + nodeHalfWidth;
                ctx.moveTo(xSep, node.y);
                ctx.lineTo(xSep, node.y + nodeHeight);
            }
            ctx.stroke();
        }
    }
}

main();
