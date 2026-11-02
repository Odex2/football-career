// @ts-check
// Season: fixtures, blocks, cups, end of season.

G.season = {};
/** @type {Dict<number[][][]>} */
G.fixCache = {};

/** @param {State} st @param {string} txt */
G.news = function (st, txt) {
  var list = st.news || (st.news = []);
  list.unshift({ y: st.S ? st.S.year : st.year, b: st.S ? st.S.block : 0, t: txt });
  if (list.length > 80) list.length = 80;
};

// Double round robin (circle method) from a fixed id order
/** @param {Season} S @param {LeagueKey} key @returns {number[][][]} */
G.season.fixtures = function (S, key) {
  var ck = S.year + key;
  if (G.fixCache[ck]) return G.fixCache[ck];
  var arr = S.lg[key].ids.slice();
  if (arr.length % 2) arr.push(-1);
  var n = arr.length, /** @type {number[][][]} */ rounds = [];
  for (var r = 0; r < n - 1; r++) {
    /** @type {number[][]} */
    var md = [];
    for (var i = 0; i < n / 2; i++) {
      var a = arr[i], b = arr[n - 1 - i];
      if (a >= 0 && b >= 0) md.push(r % 2 ? [b, a] : [a, b]);
    }
    rounds.push(md);
    arr.splice(1, 0, /** @type {number} */ (arr.pop()));
  }
  var back = rounds.map(function (md) { return md.map(function (m) { return [m[1], m[0]]; }); });
  return (G.fixCache[ck] = rounds.concat(back));
};

/** @param {State} st */
G.season.start = function (st) {
  var W = st.world, rng = G.rng;
  G.fixCache = {};
  // the start of the season, its stats and calendar come below
  var S = /** @type {Season} */ (/** @type {unknown} */ ({ year: st.year, block: 0, lg: {}, cups: {}, ps: G.season.emptyStats(), log: [], prize: {}, blockRows: [] }));
  G.LEAGUES.forEach(function (L) {
    var ids = W.clubs.filter(function (c) { return c.lg === L.key; }).map(function (c) { return c.id; });
    /** @type {Dict<TableRow>} */
    var tab = {};
    ids.forEach(function (id) { tab[id] = [0, 0, 0, 0, 0, 0, 0]; }); // p w d l gf ga pts
    S.lg[L.key] = { ids: rng.shuffle(ids), tab: tab, md: 0 };
  });
  G.DATA.nations.forEach(function (n) {
    var ids = W.clubs.filter(function (c) { return c.nat === n.id; }).map(function (c) { return c.id; });
    S.cups[n.id] = { name: n.cup, alive: ids, R: Math.ceil(Math.log2(ids.length)), r: 0, winner: null };
  });
  S.start0 = { ovr: st.player.ovr, fame: st.player.fame, money: st.player.money + st.player.invest };
  if (!st.mgr) st.attrs0 = JSON.parse(JSON.stringify(st.player.attrs));  // the Profile shows the change over the season
  st.S = S;
  S.eu = G.europe.setup(st, st.euQual || G.europe.initialQual(W));
  // the calendar (M8 phase J): every cup's first round drawn now, then the dates, then the league matches that clash move
  Object.keys(S.cups).forEach(function (k) { G.season.drawCup(st, k); });
  S.cal = G.cal.build(st);
  G.cal.resolve(st, null);
  G.transfers.window(st, 0);
  G.season.refresh(st);
  if (st.mgr) G.mgr.seasonStart(st);
  else { G.transfers.playerOffers(st, 0); G.goals.offer(st); }
};

// Recompute XIs/strengths after transfers
/** @param {State} st */
G.season.refresh = function (st) {
  G.world.updateStrength(st.world);
  G.match.prepare(st.world);
};

/** @returns {SeasonStats} */
G.season.emptyStats = function () {
  return { apps: 0, starts: 0, mins: 0, goals: 0, assists: 0, cs: 0, rSum: 0, rN: 0, matches: 0, inj: 0, clubs: [], lg: [0, 0, 0, 0, 0] };
};

/** @param {Season} S @param {LeagueKey} key @returns {ClubId[]} */
G.season.sortTable = function (S, key) {
  var tab = S.lg[key].tab;
  return S.lg[key].ids.slice().sort(function (a, b) {
    var x = tab[a], y = tab[b];
    return (y[6] - x[6]) || ((y[4] - y[5]) - (x[4] - x[5])) || (y[4] - x[4]) || (a - b);
  });
};

/** @param {Dict<TableRow>} tab @param {ClubId|NationCode} h @param {ClubId|NationCode} a @param {number[]} res */
G.season.addResult = function (tab, h, a, res) {
  var x = tab[h], y = tab[a];
  x[0]++; y[0]++; x[4] += res[0]; x[5] += res[1]; y[4] += res[1]; y[5] += res[0];
  if (res[0] > res[1]) { x[1]++; y[3]++; x[6] += 3; }
  else if (res[0] < res[1]) { y[1]++; x[3]++; y[6] += 3; }
  else { x[2]++; y[2]++; x[6]++; y[6]++; }
};

