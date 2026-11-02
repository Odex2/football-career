// @ts-check
// The club's identity (M9 S3, phase M6 and the interview of M10.4): every club asks for 1 or 2
// traits, read from a short list of famous clubs or from its reputation, its nation and the style of its first coach.
// No random numbers and nothing saved in the world: the same club gives the same traits. Respecting them is a goal of
// the board (F1, weight media), lengthens the patience (m.pat) and pleases the fans; betraying them shortens it.
//   m.style the manager's record per trait (+1 a season respected, −1 betrayed) · m.big signings above the squad's
//   level this season · m.soldOwn home-grown players sold this season · pl.hg the club that promoted him

G.mgrId = {};
/** @type {Dict<string[]>} trait: [icon, name, what it asks] */
G.mgrId.T = {
  yth: ['🌱', 'Vivaio', 'almeno 2 giovani (21 anni o meno) titolari in 8 partite'],
  show: ['🎆', 'Spettacolo', 'tattica offensiva e un attacco all’altezza della rosa'],
  solid: ['🧱', 'Solidità', 'pochi gol subiti, almeno quanto dice la rosa'],
  fin: ['📒', 'Conti in ordine', 'monte ingaggi entro il tetto della società'],
  star: ['⭐', 'Grandi nomi', 'un acquisto importante a stagione (sopra il livello della rosa)'],
  flag: ['🏳️', 'Bandiere', 'non vendere i giocatori cresciuti nel club']
};
/** @type {Dict<string[]>} the famous clubs, written by hand */
G.mgrId.HAND = {
  'Ajax': ['yth', 'show'], 'Athletic Club': ['yth', 'flag'], 'Atalanta': ['show'], 'Barcelona': ['yth', 'show'], 'Real Madrid': ['star', 'show'],
  'Atlético Madrid': ['solid', 'flag'], 'Juventus': ['solid', 'star'], 'Inter': ['solid'], 'Roma': ['flag'], 'Benfica': ['yth'], 'Sporting CP': ['yth'],
  'Paris Saint-Germain': ['star'], 'Manchester City': ['show', 'star'], 'Liverpool': ['show'], 'Bayern München': ['star', 'show'],
  'Borussia Dortmund': ['yth', 'show'], 'Real Sociedad': ['yth'], 'Celtic': ['flag'], 'Napoli': ['show'], 'Bologna': ['yth']
};
/** @type {Dict<string>} the first coach's style → trait */
G.mgrId.STY = { giovani: 'yth', offensivo: 'show', difensivo: 'solid', motivatore: 'flag', tattico: 'solid' };

/** @param {World} W @param {Club} club @returns {string[]} 1 or 2 traits */
G.mgrId.traits = function (W, club) {
  if (G.mgrId.HAND[club.name]) return G.mgrId.HAND[club.name];
  var co = W.coaches[club.id], first = co ? G.mgrId.STY[co.sty] : '', h = G.mgrDeal.hash('idt:' + club.name), t = [first || 'solid'];
  // W.coaches[club.id] is the coach the world gave the club (G.coaches.generate). The second: rich clubs want names, small ones a tidy budget, Spain, the Netherlands and Portugal their academy
  var two = club.rep >= 80 ? 'star' : club.rep < 66 ? 'fin' : ['ESP', 'NED', 'POR'].indexOf(club.nat) >= 0 ? 'yth' : ['show', 'flag', 'fin', 'solid'][h % 4];
  if (two !== t[0] && (h >>> 3) % 3 > 0) t.push(two);
  return t;
};
/** @param {World} W @param {Club} club @returns {string} the traits as chips */
G.mgrId.chips = function (W, club) {
  return G.mgrId.traits(W, club).map(function (k) { var x = G.mgrId.T[k]; return '<span class="chip" title="' + x[2] + '">' + x[0] + ' ' + x[1] + '</span>'; }).join(' ');
};

