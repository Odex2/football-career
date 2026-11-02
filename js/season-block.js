// @ts-check
// The block engine (moved out of season.js in M8 phase J). A block is played day by day so the UI can stop after
// each of the user's matches. A season with a calendar (S.cal) plays its dates one by one; a season saved before
// the calendar ends with the old abstract days (oldBegin, oldDay), and the calendar starts from the next one.

/** @param {State} st */
G.season.beginBlock = function (st) {
  var S = G.sure(st.S), p = st.player, rng = G.rng, b = S.block;
  if (st.mgr && (b === 0 || b === 2)) G.mgrDeal.close(st);  // the manager's window closes (M8 phase D)
  if (st.mgr && b === 0) { G.mgrYouth.due(st); G.mgrBoard.due(st); }  // the boys of 19, a national team's offer (M8 E, F)
  if (b === 5) return G.tour.beginBlock(st);
  if (!S.cal) return G.season.oldBegin(st);
  if (b === 2) { G.transfers.window(st, 1); G.season.refresh(st); G.agents.reshuffle(st, rng); }
  var days = G.cal.days(st, b);
  /** @type {BlockInProgress} */
  var cur = { b: b, d: 0, D: days.length, days: days, lg: {}, cup: {}, eu: {}, ps0: JSON.parse(JSON.stringify(S.ps)), ovrBefore: p.ovr, injury: 0 };
  if (b === 1) G.europe.blockPrize(st);
  if (b === 2) G.national.qualify(st);
  S.blockRows = [];
  if (b < 4 && !st.mgr) cur.injury = G.player.injuryRoll(p, rng);
  S.cur = cur;
};

// Everything due on the block's next date: league matches, cup ties, European matches, the national team break
/** @param {State} st */
G.season.playDay = function (st) {
  var S = G.sure(st.S), cur = G.sure(S.cur);
  if (st.mgr) G.mgrJobs.tick(st);  // free benches and offers that expire (M9 S2)
  if (cur.b === 5) { G.tour.day(st, cur.d); cur.d++; return; }
  if (!cur.days) return G.season.oldDay(st);
  var x = cur.days[cur.d];
  S.today = x;
  S.pStart = st.mgr ? 0 : G.season.startChance(st);
  G.LEAGUES.forEach(function (L) { G.season.leagueDay(st, L, x); });
  Object.keys(S.cups).forEach(function (k) { G.season.cupDay(st, k, x); });
  G.europe.playDate(st, x);
  if (G.sure(S.cal).nt.indexOf(x) >= 0) G.national.window(st, cur.b);
  cur.d++;
};

// A league's matches on a date: those of the matchdays due that have not moved, then those moved to the date.
// lg.md stays the next matchday to play at its date; the table counts the matches each club has played.
/** @param {State} st @param {LeagueInfo} L @param {number} x */
G.season.leagueDay = function (st, L, x) {
  var S = G.sure(st.S), key = L.key, lg = S.lg[key], fx = G.season.fixtures(S, key), cal = G.sure(S.cal), dates = cal.lg[key], mv = cal.mv[key] || {}, comp = { name: L.name, lg: true, ck: 'lg' };
  var play = /** @param {number[]} m */ function (m) { G.season.addResult(lg.tab, m[0], m[1], G.match.play(st, m[0], m[1], comp)); };
  for (var md = lg.md; md < fx.length && dates[md] <= x; md++) fx[md].forEach(function (m, i) { if (mv[md + ':' + m[0]] === undefined && G.cal.base(S, key, md, i) === x) play(m); });
  Object.keys(mv).forEach(function (k) {
    if (mv[k] !== x) return;
    var p = k.split(':'), h = +p[1];
    fx[+p[0]].forEach(function (m) { if (m[0] === h) play(m); });
  });
  while (lg.md < fx.length && dates[lg.md] + (G.cal.dow(dates[lg.md]) === 5 ? 1 : 0) <= x) lg.md++;
};

// ---------- the old engine, for a season saved before the calendar ----------
// Every day each league advances proportionally, cup rounds and European steps are spread across the block.
/** @param {State} st */
G.season.oldBegin = function (st) {
  var C = G.CFG, S = G.sure(st.S), p = st.player, rng = G.rng, b = S.block;
  if (b === 2) { G.transfers.window(st, 1); G.season.refresh(st); G.agents.reshuffle(st, rng); }
  var cum = 0; for (var i = 0; i <= b; i++) cum += C.BLOCK_SHARE[i];
  /** @type {BlockInProgress} */
  var cur = { b: b, d: 0, D: 1, lg: {}, cup: {}, eu: {}, ps0: JSON.parse(JSON.stringify(S.ps)), ovrBefore: p.ovr, injury: 0 };
  G.LEAGUES.forEach(function (L) {
    var lg = S.lg[L.key], T = Math.round(G.season.fixtures(S, L.key).length * Math.min(1, cum + 1e-9));
    cur.lg[L.key] = [lg.md, T];
    cur.D = Math.max(cur.D, T - lg.md);
  });
  Object.keys(S.cups).forEach(function (k) { cur.cup[k] = [G.season.cupRoundsFor(S.cups[k], b), 0]; });
  G.europe.beginBlock(st, cur);
  if (b === 2) G.national.qualify(st);
  S.blockRows = [];
  if (b < 4 && !st.mgr) cur.injury = G.player.injuryRoll(p, rng);
  S.cur = cur;
};

