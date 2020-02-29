/* global DATA */

"use strict";

var CANVAS = document.getElementById("canvas");
var CTX = CANVAS.getContext("2d");
CTX.scale(CANVAS.width, CANVAS.width);
CTX.translate(0, 0);
CTX.lineWidth = 0.0025;
CTX.strokeStyle = DARK_GRAY;

var TWICE_PI = Math.PI * 2;
var DARK_GRAY = "hsl(0, 0%, 20%)";
var N = DATA.neighbors.length;

function drawCircle(x, y, radius) {
    CTX.moveTo(x + radius, y);
    CTX.arc(x, y, radius, 0, TWICE_PI);
}

function drawCross(x, y, offset) {
    var xA = x - offset;
    var xB = x + offset;
    var yA = y - offset;
    var yB = y + offset;
    CTX.moveTo(xA, yA);
    CTX.lineTo(xB, yB);
    CTX.moveTo(xA, yB);
    CTX.lineTo(xB, yA);
}

function loop() {
    CTX.clearRect(0, 0, 1, 1);
    {
        /* NOTE: Draw search region based on `DATA.point` */
        {
            CTX.beginPath();
            drawCircle(DATA.point.x, DATA.point.y, DATA.point.radius);
            CTX.setLineDash([0.01, 0.01]);
            CTX.stroke();
        }
        {
            CTX.beginPath();
            drawCross(DATA.point.x, DATA.point.y, 0.02);
            CTX.setLineDash([]);
            CTX.stroke();
        }
    }
    (function() {
        /* NOTE: Highlight points where `withinRadius == true` */
        CTX.beginPath();
        for (var i = 0; i < N; i++) {
            var point = DATA.neighbors[i];
            if (point.withinRadius) {
                drawCircle(point.x, point.y, 0.0175);
            }
        }
        CTX.fillStyle = "hsla(" + Math.floor(Math.random() * 360).toString() +
            ", 65%, 50%, 0.4)";
        CTX.fill();
    })();
    (function() {
        /* NOTE: Draw all points */
        CTX.beginPath();
        for (var i = 0; i < N; i++) {
            var point = DATA.neighbors[i];
            drawCircle(point.x, point.y, 0.00625);
        }
        CTX.fillStyle = DARK_GRAY;
        CTX.fill();
    })();
    setTimeout(function() {
        requestAnimationFrame(loop);
    }, 750);
}

loop();
