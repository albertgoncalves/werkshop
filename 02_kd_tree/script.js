/* global DATA */

"use strict";

var DARK_GRAY = "hsl(0, 0%, 20%)";
var RED = "hsla(10, 65%, 50%, 0.5)";

var TWICE_PI = Math.PI * 2;

function drawCircle(ctx, x, y, radius) {
    ctx.moveTo(x + radius, y);
    ctx.arc(x, y, radius, 0, TWICE_PI);
}

function drawCross(ctx, x, y, l) {
    var xA = x - l;
    var xB = x + l;
    var yA = y - l;
    var yB = y + l;
    ctx.moveTo(xA, yA);
    ctx.lineTo(xB, yB);
    ctx.moveTo(xA, yB);
    ctx.lineTo(xB, yA);
}

function main() {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.scale(canvas.width, canvas.width);
    ctx.translate(0, 0);
    ctx.imageSmoothingEnabled = true;
    {
        /* NOTE: Draw search region based on `DATA.point` */
        ctx.lineWidth = 0.0025;
        ctx.strokeStyle = DARK_GRAY;
        {
            ctx.beginPath();
            drawCircle(ctx, DATA.point.x, DATA.point.y, DATA.point.radius);
            ctx.setLineDash([0.01, 0.01]);
            ctx.stroke();
        }
        (function() {
            ctx.beginPath();
            drawCross(ctx, DATA.point.x, DATA.point.y, 0.02);
            ctx.setLineDash([]);
            ctx.stroke();
        })();
    }
    (function() {
        var n = DATA.neighbors.length;
        (function() {
            /* NOTE: Highlight points where `withinRadius == true` */
            ctx.beginPath();
            for (var i = 0; i < n; i++) {
                var point = DATA.neighbors[i];
                if (point.withinRadius) {
                    drawCircle(ctx, point.x, point.y, 0.015);
                }
            }
            ctx.fillStyle = RED;
            ctx.fill();
        })();
        (function() {
            /* NOTE: Draw all points */
            ctx.beginPath();
            for (var i = 0; i < n; i++) {
                var point = DATA.neighbors[i];
                drawCircle(ctx, point.x, point.y, 0.00625);
            }
            ctx.fillStyle = DARK_GRAY;
            ctx.fill();
        })();
    })();
}

main();
