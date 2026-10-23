// @ts-check
// National teams: strength from real player pools, the ct, call-ups, international windows,
// qualification and the end-of-tournament wrap-up (trophies, awards, Ballon d'Or bonus).

G.national = {}; /** @type {NtCache} */ G.national._c = null;

/** @param {NationCode} nat */
G.national.name = function (nat) { var t = G.NT[nat] || G.nationInfo(nat); return t.flag + ' ' + t.name; };

// Older saves and new careers: national stats and the ct of the player's nation
/** @param {State} st */
G.national.init = function (st) {
  var p = st.player;
  if (!p.nt) p.nt = { caps: 0, goals: 0, assists: 0, rSum: 0, rN: 0, debut: null, tours: [] };
  if (st.world.ntCoach === undefined) G.national.appoint(st, G.rng, true);
  if (!st.ntRoll) st.ntRoll = [];
};

// Real players by nation and role, best first; cached for half a season
/** @param {State} st @returns {NtCache} */
G.national.pools = function (st) {
  var W = st.world, key = st.S.year + ':' + (st.S.block >= 2 ? 1 : 0), c = G.national._c;
  if (c && c.key === key && c.W === W) return c;
  /** @type {Dict<Dict<PlayerId[]>>} */ var pool = {};
  W.players.forEach(function (pl) {
    if (!pl || pl.c < 0) return;
    var n = pool[pl.nt] || (pool[pl.nt] = {});
    (n[pl.r] || (n[pl.r] = [])).push(pl.i);
  });
  Object.keys(pool).forEach(function (nat) {
    Object.keys(pool[nat]).forEach(function (r) { pool[nat][r].sort(function (a, b) { return W.players[b].o - W.players[a].o; }); });
  });
  return (G.national._c = { key: key, W: W, pool: pool, str: {}, xi: {} });
};

/** @param {State} st @param {NationCode} nat */
G.national.xi = function (st, nat) {
  var c = G.national.pools(st), F = G.CFG.FORMATION, pool = c.pool[nat] || {};
  if (c.xi[nat]) return c.xi[nat];
  /** @type {PlayerId[]} */ var ids = [];
  Object.keys(F).forEach(function (r) { ids = ids.concat((pool[r] || []).slice(0, F[r])); });
  return (c.xi[nat] = ids);
};

/** @param {State} st @param {NationCode} nat */
G.national.str = function (st, nat) {
  var c = G.national.pools(st), N = G.CFG.NT, W = st.world, ct = G.mgrBoard.ntBonus(st, nat);  // the manager as its ct (M8 F2)
  if (c.str[nat] !== undefined) return c.str[nat] + ct;
  var base = G.NT[nat] ? G.NT[nat].base : 60, xi = G.national.xi(st, nat);
  if (!xi.length) return (c.str[nat] = base) + ct;
  var sum = xi.reduce(function (s, id) { return s + W.players[id].o; }, 0) + (11 - xi.length) * (base - 4);
  // nations without a league in the game have random player pools: trust their base strength more
  var w = N.BLEND * Math.min(1, xi.length / N.MIN_FOUND) * (G.NATIONS[nat] ? 1 : 0.5);
  return (c.str[nat] = w * sum / 11 + (1 - w) * base) + ct;
};

/** @param {State} st */
G.national.coach = function (st) { var id = st.world.ntCoach; return id !== undefined && id !== null ? st.world.coaches[id] : null; };

// Pick a new ct for the player's nation: free coaches of that nation, ex-coaches who rate the player weigh more
/** @param {State} st @param {Rng} rng @param {boolean} [quiet] */
G.national.appoint = function (st, rng, quiet) {
  var W = st.world, p = st.player, old = G.national.coach(st);
  if (st.mgr && st.mgr.nt === p.nat && old) return;  // the manager is its ct (M8 F2)
  if (old) old.c = -1;
  var cand = W.coaches.filter(function (co) { return !co.ret && co.c === -1 && co.nt === p.nat && co !== old; });
  var co;
  if (cand.length) co = cand[G.match.pickWeighted(cand.map(function (x) { return Math.pow(x.rep / 60, 4) * ((p.rel[x.i] || 0) >= 35 ? 3 : 1); }), rng)];
  else co = G.coaches.newCoach(W, (G.NT[p.nat] ? G.NT[p.nat].base : 70) - 4 + rng.normal() * 4, p.nat, rng);
  co.c = -2; W.ntCoach = co.i;
  if (quiet) return;
  var rel = p.rel[co.i] || 0;
  G.news(st, '🧑‍💼 ' + G.national.name(p.nat) + ': il nuovo ct è ' + co.n + (rel >= 35 ? ', che ti conosce e ti stima' : rel <= -20 ? ': tra voi non corre buon sangue' : ''));
};