// The user's club: the player's, or the managed one (-1 when the manager has no club)
/** @param {State} st @returns {ClubId} */
G.season.myClub = function (st) { return st.mgr ? (G.mgr.active(st) ? G.mgr.job(st).club : -1) : st.player.clubId; };
// A tie of the user's club decided after a draw: the engine draws the winner, the match row says "ai rigori"
/** @param {State} st @param {ClubId} h @param {ClubId} a */
G.season.markPen = function (st, h, a) { var my = G.season.myClub(st), rows = G.sure(st.S).blockRows; if ((h === my || a === my) && rows.length) rows[rows.length - 1].pen = 1; };
// Name of a cup round from the clubs still in it (2 = final), as G.tour.ROUND
/** @param {CupState} cup @returns {string} */
G.season.cupRound = function (cup) { return G.tour.ROUND[cup.alive.length] || (cup.r + 1) + 'º turno'; };

// ---------- national cups with a calendar (M8 phase J) ----------
// The draw is made as soon as the round before ends (the first one when the season starts), so the opponent is
// known before the match: cup.ties holds [home, away, winner]; with an odd number of clubs the last one goes through
/** @param {State} st @param {NationCode} nat */
G.season.drawCup = function (st, nat) {
  var cup = G.sure(st.S).cups[nat], a = G.rng.shuffle(cup.alive), /** @type {number[][]} */ ties = [];
  for (var i = 0; i + 1 < a.length; i += 2) ties.push([a[i], a[i + 1]]);
  if (a.length % 2) ties.push([a[a.length - 1], -1, a[a.length - 1]]);
  cup.ties = ties;
};

// The ties of the round due on a date (a Tuesday round is split with the Wednesday); the last one ends the round
/** @param {State} st @param {NationCode} nat @param {number} x */
G.season.cupDay = function (st, nat, x) {
  var S = G.sure(st.S), W = st.world, rng = G.rng, cup = S.cups[nat], d = G.sure(S.cal).cup[nat][cup.r];
  if (cup.winner !== null || !cup.ties || d === undefined || x < d) return;
  var fin = cup.alive.length === 2, comp = { name: cup.name, lg: false, final: fin ? 1 : 0, ck: nat, rd: G.season.cupRound(cup) };
  var real = cup.ties.filter(function (t) { return t[1] >= 0; }).length;
  cup.ties.forEach(function (t, i) {
    if (t[2] !== undefined || G.cal.half(d, i, real, 1) > x) return;
    var res = G.match.play(st, t[0], t[1], comp, fin);
    var hw = res[0] > res[1] || (res[0] === res[1] && rng.chance(0.5 + (W.clubs[t[0]].str - W.clubs[t[1]].str) / 100));
    if (res[0] === res[1]) G.season.markPen(st, t[0], t[1]);
    t[2] = hw ? t[0] : t[1];
  });
  if (cup.ties.every(function (t) { return t[2] !== undefined; })) G.season.endCupRound(st, nat);
};

// The winners go on, the next round is drawn at once, and the league matches it clashes with move
/** @param {State} st @param {NationCode} nat */
G.season.endCupRound = function (st, nat) {
  var cup = G.sure(st.S).cups[nat];
  cup.alive = G.sure(cup.ties).map(function (t) { return t[2]; }); cup.r++;
  if (st.mgr) G.mgrBoard.cupRound(st, cup);  // how far the manager's club got (M8 phase F)
  if (cup.alive.length === 1) { cup.winner = cup.alive[0]; return; }
  G.season.drawCup(st, nat);
  G.cal.resolve(st, cup.alive);
};

// ---------- the old block engine (seasons saved before the calendar) ----------
/** @param {State} st @param {CupState} cup @param {NationCode} [nat] */
G.season.playCupRound = function (st, cup, nat) {
  if (cup.winner !== null) return;
  var W = st.world, rng = G.rng, /** @type {ClubId[]} */ next = [], comp = { name: cup.name, lg: false, final: cup.alive.length === 2 ? 1 : 0, ck: nat, rd: G.season.cupRound(cup) };
  rng.shuffle(cup.alive);
  for (var i = 0; i + 1 < cup.alive.length; i += 2) {
    var h = cup.alive[i], a = cup.alive[i + 1], res = G.match.play(st, h, a, comp, cup.alive.length === 2);
    var hw = res[0] > res[1] || (res[0] === res[1] && rng.chance(0.5 + (W.clubs[h].str - W.clubs[a].str) / 100));
    if (res[0] === res[1]) G.season.markPen(st, h, a);
    next.push(hw ? h : a);
  }
  if (cup.alive.length % 2) next.push(cup.alive[cup.alive.length - 1]);
  cup.alive = next; cup.r++;
  if (st.mgr) G.mgrBoard.cupRound(st, cup);
  if (next.length === 1) cup.winner = next[0];
};

// National cup rounds spread over blocks 0-3, final in block 4
/** @param {CupState} cup @param {number} b */
G.season.cupRoundsFor = function (cup, b) {
  var n = 0;
  for (var r = cup.r; r < cup.R; r++) {
    var blk = r === cup.R - 1 ? 4 : Math.floor(r * 4 / Math.max(1, cup.R - 1));
    if (blk <= b) n++;
  }
  return n;
};

