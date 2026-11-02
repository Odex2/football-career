// @ts-check
// The player's positions (M9 S5 phase P): 11 positions over the 6 roles of the engine, which
// stay the place in squads, XIs and matches (p.role is always the role of p.pos). Familiarity per position, the
// overall in each one, growing by playing there or with the focus "Imparare la posizione", asking the coach to move,
// the coach's proposal (the card of events-data3.js), and what each position brings in goals, fame and value.
//   p.pos where he plays · p.main his main position · p.fam { pos: 0..100 } · p.famY { pos: last year he started there }
//   · p.posAsk { y, b, n } his last request. Its random choices use numbers of their own (G.pos.rng)

G.pos = {};
/** @type {Dict<{ n: string, r: RoleKey, side?: string, g: number, a: number, fame: number, val: number }>} name, role of the
 *  engine, side (D right, S left), goals and assists against the role's, fame per goal, market value */
G.POS = {
  POR: { n: 'Portiere', r: 'POR', g: 1, a: 1, fame: 1, val: 1 },
  DC: { n: 'Difensore centrale', r: 'DC', g: 1, a: 1, fame: 1, val: 1 },
  TD: { n: 'Terzino destro', r: 'TS', side: 'D', g: 1, a: 1, fame: 1, val: 1 },
  TS: { n: 'Terzino sinistro', r: 'TS', side: 'S', g: 1, a: 1, fame: 1, val: 1 },
  MED: { n: 'Mediano', r: 'CC', g: 0.55, a: 0.7, fame: 1, val: 0.94 },
  REG: { n: 'Regista', r: 'CC', g: 0.7, a: 1.3, fame: 1, val: 1.06 },
  CC: { n: 'Mezzala', r: 'CC', g: 1, a: 1, fame: 1, val: 1 },
  TRQ: { n: 'Trequartista', r: 'CC', g: 1.6, a: 1.25, fame: 1.2, val: 1.05 },
  ED: { n: 'Esterno destro', r: 'ES', side: 'D', g: 1, a: 1, fame: 1, val: 1 },
  ES: { n: 'Esterno sinistro', r: 'ES', side: 'S', g: 1, a: 1, fame: 1, val: 1 },
  ALA: { n: 'Ala', r: 'ES', g: 1.3, a: 0.9, fame: 1.2, val: 1.03 },
  SP: { n: 'Seconda punta', r: 'ATT', g: 0.8, a: 1.6, fame: 1.2, val: 1 },
  PP: { n: 'Prima punta', r: 'ATT', g: 1, a: 1, fame: 1.2, val: 1 }
};
// The positions that are not a role of today have their own weights; the others use G.WEIGHTS of their role
/** @type {Dict<Dict<number>>} */
G.POS_WEIGHTS = {
  MED: { mar: 0.18, con: 0.2, pos: 0.16, res: 0.14, pas: 0.12, for: 0.1, vis: 0.04, fre: 0.04, vel: 0.02 },
  REG: { pas: 0.28, vis: 0.24, fre: 0.14, pos: 0.1, dri: 0.06, tir: 0.06, con: 0.06, res: 0.06 },
  TRQ: { vis: 0.22, dri: 0.2, tir: 0.16, pas: 0.14, fin: 0.1, fre: 0.1, vel: 0.06, res: 0.02 },
  ALA: { vel: 0.24, dri: 0.24, fin: 0.16, tir: 0.08, fre: 0.08, pas: 0.08, vis: 0.06, res: 0.06 },
  SP: { dri: 0.2, pas: 0.16, fin: 0.18, vis: 0.14, fre: 0.1, tir: 0.08, vel: 0.1, pos: 0.04 }
};
// Neighbours: where a player of a position can learn to play (the familiarity of creation, the coach's proposals)
/** @type {Dict<string[]>} */
G.pos.NEAR = {
  POR: [], DC: ['MED', 'TD', 'TS'], TD: ['TS', 'ED', 'DC'], TS: ['TD', 'ES', 'DC'], MED: ['DC', 'REG', 'CC'], REG: ['MED', 'CC', 'TRQ'],
  CC: ['REG', 'MED', 'TRQ'], TRQ: ['CC', 'SP', 'REG'], ED: ['ES', 'ALA', 'TD'], ES: ['ED', 'ALA', 'TS'], ALA: ['ED', 'ES', 'SP'], SP: ['TRQ', 'PP', 'ALA'], PP: ['SP']
};

