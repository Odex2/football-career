// @ts-check
// The board (M8 phase F): goals in five categories, each with its weight, judged at the end of
// the season instead of the league alone (F1); a national team that wants the manager as its ct as well (F2).
//   m.goals [{ k, txt, imp, st, ... }] (m.obj stays for the league) · m.nt the nation he also coaches (null: none)
//   · m.ntOffer a national team's offer, open until the first match of the season

G.mgrBoard = {};
/** @type {Dict<number>} */
G.mgrBoard.W = { alta: 3, media: 2, bassa: 1 };
/** @type {Dict<string>} */
G.mgrBoard.ICON = { ok: '✅', mid: '🟡', ko: '❌' };
/** @type {Dict<string>} the cup's round of `to` clubs */
G.mgrBoard.REACH = { 2: 'arrivare in finale', 4: 'arrivare in semifinale', 8: 'arrivare ai quarti', 16: 'arrivare agli ottavi' };
/** @type {Dict<string>} the European goal for each stage to reach (index of EU) */
G.mgrBoard.EU_TXT = { 1: 'superare la fase campionato (tra le prime 24)', 2: 'arrivare agli ottavi', 3: 'arrivare ai quarti', 4: 'arrivare in semifinale', 5: 'arrivare in finale' };
// The European stages in order: a club "reaches" one when it plays in it
G.mgrBoard.EU = ['lp', 'po', 'r16', 'qf', 'sf', 'f'];

// ---------- F1 · the goals ----------
// A new season, or a new job during one: the goals the board sets now (club.rep decides how high)
/** @param {State} st */
G.mgrBoard.goals = function (st) {
  var m = G.mgr.job(st), W = st.world, S = G.sure(st.S), club = W.clubs[m.club], rep = club.rep, /** @type {BoardGoal[]} */ g = [];
  g.push({ k: 'lg', txt: m.obj.txt, imp: 'alta', st: 'mid' });
  var cup = S.cups[club.nat], L = G.mgrPact.lv(m), hi = !!L.top;  // the pact moves cup and Europe a round (M9 S4)
  if (cup && cup.winner === null && cup.alive.indexOf(club.id) >= 0) {
    var to = G.clamp((rep >= 80 ? 2 : rep >= 70 ? 4 : cup.R >= 6 ? 16 : 8) / Math.pow(2, L.cup), 2, 16);
    if (cup.alive.length > to) g.push({ k: 'cup', txt: cup.name + ': ' + G.mgrBoard.REACH[to], imp: rep >= 85 || hi ? 'alta' : 'media', st: 'mid', to: to, at: cup.alive.length });
  }
  var ek = G.europe.compsOf(st, club.id)[0];
  if (ek) {
    var big = rep >= 85, eto = G.clamp((big ? 3 : 1) + L.cup, 1, 5), /** @type {BoardGoal} */ e = { k: 'eu', txt: S.eu[ek].name + ': ' + G.mgrBoard.EU_TXT[eto], imp: big || hi ? 'alta' : 'media', st: 'mid', to: eto, c: ek };
    if (!G.mgrBoard.done(st, e)) g.push(e);
  }
  // most clubs already pay more than the cap allows: the board asks not to go past cap x 1.1, or today's wages + 5%
  var lim = G.mgrDeal.r1(Math.max(G.world.wageCap(club) * 1.1, G.world.wageBill(W, club) * 1.05));
  g.push({ k: 'fin', txt: 'Chiudere con il budget in attivo e il monte ingaggi entro ' + G.mgrLive.num(lim).slice(1) + ' M€', imp: 'media', st: 'mid', lim: lim });
  g.push(G.mgrId.goal(st, club));  // the club's identity (M9 S3)
  g.push({ k: 'yth', txt: 'Far giocare titolari almeno 2 giovani (21 anni o meno) in 8 partite', imp: rep < 70 ? 'media' : 'bassa', st: 'mid' });
  m.goals = g;
  G.mgrBoard.check(st);
};

// Where the club got in its European competition: [the furthest stage played (index of EU, 6 = won), out of it]
/** @param {EuroComp} comp @param {ClubId} id @returns {[number, boolean]} */
G.mgrBoard.euStage = function (comp, id) {
  var E = G.mgrBoard.EU, best = 0, out = false;
  if (comp.winner === id) return [6, false];
  comp.log.forEach(function (x) {
    if (x.a !== id && x.b !== id) return;
    best = Math.max(best, E.indexOf(x.stage));
    if (x.w !== id) out = true;
  });
  if (comp.stage !== 'lp' && comp.stage !== 'done' && comp.ties.some(function (t) { return t[0] === id || t[1] === id; })) best = Math.max(best, E.indexOf(comp.stage));
  // a league phase that is over: the 25th and below are out, the first 8 go straight to the last 16
  if (comp.stage !== 'lp') { var pos = G.europe.sortTable(comp).indexOf(id) + 1; if (pos > 24) out = true; else if (pos <= 8) best = Math.max(best, 2); else best = Math.max(best, 1); }
  return [best, out];
};

