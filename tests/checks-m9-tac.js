// Quick checks for M9 S6 (M1), for tests/checks-m9.js: the tactic's levers (js/mgr-tactics.js)
//   counter   against every style the counter gains, the worst loses, medium is 0; no lever moves goals beyond CAP
//   fam       the same system +GROW a match (once, a live match too), a lever −LEVER, the formation −FORM; the malus
//   vice      a new manager plays medium levers, with the goals of before; a new club starts at START; the interview
//             sets the levers; an old save has no levers and no malus; Spettacolo follows tactic and levers
'use strict';

function job(G, seed) {
  const st = G.game.newManager({ name: 'Test Manager', nat: 'ITA', bg: 'prov', age: 40, seed: seed || 71 });
  const club = st.world.clubs.find(c => c.name === 'Bologna');
  G.mgr.start(st, { club: club.id, fans: 0, perks: null, bandiera: 0 });
  return st;
}

function counter(load) {
  const G = load(), T = G.mgrTac, out = [], cap = G.CFG2.TAC.CAP, st = job(G), W = st.world;
  const sum = e => e[0] + e[1];
  for (let p = 0; p < 3; p++) for (let b = 0; b < 3; b++) for (let l = 0; l < 3; l++) for (let f = 0; f < 2; f++) {
    const o = { press: p, build: b, line: l, fast: f }, best = T.effect(T.counter(o), o), worst = T.effect(T.counter(o, -1), o);
    if (!(sum(best) > 0) || !(sum(worst) < 0)) out.push('style ' + JSON.stringify(o) + ': best ' + best + ', worst ' + worst);
    if (sum(T.effect({ press: 1, build: 1, line: 1 }, o)) !== 0) out.push('medium levers move the goals');
    for (let x = 0; x < 27; x++) { const e = T.effect({ press: x % 3, build: Math.floor(x / 3) % 3, line: Math.floor(x / 9) }, o); if (Math.abs(e[0]) > cap + 1e-9 || Math.abs(e[1]) > cap + 1e-9) out.push('beyond the cap: ' + e); }
  }
  // the style of every club of the league comes with no random numbers: twice the same, levers within 0..2
  const clubs = W.clubs.filter(c => c.lg === W.clubs[st.mgr.club].lg);
  clubs.forEach(c => { const a = JSON.stringify(T.style(W, c)), b = JSON.stringify(T.style(W, c)); if (a !== b || !/^\{"press":[012],"build":[012],"line":[012],"fast":[01]\}$/.test(a)) out.push(c.name + ' ' + a); });
  if (new Set(clubs.map(c => JSON.stringify(T.style(W, c)))).size < 3) out.push('the league has less than 3 styles');
  if (!/Di solito gioca con|senza un sistema/.test(T.generic(W, clubs[1]))) out.push('no generic style: ' + T.generic(W, clubs[1]));
  return out;
}

function fam(load) {
  const G = load(), T = G.mgrTac, F = G.CFG2.TAC.FAM, out = [], st = job(G), m = st.mgr;
  if (T.fam(m) !== F.START) out.push('a new club starts at ' + T.fam(m));
  const opp = st.world.clubs.find(c => c.lg === st.world.clubs[m.club].lg && c.id !== m.club).id;
  st.S.today = 1; T.beforeMatch(st, opp);
  st.S.today = 2; T.beforeMatch(st, opp); T.beforeMatch(st, opp);
  if (T.fam(m) !== F.START + F.GROW) out.push('the same system: ' + T.fam(m) + ' instead of ' + (F.START + F.GROW));
  T.set(st, 'press', 2); T.set(st, 'line', 0);
  st.S.today = 3; T.beforeMatch(st, opp);
  if (T.fam(m) !== F.START + F.GROW - 2 * F.LEVER) out.push('two levers: ' + T.fam(m));
  G.mgrTeam.setForm(st, m.form === '4-3-3' ? '4-4-2' : '4-3-3');
  st.S.today = 4; T.beforeMatch(st, opp);
  if (T.fam(m) !== F.START + F.GROW - 2 * F.LEVER - F.FORM) out.push('a formation: ' + T.fam(m));
  const s0 = G.mgrTeam.side(st, st.world.clubs[m.club]).str, f0 = m.tfam;
  m.tfam = 0;
  const s1 = G.mgrTeam.side(st, st.world.clubs[m.club]).str;
  if (Math.abs(s0 - s1 - F.MAL * (f0 < F.LOW ? f0 / F.LOW : 1)) > 1e-9) out.push('the malus at 0: ' + (s0 - s1).toFixed(3));
  if (G.mgrTac.tire(m) !== G.CFG2.TAC.TIRE) out.push('a high press does not tire');
  return out;
}

function vice(load) {
  const G = load(), T = G.mgrTac, out = [], st = job(G), m = st.mgr, W = st.world;
  const opp = W.clubs.find(c => c.lg === W.clubs[m.club].lg && c.id !== m.club).id;
  if (JSON.stringify(T.lev(m)) !== '{"press":1,"build":1,"line":1}') out.push('the vice plays ' + JSON.stringify(T.lev(m)));
  const F = G.mgrTeam.FORMS[m.form], Tc = G.mgrTeam.TACTIC[m.tactic];
  if (JSON.stringify(G.mgrTeam.mods(m, W, opp)) !== JSON.stringify([F.atk + Tc[0], F.def + Tc[1]])) out.push('medium levers change the goals');
  if (T.bent(m) !== 'bal') out.push('a balanced manager is ' + T.bent(m));
  m.tactic = 'att'; if (T.bent(m) !== 'att') out.push('Offensiva is not attacking');
  m.tactic = 'bal'; T.set(st, 'press', 2); T.set(st, 'line', 2); if (T.bent(m) !== 'att') out.push('pressing and line high are not attacking');
  T.start(st, 'def');
  if (T.lev(m).press !== 0 || T.lev(m).line !== 0 || T.bent(m) !== 'def') out.push('the interview\'s "non prenderle": ' + JSON.stringify(T.lev(m)));
  delete m.lev; delete m.tfam; delete m.tsys;
  if (T.fam(m) !== 100 || T.malus(m) !== 0 || T.lev(m).press !== 1) out.push('an old save: familiarity ' + T.fam(m));
  // a season played all automatic keeps medium levers and a familiarity of 100 at the end
  st.mgr.conf = 100; G.game.simSeason(st);
  if (G.mgr.active(st) && (T.lev(st.mgr).press !== 1 || T.fam(st.mgr) !== 100)) out.push('after a season: ' + JSON.stringify(T.lev(st.mgr)) + ' ' + T.fam(st.mgr));
  return out;
}

const CHECKS = [
  { t: 'M9 S6: the counter gains against every style, the worst loses, medium is 0, within the cap', f: counter },
  { t: 'M9 S6: tactical familiarity grows, a lever and a formation cost, the malus under 50', f: fam },
  { t: 'M9 S6: the vice plays medium levers; a new club, the interview, an old save', f: vice }
];

module.exports = { CHECKS };