/** @param {string} k @returns {Dict<number>} */
G.pos.weights = function (k) { return G.POS_WEIGHTS[k] || G.WEIGHTS[G.POS[k].r]; };
// The position of a role as it was before S5 (new careers with a role, old saves): the side of the foot
/** @param {RoleKey} role @param {string} foot @returns {string} */
G.pos.std = function (role, foot) { return role === 'ATT' ? 'PP' : role === 'TS' ? (foot === 'S' ? 'TS' : 'TD') : role === 'ES' ? (foot === 'S' ? 'ES' : 'ED') : role; };
/** @param {Player} p @param {string} k @returns {number} the familiarity (100 when nothing is saved: a player from before S5) */
G.pos.fam = function (p, k) { return p.fam ? p.fam[k] || 0 : k === G.pos.of(p) ? 100 : 0; };
/** @param {Player} p @returns {string} */
G.pos.of = function (p) { return p.pos || G.pos.std(p.role, p.foot); };
// The overall in position k: its weights, less (100 − familiarity) × FAM, less SIDE on the side of the weaker foot
/** @param {Player} p @param {string} k @returns {number} */
G.pos.ovrAt = function (p, k) {
  var P = G.CFG2.POS, w = G.pos.weights(k), s = 0, side = G.POS[k].side;
  Object.keys(w).forEach(function (a) { s += p.attrs[a] * w[a]; });
  return s - (100 - G.pos.fam(p, k)) * P.FAM - (side && p.foot !== 'A' && p.foot !== side ? P.SIDE : 0);
};
/** @param {Player} p @returns {string} 'MED · Mediano' */
G.pos.label = function (p) { var k = G.pos.of(p); return k + ' · ' + G.POS[k].n; };
/** @param {State} st @param {string} k @returns {Rng} numbers of their own, the same for the same career, day and key */
G.pos.rng = function (st, k) { var S = st.S; return G.makeRng(G.mgrDeal.hash('pos:' + st.seed + ':' + (S ? S.year * 10 + S.block : st.year) + ':' + k)); };

// A new player: his position is the main one at 100; 1 or 2 neighbours between FAM0 (from a key of his own, so the
// world and the other random numbers are the same)
/** @param {Player} p @param {string} key */
G.pos.init = function (p, key) {
  var P = G.CFG2.POS, k = G.pos.of(p), rng = G.makeRng(G.mgrDeal.hash('posinit:' + key)), near = G.pos.NEAR[k].slice(), n = Math.min(near.length, rng.int(1, 2));
  p.pos = k; p.main = k; p.role = G.POS[k].r; p.fam = {}; p.famY = {};
  p.fam[k] = 100;
  for (var i = 0; i < n; i++) { var j = rng.int(0, near.length - 1); p.fam[near[j]] = rng.int(P.FAM0[0], P.FAM0[1]); near.splice(j, 1); }
};

// Play in position k from now (asked, proposed or chosen): the role of the engine follows
/** @param {State} st @param {string} k @param {string} why */
G.pos.set = function (st, k, why) {
  var p = st.player;
  if (!G.POS[k] || k === G.pos.of(p)) return;
  if (!p.fam) G.pos.init(p, st.seed + ':' + p.name);
  var f = G.sure(p.fam);
  p.pos = k; p.role = G.POS[k].r; f[k] = f[k] || 0; p.ovr = G.player.ovr(p);
  if (p.plan.focus !== 'bal' && p.plan.focus !== 'key' && p.plan.focus !== 'learn' && !G.GROUPS[p.plan.focus]) p.plan.focus = 'bal';
  G.news(st, '🔄 ' + why + ': ora giochi ' + G.POS[k].n.toLowerCase() + ' (' + p.ovr + ' di overall)');
};
// What the player would be in position k: overall, chance to start (the engine's role and its starters)
/** @param {State} st @param {string} k @returns {{ ovr: number, ch: number }} */
G.pos.tryAt = function (st, k) {
  var p = st.player, pos = p.pos, role = p.role, ovr = p.ovr;
  p.pos = k; p.role = G.POS[k].r; p.ovr = G.player.ovr(p);
  var r = { ovr: p.ovr, ch: G.season.startChance(st) };
  p.pos = pos; p.role = role; p.ovr = ovr;
  return r;
};

// ---------- growing ----------
// A match started: +START in the position he plays
/** @param {State} st */
G.pos.started = function (st) {
  var p = st.player, k = G.pos.of(p);
  if (!p.fam) return;
  p.fam[k] = Math.min(100, (p.fam[k] || 0) + G.CFG2.POS.START);
  (p.famY = p.famY || /** @type {Dict<number>} */ ({}))[k] = G.sure(st.S).year;
};
// The position the focus "Imparare la posizione" teaches: the one he plays, or else his best one under 100
/** @param {Player} p @returns {string|null} */
G.pos.learning = function (p) {
  var k = G.pos.of(p), f = p.fam || {};
  if ((f[k] || 0) < 100) return k;
  var best = Object.keys(f).filter(function (x) { return f[x] < 100; }).sort(function (a, b) { return f[b] - f[a]; })[0];
  return best || null;
};
// After a block of training
/** @param {State} st */
G.pos.block = function (st) {
  var p = st.player, k = p.plan.focus === 'learn' ? G.pos.learning(p) : null;
  if (k && p.fam) { p.fam[k] = Math.min(100, (p.fam[k] || 0) + G.CFG2.POS.LEARN); p.ovr = G.player.ovr(p); }
};
// The end of a season: a position not played for UNUSED seasons drops DROP (not below MIN, never the main one); a
// position at 100 where he started for more than a season becomes the main one, the old one stays at OLD
/** @param {State} st */
G.pos.seasonEnd = function (st) {
  var P = G.CFG2.POS, p = st.player, y = G.sure(st.S).year, fy = p.famY || {};
  if (!p.fam) return;
  var f = p.fam;
  Object.keys(f).forEach(function (k) { if (k !== p.main && y - (fy[k] === undefined ? -99 : fy[k]) >= P.UNUSED && f[k] > P.MIN) f[k] = Math.max(P.MIN, f[k] - P.DROP); });
  var k = G.pos.of(p);
  if (k !== p.main && f[k] >= 100 && (p.famS = (p.famS || 0) + 1) > 1) {
    if (p.main) f[p.main] = Math.min(f[p.main] || 0, P.OLD);
    p.main = k; p.famS = 0;
    G.news(st, '🧭 ' + G.POS[k].n + ' è ormai la tua posizione principale');
  } else if (k === p.main) p.famS = 0;
  p.ovr = G.player.ovr(p);
};

