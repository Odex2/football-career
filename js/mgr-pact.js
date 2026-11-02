// @ts-check
// The board (M9 S4 M11): every summer a pact on 4 levels (budget for goals), expectations
// that grow when the club does better than expected (club.exp, only for the managed club), a president with one of 5
// characters (read from the club every time, saved in club.pres only for the managed club and after a new owner).
// The requests during the season are in js/mgr-asks.js. Old saves, with no pact and no exp: "Normale" and 0.
//   m.pact { lvl, bud, adv, pres, sh, y, cf, open } · m.repay the advance to give back · m.fin where the budget came from

G.mgrPact = {};
/** @type {Dict<string>} */
G.mgrPact.LV = { reb: '🛡️ Ricostruzione', norm: '⚖️ Normale', amb: '📈 Ambizioso', all: '🔥 Tutto per vincere' };
/** @type {Dict<string[]>} the president's character: [name, what he does] */
G.mgrPact.PRES = {
  amb: ['Ambizioso', 'concede facilmente "Tutto per vincere", ma cambia allenatore in fretta'],
  pat: ['Paziente', 'concede poco budget in più, ma ti dà 10 di pazienza'],
  acc: ['Contabile', 'non concede mai "Tutto per vincere" e chiede di vendere se i conti sono in rosso'],
  fan: ['Tifoso', 'segue l’umore dei tifosi: la fiducia sale e scende anche con loro'],
  mec: ['Mecenate', 'paga di tasca sua il budget in più, senza anticiparlo']
};
/** @type {Dict<string>} the famous clubs, written by hand */
G.mgrPact.HAND = {
  'Real Madrid': 'amb', 'Barcelona': 'fan', 'Paris Saint-Germain': 'mec', 'Manchester City': 'mec', 'Newcastle United': 'mec', 'Chelsea': 'amb',
  'Juventus': 'amb', 'Roma': 'amb', 'Napoli': 'acc', 'Inter': 'acc', 'Udinese': 'acc', 'Bayern München': 'acc', 'Atalanta': 'pat', 'Bologna': 'pat',
  'Liverpool': 'pat', 'Arsenal': 'pat', 'Athletic Club': 'fan', 'Borussia Dortmund': 'fan', 'Galatasaray': 'fan', 'Fenerbahçe': 'fan'
};

// ---------- the president ----------
/** @param {Club} club @returns {string} his character: saved for the managed club, else from reputation, nation, money */
G.mgrPact.pres = function (club) {
  if (club.pres) return club.pres.k;
  if (G.mgrPact.HAND[club.name]) return G.mgrPact.HAND[club.name];
  var h = G.mgrDeal.hash('pres:' + club.name);
  if (club.rev >= 100 && h % 3 === 0) return 'mec';
  if (['ARG', 'BRA', 'TUR', 'GRE', 'MEX'].indexOf(club.nat) >= 0 && h % 3 === 1) return 'fan';
  var pool = club.rep >= 78 ? ['amb', 'amb', 'fan', 'pat', 'acc'] : club.rep >= 68 ? ['fan', 'pat', 'acc', 'amb', 'pat'] : ['acc', 'acc', 'pat', 'fan', 'fan'];
  return pool[(h >>> 4) % pool.length];
};
/** @param {Club} club @returns {string} */
G.mgrPact.presName = function (club) { return G.squads.name(club.nat, G.makeRng(G.mgrDeal.hash('pn:' + club.name + ':' + (club.pres ? club.pres.y : 0)))); };
/** @param {State} st @returns {number} the patience with the president's bonus */
G.mgrPact.pat = function (st) { var m = G.mgr.job(st); return m.pat + G.CFG2.PACT.PRES[G.mgrPact.pres(st.world.clubs[m.club])].pat; };

// ---------- the pact ----------
/** @param {MgrJob} m @returns {PactLevel} */
G.mgrPact.lv = function (m) { return G.mgrPact.L(m, m.pact ? m.pact.lvl : 'norm'); };
// A level for this manager: "Ricostruzione" again and again (m.rebN seasons in a row) cuts the budget more each year
// (REB), gives the confidence only the first time and the board tires of it: a bad table weighs more
/** @param {MgrJob} m @param {string} lvl @returns {PactLevel} */
G.mgrPact.L = function (m, lvl) {
  var P = G.CFG2.PACT, L = P.LV[lvl], n = lvl === 'reb' ? m.rebN || 0 : 0;
  if (!n) return L;
  return { bud: -Math.min(P.REB.MAX, -L.bud + n * P.REB.STEP), sh: L.sh, cup: L.cup, conf: 0, loss: L.loss + n * P.REB.LOSS, push: L.push, need: L.need };
};

