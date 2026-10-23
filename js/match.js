// @ts-check
// Match engine: lineups with rotation, the main player, goals/assists/clean sheets and ratings for everyone.

G.match = {};

// Called at the start of every block: cache XI and bench per role for each club
/** @type {{ [i: number]: number }} */
G.match.ex = [];
/** @param {World} W */
G.match.prepare = function (W) {
  G.match.ex = new Float64Array(W.players.length + 2000);
  W.clubs.forEach(function (club) {
    /** @type {Dict<number>} */
    var inXi = {};
    club.xi.forEach(function (id) { inXi[id] = 1; });
    /** @type {Dict<PlayerId[]>} */
    var bench = {};
    club.sq.forEach(function (id) {
      if (inXi[id]) return;
      var r = W.players[id].r;
      (bench[r] || (bench[r] = [])).push(id);
    });
    /** @type {PlayerId[]} */
    var top = [];
    Object.keys(bench).forEach(function (r) { bench[r].sort(function (a, b) { return W.players[b].o - W.players[a].o; }); top = top.concat(bench[r].slice(0, 2)); });
    club.bench = bench;
    club.benchTop = top;
  });
};

/** @param {number} hs @param {number} as @param {Rng} rng @returns {number[]} */
G.match.sim = function (hs, as, rng) {
  var C = G.CFG, d = (hs - as + C.HOME_ADV) / C.GOAL_SCALE;
  return [rng.poisson(C.GOAL_BASE * Math.exp(d)), rng.poisson(C.GOAL_BASE * Math.exp(-d))];
};

// Build the side that takes the pitch. mp = main player participation {mins, start} or null
/** @param {World} W @param {Club} club @param {MatchPart|null} mp @param {Player} p @param {Rng} rng @returns {MatchSide} */
G.match.side = function (W, club, mp, p, rng) {
  var C = G.CFG, ids = club.xi.slice(), /** @type {PlayerId[]} */ subs = [];
  for (var i = 0; i < ids.length; i++) {
    if (rng.next() < C.ROTATION) {
      var b = club.bench[W.players[ids[i]].r];
      if (b && b.length) { var alt = b[rng.int(0, Math.min(1, b.length - 1))]; subs.push(ids[i]); ids[i] = alt; }
    }
  }
  var main = false;
  if (mp && mp.start) {
    var worst = -1;
    ids.forEach(function (id, k) { if (W.players[id].r === p.role && (worst < 0 || W.players[id].o < W.players[ids[worst]].o)) worst = k; });
    if (worst < 0) worst = 10;
    ids.splice(worst, 1); main = true;
  }
  var sum = 0;
  ids.forEach(function (id) { sum += W.players[id].o; });
  if (main) sum += p.ovr;
  var n = ids.length + (main ? 1 : 0);
  var str = sum / n + G.coaches.bonus(W, club);
  if (mp && !mp.start && mp.mins > 0) str += (p.ovr - str) * mp.mins / 90 / 11;
  // subs that come on: bench players (ignored for strength)
  var top = club.benchTop || [], /** @type {PlayerId[]} */ cameOn = [];
  for (var t = 0; t < C.SUBS * 3 && cameOn.length < C.SUBS && top.length; t++) {
    var cand = top[rng.int(0, top.length - 1)];
    if (cameOn.indexOf(cand) < 0 && subs.indexOf(cand) < 0 && ids.indexOf(cand) < 0) cameOn.push(cand);
  }
  return { ids: ids, main: main, str: str, avg: sum / n, cameOn: cameOn };
};

/** @param {number[]} w @param {Rng} rng */
G.match.pickWeighted = function (w, rng) {
  var tot = 0, i;
  for (i = 0; i < w.length; i++) tot += w[i];
  if (tot <= 0) return -1;
  var u = rng.next() * tot;
  for (i = 0; i < w.length; i++) { u -= w[i]; if (u <= 0) return i; }
  return w.length - 1;
};

