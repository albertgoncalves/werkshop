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
    var DARK_GRAY = 64;
    var WHITE = 255;
    var COLOR_R = 255;
    var COLOR_G = 75;
    var COLOR_B = 10;
    var MIN_DELTA = 32;
    var MIN_SPLIT = 4;
    var N = 128;
    function setVerticalLine(buffer, width, x, yStart, yEnd) {
        {
            var index = (((yStart + 1) * width) + x) << 2;
            buffer.data[index] = COLOR_R;
            buffer.data[index + 1] = COLOR_G;
            buffer.data[index + 2] = COLOR_B;
        }
        {
            var index = (((yEnd - 1) * width) + x) << 2;
            buffer.data[index] = COLOR_R;
            buffer.data[index + 1] = COLOR_G;
            buffer.data[index + 2] = COLOR_B;
        }
        var start = ((yStart + 2) * width) + x;
        var end = ((yEnd - 1) * width) + x;
        for (var i = start; i < end; i += width) {
            var index = i << 2;
            buffer.data[index] = WHITE;
            buffer.data[index + 1] = WHITE;
            buffer.data[index + 2] = WHITE;
        }
    }
    function setHorizontalLine(buffer, width, xStart, xEnd, y) {
        var yWidth = y * width;
        var start = (yWidth + xStart) + 1;
        var end = (yWidth + xEnd) - 1;
        {
            var index = start << 2;
            buffer.data[index] = COLOR_R;
            buffer.data[index + 1] = COLOR_G;
            buffer.data[index + 2] = COLOR_B;
        }
        {
            var index = end << 2;
            buffer.data[index] = COLOR_R;
            buffer.data[index + 1] = COLOR_G;
            buffer.data[index + 2] = COLOR_B;
        }
        for (var i = start + 1; i < end; i++) {
            var index = i << 2;
            buffer.data[index] = WHITE;
            buffer.data[index + 1] = WHITE;
            buffer.data[index + 2] = WHITE;
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
    window.onload = function () {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        var width = canvas.width;
        var height = canvas.height;
        var buffer = ctx.createImageData(width, height);
        console.time("for (let i: num...");
        for (var i = (width * height) - 1; 0 <= i; i--) {
            var index = i << 2;
            buffer.data[index] = DARK_GRAY;
            buffer.data[index + 1] = DARK_GRAY;
            buffer.data[index + 2] = DARK_GRAY;
            buffer.data[index + 3] = 255;
        }
        console.timeEnd("for (let i: num...");
        console.time("setPartitions(...)");
        var edges = getPartitions([{
                xLower: -1,
                xUpper: width,
                yLower: -1,
                yUpper: height,
                horizontal: true
            }]);
        for (var i = edges.length - 1; 0 <= i; i--) {
            var edge = edges[i];
            if (edge.x1 === edge.x2) {
                setVerticalLine(buffer, width, edge.x1, edge.y1, edge.y2);
            }
            else if (edge.y1 === edge.y2) {
                setHorizontalLine(buffer, width, edge.x1, edge.x2, edge.y1);
            }
        }
        console.timeEnd("setPartitions(...)");
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