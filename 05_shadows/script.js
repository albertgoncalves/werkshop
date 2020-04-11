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
    var DEBUG = false;
    var CANVAS_SCALE = 3;
    var DARK_GRAY = 112;
    var LIGHT_GRAY = 224;
    var WHITE = 255;
    var OPAQUE = 255;
    var TRANSPARENT = 0;
    var RADIUS = 91;
    var RADIUS_SQUARED = RADIUS * RADIUS;
    var APERTURE = 0.499;
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
        var yEnd = RADIUS + 1;
        for (var dY = octal.start; dY < yEnd; dY++) {
            var blocked = false;
            var y = position.y + (dY * octal.yMult);
            var yDelta = y - position.y;
            var yDeltaSquared = yDelta * yDelta;
            var yWidth = y * position.width;
            for (var dX = dY + 1; -1 < dX; dX--) {
                var lSlope = (dX - APERTURE) / (dY + APERTURE);
                if (octal.slopeStart < lSlope) {
                    continue;
                }
                var rSlope = (dX + APERTURE) / (dY - APERTURE);
                if (rSlope < octal.slopeEnd) {
                    break;
                }
                var x = position.x + (dX * octal.xMult);
                var xDelta = x - position.x;
                if ((((xDelta * xDelta) + yDeltaSquared) < RADIUS_SQUARED) &&
                    (0 <= x) && (x < position.width) && (0 <= y) &&
                    (y < position.height)) {
                    mask[yWidth + x] = OPAQUE;
                }
                if (blocked) {
                    if (getBlocked(buffer, position, x, y)) {
                        nextStart = lSlope;
                        continue;
                    }
                    else {
                        blocked = false;
                        octal.slopeStart = nextStart;
                    }
                }
                else {
                    if ((getBlocked(buffer, position, x, y)) && (dY < RADIUS)) {
                        blocked = true;
                        setMaskColRow(mask, buffer, position, {
                            xMult: octal.xMult,
                            yMult: octal.yMult,
                            start: dY + 1,
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
    function setMaskRowCol(mask, buffer, position, octal) {
        if (octal.slopeStart < octal.slopeEnd) {
            return;
        }
        var nextStart = octal.slopeStart;
        var xEnd = RADIUS + 1;
        for (var dX = octal.start; dX < xEnd; dX++) {
            var blocked = false;
            var x = position.x + (dX * octal.xMult);
            var xDelta = x - position.x;
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
                var y = position.y + (dY * octal.yMult);
                var yDelta = y - position.y;
                var yWidth = y * position.width;
                if (((xDeltaSquared + (yDelta * yDelta)) < RADIUS_SQUARED) &&
                    (0 <= x) && (x < position.width) && (0 <= y) &&
                    (y < position.height)) {
                    mask[yWidth + x] = OPAQUE;
                }
                if (blocked) {
                    if (getBlocked(buffer, position, x, y)) {
                        nextStart = lSlope;
                        continue;
                    }
                    else {
                        blocked = false;
                        octal.slopeStart = nextStart;
                    }
                }
                else {
                    if ((getBlocked(buffer, position, x, y)) && (dX < RADIUS)) {
                        blocked = true;
                        setMaskRowCol(mask, buffer, position, {
                            xMult: octal.xMult,
                            yMult: octal.yMult,
                            start: dX + 1,
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
    function doMove(ctx, image, mask, buffer, position, x, y) {
        var index = (y * position.width) + x;
        if (buffer[index] === WHITE) {
            buffer[(position.y * position.width) + position.x] = WHITE;
            buffer[index] = LIGHT_GRAY;
            position.x = x;
            position.y = y;
            if (DEBUG) {
                console.time("setMask ");
                setMask(mask, buffer, position);
                console.timeEnd("setMask ");
                console.time("setImage");
                setImage(ctx, image, buffer, mask);
                console.timeEnd("setImage");
            }
            else {
                setMask(mask, buffer, position);
                setImage(ctx, image, buffer, mask);
            }
        }
    }
    window.onload = function () {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        var position = {
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height
        };
        var n = position.width * position.height;
        var image = ctx.createImageData(position.width, position.height);
        var buffer = new Uint8ClampedArray(n);
        var mask = new Uint8ClampedArray(n);
        buffer.fill(WHITE);
        {
            setVerticalLine(buffer, position.width, 6, 10, 40);
            setVerticalLine(buffer, position.width, 25, 10, 20);
            setVerticalLine(buffer, position.width, 18, 8, 21);
            setVerticalLine(buffer, position.width, 55, 3, 50);
            setVerticalLine(buffer, position.width, 32, 30, 48);
            setHorizontalLine(buffer, position.width, 7, 24, 5);
            setHorizontalLine(buffer, position.width, 10, 31, 17);
            setHorizontalLine(buffer, position.width, 12, 44, 26);
            setHorizontalLine(buffer, position.width, 3, 24, 54);
            setHorizontalLine(buffer, position.width, 27, 59, 56);
            for (var _ = 100; 0 < _; _--) {
                var x = Math.floor(Math.random() * position.width);
                var y = Math.floor(Math.random() * position.height);
                if (buffer[(y * position.width) + x] === WHITE) {
                    position.x = x;
                    position.y = y;
                    break;
                }
            }
            buffer[(position.y * position.width) + position.x] = LIGHT_GRAY;
            if (DEBUG) {
                console.time("setMask ");
                setMask(mask, buffer, position);
                console.timeEnd("setMask ");
                console.time("setImage");
                setImage(ctx, image, buffer, mask);
                console.timeEnd("setImage");
            }
            else {
                setMask(mask, buffer, position);
                setImage(ctx, image, buffer, mask);
            }
        }
        canvas.addEventListener("mousedown", function (event) {
            var x = (event.x + window.pageXOffset - canvas.offsetLeft) >> CANVAS_SCALE;
            var y = (event.y + window.pageYOffset - canvas.offsetTop) >> CANVAS_SCALE;
            doMove(ctx, image, mask, buffer, position, x, y);
        });
        canvas.setAttribute("tabindex", "0");
        canvas.focus();
        canvas.addEventListener("keydown", function (event) {
            switch (event.code) {
                case "ArrowUp": {
                    event.preventDefault();
                    var y = position.y - 1;
                    if (0 <= y) {
                        doMove(ctx, image, mask, buffer, position, position.x, y);
                    }
                    break;
                }
                case "ArrowDown": {
                    event.preventDefault();
                    var y = position.y + 1;
                    if (y < position.height) {
                        doMove(ctx, image, mask, buffer, position, position.x, y);
                    }
                    break;
                }
                case "ArrowLeft": {
                    event.preventDefault();
                    var x = position.x - 1;
                    if (0 <= x) {
                        doMove(ctx, image, mask, buffer, position, x, position.y);
                    }
                    break;
                }
                case "ArrowRight": {
                    event.preventDefault();
                    var x = position.x + 1;
                    if (x < position.width) {
                        doMove(ctx, image, mask, buffer, position, x, position.y);
                    }
                    break;
                }
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