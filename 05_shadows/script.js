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
    var ALPHA_OPAQUE = 255;
    var ALPHA_TRANSPARENT = 48;
    var COLOR_DARKGRAY = 112;
    var COLOR_LIGHTGRAY = 224;
    var COLOR_WHITE = 255;
    var VISIBLE = ALPHA_OPAQUE;
    var HIDDEN = ALPHA_TRANSPARENT;
    var BLOCK = COLOR_DARKGRAY;
    var EMPTY = COLOR_WHITE;
    var PLAYER = COLOR_LIGHTGRAY;
    var RADIUS = 91;
    var RADIUS_SQUARED = RADIUS * RADIUS;
    var APERTURE = 0.5;
    var KEY_UP = "i";
    var KEY_DOWN = "k";
    var KEY_LEFT = "j";
    var KEY_RIGHT = "l";
    var FRAME_STEP = 8.0;
    var FRAME_SPEED = 0.4;
    var WIDTH = 0;
    var HEIGHT = 0;
    var WIDTH_BOUND = 0;
    var HEIGHT_BOUND = 0;
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
        for (var i = start; i <= end; ++i) {
            buffer[i] = BLOCK;
        }
    }
    function setImage(ctx, image, buffer, mask) {
        for (var i = buffer.length - 1; 0 <= i; --i) {
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
        for (var dY = octal.loopStart; dY < yEnd; ++dY) {
            var blocked = false;
            var visible = false;
            var y = current.y + (dY * octal.yMult);
            var yDelta = y - current.y;
            var yDeltaSquared = yDelta * yDelta;
            var yWidth = y * WIDTH;
            for (var dX = dY; 0 <= dX; --dX) {
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
                    visible = true;
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
            if (blocked || (!visible)) {
                return;
            }
        }
    }
    function setMaskRowCol(mask, buffer, current, octal) {
        if (octal.slopeStart < octal.slopeEnd) {
            return;
        }
        var nextStart = octal.slopeStart;
        var xEnd = RADIUS + 1;
        for (var dX = octal.loopStart; dX < xEnd; ++dX) {
            var blocked = false;
            var visible = false;
            var x = current.x + (dX * octal.xMult);
            var xDelta = x - current.x;
            var xDeltaSquared = xDelta * xDelta;
            for (var dY = dX; 0 <= dY; --dY) {
                var lSlope = (dY - APERTURE) / (dX + APERTURE);
                if (octal.slopeStart < lSlope) {
                    continue;
                }
                var rSlope = (dY + APERTURE) / (dX - APERTURE);
                if (rSlope < octal.slopeEnd) {
                    break;
                }
                var y = current.y + (dY * octal.yMult);
                var yWidth = y * WIDTH;
                var yDelta = y - current.y;
                if (((xDeltaSquared + (yDelta * yDelta)) < RADIUS_SQUARED) &&
                    (0 <= x) && (x < WIDTH) && (0 <= y) && (y < HEIGHT)) {
                    mask[yWidth + x] = VISIBLE;
                    visible = true;
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
            if (blocked || (!visible)) {
                return;
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
    function getKeyUp(buffer, keys, current) {
        return ((keys.up !== 0) && (keys.down === 0) && (keys.left < keys.up) &&
            (keys.right < keys.up) && (0 < current.y) &&
            (buffer[((current.y - 1) * WIDTH) + current.x] === EMPTY));
    }
    function getKeyDown(buffer, keys, current) {
        return ((keys.down !== 0) && (keys.up === 0) && (keys.left < keys.down) &&
            (keys.right < keys.down) && (current.y < HEIGHT_BOUND) &&
            (buffer[((current.y + 1) * WIDTH) + current.x] === EMPTY));
    }
    function getKeyLeft(buffer, keys, current) {
        return ((keys.left !== 0) && (keys.right === 0) && (keys.up < keys.left) &&
            (keys.down < keys.left) && (0 < current.x) &&
            (buffer[(current.y * WIDTH) + current.x - 1] === EMPTY));
    }
    function getKeyRight(buffer, keys, current) {
        return ((keys.right !== 0) && (keys.left === 0) &&
            (keys.up < keys.right) && (keys.down < keys.right) &&
            (current.x < WIDTH_BOUND) &&
            (buffer[(current.y * WIDTH) + current.x + 1] === EMPTY));
    }
    window.onload = function () {
        var canvas = document.getElementById("canvas");
        WIDTH = canvas.width;
        HEIGHT = canvas.height;
        var n = WIDTH * HEIGHT;
        if (n === 0) {
            return;
        }
        WIDTH_BOUND = WIDTH - 1;
        HEIGHT_BOUND = HEIGHT - 1;
        canvas.setAttribute("tabindex", "0");
        canvas.focus();
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
        var keys = {
            up: 0,
            down: 0,
            left: 0,
            right: 0
        };
        var state = {
            framePrevTime: 0.0,
            frameIncrements: 0.0,
            debugPrevTime: 0.0,
            debugCount: 0,
            keyCount: 0,
            mouseClick: false
        };
        canvas.addEventListener("mousedown", function (event) {
            var x = (event.x + window.pageXOffset - canvas.offsetLeft) >> CANVAS_SCALE;
            var y = (event.y + window.pageYOffset - canvas.offsetTop) >> CANVAS_SCALE;
            var index = (y * WIDTH) + x;
            if (buffer[index] === EMPTY) {
                state.mouseClick = true;
                target.x = x;
                target.y = y;
            }
        }, false);
        var debugKeyAction = document.getElementById("debug-key-action");
        var debugKeysState = document.getElementById("debug-keys-state");
        canvas.addEventListener("keydown", function (event) {
            switch (event.key) {
                case KEY_UP: {
                    event.preventDefault();
                    if (event.repeat) {
                        return;
                    }
                    keys.up = ++state.keyCount;
                    debugKeyAction.innerHTML = "pressed <strong>up</strong>";
                    debugKeysState.innerHTML = "<em>" + JSON.stringify(keys) + "</em>";
                    break;
                }
                case KEY_DOWN: {
                    event.preventDefault();
                    if (event.repeat) {
                        return;
                    }
                    keys.down = ++state.keyCount;
                    debugKeyAction.innerHTML = "pressed <strong>down</strong>";
                    debugKeysState.innerHTML = "<em>" + JSON.stringify(keys) + "</em>";
                    break;
                }
                case KEY_LEFT: {
                    event.preventDefault();
                    if (event.repeat) {
                        return;
                    }
                    keys.left = ++state.keyCount;
                    debugKeyAction.innerHTML = "pressed <strong>left</strong>";
                    debugKeysState.innerHTML = "<em>" + JSON.stringify(keys) + "</em>";
                    break;
                }
                case KEY_RIGHT: {
                    event.preventDefault();
                    if (event.repeat) {
                        return;
                    }
                    keys.right = ++state.keyCount;
                    debugKeyAction.innerHTML = "pressed <strong>right</strong>";
                    debugKeysState.innerHTML = "<em>" + JSON.stringify(keys) + "</em>";
                    break;
                }
            }
        }, false);
        canvas.addEventListener("keyup", function (event) {
            switch (event.key) {
                case KEY_UP: {
                    event.preventDefault();
                    if (event.repeat) {
                        return;
                    }
                    keys.up = 0;
                    debugKeyAction.innerHTML = "released <strong>up</strong>";
                    debugKeysState.innerHTML = "<em>" + JSON.stringify(keys) + "</em>";
                    break;
                }
                case KEY_DOWN: {
                    event.preventDefault();
                    if (event.repeat) {
                        return;
                    }
                    keys.down = 0;
                    debugKeyAction.innerHTML = "released <strong>down</strong>";
                    debugKeysState.innerHTML = "<em>" + JSON.stringify(keys) + "</em>";
                    break;
                }
                case KEY_LEFT: {
                    event.preventDefault();
                    if (event.repeat) {
                        return;
                    }
                    keys.left = 0;
                    debugKeyAction.innerHTML = "released <strong>left</strong>";
                    debugKeysState.innerHTML = "<em>" + JSON.stringify(keys) + "</em>";
                    break;
                }
                case KEY_RIGHT: {
                    event.preventDefault();
                    if (event.repeat) {
                        return;
                    }
                    keys.right = 0;
                    debugKeyAction.innerHTML = "released <strong>right</strong>";
                    debugKeysState.innerHTML = "<em>" + JSON.stringify(keys) + "</em>";
                    break;
                }
            }
        }, false);
        {
            setVerticalLine(buffer, 6, 10, 15);
            setVerticalLine(buffer, 6, 19, 40);
            setVerticalLine(buffer, 18, 8, 21);
            setVerticalLine(buffer, 25, 10, 20);
            setVerticalLine(buffer, 32, 33, 40);
            setVerticalLine(buffer, 32, 46, 51);
            setVerticalLine(buffer, 45, 7, 11);
            setVerticalLine(buffer, 45, 15, 21);
            setVerticalLine(buffer, 55, 3, 9);
            setVerticalLine(buffer, 55, 13, 19);
            setVerticalLine(buffer, 55, 23, 28);
            setVerticalLine(buffer, 55, 32, 37);
            setVerticalLine(buffer, 55, 42, 50);
            setHorizontalLine(buffer, 7, 24, 5);
            setHorizontalLine(buffer, 10, 19, 17);
            setHorizontalLine(buffer, 22, 31, 17);
            setHorizontalLine(buffer, 12, 25, 26);
            setHorizontalLine(buffer, 29, 44, 26);
            setHorizontalLine(buffer, 3, 24, 54);
            setHorizontalLine(buffer, 27, 59, 56);
            for (var _ = 100; 0 < _; --_) {
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
        var debugFPS = document.getElementById("debug-fps");
        var loop = function (frameTime) {
            if (state.mouseClick) {
                buffer[(current.y * WIDTH) + current.x] = EMPTY;
                buffer[(target.y * WIDTH) + target.x] = PLAYER;
                current.x = target.x;
                current.y = target.y;
                move.x = target.x;
                move.y = target.y;
                state.mouseClick = false;
            }
            else {
                state.frameIncrements += frameTime - state.framePrevTime;
                while (FRAME_STEP < state.frameIncrements) {
                    if ((keys.up | keys.down | keys.left | keys.right) === 0) {
                        move.x = current.x;
                        move.y = current.y;
                        state.keyCount = 0;
                    }
                    else if (getKeyUp(buffer, keys, current)) {
                        move.x = current.x;
                        move.y -= FRAME_SPEED;
                        target.y = Math.round(move.y);
                    }
                    else if (getKeyDown(buffer, keys, current)) {
                        move.x = current.x;
                        move.y += FRAME_SPEED;
                        target.y = Math.round(move.y);
                    }
                    else if (getKeyLeft(buffer, keys, current)) {
                        move.x -= FRAME_SPEED;
                        move.y = current.y;
                        target.x = Math.round(move.x);
                    }
                    else if (getKeyRight(buffer, keys, current)) {
                        move.x += FRAME_SPEED;
                        move.y = current.y;
                        target.x = Math.round(move.x);
                    }
                    if ((target.x !== current.x) || (target.y !== current.y)) {
                        buffer[(current.y * WIDTH) + current.x] = EMPTY;
                        buffer[(target.y * WIDTH) + target.x] = PLAYER;
                        current.x = target.x;
                        current.y = target.y;
                    }
                    state.frameIncrements -= FRAME_STEP;
                }
            }
            setMask(mask, buffer, target);
            setImage(ctx, image, buffer, mask);
            ++state.debugCount;
            var debugElapsed = frameTime - state.debugPrevTime;
            if (1000 < debugElapsed) {
                debugFPS.innerHTML = "<strong>" +
                    ((state.debugCount / debugElapsed) * 1000).toFixed(2) +
                    "</strong> fps";
                state.debugPrevTime = frameTime;
                state.debugCount = 0;
            }
            state.framePrevTime = frameTime;
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