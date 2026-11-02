// @ts-check
// The requests during the season (M9 S4 M11.6): one from the manager per transfer window,
// with the chance shown first (confidence and president); the board asks too: sell when the accounts are in the red,
// play a boy, keep a club legend (a president "Tifoso"). Accepting raises the confidence, refusing lowers it, and a
// promise not kept costs more. An answer nobody gave by the end of the block is the vice's yes.
//   m.asks [{ k, y, b, ok }] the manager's requests · m.breq the board's request { k, id, y, due, acc, base }
//   m.grace blocks of a last chance · m.time clubs where it was used · m.inv the academy's investment this season

G.mgrAsk = {};
/** @type {Dict<string[]>} the manager's requests: [title, what it does] */
G.mgrAsk.K = {
  bud: ['💶 Budget d’emergenza', 'fino al 15% del budget; se va bene costa 5 di fiducia, se va male 2'],
  wage: ['📈 Più margine sugli ingaggi', 'il 15% del tetto ingaggi in più; se va bene costa 3 di fiducia, se va male 1'],
  goal: ['🎯 Abbassare un obiettivo', 'coppa o Europa un turno prima, in cambio di 6 di fiducia'],
  time: ['⏳ Più tempo', 'con fiducia bassa, un’ultima possibilità di 2 blocchi; una volta sola per club'],
  yth: ['🌱 Investire sul vivaio', 'i giovani crescono il 25% in più fino all’estate; la società paga il 5% delle entrate']
};

/** @param {State} st @returns {number} the window: year × 10 + block */
G.mgrAsk.win = function (st) { var S = G.sure(st.S); return S.year * 10 + S.block; };
/** @param {State} st @returns {BoardGoal|undefined} the open cup or European goal that can be lowered */
G.mgrAsk.goalToLower = function (st) {
  return (G.mgr.job(st).goals || []).filter(function (g) { return (g.k === 'cup' && (g.to || 2) < 16) || (g.k === 'eu' && (g.to || 1) > 1); }).filter(function (g) { return g.run && g.st !== 'ok'; })[0];
};
// Why request k cannot be made now ('' = it can)
/** @param {State} st @param {string} k @returns {string} */
G.mgrAsk.can = function (st, k) {
  var A = G.CFG2.PACT.ASK, m = G.mgr.job(st), club = st.world.clubs[m.club], w = G.mgrAsk.win(st);
  if (k === 'time') return m.conf >= A.TIME ? 'solo con fiducia sotto ' + A.TIME : (m.time || []).indexOf(club.id) >= 0 ? 'già chiesto in questo club' : m.grace ? 'già in corso' : '';
  if (!G.mgr.open(st)) return 'solo con il mercato aperto';
  if ((m.asks || []).some(function (a) { return a.y * 10 + a.b === w && a.k !== 'time'; })) return 'una richiesta per finestra: già fatta';
  if (k === 'bud' && club.bud <= 0) return 'il budget è a zero';
  if (k === 'goal' && !G.mgrAsk.goalToLower(st)) return 'nessun obiettivo di coppa o d’Europa da abbassare';
  if (k === 'yth' && m.inv) return 'già fatto in questa stagione';
  return '';
};
/** @param {State} st @param {string} k @returns {number} the chance that the board says yes */
G.mgrAsk.chance = function (st, k) {
  var P = G.CFG2.PACT, A = P.ASK, m = G.mgr.job(st), pk = G.mgrPact.pres(st.world.clubs[m.club]);
  var p = A.BASE + (m.conf - 50) / A.DIV + P.PRES[pk].ask + (k === 'goal' ? 0.2 : k === 'time' ? 0.25 : 0) - (k === 'bud' && pk === 'acc' ? 0.15 : 0);
  return Math.round(G.clamp(p, A.P[0], A.P[1]) * 100) / 100;
};
/** @param {State} st @returns {number} M€ of an emergency budget */
G.mgrAsk.budAmount = function (st) { var m = G.mgr.job(st), club = st.world.clubs[m.club]; return G.mgrDeal.r1(Math.max(0.5, club.bud * G.CFG2.PACT.ASK.BUD)); };

