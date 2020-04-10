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
    var DARK_GRAY = 128;
    var WHITE = 255;
    var OPAQUE = 255;
    var TRANSPARENT = 0;
    var RADIUS = 47;
    var RADIUS_SQUARED = RADIUS * RADIUS;
    var K = 0.4;
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
    function getBlocked(buffer, position, x, y) {
        return ((x < 0) || (y < 0) || (position.width <= x) ||
            (position.height <= y) ||
            (buffer[(position.width * y) + x] !== WHITE));
    }
    function setMaskColRow(mask, buffer, position, octal) {
        if (octal.slopeStart < octal.slopeEnd) {
            return;
        }
        var nextStart = octal.slopeStart;
        var yEnd = -RADIUS - 1;
        for (var dY = -octal.start; yEnd < dY; dY--) {
            var blocked = false;
            var y = position.y + (dY * octal.yMult);
            var yDelta = y - position.y;
            var yDeltaSquared = yDelta * yDelta;
            var yWidth = y * position.width;
            for (var dX = dY - 1; dX < 1; dX++) {
                var rSlope = (dX + K) / (dY - K);
                if (octal.slopeStart < rSlope) {
                    continue;
                }
                var lSlope = (dX - K) / (dY + K);
                if (lSlope < octal.slopeEnd) {
                    break;
                }
                var x = position.x + (dX * octal.xMult);
                var xDelta = x - position.x;
                if (((xDelta * xDelta) + yDeltaSquared) < RADIUS_SQUARED) {
                    if ((0 <= x) && (x < position.width) && (0 <= y) &&
                        (y < position.height)) {
                        if (octal.xMult === 1) {
                            mask[yWidth + x] = OPAQUE;
                        }
                        else {
                            mask[yWidth + x] = OPAQUE;
                        }
                    }
                }
                if (blocked) {
                    if (getBlocked(buffer, position, x, y)) {
                        nextStart = rSlope;
                        continue;
                    }
                    else {
                        blocked = false;
                        octal.slopeStart = nextStart;
                    }
                }
                else {
                    var yCurrent = -dY;
                    if ((getBlocked(buffer, position, x, y)) &&
                        (yCurrent < RADIUS)) {
                        blocked = true;
                        setMaskColRow(mask, buffer, position, {
                            xMult: octal.xMult,
                            yMult: octal.yMult,
                            start: yCurrent + 1,
                            slopeStart: nextStart,
                            slopeEnd: lSlope
                        });
                        nextStart = rSlope;
                    }
                }
            }
            if (blocked) {
                break;
            }
        }
    }
    function setMaskRowCol(mask, buffer, position, octal) {
        if (octal.slopeStart < octal.slopeEnd) {
            return;
        }
        var nextStart = octal.slopeStart;
        var xEnd = -RADIUS - 1;
        for (var dX = -octal.start; xEnd < dX; dX--) {
            var blocked = false;
            var x = position.x + (dX * octal.xMult);
            var xDelta = x - position.x;
            var xDeltaSquared = xDelta * xDelta;
            for (var dY = dX - 1; dY < 1; dY++) {
                var rSlope = (dY + K) / (dX - K);
                if (octal.slopeStart < rSlope) {
                    continue;
                }
                var lSlope = (dY - K) / (dX + K);
                if (lSlope < octal.slopeEnd) {
                    break;
                }
                var y = position.y + (dY * octal.yMult);
                var yDelta = y - position.y;
                var yWidth = y * position.width;
                if ((xDeltaSquared + (yDelta * yDelta)) < RADIUS_SQUARED) {
                    if ((0 <= x) && (x < position.width) && (0 <= y) &&
                        (y < position.height)) {
                        if (octal.yMult === 1) {
                            mask[yWidth + x] = OPAQUE;
                        }
                        else {
                            mask[yWidth + x] = OPAQUE;
                        }
                    }
                }
                if (blocked) {
                    if (getBlocked(buffer, position, x, y)) {
                        nextStart = rSlope;
                        continue;
                    }
                    else {
                        blocked = false;
                        octal.slopeStart = nextStart;
                    }
                }
                else {
                    var xCurrent = -dX;
                    if ((getBlocked(buffer, position, x, y)) &&
                        (xCurrent < RADIUS)) {
                        blocked = true;
                        setMaskRowCol(mask, buffer, position, {
                            xMult: octal.xMult,
                            yMult: octal.yMult,
                            start: xCurrent + 1,
                            slopeStart: octal.slopeStart,
                            slopeEnd: lSlope
                        });
                        nextStart = rSlope;
                    }
                }
            }
            if (blocked) {
                break;
            }
        }
    }
    function setMask(mask, buffer, position) {
        mask.fill(TRANSPARENT);
        mask[(position.y * position.width) + position.x] = OPAQUE;
        setMaskColRow(mask, buffer, position, {
            xMult: 1,
            yMult: 1,
            start: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskColRow(mask, buffer, position, {
            xMult: 1,
            yMult: -1,
            start: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskColRow(mask, buffer, position, {
            xMult: -1,
            yMult: 1,
            start: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskColRow(mask, buffer, position, {
            xMult: -1,
            yMult: -1,
            start: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskRowCol(mask, buffer, position, {
            xMult: 1,
            yMult: 1,
            start: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskRowCol(mask, buffer, position, {
            xMult: 1,
            yMult: -1,
            start: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskRowCol(mask, buffer, position, {
            xMult: -1,
            yMult: 1,
            start: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskRowCol(mask, buffer, position, {
            xMult: -1,
            yMult: -1,
            start: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
    }
    window.onload = function () {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        var position = {
            x: 15,
            y: 15,
            width: canvas.width,
            height: canvas.height
        };
        var n = position.width * position.height;
        var image = ctx.createImageData(position.width, position.height);
        var buffer = new Uint8ClampedArray(n);
        var mask = new Uint8ClampedArray(n);
        buffer.fill(WHITE);
        {
            setVerticalLine(buffer, position.width, 6, 10, 20);
            setVerticalLine(buffer, position.width, 25, 10, 20);
            setVerticalLine(buffer, position.width, 18, 8, 21);
            setHorizontalLine(buffer, position.width, 7, 24, 5);
            setHorizontalLine(buffer, position.width, 7, 24, 26);
            setHorizontalLine(buffer, position.width, 10, 20, 17);
            buffer[(position.y * position.width) + position.x] = DARK_GRAY;
            console.time("setMask(mask, buffer, position)");
            setMask(mask, buffer, position);
            console.timeEnd("setMask(mask, buffer, position)");
            setImage(ctx, image, buffer, mask);
        }
        canvas.addEventListener("mousedown", function (event) {
            var x = (event.x + window.pageXOffset - canvas.offsetLeft) >> CANVAS_SCALE;
            var y = (event.y + window.pageYOffset - canvas.offsetTop) >> CANVAS_SCALE;
            var index = (y * position.width) + x;
            if (buffer[index] === WHITE) {
                buffer[(position.y * position.width) + position.x] = WHITE;
                buffer[index] = DARK_GRAY;
                position.x = x;
                position.y = y;
                console.time("setMask(mask, buffer, position)");
                setMask(mask, buffer, position);
                console.timeEnd("setMask(mask, buffer, position)");
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