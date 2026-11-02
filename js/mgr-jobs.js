// @ts-check
// The coaches' market (M9 S2 M10): every club's interest in the manager, benches that stay
// open for a few days after a sacking or a retirement, applications decided by a probability shown first, offers at
// the end and in the middle of the season, the club that lets you go or not, the manager's contract, resignations and
// the time without a job ("⏩ Aspetta offerte"). Its random choices use their own numbers (G.mgrJobs.rng).

G.mgrJobs = {};

// A day of the career as one number: year * 1000 + day of the season calendar (-1 before the first day)
/** @param {State} st @returns {number} */
G.mgrJobs.now = function (st) { var S = st.S; return S ? S.year * 1000 + (S.today === undefined ? -1 : S.today) : (st.year + 1) * 1000 - 1; };
/** @param {State} st @param {string} k @returns {Rng} numbers of their own, the same for the same career, day and key */
G.mgrJobs.rng = function (st, k) { return G.makeRng(G.mgrDeal.hash('jobs:' + st.seed + ':' + G.mgrJobs.now(st) + ':' + k)); };

// ---------- M10.3 · the interest of a club, 0..100, with no random numbers ----------
/** @param {State} st @param {Club} club @returns {number} */
G.mgrJobs.interest = function (st, club) {
  var J = G.CFG2.MGR_JOBS, p = st.player, m = st.mgr, h = m ? m.hist.slice(-J.HIST) : [];
  var i = J.BASE + (G.mgr.rep(st) - club.rep) * J.REP;
  h.forEach(function (r) { i += (r.note === 'Obiettivo raggiunto' ? J.GOAL : 0) + (r.pos && r.tgt && r.pos < r.tgt ? J.ABOVE : 0) + Math.min(2, r.won.length) * J.TROPHY; });
  i += Math.min(J.FANS_MAX, (p.fans[club.id] || 0) * J.FANS) + (p.bandiera[club.id] ? J.FLAG : 0) - (p.traitor[club.id] ? J.TRAITOR : 0) + (club.nat === p.nat ? J.NAT : 0);
  i += G.mgrId.fit(st, club) * J.IDT;  // the club's identity (M9 S3)
  return Math.round(G.clamp(i, 0, 100));
};
// The best free NPC coach for a club, scored on the same scale as the manager's interest
/** @param {State} st @param {Club} club @returns {number} */
G.mgrJobs.rival = function (st, club) {
  var J = G.CFG2.MGR_JOBS, best = 0;
  st.world.coaches.forEach(function (co) { if (co.c === -1 && !co.ret && !co.me) best = Math.max(best, J.BASE + (co.rep - club.rep) * J.REP); });
  return Math.round(G.clamp(best, 0, 100));
};
// The chance that the club picks the manager over the other candidates
/** @param {State} st @param {Club} club @returns {number} */
G.mgrJobs.chance = function (st, club) {
  var J = G.CFG2.MGR_JOBS;
  return Math.round(G.clamp(0.5 + (G.mgrJobs.interest(st, club) - G.mgrJobs.rival(st, club)) / J.CHANCE_DIV, J.CHANCE[0], J.CHANCE[1]) * 100) / 100;
};

