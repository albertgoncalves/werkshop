import {quickSelect} from "./quickselect";

export interface Point {
    x: number;
    y: number;
    boundsOverlap: boolean;
    withinRadius: boolean;
}

export interface Circle {
    x: number;
    y: number;
    radius: number;
    radiusSquared: number;
}

export interface Bounds {
    xLower: number;
    xUpper: number;
    yLower: number;
    yUpper: number;
}

export interface Tree {
    point: Point;
    horizontal: boolean;
    bounds: Bounds;
    left: Tree|null;
    right: Tree|null;
}

export function makeTree(points: Point[], horizontal: boolean,
                         bounds: Bounds): Tree|null {
    const n: number = points.length;
    if (n === 0) {
        return null;
    }
    const median: number = Math.floor(n / 2);
    if (horizontal) {
        quickSelect(points, median, 0, n - 1,
                    function(a: Point, b: Point): number {
                        return a.x - b.x;
                    });
        const point = points[median];
        return {
            point,
            horizontal,
            bounds,
            left: makeTree(points.slice(0, median), false, {
                xLower: bounds.xLower,
                xUpper: point.x,
                yLower: bounds.yLower,
                yUpper: bounds.yUpper,
            }),
            right: makeTree(points.slice(median + 1), false, {
                xLower: point.x,
                xUpper: bounds.xUpper,
                yLower: bounds.yLower,
                yUpper: bounds.yUpper,
            }),
        };
    } else {
        quickSelect(points, median, 0, n - 1,
                    function(a: Point, b: Point): number {
                        return a.y - b.y;
                    });
        const point = points[median];
        return {
            point,
            horizontal,
            bounds,
            left: makeTree(points.slice(0, median), true, {
                xLower: bounds.xLower,
                xUpper: bounds.xUpper,
                yLower: bounds.yLower,
                yUpper: point.y,
            }),
            right: makeTree(points.slice(median + 1), true, {
                xLower: bounds.xLower,
                xUpper: bounds.xUpper,
                yLower: point.y,
                yUpper: bounds.yUpper,
            }),
        };
    }
}

function boundsCircleOverlap(bounds: Bounds, circle: Circle): boolean {
    const x: number =
        circle.x - Math.max(bounds.xLower, Math.min(circle.x, bounds.xUpper));
    const y: number =
        circle.y - Math.max(bounds.yLower, Math.min(circle.y, bounds.yUpper));
    return ((x * x) + (y * y)) < circle.radiusSquared;
}

export function pointInCircle(point: Point, circle: Circle): boolean {
    const x: number = point.x - circle.x;
    const y: number = point.y - circle.y;
    return ((x * x) + (y * y)) < circle.radiusSquared;
}

export function radiusSearch(tree: Tree|null, circle: Circle,
                             callback: (p: Point) => void) {
    if (tree === null) {
        return;
    }
    const stack: Tree[] = [tree];
    let node: Tree|undefined = stack.pop();
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
