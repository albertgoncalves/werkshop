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
    window.onload = function () {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        var width = canvas.width;
        var height = canvas.height;
        var buffer = ctx.createImageData(width, height);
        function loop(t) {
            window.requestAnimationFrame(loop);
            var offset = Math.floor(t >>> 4);
            for (var y = 0; y < height; y++) {
                var yWidth = y * width;
                var yOffset = (y + offset) & 255;
                for (var x = 0; x < width; x++) {
                    var index = (yWidth + x) << 2;
                    var red = ((x + offset) & 255) ^ yOffset;
                    var green = (((x << 1) + offset) & 255) ^ (((y << 1) + offset) & 255);
                    var blue = (((x << 2) + offset) & 255) ^ (((y << 2) + offset) & 255);
                    buffer.data[index] = red;
                    buffer.data[index + 1] = green;
                    buffer.data[index + 2] = blue;
                    buffer.data[index + 3] = 255;
                }
            }
            ctx.putImageData(buffer, 0, 0);
        }
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