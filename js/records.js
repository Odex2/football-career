// @ts-check
// Records and the career rival: league single-season scoring records, personal bests, a rival tracked season by season.

G.rec = {};

// Real single-season league scoring records (top 5); other leagues start from a generic mark
/** @type {Dict<{ n: string, g: number, year: number }>} */
G.rec.LEAGUE = {
  ENG1: { n: 'Erling Haaland', g: 36, year: 2022 }, ESP1: { n: 'Lionel Messi', g: 50, year: 2011 },
  ITA1: { n: 'Ciro Immobile', g: 36, year: 2019 }, GER1: { n: 'Robert Lewandowski', g: 41, year: 2020 },
  FRA1: { n: 'Josip Skoblar', g: 44, year: 1970 }
};
G.rec.DEFAULT_G = 30;

/** @param {State} st @returns {Records} */
G.rec.init = function (st) {
  if (st.records) return st.records;
  var R = st.records = /** @type {Records} */ ({ lg: {}, me: {}, rival: null, rivalLog: [] });
  G.LEAGUES.forEach(function (L) {
    var x = G.rec.LEAGUE[L.key];
    R.lg[L.key] = x ? { n: x.n, g: x.g, year: x.year, real: 1 } : { n: null, g: G.rec.DEFAULT_G, year: null };
  });
  return R;
};

// Personal bests after each block (most goals in one match)
/** @param {State} st */
G.rec.block = function (st) {
  var R = G.rec.init(st), p = st.player;
  (G.sure(st.S).blockRows || []).forEach(function (r) {
    if (r.g > 0 && (!R.me.matchG || r.g > R.me.matchG.v)) R.me.matchG = { v: r.g, year: G.sure(st.S).year, opp: r.opp, nt: r.nt || 0 };
  });
};

// End of season (after the awards): league records, personal bests, rival
/** @param {State} st @param {SeasonRecord} rec @param {AwardRoll} roll */
G.rec.season = function (st, rec, roll) {
  var R = G.rec.init(st), p = st.player, me = R.me, S = G.sure(st.S);
  G.LEAGUES.forEach(function (L) {
    var s = roll.lg[L.key] && roll.lg[L.key].scorer, cur = R.lg[L.key];
    if (!s || s.g <= cur.g) return;
    R.lg[L.key] = { n: s.n, g: s.g, year: roll.year, me: s.me, prev: cur.n ? cur.n + ' (' + cur.g + ')' : null };
    if (s.me) { rec.records = (rec.records || []).concat(['Record di gol in ' + L.name + ': ' + s.g]); G.life.fame(st, 4); }
    if (s.me || L.tier === 1 && G.rec.LEAGUE[L.key]) G.news(st, '📜 Record storico in ' + L.name + ': ' + s.n + ' segna ' + s.g + ' gol in una stagione');
  });
  var best = /** @param {string} k @param {number} v @param {{ club: string }} [extra] */ function (k, v, extra) { if (v > 0 && (!me[k] || v > me[k].v)) me[k] = Object.assign({ v: v, year: S.year }, extra || {}); };
  best('seasonG', rec.goals, { club: rec.club }); best('seasonA', rec.assists, { club: rec.club });
  if (rec.apps >= 15) best('avg', rec.avg, { club: rec.club });
  G.rec.rivalSeason(st, roll);
};

// Rival: chosen when the player turns 19, the best young talent of a similar age and an attacking or same role
/** @param {State} st */
G.rec.pickRival = function (st) {
  var p = st.player, W = st.world, /** @type {{ id: PlayerId, n: string, sc: number }|null} */ found = null;
  W.players.forEach(function (pl) {
    if (!pl || Math.abs(pl.a - p.age) > 1 || pl.c < 0) return;
    if (pl.r !== p.role && ['ATT', 'ES', 'CC'].indexOf(pl.r) < 0) return;
    var sc = pl.p * 2 + pl.o;
    if (!found || sc > found.sc) found = { id: pl.i, n: pl.n, sc: sc };
  });
  var best = /** @type {{ id: PlayerId, n: string, sc: number }|null} */ (found);  // filled in the callback above
  if (!best) return;
  // A rival worth the name: his ceiling is close to the player's
  var pl = W.players[best.id];
  pl.p = Math.max(pl.p, Math.min(G.CFG.RIVAL_POT_MAX, p.pot - G.rng.int(0, 3)));
  G.sure(st.records).rival = { id: best.id, n: best.n, since: st.S ? st.S.year : st.year };
  G.news(st, '⚔️ I media hanno scelto il tuo grande rivale: ' + best.n);
};

/** @param {State} st @returns {Npc|null} */
G.rec.rivalPlayer = function (st) {
  var r = st.records && st.records.rival, pl = r ? st.world.players[r.id] : null;
  return pl && r && pl.n === r.n ? pl : null;
};

/** @param {State} st @param {AwardRoll} roll */
G.rec.rivalSeason = function (st, roll) {
  var R = G.sure(st.records), p = st.player;
  if (!R.rival && p.age >= 19) return G.rec.pickRival(st);
  var pl = G.rec.rivalPlayer(st);
  if (!pl) { if (R.rival && !R.rival.ret) { R.rival.ret = roll.year; G.news(st, '👋 Il tuo rivale ' + R.rival.n + ' si è ritirato'); } return; }
  var me = pl, rank = roll.bdo.findIndex(function (e) { return e.id === me.i; }) + 1, W = st.world;
  // The rival never drifts out of football as a free agent: a big club signs him
  if (pl.c < 0 && pl.a < 34) {
    var tops = W.clubs.filter(function (c) { return c.id !== p.clubId && c.str >= me.o - 8; }).sort(function (a, b) { return b.rep - a.rep; }).slice(0, 8);
    if (tops.length) G.transfers.move(st, pl, G.rng.pick(tops), 0, G.squads.wage(pl.o, tops[0]));
  }
  R.rivalLog.push({ year: roll.year, o: Math.round(pl.o), g: pl.s[6], a: pl.s[7], apps: pl.s[5], club: pl.c >= 0 ? W.clubs[pl.c].name : '', bdo: rank || null });
  if (rank === 1) G.news(st, '⚔️ Il tuo rivale ' + pl.n + ' vince il Pallone d’Oro');
};

// Career totals of the rival since the rivalry started, against the player's over the same seasons
/** @param {State} st */
G.rec.duel = function (st) {
  var R = G.sure(st.records), log = R.rivalLog, /** @type {Dict<number>} */ years = {}, p = st.player;
  log.forEach(function (x) { years[x.year] = 1; });
  var mine = p.history.filter(function (h) { return years[h.year]; });
  var sum = /** @param {any[]} l @param {string} k */ function (l, k) { return l.reduce(function (s, x) { return s + (x[k] || 0); }, 0); };
  var bdoW = /** @param {{ bdo?: number|null }[]} l */ function (l) { return l.filter(function (x) { return x.bdo === 1; }).length; };
  var better = 0;
  log.forEach(function (x) { var h = mine.filter(function (m) { return m.year === x.year; })[0]; if (h && (h.bdo || 99) < (x.bdo || 99)) better++; });
  return { seasons: log.length, me: { g: sum(mine, 'goals'), a: sum(mine, 'assists'), bdo: bdoW(mine) }, him: { g: sum(log, 'g'), a: sum(log, 'a'), bdo: bdoW(log) }, aheadBdo: better };
};
