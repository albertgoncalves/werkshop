/* global quickSelect */

"use strict";

function makeTree(points, axis, xLower, xUpper, yLower, yUpper) {
    var n = points.length;
    if (n === 0) {
        return null;
    }
    var median = Math.floor(n / 2);
    if (axis === 0) {
        quickSelect(points, median, 0, n - 1, function(a, b) {
            return a.x - b.x;
        });
    } else if (axis === 1) {
        quickSelect(points, median, 0, n - 1, function(a, b) {
            return a.y - b.y;
        });
    }
    var point = points[median];
    var node = {
        point: point,
        axis: axis,
        xLower: xLower,
        xUpper: xUpper,
        yLower: yLower,
        yUpper: yUpper,
    };
    var left = points.slice(0, median);
    var right = points.slice(median + 1);
    var next;
    if (axis === 0) {
        next = 1;
        node.left = makeTree(left, next, xLower, point.x, yLower, yUpper);
        node.right = makeTree(right, next, point.x, xUpper, yLower, yUpper);
    } else if (axis === 1) {
        next = 0;
        node.left = makeTree(left, next, xLower, xUpper, yLower, point.y);
        node.right = makeTree(right, next, xLower, xUpper, point.y, yUpper);
    }
    return node;
}

function rectCircleOverlap(rectangle, circle) {
    var x = circle.x -
        Math.max(rectangle.xLower, Math.min(circle.x, rectangle.xUpper));
    var y = circle.y -
        Math.max(rectangle.yLower, Math.min(circle.y, rectangle.yUpper));
    return ((x * x) + (y * y)) < (circle.radius * circle.radius);
}

function pointInCircle(point, circle) {
    var x = point.x - circle.x;
    var y = point.y - circle.y;
    return ((x * x) + (y * y)) < (circle.radius * circle.radius);
}

function rangeQuery(tree, circle, callback) {
    if (tree === null) {
        return;
    }
    var stack = [tree];
    while (stack.length !== 0) {
        var node = stack.pop();
        if (rectCircleOverlap(node, circle)) {
            callback(node.point);
            if (node.left !== null) {
                stack.push(node.left);
            }
            if (node.right !== null) {
                stack.push(node.right);
            }
        }
    }
}