/** @param {State} st @returns {SeasonRecord} */
G.season.end = function (st) {
  var C = G.CFG, S = G.sure(st.S), p = st.player, W = st.world, rng = G.rng;
  var /** @type {Dict<ClubId[]>} */ tables = {}, /** @type {Dict<ClubId|null>} */ cupW = {};
  G.LEAGUES.forEach(function (L) { tables[L.key] = G.season.sortTable(S, L.key); });
  Object.keys(S.cups).forEach(function (k) { cupW[k] = S.cups[k].winner; });
  // Honours and prize money
  /** @type {[ClubId, string][]} */
  var honours = [];
  G.LEAGUES.forEach(function (L) {
    var id = tables[L.key][0];
    honours.push([id, L.name]);
    if (L.tier === 1) S.prize[id] = (S.prize[id] || 0) + C.PRIZE.title * G.world.leagueMult(W.clubs[id]);
  });
  Object.keys(cupW).forEach(function (k) { if (cupW[k] !== null) { honours.push([cupW[k], S.cups[k].name]); S.prize[cupW[k]] = (S.prize[cupW[k]] || 0) + C.PRIZE.cup; } });
  G.EU_KEYS.forEach(function (k) { if (S.eu[k].winner !== null) honours.push([S.eu[k].winner, S.eu[k].name]); });
  honours.forEach(function (h) { var c = W.clubs[h[0]]; c.hon[h[1]] = (c.hon[h[1]] || 0) + 1; });
  // Main player record
  var club = W.clubs[p.clubId], lgKey = club.lg, pos = tables[lgKey].indexOf(p.clubId) + 1;
  var ps = S.ps, /** @type {string[]} */ won = [], played = ps.apps > 0;
  var L = G.leagueByKey(lgKey);
  honours.forEach(function (h) { if (played && ps.clubs.indexOf(h[0]) >= 0 && h[0] === p.clubId) won.push(h[1]); });
  if (played && pos <= C.PROMO_SLOTS && L.tier === 2) won.push('Promozione');
  /** @type {SeasonRecord} */
  var rec = { year: S.year, age: p.age, club: club.name, clubId: club.id, lg: L.name, pos: pos,
    apps: ps.apps, matches: ps.matches, goals: ps.goals, assists: ps.assists, cs: ps.cs, avg: ps.rN ? Math.round(ps.rSum / ps.rN * 100) / 100 : 0,
    ovr: p.ovr, inj: ps.inj, lgG: ps.lg[1], lgA: ps.lg[2], trophies: won, loan: p.loanFrom !== null, awards: [] };
  if (!st.mgr) {
    rec.posK = G.pos.of(p);  // the position played (M9 S5)
    G.pos.seasonEnd(st);
    p.history.push(rec);
    rec.potUp = G.player.potUp(st, rec);
    won.forEach(function (t) { if (t !== 'Promozione') p.trophies.push({ name: t, year: S.year, club: club.name }); });
    p.tot.apps += ps.apps; p.tot.goals += ps.goals; p.tot.assists += ps.assists;
  }
  st.lastTables = { key: lgKey, ids: tables[lgKey], tab: S.lg[lgKey].tab };
  G.tour.seasonEnd(st, rec);
  G.awards.season(st, tables, honours, rec);
  if (st.mgr) G.mgr.seasonEnd(st, tables, honours);
  else {
    G.rec.season(st, rec, st.roll[0]);
    rec.bonus = G.contracts.seasonBonus(st, rec);
    G.captain.seasonEnd(st, rec);
    G.goals.settle(st, rec);
    st.recap = G.recap.build(st, rec, tables);
    G.life.seasonEnd(st, rec, pos);
  }
  G.coaches.review(st, 'end', rng);
  st.euQual = G.europe.qualify(tables, cupW);
  G.world.evolve(W, tables, S.prize);
  // M8 D4-D5: the manager's loans come back first; a club whose contracts he keeps lets go who was not renewed
  var own = st.mgr ? G.mgrDeal.seasonEnd(st) : undefined;
  G.squads.yearEnd(W, rng, function (t) { G.news(st, t); }, own);
  G.coaches.yearEnd(st, rng);
  G.agents.yearEnd(st, rng);
  G.tour.yearEnd(st, rng);
  p.age++; st.year++;
  if (st.mgr) { st.S = null; return rec; }
  p.seasons++;
  if (p.contract) p.contract.years--;
  if (p.loanFrom !== null) {
    G.news(st, '↩️ Torni al ' + W.clubs[p.loanFrom].name + ' dopo il prestito');
    p.clubId = p.loanFrom; p.loanFrom = null;
  }
  st.S = null;
  if (p.seasons >= C.MAX_SEASONS) { st.over = true; st.retireReason = 'Limite di ' + C.MAX_SEASONS + ' stagioni raggiunto'; }
  return rec;
};

/** @param {number} y */
G.season.label = function (y) { return y + '/' + String(y + 1).slice(2); };
