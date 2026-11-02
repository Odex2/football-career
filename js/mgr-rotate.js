// @ts-check
// The assistant's 🔄 Turnover (M9 S1): with the automatic XI and m.assist.rotate on, before each match the vice rests
// tired or overworked starters and gives minutes to reserves and young talents in the matches that matter less,
// within limits (G.CFG2.ROTATE); the big matches get the best XI, the starters back at full fitness play, and before a
// bigger match close ahead who would not reach it fit rests. Off by default, and then nothing changes.
// While it is on, m.rot counts per player the starts in a row (run) and the matches since the last start (idle),
// and the easy matches played (easy).

G.mgrRot = {};

/** @param {State} st @returns {boolean} the turnover applies: switch on and the automatic XI */
G.mgrRot.on = function (st) { var m = G.mgr.job(st); return !!(m.assist && m.assist.rotate) && m.mode === 'auto'; };

/** @param {Npc} pl @returns {string} the surname */
G.mgrRot.sur = function (pl) { return G.squads.sur(pl.n); };

// How much a match matters: big (finals, Europe from the last 16, a rival, a direct rival or a stronger side),
// easy (a side EASY_GAP or more weaker, the national cup before the quarter-finals), normal the others
/** @param {State} st @param {ClubId} opp @param {MatchComp} comp @returns {string} 'big', 'easy' or 'normal' */
G.mgrRot.weight = function (st, opp, comp) {
  var R = G.CFG2.ROTATE, m = G.mgr.job(st), W = st.world, club = W.clubs[m.club], o = W.clubs[opp], ck = comp.ck || (comp.lg ? 'lg' : ''), S = st.S;
  if (comp.final || comp.rd === 'Finale') return 'big';
  if (G.CFG.UEFA[ck] && R.BIG_EU.indexOf(comp.rd || '') >= 0) return 'big';
  if (club.riv.indexOf(opp) >= 0 || o.str >= club.str) return 'big';
  if (comp.lg && S && S.lg[club.lg]) {
    var ids = G.season.sortTable(S, club.lg), a = ids.indexOf(club.id), b = ids.indexOf(opp);
    if (a >= 0 && b >= 0 && Math.abs(a - b) <= R.NEAR) return 'big';
  }
  if (o.str <= club.str - R.EASY_GAP) return 'easy';
  if (ck === club.nat && R.LATE_CUP.indexOf(comp.rd || '') < 0) return 'easy';
  return 'normal';
};

/** @type {Dict<number>} */
G.mgrRot.RANK = { easy: 0, normal: 1, big: 2 };

// A calendar entry as the engine plays it (the competition of a match)
/** @param {CalEntry} e @returns {MatchComp} */
G.mgrRot.comp = function (e) { return { name: e.name || '', lg: e.ck === 'lg', ck: e.ck, rd: e.rd, final: e.rd === 'Finale' ? 1 : 0 }; };

// The club's next AHEAD matches after this one (with opp): how much each matters, the matches in between (n), and a
// name with its day for the line ("la finale di Coppa con il Milan di mercoledì")
/** @param {State} st @param {ClubId} opp @returns {{ w: string, n: number, why: string }[]} */
G.mgrRot.ahead = function (st, opp) {
  var R = G.CFG2.ROTATE, m = G.mgr.job(st), S = st.S, club = st.world.clubs[m.club];
  if (!S || !S.cal) return [];
  // during the match day this match is no longer upcoming; before it (the line on the screen) it is the first one
  var list = G.cal.upcoming(st, club.id).filter(function (e) { return typeof e.opp === 'number'; }), i = list.length && list[0].opp === opp ? 1 : 0;
  return list.slice(i, i + R.AHEAD).map(function (e, k) {
    var imp = G.season.importance(st, club.id, e), o = st.world.clubs[/** @type {ClubId} */ (e.opp)];
    return { w: G.mgrRot.weight(st, /** @type {ClubId} */ (e.opp), G.mgrRot.comp(e)), n: k, why: (imp ? imp.why : 'la partita con il ' + o.name) + ' di ' + G.cal.DOWL[G.cal.dow(e.d)].toLowerCase() };
  });
};

