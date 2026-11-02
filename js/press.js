// @ts-check
// Press conferences: questions drawn from what is really happening, three tones of answer,
// and promises ("bet") checked at the end of the next block. Cards use the event format (js/events.js) plus:
// press: 1, n(X): the number promised (shown as {betN}), and in an option's effects bet: { k, ok, ko }
// with k = goals | ga (goals + assists) | avg (rating, 2+ apps) | derby (win it) | pos (league place) | wins (half the matches)

G.press = {};

// Rival club met in the coming block, if any
/** @param {State} st @returns {Club|null} */
G.press.derbyAhead = function (st) {
  var S = G.sure(st.S), club = st.world.clubs[st.player.clubId], lg = S.lg[club.lg], fx = G.season.fixtures(S, club.lg), cum = 0;
  if (!club.riv.length || S.block > 4) return null;
  for (var i = 0; i <= S.block; i++) cum += G.CFG.BLOCK_SHARE[i];
  var T = Math.round(fx.length * Math.min(1, cum + 1e-9));
  for (var md = lg.md; md < T; md++) {
    var m = fx[md].filter(function (x) { return (x[0] === club.id || x[1] === club.id) && club.riv.indexOf(x[0] === club.id ? x[1] : x[0]) >= 0; })[0];
    if (m) return st.world.clubs[m[0] === club.id ? m[1] : m[0]];
  }
  return null;
};

/** @param {State} st */
G.press.roll = function (st) {
  if (st.over || st.event || !st.S || st.S.block > 4 || st.bet || !G.rng.chance(G.CFG.PRESS_CHANCE)) return;
  var X = G.events.ctx(st), used = st.evUsed || (st.evUsed = {}), d = G.press.derbyAhead(st);
  X.derbyClub = d; X.derbyName = d ? d.name : '';
  var pool = G.press.cards.filter(function (c) {
    if (used[c.id] === st.year) return false;
    try { return c.c(X); } catch (e) { return false; }
  });
  if (!pool.length) return;
  var w = pool.map(function (c) { return typeof c.w === 'function' ? c.w(X) : (c.w || 1); });
  var card = pool[G.match.pickWeighted(w, G.rng)];
  if (!card) return;
  used[card.id] = st.year;
  var bn = X.betN = card.n ? card.n(X) : 0;
  var ns = card.o.map(function (o) { var b = G.sure(o[1]).bet; return b && b.n !== undefined ? (typeof b.n === 'function' ? b.n(X) : b.n) : bn; });
  st.event = { id: card.id, press: 1, betN: ns, t: G.events.fill(card.t, X), d: G.events.fill(card.d, X), o: card.o.map(function (o) { return G.events.fill(o[0], X); }) };
};

/** @param {State} st @param {PressBetDef} bet @param {number} n @param {string} label */
G.press.bet = function (st, bet, n, label) {
  st.bet = { k: bet.k, n: n, ok: bet.ok || {}, ko: bet.ko || {}, b: G.sure(st.S).block, year: G.sure(st.S).year, t: label };
};

// End of a block: was the promise kept?
/** @param {State} st @param {BlockSum} sum */
G.press.settle = function (st, sum) {
  var B = st.bet, S = G.sure(st.S);
  if (!B) return;
  if (B.year !== S.year || B.b !== sum.block) { if (B.year < S.year || B.b < sum.block) st.bet = null; return; }
  st.bet = null;
  var rows = (sum.rows || []).filter(function (r) { return !r.nt; }), club = st.world.clubs[st.player.clubId], ok = null;
  if (B.k === 'goals') ok = sum.goals >= B.n;
  if (B.k === 'ga') ok = sum.goals + sum.assists >= B.n;
  if (B.k === 'avg') ok = sum.apps >= 2 && sum.avg >= B.n;
  if (B.k === 'pos') ok = G.season.sortTable(S, club.lg).indexOf(club.id) + 1 <= B.n;
  if (B.k === 'derby') { var dr = rows.filter(function (r) { return r.derby; }); if (dr.length) ok = dr.some(function (r) { return r.gf > r.ga; }); }
  if (B.k === 'wins' && rows.length) ok = rows.filter(function (r) { return r.gf > r.ga; }).length >= rows.length / 2;
  if (ok === null) return;
  G.events.effects(st, ok ? B.ok : B.ko, G.events.ctx(st));
  st.pressResult = { ok: ok, t: (ok ? 'Promessa mantenuta: ' : 'Promessa mancata: ') + B.t };
  G.news(st, '🎙️ ' + st.pressResult.t);
  var p = st.player; p.press = p.press || { kept: 0, broken: 0 }; p.press[ok ? 'kept' : 'broken']++;
};