// Distribute goals/assists and ratings for one side. Returns main player's {g, a, r} when involved.
// Shooting and creativity a typical player of the role has above or below his overall (from GEN_BIAS),
// so the player scores like an NPC of the same overall and beats it only with better finishing or passing
/** @type {Dict<number[]>} */ G.match._ref = null; // per role: [shooting, creativity] bias, filled by G.match.ref
/** @param {RoleKey} role @returns {number[]} */
G.match.ref = function (role) {
  var R = G.match._ref || (G.match._ref = {});
  if (!R[role]) {
    /** @param {AttrKey} k */
    var b = function (k) { var w = G.WEIGHTS[role][k] || 0, B = G.CFG.GEN_BIAS; for (var i = 0; i < B.length; i++) if (w >= B[i][0]) return B[i][1]; return 0; };
    R[role] = [b('fin') * 0.6 + b('tir') * 0.2 + b('tes') * 0.2, b('pas') * 0.5 + b('vis') * 0.5];
  }
  return R[role];
};

// Main player's effective shooting and creativity: overall, moved by SPEC x how much his attributes beat the role norm
/** @param {Player} p @returns {number[]} */
G.match.mainEff = function (p) {
  var A = p.attrs, ref = G.match.ref(p.role), K = G.CFG.SPEC;
  return [p.ovr + K * (A.fin * 0.6 + A.tir * 0.2 + A.tes * 0.2 - ref[0] - p.ovr), p.ovr + K * (A.pas * 0.5 + A.vis * 0.5 - ref[1] - p.ovr)];
};

/** @param {World} W @param {MatchSide} side @param {number} gf @param {number} ga @param {boolean} isLg @param {Player} p @param {MatchPart|null} mp @param {Rng} rng @returns {{ g: number, a: number }|null} */
G.match.stats = function (W, side, gf, ga, isLg, p, mp, rng) {
  var C = G.CFG, n = side.ids.length, /** @type {number[]} */ gw = [], /** @type {number[]} */ aw = [], /** @type {number[]} */ g = [], /** @type {number[]} */ a = [], k, ex = G.match.ex;
  var mainIdx = side.main || (mp && mp.mins > 0) ? n : -1;
  var A = p ? p.attrs : null;
  // Scorer weights: e^(ovr / QUAL_DIV) per player (cached in prepare); only the ratio between players matters
  for (k = 0; k < n; k++) {
    var id = side.ids[k], pl = W.players[id], q = gf > 0 ? ex[id] || (ex[id] = Math.exp(pl.o / C.QUAL_DIV)) : 0;
    gw.push(C.GOAL_W[pl.r] * q); aw.push(C.ASSIST_W[pl.r] * q); g.push(0); a.push(0);
  }
  if (mainIdx >= 0) {
    var f = mp.mins / 90;
    var eff = G.match.mainEff(p), shot = eff[0], crea = eff[1];
    gw.push(C.GOAL_W[p.role] * Math.exp(shot / C.QUAL_DIV) * f);
    aw.push(C.ASSIST_W[p.role] * Math.exp(crea / C.QUAL_DIV) * f);
    g.push(0); a.push(0);
  }
  for (var i = 0; i < gf; i++) {
    var s = G.match.pickWeighted(gw, rng);
    if (s < 0) continue;
    g[s]++;
    if (rng.next() < C.ASSIST_RATE) {
      var save = aw[s]; aw[s] = 0;
      var t = G.match.pickWeighted(aw, rng);
      aw[s] = save;
      if (t >= 0) a[t]++;
    }
  }
  var res = gf > ga ? 0.35 : gf < ga ? -0.35 : 0, /** @type {number[]} */ rt = side.mgr ? [] : null, /** @type {number[]} */ rx = side.mgr ? [] : null;
  for (k = 0; k < n; k++) {
    var P = W.players[side.ids[k]], r = 6.3 + (P.o - side.avg) / C.RATING_DIV + res + g[k] * 0.9 + a[k] * 0.5 + rng.normal() * 0.55;
    if (P.r === 'POR') r += ga === 0 ? 0.7 : -0.3 * ga;
    else if ((P.r === 'DC' || P.r === 'TS') && ga === 0) r += 0.35;
    r = G.clamp(r, 3.5, 10);
    // the managed club keeps every rating and its gap from what the overall promised (the form, js/mgr-squad.js)
    if (rt) { rt.push(r); rx.push(r - (6.3 + (P.o - side.avg) / C.RATING_DIV)); }
    var cs = P.r === 'POR' && ga === 0 ? 1 : 0, s5 = P.s;
    if (isLg) { s5[0]++; s5[1] += g[k]; s5[2] += a[k]; s5[3] += cs; s5[4] += r; }
    s5[5]++; s5[6] += g[k]; s5[7] += a[k]; s5[8] += cs; s5[9] += r;
  }
  side.cameOn.forEach(function (id) {
    var P = W.players[id], r = G.clamp(6.2 + rng.normal() * 0.3 + res * 0.5, 4, 8.5);
    if (isLg) { P.s[0]++; P.s[4] += r; }
    P.s[5]++; P.s[9] += r;
  });
  side.gl = g;
  if (rt) { side.rt = rt; side.rx = rx; }
  return mainIdx >= 0 ? { g: g[mainIdx], a: a[mainIdx] } : null;
};