// The XI for a match: the best one (G.mgrTeam.xi) with the turnover's changes, and why each one. A starter back at
// full fitness (FULL or more) plays: the rules on starts in a row, idle reserves and boys touch only the others. When
// one of the next AHEAD matches matters more than this one, the starters who would reach it tired (under COND_OK) rest
/** @param {State} st @param {ClubId} opp @param {MatchComp} comp @returns {{ xi: XiSlot[], w: string, notes: string[] }} */
G.mgrRot.plan = function (st, opp, comp) {
  var R = G.CFG2.ROTATE, K = G.CFG.MGR_TEAM, m = G.mgr.job(st), T = G.mgrTeam, W = st.world, club = W.clubs[m.club], best = T.xi(st), w = G.mgrRot.weight(st, opp, comp);
  var xi = best.map(function (x) { return { r: x.r, id: x.id }; }), /** @type {string[]} */ notes = [];
  if (w === 'big') return { xi: xi, w: w, notes: notes };
  var easy = w === 'easy', L = easy ? R.EASY : R.NORMAL, rot = m.rot || { run: {}, idle: {}, easy: 0 }, base = T.strWith(st, best, m.form), cup = comp.ck === club.nat;
  var /** @type {Dict<number>} */ changed = {}, n = 0, sur = G.mgrRot.sur;
  var inXi = /** @param {PlayerId} id */ function (id) { return xi.some(function (x) { return x.id === id; }); };
  var full = /** @param {PlayerId} id */ function (id) { return T.cond(m, id) >= R.FULL; };
  var bench = club.sq.filter(function (id) { return !inXi(id) && !G.mgrSq.inj(m, id); }).map(function (id) { return W.players[id]; });
  // pl starts in slot k if the limits hold: changes, the goalkeeper (cup only), the Forza XI lost
  var tryIn = /** @param {number} k @param {Npc} pl @param {(out: Npc) => string} why */ function (k, pl, why) {
    if (n >= L.MAX || changed[k] || inXi(pl.i) || (xi[k].r === 'POR' && !cup)) return;
    var to = xi.map(function (x) { return { r: x.r, id: x.id }; }), out = W.players[xi[k].id];
    to[k].id = pl.i;
    if (T.strWith(st, to, m.form) < base - L.DROP) return;
    xi = to; changed[k] = 1; n++; notes.push(why(out));
  };
  // who stands in for slot k: the best healthy bench player of the role within SUB_GAP of the starter's overall
  var stand = /** @param {number} k @returns {Npc|undefined} */ function (k) {
    var pl = W.players[xi[k].id], r = xi[k].r;
    return bench.filter(function (b) { return b.r === r && b.o >= pl.o - R.SUB_GAP && !inXi(b.i); }).sort(function (a, b) { return T.eff(m, b, r) - T.eff(m, a, r); })[0];
  };
  // the weakest starter of role r not changed yet and not at full fitness, for a reserve or a boy who must play
  var weakest = /** @param {RoleKey} r */ function (r) {
    var k = -1;
    xi.forEach(function (x, i) { if (x.r === r && !changed[i] && !full(x.id) && (k < 0 || T.eff(m, W.players[x.id], r) < T.eff(m, W.players[xi[k].id], r))) k = i; });
    return k;
  };
  // 0. a bigger match among the next AHEAD: who playing now would reach it under COND_OK (where fitness starts to
  // cost) rests. The game recovers by the club's matches, not by days: COND_PLAY lost playing, COND_REST won resting
  // Only before a big match, and at most SAVE starters (the most tired first): a stand-in costs more than a tired star
  var big = G.mgrRot.ahead(st, opp).filter(function (a) { return a.w === 'big'; })[0];
  if (big) {
    var need = K.COND_OK + K.COND_PLAY - big.n * K.COND_REST * G.mgrYouth.train(m).rest, why = big.why, saved = 0;
    xi.map(function (x, k) { return k; }).sort(function (a, b) { return T.cond(m, xi[a].id) - T.cond(m, xi[b].id); }).forEach(function (k) {
      var c = T.cond(m, xi[k].id), s = saved < R.SAVE && c < need ? stand(k) : undefined, n0 = n;
      if (s) { var sub = s; tryIn(k, sub, function (out) { return 'riposa ' + sur(out) + ' (condizione ' + c + ') per ' + why + ', gioca ' + sur(sub); }); }
      if (n > n0) saved++;
    });
  }
  // 1. tired starters rest
  xi.forEach(function (x, k) {
    var c = T.cond(m, x.id), s = c < L.COND ? stand(k) : undefined;
    if (s) { var sub = s; tryIn(k, sub, function (out) { return 'riposa ' + sur(out) + ' (condizione ' + c + '), gioca ' + sur(sub); }); }
  });
  if (easy) {
    // 2. who started RUN matches in a row rests, unless he is at full fitness
    xi.forEach(function (x, k) {
      var run = rot.run[x.id] || 0, s = run >= R.RUN && !full(x.id) ? stand(k) : undefined;
      if (s) { var sub = s; tryIn(k, sub, function (out) { return 'riposa ' + sur(out) + ' (' + run + ' partite di fila), gioca ' + sur(sub); }); }
    });
    // 3. a reserve without a start for IDLE matches plays; 4. a young talent plays one easy match in two
    bench.forEach(function (b) {
      var idle = rot.idle[b.i] || 0, young = b.a <= R.YOUNG_AGE && b.p >= club.str && rot.easy % 2 === 0, k = idle >= R.IDLE || young ? weakest(b.r) : -1;
      if (k >= 0) tryIn(k, b, function (out) { return 'gioca ' + sur(b) + (idle >= R.IDLE ? ' (fermo da ' + idle + ' partite)' : ' (giovane)') + ', riposa ' + sur(out); });
    });
  }
  // a starter who rested last time and is back at full fitness: say he plays again
  xi.forEach(function (x, k) {
    if (!changed[k] && full(x.id) && (rot.idle[x.id] || 0) >= 1 && best[k].id === x.id) notes.push('torna titolare ' + sur(W.players[x.id]) + ' (condizione ' + T.cond(m, x.id) + ')');
  });
  return { xi: xi, w: w, notes: notes };
};

