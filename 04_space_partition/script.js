(function () {
    var defines = {};
    var entry = [null];
    function define(name, dependencies, factory) {
        defines[name] = { dependencies: dependencies, factory: factory };
        entry[0] = name;
    }
    define("require", ["exports"], function (exports) {
        Object.defineProperty(exports, "__cjsModule", { value: true });
        Object.defineProperty(exports, "default", { value: function (name) { return resolve(name); } });
    });
    "use strict";
    var DEBUG = true;
    var DARK_GRAY = 64;
    var GRAY = 128;
    var WHITE = 255;
    var COLOR_R = 75;
    var COLOR_G = 155;
    var COLOR_B = 250;
    var MIN_DELTA = 1 << 5;
    var MIN_SPLIT = (1 << 3) + 1;
    var PAD = MIN_SPLIT >> 1;
    var PAD_DOUBLE = PAD << 1;
    var N = 100;
    function setVerticalLine(buffer, width, x, yStart, yEnd) {
        var start = ((yStart + 1) * width) + x;
        var end = (yEnd * width) + x;
        for (var i = start; i < end; i += width) {
            var index = i << 2;
            buffer.data[index] = WHITE;
            buffer.data[index + 1] = WHITE;
            buffer.data[index + 2] = WHITE;
        }
        {
            var index = ((yStart * width) + x) << 2;
            if (DEBUG) {
                buffer.data[index] = COLOR_R;
                buffer.data[index + 1] = COLOR_G;
                buffer.data[index + 2] = COLOR_B;
            }
            else {
                buffer.data[index] = WHITE;
                buffer.data[index + 1] = WHITE;
                buffer.data[index + 2] = WHITE;
            }
        }
        {
            var index = end << 2;
            if (DEBUG) {
                buffer.data[index] = COLOR_R;
                buffer.data[index + 1] = COLOR_G;
                buffer.data[index + 2] = COLOR_B;
            }
            else {
                buffer.data[index] = WHITE;
                buffer.data[index + 1] = WHITE;
                buffer.data[index + 2] = WHITE;
            }
        }
    }
    function setHorizontalLine(buffer, width, xStart, xEnd, y) {
        var yWidth = y * width;
        var start = yWidth + xStart;
        var end = yWidth + xEnd;
        for (var i = start + 1; i < end; i++) {
            var index = i << 2;
            buffer.data[index] = WHITE;
            buffer.data[index + 1] = WHITE;
            buffer.data[index + 2] = WHITE;
        }
        {
            var index = start << 2;
            if (DEBUG) {
                buffer.data[index] = COLOR_R;
                buffer.data[index + 1] = COLOR_G;
                buffer.data[index + 2] = COLOR_B;
            }
            else {
                buffer.data[index] = WHITE;
                buffer.data[index + 1] = WHITE;
                buffer.data[index + 2] = WHITE;
            }
        }
        {
            var index = end << 2;
            if (DEBUG) {
                buffer.data[index] = COLOR_R;
                buffer.data[index + 1] = COLOR_G;
                buffer.data[index + 2] = COLOR_B;
            }
            else {
                buffer.data[index] = WHITE;
                buffer.data[index + 1] = WHITE;
                buffer.data[index + 2] = WHITE;
            }
        }
    }
    function getPartitions(stack) {
        var edges = [];
        var partition = stack.pop();
        while (partition) {
            if (partition.horizontal) {
                var yDelta = partition.yUpper - partition.yLower;
                for (var i = N; 0 < i; i--) {
                    var y = Math.floor(Math.random() * yDelta) + partition.yLower;
                    if (!(((y - MIN_SPLIT) < partition.yLower) ||
                        (partition.yUpper < (y + MIN_SPLIT)))) {
                        edges.push({
                            x1: partition.xLower,
                            y1: y,
                            x2: partition.xUpper,
                            y2: y
                        });
                        if (MIN_DELTA < (partition.xUpper - partition.xLower)) {
                            stack.push({
                                xLower: partition.xLower,
                                xUpper: partition.xUpper,
                                yLower: partition.yLower,
                                yUpper: y,
                                horizontal: false
                            });
                            stack.push({
                                xLower: partition.xLower,
                                xUpper: partition.xUpper,
                                yLower: y,
                                yUpper: partition.yUpper,
                                horizontal: false
                            });
                        }
                        break;
                    }
                }
            }
            else {
                var xDelta = partition.xUpper - partition.xLower;
                for (var i = N; 0 < i; i--) {
                    var x = Math.floor(Math.random() * xDelta) + partition.xLower;
                    if (!(((x - MIN_SPLIT) < partition.xLower) ||
                        (partition.xUpper < (x + MIN_SPLIT)))) {
                        edges.push({
                            x1: x,
                            y1: partition.yLower,
                            x2: x,
                            y2: partition.yUpper
                        });
                        if (MIN_DELTA < (partition.yUpper - partition.yLower)) {
                            stack.push({
                                xLower: partition.xLower,
                                xUpper: x,
                                yLower: partition.yLower,
                                yUpper: partition.yUpper,
                                horizontal: true
                            });
                            stack.push({
                                xLower: x,
                                xUpper: partition.xUpper,
                                yLower: partition.yLower,
                                yUpper: partition.yUpper,
                                horizontal: true
                            });
                        }
                        break;
                    }
                }
            }
            partition = stack.pop();
        }
        return edges;
    }
    function getSplitEdges(preEdges) {
        var edges = [];
        for (var i = preEdges.length - 1; 0 <= i; i--) {
            var edge = preEdges[i];
            if (edge.x1 === edge.x2) {
                var x = edge.x1;
                var neighbors = [edge.y1, edge.y2];
                for (var j = preEdges.length - 1; 0 <= j; j--) {
                    if (i === j) {
                        continue;
                    }
                    var candidate = preEdges[j];
                    if ((candidate.y1 === candidate.y2) &&
                        ((edge.y1 < candidate.y1) && (candidate.y1 < edge.y2)) &&
                        ((candidate.x1 === x) || (candidate.x2 === x))) {
                        neighbors.push(candidate.y1);
                    }
                }
                neighbors.sort(function (a, b) {
                    return a - b;
                });
                for (var k = neighbors.length - 1; 0 < k; k--) {
                    var y1 = neighbors[k - 1];
                    var y2 = neighbors[k];
                    var yDelta = y2 - y1;
                    if (yDelta !== 0) {
                        if (yDelta <= MIN_SPLIT) {
                            edges.push({
                                x1: x,
                                y1: y1,
                                x2: x,
                                y2: y2
                            });
                        }
                        else {
                            var ySplit = Math.floor(Math.random() * (yDelta - PAD_DOUBLE)) +
                                y1 + PAD;
                            edges.push({
                                x1: x,
                                y1: y1,
                                x2: x,
                                y2: ySplit - PAD
                            });
                            edges.push({
                                x1: x,
                                y1: ySplit + PAD,
                                x2: x,
                                y2: y2
                            });
                        }
                    }
                }
            }
            else if (edge.y1 === edge.y2) {
                var y = edge.y1;
                var neighbors = [edge.x1, edge.x2];
                for (var j = preEdges.length - 1; 0 <= j; j--) {
                    if (i === j) {
                        continue;
                    }
                    var candidate = preEdges[j];
                    if ((candidate.x1 === candidate.x2) &&
                        ((edge.x1 < candidate.x1) && (candidate.x1 < edge.x2)) &&
                        ((candidate.y1 === y) || (candidate.y2 === y))) {
                        neighbors.push(candidate.x1);
                    }
                }
                neighbors.sort(function (a, b) {
                    return a - b;
                });
                for (var k = neighbors.length - 1; 0 < k; k--) {
                    var x1 = neighbors[k - 1];
                    var x2 = neighbors[k];
                    var xDelta = x2 - x1;
                    if (xDelta !== 0) {
                        if (xDelta <= MIN_SPLIT) {
                            edges.push({
                                x1: x1,
                                y1: y,
                                x2: x2,
                                y2: y
                            });
                        }
                        else {
                            var xSplit = Math.floor(Math.random() * (xDelta - PAD_DOUBLE)) +
                                x1 + PAD;
                            edges.push({
                                x1: x1,
                                y1: y,
                                x2: xSplit - PAD,
                                y2: y
                            });
                            edges.push({
                                x1: xSplit + PAD,
                                y1: y,
                                x2: x2,
                                y2: y
                            });
                        }
                    }
                }
            }
        }
        return edges;
    }
    window.onload = function () {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        var width = canvas.width;
        var height = canvas.height;
        var buffer = ctx.createImageData(width, height);
        {
            console.time("for (let i: num...");
            for (var i = (width * height) - 1; 0 <= i; i--) {
                var index = i << 2;
                buffer.data[index] = DARK_GRAY;
                buffer.data[index + 1] = DARK_GRAY;
                buffer.data[index + 2] = DARK_GRAY;
                buffer.data[index + 3] = 255;
            }
            console.timeEnd("for (let i: num...");
        }
        {
            console.time("getSplitEdges(...)");
            var edges = getSplitEdges(getPartitions([{
                    xLower: 0,
                    xUpper: width - 1,
                    yLower: 0,
                    yUpper: height - 1,
                    horizontal: false
                }]));
            console.timeEnd("getSplitEdges(...)");
            console.time("for (let i: num...");
            for (var i = edges.length - 1; 0 <= i; i--) {
                var edge = edges[i];
                if (edge.x1 === edge.x2) {
                    setVerticalLine(buffer, width, edge.x1, edge.y1, edge.y2);
                }
                else if (edge.y1 === edge.y2) {
                    setHorizontalLine(buffer, width, edge.x1, edge.x2, edge.y1);
                }
            }
            console.timeEnd("for (let i: num...");
        }
        {
            console.time("ctx.putImageDat...");
            ctx.putImageData(buffer, 0, 0);
            console.timeEnd("ctx.putImageDat...");
        }
        console.log("Done!");
    };
    
    'marker:resolver';

    function get_define(name) {
        if (defines[name]) {
            return defines[name];
        }
        else if (defines[name + '/index']) {
            return defines[name + '/index'];
        }
        else {
            var dependencies = ['exports'];
            var factory = function (exports) {
                try {
                    Object.defineProperty(exports, "__cjsModule", { value: true });
                    Object.defineProperty(exports, "default", { value: require(name) });
                }
                catch (_a) {
                    throw Error(['module "', name, '" not found.'].join(''));
                }
            };
            return { dependencies: dependencies, factory: factory };
        }
    }
    var instances = {};
    function resolve(name) {
        if (instances[name]) {
            return instances[name];
        }
        if (name === 'exports') {
            return {};
        }
        var define = get_define(name);
        instances[name] = {};
        var dependencies = define.dependencies.map(function (name) { return resolve(name); });
        define.factory.apply(define, dependencies);
        var exports = dependencies[define.dependencies.indexOf('exports')];
        instances[name] = (exports['__cjsModule']) ? exports["default"] : exports;
        return instances[name];
    }
    if (entry[0] !== null) {
        return resolve(entry[0]);
    }
})();