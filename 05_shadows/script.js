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
    var CANVAS_SCALE = 3;
    var DARK_GRAY = 112;
    var LIGHT_GRAY = 224;
    var WHITE = 255;
    var OPAQUE = 255;
    var TRANSPARENT = 40;
    var RADIUS = 91;
    var RADIUS_SQUARED = RADIUS * RADIUS;
    var APERTURE = 0.499;
    var SPEED = 0.75;
    function setVerticalLine(canvas, buffer, x, yStart, yEnd) {
        var start = (yStart * canvas.width) + x;
        var end = (yEnd * canvas.width) + x;
        for (var i = start; i <= end; i += canvas.width) {
            buffer[i] = DARK_GRAY;
        }
    }
    function setHorizontalLine(canvas, buffer, xStart, xEnd, y) {
        var yWidth = y * canvas.width;
        var start = yWidth + xStart;
        var end = yWidth + xEnd;
        for (var i = start; i <= end; i++) {
            buffer[i] = DARK_GRAY;
        }
    }
    function setImage(ctx, image, buffer, mask) {
        for (var i = buffer.length - 1; 0 <= i; i--) {
            var color = buffer[i];
            var index = i << 2;
            image.data[index] = color;
            image.data[index + 1] = color;
            image.data[index + 2] = color;
            image.data[index + 3] = mask[i];
        }
        ctx.putImageData(image, 0, 0);
    }
    function getBlocked(canvas, buffer, x, y) {
        return ((x < 0) || (y < 0) || (canvas.width <= x) ||
            (canvas.height <= y) ||
            (buffer[(canvas.width * y) + x] !== WHITE));
    }
    function setMaskColRow(canvas, mask, buffer, current, octal) {
        if (octal.slopeStart < octal.slopeEnd) {
            return;
        }
        var nextStart = octal.slopeStart;
        var yEnd = RADIUS + 1;
        for (var dY = octal.loopStart; dY < yEnd; dY++) {
            var blocked = false;
            var y = current.y + (dY * octal.yMult);
            var yDelta = y - current.y;
            var yDeltaSquared = yDelta * yDelta;
            var yWidth = y * canvas.width;
            for (var dX = dY + 1; -1 < dX; dX--) {
                var lSlope = (dX - APERTURE) / (dY + APERTURE);
                if (octal.slopeStart < lSlope) {
                    continue;
                }
                var rSlope = (dX + APERTURE) / (dY - APERTURE);
                if (rSlope < octal.slopeEnd) {
                    break;
                }
                var x = current.x + (dX * octal.xMult);
                var xDelta = x - current.x;
                if ((((xDelta * xDelta) + yDeltaSquared) < RADIUS_SQUARED) &&
                    (0 <= x) && (x < canvas.width) && (0 <= y) &&
                    (y < canvas.height)) {
                    mask[yWidth + x] = OPAQUE;
                }
                if (blocked) {
                    if (getBlocked(canvas, buffer, x, y)) {
                        nextStart = lSlope;
                        continue;
                    }
                    else {
                        blocked = false;
                        octal.slopeStart = nextStart;
                    }
                }
                else {
                    if ((getBlocked(canvas, buffer, x, y)) && (dY < RADIUS)) {
                        blocked = true;
                        setMaskColRow(canvas, mask, buffer, current, {
                            xMult: octal.xMult,
                            yMult: octal.yMult,
                            loopStart: dY + 1,
                            slopeStart: nextStart,
                            slopeEnd: rSlope
                        });
                        nextStart = lSlope;
                    }
                }
            }
            if (blocked) {
                break;
            }
        }
    }
    function setMaskRowCol(canvas, mask, buffer, current, octal) {
        if (octal.slopeStart < octal.slopeEnd) {
            return;
        }
        var nextStart = octal.slopeStart;
        var xEnd = RADIUS + 1;
        for (var dX = octal.loopStart; dX < xEnd; dX++) {
            var blocked = false;
            var x = current.x + (dX * octal.xMult);
            var xDelta = x - current.x;
            var xDeltaSquared = xDelta * xDelta;
            for (var dY = dX + 1; -1 < dY; dY--) {
                var lSlope = (dY - APERTURE) / (dX + APERTURE);
                if (octal.slopeStart < lSlope) {
                    continue;
                }
                var rSlope = (dY + APERTURE) / (dX - APERTURE);
                if (rSlope < octal.slopeEnd) {
                    break;
                }
                var y = current.y + (dY * octal.yMult);
                var yDelta = y - current.y;
                var yWidth = y * canvas.width;
                if (((xDeltaSquared + (yDelta * yDelta)) < RADIUS_SQUARED) &&
                    (0 <= x) && (x < canvas.width) && (0 <= y) &&
                    (y < canvas.height)) {
                    mask[yWidth + x] = OPAQUE;
                }
                if (blocked) {
                    if (getBlocked(canvas, buffer, x, y)) {
                        nextStart = lSlope;
                        continue;
                    }
                    else {
                        blocked = false;
                        octal.slopeStart = nextStart;
                    }
                }
                else {
                    if ((getBlocked(canvas, buffer, x, y)) && (dX < RADIUS)) {
                        blocked = true;
                        setMaskRowCol(canvas, mask, buffer, current, {
                            xMult: octal.xMult,
                            yMult: octal.yMult,
                            loopStart: dX + 1,
                            slopeStart: octal.slopeStart,
                            slopeEnd: rSlope
                        });
                        nextStart = lSlope;
                    }
                }
            }
            if (blocked) {
                break;
            }
        }
    }
    function setMask(canvas, mask, buffer, current) {
        mask.fill(TRANSPARENT);
        mask[(current.y * canvas.width) + current.x] = OPAQUE;
        setMaskColRow(canvas, mask, buffer, current, {
            xMult: 1,
            yMult: 1,
            loopStart: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskColRow(canvas, mask, buffer, current, {
            xMult: 1,
            yMult: -1,
            loopStart: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskColRow(canvas, mask, buffer, current, {
            xMult: -1,
            yMult: 1,
            loopStart: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskColRow(canvas, mask, buffer, current, {
            xMult: -1,
            yMult: -1,
            loopStart: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskRowCol(canvas, mask, buffer, current, {
            xMult: 1,
            yMult: 1,
            loopStart: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskRowCol(canvas, mask, buffer, current, {
            xMult: 1,
            yMult: -1,
            loopStart: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskRowCol(canvas, mask, buffer, current, {
            xMult: -1,
            yMult: 1,
            loopStart: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskRowCol(canvas, mask, buffer, current, {
            xMult: -1,
            yMult: -1,
            loopStart: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
    }
    function doStep(canvas, mask, buffer, current, target, move, speed) {
        if ((current.x === target.x) && (current.y === target.y)) {
            return;
        }
        move.x += speed.x;
        move.y += speed.y;
        var next = {
            x: Math.round(move.x),
            y: Math.round(move.y)
        };
        if ((current.x === next.x) && (current.y === next.y)) {
            return;
        }
        var index = (next.y * canvas.width) + next.x;
        if (buffer[index] === WHITE) {
            buffer[(current.y * canvas.width) + current.x] = WHITE;
            buffer[index] = LIGHT_GRAY;
            setMask(canvas, mask, buffer, next);
            current.x = next.x;
            current.y = next.y;
        }
        else {
            speed.x = 0;
            speed.y = 0;
            move.x = current.x;
            move.y = current.y;
            target.x = current.y;
            target.y = current.y;
        }
    }
    window.onload = function () {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        var n = canvas.width * canvas.height;
        var image = ctx.createImageData(canvas.width, canvas.height);
        var buffer = new Uint8ClampedArray(n);
        var mask = new Uint8ClampedArray(n);
        buffer.fill(WHITE);
        var current = {
            x: 0,
            y: 0
        };
        var target = {
            x: 0,
            y: 0
        };
        var move = {
            x: 0.0,
            y: 0.0
        };
        var speed = {
            x: 0.0,
            y: 0.0
        };
        canvas.addEventListener("mousedown", function (event) {
            var x = (event.x + window.pageXOffset - canvas.offsetLeft) >> CANVAS_SCALE;
            var y = (event.y + window.pageYOffset - canvas.offsetTop) >> CANVAS_SCALE;
            speed.x = 0.0;
            speed.y = 0.0;
            if ((current.x !== x) && (current.y !== y)) {
                var xDelta = x - current.x;
                var yDelta = y - current.y;
                var slope = Math.abs(yDelta / xDelta);
                var ySlope = slope / (slope + 1);
                var xSlope = 1.0 - ySlope;
                if (current.x < x) {
                    speed.x = xSlope * SPEED;
                }
                else {
                    speed.x = -xSlope * SPEED;
                }
                if (current.y < y) {
                    speed.y = ySlope * SPEED;
                }
                else {
                    speed.y = -ySlope * SPEED;
                }
            }
            else if ((current.x === x) && (current.y !== y)) {
                if (current.y < y) {
                    speed.y = SPEED;
                }
                else {
                    speed.y = -SPEED;
                }
            }
            else if ((current.x !== x) && (current.y === y)) {
                if (current.x < x) {
                    speed.x = SPEED;
                }
                else {
                    speed.x = -SPEED;
                }
            }
            else {
                return;
            }
            var index = (y * canvas.width) + x;
            if (mask[index] === OPAQUE) {
                target.x = x;
                target.y = y;
            }
            else {
                target.x = current.x;
                target.y = current.y;
            }
        });
        {
            setVerticalLine(canvas, buffer, 6, 10, 40);
            setVerticalLine(canvas, buffer, 25, 10, 20);
            setVerticalLine(canvas, buffer, 18, 8, 21);
            setVerticalLine(canvas, buffer, 55, 3, 50);
            setVerticalLine(canvas, buffer, 32, 30, 48);
            setHorizontalLine(canvas, buffer, 7, 24, 5);
            setHorizontalLine(canvas, buffer, 10, 31, 17);
            setHorizontalLine(canvas, buffer, 12, 44, 26);
            setHorizontalLine(canvas, buffer, 3, 24, 54);
            setHorizontalLine(canvas, buffer, 27, 59, 56);
            for (var _ = 100; 0 < _; _--) {
                var x = Math.floor(Math.random() * canvas.width);
                var y = Math.floor(Math.random() * canvas.height);
                if (buffer[(y * canvas.width) + x] === WHITE) {
                    current.x = x;
                    current.y = y;
                    target.x = x;
                    target.y = y;
                    move.x = x;
                    move.y = y;
                    break;
                }
            }
            buffer[(current.y * canvas.width) + current.x] = LIGHT_GRAY;
            setMask(canvas, mask, buffer, current);
            setImage(ctx, image, buffer, mask);
        }
        var loop = function () {
            doStep(canvas, mask, buffer, current, target, move, speed);
            setImage(ctx, image, buffer, mask);
            requestAnimationFrame(loop);
        };
        loop();
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