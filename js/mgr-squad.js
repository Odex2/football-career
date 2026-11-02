// @ts-check
// The manager's squad, FIFA style (M8 phase B): every player of the managed club has a squad
// role (the playing time he expects), his own morale, a form (his last ratings against what was expected) and
// injuries; the club has a captain. Leaving a player out costs, playing him pays. The maps are by player id, hold
// only players of the club and are emptied when the manager changes club:
//   m.sr role · m.pm morale 0..100 (PM0 when missing) · m.fm the last 5 rating gaps · m.inj matches out · m.cap
//   m.bs starts in the block, m.bp club matches in the block · m.req open requests · m.promise promises made

G.mgrSq = {};
/** @type {Dict<string>} */
G.mgrSq.LABEL = { cru: 'Fondamentale', imp: 'Importante', rot: 'Rotazione', ris: 'Riserva', pro: 'Promessa' };
/** @type {SquadRole[]} from the most playing time to the least */
G.mgrSq.ORDER = ['cru', 'imp', 'rot', 'pro', 'ris'];
// One level up, for a promise of more minutes (B3)
/** @type {Dict<SquadRole>} */
G.mgrSq.UP = { ris: 'rot', pro: 'rot', rot: 'imp', imp: 'cru', cru: 'cru' };

/** @param {MgrJob} m @param {PlayerId} id @returns {number} */
G.mgrSq.pm = function (m, id) { var v = m.pm && m.pm[id]; return v === undefined ? G.CFG2.MGR_SQ.PM0 : v; };
/** @param {MgrJob} m @param {PlayerId} id @param {number} d */
G.mgrSq.addPm = function (m, id, d) { m.pm[id] = G.clamp(Math.round(G.mgrSq.pm(m, id) + d), 0, 100); };
/** @param {MgrJob} m @param {PlayerId} id @returns {number} the average gap of the last ratings (0 without any) */
G.mgrSq.form = function (m, id) {
  var f = m.fm && m.fm[id];
  return f && f.length ? f.reduce(function (s, x) { return s + x; }, 0) / f.length : 0;
};
/** @param {MgrJob} m @param {PlayerId} id @returns {number} matches still out */
G.mgrSq.inj = function (m, id) { return (m.inj && m.inj[id]) || 0; };
// What morale and form add to a player's overall today (B2, B4)
/** @param {MgrJob} m @param {PlayerId} id @returns {number} */
G.mgrSq.eff = function (m, id) {
  var Q = G.CFG2.MGR_SQ;
  return (G.mgrSq.pm(m, id) - Q.PM_MID) / Q.PM_DIV + G.clamp(G.mgrSq.form(m, id) * Q.FORM_K, -Q.FORM_MAX, Q.FORM_MAX);
};
// The training's effect on injuries (phase E)
/** @param {MgrJob} m @returns {number} */
G.mgrSq.injX = function (m) { return G.mgrYouth.train(m).inj; };

/** @param {number} pm @returns {string} */
G.mgrSq.face = function (pm) { return pm >= 75 ? '😀' : pm >= 55 ? '🙂' : pm >= 35 ? '😐' : '😠'; };
/** @param {number} f @returns {string} */
G.mgrSq.formSym = function (f) { return f >= 0.6 ? '🔥' : f >= 0.25 ? '▲' : f <= -0.6 ? '🧊' : f <= -0.25 ? '▼' : '–'; };

// ---------- roles and captain ----------
// B1: the XI of the formation as if everyone were fresh; its 3 best are 'cru', the other 8 'imp'; the best reserve of
// every outfield role of the formation is 'rot'; young reserves are 'pro', the others 'ris'
/** @param {State} st @returns {Dict<SquadRole>} */
G.mgrSq.roles = function (st) {
  var m = G.mgr.job(st), W = st.world, club = W.clubs[m.club], s = G.mgrTeam.FORMS[m.form].s, /** @type {Dict<SquadRole>} */ out = {};
  G.mgrTeam.auto(st, null, true).map(function (x) { return W.players[x.id]; }).sort(function (a, b) { return b.o - a.o; })
    .forEach(function (pl, i) { out[pl.i] = i < 3 ? 'cru' : 'imp'; });
  G.ROLE_KEYS.forEach(function (r) {
    if (r === 'POR' || !s[r]) return;
    var best = G.squads.roleList(W, club, r).filter(function (id) { return !out[id]; })[0];
    if (best !== undefined) out[best] = 'rot';
  });
  club.sq.forEach(function (id) { if (!out[id]) out[id] = W.players[id].a <= 21 ? 'pro' : 'ris'; });
  return out;
};

