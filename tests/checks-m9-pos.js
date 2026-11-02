// Quick checks for M9 S5 (P6), for tests/checks-m9.js: the player's positions (js/positions.js)
//   same      the standard position of each of the 6 roles of before gives the same overall, to the last digit
//   created   a new TRQ, MED and SP: his position at 100, 1 or 2 neighbours between 55 and 75, the role of the engine
//   fam       two seasons with requests and the focus "Imparare la posizione": familiarity within 0..100; a yes
//             really moves him, and his starts there raise it
//   old       a save from before S5 gets the standard position at 100; the weaker foot costs 1
//   names     no surname is only a particle ("Thijs de"): surnames of two words stay whole (js/names.js, S5)
'use strict';

function same(load) {
  const G = load(), out = [];
  Object.keys(G.ROLES).forEach(role => ['D', 'S', 'A'].forEach((foot, i) => {
    const p = G.game.newCareer({ name: 'Test ' + role, nat: 'ITA', role: role, foot: foot, seed: 191 + i }).player, w = G.WEIGHTS[role];
    let o = 0;
    Object.keys(w).forEach(k => { o += p.attrs[k] * w[k]; });
    if (o !== G.player.ovrRaw(p) || G.POS[p.pos].r !== role) out.push(role + ' ' + foot + ' (' + p.pos + '): ' + G.player.ovrRaw(p) + ' instead of ' + o);
  }));
  return out;
}

function created(load) {
  const G = load(), out = [], P = G.CFG2.POS;
  ['TRQ', 'MED', 'SP'].forEach((k, i) => {
    const p = G.game.newCareer({ name: 'Test ' + k, nat: 'ITA', pos: k, role: G.POS[k].r, foot: 'D', seed: 195 + i }).player, others = Object.keys(p.fam).filter(x => x !== k);
    if (p.pos !== k || p.main !== k || p.role !== G.POS[k].r || p.fam[k] !== 100) out.push(k + ': pos ' + p.pos + ', role ' + p.role + ', fam ' + p.fam[k]);
    if (others.length < 1 || others.length > 2 || others.some(x => G.pos.NEAR[k].indexOf(x) < 0 || p.fam[x] < P.FAM0[0] || p.fam[x] > P.FAM0[1])) out.push(k + ': neighbours ' + JSON.stringify(p.fam));
    if (Math.abs(p.ovr - Math.round(G.pos.ovrAt(p, k))) > 0) out.push(k + ': overall ' + p.ovr);
  });
  return out;
}

function fam(load) {
  const G = load(), out = [], st = G.game.newCareer({ name: 'Test Mediano', nat: 'ITA', pos: 'MED', role: 'CC', foot: 'D', seed: 199 }), p = st.player;
  const k = Object.keys(p.fam).filter(x => x !== 'MED')[0], lim = G.CFG2.POS.ASK.P;
  G.CFG2.POS.ASK.P = [1, 1];  // the coach says yes
  G.pos.ask(st, k);
  G.CFG2.POS.ASK.P = lim;
  if (p.pos !== k || p.role !== G.POS[k].r) return ['a yes did not move him: ' + p.pos];
  const f0 = p.fam[k], starts0 = st.S.ps.starts;
  p.plan.focus = 'learn';
  for (let i = 0; i < 9 && !st.over; i++) {
    G.game.next(st, true); st.recap = null; st.event = null;
    Object.keys(p.fam).forEach(x => { if (!(p.fam[x] >= 0 && p.fam[x] <= 100)) out.push('familiarity ' + x + ' ' + p.fam[x]); });
    if (st.S.block === 1 && !G.pos.cannotAsk(st)) G.pos.ask(st, 'REG');
  }
  if (p.pos === k && !(p.fam[k] > f0)) out.push('familiarity in ' + k + ' still ' + p.fam[k] + ' after the focus and ' + (st.S.ps.starts - starts0) + ' starts');
  return out;
}

function old(load) {
  const G = load(), out = [], st = G.game.newCareer({ name: 'Test Ala', nat: 'ITA', role: 'ES', foot: 'S', seed: 201 }), p = st.player;
  delete p.pos; delete p.main; delete p.fam; delete p.famY;
  G.save.restore(st);
  if (p.pos !== 'ES' || p.fam.ES !== 100 || Object.keys(p.fam).length !== 1) out.push('old save: ' + p.pos + ' ' + JSON.stringify(p.fam));
  p.fam.ED = 100;
  if (Math.abs(G.pos.ovrAt(p, 'ED') - G.pos.ovrAt(p, 'ES') + G.CFG2.POS.SIDE) > 1e-9) out.push('the weaker foot does not cost ' + G.CFG2.POS.SIDE);
  return out;
}

function names(load) {
  const G = load(), out = [], PART = /^(el|al|de|da|di|do|du|le|la|van|von|der|den|dos|del|ten|ter)$/i;
  Object.keys(G.DATA.names).forEach(nat => G.DATA.names[nat][1].split(' ').forEach(s => { if (PART.test(s)) out.push(nat + ': surname ' + s); }));
  const rng = G.makeRng(7);
  for (let i = 0; i < 300; i++) ['NED', 'BEL', 'MAR'].forEach(nat => {
    const n = G.squads.name(nat, rng);
    if (/_/.test(n) || PART.test(G.squads.sur(n))) out.push(nat + ': ' + n);
  });
  return [...new Set(out)];
}

const CHECKS = [
  { t: 'M9 S5: the standard position of each role gives the overall of before', f: same },
  { t: 'M9 S5: a new TRQ, MED and SP with their position at 100 and 1 or 2 neighbours', f: created },
  { t: 'M9 S5: a yes moves the player, familiarity grows and stays within 0..100', f: fam },
  { t: 'M9 S5: an old save gets the standard position; the weaker foot costs 1', f: old },
  { t: 'M9 S5: no surname is only a particle (de Jong, El Khannouss stay whole)', f: names }
];

module.exports = { CHECKS };
