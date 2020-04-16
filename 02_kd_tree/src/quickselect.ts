/* NOTE: `https://github.com/mourner/quickselect/blob/master/index.js` */

function swap<T>(array: T[], i: number, j: number) {
    const tmp: T = array[i];
    array[i] = array[j];
    array[j] = tmp;
}

export function quickSelect<T>(array: T[],
                               k: number,
                               l: number,
                               r: number,
                               compare: (a: T, b: T) => number) {
    /* NOTE: `https://en.wikipedia.org/wiki/Floyd%E2%80%93Rivest_algorithm` */
    let left: number = l;
    let right: number = r;
    while (left < right) {
        if (600 < (right - left)) {
            const n: number = right - left + 1;
            const m: number = k - left + 1;
            const z: number = Math.log(n);
            const s: number = 0.5 * Math.exp((2 * z) / 3);
            const d: number = 0.5 * Math.sqrt((z * s * (n - s)) / n) *
                (m - (n / 2) < 0 ? -1 : 1);
            const newLeft: number =
                Math.max(left, Math.floor(k - ((m * s) / n) + d));
            const newRight: number =
                Math.min(right, Math.floor(k + (((n - m) * s) / n) + d));
            quickSelect(array, newLeft, newRight, k, compare);
        }
        const t: T = array[k];
        let i: number = left;
        let j: number = right;
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
        } else {
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