// ---------- offers ----------
// What an offer says: wage, years, budget, patience; mid-season, whether the current club lets the manager go
/** @param {State} st @param {ClubId} id @param {number} [until] @returns {MgrOffer} */
G.mgrJobs.offer = function (st, id, until) {
  var p = st.player, club = st.world.clubs[id], f = p.fans[id] || 0, /** @type {MgrOffer} */ o = { club: id, fans: Math.round(f), perks: G.mgr.perks(f), bandiera: p.bandiera[id] ? 1 : 0 };
  o.int = G.mgrJobs.interest(st, club);
  if (until !== undefined) o.until = until;
  if (until !== undefined && G.mgr.active(st)) {
    var J = G.CFG2.MGR_JOBS, r = G.mgrJobs.rng(st, 'rel:' + id).next(), m = G.mgr.job(st);
    o.rel = r < J.RELEASE[0] ? 'free' : r < J.RELEASE[0] + J.RELEASE[1] ? 'fee' : 'no';
    if (o.rel === 'fee') o.fee = Math.round(m.contract ? m.contract.wage * J.WEEKS * Math.max(1, m.contract.years) / 1000 * 10 : 1) / 10;
  }
  return o;
};
// A new offer joins the list (an end-of-season list is replaced)
/** @param {State} st @param {string} why @param {MgrOffer} o */
G.mgrJobs.add = function (st, why, o) {
  var mo = st.mgrOffers;
  if (mo && (mo.why === 'mid' || mo.why === 'vacancy') && (why === 'mid' || why === 'vacancy')) { mo.list = mo.list.filter(function (x) { return x.club !== o.club; }).concat([o]).slice(-3); return; }
  st.mgrOffers = { why: why, list: [o] };
};

// End of the season (M10.4): the clubs whose interest reaches CALL and that are bigger, or as big with more money
/** @param {State} st @param {Club} club */
G.mgrJobs.calls = function (st, club) {
  var J = G.CFG2.MGR_JOBS, W = st.world;
  var list = W.clubs.filter(function (c) { return c.id !== club.id && (c.rep > club.rep || (c.rep >= club.rep - J.CALL_REP && c.rev > club.rev)); })
    .map(function (c) { return { c: c, i: G.mgrJobs.interest(st, c) }; }).filter(function (x) { return x.i >= J.CALL; })
    .sort(function (a, b) { return b.i - a.i || b.c.rep - a.c.rep; }).slice(0, G.CFG.MGR.OFFERS);
  if (list.length) st.mgrOffers = { why: 'calls', list: list.map(function (x) { return G.mgrJobs.offer(st, x.c.id); }) };
};

// ---------- M10.2 · vacant benches ----------
// A club loses its coach: it picks the next one at once, as before (the same random numbers, so the world does not
// change), but with a manager career the bench stays open VAC_DAYS, or until the summer block at the end of the
// season: if the manager gets it, the coach picked steps aside. The manager may be first on its list: an offer at once
/** @param {State} st @param {Club} club @param {Coach} next the coach the club picked */
G.mgrJobs.vacate = function (st, club, next) {
  var J = G.CFG2.MGR_JOBS, S = st.S, now = G.mgrJobs.now(st), end = !S || S.block >= 4 && !S.cur;
  var until = end ? ((S ? S.year : st.year) + 1) * 1000 : now + J.VAC_DAYS;
  (st.vac || (st.vac = [])).push({ club: club.id, from: now, until: until, co: next.i });
  if (club.rep >= J.NEWS_REP) G.news(st, '🪑 Il ' + club.name + ' tratta con ' + next.n + ', ma la panchina è ancora aperta: puoi candidarti (🧭 Panchine)');
  var m = st.mgr, I = G.mgrJobs.interest(st, club);
  if (m && !m.done && m.club !== club.id && I >= J.CALL && I > G.mgrJobs.rival(st, club)) {
    G.mgrJobs.add(st, 'mid', G.mgrJobs.offer(st, club.id, now + J.MID_DAYS));
    G.news(st, '📨 Il ' + club.name + ' ti vuole subito in panchina: rispondi entro ' + J.MID_DAYS + ' giorni');
  }
};

/** @param {State} st @param {ClubId} id @returns {Vacancy|undefined} */
G.mgrJobs.vacancy = function (st, id) { return (st.vac || []).filter(function (v) { return v.club === id; })[0]; };

