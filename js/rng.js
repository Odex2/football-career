// @ts-check
// Seeded RNG (mulberry32). State is a single integer, saved with the career.

/** @param {number} seed @returns {Rng} */
G.makeRng = function (seed) {
  var r = /** @type {Rng} */ ({ s: seed >>> 0 });
  r.next = function () {
    var t = (r.s = (r.s + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = function (a, b) { return a + (b - a) * r.next(); };
  r.int = function (a, b) { return a + Math.floor(r.next() * (b - a + 1)); };
  r.chance = function (p) { return r.next() < p; };
  r.pick = function (arr) { return arr[Math.floor(r.next() * arr.length)]; };
  var spare = /** @type {number|null} */ (null);
  r.normal = function () {
    if (spare !== null) { var s = spare; spare = null; return s; }
    var u = 1 - r.next(), v = r.next(), m = Math.sqrt(-2 * Math.log(u));
    spare = m * Math.sin(2 * Math.PI * v);
    return m * Math.cos(2 * Math.PI * v);
  };
  r.poisson = function (l) {
    var L = Math.exp(-l), k = 0, p = 1;
    do { k++; p *= r.next(); } while (p > L);
    return k - 1;
  };
  r.shuffle = function (arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(r.next() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  };
  // n random items without shuffling the whole array (the array is not modified)
  r.sample = function (arr, n) {
    if (arr.length <= n) return arr.slice();
    var idx = /** @type {Dict<number>} */ ({}), out = [];
    for (var i = arr.length - n; i < arr.length; i++) {
      var j = Math.floor(r.next() * (i + 1));
      if (idx[j]) j = i;
      idx[j] = 1; out.push(arr[j]);
    }
    return out;
  };
  return r;
};

G.rng = G.makeRng(Date.now());

/** @param {number} v @param {number} a @param {number} b */
G.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
/** @param {number} x */
G.sigmoid = function (x) { return 1 / (1 + Math.exp(-x)); };