// Chance of being called up and of starting, as the ct sees it
/** @param {State} st */
G.national.chances = function (st) {
  var C = G.CFG, N = C.NT, p = st.player, W = st.world, list = (G.national.pools(st).pool[p.nat] || {})[p.role] || [];
  var co = G.national.coach(st), eff = p.ovr + p.form * N.FORM_W + (co ? (p.rel[co.i] || 0) / C.REL_DIV : 0) + p.fame / N.FAME_DIV;
  var q = N.QUOTA[p.role], cut = list.length >= q ? W.players[list[q - 1]].o : 0;
  var lvl = list[C.FORMATION[p.role] - 1] !== undefined ? W.players[list[C.FORMATION[p.role] - 1]].o : 40;
  return { call: p.inj > 3 ? 0 : G.sigmoid((eff - cut) / N.CALL_K), start: G.sigmoid((eff - lvl) / C.MIN_K), cut: Math.round(cut) };
};

/** @param {State} st @param {string} [what] */
G.national.callUp = function (st, what) {
  if (st.mgr) { st.S.ntCall = { called: false, start: 0 }; return false; }
  var p = st.player, ch = G.national.chances(st), was = st.S.ntCall && st.S.ntCall.called;
  var called = G.rng.chance(ch.call);
  st.S.ntCall = { called: called, start: ch.start };
  G.captain.national(st, called);
  if (called && !p.nt.caps && !p.nt.called) { p.nt.called = 1; G.news(st, '📞 Prima convocazione con ' + G.national.name(p.nat) + '!'); }
  else if (called && what) G.news(st, '📞 Convocato per ' + what);
  else if (!called && (was || what) && p.nt.called) G.news(st, '❌ Non convocato' + (what ? ' per ' + what : ' in nazionale'));
  return called;
};

// Goals and assists of one national side; returns the main player's share when he plays
/** @param {State} st @param {Tournament} T @param {NationCode} nat @param {number} goals @param {NtPlay} mp */
G.national.scorers = function (st, T, nat, goals, mp) {
  var C = G.CFG, W = st.world, rng = G.rng, p = st.player, /** @type {(PlayerId|'me')[]} */ ids = G.national.xi(st, nat).slice(),
    /** @type {number[]} */ gw = [], /** @type {number[]} */ aw = [], /** @type {number[]} */ g = [], /** @type {number[]} */ a = [];
  var avg = G.national.str(st, nat);
  ids.forEach(function (id) {
    var pl = W.players[/** @type {PlayerId} */ (id)], q = Math.exp((pl.o - avg) / C.QUAL_DIV);
    gw.push(C.GOAL_W[pl.r] * q); aw.push(C.ASSIST_W[pl.r] * q); g.push(0); a.push(0);
  });
  var me = mp && mp.mins > 0 ? ids.length : -1;
  if (me >= 0) {
    var A = p.attrs, f = mp.mins / 90, ref = G.match.ref(p.role);
    ids.push('me'); g.push(0); a.push(0);
    var eff = G.match.mainEff(p);
    gw.push(C.GOAL_W[p.role] * Math.exp((eff[0] - avg) / C.QUAL_DIV) * f);
    aw.push(C.ASSIST_W[p.role] * Math.exp((eff[1] - avg) / C.QUAL_DIV) * f);
  }
  for (var i = 0; i < goals; i++) {
    var s = G.match.pickWeighted(gw, rng);
    if (s < 0) continue;
    g[s]++;
    if (T) { T.sc[ids[s]] = (T.sc[ids[s]] || 0) + 1; T.scN[ids[s]] = nat; }
    if (rng.chance(C.ASSIST_RATE)) { var sv = aw[s]; aw[s] = 0; var t = G.match.pickWeighted(aw, rng); aw[s] = sv; if (t >= 0) a[t]++; }
  }
  return me >= 0 ? { g: g[me], a: a[me] } : { g: 0, a: 0 };
};

