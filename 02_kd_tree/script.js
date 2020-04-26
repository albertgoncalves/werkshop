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
    define("quickselect", ["require", "exports"], function (require, exports) {
        "use strict";
        exports.__esModule = true;
        function swap(array, i, j) {
            var tmp = array[i];
            array[i] = array[j];
            array[j] = tmp;
        }
        function quickSelect(array, k, l, r, compare) {
            var left = l;
            var right = r;
            while (left < right) {
                if (600 < (right - left)) {
                    var n = right - left + 1;
                    var m = k - left + 1;
                    var z = Math.log(n);
                    var s = 0.5 * Math.exp((2 * z) / 3);
                    var d = 0.5 * Math.sqrt((z * s * (n - s)) / n) *
                        (m - (n / 2) < 0 ? -1 : 1);
                    var newLeft = Math.max(left, Math.floor(k - ((m * s) / n) + d));
                    var newRight = Math.min(right, Math.floor(k + (((n - m) * s) / n) + d));
                    quickSelect(array, newLeft, newRight, k, compare);
                }
                var t = array[k];
                var i = left;
                var j = right;
                swap(array, left, k);
                if (0 < compare(array[right], t)) {
                    swap(array, left, right);
                }
                while (i < j) {
                    swap(array, i, j);
                    ++i;
                    while (compare(array[i], t) < 0) {
                        ++i;
                    }
                    --j;
                    while (0 < compare(array[j], t)) {
                        --j;
                    }
                }
                if (compare(array[left], t) === 0) {
                    swap(array, left, j);
                }
                else {
                    ++j;
                    swap(array, j, right);
                }
                if (j <= k) {
                    left = j + 1;
                }
                if (k <= j) {
                    right = j - 1;
                }
            }
        }
        exports.quickSelect = quickSelect;
    });
    define("kdtree", ["require", "exports", "quickselect"], function (require, exports, quickselect_1) {
        "use strict";
        exports.__esModule = true;
        function xCompare(a, b) {
            return a.x - b.x;
        }
        function yCompare(a, b) {
            return a.y - b.y;
        }
        function makeTree(points, horizontal, bounds) {
            var n = points.length;
            if (n === 0) {
                return null;
            }
            var median = Math.floor(n / 2);
            if (horizontal) {
                quickselect_1.quickSelect(points, median, 0, n - 1, xCompare);
                var point = points[median];
                return {
                    point: point,
                    horizontal: horizontal,
                    bounds: bounds,
                    left: makeTree(points.slice(0, median), false, {
                        xLower: bounds.xLower,
                        xUpper: point.x,
                        yLower: bounds.yLower,
                        yUpper: bounds.yUpper
                    }),
                    right: makeTree(points.slice(median + 1), false, {
                        xLower: point.x,
                        xUpper: bounds.xUpper,
                        yLower: bounds.yLower,
                        yUpper: bounds.yUpper
                    })
                };
            }
            else {
                quickselect_1.quickSelect(points, median, 0, n - 1, yCompare);
                var point = points[median];
                return {
                    point: point,
                    horizontal: horizontal,
                    bounds: bounds,
                    left: makeTree(points.slice(0, median), true, {
                        xLower: bounds.xLower,
                        xUpper: bounds.xUpper,
                        yLower: bounds.yLower,
                        yUpper: point.y
                    }),
                    right: makeTree(points.slice(median + 1), true, {
                        xLower: bounds.xLower,
                        xUpper: bounds.xUpper,
                        yLower: point.y,
                        yUpper: bounds.yUpper
                    })
                };
            }
        }
        exports.makeTree = makeTree;
        function boundsCircleOverlap(bounds, circle) {
            var x = circle.x - Math.max(bounds.xLower, Math.min(circle.x, bounds.xUpper));
            var y = circle.y - Math.max(bounds.yLower, Math.min(circle.y, bounds.yUpper));
            return ((x * x) + (y * y)) < circle.radiusSquared;
        }
        function pointInCircle(point, circle) {
            var x = point.x - circle.x;
            var y = point.y - circle.y;
            return ((x * x) + (y * y)) < circle.radiusSquared;
        }
        exports.pointInCircle = pointInCircle;
        function radiusSearch(tree, circle, callback) {
            if (tree === null) {
                return;
            }
            var stack = [tree];
            var node = stack.pop();
            while (node) {
                if (boundsCircleOverlap(node.bounds, circle)) {
                    callback(node.point);
                    if (node.left !== null) {
                        stack.push(node.left);
                    }
                    if (node.right !== null) {
                        stack.push(node.right);
                    }
                }
                node = stack.pop();
            }
        }
        exports.radiusSearch = radiusSearch;
    });
    define("main", ["require", "exports", "kdtree"], function (require, exports, kdtree_1) {
        "use strict";
        exports.__esModule = true;
        var TWICE_PI = Math.PI * 2;
        function drawArc(ctx, x, y, radius) {
            ctx.moveTo(x + radius, y);
            ctx.arc(x, y, radius, 0, TWICE_PI);
        }
        function drawCross(ctx, x, y, radius) {
            ctx.moveTo(x, y - radius);
            ctx.lineTo(x, y + radius);
            ctx.moveTo(x - radius, y);
            ctx.lineTo(x + radius, y);
        }
        function randomColor(alpha) {
            return "hsla(" + Math.floor(Math.random() * 360).toString() +
                ", 65%, 50%, " + alpha.toString() + ")";
        }
        function drawPoints(ctx, points) {
            var n = points.length;
            {
                ctx.beginPath();
                for (var i = 0; i < n; ++i) {
                    var point = points[i];
                    if (point.boundsOverlap) {
                        drawArc(ctx, point.x, point.y, 0.035);
                    }
                }
                ctx.fillStyle = randomColor(0.25);
                ctx.fill();
            }
            {
                ctx.beginPath();
                for (var i = 0; i < n; ++i) {
                    var point = points[i];
                    if (point.withinRadius) {
                        drawArc(ctx, point.x, point.y, 0.0175);
                    }
                }
                ctx.fillStyle = randomColor(0.5);
                ctx.fill();
            }
            {
                ctx.beginPath();
                for (var i = 0; i < n; ++i) {
                    var point = points[i];
                    drawArc(ctx, point.x, point.y, 0.0025);
                }
                ctx.fillStyle = "hsl(0, 0%, 20%)";
                ctx.fill();
            }
        }
        window.onload = function () {
            var canvas = document.getElementById("canvas");
            var ctx = canvas.getContext("2d");
            {
                ctx.scale(canvas.width, canvas.height);
                ctx.translate(0, 0);
                ctx.lineWidth = 0.0065;
                ctx.strokeStyle = "hsla(0, 0%, 100%, 0.875)";
            }
            var n = 2000;
            var radius = 0.3;
            var circle = {
                x: 0.5,
                y: 0.5,
                radius: radius,
                radiusSquared: radius * radius
            };
            var points = new Array(n);
            for (var i = 0; i < n; ++i) {
                points[i] = {
                    x: Math.random(),
                    y: Math.random(),
                    boundsOverlap: false,
                    withinRadius: false
                };
            }
            console.time("makeTree()");
            var tree = kdtree_1.makeTree(points, true, {
                xLower: 0,
                xUpper: 1,
                yLower: 0,
                yUpper: 1
            });
            console.timeEnd("makeTree()");
            drawPoints(ctx, points);
            canvas.addEventListener("click", function (event) {
                circle.x =
                    (event.x + window.pageXOffset - canvas.offsetLeft) / canvas.width;
                circle.y =
                    (event.y + window.pageYOffset - canvas.offsetTop) / canvas.height;
                for (var i = 0; i < n; ++i) {
                    var point = points[i];
                    point.boundsOverlap = false;
                    point.withinRadius = false;
                }
                {
                    console.time("radiusSearch()");
                    kdtree_1.radiusSearch(tree, circle, function (point) {
                        point.boundsOverlap = true;
                        if (kdtree_1.pointInCircle(point, circle)) {
                            point.withinRadius = true;
                        }
                    });
                    console.timeEnd("radiusSearch()");
                }
                ctx.clearRect(0, 0, 1, 1);
                drawPoints(ctx, points);
                {
                    ctx.beginPath();
                    drawArc(ctx, circle.x, circle.y, circle.radius);
                    drawCross(ctx, circle.x, circle.y, 0.035);
                    ctx.stroke();
                }
            }, false);
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