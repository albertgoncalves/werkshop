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
    function setVerticalLine(buffer, width, x, yStart, yEnd) {
        var start = (yStart * width) + x;
        var end = (yEnd * width) + x;
        for (var i = start; i < end; i += width) {
            var index = i << 2;
            buffer.data[index] = 0;
            buffer.data[index + 1] = 0;
            buffer.data[index + 2] = 0;
            buffer.data[index + 3] = 255;
        }
    }
    function setHorizontalLine(buffer, width, xStart, xEnd, y) {
        var yWidth = y * width;
        var start = yWidth + xStart;
        var end = yWidth + xEnd;
        for (var i = start; i < end; i++) {
            var index = i << 2;
            buffer.data[index] = 0;
            buffer.data[index + 1] = 0;
            buffer.data[index + 2] = 0;
            buffer.data[index + 3] = 255;
        }
    }
    window.onload = function () {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        var width = canvas.width;
        var height = canvas.height;
        var buffer = ctx.createImageData(width, height);
        {
            var xStart = 0;
            var xEnd = width;
            var y = Math.floor(Math.random() * height);
            setHorizontalLine(buffer, width, xStart, xEnd, y);
            {
                var yStart = 0;
                var yEnd = y;
                var x = Math.floor(Math.random() * width);
                setVerticalLine(buffer, width, x, yStart, yEnd);
            }
            {
                var yStart = y;
                var yEnd = height;
                var x = Math.floor(Math.random() * width);
                setVerticalLine(buffer, width, x, yStart, yEnd);
            }
        }
        ctx.putImageData(buffer, 0, 0);
        console.log("Ready!");
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