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
    var CANVAS_SCALE = 4;
    var DARK_GRAY = 32;
    var GRAY = 208;
    var OPAQUE = 255;
    var TRANSPARENT = 0;
    var RADIUS_SQUARED = 144;
    function setVerticalLine(buffer, width, x, yStart, yEnd) {
        var start = (yStart * width) + x;
        var end = (yEnd * width) + x;
        for (var i = start; i <= end; i += width) {
            buffer[i] = DARK_GRAY;
        }
    }
    function setHorizontalLine(buffer, width, xStart, xEnd, y) {
        var yWidth = y * width;
        var start = yWidth + xStart;
        var end = yWidth + xEnd;
        for (var i = start; i <= end; i++) {
            buffer[i] = DARK_GRAY;
        }
    }
    function setImage(ctx, image, buffer, mask) {
        for (var i = buffer.length; 0 <= i; i--) {
            var color = buffer[i];
            var index = i << 2;
            image.data[index] = color;
            image.data[index + 1] = color;
            image.data[index + 2] = color;
            image.data[index + 3] = mask[i];
        }
        ctx.putImageData(image, 0, 0);
    }
    function setMask(mask, position, width, height) {
        mask.fill(TRANSPARENT);
        for (var y = height - 1; 0 <= y; y--) {
            var yWidth = y * width;
            var yDelta = y - position.y;
            var yDeltaSquared = yDelta * yDelta;
            for (var x = width - 1; 0 <= x; x--) {
                var xDelta = x - position.x;
                if (((xDelta * xDelta) + yDeltaSquared) < RADIUS_SQUARED) {
                    mask[yWidth + x] = OPAQUE;
                }
            }
        }
    }
    window.onload = function () {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        var width = canvas.width;
        var height = canvas.height;
        var n = width * height;
        var image = ctx.createImageData(width, height);
        var buffer = new Uint8ClampedArray(n);
        var mask = new Uint8ClampedArray(n);
        buffer.fill(GRAY);
        var position = {
            x: 15,
            y: 15
        };
        {
            setVerticalLine(buffer, width, 6, 10, 20);
            setVerticalLine(buffer, width, 25, 10, 20);
            setHorizontalLine(buffer, width, 7, 24, 5);
            setHorizontalLine(buffer, width, 7, 24, 26);
            buffer[(position.y * width) + position.x] = DARK_GRAY;
            setMask(mask, position, width, height);
            setImage(ctx, image, buffer, mask);
        }
        canvas.addEventListener("mousedown", function (event) {
            var x = (event.x - canvas.offsetLeft) >> CANVAS_SCALE;
            var y = (event.y - canvas.offsetTop) >> CANVAS_SCALE;
            var index = (y * width) + x;
            if (buffer[index] === GRAY) {
                buffer[(position.y * width) + position.x] = GRAY;
                buffer[index] = DARK_GRAY;
                position.x = x;
                position.y = y;
                setMask(mask, position, width, height);
                setImage(ctx, image, buffer, mask);
            }
        });
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