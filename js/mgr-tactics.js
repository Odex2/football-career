// @ts-check
// The tactic's three levers (M9 S6 phase M1): pressing, build-up and defensive line, each low /
// medium / high (0, 1, 2). What they are worth depends on the opponent's style, worked out from his coach and his
// squad with no random numbers; the managed club learns its system (tactical familiarity). Medium on every lever, the
// vice's default, changes nothing: the balance stays as before S6.
//   m.lev { press, build, line } · m.tfam 0..100 · m.tsys the system of the last match ('4-4-2|1|1|1') · m.tkey that match
// Only the managed club's matches use them (G.mgrTeam.mods, G.mgrTeam.side): the players' careers and the AI's matches
// do not change.

G.mgrTac = {};
/** @type {Dict<{ n: string, v: string[] }>} */
G.mgrTac.LEV = {
  press: { n: 'Pressing', v: ['Basso', 'Medio', 'Alto'] },
  build: { n: 'Costruzione', v: ['Corta', 'Mista', 'Lunga'] },
  line: { n: 'Linea difensiva', v: ['Bassa', 'Media', 'Alta'] }
};
// The coach's style as levers (the generic style a manager knows without an analyst)
/** @type {Dict<TacLevers>} */
G.mgrTac.COACH = {
  offensivo: { press: 2, build: 1, line: 2 }, difensivo: { press: 0, build: 2, line: 0 }, tattico: { press: 1, build: 0, line: 1 },
  giovani: { press: 2, build: 1, line: 1 }, motivatore: { press: 1, build: 1, line: 1 }
};

/** @param {Mgr} m @returns {TacLevers} */
G.mgrTac.lev = function (m) { return m.lev || { press: 1, build: 1, line: 1 }; };

// ---------- the opponent's style ----------
/** @param {PlayerId} id @returns {number} a centre-back's height in cm, from his id (no random numbers) */
G.mgrTac.height = function (id) { return 172 + G.mgrDeal.hash('h:' + id) % 25; };
// His coach's levers, moved by the squad: fast forwards (the counter-attack: long ball), a technical midfield (short),
// tall centre-backs (a low line); fast is kept for our line
/** @param {World} W @param {Club} club @returns {TacStyle} */
G.mgrTac.style = function (W, club) {
  var Y = G.CFG2.TAC.STYLE, co = G.coaches.of(W, club), base = G.mgrTac.COACH[co ? co.sty : 'motivatore'] || G.mgrTac.COACH.motivatore;
  var pl = club.sq.map(function (id) { return W.players[id]; }).filter(Boolean).sort(function (a, b) { return b.o - a.o; });
  /** @param {RoleKey[]} rs @param {number} n */
  var top = function (rs, n) { return pl.filter(function (x) { return rs.indexOf(x.r) >= 0; }).slice(0, n); };
  /** @param {Npc[]} l @param {function(Npc): number} f */
  var avg = function (l, f) { return l.length ? l.reduce(function (s, x) { return s + f(x); }, 0) / l.length : 0; };
  var fw = top(['ATT', 'ES'], 4), mid = top(['CC'], 3), dc = top(['DC'], 2), xi = avg(pl.slice(0, 11), function (x) { return x.o; });
  var fast = fw.length > 0 && avg(fw, function (x) { return x.a; }) <= Y.FAST_AGE, good = mid.length > 0 && avg(mid, function (x) { return x.o; }) - xi >= Y.GOOD;
  var tall = dc.length > 0 && avg(dc, function (x) { return G.mgrTac.height(x.i); }) >= Y.TALL;
  var s = { press: base.press, build: base.build, line: base.line, fast: fast ? 1 : 0 };
  if (good && base.build !== 2) s.build = 0;
  if (fast && base.press === 0) s.build = 2;
  if (tall && base.line === 1) s.line = 0;
  return s;
};
// What a manager knows without the analyst (S7): the coach's habits, and what they suffer
/** @param {World} W @param {Club} club @returns {string} */
G.mgrTac.generic = function (W, club) {
  var co = G.coaches.of(W, club), s = G.mgrTac.COACH[co ? co.sty : 'motivatore'] || G.mgrTac.COACH.motivatore, L = G.mgrTac.LEV, does = [], hurts = [];
  if (s.press !== 1) does.push('pressing ' + L.press.v[s.press].toLowerCase());
  if (s.build !== 1) does.push('costruzione ' + L.build.v[s.build].toLowerCase());
  if (s.line !== 1) does.push('linea ' + L.line.v[s.line].toLowerCase());
  if (s.press === 2) hurts.push('i lanci lunghi');
  if (s.line === 2) hurts.push('gli attaccanti veloci');
  if (s.build === 0) hurts.push('il pressing alto');
  if (s.press === 0) hurts.push('chi costruisce dal basso');
  var who = co ? (G.CFG.COACH_STYLES[co.sty] || '').toLowerCase() : '';
  return !does.length ? 'Allenatore senza un sistema riconoscibile' + (who ? ' (' + who + ')' : '') + ': servono i dati di un analista.' :
    'Di solito gioca con ' + does.join(', ') + (who ? ' (' + who + ')' : '') + (hurts.length ? ': soffre ' + hurts.join(' e ') : '') + '. La rosa può cambiare qualcosa.';
};