// After a match: the counters, kept only while the switch is on (squad players only)
/** @param {State} st @param {MatchSide} side */
G.mgrRot.after = function (st, side) {
  var m = G.mgr.job(st), club = st.world.clubs[m.club];
  if (!m.assist || !m.assist.rotate) return;
  var old = m.rot || { run: {}, idle: {}, easy: 0 }, /** @type {MgrRotation} */ r = { run: {}, idle: {}, easy: old.easy + (side.rw === 'easy' ? 1 : 0) };
  club.sq.forEach(function (id) {
    var on = side.ids.indexOf(id) >= 0;
    r.run[id] = on ? (old.run[id] || 0) + 1 : 0;
    r.idle[id] = on ? 0 : (old.idle[id] || 0) + 1;
  });
  m.rot = r;
};

// The line before the match: what the turnover does (empty when it is off)
/** @param {State} st @param {ClubId} opp @param {MatchComp} comp @returns {string} */
G.mgrRot.line = function (st, opp, comp) {
  if (!G.mgrRot.on(st)) return '';
  var P = G.mgrRot.plan(st, opp, comp);
  return '🔄 Turnover: ' + (P.w === 'big' ? 'partita importante, giocano i migliori' : P.notes.length ? P.notes.join('; ') : 'nessun cambio in una partita ' + (P.w === 'easy' ? 'facile' : 'normale'));
};
