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
    var DARK_GRAY = 32;
    var WHITE = 255;
    var MIN_DELTA = 64;
    var MIN_SPLIT = 8;
    function setVerticalLine(buffer, width, x, yStart, yEnd) {
        var start = (yStart * width) + x;
        var end = (yEnd * width) + x;
        for (var i = start; i < end; i += width) {
            var index = i << 2;
            buffer.data[index] = WHITE;
            buffer.data[index + 1] = WHITE;
            buffer.data[index + 2] = WHITE;
        }
    }
    function setHorizontalLine(buffer, width, xStart, xEnd, y) {
        var yWidth = y * width;
        var start = yWidth + xStart;
        var end = yWidth + xEnd;
        for (var i = start; i < end; i++) {
            var index = i << 2;
            buffer.data[index] = WHITE;
            buffer.data[index + 1] = WHITE;
            buffer.data[index + 2] = WHITE;
        }
    }
    function setPartitions(buffer, width, _partition) {
        var stack = [_partition];
        var partition = stack.pop();
        while (partition) {
            if (partition.horizontal) {
                var yDelta = partition.yUpper - partition.yLower;
                var y = void 0;
                y = Math.floor(Math.random() * yDelta) + partition.yLower;
                while (((y - MIN_SPLIT) < partition.yLower) ||
                    (partition.yUpper < (y + MIN_SPLIT))) {
                    y = Math.floor(Math.random() * yDelta) + partition.yLower;
                }
                setHorizontalLine(buffer, width, partition.xLower, partition.xUpper, y);
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
            }
            else {
                var xDelta = partition.xUpper - partition.xLower;
                var x = void 0;
                x = Math.floor(Math.random() * xDelta) + partition.xLower;
                while (((x - MIN_SPLIT) < partition.xLower) ||
                    (partition.xUpper < (x + MIN_SPLIT))) {
                    x = Math.floor(Math.random() * xDelta) + partition.xLower;
                }
                setVerticalLine(buffer, width, x, partition.yLower, partition.yUpper);
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
            }
            partition = stack.pop();
        }
    }
    window.onload = function () {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        var width = canvas.width;
        var height = canvas.height;
        var buffer = ctx.createImageData(width, height);
        console.time("for (let i: num...");
        for (var i = width * height; 0 <= i; i--) {
            var index = i << 2;
            buffer.data[index] = DARK_GRAY;
            buffer.data[index + 1] = DARK_GRAY;
            buffer.data[index + 2] = DARK_GRAY;
            buffer.data[index + 3] = 255;
        }
        console.timeEnd("for (let i: num...");
        console.time("setPartitions(...)");
        setPartitions(buffer, width, {
            xLower: 0,
            xUpper: width,
            yLower: 0,
            yUpper: height,
            horizontal: true
        });
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