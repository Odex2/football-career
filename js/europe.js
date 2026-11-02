// @ts-check
// UEFA competitions: qualification, 36-team league phase, playoffs and two-legged knockouts.

G.europe = {};
G.EU_KEYS = ['UCL', 'UEL', 'UECL'];

// tables: { 'ENG1': [ids by position] }, cups: { ENG: winnerId }
/** @param {Dict<ClubId[]>} tables @param {Dict<ClubId|null>} cups @returns {Dict<ClubId[]>} */
G.europe.qualify = function (tables, cups) {
  var A = G.CFG.UEFA_ACCESS, q = /** @type {Dict<ClubId[]>} */ ({ UCL: [], UEL: [], UECL: [] });
  Object.keys(A).forEach(function (nat) {
    var t = tables[nat + '1'];
    if (!t) return;
    var /** @type {Dict<number>} */ taken = {}, pos = 0;
    var next = function () { while (taken[t[pos]]) pos++; taken[t[pos]] = 1; return t[pos++]; };
    for (var i = 0; i < A[nat][0]; i++) q.UCL.push(next());
    var e = A[nat][1], cw = cups[nat];
    if (e > 0 && cw !== undefined && cw !== null && !taken[cw] && t.indexOf(cw) >= 0) { taken[cw] = 1; q.UEL.push(cw); e--; }
    for (i = 0; i < e; i++) q.UEL.push(next());
    for (i = 0; i < A[nat][2]; i++) q.UECL.push(next());
  });
  return q;
};

/** @param {World} W */
G.europe.initialQual = function (W) {
  /** @type {Dict<ClubId[]>} */
  var tables = {};
  G.LEAGUES.forEach(function (L) {
    tables[L.key] = W.clubs.filter(function (c) { return c.lg === L.key; }).sort(function (a, b) { return b.str - a.str; }).map(function (c) { return c.id; });
  });
  return G.europe.qualify(tables, {});
};

/** @param {State} st @param {Dict<ClubId[]>} q @returns {Dict<EuroComp>} */
G.europe.setup = function (st, q) {
  /** @type {Dict<EuroComp>} */
  var eu = {};
  G.EU_KEYS.forEach(function (k) {
    /** @type {Dict<TableRow>} */
    var tab = {};
    q[k].forEach(function (id) { tab[id] = [0, 0, 0, 0, 0, 0, 0]; });
    eu[k] = { key: k, name: G.CFG.UEFA[k].name, teams: q[k].slice(), tab: tab, fx: G.europe.draw(st.world, q[k], G.CFG.UEFA[k].md, G.rng),
      md: 0, stage: 'lp', ties: [], log: [], winner: null };
  });
  return eu;
};

// One perfect matching per matchday, avoiding same-nation pairs and repeats where possible
/** @param {World} W @param {ClubId[]} ids @param {number} mds @param {Rng} rng @returns {number[][][]} */
G.europe.draw = function (W, ids, mds, rng) {
  var /** @type {Dict<number>} */ met = {}, /** @type {Dict<number>} */ homes = {}, /** @type {number[][][]} */ fx = [];
  ids.forEach(function (id) { homes[id] = 0; });
  for (var m = 0; m < mds; m++) {
    /** @type {{ pairs: number[][], bad: number }|null} */
    var best = null;
    for (var tryN = 0; tryN < 60; tryN++) {
      var pool = rng.shuffle(ids.slice()), /** @type {number[][]} */ pairs = [], bad = 0;
      while (pool.length) {
        var x = /** @type {number} */ (pool.shift()), j = 0;
        while (j < pool.length && (met[x + '-' + pool[j]] || W.clubs[x].nat === W.clubs[pool[j]].nat)) j++;
        if (j === pool.length) { j = 0; bad++; }
        pairs.push([x, pool.splice(j, 1)[0]]);
      }
      if (!best || bad < best.bad) best = { pairs: pairs, bad: bad };
      if (!bad) break;
    }
    fx.push(G.sure(best).pairs.map(function (pr) {
      met[pr[0] + '-' + pr[1]] = met[pr[1] + '-' + pr[0]] = 1;
      var h = homes[pr[0]] <= homes[pr[1]] ? pr[0] : pr[1], a = h === pr[0] ? pr[1] : pr[0];
      homes[h]++;
      return [h, a];
    }));
  }
  return fx;
};

/** @param {EuroComp} comp */
G.europe.sortTable = function (comp) {
  var t = comp.tab;
  return comp.teams.slice().sort(function (a, b) {
    var x = t[a], y = t[b];
    return (y[6] - x[6]) || ((y[4] - y[5]) - (x[4] - x[5])) || (y[4] - x[4]) || (a - b);
  });
};

/** @param {State} st @param {string} k @param {ClubId} id @param {number} share */
G.europe.prize = function (st, k, id, share) {
  var S = G.sure(st.S);
  S.prize[id] = (S.prize[id] || 0) + G.CFG.PRIZE[G.CFG.UEFA[k].prize] * share;
};

