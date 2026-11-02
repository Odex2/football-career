// @ts-check
// Awards: league leaderboards, Player of the Season, Golden Shoe, Ballon d'Or.

G.awards = {};

// Uniform entries for everyone (NPCs + the main player). scope: 'lg' league stats or 'all'
/** @param {State} st @param {LeagueKey|null} filterKey @param {string} scope @returns {AwardEntry[]} */
G.awards.entries = function (st, filterKey, scope) {
  var W = st.world, /** @type {AwardEntry[]} */ out = [], lg = scope === 'lg', o = lg ? 0 : 5;
  var pool = filterKey ? /** @type {Npc[]} */ ([]).concat.apply([], W.clubs.filter(function (c) { return c.lg === filterKey; }).map(function (c) { return c.sq.map(function (id) { return W.players[id]; }); })) : W.players;
  pool.forEach(function (pl) {
    if (!pl || pl.c < 0 || pl.s[o] === 0) return;
    out.push({ id: pl.i, n: pl.n, nt: pl.nt, r: pl.r, club: pl.c, apps: pl.s[o], g: pl.s[o + 1], a: pl.s[o + 2], cs: pl.s[o + 3], avg: pl.s[o + 4] / pl.s[o], o: pl.o });
  });
  var p = st.player, ps = st.S && st.S.ps;
  if (ps && (!filterKey || W.clubs[p.clubId].lg === filterKey)) {
    var e = /** @type {AwardEntry} */ (lg ? { apps: ps.lg[0], g: ps.lg[1], a: ps.lg[2], cs: ps.lg[3], avg: ps.lg[0] ? ps.lg[4] / ps.lg[0] : 0 }
      : { apps: ps.apps, g: ps.goals, a: ps.assists, cs: p.role === 'POR' ? ps.cs : ps.csd || 0, avg: ps.rN ? ps.rSum / ps.rN : 0 });
    if (e.apps > 0) { e.id = 'me'; e.n = p.name; e.nt = p.nat; e.r = p.role; e.def = G.pos.def(p) ? 1 : 0; e.club = p.clubId; e.o = p.ovr; e.me = 1; out.push(e); }
  }
  return out;
};

/** @param {AwardEntry[]} list @param {'g'|'a'|'cs'|'avg'} key @param {number} n @param {(e: AwardEntry) => boolean} [filter] */
G.awards.top = function (list, key, n, filter) {
  return list.filter(filter || function () { return true; }).sort(function (a, b) {
    return (b[key] - a[key]) || (a.apps - b.apps) || ((b.g + b.a) - (a.g + a.a));
  }).slice(0, n);
};

/** @param {State} st @param {LeagueKey} key @param {number} n */
G.awards.leagueBoards = function (st, key, n) {
  var list = G.awards.entries(st, key, 'lg'), L = G.leagueByKey(key);
  var md = st.S ? st.S.lg[key].md : 2 * (L.size - 1);
  var minApps = Math.max(1, Math.floor(md * G.CFG.POTS_MIN_SHARE));
  return {
    scorers: G.awards.top(list, 'g', n),
    assists: G.awards.top(list, 'a', n),
    gk: G.awards.top(list, 'cs', n, function (e) { return e.r === 'POR'; }),
    rating: G.awards.top(list, 'avg', n, function (e) { return e.apps >= minApps; })
  };
};

/** @param {LeagueKey} key */
G.awards.bootCoef = function (key) {
  var C = G.CFG.BOOT_COEF, L = G.leagueByKey(key);
  if (!G.NATIONS[L.nat].eu) return 0;
  if (L.tier === 1 && ['ENG', 'ESP', 'ITA', 'GER', 'FRA'].indexOf(L.nat) >= 0) return C.top5;
  return L.tier === 1 ? C.eu : C.other;
};

// Ballon d'Or score. bonus: { entryId: points } from trophies and individual awards
/** @param {State} st @param {Dict<number>} [bonus] @returns {ScoredEntry[]} */
G.awards.bdo = function (st, bonus) {
  var C = G.CFG.BDO, W = st.world;
  return G.awards.entries(st, null, 'all').filter(function (e) {
    return e.apps >= G.CFG.BDO_MIN_APPS * (st.S && st.S.block < 4 ? st.S.block / 4 : 1) && G.leagueByKey(W.clubs[e.club].lg).tier === 1;
  }).map(function (e) {
    var def = e.r === 'POR' || e.r === 'DC' || !!e.def, club = W.clubs[e.club], LW = G.CFG.BDO_LEAGUE;
    var lw = !G.NATIONS[club.nat].eu ? LW.other : ['ENG', 'ESP', 'ITA', 'GER', 'FRA'].indexOf(club.nat) >= 0 ? LW.top5 : LW.eu;
    e.score = ((e.avg - 6.5) * C.rating + (Math.min(e.g, C.goalCap) + Math.max(0, e.g - C.goalCap) * 0.5) * C.goal + e.a * C.assist + (def ? e.cs * C.cs + 8 : 0)) * lw +
      (club.str - 75) * C.str + (bonus ? bonus[e.id] || 0 : 0) + (e.me ? st.player.fame * C.fame : 0);
    return /** @type {ScoredEntry} */ (e);
  }).sort(function (a, b) { return b.score - a.score; });
};

