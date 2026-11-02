// @ts-check
// International tournaments (World Cup, Euro, Copa América, Asian Cup, AFCON): groups of four,
// best thirds, knockout bracket. Played in block 5, after the club season, one matchday or round per day.

G.tour = {};
/** @type {Dict<string>} */
G.tour.ROUND = { 32: 'Sedicesimi', 16: 'Ottavi', 8: 'Quarti', 4: 'Semifinali', 2: 'Finale' };

/** @param {State} st @param {string} key @param {NationCode[]} teams @returns {Tournament} */
G.tour.create = function (st, key, teams) {
  var D = G.CFG.NT.TOURS[key], rng = G.rng, ng = teams.length / 4, /** @type {NationCode[][]} */ groups = [], /** @type {Dict<number[]>} */ tab = {};
  var sorted = teams.slice().sort(function (a, b) { return G.national.str(st, b) - G.national.str(st, a); });
  for (var g = 0; g < ng; g++) groups.push([]);
  for (var pot = 0; pot < 4; pot++) rng.shuffle(sorted.slice(pot * ng, pot * ng + ng)).forEach(function (t, i) { groups[i].push(t); });
  teams.forEach(function (t) { tab[t] = [0, 0, 0, 0, 0, 0, 0]; });
  return { key: key, n: D.n, year: G.sure(st.S).year + 1, teams: teams, groups: groups, tab: tab, md: 0, stage: 'g', ko: [], log: [],
    winner: null, runner: null, sc: {}, scN: {}, my: { apps: 0, g: 0, a: 0 }, out: {} };
};

/** @param {Tournament} T */
G.tour.koSize = function (T) { var n = T.groups.length * 2, k = 2; while (k < n) k *= 2; return k; };
/** @param {Tournament} T */
G.tour.days = function (T) { return 3 + Math.round(Math.log2(G.tour.koSize(T))); };

/** @param {Tournament} T @param {NationCode[]} grp */
G.tour.groupTable = function (T, grp) {
  var t = T.tab;
  return grp.slice().sort(function (a, b) {
    var x = t[a], y = t[b];
    return (y[6] - x[6]) || ((y[4] - y[5]) - (x[4] - x[5])) || (y[4] - x[4]) || (a < b ? -1 : 1);
  });
};

// Standard bracket order so the top seeds meet as late as possible
/** @param {number} n @returns {number[]} */
G.tour.seedOrder = function (n) {
  var o = [1];
  while (o.length < n) { var m = o.length * 2; o = /** @type {number[]} */ ([]).concat.apply([], o.map(function (s) { return [s, m + 1 - s]; })); }
  return o;
};

/** @param {State} st @param {Tournament} T */
G.tour.toKo = function (st, T) {
  var K = G.tour.koSize(T), /** @type {NationCode[]} */ firsts = [], /** @type {NationCode[]} */ seconds = [], /** @type {NationCode[]} */ thirds = [], t = T.tab;
  /** @param {NationCode} a @param {NationCode} b */
  var rank = function (a, b) { return (t[b][6] - t[a][6]) || ((t[b][4] - t[b][5]) - (t[a][4] - t[a][5])) || (t[b][4] - t[a][4]); };
  T.groups.forEach(function (grp) {
    var s = G.tour.groupTable(T, grp);
    firsts.push(s[0]); seconds.push(s[1]); thirds.push(s[2]);
    T.out[s[3]] = 'Fase a gironi';
  });
  firsts.sort(rank); seconds.sort(rank); thirds.sort(rank);
  var go = thirds.slice(0, K - firsts.length - seconds.length);
  thirds.slice(go.length).forEach(function (x) { T.out[x] = 'Fase a gironi'; });
  var seeds = firsts.concat(seconds, go), order = G.tour.seedOrder(K);
  T.ko = [];
  for (var i = 0; i < K; i += 2) T.ko.push([seeds[order[i] - 1], seeds[order[i + 1] - 1]]);
  T.stage = 'ko';
};

/** @param {State} st @param {Tournament} T */
G.tour.playDay = function (st, T) {
  if (T.stage === 'done') return;
  var rng = G.rng, comp = { name: T.n + ' ' + T.year, neutral: 1 };
  if (T.stage === 'g') {
    var pairs = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]][T.md];
    T.groups.forEach(function (grp) {
      pairs.forEach(function (pr) {
        var a = grp[pr[0]], b = grp[pr[1]];
        G.season.addResult(T.tab, a, b, G.national.match(st, a, b, comp, T));
      });
    });
    if (++T.md === 3) G.tour.toKo(st, T);
    return;
  }
  var round = G.tour.ROUND[T.ko.length * 2], /** @type {NationCode[]} */ next = [];
  T.ko.forEach(function (tie) {
    var a = tie[0], b = tie[1], r = G.national.match(st, a, b, comp, T), pens = r[0] === r[1];
    var w = r[0] > r[1] ? a : r[1] > r[0] ? b : rng.chance(0.5 + (G.national.str(st, a) - G.national.str(st, b)) / 100) ? a : b;
    T.log.push({ stage: round, a: a, b: b, ga: r[0], gb: r[1], w: w, pens: pens });
    T.out[w === a ? b : a] = round === 'Finale' ? 'Finale' : round;
    next.push(w);
  });
  if (next.length === 1) { T.winner = next[0]; T.runner = T.ko[0][0] === T.winner ? T.ko[0][1] : T.ko[0][0]; T.out[T.winner] = 'Campione'; T.stage = 'done'; return; }
  T.ko = [];
  for (var i = 0; i < next.length; i += 2) T.ko.push([next[i], next[i + 1]]);
};

