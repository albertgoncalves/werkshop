/* global quickSelect */

"use strict";

function makeTree(points, axis, rect) {
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
        rect: rect,
        left: null,
        right: null,
    };
    var left = points.slice(0, median);
    var right = points.slice(median + 1);
    var next;
    if (axis === 0) {
        next = 1;
        node.left = makeTree(left, next, {
            xLower: rect.xLower,
            xUpper: point.x,
            yLower: rect.yLower,
            yUpper: rect.yUpper,
        });
        node.right = makeTree(right, next, {
            xLower: point.x,
            xUpper: rect.xUpper,
            yLower: rect.yLower,
            yUpper: rect.yUpper,
        });
    } else if (axis === 1) {
        next = 0;
        node.left = makeTree(left, next, {
            xLower: rect.xLower,
            xUpper: rect.xUpper,
            yLower: rect.yLower,
            yUpper: point.y,
        });
        node.right = makeTree(right, next, {
            xLower: rect.xLower,
            xUpper: rect.xUpper,
            yLower: point.y,
            yUpper: rect.yUpper,
        });
    }
    return node;
}

function rectCircleOverlap(rect, circle) {
    var x = circle.x - Math.max(rect.xLower, Math.min(circle.x, rect.xUpper));
    var y = circle.y - Math.max(rect.yLower, Math.min(circle.y, rect.yUpper));
    return ((x * x) + (y * y)) < circle.radiusSquared;
}

function pointInCircle(point, circle) {
    var x = point.x - circle.x;
    var y = point.y - circle.y;
    return ((x * x) + (y * y)) < circle.radiusSquared;
}

function radiusSearch(tree, circle, callback) {
    if (tree === null) {
        return;
    }
    var stack = [tree];
    var node = stack.pop();
    while (node) {
        if (rectCircleOverlap(node.rect, circle)) {
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