// One national-team match; neutral venue unless it is a window match (a plays at home)
/** @param {State} st @param {NationCode} a @param {NationCode} b @param {NtComp} comp @param {Tournament} [T] */
G.national.match = function (st, a, b, comp, T) {
  var C = G.CFG, rng = G.rng, p = st.player, call = st.S.ntCall;
  var mine = a === p.nat ? 'a' : b === p.nat ? 'b' : null, mp = null;
  if (mine && call && call.called) {
    mp = p.inj > 0 ? { mins: 0 } : rng.chance(call.start) ? { mins: rng.chance(0.7) ? 90 : rng.int(60, 89), start: true } :
      rng.chance(C.SUB_CHANCE) ? { mins: rng.int(10, 30) } : { mins: 0 };
  }
  var sa = G.national.str(st, a), sb = G.national.str(st, b), mid = (sa + sb) / 2;
  sa = mid + (sa - mid) * C.NT.GAP; sb = mid + (sb - mid) * C.NT.GAP;
  if (mp && mp.mins) { var bump = (p.ovr - (mine === 'a' ? sa : sb)) / 11 * mp.mins / 90; if (mine === 'a') sa += bump; else sb += bump; }
  var res = G.match.sim(sa - (comp.neutral ? C.HOME_ADV : 0), sb, rng);
  var ma = G.national.scorers(st, T, a, res[0], mine === 'a' ? mp : null), mb = G.national.scorers(st, T, b, res[1], mine === 'b' ? mp : null);
  if (mp) G.national.record(st, mine === 'a', mine === 'a' ? b : a, mine === 'a' ? res : [res[1], res[0]], mp, mine === 'a' ? ma : mb, comp, T);
  return res;
};

/** @param {State} st @param {boolean} home @param {NationCode} opp @param {number[]} r @param {NtPlay} mp @param {{g: number, a: number}} ga @param {NtComp} comp @param {Tournament} [T] */
G.national.record = function (st, home, opp, r, mp, ga, comp, T) {
  var C = G.CFG, p = st.player, rng = G.rng, gk = p.role === 'POR';
  /** @type {MatchRow} */
  var row = { opp: opp, nt: 1, home: home, gf: r[0], ga: r[1], mins: mp.mins, g: 0, a: 0, r: 0, comp: comp.name };
  if (mp.mins > 0) {
    row.g = ga.g; row.a = ga.a;
    var x = C.RATING_BASE + row.g * 0.9 + row.a * 0.5 + (r[0] > r[1] ? 0.3 : r[0] < r[1] ? -0.3 : 0) + rng.normal() * 0.45 + (p.morale - 50) / 100;
    if (gk || p.role === 'DC' || p.role === 'TS') x += r[1] === 0 ? (gk ? 0.8 : 0.5) : -0.2 * r[1];
    if (mp.mins < 45) x = 6 + (x - 6) * 0.5;
    row.r = Math.round(G.clamp(x, 4, 10) * 10) / 10;
    var n = p.nt;
    if (!n.caps) { n.debut = st.S.year; G.news(st, '🎽 Esordio con ' + G.national.name(p.nat) + ' contro ' + G.national.name(opp)); }
    n.caps++; n.goals += row.g; n.assists += row.a; n.rSum += row.r; n.rN++;
    if (row.g && n.goals === row.g) G.news(st, '⚽ Primo gol in nazionale contro ' + G.national.name(opp));
    if (T) { T.my.apps++; T.my.g += row.g; T.my.a += row.a; }
    p.form = p.form * 0.8 + (row.r - 6.5) * 0.2;
    var co = G.national.coach(st);
    if (co) p.rel[co.i] = Math.round(G.clamp((p.rel[co.i] || 0) + (row.r - 6.4) * 2, -100, 100));
  }
  if (st.S.today !== undefined) row.dt = st.S.today;
  st.S.blockRows.push(row);
};

