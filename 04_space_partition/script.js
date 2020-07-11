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
    var ITERATION_LIMIT = 100;
    var MIN_DELTA = 1 << 5;
    var MIN_SPLIT = (1 << 3) + 1;
    var PAD = MIN_SPLIT >> 1;
    var PAD_DOUBLE = PAD << 1;
    var GLOBAL = {
        width: 0,
        height: 0
    };
    var DARK_GRAY = {
        red: 64,
        green: 64,
        blue: 64,
        alpha: 255
    };
    var WHITE = {
        red: 255,
        green: 255,
        blue: 255,
        alpha: 255
    };
    var BLUE = {
        red: 75,
        green: 155,
        blue: 250,
        alpha: 255
    };
    var ORANGE = {
        red: 250,
        green: 155,
        blue: 75,
        alpha: 255
    };
    var MAROON = {
        red: 110,
        green: 66,
        blue: 86,
        alpha: 255
    };
    var PALE_BLUE = {
        red: 66,
        green: 86,
        blue: 110,
        alpha: 255
    };
    function setColor(buffer, index, color) {
        buffer.data[index] = color.red;
        buffer.data[index + 1] = color.green;
        buffer.data[index + 2] = color.blue;
        buffer.data[index + 3] = color.alpha;
    }
    function setVerticalLine(buffer, x, yStart, yEnd) {
        var start = ((yStart * GLOBAL.width) + x) << 2;
        var end = ((yEnd * GLOBAL.width) + x) << 2;
        var widthColor = GLOBAL.width << 2;
        for (var i = start + widthColor; i < end; i += widthColor) {
            setColor(buffer, i, WHITE);
        }
        {
            if (DEBUG) {
                setColor(buffer, start, BLUE);
            }
            else {
                setColor(buffer, start, WHITE);
            }
        }
        {
            if (DEBUG) {
                setColor(buffer, end, BLUE);
            }
            else {
                setColor(buffer, end, WHITE);
            }
        }
    }
    function setHorizontalLine(buffer, xStart, xEnd, y) {
        var yWidth = y * GLOBAL.width;
        var start = (yWidth + xStart) << 2;
        var end = (yWidth + xEnd) << 2;
        for (var i = start + 4; i < end; i += 4) {
            setColor(buffer, i, WHITE);
        }
        {
            if (DEBUG) {
                setColor(buffer, start, BLUE);
            }
            else {
                setColor(buffer, start, WHITE);
            }
        }
        {
            if (DEBUG) {
                setColor(buffer, end, BLUE);
            }
            else {
                setColor(buffer, end, WHITE);
            }
        }
    }
    function getPartitions(stack) {
        var edges = [];
        var partition = stack.pop();
        while (partition) {
            if (partition.horizontal) {
                var yDelta = partition.yUpper - partition.yLower;
                for (var i = ITERATION_LIMIT; 0 < i; --i) {
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
                for (var i = ITERATION_LIMIT; 0 < i; --i) {
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
        var points = [];
        for (var i = preEdges.length - 1; 0 <= i; --i) {
            var edge = preEdges[i];
            if (edge.x1 === edge.x2) {
                var x = edge.x1;
                var neighbors = [edge.y1, edge.y2];
                for (var j = preEdges.length - 1; 0 <= j; --j) {
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
                for (var k = neighbors.length - 1; 0 < k; --k) {
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
                            points.push({
                                x: x,
                                y: ySplit,
                                horizontal: true
                            });
                        }
                    }
                }
            }
            else if (edge.y1 === edge.y2) {
                var y = edge.y1;
                var neighbors = [edge.x1, edge.x2];
                for (var j = preEdges.length - 1; 0 <= j; --j) {
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
                for (var k = neighbors.length - 1; 0 < k; --k) {
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
                            points.push({
                                x: xSplit,
                                y: y,
                                horizontal: false
                            });
                        }
                    }
                }
            }
        }
        return {
            edges: edges,
            points: points
        };
    }
    function setEdges(buffer, edges) {
        for (var i = edges.length - 1; 0 <= i; --i) {
            var edge = edges[i];
            if (edge.x1 === edge.x2) {
                setVerticalLine(buffer, edge.x1, edge.y1, edge.y2);
            }
            else if (edge.y1 === edge.y2) {
                setHorizontalLine(buffer, edge.x1, edge.x2, edge.y1);
            }
        }
    }
    function setPoints(buffer, points) {
        for (var i = points.length - 1; 0 <= i; --i) {
            var point = points[i];
            var index = (point.x + (point.y * GLOBAL.width)) << 2;
            setColor(buffer, index, ORANGE);
            if (point.horizontal) {
                for (var x = point.x - 1; 0 <= x; --x) {
                    index = (x + (point.y * GLOBAL.width)) << 2;
                    if ((buffer.data[index] !== DARK_GRAY.red) ||
                        (buffer.data[index + 1] !== DARK_GRAY.green) ||
                        (buffer.data[index + 2] !== DARK_GRAY.blue) ||
                        (buffer.data[index + 3] !== DARK_GRAY.alpha)) {
                        break;
                    }
                    setColor(buffer, index, MAROON);
                }
                for (var x = point.x + 1; x < GLOBAL.width; ++x) {
                    index = (x + (point.y * GLOBAL.width)) << 2;
                    if ((buffer.data[index] !== DARK_GRAY.red) ||
                        (buffer.data[index + 1] !== DARK_GRAY.green) ||
                        (buffer.data[index + 2] !== DARK_GRAY.blue) ||
                        (buffer.data[index + 3] !== DARK_GRAY.alpha)) {
                        break;
                    }
                    setColor(buffer, index, MAROON);
                }
            }
            else {
                for (var y = point.y - 1; 0 <= y; --y) {
                    index = (point.x + (y * GLOBAL.width)) << 2;
                    if ((buffer.data[index] !== DARK_GRAY.red) ||
                        (buffer.data[index + 1] !== DARK_GRAY.green) ||
                        (buffer.data[index + 2] !== DARK_GRAY.blue) ||
                        (buffer.data[index + 3] !== DARK_GRAY.alpha)) {
                        break;
                    }
                    setColor(buffer, index, PALE_BLUE);
                }
                for (var y = point.y + 1; y < GLOBAL.height; ++y) {
                    index = (point.x + (y * GLOBAL.width)) << 2;
                    if ((buffer.data[index] !== DARK_GRAY.red) ||
                        (buffer.data[index + 1] !== DARK_GRAY.green) ||
                        (buffer.data[index + 2] !== DARK_GRAY.blue) ||
                        (buffer.data[index + 3] !== DARK_GRAY.alpha)) {
                        break;
                    }
                    setColor(buffer, index, PALE_BLUE);
                }
            }
        }
    }
    window.onload = function () {
        var canvas = document.getElementById("canvas");
        GLOBAL.width = canvas.width;
        GLOBAL.height = canvas.height;
        var ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        var buffer = ctx.createImageData(GLOBAL.width, GLOBAL.height);
        var n = (GLOBAL.width * GLOBAL.height) << 2;
        for (var i = 0; i < n; i += 4) {
            setColor(buffer, i, DARK_GRAY);
        }
        var edgesPoints = getSplitEdges(getPartitions([{
                xLower: 0,
                xUpper: GLOBAL.width - 1,
                yLower: 0,
                yUpper: GLOBAL.height - 1,
                horizontal: false
            }]));
        setEdges(buffer, edgesPoints.edges);
        setPoints(buffer, edgesPoints.points);
        ctx.putImageData(buffer, 0, 0);
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