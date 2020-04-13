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
    var ALPHA = {
        opaque: 255,
        transparent: 40
    };
    var COLOR = {
        darkGray: 112,
        lightGray: 224,
        white: 255
    };
    var VISIBLE = ALPHA.opaque;
    var HIDDEN = ALPHA.transparent;
    var BLOCK = COLOR.darkGray;
    var EMPTY = COLOR.white;
    var PLAYER = COLOR.lightGray;
    var RADIUS = 91;
    var RADIUS_SQUARED = RADIUS * RADIUS;
    var APERTURE = 0.499;
    var SPEED = 0.65;
    var FRAME_MS = (1 / 60) * 1000;
    var WIDTH = 0;
    var HEIGHT = 0;
    function setVerticalLine(buffer, x, yStart, yEnd) {
        var start = (yStart * WIDTH) + x;
        var end = (yEnd * WIDTH) + x;
        for (var i = start; i <= end; i += WIDTH) {
            buffer[i] = BLOCK;
        }
    }
    function setHorizontalLine(buffer, xStart, xEnd, y) {
        var yWidth = y * WIDTH;
        var start = yWidth + xStart;
        var end = yWidth + xEnd;
        for (var i = start; i <= end; i++) {
            buffer[i] = BLOCK;
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
    function getBlocked(buffer, x, y) {
        return ((x < 0) || (y < 0) || (WIDTH <= x) || (HEIGHT <= y) ||
            (buffer[(WIDTH * y) + x] !== EMPTY));
    }
    function setMaskColRow(mask, buffer, current, octal) {
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
            var yWidth = y * WIDTH;
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
                    (0 <= x) && (x < WIDTH) && (0 <= y) && (y < HEIGHT)) {
                    mask[yWidth + x] = VISIBLE;
                }
                if (blocked) {
                    if (getBlocked(buffer, x, y)) {
                        nextStart = lSlope;
                        continue;
                    }
                    else {
                        blocked = false;
                        octal.slopeStart = nextStart;
                    }
                }
                else {
                    if ((getBlocked(buffer, x, y)) && (dY < RADIUS)) {
                        blocked = true;
                        setMaskColRow(mask, buffer, current, {
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
    function setMaskRowCol(mask, buffer, current, octal) {
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
                var yWidth = y * WIDTH;
                if (((xDeltaSquared + (yDelta * yDelta)) < RADIUS_SQUARED) &&
                    (0 <= x) && (x < WIDTH) && (0 <= y) && (y < HEIGHT)) {
                    mask[yWidth + x] = VISIBLE;
                }
                if (blocked) {
                    if (getBlocked(buffer, x, y)) {
                        nextStart = lSlope;
                        continue;
                    }
                    else {
                        blocked = false;
                        octal.slopeStart = nextStart;
                    }
                }
                else {
                    if ((getBlocked(buffer, x, y)) && (dX < RADIUS)) {
                        blocked = true;
                        setMaskRowCol(mask, buffer, current, {
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
    function setMask(mask, buffer, current) {
        mask.fill(HIDDEN);
        mask[(current.y * WIDTH) + current.x] = VISIBLE;
        setMaskColRow(mask, buffer, current, {
            xMult: 1,
            yMult: 1,
            loopStart: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskColRow(mask, buffer, current, {
            xMult: 1,
            yMult: -1,
            loopStart: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskColRow(mask, buffer, current, {
            xMult: -1,
            yMult: 1,
            loopStart: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskColRow(mask, buffer, current, {
            xMult: -1,
            yMult: -1,
            loopStart: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskRowCol(mask, buffer, current, {
            xMult: 1,
            yMult: 1,
            loopStart: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskRowCol(mask, buffer, current, {
            xMult: 1,
            yMult: -1,
            loopStart: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskRowCol(mask, buffer, current, {
            xMult: -1,
            yMult: 1,
            loopStart: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
        setMaskRowCol(mask, buffer, current, {
            xMult: -1,
            yMult: -1,
            loopStart: 1,
            slopeStart: 1.0,
            slopeEnd: 0.0
        });
    }
    function doJump(mask, buffer, current, target, move) {
        if ((current.x === target.x) && (current.y === target.y)) {
            return;
        }
        var index = (target.y * WIDTH) + target.x;
        if (buffer[index] === EMPTY) {
            buffer[(current.y * WIDTH) + current.x] = EMPTY;
            buffer[index] = PLAYER;
            setMask(mask, buffer, target);
            current.x = target.x;
            current.y = target.y;
        }
        else {
            target.x = current.x;
            target.y = current.y;
            move.x = current.x;
            move.y = current.y;
        }
    }
    window.onload = function () {
        var canvas = document.getElementById("canvas");
        WIDTH = canvas.width;
        HEIGHT = canvas.height;
        var n = WIDTH * HEIGHT;
        if (n === 0) {
            return;
        }
        var ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        var image = ctx.createImageData(WIDTH, HEIGHT);
        var mask = new Uint8ClampedArray(n);
        var buffer = new Uint8ClampedArray(n);
        buffer.fill(EMPTY);
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
        var state = {
            time: null
        };
        var keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        canvas.addEventListener("mousedown", function (event) {
            var x = (event.x + window.pageXOffset - canvas.offsetLeft) >> CANVAS_SCALE;
            var y = (event.y + window.pageYOffset - canvas.offsetTop) >> CANVAS_SCALE;
            var index = (y * WIDTH) + x;
            if (mask[index] === VISIBLE) {
                target.x = x;
                target.y = y;
                move.x = x;
                move.y = y;
            }
            else {
                target.x = current.x;
                target.y = current.y;
                move.x = current.x;
                move.y = current.y;
            }
        }, false);
        canvas.setAttribute("tabindex", "0");
        canvas.focus();
        canvas.addEventListener("keydown", function (event) {
            switch (event.key) {
                case "ArrowUp": {
                    event.preventDefault();
                    if (event.repeat) {
                        return;
                    }
                    keys.up = true;
                    break;
                }
                case "ArrowDown": {
                    event.preventDefault();
                    if (event.repeat) {
                        return;
                    }
                    keys.down = true;
                    break;
                }
                case "ArrowLeft": {
                    event.preventDefault();
                    if (event.repeat) {
                        return;
                    }
                    keys.left = true;
                    break;
                }
                case "ArrowRight": {
                    event.preventDefault();
                    if (event.repeat) {
                        return;
                    }
                    keys.right = true;
                    break;
                }
            }
        }, false);
        canvas.addEventListener("keyup", function (event) {
            switch (event.key) {
                case "ArrowUp": {
                    event.preventDefault();
                    if (event.repeat) {
                        return;
                    }
                    keys.up = false;
                    break;
                }
                case "ArrowDown": {
                    event.preventDefault();
                    if (event.repeat) {
                        return;
                    }
                    keys.down = false;
                    break;
                }
                case "ArrowLeft": {
                    event.preventDefault();
                    if (event.repeat) {
                        return;
                    }
                    keys.left = false;
                    break;
                }
                case "ArrowRight": {
                    event.preventDefault();
                    if (event.repeat) {
                        return;
                    }
                    keys.right = false;
                    break;
                }
            }
        }, false);
        {
            setVerticalLine(buffer, 6, 10, 15);
            setVerticalLine(buffer, 6, 19, 40);
            setVerticalLine(buffer, 18, 8, 21);
            setVerticalLine(buffer, 25, 10, 20);
            setVerticalLine(buffer, 32, 30, 40);
            setVerticalLine(buffer, 32, 46, 51);
            setVerticalLine(buffer, 45, 7, 11);
            setVerticalLine(buffer, 45, 15, 21);
            setVerticalLine(buffer, 55, 3, 10);
            setVerticalLine(buffer, 55, 13, 20);
            setVerticalLine(buffer, 55, 23, 29);
            setVerticalLine(buffer, 55, 32, 37);
            setVerticalLine(buffer, 55, 42, 50);
            setHorizontalLine(buffer, 7, 24, 5);
            setHorizontalLine(buffer, 10, 19, 17);
            setHorizontalLine(buffer, 22, 31, 17);
            setHorizontalLine(buffer, 12, 25, 26);
            setHorizontalLine(buffer, 29, 44, 26);
            setHorizontalLine(buffer, 3, 24, 54);
            setHorizontalLine(buffer, 27, 59, 56);
            for (var _ = 100; 0 < _; _--) {
                var x = Math.floor(Math.random() * WIDTH);
                var y = Math.floor(Math.random() * HEIGHT);
                var index = (y * WIDTH) + x;
                if (buffer[index] === EMPTY) {
                    buffer[index] = PLAYER;
                    current.x = x;
                    current.y = y;
                    target.x = x;
                    target.y = y;
                    move.x = x;
                    move.y = y;
                    break;
                }
            }
            setMask(mask, buffer, current);
            setImage(ctx, image, buffer, mask);
        }
        var widthBound = WIDTH - 1;
        var heightBound = HEIGHT - 1;
        var loop = function (t) {
            if (keys.up || keys.down || keys.left || keys.right) {
                var speed = SPEED;
                if ((state.time !== null) && (state.time < t)) {
                    speed = ((t - state.time) / FRAME_MS) * SPEED;
                }
                if (keys.up && (0 < current.y)) {
                    move.y -= speed;
                }
                if (keys.down && (current.y < heightBound)) {
                    move.y += speed;
                }
                if (keys.left && (0 < current.x)) {
                    move.x -= speed;
                }
                if (keys.right && (current.x < widthBound)) {
                    move.x += speed;
                }
                target.x = Math.round(move.x);
                target.y = Math.round(move.y);
            }
            doJump(mask, buffer, current, target, move);
            setImage(ctx, image, buffer, mask);
            state.time = t;
            requestAnimationFrame(loop);
        };
        loop(0);
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