// The manager applies: the chance is fixed now, the club answers when the bench closes; the answers of the interview
// (M9 S3, G.mgrId.answers) move it
/** @param {State} st @param {ClubId} id @param {Dict<string>} [ans] @returns {string} */
G.mgrJobs.apply = function (st, id, ans) {
  var J = G.CFG2.MGR_JOBS, v = G.mgrJobs.vacancy(st, id), club = st.world.clubs[id], p0 = G.mgrJobs.chance(st, club);
  if (!v || v.app !== undefined) return '';
  if (ans && ans.play) v.play = ans.play;  // the levers at the signing (M9 S6)
  if (ans && ans.mkt) v.pact = ans.mkt === 'star' ? 'amb' : ans.mkt === 'yth' ? 'reb' : 'norm';  // the pact the club offers (M9 S4)
  v.app = ans ? Math.round(G.clamp(p0 + G.mgrId.answers(st.world, club, ans), J.CHANCE[0], J.CHANCE[1]) * 100) / 100 : p0;
  var d = Math.round((v.app - p0) * 100);
  return '✉️ Candidatura inviata al ' + club.name + ': ' + Math.round(v.app * 100) + '% di essere scelto' + (ans ? ' (colloquio ' + (d >= 0 ? '+' : '') + d + '%)' : '') + '.';
};

// A bench closes: the manager if he applied and the club picks him (an offer for MID_DAYS), else the coach it picked
/** @param {State} st @param {Vacancy} v */
G.mgrJobs.close = function (st, v) {
  var J = G.CFG2.MGR_JOBS, W = st.world, club = W.clubs[v.club], m = st.mgr;
  st.vac = (st.vac || []).filter(function (x) { return x !== v; });
  if (v.held) return;
  if (v.app !== undefined && m && !m.done && G.mgrJobs.rng(st, 'pick:' + v.club).chance(v.app)) {
    var vo = G.mgrJobs.offer(st, club.id, G.mgrJobs.now(st) + J.MID_DAYS);
    if (v.pact) vo.pact = v.pact;
    if (v.play) vo.play = v.play;
    G.mgrJobs.add(st, 'vacancy', vo);
    G.news(st, '✅ Il ' + club.name + ' ha scelto te: rispondi entro ' + J.MID_DAYS + ' giorni (📨 Offerte)');
    (st.vac = st.vac || []).push({ club: club.id, from: v.from, until: G.mgrJobs.now(st) + J.MID_DAYS, co: v.co, held: 1 });
    return;
  }
  var co = G.coaches.of(W, club) || W.coaches[v.co];
  if (v.app !== undefined && m && !m.done) {
    G.news(st, '❌ Il ' + club.name + ' sceglie ' + co.n + ' e non te');
    if (G.mgr.active(st)) { var mj = G.mgr.job(st); mj.conf = Math.max(-10, mj.conf - J.APPLY_CONF); G.news(st, '👀 Il ' + W.clubs[mj.club].name + ' ha saputo della tua candidatura: fiducia −' + J.APPLY_CONF); }
  }
};

// Every day played: benches and offers that expire; without a job, the reputation slowly falls
/** @param {State} st */
G.mgrJobs.tick = function (st) {
  var J = G.CFG2.MGR_JOBS, m = st.mgr, now = G.mgrJobs.now(st), mo = st.mgrOffers;
  if (!m || m.done) return;
  if (mo && (mo.why === 'mid' || mo.why === 'vacancy')) {
    mo.list = mo.list.filter(function (o) { return o.until === undefined || o.until >= now; });
    if (!mo.list.length) st.mgrOffers = G.mgr.active(st) ? null : { why: 'free', list: G.mgr.offers(st, 2) };
  }
  (st.vac || []).slice().forEach(function (v) { if (v.until <= now && !(v.held && st.mgrOffers && st.mgrOffers.list.some(function (o) { return o.club === v.club; }))) G.mgrJobs.close(st, v); });
  if (!G.mgr.active(st)) {
    var last = m.idleAt === undefined ? now : m.idleAt, d = Math.floor(last / 1000) === Math.floor(now / 1000) ? now - last : J.NEW_YEAR_DAYS;
    m.idleAt = now; m.idle = (m.idle || 0) + Math.max(0, d);
    if (m.idle >= J.IDLE_DAYS) { m.idle -= J.IDLE_DAYS; m.rep = Math.max(40, m.rep - 1); G.news(st, '📉 Senza squadra da tre mesi: reputazione ' + m.rep); }
  }
};