/** @param {State} st @param {Dict<ClubId[]>} tables @param {[ClubId, string][]} honours @param {SeasonRecord} rec */
G.awards.season = function (st, tables, honours, rec) {
  var C = G.CFG, W = st.world, p = st.player, year = G.sure(st.S).year, /** @type {Dict<number>} */ bonus = {}, B = C.BDO;
  /** @type {AwardRoll} */
  var roll = { year: year, lg: {}, champs: {}, eu: {}, bdo: [], boot: null };
  /** @param {PlayerId|string} id @param {number} v */
  var add = function (id, v) { bonus[id] = (bonus[id] || 0) + v; };
  /** @param {AwardEntry} e @param {string} name @param {number} [tier] */
  var mine = function (e, name, tier) {
    if (!e || !e.me) return;
    p.awards.push({ name: name, year: year, w: tier === 2 ? 1 : 3 }); rec.awards.push(name); G.life.fame(st, 3);
  };
  // an empty list gives null, typed as an entry: the rolls are only read where somebody won
  /** @param {AwardEntry|undefined} e @returns {AwardShort} */
  var short = function (e) { return e ? { id: e.id, n: e.n, club: W.clubs[e.club].name, g: e.g, a: e.a, cs: e.cs, avg: Math.round(e.avg * 100) / 100, me: e.me || 0 } : /** @type {AwardShort} */ (/** @type {unknown} */ (null)); };
  // Team honours as Ballon d'Or bonus for players of the winning clubs
  /** @type {Dict<number>} */
  var clubBonus = {};
  honours.forEach(function (h) {
    var id = h[0], name = h[1], c = W.clubs[id], L = G.leagueByKey(c.lg), v = 0;
    G.EU_KEYS.forEach(function (k) { if (G.sure(st.S).eu[k].name === name) { v = B[k]; roll.eu[k] = c.name; } });
    if (!v && L.name === name) { v = L.tier === 1 ? (['ENG', 'ESP', 'ITA', 'GER', 'FRA'].indexOf(c.nat) >= 0 ? B.titleTop : B.title) : 0; roll.champs[c.lg] = c.name; }
    else if (!v) v = B.cup;
    clubBonus[id] = (clubBonus[id] || 0) + v;
  });
  G.awards.entries(st, null, 'all').forEach(function (e) { if (clubBonus[e.club]) add(e.id, clubBonus[e.club]); });
  // League awards
  /** @type {{ e: AwardEntry, pts: number }[]} */
  var shoe = [];
  G.LEAGUES.forEach(function (L) {
    var b = G.awards.leagueBoards(st, L.key, 1);
    roll.lg[L.key] = { scorer: short(b.scorers[0]), assist: short(b.assists[0]), gk: short(b.gk[0]), pots: short(b.rating[0]) };
    if (b.rating[0]) add(b.rating[0].id, B.pots);
    mine(b.scorers[0], 'Capocannoniere ' + L.name, L.tier); mine(b.assists[0], 'Re degli assist ' + L.name, L.tier);
    mine(b.gk[0], 'Guanto d’oro ' + L.name, L.tier); mine(b.rating[0], 'Player of the Season ' + L.name, L.tier);
    var coef = G.awards.bootCoef(L.key);
    if (coef) G.awards.entries(st, L.key, 'lg').forEach(function (e) { if (e.g >= 10) shoe.push({ e: e, pts: e.g * coef }); });
  });
  shoe.sort(function (a, b) { return b.pts - a.pts; });
  if (shoe[0]) { roll.boot = short(shoe[0].e); roll.boot.pts = shoe[0].pts; add(shoe[0].e.id, B.boot); mine(shoe[0].e, 'Scarpa d’Oro'); }
  var ntB = G.sure(st.S).ntBonus || {};
  Object.keys(ntB).forEach(function (id) { add(id === 'me' ? id : +id, ntB[id]); });
  var bdo = G.awards.bdo(st, bonus);
  roll.bdo = bdo.slice(0, 10).map(function (e) { var s = short(e); s.score = Math.round(e.score); return s; });
  mine(bdo[0], 'Pallone d’Oro');
  var myRank = bdo.findIndex(function (e) { return e.me; });
  roll.myBdo = myRank >= 0 ? myRank + 1 : null;
  if (myRank >= 0 && myRank < 30) { rec.bdo = myRank + 1; G.life.fame(st, Math.max(0, (30 - myRank) / 4)); }
  if (bdo[0]) G.news(st, '🏅 Pallone d’Oro ' + G.season.label(year) + ': ' + bdo[0].n + ' (' + W.clubs[bdo[0].club].name + ')');
  (st.roll || (st.roll = [])).unshift(roll);
  if (st.roll.length > 25) st.roll.length = 25;
};
