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
    var OPAQUE_1 = 255;
    var OPAQUE_2 = 215;
    var OPAQUE_3 = 175;
    var OPAQUE_4 = 135;
    var TRANSPARENT = 0;
    var RADIUS = 12;
    var RADIUS_SQUARED = RADIUS * RADIUS;
    var K = 0.495;
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
    function setMaskColRow(mask, position, octal, width, height) {
        for (var dY = octal.yStart; dY < RADIUS; dY++) {
            var y = position.y + (dY * octal.yMult);
            if ((y < 0) || (height < y)) {
                break;
            }
            var yWidth = y * width;
            var yDelta = y - position.y;
            var yDeltaSquared = yDelta * yDelta;
            for (var dX = octal.xStart; dX <= dY; dX++) {
                var x = position.x + (dX * octal.xMult);
                if ((x < 0) || (width <= x)) {
                    break;
                }
                var xDelta = x - position.x;
                if (((xDelta * xDelta) + yDeltaSquared) < RADIUS_SQUARED) {
                    if (octal.xMult === 1) {
                        mask[yWidth + x] = OPAQUE_1;
                    }
                    else {
                        mask[yWidth + x] = OPAQUE_2;
                    }
                }
            }
        }
    }
    function setMaskRowCol(mask, position, octal, width, height) {
        for (var dX = octal.xStart; dX < RADIUS; dX++) {
            var x = position.x + (dX * octal.xMult);
            if ((x < 0) || (width <= x)) {
                break;
            }
            var xDelta = x - position.x;
            for (var dY = octal.yStart; dY <= dX; dY++) {
                var y = position.y + (dY * octal.yMult);
                if ((y < 0) || (height < y)) {
                    break;
                }
                var yWidth = y * width;
                var yDelta = y - position.y;
                if (((xDelta * xDelta) + (yDelta * yDelta)) < RADIUS_SQUARED) {
                    if (octal.yMult === 1) {
                        mask[yWidth + x] = OPAQUE_3;
                    }
                    else {
                        mask[yWidth + x] = OPAQUE_4;
                    }
                }
            }
        }
    }
    function setMask(mask, position, width, height) {
        mask.fill(TRANSPARENT);
        mask[(position.y * width) + position.x] = OPAQUE_1;
        setMaskColRow(mask, position, {
            xMult: 1,
            yMult: 1,
            xStart: 0,
            yStart: 1
        }, width, height);
        setMaskColRow(mask, position, {
            xMult: 1,
            yMult: -1,
            xStart: 0,
            yStart: 1
        }, width, height);
        setMaskColRow(mask, position, {
            xMult: -1,
            yMult: 1,
            xStart: 0,
            yStart: 1
        }, width, height);
        setMaskColRow(mask, position, {
            xMult: -1,
            yMult: -1,
            xStart: 0,
            yStart: 1
        }, width, height);
        setMaskRowCol(mask, position, {
            xMult: 1,
            yMult: 1,
            xStart: 1,
            yStart: 0
        }, width, height);
        setMaskRowCol(mask, position, {
            xMult: 1,
            yMult: -1,
            xStart: 1,
            yStart: 0
        }, width, height);
        setMaskRowCol(mask, position, {
            xMult: -1,
            yMult: 1,
            xStart: 1,
            yStart: 0
        }, width, height);
        setMaskRowCol(mask, position, {
            xMult: -1,
            yMult: -1,
            xStart: 1,
            yStart: 0
        }, width, height);
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
                mask.fill(TRANSPARENT);
                mask[(position.y * width) + position.x] = OPAQUE_1;
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