import {quickSelect} from "./quickselect";

export interface Point {
    x: number;
    y: number;
    rectOverlap: boolean;
    withinRadius: boolean;
}

export interface Circle {
    x: number;
    y: number;
    radius: number;
    radiusSquared: number;
}

export interface Rect {
    xLower: number;
    xUpper: number;
    yLower: number;
    yUpper: number;
}

export interface Tree {
    point: Point;
    horizontal: boolean;
    rect: Rect;
    left: Tree|null;
    right: Tree|null;
}

export function makeTree(points: Point[], horizontal: boolean,
                         rect: Rect): Tree|null {
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
    } else {
        quickSelect(points, median, 0, n - 1,
                    function(a: Point, b: Point): number {
                        return a.y - b.y;
                    });
    }
    const point: Point = points[median];
    const node: Tree = {point, horizontal, rect, left: null, right: null};
    const left: Point[] = points.slice(0, median);
    const right: Point[] = points.slice(median + 1);
    if (horizontal) {
        node.left = makeTree(left, false, {
            xLower: rect.xLower,
            xUpper: point.x,
            yLower: rect.yLower,
            yUpper: rect.yUpper,
        });
        node.right = makeTree(right, false, {
            xLower: point.x,
            xUpper: rect.xUpper,
            yLower: rect.yLower,
            yUpper: rect.yUpper,
        });
    } else {
        node.left = makeTree(left, true, {
            xLower: rect.xLower,
            xUpper: rect.xUpper,
            yLower: rect.yLower,
            yUpper: point.y,
        });
        node.right = makeTree(right, true, {
            xLower: rect.xLower,
            xUpper: rect.xUpper,
            yLower: point.y,
            yUpper: rect.yUpper,
        });
    }
    return node;
}

function rectCircleOverlap(rect: Rect, circle: Circle): boolean {
    const x: number =
        circle.x - Math.max(rect.xLower, Math.min(circle.x, rect.xUpper));
    const y: number =
        circle.y - Math.max(rect.yLower, Math.min(circle.y, rect.yUpper));
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
