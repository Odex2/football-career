// @ts-check
// The academy and the players' growth (M8 phase E): youth scouts sent to any nation find boys
// of 15-17 (E1) for the youth squad, who are not players of the world until promoted (E2); a player can learn a
// nearby role (E3); the training intensity trades the young players' growth against fitness and injuries (E4).
//   m.ys [{ nat, lvl, focus }] · m.yth [{ n, nt, r, a, o, p, f }] · m.dev { id: { to, pr } } · m.train
// Scouts, boys and plans belong to the club and are lost with a new job; the training is the manager's own.

G.mgrYouth = {};
/** @type {Dict<string>} */
G.mgrYouth.FOCUS = { all: 'Tutti i ruoli', POR: 'Portieri', DEF: 'Difensori', CEN: 'Centrocampisti', ATT: 'Attaccanti' };
// "in Brasile", but not for every nation
/** @type {Dict<string>} */
G.mgrYouth.IN = { USA: 'negli Stati Uniti', UAE: 'negli Emirati Arabi', COD: 'nella RD Congo', CPV: 'a Capo Verde', CUW: 'a Curaçao', HAI: 'ad Haiti' };

/** @param {NationCode} nat @returns {string} */
G.mgrYouth.inNat = function (nat) { return G.mgrYouth.IN[nat] || 'in ' + G.nationInfo(nat).name; };
/** @param {Mgr} m @returns {{ rest: number, grow: number, inj: number }} */
G.mgrYouth.train = function (m) { return G.CFG2.MGR_YOUTH.TRAIN[m.train || 'normale'] || G.CFG2.MGR_YOUTH.TRAIN.normale; };

// A new job
/** @param {State} st */
G.mgrYouth.start = function (st) { var m = st.mgr; m.ys = []; m.yth = []; m.dev = {}; m.train = m.train || 'normale'; };

// ---------- E1 · the scouts ----------
// A new scout, at level 1 in Brazil watching every role: paid for this season now
/** @param {State} st @returns {string} why not, '' when hired */
G.mgrYouth.hire = function (st) {
  var Y = G.CFG2.MGR_YOUTH, m = st.mgr, club = st.world.clubs[m.club];
  if (m.ys.length >= Y.SCOUTS) return 'Hai già ' + Y.SCOUTS + ' osservatori.';
  if (club.bud < Y.LVL_COST[0]) return 'Non c’è budget per un osservatore.';
  club.bud = G.mgrDeal.r1(club.bud - Y.LVL_COST[0]);
  m.ys.push({ nat: 'BRA', lvl: 1, focus: 'all' });
  return '';
};

/** @param {State} st @param {number} i */
G.mgrYouth.fire = function (st, i) { st.mgr.ys.splice(i, 1); };

// Scout i watches another nation (k 'nat'), other roles ('focus') or works at another level ('lvl'): a higher
// level costs the difference for this season, a lower one gives nothing back
/** @param {State} st @param {number} i @param {string} k @param {string} v @returns {string} */
G.mgrYouth.setScout = function (st, i, k, v) {
  var Y = G.CFG2.MGR_YOUTH, m = st.mgr, s = m.ys[i], club = st.world.clubs[m.club];
  if (!s) return '';
  if (k === 'nat' && G.NT[v]) s.nat = v;
  else if (k === 'focus' && G.mgrYouth.FOCUS[v]) s.focus = /** @type {YouthScout['focus']} */ (v);
  else if (k === 'lvl' && +v >= 1 && +v <= 3) {
    var d = Y.LVL_COST[+v - 1] - Y.LVL_COST[s.lvl - 1];
    if (d > 0 && club.bud < d) return 'Non c’è budget per salire di livello: servono ' + G.mgrDeal.r1(d) + ' M€.';
    if (d > 0) club.bud = G.mgrDeal.r1(club.bud - d);
    s.lvl = /** @type {1|2|3} */ (+v);
  }
  return '';
};