// ---------- M10.4 · taking a job, resigning ----------
// Accept offer i: the current club lets the manager go (free, or the new club pays the fee) or he resigns first;
// going to a rival of the club he leaves makes him a traitor for its fans (as for the player)
/** @param {State} st @param {number} i @param {boolean} [force] resign when the club does not let him go @returns {string} */
G.mgrJobs.take = function (st, i, force) {
  var mo = st.mgrOffers, o = mo && mo.list[i], W = st.world, p = st.player;
  if (!o) return '';
  if (o.rel === 'no' && G.mgr.active(st) && !force) return 'Il tuo club non ti libera: per andare devi dimetterti.';
  var to = W.clubs[o.club], from = G.mgr.active(st) ? W.clubs[G.mgr.job(st).club] : null;
  if (o.rel === 'no' && from) G.mgrJobs.resign(st, true);
  else if (o.rel === 'fee' && from) { to.bud = Math.round((to.bud - (o.fee || 0)) * 10) / 10; G.news(st, '💶 Il ' + to.name + ' paga ' + o.fee + ' M€ al ' + from.name + ' per liberarti'); }
  if (from && to.riv.indexOf(from.id) >= 0) { p.traitor[from.id] = 1; p.fans[from.id] = 0; G.news(st, '🐍 Per i tifosi del ' + from.name + ' sei un traditore'); }
  st.vac = (st.vac || []).filter(function (v) { return v.club !== to.id; });
  G.mgr.start(st, o);
  return '';
};

// Resign (from the Panchina): −RESIGN_REP of reputation, −RESIGN_REP_OK when the season was going well, the fans
// are hurt; no money from the contract. take: resigning to take another job (no offers made then)
/** @param {State} st @param {boolean} [take] */
G.mgrJobs.resign = function (st, take) {
  var J = G.CFG2.MGR_JOBS, m = G.mgr.job(st), club = st.world.clubs[m.club], ok = !!(m.obj && m.pos && m.pos <= m.obj.tgt);
  if (!G.mgr.active(st)) return;
  G.mgr.record(st, 'Dimissioni');
  m.rep = Math.max(40, m.rep - (ok ? J.RESIGN_REP_OK : J.RESIGN_REP)); m.lastClub = club.id; delete m.contract; delete m.renew;
  G.life.fans(st, club.id, -J.RESIGN_FANS);
  G.news(st, '🚪 Ti dimetti dal ' + club.name);
  G.mgr.leave(st);
  if (!take) { m.idle = 0; delete m.idleAt; G.mgr.offerSet(st, 'free', 2); }
};