// Why the board says no to a level ('' = it can be chosen)
/** @param {State} st @param {string} lvl @returns {string} */
G.mgrPact.no = function (st, lvl) {
  var P = G.CFG2.PACT, m = G.mgr.job(st), club = st.world.clubs[m.club], L = G.mgrPact.L(m, lvl), pk = G.mgrPact.pres(club), conf = m.conf - (m.pact ? m.pact.cf : 0);
  if (!L) return '?';
  if (conf < P.LOW && L.bud > 0) return 'con la fiducia sotto ' + P.LOW + ' la società concede solo Normale o Ricostruzione';
  if (lvl === 'all' && pk === 'acc') return 'il presidente Contabile non lo concede mai';
  if (lvl === 'all' && club.bud - (m.pact ? m.pact.bud : 0) < 0) return 'i conti sono in rosso';
  var need = Math.max(0, L.need - (pk === 'amb' ? P.AMB_EASY : 0));
  return conf < need ? 'serve fiducia ' + need + ' (ora ' + Math.max(0, Math.round(conf)) + ')' : '';
};
/** @param {State} st @returns {boolean} the pact can still change: before the club's first match with it */
G.mgrPact.open = function (st) { var m = G.mgr.job(st); return !!(m.pact && m.pact.open && G.mgr.active(st)); };

// What a level gives: [extra budget, advance, from the president] with today's budget (before the pact)
/** @param {State} st @param {string} lvl @returns {number[]} */
G.mgrPact.money = function (st, lvl) {
  var P = G.CFG2.PACT, m = G.mgr.job(st), club = st.world.clubs[m.club], r1 = G.mgrDeal.r1, pk = G.mgrPact.pres(club);
  var base = Math.max(0, club.bud - (m.pact ? m.pact.bud : 0)), extra = r1(base * G.mgrPact.L(m, lvl).bud);
  if (extra <= 0) return [extra, 0, 0];
  var half = r1(extra * P.ADV), adv = pk === 'mec' ? 0 : half, pres = pk === 'mec' ? extra : r1((extra - half) * P.PRES[pk].half);
  if (pk === 'fan') pres = r1(pres * G.clamp((st.player.fans[club.id] || 0) / 50 + 0.5, 0.5, 1.5));
  return [r1(adv + pres), adv, pres];
};

// Choose level lvl (the vice picks "Normale"): the old pact is undone, the goals are set again
/** @param {State} st @param {string} lvl @returns {string} */
G.mgrPact.set = function (st, lvl) {
  var P = G.CFG2.PACT, m = G.mgr.job(st), club = st.world.clubs[m.club], S = G.sure(st.S), old = m.pact, r1 = G.mgrDeal.r1;
  if (old && !old.open) return 'Il patto di questa stagione è già fissato.';
  var why = G.mgrPact.no(st, lvl);
  if (why) return '🏛️ ' + G.mgrPact.LV[lvl] + ': no, ' + why + '.';
  var g = G.mgrPact.money(st, lvl);
  if (old) { club.bud = r1(club.bud - old.bud); m.conf -= old.cf; }
  var L = G.mgrPact.L(m, lvl);
  club.bud = r1(club.bud + g[0]); m.conf += L.conf;
  m.pact = { lvl: lvl, bud: g[0], adv: g[1], pres: g[2], sh: L.sh, y: S.year, cf: L.conf, open: 1 };
  G.mgr.objective(st); G.mgrBoard.goals(st);
  return '🏛️ Patto ' + G.mgrPact.LV[lvl] + ': budget ' + Math.round(club.bud) + ' M€, obiettivo ' + m.obj.txt.toLowerCase() + '.';
};

// The league goal: today's (strength rank + 1) − expectations − the pact, inside the table, never the title below the
// 5th strength
/** @param {State} st @param {number} base today's goal @param {number} rank strength rank @param {number} n clubs @returns {number} */
G.mgrPact.target = function (st, base, rank, n) {
  var m = G.mgr.job(st), L = G.mgrPact.lv(m), club = st.world.clubs[m.club], t = base - Math.round(club.exp || 0) - L.sh;
  if (L.top) t = Math.min(t, L.top);
  t = Math.min(t, base + G.CFG2.PACT.EASE);  // never more than EASE places easier than today's
  t = G.clamp(t, 1, n - 1);
  return rank > 5 ? Math.max(2, t) : t;
};

