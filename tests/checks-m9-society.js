// Quick checks for M9 S4 (M11.9), for tests/checks-m9.js: the board (js/mgr-pact.js, js/mgr-asks.js)
//   levels     the 4 levels: budget, advance, the goal, the board's no; changing level undoes the old one
//   exp        8 seasons alternating "Ambizioso" and "Ricostruzione": exp within −2..+4, the goal inside the table;
//              the example of M11.4 (Bologna 6th goal, 4th: 1.6)
//   old        a save with no pact and no exp: the goal is today's
//   asks       a request with its chance; the board's request answered by the vice
'use strict';

const { bologna } = require('./checks-deal');
const { manager } = require('./scenarios');

function levels(load) {
  const G = load(), out = [], st = bologna(G, 181), m = st.mgr, club = st.world.clubs[m.club], P = G.CFG2.PACT;
  const b0 = club.bud, t0 = m.obj.tgt;
  if (!m.pact || m.pact.lvl !== 'norm' || !m.pact.open) out.push('the first pact is not an open "Normale"');
  m.conf = 60;
  G.mgrPact.set(st, 'amb');
  const extra = Math.round(b0 * P.LV.amb.bud * 10) / 10;
  if (m.pact.lvl !== 'amb' || m.pact.adv !== Math.round(extra * P.ADV * 10) / 10 || club.bud <= b0 || m.obj.tgt !== t0 - 1) out.push('Ambizioso: budget ' + b0 + ' → ' + club.bud + ', advance ' + m.pact.adv + ', goal ' + t0 + ' → ' + m.obj.tgt);
  if (G.mgrPact.set(st, 'all').indexOf('no') < 0 || m.pact.lvl !== 'amb') out.push('Tutto per vincere with confidence 60 is not refused');
  G.mgrPact.set(st, 'reb');
  if (Math.abs(club.bud - (b0 - Math.round(b0 * 0.3 * 10) / 10)) > 0.11 || m.conf !== 70 || m.obj.tgt !== Math.min(m.obj.n - 1, t0 + 2)) out.push('Ricostruzione: budget ' + club.bud + ', confidence ' + m.conf + ', goal ' + m.obj.tgt);
  G.mgrPact.set(st, 'norm');
  if (Math.abs(club.bud - b0) > 0.11 || m.conf !== 60 || m.obj.tgt !== t0) out.push('back to Normale: budget ' + club.bud + ' (was ' + b0 + '), confidence ' + m.conf + ', goal ' + m.obj.tgt);
  m.conf = 20;
  if (!G.mgrPact.no(st, 'amb') || G.mgrPact.no(st, 'reb')) out.push('with confidence 20 only Normale or Ricostruzione');
  m.conf = 60;
  // the example of M11.4: goal 6th with Ambizioso, 4th at the end → exp 1.6
  club.exp = 0; m.pact = { lvl: 'amb', bud: 0, adv: 0, pres: 0, sh: 1, y: 0, cf: 0, open: 0 }; m.obj.tgt = 6;
  G.mgrPact.seasonEnd(st, 4, 0, false);
  if (club.exp !== 1.6) out.push('exp after the example of M11.4: ' + club.exp);
  return out;
}

// manager-pact's policy, 8 seasons: exp and the goal stay inside their limits
function exp(load) {
  const G = load(), out = [], st = G.game.newManager({ name: 'Test Manager', nat: 'ITA', bg: 'naz', age: 40, seed: 183 });
  G.mgr.start(st, st.mgrOffers.list[0]);
  for (let s = 0; s < 8 && !st.over; s++) {
    if (G.mgr.active(st)) {
      G.mgrPact.set(st, s % 2 ? 'reb' : 'amb');
      const m = st.mgr, club = st.world.clubs[m.club], e = club.exp || 0;
      if (e < -2 || e > 4 || m.obj.tgt < 1 || m.obj.tgt >= m.obj.n) out.push('season ' + s + ': exp ' + e + ', goal ' + m.obj.tgt + ' of ' + m.obj.n);
    }
    manager(G, st, 1);
  }
  return out;
}

// A save from before S4: no pact, no exp, no president saved: the goal of today
function old(load) {
  const G = load(), out = [], st = bologna(G, 185), m = st.mgr, club = st.world.clubs[m.club];
  const t = m.obj.tgt;
  m.pact = null; delete club.exp; delete club.pres;
  G.mgr.objective(st);
  if (m.obj.tgt !== t) out.push('goal ' + m.obj.tgt + ' instead of ' + t);
  if (G.mgrPact.lv(m) !== G.CFG2.PACT.LV.norm || G.mgrPact.pres(club) !== 'pat') out.push('not "Normale", or Bologna\'s president is not the one written by hand');
  return out;
}

function asks(load) {
  const G = load(), out = [], st = bologna(G, 187), m = st.mgr, club = st.world.clubs[m.club];
  const p = G.mgrAsk.chance(st, 'bud');
  if (!(p >= 0.1 && p <= 0.9)) out.push('chance ' + p);
  const b0 = club.bud, t = G.mgrAsk.ask(st, 'bud');
  if (m.asks.length !== 1 || (m.asks[0].ok ? club.bud <= b0 : club.bud !== b0)) out.push('emergency budget: ' + t);
  if (!/già fatta/.test(G.mgrAsk.ask(st, 'wage'))) out.push('a second request in the same window');
  m.breq = null; m.sales = 0; club.bud = -1;
  G.mgrAsk.window(st);
  if (!m.breq || m.breq.k !== 'sell') return out.concat('no request to sell with the accounts in the red');
  G.mgrAsk.block(st);
  if (m.breq && !m.breq.acc) out.push('the vice did not say yes');
  return out;
}

const CHECKS = [
  { t: 'M9 S4: the pact\'s 4 levels, the board\'s no, a level undone; the expectations of M11.4', f: levels },
  { t: 'M9 S4: 8 seasons alternating Ambizioso and Ricostruzione, exp within −2..+4 and the goal in the table', f: exp },
  { t: 'M9 S4: a save with no pact and no exp keeps today\'s goal', f: old },
  { t: 'M9 S4: a request with its chance, one per window; the board asks to sell and the vice says yes', f: asks }
];

module.exports = { CHECKS };