// B6: the oldest of the 'cru' and 'imp' (the best of them at the same age)
/** @param {State} st @returns {PlayerId|null} */
G.mgrSq.pickCap = function (st) {
  var m = G.mgr.job(st), W = st.world, sq = W.clubs[m.club].sq;
  var top = sq.filter(function (id) { return m.sr[id] === 'cru' || m.sr[id] === 'imp'; });
  var best = (top.length ? top : sq).slice().sort(function (a, b) { return W.players[b].a - W.players[a].a || W.players[b].o - W.players[a].o; })[0];
  return best === undefined ? null : best;
};

// A new club: everything starts again
/** @param {State} st */
G.mgrSq.start = function (st) {
  var m = G.mgr.job(st);
  G.mgrTeam.init(m);
  m.sr = G.mgrSq.roles(st); m.pm = {}; m.fm = {}; m.inj = {}; m.bs = {}; m.bp = 0; m.req = []; m.promise = {}; m.list = {};
  m.cap = G.mgrSq.pickCap(st);
};

// Keeps the maps in line with the squad: who left is forgotten, who arrived gets his role and starts at 70
// (a signing or a boy from the academy); a captain who left is replaced
/** @param {State} st */
G.mgrSq.sync = function (st) {
  var m = G.mgr.job(st), W = st.world, club = W.clubs[m.club], /** @type {Dict<number>} */ in_ = {}, roles = /** @type {Dict<SquadRole>|null} */ (null);
  if (!m.sr) { G.mgrSq.start(st); return; }
  club.sq.forEach(function (id) {
    in_[id] = 1;
    if (m.sr[id]) return;
    roles = roles || G.mgrSq.roles(st);
    m.sr[id] = roles[id]; m.pm[id] = 70;
  });
  [m.sr, m.pm, m.fm, m.inj, m.bs, m.promise, m.list].forEach(function (map) { Object.keys(map).forEach(function (k) { if (!in_[k]) delete map[+k]; }); });
  m.req = m.req.filter(function (r) { return in_[r.id]; });
  if (m.cap === null || m.cap === undefined || !in_[m.cap]) m.cap = G.mgrSq.pickCap(st);
};

// From the Rosa tab: a lower role costs PM -10, a higher one gives +5
/** @param {State} st @param {PlayerId} id @param {string} r */
G.mgrSq.setRole = function (st, id, r) {
  var Q = G.CFG2.MGR_SQ, m = G.mgr.job(st), old = m.sr[id], to = /** @type {SquadRole} */ (r);
  if (!old || old === to || Q.SHARE[to] === undefined) return;
  G.mgrSq.addPm(m, id, Q.SHARE[to] < Q.SHARE[old] ? -10 : 5);
  m.sr[id] = to;
};

/** @param {State} st @param {PlayerId} id @returns {string} */
G.mgrSq.setCap = function (st, id) {
  var Q = G.CFG2.MGR_SQ, m = G.mgr.job(st), pl = st.world.players[id];
  if (!m.sr[id] || m.cap === id) return '';
  if (m.cap !== null && m.cap !== undefined && m.sr[m.cap]) G.mgrSq.addPm(m, m.cap, -Q.CAP_SWAP);
  G.mgrSq.addPm(m, id, Q.CAP_SWAP);
  m.cap = id;
  return '© ' + pl.n + ' è il nuovo capitano.';
};