// ---------- the season ----------
// Summer: the advance of a pact missed comes back (the floor of the budget is put back after, G.mgr.marketFloor), a
// new owner now and then, where the budget came from; the pact waits for a choice, "Normale" until then
/** @param {State} st */
G.mgrPact.seasonStart = function (st) {
  var P = G.CFG2.PACT, C = G.CFG, m = G.mgr.job(st), W = st.world, club = W.clubs[m.club], S = G.sure(st.S), r1 = G.mgrDeal.r1, f = m.fin || {};
  f.y = S.year; f.tot = r1(club.bud); f.rev = r1(club.rev * C.TRANSFER_SHARE); f.carry = f.carry || 0; f.prize = f.prize || 0;
  f.room = r1(Math.max(0, f.tot - f.carry - f.rev - f.prize)); f.repay = 0;
  if (m.repay) { f.repay = m.repay; club.bud = r1(club.bud - m.repay); G.news(st, '💸 La società si riprende l’anticipo del patto: −' + m.repay + ' M€'); m.repay = 0; }
  m.fin = f;
  if (club.pres && club.pres.to && S.year >= club.pres.to) { delete club.pres; club.pres = { k: G.mgrPact.pres(club), y: S.year }; }
  var red = club.bud < 0 || G.world.wageBill(W, club) > G.world.wageCap(club) * P.ASK.RED_WAGE + Math.max(0, m.wageRoom || 0);
  if (G.makeRng(G.mgrDeal.hash('own:' + st.seed + ':' + S.year + ':' + club.id)).chance(P.OWN_P * (red ? P.OWN_RED : 1))) {
    club.pres = { k: 'mec', y: S.year, to: S.year + P.MEC_YEARS };
    club.exp = Math.min(P.EXP[1], (club.exp || 0) + 1);
    G.news(st, '💼 Il ' + club.name + ' cambia proprietà: arriva un fondo, il nuovo presidente ' + G.mgrPact.presName(club) + ' è un Mecenate. Le aspettative salgono');
  }
  m.pact = null; m.confH = [m.conf];
};
// After the budget's floor: the pact of the summer, "Normale" until the manager chooses
/** @param {State} st */
G.mgrPact.summer = function (st) {
  var m = G.mgr.job(st), lvl = m.next && !G.mgrPact.no(st, m.next) ? m.next : 'norm';
  delete m.next;
  G.mgrPact.set(st, lvl);
  if (m.fin && m.pact) { m.fin.pact = m.pact.adv; m.fin.pres = m.pact.pres; }
};
// A new job: the president's character is kept from now on, the pact of the offer (or "Normale")
/** @param {State} st @param {string} [lvl] */
G.mgrPact.start = function (st, lvl) {
  var m = G.mgr.job(st), club = st.world.clubs[m.club];
  if (!club.pres) club.pres = { k: G.mgrPact.pres(club), y: st.S ? st.S.year : st.year };
  m.pact = null; m.confH = [m.conf]; delete m.grace; m.repay = 0; m.rebN = 0; m.fin = { y: st.S ? st.S.year : st.year, tot: G.mgrDeal.r1(club.bud) };
  m.next = lvl && !G.mgrPact.no(st, lvl) ? lvl : undefined;
  G.mgrPact.summer(st);
};

// After every block: the president's mood, the history of the confidence
/** @param {State} st */
G.mgrPact.block = function (st) {
  var P = G.CFG2.PACT, m = G.mgr.job(st), club = st.world.clubs[m.club];
  if (G.mgrPact.pres(club) === 'fan') m.conf = Math.round(m.conf + G.clamp(((st.player.fans[club.id] || 0) - 50) / P.FAN_CONF, -2, 2));
  if (m.grace) { m.grace--; m.conf = Math.max(1, m.conf); }
  (m.confH = m.confH || []).push(m.conf);
};
/** @param {State} st @returns {number} how much a bad table weighs in this block (pact and president) */
G.mgrPact.loss = function (st) {
  var m = G.mgr.job(st);
  return G.mgrPact.lv(m).loss * (G.mgrPact.pres(st.world.clubs[m.club]) === 'amb' ? G.CFG2.PACT.AMB_PRES : 1);
};

// The end of the season: the reward of an ambitious pact reached, the advance to give back, the new expectations
/** @param {State} st @param {number} pos @param {number} cups trophies won @param {boolean} down relegated */
G.mgrPact.seasonEnd = function (st, pos, cups, down) {
  var P = G.CFG2.PACT, m = G.mgr.job(st), club = st.world.clubs[m.club], pk = m.pact || { lvl: 'norm', adv: 0 }, ok = pos <= m.obj.tgt, R = P.REWARD[pk.lvl];
  if (ok && R) {
    m.conf += R[0]; m.rep = Math.min(97, m.rep + R[1]); G.life.fans(st, club.id, R[2]);
    G.news(st, '🏛️ Patto ' + G.mgrPact.LV[pk.lvl] + ' rispettato: fiducia +' + R[0] + ', reputazione +' + R[1] + (pk.adv ? ', e la società rinuncia all’anticipo' : ''));
  }
  m.repay = ok ? 0 : pk.adv || 0;
  var e = (club.exp || 0) * P.KEEP + (m.obj.tgt - pos) * P.GAP + P.LV[pk.lvl].push + cups * P.TROPHY;
  club.exp = down ? P.RELEG : Math.round(G.clamp(e, P.EXP[0], P.EXP[1]) * 10) / 10;
  if (m.pact) m.pact.open = 0;
  m.rebN = pk.lvl === 'reb' ? (m.rebN || 0) + 1 : 0;
  m.fin = { carry: G.mgrDeal.r1(club.bud * G.CFG.CARRY), prize: G.sure(st.S).prize[club.id] || 0 };
};

// The goal next year with "Normale" after a season ending at pos (for the 🏛️ Società tab)
/** @param {State} st @param {number} pos @returns {number} exp next year, rounded as the goal uses it */
G.mgrPact.expAfter = function (st, pos) {
  var P = G.CFG2.PACT, m = G.mgr.job(st), club = st.world.clubs[m.club], lvl = m.pact ? m.pact.lvl : 'norm';
  return Math.round(G.clamp((club.exp || 0) * P.KEEP + (m.obj.tgt - pos) * P.GAP + P.LV[lvl].push, P.EXP[0], P.EXP[1]));
};