// The manager asks k: the board answers at once
/** @param {State} st @param {string} k @returns {string} */
G.mgrAsk.ask = function (st, k) {
  var A = G.CFG2.PACT.ASK, m = G.mgr.job(st), W = st.world, club = W.clubs[m.club], S = G.sure(st.S), why = G.mgrAsk.can(st, k), r1 = G.mgrDeal.r1;
  if (!G.mgrAsk.K[k]) return '';
  if (why) return G.mgrAsk.K[k][0] + ': ' + why + '.';
  var ok = G.mgrJobs.rng(st, 'ask:' + k).chance(G.mgrAsk.chance(st, k)), t = G.mgrAsk.K[k][0] + ': ';
  (m.asks = m.asks || []).push({ k: k, y: S.year, b: S.block, ok: ok ? 1 : 0 });
  if (k === 'time') (m.time = m.time || []).push(club.id);
  if (!ok) {
    m.conf -= k === 'bud' ? A.BUD_CONF[1] : k === 'wage' ? A.WAGE_CONF[1] : 2;
    return t + 'la società dice di no.';
  }
  if (k === 'bud') { var amt = G.mgrAsk.budAmount(st); club.bud = r1(club.bud + amt); m.conf -= A.BUD_CONF[0]; return t + '+' + amt + ' M€ (fiducia −' + A.BUD_CONF[0] + ').'; }
  if (k === 'wage') { var room = r1(G.world.wageCap(club) * A.WAGE); m.wageRoom = r1((m.wageRoom || 0) + room); m.conf -= A.WAGE_CONF[0]; return t + '+' + room + ' M€ l’anno di margine (fiducia −' + A.WAGE_CONF[0] + ').'; }
  if (k === 'goal') {
    var g = G.sure(G.mgrAsk.goalToLower(st));
    if (g.k === 'cup') { g.to = (g.to || 2) * 2; g.txt = g.txt.split(':')[0] + ': ' + G.mgrBoard.REACH[g.to]; } else { g.to = (g.to || 1) - 1; g.txt = g.txt.split(':')[0] + ': ' + G.mgrBoard.EU_TXT[g.to]; }
    m.conf -= A.GOAL_CONF; G.mgrBoard.check(st);
    return t + g.txt + ' (fiducia −' + A.GOAL_CONF + ').';
  }
  if (k === 'time') { m.grace = A.TIME_BLOCKS; return t + 'hai ancora ' + A.TIME_BLOCKS + ' blocchi, poi la società decide.'; }
  m.inv = 1; club.bud = r1(club.bud - club.rev * A.YTH_COST);
  return t + 'la società investe sul vivaio: i giovani crescono il 25% in più fino all’estate.';
};
/** @param {MgrJob} m @returns {number} the academy's investment on the growth of the young */
G.mgrAsk.ythX = function (m) { return m.inv ? G.CFG2.PACT.ASK.YTH : 1; };