// A new season: every scout is paid again, or leaves
/** @param {State} st */
G.mgrYouth.seasonStart = function (st) {
  var Y = G.CFG2.MGR_YOUTH, m = st.mgr, club = st.world.clubs[m.club];
  if (!m.ys) return;
  m.ys = m.ys.filter(function (s) {
    var c = Y.LVL_COST[s.lvl - 1];
    if (club.bud < c) { G.news(st, '🔭 Non c’è budget per l’osservatore ' + G.mgrYouth.inNat(s.nat) + ': se ne va'); return false; }
    club.bud = G.mgrDeal.r1(club.bud - c);
    return true;
  });
};

// A boy found by scout s
/** @param {YouthScout} s @param {Rng} rng @returns {YouthProspect} */
G.mgrYouth.boy = function (s, rng) {
  var Y = G.CFG2.MGR_YOUTH, base = G.NT[s.nat] && G.NT[s.nat].base ? G.NT[s.nat].base : 70;
  var roles = s.focus === 'all' ? G.ROLE_KEYS : G.ROLE_KEYS.filter(function (r) { return G.ROLES[r].macro === s.focus; });
  var a = rng.int(15, 17), o = Math.round((Y.O0 + s.lvl * Y.LVL_O + rng.normal() * 3) * 10) / 10;
  var p = Math.round(G.clamp(rng.int(Y.POT[0], Y.POT[1]) + s.lvl * Y.LVL_POT + (base - 70) / Y.NAT_POT, 60, 94));
  return { n: G.squads.name(s.nat, rng), nt: s.nat, r: rng.pick(roles), a: a, o: o, p: p, f: Y.LVL_FOG[s.lvl - 1] };
};

// The potential as shown: f either side of a fixed offset of at most f, so it always holds the true value
/** @param {YouthProspect} x @returns {[number, number]} */
G.mgrYouth.pot = function (x) {
  var off = G.mgrDeal.hash(x.n + ':' + x.nt) % (2 * x.f + 1) - x.f;
  return [Math.round(x.p + off - x.f), Math.min(99, Math.round(x.p + off + x.f))];
};

// After every block: the scouts report (a full youth squad takes nobody), the plans of a new role go on
/** @param {State} st */
G.mgrYouth.block = function (st) {
  var Y = G.CFG2.MGR_YOUTH, m = st.mgr, rng = G.rng;
  (m.ys || []).forEach(function (s) {
    if (!rng.chance(Y.FIND_P)) return;
    var x = G.mgrYouth.boy(s, rng), pot = G.mgrYouth.pot(x);
    if (m.yth.length >= Y.MAX) return;
    m.yth.push(x);
    G.news(st, '🔭 Il tuo osservatore ' + G.mgrYouth.inNat(s.nat) + ' segnala ' + x.n + ' (' + x.a + ', ' + G.ROLES[x.r].label + ', potenziale ' + pot[0] + '–' + pot[1] + ')');
  });
  G.mgrYouth.devBlock(st);
};

// ---------- E2 · the youth squad ----------
/** @param {State} st @param {number} i @returns {string} what happened */
G.mgrYouth.promote = function (st, i) {
  var m = st.mgr, W = st.world, club = W.clubs[m.club], x = m.yth[i];
  if (!x) return '';
  if (club.sq.length >= G.CFG.SQUAD_MAX) return 'La rosa è piena: fai spazio prima di promuovere ' + x.n + '.';
  var pl = G.squads.newPlayer(W, /** @type {Npc} */ ({ n: x.n, nt: x.nt, r: x.r, a: x.a, o: x.o, p: x.p, c: club.id, y: 3 }));
  pl.w = G.squads.wage(pl.o, club); club.sq.push(pl.i);
  m.yth.splice(i, 1);
  G.mgrSq.sync(st); m.sr[pl.i] = 'pro'; m.pm[pl.i] = 70;
  G.season.refresh(st);
  return '🌱 ' + x.n + ' sale in prima squadra.';
};

/** @param {State} st @param {number} i @returns {string} */
G.mgrYouth.release = function (st, i) {
  var x = st.mgr.yth[i];
  if (!x) return '';
  st.mgr.yth.splice(i, 1);
  return '👋 ' + x.n + ' lascia il vivaio.';
};