// Full match. comp = { name, lg: bool }. Returns [home goals, away goals]
/** @param {State} st @param {ClubId} h @param {ClubId} a @param {MatchComp} comp @param {boolean|number} [neutral] @returns {number[]} */
G.match.play = function (st, h, a, comp, neutral) {
  var W = st.world, rng = G.rng, p = st.player, pid = st.mgr ? -1 : p.clubId;
  var mine = h === pid ? 'h' : a === pid ? 'a' : null;
  var mp = mine ? G.match.mainPart(st) : null;
  // the manager's club takes the pitch with his XI, formation and tactic
  var mg = st.mgr && G.mgr.active(st) ? st.mgr.club : -1, mods = mg >= 0 ? G.mgrTeam.mods(st.mgr) : null;
  var live = mg >= 0 ? G.mgrLive.today(st, mg, h, a) : null;  // played live: the first half is already played
  var sh = h === mg ? G.mgrTeam.side(st, W.clubs[h]) : G.match.side(W, W.clubs[h], mine === 'h' ? mp : null, p, rng);
  var sa = a === mg ? G.mgrTeam.side(st, W.clubs[a]) : G.match.side(W, W.clubs[a], mine === 'a' ? mp : null, p, rng);
  var hs = sh.str - (neutral ? G.CFG.HOME_ADV : 0);
  var res = live ? G.mgrLive.result(st, live, h === mg, h === mg ? sh : sa) : h === mg || a === mg ? G.mgrTeam.sim(hs, sa.str, h === mg ? mods : null, a === mg ? mods : null, rng) : G.match.sim(hs, sa.str, rng);
  var mh = G.match.stats(W, sh, res[0], res[1], comp.lg, p, mine === 'h' ? mp : null, rng);
  var ma = G.match.stats(W, sa, res[1], res[0], comp.lg, p, mine === 'a' ? mp : null, rng);
  // the decisive moment comes after the scorers are drawn, so its goal goes to the player (or to the opponents)
  var mom = mine && !st.mgr ? G.moments.resolve(st, mine, h, a, res, comp, mp) : null, my = mine === 'h' ? mh : ma;
  if (mom && my) { my.g += mom.g; my.a += mom.a; }
  if (mine) G.match.mainRecord(st, mine === 'h', h, a, res, mp, mine === 'h' ? mh : ma, comp, mine === 'h' ? sh : sa);
  if (mom) G.moments.report(st, mom, res[mine === 'h' ? 0 : 1], res[mine === 'h' ? 1 : 0]);
  if (h === mg || a === mg) G.mgr.matchRow(st, h === mg, h === mg ? a : h, res, comp, h === mg ? sh : sa);
  if (live) G.mgrLive.done(st, live, res, h === mg);
  if (mg >= 0) G.match.form(W, h, a, res);
  return res;
};