// Next tournament for the player's nation: summer year and key
/** @param {State} st */
G.national.nextTour = function (st) {
  var Y = st.S.year + 1, year = Y % 2 ? Y + 1 : Y, conf = G.NT[st.player.nat].conf;
  return { year: year, key: year % 4 === 2 ? 'WC' : G.CFG.NT.CONT[conf] };
};

// Autumn and spring windows: qualifiers, or friendlies in the spring before a tournament
/** @param {State} st @param {number} b */
G.national.window = function (st, b) {
  var p = st.player, N = G.CFG.NT, rng = G.rng, me = G.NT[p.nat];
  if (!me) return;
  var nx = G.national.nextTour(st), friendly = nx.year === st.S.year + 1 && b === 3;
  var tn = N.TOURS[nx.key].n, name = friendly ? 'Amichevole' : 'Qualificazioni ' + tn;
  G.national.callUp(st);
  if (!friendly && (!st.ntq || st.ntq.key !== nx.key || st.ntq.year !== nx.year)) st.ntq = { key: nx.key, year: nx.year, pts: 0, n: 0 };
  var pool = G.NT_IDS.filter(function (id) { return id !== p.nat && (friendly || G.NT[id].conf === me.conf); })
    .sort(function (x, y) { return Math.abs(G.NT[x].base - me.base) - Math.abs(G.NT[y].base - me.base); }).slice(0, 10);
  // with a calendar the window is called on the break's first day (a Monday): the matches on Thursday, Sunday, Tuesday
  var S = st.S, t0 = S.today;
  for (var k = 0; k < N.WINDOW; k++) {
    if (t0 !== undefined) S.today = t0 + ([3, 6, 8][k] || 8);
    var opp = rng.pick(pool), home = k % 2 === 0, res = G.national.match(st, home ? p.nat : opp, home ? opp : p.nat, { name: name });
    if (friendly) continue;
    var gf = home ? res[0] : res[1], gc = home ? res[1] : res[0];
    st.ntq.n++; st.ntq.pts += gf > gc ? 3 : gf === gc ? 1 : 0;
  }
  S.today = t0;
};

// Start of the winter block in a tournament season: who qualifies
/** @param {State} st */
G.national.qualify = function (st) {
  var N = G.CFG.NT, S = st.S, p = st.player, rng = G.rng, Y = S.year + 1;
  if (Y % 2 || S.tours) return;
  S.tours = {};
  var keys = Y % 4 === 2 ? ['WC'] : ['EURO', 'COPA', 'ASIA', 'AFCON'];
  keys.forEach(function (key) {
    var D = N.TOURS[key], /** @type {NationCode[]} */ teams = [];
    Object.keys(D.q).forEach(function (conf) {
      teams = teams.concat(G.NT_IDS.filter(function (id) { return G.NT[id].conf === conf; }).map(function (id) {
        var q = id === p.nat && st.ntq && st.ntq.key === key && st.ntq.n ? (st.ntq.pts / st.ntq.n - 1.5) * N.QUAL_FORM : 0;
        return { id: id, s: G.national.str(st, id) + rng.normal() * N.QUAL_NOISE + q };
      }).sort(function (a, b) { return b.s - a.s; }).slice(0, D.q[conf]).map(function (x) { return x.id; }));
    });
    S.tours[key] = G.tour.create(st, key, teams);
    var eligible = D.q[G.NT[p.nat].conf];
    if (eligible) G.news(st, (teams.indexOf(p.nat) >= 0 ? '✅ ' : '❌ ') + G.national.name(p.nat) + (teams.indexOf(p.nat) >= 0 ? ' è qualificata al ' : ' non si qualifica al ') + D.n + ' ' + Y);
  });
  if (st.mgr) G.mgrBoard.ntQual(st);  // the manager's nation is out: his job as ct ends (M8 F2)
};