// A goal's state now: [ok | mid | ko, still open]
/** @param {State} st @param {BoardGoal} g @returns {[BoardState, boolean]} */
G.mgrBoard.judge = function (st, g) {
  var m = G.mgr.job(st), W = st.world, S = G.sure(st.S), club = W.clubs[m.club];
  if (g.k === 'lg') {
    var pos = G.season.sortTable(S, club.lg).indexOf(club.id) + 1, t = m.obj.tgt;
    return [pos <= t ? 'ok' : pos <= t + 2 ? 'mid' : 'ko', true];
  }
  if (g.k === 'cup') {
    var cup = S.cups[club.nat], at = g.at || 99, to = g.to || 2;
    if (at <= to) return ['ok', false];
    if (cup && cup.winner === null && cup.alive.indexOf(club.id) >= 0) return ['mid', true];
    return [at <= to * 2 ? 'mid' : 'ko', false];  // out a round short (with byes the rounds are not always halves)
  }
  if (g.k === 'eu') {
    var comp = S.eu[g.c || ''];
    if (!comp) return ['ko', false];
    var s = G.mgrBoard.euStage(comp, club.id), want = g.to || 1, ep = G.europe.sortTable(comp).indexOf(club.id) + 1;
    if (s[0] >= want) return ['ok', false];
    if (want === 1) return [ep <= 24 ? 'ok' : ep <= 26 ? 'mid' : 'ko', comp.stage === 'lp'];  // the first 24: the table says
    if (!s[1]) return ['mid', true];
    return [s[0] === want - 1 ? 'mid' : 'ko', false];  // out one round short, or before
  }
  if (g.k === 'fin') {  // the budget moved to wages (D6) widens the limit
    var n = (club.bud >= 0 ? 1 : 0) + (G.world.wageBill(W, club) <= (g.lim || 0) + Math.max(0, m.wageRoom || 0) ? 1 : 0);
    return [n === 2 ? 'ok' : n === 1 ? 'mid' : 'ko', true];
  }
  if (g.k === 'idt') return G.mgrId.state(st, g);
  var y = G.mgrBoard.young(st);
  return [y >= 2 ? 'ok' : y === 1 ? 'mid' : 'ko', true];
};

/** @param {State} st @returns {number} players of 21 or less with 8 starts */
G.mgrBoard.young = function (st) {
  var m = G.mgr.job(st), W = st.world;
  return W.clubs[m.club].sq.filter(function (id) { return W.players[id].a <= 21 && (m.starts[id] || 0) >= 8; }).length;
};

/** @param {State} st @param {BoardGoal} g @returns {boolean} decided and missed */
G.mgrBoard.done = function (st, g) { var r = G.mgrBoard.judge(st, g); return !r[1] && r[0] !== 'ok'; };

// Every goal's state now; at the end of the season none is open any more
/** @param {State} st @param {boolean} [end] */
G.mgrBoard.check = function (st, end) {
  (G.mgr.job(st).goals || []).forEach(function (g) { var r = G.mgrBoard.judge(st, g); g.st = r[0]; g.run = r[1] && !end ? 1 : 0; });
};

// A round of the national cup is over (both engines): how far the club got
/** @param {State} st @param {CupState} cup */
G.mgrBoard.cupRound = function (st, cup) {
  var m = G.mgr.job(st);
  if (!G.mgr.active(st) || G.sure(st.S).cups[st.world.clubs[m.club].nat] !== cup) return;
  (m.goals || []).forEach(function (g) { if (g.k === 'cup' && cup.alive.indexOf(m.club) >= 0) g.at = Math.min(g.at || 99, cup.alive.length); });
};

// After every block: out of the cup or of Europe before the goal costs 4 of the job's security
/** @param {State} st */
G.mgrBoard.block = function (st) {
  var m = G.mgr.job(st);
  if (!m.goals) return;
  G.mgrBoard.check(st);
  m.goals.forEach(function (g) {
    if ((g.k !== 'cup' && g.k !== 'eu') || g.out || g.run || g.st === 'ok') return;
    g.out = 1; m.conf -= 4;
    G.news(st, (g.k === 'cup' ? '🏆 Fuori dalla coppa' : '🌍 Fuori dall’Europa') + ' prima dell’obiettivo: la società non è contenta');
  });
};