// Tournament block (5), after the club season: call-up, then one matchday or round per day, plus a last day to celebrate
/** @param {State} st */
G.tour.beginBlock = function (st) {
  var S = G.sure(st.S), p = st.player, D = 1, tours = G.sure(S.tours);  // block 5 is played only when there are tournaments
  Object.keys(tours).forEach(function (k) {
    var T = tours[k];
    D = Math.max(D, G.tour.days(T) + 1);
    if (T.teams.indexOf(p.nat) >= 0) G.national.callUp(st, T.n + ' ' + T.year);
  });
  S.blockRows = [];
  S.cur = { b: 5, d: 0, D: D, lg: {}, cup: {}, eu: {}, ps0: JSON.parse(JSON.stringify(S.ps)), ovrBefore: p.ovr, injury: 0 };
};

/** @param {State} st @param {number} d */
G.tour.day = function (st, d) {
  var tours = G.sure(G.sure(st.S).tours);
  Object.keys(tours).forEach(function (k) { if (d < G.tour.days(tours[k])) G.tour.playDay(st, tours[k]); });
};

// The tournament to show first: the player's nation's, else the World Cup or the first one
/** @param {State} st */
G.tour.mine = function (st) {
  var S = st.S, tours = S && S.tours, keys = tours ? Object.keys(tours) : [];
  return keys.filter(function (k) { return G.sure(tours)[k].teams.indexOf(st.player.nat) >= 0; })[0] || keys[0];
};

// Next opponent of nation id (null when out or done)
/** @param {Tournament} T @param {NationCode} id @returns {NationCode|null} */
G.tour.nextOpp = function (T, id) {
  if (T.stage === 'g') {
    var grp = T.groups.filter(function (g) { return g.indexOf(id) >= 0; })[0];
    if (!grp) return null;
    var pr = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]][T.md], i = grp.indexOf(id);
    for (var j = 0; j < 2; j++) { var x = pr[j]; if (x[0] === i) return grp[x[1]]; if (x[1] === i) return grp[x[0]]; }
    return null;
  }
  if (T.stage !== 'ko') return null;
  var tie = T.ko.filter(function (t) { return t.indexOf(id) >= 0; })[0];
  return tie ? (tie[0] === id ? tie[1] : tie[0]) : null;
};

// End of season: roll of honour, trophies and awards for the player, Ballon d'Or bonus, ct review
/** @param {State} st @param {SeasonRecord} rec */
G.tour.seasonEnd = function (st, rec) {
  var S = G.sure(st.S), p = st.player, N = G.CFG.NT, rng = G.rng, /** @type {Dict<number>} */ bonus = S.ntBonus = {};
  /** @param {PlayerId|string} id @param {number} v */
  var add = function (id, v) { bonus[id] = (bonus[id] || 0) + v; };
  var tours = S.tours;
  if (!tours) return;
  Object.keys(tours).forEach(function (k) {
    var T = G.sure(tours)[k], D = N.TOURS[k], win = G.sure(T.winner), run = G.sure(T.runner), inIt = T.teams.indexOf(p.nat) >= 0, mine = inIt && T.my.apps > 0;
    var best = Object.keys(T.sc).sort(function (a, b) { return T.sc[b] - T.sc[a]; })[0];
    var bestName = best === undefined ? null : best === 'me' ? p.name : st.world.players[+best].n;
    st.ntRoll.unshift({ year: T.year, key: k, n: T.n, winner: win, runner: run,
      scorer: best !== undefined ? { n: G.sure(bestName), nt: T.scN[best], g: T.sc[best], me: best === 'me' } : null, mine: inIt ? T.out[p.nat] : null });
    G.national.xi(st, win).forEach(function (id) { add(id, D.bdo); });
    G.national.xi(st, run).forEach(function (id) { add(id, D.bdo * N.FINALIST); });
    Object.keys(T.sc).forEach(function (id) { add(id, T.sc[id] * N.BDO_GOAL); });
    G.news(st, '🌍 ' + T.n + ' ' + T.year + ': vince ' + G.national.name(win) + (bestName ? ', capocannoniere ' + bestName + ' (' + T.sc[best] + ')' : ''));
    if (!inIt && !D.q[G.NT[p.nat].conf]) return;
    if (mine) {
      if (T.winner === p.nat) { add('me', D.bdo); p.trophies.push({ name: T.n, year: S.year, club: G.nationInfo(p.nat).name }); rec.trophies.push(T.n); G.life.fame(st, k === 'WC' ? 15 : 8); }
      else if (T.runner === p.nat) add('me', D.bdo * N.FINALIST);
      if (best === 'me') { p.awards.push({ name: 'Capocannoniere ' + T.n, year: S.year, w: 3 }); rec.awards.push('Capocannoniere ' + T.n); }
      p.nt.tours.push({ key: k, n: T.n, year: T.year, res: T.out[p.nat], apps: T.my.apps, g: T.my.g });
      rec.nt = T.n + ': ' + T.out[p.nat].toLowerCase();
    }
    var bad = !inIt || T.out[p.nat] === 'Fase a gironi';
    if (rng.chance(bad ? N.SACK_BAD : T.winner === p.nat ? 0 : N.LEAVE)) G.national.appoint(st, rng);
  });
  if (st.ntRoll.length > 30) st.ntRoll.length = 30;
  st.ntq = null;
};

/** @param {State} st @param {Rng} rng */
G.tour.yearEnd = function (st, rng) {
  var co = G.national.coach(st);
  if (!co || co.ret) G.national.appoint(st, rng);
};
