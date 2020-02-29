"use strict";

function main() {
    var canvas = document.getElementById("canvas");
    var n = (Math.floor(Math.random() * 4) + 3);
    var nodes = new Array(n);
    var nodeHeight = 45;
    var nodeWidth = 60;
    var nodeHalfHeight = nodeHeight / 2;
    var nodeHalfWidth = nodeWidth / 2;
    var canvasHalfHeight = canvas.height / 2;
    var canvasWidthSlice = canvas.width / n;
    (function() {
        /* NOTE: Initialize `nodes` */
        var k = 15;
        var kHalf = k / 2;
        for (var i = 0; i < n; i++) {
            var xOrigin = (canvasWidthSlice * (i + 0.5)) - nodeHalfWidth;
            nodes[i] = {
                xOrigin: xOrigin,
                x: xOrigin + (Math.random() * k) - kHalf,
                y: canvasHalfHeight - nodeHalfHeight + (Math.random() * k) -
                    kHalf,
            };
        }
    })();
    (function() {
        /* NOTE: Draw everything */
        var ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        var color = "hsl(0, 0%, 20%)";
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.65;
        (function() {
            /* NOTE: Draw `nodes` surroundings */
            var yOver = canvasHalfHeight - nodeHeight;
            var yUnder = canvasHalfHeight + nodeHeight;
            ctx.setLineDash([2.25, 3]);
            var canvasPadWidth = 10;
            ctx.strokeRect(canvasPadWidth, yUnder,
                           canvasWidthSlice - (canvasPadWidth * 2),
                           yOver - yUnder);
            ctx.beginPath();
            for (var i = 1; i < n; i++) {
                var node = nodes[i];
                var xOriginOffset = node.xOrigin + nodeWidth;
                ctx.moveTo(node.xOrigin, yOver);
                ctx.lineTo(xOriginOffset, yOver);
                ctx.moveTo(node.xOrigin, yUnder);
                ctx.lineTo(xOriginOffset, yUnder);
            }
            ctx.stroke();
        })();
        (function() {
            /* NOTE: Draw `nodes` rects and pointers */
            var radius = 2.5;
            var twicePi = Math.PI * 2;
            var nodeThreeQuarterWidth = nodeWidth * 0.75;
            ctx.setLineDash([]);
            ctx.beginPath();
            for (var i = 1; i < n; i++) {
                var nodeFrom = nodes[i - 1];
                var nodeTo = nodes[i];
                var xFrom = nodeFrom.x + nodeThreeQuarterWidth;
                var yFrom = nodeFrom.y + nodeHalfHeight;
                var yTo = nodeTo.y + nodeHalfHeight;
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
        })();
        (function() {
            /* NOTE: Draw `nodes` separator details */
            ctx.setLineDash([1, 2]);
            ctx.beginPath();
            var m = n - 1;
            for (var i = 0; i < m; i++) {
                var node = nodes[i];
                var xSep = node.x + nodeHalfWidth;
                ctx.moveTo(xSep, node.y);
                ctx.lineTo(xSep, node.y + nodeHeight);
            }
            ctx.stroke();
        })();
    })();
}

main();