// ---------- the goal of the board ----------
/** @param {State} st @param {Club} club @returns {BoardGoal} */
G.mgrId.goal = function (st, club) {
  var tr = G.mgrId.traits(st.world, club);
  var cap = G.world.wageCap(club), bill = G.world.wageBill(st.world, club);
  // Conti in ordine: within the cap, or no more wages than today (cap); up to the board's limit it is half done (lim)
  return { k: 'idt', txt: 'Identità: ' + tr.map(function (k) { return G.mgrId.T[k][1] + ' (' + G.mgrId.T[k][2] + ')'; }).join('; '), imp: 'media', st: 'mid',
    cap: G.mgrDeal.r1(Math.max(cap, bill)), lim: G.mgrDeal.r1(Math.max(cap * 1.1, bill * 1.05)) };
};

// One trait now, for the managed club: 1 ok, 0.5 mid, 0 ko (g the goal of identity, for the wages)
/** @param {State} st @param {string} k @param {BoardGoal} g @returns {number} */
G.mgrId.judge = function (st, k, g) {
  var m = G.mgr.job(st), W = st.world, S = G.sure(st.S), club = W.clubs[m.club], tab = S.lg[club.lg].tab, ids = S.lg[club.lg].ids;
  var exp = ids.slice().sort(function (a, b) { return W.clubs[b].str - W.clubs[a].str; }).indexOf(club.id) + 1;
  /** @param {number} c @param {number} dir */
  var rank = function (c, dir) { return ids.filter(function (x) { return (tab[x][c] - tab[club.id][c]) * dir > 0; }).length + 1; };
  if (k === 'yth') { var y = G.mgrBoard.young(st); return y >= 2 ? 1 : y === 1 ? 0.5 : 0; }
  var bent = G.mgrTac.bent(m);  // the tactic and the levers (M9 S6)
  if (k === 'show') { var a = rank(4, 1); return bent === 'def' || a > exp + 2 ? 0 : bent === 'att' && a <= exp ? 1 : 0.5; }
  if (k === 'solid') { var d = rank(5, -1); return d > exp + 2 ? 0 : (d < exp || d === 1) && bent !== 'att' ? 1 : 0.5; }
  if (k === 'fin') { var b = G.world.wageBill(W, club) - Math.max(0, m.wageRoom || 0); return b <= (g.cap || 0) ? 1 : b <= (g.lim || 0) ? 0.5 : 0; }
  if (k === 'star') return m.big ? 1 : S.block < 2 ? 0.5 : 0;
  return m.soldOwn ? 0 : 1;
};
/** @param {State} st @param {BoardGoal} g @returns {[BoardState, boolean]} */
G.mgrId.state = function (st, g) {
  var tr = G.mgrId.traits(st.world, st.world.clubs[G.mgr.job(st).club]), v = 0;
  tr.forEach(function (k) { v += G.mgrId.judge(st, k, g); });
  v /= tr.length;
  return [v >= 0.75 ? 'ok' : v <= 0.25 ? 'ko' : 'mid', true];
};

// The end of the season: the patience, the fans and the manager's record per trait
/** @param {State} st */
G.mgrId.seasonEnd = function (st) {
  var I = G.CFG2.MGR_ID, m = G.mgr.job(st), club = st.world.clubs[m.club], g = (m.goals || []).filter(function (x) { return x.k === 'idt'; })[0];
  if (!g) return;
  var s = m.style || (m.style = {}), goal = g;
  Object.keys(G.mgrId.T).forEach(function (k) { var v = G.mgrId.judge(st, k, goal); s[k] = G.clamp((s[k] || 0) + (v === 1 ? 1 : v === 0 ? -1 : 0), -3, 3); });
  if (g.st === 'ok') { m.pat = Math.min(I.PAT_LIM[1], m.pat + I.PAT[0]); G.life.fans(st, club.id, I.FANS); G.news(st, '🤝 Hai rispettato l’identità del ' + club.name + ': società più paziente (+' + I.PAT[0] + '), tifosi contenti'); }
  if (g.st === 'ko') { m.pat = Math.max(I.PAT_LIM[0], m.pat - I.PAT[1]); G.news(st, '😠 Al ' + club.name + ' dicono che hai tradito l’identità del club: società meno paziente (−' + I.PAT[1] + ')'); }
};