// The last 5 results of both clubs (V, N, P), kept while a manager works (M8 C1, the pre-match card)
/** @param {World} W @param {ClubId} h @param {ClubId} a @param {number[]} res */
G.match.form = function (W, h, a, res) {
  var r = res[0] > res[1] ? 'VP' : res[0] < res[1] ? 'PV' : 'NN';
  [h, a].forEach(function (id, k) { var c = W.clubs[id]; c.fm = ((c.fm || '') + r.charAt(k)).slice(-5); });
};

// Decide the main player's minutes for this match
/** @param {State} st @returns {MatchPart} */
G.match.mainPart = function (st) {
  var C = G.CFG, rng = G.rng, p = st.player, ps = st.S.ps;
  ps.matches++;
  if (p.inj > 0) { p.inj = Math.max(0, p.inj - (C.INTENSITY[p.plan.intensity].heal || 1)); ps.inj++; return { mins: 0, start: false, injured: true }; }
  if (rng.chance(st.S.pStart)) { ps.starts++; return { mins: rng.chance(0.7) ? 90 : rng.int(60, 89), start: true }; }
  if (rng.chance(C.SUB_CHANCE * (0.4 + st.S.pStart))) return { mins: rng.int(10, 30), start: false };
  return { mins: 0, start: false };
};

/** @param {State} st @param {boolean} home @param {ClubId} h @param {ClubId} a @param {number[]} res @param {MatchPart} mp @param {{ g: number, a: number }|null} ga @param {MatchComp} comp @param {MatchSide} side */
G.match.mainRecord = function (st, home, h, a, res, mp, ga, comp, side) {
  var C = G.CFG, p = st.player, ps = st.S.ps, rng = G.rng, W = st.world;
  var gf = home ? res[0] : res[1], gc = home ? res[1] : res[0], opp = home ? a : h;
  var derby = W.clubs[p.clubId].riv.indexOf(opp) >= 0;
  /** @type {MatchRow} */
  var row = { opp: opp, home: home, gf: gf, ga: gc, mins: mp.mins, g: 0, a: 0, r: 0, comp: comp.name, derby: derby, ck: comp.ck, rd: comp.rd };
  if (mp.mins > 0 && ga) {
    row.g = ga.g; row.a = ga.a;
    var gk = p.role === 'POR';
    var r = C.RATING_BASE + row.g * 0.9 + row.a * 0.5 + (gf > gc ? 0.3 : gf < gc ? -0.3 : 0) +
      (p.ovr - side.avg) / C.RATING_DIV + rng.normal() * (0.45 - G.life.staff(p, 'mental') * 0.02) + (p.morale - 50) / 100 + (mp.mom ? mp.mom.bonus : 0);
    if (gk || p.role === 'DC' || p.role === 'TS') r += gc === 0 ? (gk ? 0.8 : 0.5) : -0.2 * gc * (gk ? 1.2 : 1);
    if (mp.mins < 45) r = 6 + (r - 6) * 0.5;
    row.r = Math.round(G.clamp(r, 4, 10) * 10) / 10;
    ps.apps++; ps.mins += mp.mins; ps.goals += row.g; ps.assists += row.a; ps.rSum += row.r; ps.rN++;
    if (gk && gc === 0 && mp.start) ps.cs++;
    if (comp.lg) { ps.lg[0]++; ps.lg[1] += row.g; ps.lg[2] += row.a; ps.lg[3] += gk && gc === 0 && mp.start ? 1 : 0; ps.lg[4] += row.r; }
    p.form = p.form * 0.7 + (row.r - 6.5) * 0.3;
  }
  if (derby && mp.mins > 0) G.life.derby(st, opp, gf, gc);
  if (st.S.today !== undefined) row.dt = st.S.today;
  st.S.blockRows.push(row);
};