// ---------- M10.5 · the contract ----------
/** @param {State} st @param {Club} club @returns {MgrContract} */
G.mgrJobs.contract = function (st, club) {
  var J = G.CFG2.MGR_JOBS, m = G.mgr.job(st);
  return { years: club.rep >= J.LONG_REP ? J.YEARS + 1 : J.YEARS, wage: Math.round(G.squads.wage(m.rep + 8, club) * 0.7) };
};
// The end of the season: a year less; a good season brings a renewal offer; at the end of the contract an answer
// nobody gave is the vice's yes, and with no renewal the board keeps him a year if it trusts him (CONF_KEEP)
/** @param {State} st @param {boolean} good the objective was reached @returns {boolean} the contract is over */
G.mgrJobs.seasonEnd = function (st, good) {
  var J = G.CFG2.MGR_JOBS, m = G.mgr.job(st), c = m.contract;
  if (!c) return false;
  c.years--;
  if (c.years <= 0) {
    if (m.renew && !c.free) { G.mgrJobs.renewAnswer(st, 'yes'); G.news(st, '✍️ Il vice firma il rinnovo per te'); return false; }
    if (!c.free && m.conf >= J.CONF_KEEP) { c.years = 1; G.news(st, '✍️ La società ti rinnova per un anno'); return false; }
    return true;
  }
  if (c.years <= 1 && good && !m.renew && !c.free) {
    m.renew = { years: J.YEARS, wage: Math.round(c.wage * (1 + J.RENEW_UP)) };
    G.news(st, '✍️ La società ti offre il rinnovo: ' + m.renew.years + ' anni a ' + m.renew.wage + ' k€/sett. (📋 Panchina)');
  }
  return false;
};
// The answer to the renewal: 'yes', 'more' (ASK_P to get ASK_UP more, else the offer is withdrawn) or 'no' (free at the end)
/** @param {State} st @param {string} a @returns {string} */
G.mgrJobs.renewAnswer = function (st, a) {
  var J = G.CFG2.MGR_JOBS, m = G.mgr.job(st), r = m.renew, c = m.contract;
  if (!r || !c) return '';
  delete m.renew;
  if (a === 'no') { c.free = 1; return 'Lasci correre: a fine contratto sarai libero.'; }
  if (a === 'more') {
    if (!G.mgrJobs.rng(st, 'ask').chance(J.ASK_P)) return '❌ La società ritira l’offerta di rinnovo.';
    r.wage = Math.round(r.wage * (1 + J.ASK_UP));
  }
  c.years += r.years; c.wage = r.wage;
  return '✍️ Rinnovo firmato: ' + c.years + ' anni a ' + c.wage + ' k€/sett.';
};
// Sacked: half of the money left on the contract goes to the manager
/** @param {State} st */
G.mgrJobs.payout = function (st) {
  var J = G.CFG2.MGR_JOBS, m = G.mgr.job(st), c = m.contract;
  if (!c) return;
  var k = Math.round(c.wage * J.WEEKS * Math.max(0, c.years) * J.PAYOUT);
  if (k > 0) { st.player.money += k; G.news(st, '💶 Ti spettano ' + G.ui.money(k) + ' di buonuscita'); }
  delete m.contract; delete m.renew;
};

// ---------- M10.7 and M10.8 · without a job ----------
// ⏩ Aspetta offerte: the season goes on a week (WAIT_DAYS of calendar), or until an offer arrives
/** @param {State} st */
G.mgrJobs.wait = function (st) {
  var J = G.CFG2.MGR_JOBS, start = G.mgrJobs.now(st), n = st.mgrOffers ? st.mgrOffers.list.length : 0, why = st.mgrOffers ? st.mgrOffers.why : '';
  for (var i = 0; i < J.WAIT_STEPS && !st.over && !G.mgr.active(st); i++) {
    G.game.next(st, true, 'day');
    var mo = st.mgrOffers;
    if (G.mgrJobs.now(st) - start >= J.WAIT_DAYS || (mo && (mo.why !== why || mo.list.length > n))) break;
  }
};
// The automatic simulation without a job: a month of waiting, then the best offer
/** @param {State} st */
G.mgrJobs.auto = function (st) {
  var J = G.CFG2.MGR_JOBS, m = G.mgr.job(st);
  for (var k = 0; k < J.AUTO_WAITS && !G.mgr.active(st) && !st.over && (m.idle || 0) < J.AUTO_DAYS; k++) G.mgrJobs.wait(st);
  if (G.mgr.active(st) || st.over) return;
  if (!st.mgrOffers || !st.mgrOffers.list.length) G.mgr.offerSet(st, 'free', 4);
  var list = G.sure(st.mgrOffers).list, best = 0;
  list.forEach(function (o, i) { if ((o.int || 0) > (list[best].int || 0)) best = i; });
  if (list.length) G.mgrJobs.take(st, best);
};