// A signing above the squad's level counts as a big one; a home-grown player sold hurts a club of Bandiere
/** @param {State} st @param {Npc} pl */
G.mgrId.bought = function (st, pl) { var m = G.mgr.job(st); if (pl.o >= st.world.clubs[m.club].str + G.CFG2.MGR_ID.BIG) m.big = (m.big || 0) + 1; };
/** @param {State} st @param {Npc} pl the player, still at the club */
G.mgrId.sold = function (st, pl) {
  var I = G.CFG2.MGR_ID, m = G.mgr.job(st), club = st.world.clubs[m.club];
  m.sales = (m.sales || 0) + 1;  // for the board's requests (M9 S4)
  if (pl.hg !== club.id && pl.a > I.OWN_AGE) return;
  m.soldOwn = (m.soldOwn || 0) + 1;
  if (G.mgrId.traits(st.world, club).indexOf('flag') < 0) return;
  m.pat = Math.max(I.PAT_LIM[0], m.pat - I.FLAG_PAT);
  G.news(st, '🏳️ I tifosi del ' + club.name + ' non perdonano la cessione di ' + pl.n + ': società meno paziente (−' + I.FLAG_PAT + ')');
};

// ---------- the manager's style, for the interest of a club (M10.3) ----------
// His record on the club's traits, plus how he plays today (tactic and levers, M9 S6) for Spettacolo and Solidità: −2..+2
/** @param {State} st @param {Club} club @returns {number} */
G.mgrId.fit = function (st, club) {
  var m = st.mgr, s = m && m.style || {}, tac = m ? G.mgrTac.bent(m) : 'bal', f = 0;
  G.mgrId.traits(st.world, club).forEach(function (k) {
    f += s[k] || 0;
    if (k === 'show') f += tac === 'att' ? 1 : tac === 'def' ? -1 : 0;
    if (k === 'solid') f += tac === 'def' ? 1 : tac === 'att' ? -1 : 0;
  });
  return G.clamp(f, -2, 2);
};

// ---------- the interview (M10.4): 2 questions, a third on the young when the club cares ----------
/** @type {{ k: string, q: string, o: string[][] }[]} answers: [value, text] */
G.mgrId.Q = [
  { k: 'play', q: 'Che calcio vuoi fare?', o: [['att', 'Offensivo: pressing alto, costruzione corta, linea alta'], ['bal', 'Equilibrato'], ['def', 'Prima non prenderle: pressing basso, palla lunga, linea bassa']] },
  { k: 'mkt', q: 'Cosa ti serve dal mercato?', o: [['star', 'Un grande nome'], ['fin', 'Pochi ritocchi, i conti vengono prima'], ['yth', 'Spazio ai giovani che ci sono']] },
  { k: 'yth', q: 'Quanto lavori con i giovani?', o: [['lots', 'Molto: li faccio giocare'], ['some', 'Il giusto'], ['ready', 'Gioca solo chi è pronto']] }
];
/** @type {Dict<Dict<number>>} answer → trait → +1 right, −1 wrong */
G.mgrId.FIT = {
  att: { show: 1, solid: -1 }, def: { solid: 1, show: -1 }, star: { star: 1, fin: -1 }, fin: { fin: 1, star: -1 },
  yth: { yth: 1, flag: 1, star: -1 }, lots: { yth: 1, flag: 1 }, ready: { yth: -1, flag: -1 }
};
/** @param {World} W @param {Club} club @returns {{ k: string, q: string, o: string[][] }[]} */
G.mgrId.questions = function (W, club) {
  var tr = G.mgrId.traits(W, club);
  return G.mgrId.Q.filter(function (x) { return x.k !== 'yth' || tr.indexOf('yth') >= 0 || tr.indexOf('flag') >= 0; });
};
/** @param {State} st @param {Club} club @returns {boolean} interested enough for an interview */
G.mgrId.interview = function (st, club) { return G.mgrJobs.interest(st, club) >= G.CFG2.MGR_ID.TALK; };
/** @param {World} W @param {Club} club @param {Dict<string>} ans @returns {number} what the answers add to the chance */
G.mgrId.answers = function (W, club, ans) {
  var I = G.CFG2.MGR_ID, tr = G.mgrId.traits(W, club), d = 0;
  Object.keys(ans).forEach(function (q) { var f = G.mgrId.FIT[ans[q]] || {}; tr.forEach(function (k) { d += (f[k] || 0) > 0 ? I.IV[0] : (f[k] || 0) < 0 ? -I.IV[1] : 0; }); });
  return Math.round(d * 100) / 100;
};