// ---------- matches ----------
// After a match (called by G.mgrTeam.after, before fitness changes): starts in the block, the injured, the form
/** @param {State} st @param {MatchSide} side */
G.mgrSq.after = function (st, side) {
  var Q = G.CFG2.MGR_SQ, m = G.mgr.job(st), W = st.world, rng = G.rng;
  G.mgrSq.sync(st);
  // an injured player does not lose morale for the matches he misses; he is one match closer to coming back
  Object.keys(m.inj).forEach(function (k) {
    var id = +k;
    m.bs[id] = (m.bs[id] || 0) + Q.SHARE[m.sr[id]];
    if (--m.inj[id] <= 0) delete m.inj[id];
  });
  side.ids.forEach(function (id, k) {
    m.bs[id] = (m.bs[id] || 0) + 1;
    if (side.rx) m.fm[id] = (m.fm[id] || []).concat(Math.round(side.rx[k] * 10) / 10).slice(-5);
    if (!rng.chance((Q.INJ_BASE + Math.max(0, 75 - G.mgrTeam.cond(m, id)) * Q.INJ_COND) * G.mgrSq.injX(m))) return;
    var long = rng.chance(Q.INJ_LONG_P), R = long ? Q.INJ_LONG : Q.INJ_SHORT, n = rng.int(R[0], R[1]), pl = W.players[id];
    m.inj[id] = n;
    G.news(st, (long ? '🚑 Brutto infortunio per ' + pl.n + ': fuori ' : '🚑 ' + pl.n + ' si fa male: fuori ') + n + (n === 1 ? ' partita' : ' partite'));
  });
  m.bp = (m.bp || 0) + 1;
};

// ---------- blocks ----------
// B2-B3, at the end of every block before the tactic's cost: each player's morale from his share of starts and the
// results, the squad's morale from the 16 who play most and from the captain, promises kept or broken, the requests
/** @param {State} st @param {number} b @param {number} diff wins minus losses in the block */
G.mgrSq.block = function (st, b, diff) {
  var Q = G.CFG2.MGR_SQ, m = G.mgr.job(st), W = st.world, club = W.clubs[m.club], S = G.sure(st.S), capD = 0;
  G.mgrSq.sync(st);
  if (m.bp) {
    /** @type {Dict<number>} */ var share = {};
    club.sq.forEach(function (id) {
      var pm = G.mgrSq.pm(m, id);
      share[id] = (m.bs[id] || 0) / m.bp;
      G.mgrSq.addPm(m, id, G.clamp((share[id] - Q.SHARE[m.sr[id]]) * Q.PM_K, Q.PM_MAX[0], Q.PM_MAX[1]) + diff * Q.PM_RES + (Q.PM0 - pm) * Q.PM_REV);
      if (id === m.cap) capD = m.pm[id] - pm;
    });
    var top = club.sq.slice().sort(function (a, b) { return (m.starts[b] || 0) - (m.starts[a] || 0) || W.players[b].o - W.players[a].o; }).slice(0, 16);
    var avg = top.reduce(function (s, id) { return s + G.mgrSq.pm(m, id); }, 0) / top.length;
    m.morale = Math.round(G.clamp(m.morale + G.clamp((avg - Q.PM_MID) * Q.PM_TEAM, -2, 2) + capD * Q.CAP, 0, 100));
    // a promise is checked at the end of the block after it was made
    Object.keys(m.promise).forEach(function (k) {
      var id = +k, P = m.promise[id];
      if (P.y === S.year && b < P.b) return;
      delete m.promise[id];
      if (P.y !== S.year || share[id] >= Q.SHARE[P.to] - 0.1) return;
      G.mgrSq.addPm(m, id, Q.PROMISE_FAIL); m.morale = Math.max(0, m.morale - 2);
      G.news(st, '💢 ' + W.players[id].n + ': «Mi avevi promesso più spazio». Ora vuole andare via');
      m.req = m.req.filter(function (r) { return r.id !== id; }).concat([{ id: id, k: 'via', b: b }]);
    });
    // a request left unanswered for a whole block gets the assistant's answer
    m.req.filter(function (r) { return r.b < b; }).forEach(function (r) { var t = G.mgrSq.answer(st, r.id, G.mgrSq.autoAnswer(m, r)); if (t) G.news(st, t + ' (ha risposto il vice)'); });
    // at most one new request a block: the unhappiest of those not already asking, promised or on the market
    var who = club.sq.filter(function (id) {
      return G.mgrSq.pm(m, id) < Q.REQ_AT && !m.promise[id] && !m.list[id] && !m.req.some(function (r) { return r.id === id; });
    }).sort(function (a, b) { return G.mgrSq.pm(m, a) - G.mgrSq.pm(m, b) || a - b; })[0];
    if (who !== undefined) {
      var /** @type {'spazio'|'via'} */ k = share[who] < Q.SHARE[m.sr[who]] ? 'spazio' : 'via';
      m.req.push({ id: who, k: k, b: b });
      G.news(st, '😠 ' + W.players[who].n + (k === 'spazio' ? ' chiede più spazio' : ' vuole andare via'));
    }
  }
  m.bs = {}; m.bp = 0;
};