// Two-legged (or single, for the final) tie; returns the winner
/** @param {State} st @param {EuroComp} comp @param {ClubId} a @param {ClubId} b @param {boolean} [single] */
G.europe.tie = function (st, comp, a, b, single) {
  var W = st.world, rng = G.rng, cn = { name: comp.name, lg: false, ck: comp.key, rd: G.europe.STAGES[comp.stage] };
  var r1 = G.match.play(st, a, b, cn, single), ag = r1[0], bg = r1[1];
  if (!single) { var r2 = G.match.play(st, b, a, cn); ag += r2[1]; bg += r2[0]; }
  if (ag === bg) G.season.markPen(st, a, b);
  var w = ag > bg ? a : bg > ag ? b : (rng.chance(0.5 + (W.clubs[a].str - W.clubs[b].str) / 100) ? a : b);
  comp.log.push({ stage: comp.stage, a: a, b: b, ag: ag, bg: bg, w: w });
  return w;
};

/** @type {Dict<string>} */
G.europe.STAGES = { po: 'Playoff', r16: 'Ottavi', qf: 'Quarti', sf: 'Semifinali', f: 'Finale' };

/** @param {State} st @param {EuroComp} comp */
G.europe.playKo = function (st, comp) {
  var rng = G.rng, k = comp.key, /** @type {ClubId[]} */ next = [];
  if (comp.stage === 'po') {
    var t = G.europe.sortTable(comp), seeds = t.slice(8, 16), uns = t.slice(16, 24);
    seeds.forEach(function (s, i) { next.push(G.europe.tie(st, comp, uns[7 - i], s)); });
    comp.ties = t.slice(0, 8).map(function (top, i) { return [next[7 - i], top]; });
    comp.stage = 'r16';
    t.slice(0, 24).forEach(function (id) { G.europe.prize(st, k, id, 0.06); });
    return;
  }
  comp.ties.forEach(function (tie) { next.push(G.europe.tie(st, comp, tie[0], tie[1], comp.stage === 'f')); });
  next.forEach(function (id) { G.europe.prize(st, k, id, 0.12); });
  if (comp.stage === 'f') { comp.winner = next[0]; comp.stage = 'done'; G.europe.prize(st, k, next[0], 0.2); return; }
  rng.shuffle(next);
  comp.ties = [];
  for (var i = 0; i < next.length; i += 2) comp.ties.push([next[i], next[i + 1]]);
  comp.stage = /** @type {Dict<string>} */ ({ r16: 'qf', qf: 'sf', sf: 'f' })[comp.stage];
};

// ---------- with a calendar (M8 phase J): each match at its date, the two legs of a tie on two dates ----------
/** @param {State} st */
G.europe.blockPrize = function (st) {
  G.EU_KEYS.forEach(function (k) { var comp = G.sure(st.S).eu[k]; if (comp.md === 0) comp.teams.forEach(function (id) { G.europe.prize(st, k, id, 0.4); }); });
};

// The league-phase matches of a date (Champions League: half on Tuesday, half on Wednesday), or one leg of each tie.
// The first leg's goals wait in comp.leg; the second leg adds them up and decides the tie.
/** @param {State} st @param {number} x */
G.europe.playDate = function (st, x) {
  G.EU_KEYS.forEach(function (k) {
    var S = G.sure(st.S), comp = S.eu[k], c = G.sure(S.cal).eu[k];
    if (comp.stage === 'lp') {
      var md = comp.md, ms = comp.fx[md], d = c.lp[md];
      if (!ms || x < d) return;
      ms.forEach(function (m, i) {
        if (G.cal.half(d, i, ms.length, 1) === x) G.season.addResult(comp.tab, m[0], m[1], G.match.play(st, m[0], m[1], { name: comp.name, lg: false, ck: k, rd: 'Fase campionato' }));
      });
      if (x >= G.cal.half(d, ms.length - 1, ms.length, 1)) { comp.md++; if (comp.md === comp.fx.length) G.europe.drawPo(st, comp); }
      return;
    }
    if (comp.stage === 'done') return;
    var ds = G.cal.koDates(comp, c), f = comp.stage === 'f', n = comp.ties.length, legs = comp.leg || (comp.leg = []);
    var cn = { name: comp.name, lg: false, ck: k, rd: G.europe.STAGES[comp.stage] };
    comp.ties.forEach(function (t, i) {
      if (t[2] !== undefined) return;
      if (f) { if (x === ds[0]) G.europe.settle(st, comp, i, G.match.play(st, t[0], t[1], cn, true)); }
      else if (!legs[i]) { if (G.cal.half(ds[0], i, n, 1) === x) legs[i] = G.match.play(st, t[0], t[1], cn).slice(0, 2); }
      else if (G.cal.half(ds[1], i, n, 1) === x) { var r2 = G.match.play(st, t[1], t[0], cn); G.europe.settle(st, comp, i, [legs[i][0] + r2[1], legs[i][1] + r2[0]]); }
    });
    if (comp.ties.every(function (t) { return t[2] !== undefined; })) G.europe.nextStage(st, comp);
  });
};