// The end of the season: Σ w × (1 | 0.5 | 0) / Σ w
/** @param {State} st @returns {number} */
G.mgrBoard.score = function (st) {
  var V = /** @type {Dict<number>} */ ({ ok: 1, mid: 0.5, ko: 0 }), W = G.mgrBoard.W, sw = 0, s = 0;
  G.mgrBoard.check(st, true);
  (G.mgr.job(st).goals || []).forEach(function (g) { sw += W[g.imp]; s += W[g.imp] * V[g.st]; });
  return sw ? s / sw : 0.5;
};

// ---------- F2 · ct of a national team as well ----------
// At the end of a season, with reputation 70 or more, one time in four: a nation of about his level, his own first
/** @param {State} st */
G.mgrBoard.ntCall = function (st) {
  var m = G.mgr.job(st), rng = G.makeRng(G.mgrDeal.hash('nt:' + st.seed + ':' + G.sure(st.S).year)), own = st.player.nat;
  if (m.rep < 70 || m.nt || !rng.chance(0.25)) return;
  var near = G.NT_IDS.slice().sort(function (a, b) { return Math.abs(G.NT[a].base - m.rep) - Math.abs(G.NT[b].base - m.rep) || (a < b ? -1 : 1); }).slice(0, 3);
  var nat = G.NT[own] && Math.abs(G.NT[own].base - m.rep) <= 8 ? own : rng.pick(near);
  m.ntOffer = nat;
  G.news(st, '🌍 ' + G.national.name(nat) + ' ti vuole come ct, insieme al club: rispondi prima della prima partita');
};

/** @param {State} st @param {boolean} yes */
G.mgrBoard.ntAnswer = function (st, yes) {
  var m = G.mgr.job(st), nat = m.ntOffer;
  if (!nat) return '';
  m.ntOffer = null;
  if (!yes) return 'Hai detto no a ' + G.national.name(nat) + '.';
  m.nt = nat;
  G.news(st, '🌍 Sei il nuovo ct di ' + G.national.name(nat) + ', senza lasciare il club');
  return '🌍 Sei il ct di ' + G.national.name(nat) + ': con te la nazionale ha ' + G.mgrLive.num(G.mgrBoard.power(m)) + ' di forza.';
};

// The first block begins: an offer nobody answered lapses
/** @param {State} st */
G.mgrBoard.due = function (st) {
  var m = st.mgr;
  if (!m || !m.ntOffer) return;
  G.news(st, '🌍 ' + G.national.name(m.ntOffer) + ' sceglie un altro ct');
  m.ntOffer = null;
};

/** @param {State} st @param {NationCode} nat @returns {number} what the manager adds to the nation he coaches */
G.mgrBoard.ntBonus = function (st, nat) { var m = st.mgr; return m && m.nt === nat && !m.done ? G.mgrBoard.power(m) : 0; };
/** @param {Mgr} m @returns {number} */
G.mgrBoard.power = function (m) { return (m.rep - 60) / 10; };

// The qualifiers are over (G.national.qualify): not at the tournament, the job ends
/** @param {State} st */
G.mgrBoard.ntQual = function (st) {
  var m = st.mgr, S = G.sure(st.S), nat = m && m.nt, tours = S.tours;
  if (!m || !nat || !tours) return;
  var mg = m, ct = nat, all = tours;
  Object.keys(all).forEach(function (k) {
    if (!G.CFG.NT.TOURS[k].q[G.NT[ct].conf] || all[k].teams.indexOf(ct) >= 0) return;
    mg.nt = null;
    G.news(st, '❌ ' + G.national.name(ct) + ' non si qualifica al ' + all[k].n + ': il tuo incarico da ct finisce');
  });
};

/** @param {State} st @returns {string|null} the tournament won this summer as ct */
G.mgrBoard.ntWon = function (st) {
  var m = G.mgr.job(st), S = G.sure(st.S), nat = m.nt;
  var tours = S.tours;
  if (!nat || !tours) return null;
  var all = tours, k = Object.keys(all).filter(function (x) { return all[x].winner === nat; })[0];
  return k ? all[k].n : null;
};

// Saves from before phase F
/** @param {State} st */
G.mgrBoard.migrate = function (st) {
  var m = G.mgr.job(st);
  if (!m.goals && G.mgr.active(st) && st.S && m.obj) G.mgrBoard.goals(st);
};
