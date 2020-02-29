/* global makeTree, pointInCircle, radiusSearch */

"use strict";

var TWICE_PI = Math.PI * 2;

function drawArc(ctx, x, y, radius) {
    ctx.moveTo(x + radius, y);
    ctx.arc(x, y, radius, 0, TWICE_PI);
}

function drawCross(ctx, x, y, radius) {
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x, y + radius);
    ctx.moveTo(x - radius, y);
    ctx.lineTo(x + radius, y);
}

function randomColor(alpha) {
    return "hsla(" + Math.floor(Math.random() * 360).toString() +
        ", 65%, 50%, " + alpha.toString() + ")";
}

function drawPoints(ctx, points) {
    var i, point;
    var n = points.length;
    {
        /* NOTE: Highlight points where `rectOverlap == true` */
        ctx.beginPath();
        for (i = 0; i < n; i++) {
            point = points[i];
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
        for (i = 0; i < n; i++) {
            point = points[i];
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
        for (i = 0; i < n; i++) {
            point = points[i];
            drawArc(ctx, point.x, point.y, 0.0025);
        }
        ctx.fillStyle = "hsl(0, 0%, 20%)";
        ctx.fill();
    }
}

window.onload = function() {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    {
        ctx.scale(canvas.width, canvas.height);
        ctx.translate(0, 0);
        ctx.lineWidth = 0.0065;
        ctx.strokeStyle = "hsla(0, 0%, 100%, 0.875)";
    }
    var n = 2000;
    var circle = {
        x: 0.5,
        y: 0.5,
        radius: 0.3,
        radiusSquared: null,
    };
    circle.radiusSquared = circle.radius * circle.radius;
    var points = new Array(n);
    for (var i = 0; i < n; i++) {
        points[i] = {
            x: Math.random(),
            y: Math.random(),
            rectOverlap: false,
            withinRadius: false,
        };
    }
    var tree;
    {
        console.time("makeTree()");
        tree = makeTree(points, 0, 0, 1, 0, 1);
        console.timeEnd("makeTree()");
    }
    drawPoints(ctx, points);
    canvas.addEventListener("click", function(event) {
        circle.x = (event.clientX - canvas.offsetLeft) / canvas.width;
        circle.y = (event.clientY - canvas.offsetTop) / canvas.height;
        /* NOTE: Reset all points */
        for (var i = 0; i < n; i++) {
            var point = points[i];
            point.rectOverlap = false;
            point.withinRadius = false;
        }
        {
            /* NOTE: Search tree for points within `circle.radius` */
            console.time("radiusSearch()");
            radiusSearch(tree, circle, function(point) {
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