// End of season: injuries heal, requests and promises expire
/** @param {MgrJob} m */
G.mgrSq.seasonEnd = function (m) { if (!m.sr) return; m.inj = {}; m.req = []; m.promise = {}; m.bs = {}; m.bp = 0; };

// ---------- requests (B3) ----------
/** @param {MgrJob} m @returns {number} the chance that explaining your choices works */
G.mgrSq.talkP = function (m) { return G.clamp(G.CFG2.MGR_SQ.TALK + (m.rep - 50) / 100, 0.05, 0.95); };

// The assistant's answer: explain for more space; let him go unless he is a key player
/** @param {MgrJob} m @param {PlayerRequest} r @returns {string} */
G.mgrSq.autoAnswer = function (m, r) { return r.k === 'spazio' ? 'talk' : m.sr[r.id] === 'cru' ? 'stay' : 'ok'; };

// The answer to the request of player id: 'promise', 'talk' or 'list' (more space), 'ok' or 'stay' (a move).
// Returns what happened, for the screen
/** @param {State} st @param {PlayerId} id @param {string} opt @returns {string} */
G.mgrSq.answer = function (st, id, opt) {
  var Q = G.CFG2.MGR_SQ, m = G.mgr.job(st), S = G.sure(st.S), r = m.req.filter(function (x) { return x.id === id; })[0], n = st.world.players[id].n, out = '';
  if (!r) return '';
  if (r.k === 'spazio' && opt === 'promise') {
    var to = G.mgrSq.UP[m.sr[id]];
    m.sr[id] = to; G.mgrSq.addPm(m, id, 10);
    m.promise[id] = { to: to, y: S.year, b: S.cur ? S.cur.b + 1 : S.block };
    out = '🤝 Hai promesso più minuti a ' + n + ': ora è ' + G.mgrSq.LABEL[to].toLowerCase() + '. Se non gioca abbastanza nel prossimo blocco, vorrà andare via.';
  } else if (r.k === 'spazio' && opt === 'talk') {
    var ok = G.rng.chance(G.mgrSq.talkP(m));
    G.mgrSq.addPm(m, id, ok ? 8 : -5);
    out = ok ? '💬 ' + n + ' ha capito le tue scelte.' : '💬 ' + n + ' non è convinto: il morale scende.';
  } else if (opt === 'list' || (r.k === 'via' && opt === 'ok')) {
    m.list[id] = 1; G.mgrSq.addPm(m, id, opt === 'ok' ? 5 : -5);
    out = '📋 ' + n + ' è sul mercato.';
  } else if (r.k === 'via' && opt === 'stay') {
    G.mgrSq.addPm(m, id, -10); m.morale = Math.max(0, m.morale - 1);
    out = '✋ ' + n + ' resta, ma non è contento.';
  } else return '';
  m.req = m.req.filter(function (x) { return x !== r; });
  return out;
};
