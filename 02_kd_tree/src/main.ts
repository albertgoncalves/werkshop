import {
    Circle,
    makeTree,
    Point,
    pointInCircle,
    radiusSearch,
    Tree,
} from "./kdtree";

const TWICE_PI: number = Math.PI * 2;

function drawArc(ctx: CanvasRenderingContext2D, x: number, y: number,
                 radius: number) {
    ctx.moveTo(x + radius, y);
    ctx.arc(x, y, radius, 0, TWICE_PI);
}

function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number,
                   radius: number) {
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x, y + radius);
    ctx.moveTo(x - radius, y);
    ctx.lineTo(x + radius, y);
}

function randomColor(alpha: number) {
    return "hsla(" + Math.floor(Math.random() * 360).toString() +
        ", 65%, 50%, " + alpha.toString() + ")";
}

function drawPoints(ctx: CanvasRenderingContext2D, points: Point[]) {
    const n: number = points.length;
    {
        /* NOTE: Highlight points where `rectOverlap == true` */
        ctx.beginPath();
        for (let i: number = 0; i < n; i++) {
            const point: Point = points[i];
            if (point.rectOverlap) {
                drawArc(ctx, point.x, point.y, 0.035);
            }
        }
        ctx.fillStyle = randomColor(0.25);
        ctx.fill();
    }
    {
        /* NOTE: Highlight points where `withinRadius == true` */
        ctx.beginPath();
        for (let i: number = 0; i < n; i++) {
            const point: Point = points[i];
            if (point.withinRadius) {
                drawArc(ctx, point.x, point.y, 0.0175);
            }
        }
        ctx.fillStyle = randomColor(0.5);
        ctx.fill();
    }
    {
        /* NOTE: Draw all points */
        ctx.beginPath();
        for (let i: number = 0; i < n; i++) {
            const point: Point = points[i];
            drawArc(ctx, point.x, point.y, 0.0025);
        }
        ctx.fillStyle = "hsl(0, 0%, 20%)";
        ctx.fill();
    }
}

window.onload = function() {
    const canvas: HTMLCanvasElement =
        document.getElementById("canvas") as HTMLCanvasElement;
    const ctx: CanvasRenderingContext2D =
        canvas.getContext("2d") as CanvasRenderingContext2D;
    {
        ctx.scale(canvas.width, canvas.height);
        ctx.translate(0, 0);
        ctx.lineWidth = 0.0065;
        ctx.strokeStyle = "hsla(0, 0%, 100%, 0.875)";
    }
    const n: number = 2000;
    const radius: number = 0.3;
    const circle: Circle = {
        x: 0.5,
        y: 0.5,
        radius,
        radiusSquared: radius * radius,
    };
    const points: Point[] = new Array(n);
    for (let i: number = 0; i < n; i++) {
        points[i] = {
            x: Math.random(),
            y: Math.random(),
            rectOverlap: false,
            withinRadius: false,
        };
    }
    console.time("makeTree()");
    const tree: Tree|null = makeTree(points, true, {
        xLower: 0,
        xUpper: 1,
        yLower: 0,
        yUpper: 1,
    });
    console.timeEnd("makeTree()");
    drawPoints(ctx, points);
    canvas.addEventListener("click", function(event: MouseEvent) {
        circle.x = (event.clientX - canvas.offsetLeft) / canvas.width;
        circle.y = (event.clientY - canvas.offsetTop) / canvas.height;
        /* NOTE: Reset all points */
        for (let i: number = 0; i < n; i++) {
            const point: Point = points[i];
            point.rectOverlap = false;
            point.withinRadius = false;
        }
        {
            /* NOTE: Search tree for points within `circle.radius` */
            console.time("radiusSearch()");
            radiusSearch(tree, circle, function(point: Point) {
                /* NOTE: When tree node rect intersects with `circle`, test
                 * `tree.point` for intersection with `circle`
                 */
                point.rectOverlap = true;
                if (pointInCircle(point, circle)) {
                    point.withinRadius = true;
                }
            });
            console.timeEnd("radiusSearch()");
        }
        ctx.clearRect(0, 0, 1, 1);
        drawPoints(ctx, points);
        {
            /* NOTE: Draw search region based on `circle` */
            ctx.beginPath();
            drawArc(ctx, circle.x, circle.y, circle.radius);
            drawCross(ctx, circle.x, circle.y, 0.035);
            ctx.stroke();
        }
    });
};
