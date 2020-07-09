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
    var GLOBAL = {
        width: 0,
        height: 0
    };
    function setRect(buffer, rect, color) {
        for (var y = 0; y < rect.height; ++y) {
            var offset = ((rect.y + y) << 2) * GLOBAL.width;
            for (var x = 0; x < rect.width; ++x) {
                var i = ((rect.x + x) << 2) + offset;
                buffer.data[i] = Math.min(buffer.data[i] + color.red, 255);
                buffer.data[i + 1] =
                    Math.min(buffer.data[i + 1] + color.green, 255);
                buffer.data[i + 2] =
                    Math.min(buffer.data[i + 2] + color.blue, 255);
                buffer.data[i + 3] =
                    Math.min(buffer.data[i + 3] + color.alpha, 255);
            }
        }
    }
    window.onload = function () {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        GLOBAL.width = canvas.width;
        GLOBAL.height = canvas.height;
        var halfWidth = GLOBAL.width / 2.0;
        var halfHeight = GLOBAL.height / 2.0;
        var n = GLOBAL.width * GLOBAL.height * 4;
        if (n === 0) {
            return;
        }
        var rect = {
            x: 64,
            y: 64,
            width: 128,
            height: 128
        };
        if ((rect.x < 0.0) || (GLOBAL.width <= (rect.x + rect.width)) ||
            (rect.y < 0.0) || (GLOBAL.height <= (rect.y + rect.height)) ||
            (rect.width < 0.0) || (halfWidth <= rect.width) ||
            (rect.height < 0.0) || (halfHeight <= rect.height)) {
            return;
        }
        var color = {
            red: 6,
            green: 9,
            blue: 12,
            alpha: 8
        };
        var decay = 1;
        var spread = 32.0;
        var halfSpread = spread / 2.0;
        var buffer = ctx.createImageData(GLOBAL.width, GLOBAL.height);
        function loop() {
            {
                var x = rect.x + (Math.random() * spread) - halfSpread;
                while ((x < 0.0) || (GLOBAL.width <= (x + rect.width))) {
                    x = rect.x + (Math.random() * spread) - halfSpread;
                }
                rect.x = x;
            }
            {
                var y = rect.y + (Math.random() * spread) - halfSpread;
                while ((y < 0.0) || (GLOBAL.height <= (y + rect.height))) {
                    y = rect.y + (Math.random() * spread) - halfSpread;
                }
                rect.y = y;
            }
            {
                var width = rect.width + (Math.random() * spread) - halfSpread;
                while ((width < 0.0) || (halfWidth <= width)) {
                    width = rect.width + (Math.random() * spread) - halfSpread;
                }
                rect.width = width;
            }
            {
                var height = rect.height + (Math.random() * spread) - halfSpread;
                while ((height < 0.0) || (halfHeight <= height)) {
                    height = rect.height + (Math.random() * spread) - halfSpread;
                }
                rect.height = height;
            }
            for (var i = 0; i < n; i += 4) {
                buffer.data[i] = Math.max(buffer.data[i] - decay, 0);
                buffer.data[i + 1] = Math.max(buffer.data[i + 1] - decay, 0);
                buffer.data[i + 2] = Math.max(buffer.data[i + 2] - decay, 0);
                buffer.data[i + 3] = Math.max(buffer.data[i + 3] - decay, 0);
            }
            setRect(buffer, rect, color);
            ctx.putImageData(buffer, 0, 0);
            window.requestAnimationFrame(loop);
        }
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