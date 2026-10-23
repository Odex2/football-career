// @ts-check
// The first club of a playing career (M8 phase A): a weighted draw where weak clubs are likely and big ones
// very rare, a small bonus at home, a loan from a big club of one's country (or of its bridge country).

// Weighted draw of the first club: weak clubs are likely, big ones very rare; a small bonus at home
/** @param {World} W @param {NationCode} nat @param {(c: Club) => boolean} [skip] @returns {number[]} */
G.game.startWeights = function (W, nat, skip) {
  var K = G.CFG2.START_CLUB, min = Infinity, home = !!G.NATIONS[nat];
  W.clubs.forEach(function (c) { if (c.str < min) min = c.str; });
  return W.clubs.map(function (c) {
    if (skip && skip(c)) return 0;
    return Math.exp(-(c.str - min) / K.T) * (home && c.nat === nat ? K.HOME : 1) * (K.FAR[c.nat] || 1);
  });
};
/** @param {World} W @param {NationCode} nat @param {Rng} rng @param {(c: Club) => boolean} [skip] @returns {StartDraw} */
G.game.startClub = function (W, nat, rng, skip) {
  var w = G.game.startWeights(W, nat, skip), tot = w.reduce(function (s, x) { return s + x; }, 0), i = G.match.pickWeighted(w, rng);
  return { club: W.clubs[i], odds: w[i] / tot };
};

// The club a career starts at, by o.start: 'random' (the default), 'loan' (sets p.loanFrom) or 'second'
// (one of the 6 weakest clubs of the lowest division, kept for G.debug and the test scenarios)
/** @param {World} W @param {Player} p @param {NationCode} nat @param {string} start @param {Rng} rng @returns {StartDraw} */
G.game.firstClub = function (W, p, nat, start, rng) {
  var home = G.NATIONS[nat] ? nat : G.SA_LINK[nat];
  if (start === 'second') {
    var low = G.NATIONS[home].leagues.length > 1 ? home + '2' : home + '1';
    var pool = W.clubs.filter(function (c) { return c.lg === low; }).sort(function (a, b) { return a.str - b.str; }).slice(0, 6);
    return { club: rng.pick(pool), odds: 1 };
  }
  if (start === 'loan') {
    var tops = W.clubs.filter(function (c) { return c.lg === home + '1'; }).sort(function (a, b) { return b.str - a.str; }).slice(0, 4), parent = rng.pick(tops);
    p.loanFrom = parent.id;
    return G.game.startClub(W, nat, rng, function (c) { return c.id === parent.id || c.str > parent.str - 5; });
  }
  return G.game.startClub(W, nat, rng);
};

// "una possibilità su 38.000": the odds with the Italian thousands separator
/** @param {number} odds @returns {string} */
G.game.oddsText = function (odds) { return 'una possibilità su ' + String(Math.round(1 / odds)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
