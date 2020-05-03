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
    define("shadows", ["require", "exports"], function (require, exports) {
        "use strict";
        exports.__esModule = true;
        var VISIBLE = 255;
        var HIDDEN = 48;
        var APERTURE = 0.5;
        var RADIUS = 182;
        var RADIUS_SQUARED = RADIUS * RADIUS;
        function getBlocked(buffer, width, height, empty, x, y) {
            return ((x < 0) || (y < 0) || (width <= x) || (height <= y) ||
                (buffer[(width * y) + x] !== empty));
        }
        function setMaskColRow(mask, buffer, width, height, empty, current, octal) {
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
                var yWidth = y * width;
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
                        (0 <= x) && (x < width) && (0 <= y) && (y < height)) {
                        mask[yWidth + x] = VISIBLE;
                        visible = true;
                    }
                    if (blocked) {
                        if (getBlocked(buffer, width, height, empty, x, y)) {
                            nextStart = lSlope;
                            continue;
                        }
                        else {
                            blocked = false;
                            octal.slopeStart = nextStart;
                        }
                    }
                    else {
                        if ((getBlocked(buffer, width, height, empty, x, y)) &&
                            (dY < RADIUS)) {
                            blocked = true;
                            setMaskColRow(mask, buffer, width, height, empty, current, {
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
        function setMaskRowCol(mask, buffer, width, height, empty, current, octal) {
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
                    var yWidth = y * width;
                    var yDelta = y - current.y;
                    if (((xDeltaSquared + (yDelta * yDelta)) < RADIUS_SQUARED) &&
                        (0 <= x) && (x < width) && (0 <= y) && (y < height)) {
                        mask[yWidth + x] = VISIBLE;
                        visible = true;
                    }
                    if (blocked) {
                        if (getBlocked(buffer, width, height, empty, x, y)) {
                            nextStart = lSlope;
                            continue;
                        }
                        else {
                            blocked = false;
                            octal.slopeStart = nextStart;
                        }
                    }
                    else {
                        if ((getBlocked(buffer, width, height, empty, x, y)) &&
                            (dX < RADIUS)) {
                            blocked = true;
                            setMaskRowCol(mask, buffer, width, height, empty, current, {
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
        function setMask(mask, buffer, width, height, empty, current) {
            mask.fill(HIDDEN);
            mask[(current.y * width) + current.x] = VISIBLE;
            setMaskColRow(mask, buffer, width, height, empty, current, {
                xMult: 1,
                yMult: 1,
                loopStart: 1,
                slopeStart: 1.0,
                slopeEnd: 0.0
            });
            setMaskColRow(mask, buffer, width, height, empty, current, {
                xMult: 1,
                yMult: -1,
                loopStart: 1,
                slopeStart: 1.0,
                slopeEnd: 0.0
            });
            setMaskColRow(mask, buffer, width, height, empty, current, {
                xMult: -1,
                yMult: 1,
                loopStart: 1,
                slopeStart: 1.0,
                slopeEnd: 0.0
            });
            setMaskColRow(mask, buffer, width, height, empty, current, {
                xMult: -1,
                yMult: -1,
                loopStart: 1,
                slopeStart: 1.0,
                slopeEnd: 0.0
            });
            setMaskRowCol(mask, buffer, width, height, empty, current, {
                xMult: 1,
                yMult: 1,
                loopStart: 1,
                slopeStart: 1.0,
                slopeEnd: 0.0
            });
            setMaskRowCol(mask, buffer, width, height, empty, current, {
                xMult: 1,
                yMult: -1,
                loopStart: 1,
                slopeStart: 1.0,
                slopeEnd: 0.0
            });
            setMaskRowCol(mask, buffer, width, height, empty, current, {
                xMult: -1,
                yMult: 1,
                loopStart: 1,
                slopeStart: 1.0,
                slopeEnd: 0.0
            });
            setMaskRowCol(mask, buffer, width, height, empty, current, {
                xMult: -1,
                yMult: -1,
                loopStart: 1,
                slopeStart: 1.0,
                slopeEnd: 0.0
            });
        }
        exports.setMask = setMask;
    });
    define("space_partition", ["require", "exports"], function (require, exports) {
        "use strict";
        exports.__esModule = true;
        var ITERATION_LIMIT = 100;
        var MIN_DELTA = 1 << 5;
        var MIN_SPLIT = (1 * 6) + 1;
        var PAD = MIN_SPLIT >> 1;
        var PAD_DOUBLE = PAD << 1;
        function getPartitions(stack) {
            var edges = [];
            var partition = stack.pop();
            while (partition) {
                if (partition.horizontal) {
                    var yDelta = partition.yUpper - partition.yLower;
                    for (var i = ITERATION_LIMIT; 0 < i; --i) {
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
                    for (var i = ITERATION_LIMIT; 0 < i; --i) {
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
        exports.getPartitions = getPartitions;
        function getSplitEdges(preEdges) {
            var edges = [];
            for (var i = preEdges.length - 1; 0 <= i; --i) {
                var edge = preEdges[i];
                if (edge.x1 === edge.x2) {
                    var x = edge.x1;
                    var neighbors = [edge.y1, edge.y2];
                    for (var j = preEdges.length - 1; 0 <= j; --j) {
                        if (i === j) {
                            continue;
                        }
                        var candidate = preEdges[j];
                        if ((candidate.y1 === candidate.y2) &&
                            ((edge.y1 < candidate.y1) && (candidate.y1 < edge.y2)) &&
                            ((candidate.x1 === x) || (candidate.x2 === x))) {
                            neighbors.push(candidate.y1);
                        }
                    }
                    neighbors.sort(function (a, b) {
                        return a - b;
                    });
                    for (var k = neighbors.length - 1; 0 < k; --k) {
                        var y1 = neighbors[k - 1];
                        var y2 = neighbors[k];
                        var yDelta = y2 - y1;
                        if (yDelta !== 0) {
                            if (yDelta <= MIN_SPLIT) {
                                edges.push({
                                    x1: x,
                                    y1: y1,
                                    x2: x,
                                    y2: y2
                                });
                            }
                            else {
                                var ySplit = Math.floor(Math.random() * (yDelta - PAD_DOUBLE)) +
                                    y1 + PAD;
                                edges.push({
                                    x1: x,
                                    y1: y1,
                                    x2: x,
                                    y2: ySplit - PAD
                                });
                                edges.push({
                                    x1: x,
                                    y1: ySplit + PAD,
                                    x2: x,
                                    y2: y2
                                });
                            }
                        }
                    }
                }
                else if (edge.y1 === edge.y2) {
                    var y = edge.y1;
                    var neighbors = [edge.x1, edge.x2];
                    for (var j = preEdges.length - 1; 0 <= j; --j) {
                        if (i === j) {
                            continue;
                        }
                        var candidate = preEdges[j];
                        if ((candidate.x1 === candidate.x2) &&
                            ((edge.x1 < candidate.x1) && (candidate.x1 < edge.x2)) &&
                            ((candidate.y1 === y) || (candidate.y2 === y))) {
                            neighbors.push(candidate.x1);
                        }
                    }
                    neighbors.sort(function (a, b) {
                        return a - b;
                    });
                    for (var k = neighbors.length - 1; 0 < k; --k) {
                        var x1 = neighbors[k - 1];
                        var x2 = neighbors[k];
                        var xDelta = x2 - x1;
                        if (xDelta !== 0) {
                            if (xDelta <= MIN_SPLIT) {
                                edges.push({
                                    x1: x1,
                                    y1: y,
                                    x2: x2,
                                    y2: y
                                });
                            }
                            else {
                                var xSplit = Math.floor(Math.random() * (xDelta - PAD_DOUBLE)) +
                                    x1 + PAD;
                                edges.push({
                                    x1: x1,
                                    y1: y,
                                    x2: xSplit - PAD,
                                    y2: y
                                });
                                edges.push({
                                    x1: xSplit + PAD,
                                    y1: y,
                                    x2: x2,
                                    y2: y
                                });
                            }
                        }
                    }
                }
            }
            return edges;
        }
        exports.getSplitEdges = getSplitEdges;
    });
    define("main", ["require", "exports", "shadows", "space_partition"], function (require, exports, shadows_1, space_partition_1) {
        "use strict";
        exports.__esModule = true;
        var EMPTY = 0;
        var PLAYER = 1;
        var BLOCK = 2;
        var KEY_UP = "i";
        var KEY_DOWN = "k";
        var KEY_LEFT = "j";
        var KEY_RIGHT = "l";
        var FRAME_STEP = 8.0;
        var FRAME_SPEED = 0.475;
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
            var n = buffer.length - 1;
            var j = n << 2;
            for (var i = n; 0 <= i; --i) {
                switch (buffer[i]) {
                    case EMPTY: {
                        image.data[j] = 240;
                        image.data[j + 1] = 240;
                        image.data[j + 2] = 240;
                        break;
                    }
                    case PLAYER: {
                        image.data[j] = 240;
                        image.data[j + 1] = 95;
                        image.data[j + 2] = 85;
                        break;
                    }
                    case BLOCK: {
                        image.data[j] = 170;
                        image.data[j + 1] = 165;
                        image.data[j + 2] = 160;
                        break;
                    }
                }
                image.data[j + 3] = mask[i];
                j -= 4;
            }
            ctx.putImageData(image, 0, 0);
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
                keyCount: 0
            };
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
                var edges = space_partition_1.getSplitEdges(space_partition_1.getPartitions([{
                        xLower: 0,
                        xUpper: WIDTH - 1,
                        yLower: 0,
                        yUpper: HEIGHT - 1,
                        horizontal: false
                    }]));
                for (var i = edges.length - 1; 0 <= i; --i) {
                    var edge = edges[i];
                    if (edge.x1 === edge.x2) {
                        setVerticalLine(buffer, edge.x1, edge.y1, edge.y2);
                    }
                    else if (edge.y1 === edge.y2) {
                        setHorizontalLine(buffer, edge.x1, edge.x2, edge.y1);
                    }
                }
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
                shadows_1.setMask(mask, buffer, WIDTH, HEIGHT, EMPTY, current);
                setImage(ctx, image, buffer, mask);
            }
            var debugFPS = document.getElementById("debug-fps");
            var loop = function (frameTime) {
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
                shadows_1.setMask(mask, buffer, WIDTH, HEIGHT, EMPTY, target);
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
    });
    
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