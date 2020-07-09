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
    var __assign = (this && this.__assign) || function () {
        __assign = Object.assign || function(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    window.onload = function () {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        var buffer = ctx.createImageData(canvas.width, canvas.height);
        var decay = 2;
        var spread = 4.0;
        var halfSpread = spread / 2.0;
        var epsilon = 0.015;
        var n = canvas.width * canvas.height * 4;
        var initRect = {
            x: 20,
            y: 20,
            width: 24,
            height: 24
        };
        var rect = __assign({}, initRect);
        var color = {
            red: 12,
            green: 18,
            blue: 24,
            alpha: 4
        };
        function loop() {
            rect.x += Math.round((Math.random() * spread) - halfSpread - epsilon);
            rect.y += Math.round((Math.random() * spread) - halfSpread - epsilon);
            for (var i = 0; i < n; i += 4) {
                buffer.data[i] = Math.max(buffer.data[i] - decay, 0);
                buffer.data[i + 1] = Math.max(buffer.data[i + 1] - decay, 0);
                buffer.data[i + 2] = Math.max(buffer.data[i + 2] - decay, 0);
                buffer.data[i + 3] = Math.max(buffer.data[i + 3] - decay, 0);
            }
            var reset = true;
            for (var y = rect.y + rect.height - 1; rect.y <= y; --y) {
                if (y < 0) {
                    break;
                }
                if (canvas.height <= y) {
                    continue;
                }
                var offset = (y << 2) * canvas.width;
                for (var x = rect.x + rect.width - 1; rect.x <= x; --x) {
                    if (x < 0) {
                        break;
                    }
                    if (canvas.width <= x) {
                        continue;
                    }
                    var i = (x << 2) + offset;
                    buffer.data[i] = Math.min(buffer.data[i] + color.red, 255);
                    buffer.data[i + 1] =
                        Math.min(buffer.data[i + 1] + color.green, 255);
                    buffer.data[i + 2] =
                        Math.min(buffer.data[i + 2] + color.blue, 255);
                    buffer.data[i + 3] =
                        Math.min(buffer.data[i + 3] + color.alpha, 255);
                    if (reset) {
                        reset = false;
                    }
                }
            }
            if (reset) {
                rect = __assign({}, initRect);
            }
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