// A tie decided on aggregate goals [a, b]; a draw goes to the stronger side more often ("ai rigori" on the user's row)
/** @param {State} st @param {EuroComp} comp @param {number} i @param {number[]} g */
G.europe.settle = function (st, comp, i, g) {
  var t = comp.ties[i], W = st.world, a = t[0], b = t[1];
  if (g[0] === g[1]) G.season.markPen(st, a, b);
  var w = g[0] > g[1] ? a : g[1] > g[0] ? b : (G.rng.chance(0.5 + (W.clubs[a].str - W.clubs[b].str) / 100) ? a : b);
  comp.log.push({ stage: comp.stage, a: a, b: b, ag: g[0], bg: g[1], w: w });
  t[2] = w;
};

// The end of the league phase: 9th-16th meet 24th-17th in the playoff, at home in the second leg
/** @param {State} st @param {EuroComp} comp */
G.europe.drawPo = function (st, comp) {
  var t = G.europe.sortTable(comp), uns = t.slice(16, 24);
  comp.stage = 'po'; comp.leg = [];
  comp.ties = t.slice(8, 16).map(function (s, i) { return [uns[7 - i], s]; });
  t.slice(0, 24).forEach(function (id) { G.europe.prize(st, comp.key, id, 0.06); });
  G.cal.resolve(st, t.slice(8, 24));
};

// After the last tie of a round: the prizes, the next draw at once, and the league matches it clashes with move
/** @param {State} st @param {EuroComp} comp */
G.europe.nextStage = function (st, comp) {
  var k = comp.key, rng = G.rng, next = comp.ties.map(function (t) { return t[2]; });
  comp.leg = [];
  if (comp.stage === 'po') {
    var top = G.europe.sortTable(comp).slice(0, 8);
    comp.ties = top.map(function (id, i) { return [next[7 - i], id]; });
    comp.stage = 'r16';
  } else {
    next.forEach(function (id) { G.europe.prize(st, k, id, 0.12); });
    if (comp.stage === 'f') { comp.winner = next[0]; comp.stage = 'done'; G.europe.prize(st, k, next[0], 0.2); return; }
    rng.shuffle(next);
    comp.ties = [];
    for (var i = 0; i < next.length; i += 2) comp.ties.push([next[i], next[i + 1]]);
    comp.stage = /** @type {Dict<string>} */ ({ r16: 'qf', qf: 'sf', sf: 'f' })[comp.stage];
  }
  G.cal.resolve(st, comp.ties.reduce(function (/** @type {ClubId[]} */ a, t) { return a.concat(t.slice(0, 2)); }, []));
};

// ---------- the old engine (a season saved before the calendar) ----------
// Per block: league-phase matchdays up to a target (spread over the block's days), then knockout stages
/** @param {State} st @param {BlockInProgress} cur */
G.europe.beginBlock = function (st, cur) {
  var b = cur.b;
  G.EU_KEYS.forEach(function (k) {
    var comp = G.sure(st.S).eu[k], mds = comp.fx.length;
    cur.eu[k] = [comp.md, b === 0 ? 0 : b === 1 ? Math.ceil(mds * 0.6) : mds, 0];
    if (b === 1 && comp.md === 0) comp.teams.forEach(function (id) { G.europe.prize(st, k, id, 0.4); });
  });
};

/** @param {State} st @param {BlockInProgress} cur @param {number} d @param {number} D */
G.europe.playDay = function (st, cur, d, D) {
  var b = cur.b, f = (d + 1) / D;
  G.EU_KEYS.forEach(function (k) {
    var comp = G.sure(st.S).eu[k], r = cur.eu[k], target = Math.round(r[0] + (r[1] - r[0]) * f);
    for (; comp.md < target; comp.md++) {
      comp.fx[comp.md].forEach(function (m) {
        var res = G.match.play(st, m[0], m[1], { name: comp.name, lg: false, ck: k, rd: 'Fase campionato' });
        G.season.addResult(comp.tab, m[0], m[1], res);
      });
    }
    if (b === 2 && d === D - 1 && comp.stage === 'lp') { comp.stage = 'po'; G.europe.playKo(st, comp); }
    if (b === 3) {
      var ko = Math.min(3, Math.floor(3 * f + 0.5));
      for (; r[2] < ko && (comp.stage === 'r16' || comp.stage === 'qf' || comp.stage === 'sf'); r[2]++) G.europe.playKo(st, comp);
    }
    if (b === 4 && comp.stage === 'f') G.europe.playKo(st, comp);
  });
};

/** @param {State} st @param {ClubId} id */
G.europe.compsOf = function (st, id) {
  return G.EU_KEYS.filter(function (k) { return G.sure(st.S).eu[k].teams.indexOf(id) >= 0; });
};
