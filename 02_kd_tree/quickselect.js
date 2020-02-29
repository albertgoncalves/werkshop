"use strict";

/* NOTE: `https://github.com/mourner/quickselect/blob/master/index.js` */

function swap(array, i, j) {
    var tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
}

function quickSelect(array, k, left, right, compare) {
    /* NOTE: `https://en.wikipedia.org/wiki/Floyd%E2%80%93Rivest_algorithm` */
    while (left < right) {
        if (600 < (right - left)) {
            var n = right - left + 1;
            var m = k - left + 1;
            var z = Math.log(n);
            var s = 0.5 * Math.exp((2 * z) / 3);
            var sd = 0.5 * Math.sqrt((z * s * (n - s)) / n) *
                (m - (n / 2) < 0 ? -1 : 1);
            var newLeft = Math.max(left, Math.floor(k - ((m * s) / n) + sd));
            var newRight =
                Math.min(right, Math.floor(k + (((n - m) * s) / n) + sd));
            quickSelect(array, newLeft, newRight, k);
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
            i++;
            while (compare(array[i], t) < 0) {
                i++;
            }
            j--;
            while (0 < compare(array[j], t)) {
                j--;
            }
        }
        if (compare(array[left], t) === 0) {
            swap(array, left, j);
        } else {
            j++;
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
