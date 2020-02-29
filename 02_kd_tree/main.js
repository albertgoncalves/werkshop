/* global makeTree, pointInCircle, rangeQuery */

"use strict";

var TWICE_PI = Math.PI * 2;
var DARK_GRAY = "hsl(0, 0%, 20%)";

function drawArc(ctx, x, y, radius) {
    ctx.moveTo(x + radius, y);
    ctx.arc(x, y, radius, 0, TWICE_PI);
}

function drawCross(ctx, x, y, offset) {
    var xA = x - offset;
    var xB = x + offset;
    var yA = y - offset;
    var yB = y + offset;
    ctx.moveTo(xA, yA);
    ctx.lineTo(xB, yB);
    ctx.moveTo(xA, yB);
    ctx.lineTo(xB, yA);
}

function randomColor(alpha) {
    return "hsla(" + Math.floor(Math.random() * 360).toString() +
        ", 65%, 50%, " + alpha.toString() + ")";
}

function drawCircle(ctx, circle) {
    /* NOTE: Draw search region based on `circle` */
    {
        ctx.beginPath();
        drawArc(ctx, circle.x, circle.y, circle.radius);
        ctx.setLineDash([0.01, 0.01]);
        ctx.stroke();
    }
    {
        ctx.beginPath();
        drawCross(ctx, circle.x, circle.y, 0.02);
        ctx.setLineDash([]);
        ctx.stroke();
    }
}

function drawPoints(ctx, points) {
    var i, point;
    var n = points.length;
    /* NOTE: Highlight points where `rectOverlap == true` */
    ctx.beginPath();
    for (i = 0; i < n; i++) {
        point = points[i];
        if (point.rectOverlap) {
            drawArc(ctx, point.x, point.y, 0.035);
        }
    }
    ctx.fillStyle = randomColor(0.2);
    ctx.fill();
    /* NOTE: Highlight points where `withinRadius == true` */
    ctx.beginPath();
    for (i = 0; i < n; i++) {
        point = points[i];
        if (point.withinRadius) {
            drawArc(ctx, point.x, point.y, 0.0175);
        }
    }
    ctx.fillStyle = randomColor(0.4);
    ctx.fill();
    /* NOTE: Draw all points */
    ctx.beginPath();
    for (i = 0; i < n; i++) {
        point = points[i];
        drawArc(ctx, point.x, point.y, 0.0025);
    }
    ctx.fillStyle = DARK_GRAY;
    ctx.fill();
}

window.onload = function() {
    var n = 1000;
    var circle = {
        x: 0.5,
        y: 0.5,
        radius: 0.3,
    };
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
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    {
        ctx.scale(canvas.width, canvas.width);
        ctx.translate(0, 0);
        ctx.lineWidth = 0.002;
        ctx.strokeStyle = DARK_GRAY;
    }
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
            console.time("rangeQuery()");
            rangeQuery(tree, circle, function(point) {
                /* NOTE: When tree node rect intersects with `circle`, test
                 * `tree.point` for intersection with `circle`
                 */
                point.rectOverlap = true;
                if (pointInCircle(point, circle)) {
                    point.withinRadius = true;
                }
            });
            console.timeEnd("rangeQuery()");
        }
        ctx.clearRect(0, 0, 1, 1);
        drawPoints(ctx, points);
        drawCircle(ctx, circle);
    });
    drawPoints(ctx, points);
};