// ---------- the board asks ----------
/** @param {State} st @returns {boolean} the accounts are in the red */
G.mgrAsk.red = function (st) {
  var m = G.mgr.job(st), W = st.world, club = W.clubs[m.club];
  return club.bud < 0 || G.world.wageBill(W, club) > G.world.wageCap(club) * G.CFG2.PACT.ASK.RED_WAGE + Math.max(0, m.wageRoom || 0);
};
// A window opens: at most one request of the board at a time
/** @param {State} st */
G.mgrAsk.window = function (st) {
  var m = G.mgr.job(st), W = st.world, club = W.clubs[m.club], S = G.sure(st.S), xi = G.mgrTeam.xi(st).map(function (x) { return x.id; });
  if (!G.mgr.active(st) || m.breq) return;
  var pk = G.mgrPact.pres(club), sq = club.sq.map(function (id) { return W.players[id]; }), /** @type {BoardAsk|null} */ r = null;
  if (G.mgrAsk.red(st)) r = { k: 'sell', due: S.block + 1 };
  else if (pk === 'fan' && S.block === 0) {
    var flag = sq.filter(function (pl) { return pl.a >= 29 && pl.ln === undefined; }).sort(function (a, b) { return b.o - a.o; })[0];
    if (flag) r = { k: 'flag', id: flag.i, due: 5 };
  }
  if (!r) {
    var boy = sq.filter(function (pl) { return pl.a <= 21 && xi.indexOf(pl.i) < 0 && pl.ln === undefined; }).sort(function (a, b) { return b.o - a.o; })[0];
    if (boy && G.mgrBoard.young(st) < 1 && boy.o >= club.str - 12) r = { k: 'play', id: boy.i, due: S.block + 2 };
  }
  if (!r) return;
  r.y = S.year; r.base = r.k === 'sell' ? m.sales || 0 : r.id !== undefined ? m.starts[r.id] || 0 : 0;
  m.breq = r;
  G.news(st, '🏛️ La società ti chiede: ' + G.mgrAsk.boardText(st, r) + ' (🏛️ Società)');
};
/** @param {State} st @param {BoardAsk} r @returns {string} */
G.mgrAsk.boardText = function (st, r) {
  var pl = r.id !== undefined ? st.world.players[r.id] : null, n = pl ? pl.n : '';
  return r.k === 'sell' ? 'vendere un giocatore entro la fine del mercato, i conti sono in rosso' : r.k === 'flag' ? 'non vendere ' + n + ', una bandiera per i tifosi' :
    'far giocare ' + n + ' titolare in ' + G.CFG2.PACT.ASK.PLAY + ' partite entro due blocchi';
};
// The manager answers: yes (the promise is kept or not later), no (confidence down now)
/** @param {State} st @param {boolean} yes @returns {string} */
G.mgrAsk.answer = function (st, yes) {
  var A = G.CFG2.PACT.ASK, m = G.mgr.job(st), r = m.breq;
  if (!r || r.acc) return '';
  if (!yes) { m.breq = null; m.conf -= A.NO; return '🏛️ Hai detto no alla società: fiducia −' + A.NO + '.'; }
  r.acc = 1; m.conf += A.OK;
  return '🏛️ Hai detto sì alla società: fiducia +' + A.OK + '. Ora mantieni la promessa.';
};
// After every block: an answer nobody gave is the vice's yes (he sells when he has to); a promise kept or broken
/** @param {State} st */
G.mgrAsk.block = function (st) {
  var A = G.CFG2.PACT.ASK, m = G.mgr.job(st), W = st.world, club = W.clubs[m.club], S = G.sure(st.S), r = m.breq;
  if (!r) return;
  if (!r.acc) { G.mgrAsk.answer(st, true); G.news(st, '🏛️ Il vice dice sì alla società: ' + G.mgrAsk.boardText(st, r)); }
  if (r.k === 'sell' && (m.sales || 0) <= (r.base || 0) && (!m.assist || m.assist.market) && G.mgr.open(st)) {
    var xi = G.mgrTeam.xi(st).map(function (x) { return x.id; }), out = club.sq.filter(function (id) { return xi.indexOf(id) < 0 && W.players[id].ln === undefined; }).sort(function (a, b) { return W.players[a].o - W.players[b].o; })[0];
    if (out !== undefined && club.sq.length > G.CFG.SQUAD_MIN) G.mgr.sell(st, out);
  }
  var pl = r.id !== undefined ? W.players[r.id] : null;
  var kept = r.k === 'sell' ? (m.sales || 0) > (r.base || 0) : r.k === 'play' ? !!pl && (m.starts[pl.i] || 0) >= (r.base || 0) + A.PLAY : null;
  var gone = r.k === 'flag' && (!pl || pl.c !== club.id);
  if (kept) { m.breq = null; G.news(st, '🏛️ Promessa mantenuta: la società apprezza'); return; }
  if (gone || (r.due !== undefined && S.block >= r.due) || r.y !== S.year) {
    m.breq = null;
    if (r.k === 'flag' && !gone) return;  // the season is over and he is still here
    m.conf -= A.FAIL; G.news(st, '🏛️ Promessa non mantenuta: fiducia −' + A.FAIL);
  }
};