// The rule of the assistant (and of the simulation) for a boy who is OUT_AGE: promoted if worth it and there is room
/** @param {State} st @param {string} who */
G.mgrYouth.decide = function (st, who) {
  var Y = G.CFG2.MGR_YOUTH, m = st.mgr, club = st.world.clubs[m.club];
  m.yth.filter(function (x) { return x.a >= Y.OUT_AGE; }).sort(function (a, b) { return b.p - a.p; }).forEach(function (x) {
    var i = m.yth.indexOf(x), t = x.p - x.f / 2 >= 72 && club.sq.length < G.CFG.SQUAD_MAX ? G.mgrYouth.promote(st, i) : G.mgrYouth.release(st, i);
    G.news(st, t.replace(/\.$/, '') + who);
  });
};

// The end of the season: the boys are a year older and grow; at OUT_AGE the assistant decides now, or the manager
// before the first match
/** @param {State} st */
G.mgrYouth.seasonEnd = function (st) {
  var Y = G.CFG2.MGR_YOUTH, m = st.mgr, rng = G.rng, k = G.mgrYouth.train(m).grow * (m.youthX || 1);
  if (!m.yth) return;
  m.yth.forEach(function (x) { x.a++; x.o = Math.min(x.p, Math.round((x.o + rng.int(Y.GROW[0], Y.GROW[1]) * k) * 10) / 10); });
  if (!m.assist || m.assist.youth) G.mgrYouth.decide(st, ' (ha deciso il vice)');
};

// The first block begins (G.season block engine): who is still waiting is decided by the rule
/** @param {State} st */
G.mgrYouth.due = function (st) { if (G.mgr.active(st) && st.mgr.yth && st.mgr.yth.length) G.mgrYouth.decide(st, ' (ha deciso il vice)'); };

/** @param {Mgr} m @returns {number} boys who must be promoted or let go */
G.mgrYouth.waiting = function (m) { var Y = G.CFG2.MGR_YOUTH; return (m.yth || []).filter(function (x) { return x.a >= Y.OUT_AGE; }).length; };

// ---------- E3 · a new role ----------
/** @param {Npc} pl @returns {RoleKey[]} the roles he can learn */
G.mgrYouth.near = function (pl) { return G.ROLE_KEYS.filter(function (r) { return r !== pl.r && G.mgrTeam.fit(pl, r) <= 6; }); };

/** @param {State} st @param {PlayerId} id @param {string} to a role, '' to stop @returns {string} */
G.mgrYouth.setDev = function (st, id, to) {
  var m = st.mgr, pl = st.world.players[id];
  if (!pl || pl.c !== m.club) return '';
  if (!to) { delete m.dev[id]; return pl.n + ' torna ad allenarsi nel suo ruolo.'; }
  if (G.mgrYouth.near(pl).indexOf(/** @type {RoleKey} */ (to)) < 0) return '';
  m.dev[id] = { to: /** @type {RoleKey} */ (to), pr: 0 };
  return '🔄 ' + pl.n + ' inizia a imparare il ruolo di ' + G.ROLES[to].name.toLowerCase() + '.';
};

// After every block: DEV_RUN for who started DEV_SHARE of the club's matches, DEV_IDLE otherwise; at 100 the new role
/** @param {State} st */
G.mgrYouth.devBlock = function (st) {
  var Y = G.CFG2.MGR_YOUTH, m = st.mgr, W = st.world, rows = st.S.blockRows.filter(function (r) { return r.mgr; });
  Object.keys(m.dev || {}).forEach(function (k) {
    var id = +k, d = m.dev[id], pl = W.players[id];
    if (!pl || pl.c !== m.club) { delete m.dev[id]; return; }
    var s = rows.filter(function (r) { return r.xi && r.xi.indexOf(id) >= 0; }).length;
    d.pr = Math.min(100, d.pr + (rows.length && s >= rows.length * Y.DEV_SHARE ? Y.DEV_RUN : Y.DEV_IDLE));
    if (d.pr < 100) return;
    pl.r = d.to; delete m.dev[id];
    G.news(st, '🔄 ' + pl.n.split(' ').slice(-1)[0] + ' ora è un ' + G.ROLES[pl.r].name.toLowerCase());
  });
};

// Saves from before phase E
/** @param {State} st */
G.mgrYouth.migrate = function (st) {
  var m = st.mgr;
  if (!m.ys) m.ys = []; if (!m.yth) m.yth = []; if (!m.dev) m.dev = {}; if (!m.train) m.train = 'normale';
};