/** @param {State} st */
G.season.oldDay = function (st) {
  var S = G.sure(st.S), cur = G.sure(S.cur), d = cur.d, D = cur.D, f = (d + 1) / D;
  S.pStart = st.mgr ? 0 : G.season.startChance(st);
  G.LEAGUES.forEach(function (L) {
    var lg = S.lg[L.key], fx = G.season.fixtures(S, L.key), r = cur.lg[L.key], comp = { name: L.name, lg: true, ck: 'lg' };
    var target = Math.round(r[0] + (r[1] - r[0]) * f);
    for (; lg.md < target; lg.md++) {
      fx[lg.md].forEach(function (m) { G.season.addResult(lg.tab, m[0], m[1], G.match.play(st, m[0], m[1], comp)); });
    }
  });
  Object.keys(cur.cup).forEach(function (k) {
    var c = cur.cup[k], target = Math.min(c[0], Math.floor(c[0] * f + 0.5));
    for (; c[1] < target; c[1]++) G.season.playCupRound(st, S.cups[k], k);
  });
  G.europe.playDay(st, cur, d, D);
  if ((cur.b === 1 || cur.b === 3) && d === Math.floor(D / 2)) G.national.window(st, cur.b);
  cur.d++;
};

// ---------- the same for both ----------
// Summary of the block so far (used live by the UI and at the end of the block)
/** @param {State} st @returns {BlockSum} */
G.season.summary = function (st) {
  var S = G.sure(st.S), cur = G.sure(S.cur), ps = S.ps, ps0 = cur.ps0, p = st.player;
  var mins = ps.mins - ps0.mins, matches = ps.matches - ps0.matches;
  return { block: cur.b, ovrBefore: cur.ovrBefore, ovrAfter: p.ovr, injury: cur.injury, partial: cur.d < cur.D,
    apps: ps.apps - ps0.apps, goals: ps.goals - ps0.goals, assists: ps.assists - ps0.assists,
    avg: ps.rN - ps0.rN ? (ps.rSum - ps0.rSum) / (ps.rN - ps0.rN) : 0, matches: matches,
    minShare: matches ? mins / (matches * 90) : 0, rows: S.blockRows, pStart: G.sure(S.pStart) };
};

/** @param {State} st @returns {BlockSum} */
G.season.finishBlock = function (st) {
  var C = G.CFG, S = G.sure(st.S), p = st.player, rng = G.rng, b = G.sure(S.cur).b;
  var sum = G.season.summary(st), ps = S.ps;
  if (b < 4 && !st.mgr) {
    G.player.grow(p, sum.minShare, 0.25, rng);
    G.pos.block(st);  // the focus "Imparare la posizione" (M9 S5)
    var dm = (sum.avg ? (sum.avg - 6.5) * C.MORALE_RATING : 0) + (sum.minShare - 0.5) * C.MORALE_MINUTES + (60 - p.morale) * C.MORALE_REVERT;
    p.morale = Math.round(G.clamp(p.morale + dm + G.life.moraleBonus(st) + (C.INTENSITY[p.plan.intensity].mo || 0), 0, 100));
    G.life.block(st, sum);
  }
  if (b === 1 || b === 2) G.coaches.review(st, 'mid', rng);
  if (b === 1 && !st.mgr) G.transfers.playerOffers(st, 1);
  if (b === 0 && !st.mgr) G.goals.ensure(st);
  if (st.mgr) G.mgr.block(st, b);
  sum.ovrAfter = p.ovr; sum.partial = false;
  if (ps.clubs.indexOf(p.clubId) < 0) ps.clubs.push(p.clubId);
  S.blockRows.forEach(function (r) { if (r.r && (!S.best || r.r > S.best.r)) S.best = r; });
  S.rows = (S.rows || []).concat(S.blockRows);  // the season's matches of the user's club (cup and European cards)
  G.rec.block(st);
  G.press.settle(st, sum);
  S.cur = null;
  S.block++;
  if (b === 5 || (b === 4 && !S.tours)) sum.season = G.season.end(st);
  st.lastBlock = sum;
  return sum;
};

/** @param {State} st @returns {BlockSum|null} */
G.season.playBlock = function (st) {
  var S = G.sure(st.S);
  if (!S.cur) G.season.beginBlock(st);
  while (G.sure(S.cur).d < G.sure(S.cur).D) { if (G.moments.stop(st) || G.mgrLive.stop(st)) return null; G.season.playDay(st); }
  return G.season.finishBlock(st);
};

// One day only (the tournament screen follows it matchday by matchday)
/** @param {State} st @returns {BlockSum|null} */
G.season.playOneDay = function (st) {
  var S = G.sure(st.S);
  if (!S.cur) G.season.beginBlock(st);
  G.season.playDay(st);
  var cur = G.sure(S.cur);
  return cur.d >= cur.D ? G.season.finishBlock(st) : null;
};

// Play days until the player's club has played; returns the block summary only when the block ends
/** @param {State} st @returns {BlockSum|null} */
G.season.playMatch = function (st) {
  var S = G.sure(st.S);
  if (!S.cur) G.season.beginBlock(st);
  var cur = G.sure(S.cur), n = S.blockRows.length;
  while (cur.d < cur.D && S.blockRows.length === n) { if (G.moments.stop(st) || G.mgrLive.stop(st)) return null; G.season.playDay(st); }
  return cur.d >= cur.D ? G.season.finishBlock(st) : null;
};
