"use strict";

function main() {
    var i;
    var canvas = document.getElementById("canvas");
    var n = 5;
    var nodes = new Array(n);
    var nodeHeight = 40;
    var nodeWidth = 60;
    var nodeHalfHeight = nodeHeight / 2;
    var nodeHalfWidth = nodeWidth / 2;
    var canvasHalfHeight = canvas.height / 2;
    {
        var k = 15;
        var kHalf = k / 2;
        for (i = 0; i < n; i++) {
            var xOrigin = ((canvas.width / n) * (i + 0.5)) - nodeHalfWidth;
            nodes[i] = {
                xOrigin: xOrigin,
                x: xOrigin + (Math.random() * k) - kHalf,
                y: canvasHalfHeight - nodeHalfHeight + (Math.random() * k) -
                    kHalf,
            };
        }
    }
    {
        var ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        var color = "hsl(0, 0%, 35%)";
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.25;
        {
            var radius = 2.5;
            var piTimes2 = Math.PI * 2;
            var nodeThreeQuarterWidth = nodeWidth * 0.75;
            for (i = 1; i < n; i++) {
                var nodeFrom = nodes[i - 1];
                var nodeTo = nodes[i];
                var xFrom = nodeFrom.x + nodeThreeQuarterWidth;
                var yFrom = nodeFrom.y + nodeHalfHeight;
                var yTo = nodeTo.y + nodeHalfHeight;
                {
                    ctx.setLineDash([]);
                    ctx.strokeRect(nodeFrom.x, nodeFrom.y, nodeWidth,
                                   nodeHeight);
                    ctx.beginPath();
                    ctx.moveTo(xFrom + radius, yFrom);
                    ctx.arc(xFrom, yFrom, radius, 0, piTimes2);
                    ctx.moveTo(nodeTo.x + radius, yTo);
                    ctx.arc(nodeTo.x, yTo, radius, 0, piTimes2);
                    ctx.moveTo(xFrom, yFrom);
                    ctx.lineTo(nodeTo.x, yTo);
                    ctx.stroke();
                    ctx.fill();
                }
                {
                    ctx.setLineDash([1, 2]);
                    ctx.beginPath();
                    var xSep = nodeFrom.x + nodeHalfWidth;
                    var ySep = nodeFrom.y + nodeHeight;
                    ctx.moveTo(xSep, nodeFrom.y);
                    ctx.lineTo(xSep, ySep);
                    ctx.stroke();
                }
            }
        }
        {
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            for (i = 0; i < n; i++) {
                var node = nodes[i];
                var xOriginWidth = node.xOrigin + nodeWidth;
                {
                    var yOver = canvasHalfHeight - nodeHeight;
                    ctx.moveTo(node.xOrigin, yOver);
                    ctx.lineTo(xOriginWidth, yOver);
                }
                {
                    var yUnder = canvasHalfHeight + nodeHeight;
                    ctx.moveTo(node.xOrigin, yUnder);
                    ctx.lineTo(xOriginWidth, yUnder);
                }
            }
            ctx.stroke();
        }
    }
}

main();