// ---------- asking the coach (P3) ----------
// The chance that the coach says yes: the team's need (how much more he would start there), the relationship, the
// overall there against today's; a second request in the same season starts lower
/** @param {State} st @param {string} k @returns {number} */
G.pos.askChance = function (st, k) {
  var P = G.CFG2.POS.ASK, p = st.player, W = st.world, co = G.coaches.of(W, W.clubs[p.clubId]), now = G.pos.tryAt(st, G.pos.of(p)), there = G.pos.tryAt(st, k);
  var rel = co ? (p.rel[co.i] || 0) : 0, again = p.posAsk && p.posAsk.y === G.sure(st.S).year ? p.posAsk.n : 0;
  var x = P.BASE + (there.ch - now.ch) * P.NEED + rel * P.REL + (there.ovr - now.ovr) * P.OVR - again * P.AGAIN;
  return Math.round(G.clamp(x, P.P[0], P.P[1]) * 100) / 100;
};
/** @param {State} st @returns {string} why he cannot ask now ('' = he can) */
G.pos.cannotAsk = function (st) {
  var p = st.player, S = G.sure(st.S), a = p.posAsk;
  if (st.mgr) return 'no';
  if (S.block >= 4) return 'nel blocco delle finali';
  return a && a.y === S.year && a.b === S.block ? 'una richiesta per blocco: già fatta' : '';
};
// Ask to play in position k: yes, he plays there; no, −NO of relationship (more for a second request)
/** @param {State} st @param {string} k @returns {string} */
G.pos.ask = function (st, k) {
  var P = G.CFG2.POS.ASK, p = st.player, S = G.sure(st.S), W = st.world, co = G.coaches.of(W, W.clubs[p.clubId]), why = G.pos.cannotAsk(st);
  if (why || !G.POS[k] || k === G.pos.of(p) || k === 'POR' || G.pos.of(p) === 'POR') return why ? 'Non puoi chiedere: ' + why + '.' : '';
  var ch = G.pos.askChance(st, k), n = p.posAsk && p.posAsk.y === S.year ? p.posAsk.n + 1 : 1;
  p.posAsk = { y: S.year, b: S.block, n: n };
  if (G.pos.rng(st, 'ask:' + k).chance(ch)) { G.pos.set(st, k, 'Il mister dice sì'); return '✅ Il mister dice sì: da ora giochi ' + G.POS[k].n.toLowerCase() + '.'; }
  if (co) p.rel[co.i] = G.clamp((p.rel[co.i] || 0) - P.NO * n, -100, 100);
  return '❌ Il mister dice no: relazione −' + P.NO * n + '.';
};

// ---------- the coach's proposal (the card "Il mister ti propone un nuovo ruolo") ----------
// A neighbouring position where the player keeps most of his overall and starts more
/** @param {State} st @returns {RoleSwap|null} */
G.pos.proposal = function (st) {
  var p = st.player, k = G.pos.of(p), now = G.season.startChance(st), ovr = p.ovr, /** @type {RoleSwap|null} */ best = null;
  G.pos.NEAR[k].forEach(function (x) {
    var t = G.pos.tryAt(st, x);
    if (t.ovr >= ovr - G.CFG.ROLE_SWAP.OVR && t.ch >= now + G.CFG.ROLE_SWAP.GAIN && (!best || t.ch > best.ch)) best = { to: G.POS[x].r, pos: x, ovr: t.ovr, ch: t.ch, now: now };
  });
  return best;
};

// ---------- what each position brings (P4) ----------
/** @param {Player} p @returns {number[]} goals and assists against the role's average */
G.pos.ga = function (p) { var x = G.POS[G.pos.of(p)]; return [x.g, x.a]; };
/** @param {Player} p @returns {number} fame per goal against the role's */
G.pos.fameX = function (p) { return G.POS[G.pos.of(p)].fame; };
/** @param {Player} p @returns {number} market value against the overall's */
G.pos.valX = function (p) { return G.POS[G.pos.of(p)].val; };
/** @param {Player} p @returns {boolean} a defender: clean sheets count for fame and awards */
G.pos.def = function (p) { return ['DC', 'TD', 'TS', 'MED'].indexOf(G.pos.of(p)) >= 0; };