// ---------- what the levers are worth ----------
/** @param {TacLevers} l @param {TacStyle|null} o @returns {number[]} [our goals, goals we stop], within ±CAP */
G.mgrTac.effect = function (l, o) {
  var T = G.CFG2.TAC, a = 0, d = 0;
  if (!o) return [0, 0];
  /** @param {number[]|undefined} x */
  var add = function (x) { if (x) { a += x[0]; d += x[1]; } };
  if (l.press !== 1) add(T.PRESS[l.press][o.build]);
  if (l.build !== 1) { add(T.BUILD[l.build][o.press]); if (l.build === 2 && o.line === 0) a += T.LONG_LOW; }
  if (l.line !== 1) add(T.LINE[l.line][o.fast]);
  return [G.clamp(a, -T.CAP, T.CAP), G.clamp(d, -T.CAP, T.CAP)];
};
/** @param {Mgr} m @param {World} [W] @param {ClubId} [opp] @returns {number[]} the levers against this opponent */
G.mgrTac.mods = function (m, W, opp) { return W && opp !== undefined && opp >= 0 ? G.mgrTac.effect(G.mgrTac.lev(m), G.mgrTac.style(W, W.clubs[opp])) : [0, 0]; };
// The best levers against a style (the analyst's suggestion in S7, the tests): the most goals gained and stopped
/** @param {TacStyle} o @param {number} [dir] 1 the best, −1 the worst @returns {TacLevers} */
G.mgrTac.counter = function (o, dir) {
  var best = { press: 1, build: 1, line: 1 }, bv = 0, k = dir || 1;
  for (var p = 0; p < 3; p++) for (var b = 0; b < 3; b++) for (var l = 0; l < 3; l++) {
    var e = G.mgrTac.effect({ press: p, build: b, line: l }, o), v = (e[0] + e[1]) * k - (p === 2 ? 0.005 : 0);  // a tie: no tiring press
    if (v > bv + 1e-9) { bv = v; best = { press: p, build: b, line: l }; }
  }
  return best;
};
/** @param {Mgr} m @returns {number} the condition lost in a match, against today's */
G.mgrTac.tire = function (m) { return G.mgrTac.lev(m).press === 2 ? G.CFG2.TAC.TIRE : 1; };

// ---------- tactical familiarity ----------
/** @param {Mgr} m @returns {number} */
G.mgrTac.fam = function (m) { return m.tfam === undefined ? 100 : m.tfam; };
/** @param {Mgr} m @returns {string} */
G.mgrTac.sys = function (m) { var l = G.mgrTac.lev(m); return m.form + '|' + l.press + '|' + l.build + '|' + l.line; };
/** @param {Mgr} m @returns {number} the strength lost under LOW familiarity (≤ 0) */
G.mgrTac.malus = function (m) { var F = G.CFG2.TAC.FAM, f = G.mgrTac.fam(m); return f >= F.LOW ? 0 : -F.MAL * (F.LOW - f) / F.LOW; };
/** @param {string} a @param {string} b @returns {number} what going from system a to b costs */
G.mgrTac.cost = function (a, b) {
  var F = G.CFG2.TAC.FAM, x = a.split('|'), y = b.split('|'), c = x[0] !== y[0] ? F.FORM : 0;
  for (var i = 1; i < 4; i++) if (x[i] !== y[i]) c += F.LEVER;
  return c;
};
// Before a match of the managed club (once, a live match too): a new system costs, the same one is learned
/** @param {State} st @param {ClubId} opp */
G.mgrTac.beforeMatch = function (st, opp) {
  var m = G.mgr.job(st), S = G.sure(st.S), F = G.CFG2.TAC.FAM, key = S.year + ':' + S.today + ':' + opp;
  if (m.tkey === key) return;
  if (G.mgrTac.policy) G.mgrTac.policy(st, opp);  // tests/stats.js only: levers picked before every match
  var sys = G.mgrTac.sys(m), f = G.mgrTac.fam(m);
  m.tfam = !m.tsys ? f : m.tsys === sys ? Math.min(100, f + F.GROW) : Math.max(0, f - G.mgrTac.cost(m.tsys, sys));
  m.tsys = sys; m.tkey = key;
};
/** @type {((st: State, opp: ClubId) => void)|null} */
G.mgrTac.policy = null;
// A new club: its players do not know the system yet; the interview's "Che calcio vuoi fare?" sets the levers (S3)
/** @param {State} st @param {string} [play] att, bal or def */
G.mgrTac.start = function (st, play) {
  var m = G.mgr.job(st);
  m.tfam = G.CFG2.TAC.FAM.START; delete m.tsys; delete m.tkey;
  if (play === 'att') m.lev = { press: 2, build: 0, line: 2 };
  else if (play === 'def') m.lev = { press: 0, build: 2, line: 0 };
};
/** @param {State} st @param {string} k press, build or line @param {number} v */
G.mgrTac.set = function (st, k, v) { var m = G.mgr.job(st), l = G.mgrTac.lev(m); if (G.mgrTac.LEV[k] && v >= 0 && v <= 2) { l = { press: l.press, build: l.build, line: l.line }; l[k] = v; m.lev = l; } };

// How the manager plays, for the club's identity (S3: Spettacolo and Solidità, the interview): the tactic counts 2,
// pressing and line 1 each, a short build-up +1 and a long one −1
/** @param {Mgr} m @returns {string} att, bal or def */
G.mgrTac.bent = function (m) {
  var l = G.mgrTac.lev(m), x = (m.tactic === 'att' ? 2 : m.tactic === 'def' ? -2 : 0) + (l.press - 1) + (l.line - 1) + (1 - l.build);
  return x >= 2 ? 'att' : x <= -2 ? 'def' : 'bal';
};
