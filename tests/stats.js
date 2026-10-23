// Long statistical tests of M8, run by hand at the end of a phase, not by run.js:
//   node tests/stats.js                 every test
//   node tests/stats.js start nt        only some of them
//   node tests/stats.js balance --root=../copy   the same test on another copy of the game (to compare before/after)
//   node tests/stats.js balance --seeds=3        fewer careers (default 16)
// Each test prints its numbers and ✓ or ✗ against the spec's targets.
'use strict';
const path = require('path');
const rootArg = process.argv.find(a => a.startsWith('--root='));
const harness = require(rootArg ? path.resolve(rootArg.slice(7), 'tests', 'harness') : './harness');
const want = process.argv.slice(2).filter(a => !a.startsWith('--'));
let failed = 0;
function verdict(ok, what) { console.log((ok ? '  ✓ ' : '  ✗ ') + what); if (!ok) failed++; }
const pct = x => (x * 100).toFixed(1) + '%';

// A8.1: 1,000 draws of the first club for ITA, ESP and BRA on the same world, against the A3 table
function start() {
  console.log('A8.1 · 1.000 estrazioni del club di partenza (mondo seed 3)');
  const G = harness.load(); G.rng = G.makeRng(3);
  const W = G.world.create(G.rng), rng = G.makeRng(99), top5two = ['ENG2', 'ESP2', 'ITA2', 'GER2', 'FRA2'];
  const table = { ITA: [0.46, 0.22], ESP: [0.48, 0.27], BRA: [0.39, 0] };
  Object.keys(table).forEach(nat => {
    let two = 0, home = 0, rm = 0;
    for (let i = 0; i < 1000; i++) {
      const c = G.game.startClub(W, nat, rng).club;
      if (top5two.indexOf(c.lg) >= 0) two++;
      if (c.nat === nat) home++;
      if (c.name === 'Real Madrid') rm++;
    }
    console.log('  ' + nat + ': seconde divisioni top 5 ' + pct(two / 1000) + ', club del proprio paese ' + pct(home / 1000) + ', Real Madrid ' + rm);
    verdict(Math.abs(two / 1000 - table[nat][0]) <= 0.03 && Math.abs(home / 1000 - table[nat][1]) <= 0.03 && rm <= 1, nat + ' entro ±3 punti dalla tabella A3, Real Madrid al massimo una volta');
  });
}

// A8.2: careers from Ecuador and Bolivia, 6 seasons: the player scores less than 40% of his national team's goals
function nt() {
  console.log('A8.2 · nazionali di Ecuador e Bolivia, 6 stagioni');
  [['ECU', 'ATT', 'random'], ['BOL', 'ATT', 'loan'], ['ECU', 'CC', 'loan'], ['BOL', 'ES', 'random'], ['BRA', 'ATT', 'random'], ['BRA', 'ATT', 'loan']].forEach(([nat, role, startKind], i) => {
    const G = harness.load();
    let me = 0, team = 0;
    const rec = G.national.record;
    G.national.record = function (st, home, opp, r, mp, ga) { if (mp.mins > 0) { me += ga.g; team += r[0]; } return rec.apply(this, arguments); };
    const st = G.game.newCareer({ name: 'Test Player', nat: nat, role: role, foot: 'D', start: startKind, seed: 2000 + i });
    for (let s = 0; s < 6 && !st.over; s++) { G.game.simSeason(st); st.recap = null; st.event = null; }
    const p = st.player;
    console.log('  ' + nat + ' ' + role + ' ' + startKind + ': ' + p.nt.caps + ' presenze, ' + me + ' gol su ' + team + ' della nazionale (' + (team ? pct(me / team) : '-') + ')');
    if (nat !== 'BRA') verdict(!team || me / team < 0.4, nat + ' meno del 40% dei gol della nazionale');
  });
}

// §0: with everything automatic, the managed club's points over 8 seasons (Bologna and Inter, fixed seeds).
// Run it with --root on a copy taken before a phase and compare: the averages must stay within ±3 points.
// One career is chaos (the same club and seed can make 47 or 62 points a season after any change), so the test
// plays 16 of them per club: the average then moves by about ±1 point from noise alone (the ± printed)
const seedsArg = process.argv.find(a => a.startsWith('--seeds='));
function balance() {
  const seeds = Array.from({ length: seedsArg ? +seedsArg.slice(8) : 16 }, (x, i) => 11 * (i + 1));
  console.log('§0 · bilanciamento: punti del club gestito, tutto automatico, 8 stagioni, ' + seeds.length + ' carriere per club');
  ['Bologna', 'Inter'].forEach(name => {
    const all = [];
    seeds.forEach(seed => {
      const G = harness.load(), st = G.game.newManager({ name: 'Test Manager', nat: 'ITA', bg: 'prov', age: 40, seed: seed });
      const club = st.world.clubs.find(c => c.name === name), pts = [];
      G.mgr.start(st, { club: club.id, fans: 0, perks: null, bandiera: 0 });
      const end = G.mgr.seasonEnd;
      G.mgr.seasonEnd = function (s) { if (G.mgr.active(s) && s.mgr.club === club.id) pts.push(s.S.lg[club.lg].tab[club.id][6]); s.mgr.conf = 100; return end.apply(this, arguments); };
      for (let y = 0; y < 8 && G.mgr.active(st); y++) { G.game.simSeason(st); st.recap = null; st.mgrOffers = null; if (st.event) G.mgrEv.apply(st, 0); }
      all.push(...pts);
      console.log('  ' + name + ' seed ' + seed + ': ' + pts.join(' '));
    });
    const avg = all.reduce((a, b) => a + b, 0) / all.length, sd = Math.sqrt(all.reduce((a, b) => a + (b - avg) * (b - avg), 0) / (all.length - 1));
    console.log('  ' + name + ': media ' + avg.toFixed(1) + ' ± ' + (sd / Math.sqrt(all.length)).toFixed(1) + ' punti in ' + all.length + ' stagioni');
  });
}

// J11: two careers of 8 seasons, all automatic: goals per league match and the champions' points (first divisions).
// Run it with --root on a copy taken before phase J and compare: goals within ±2%, champions' points within ±3.
function leagues() {
  console.log('J11 · campionati: gol per partita e punti dei campioni, 2 carriere da 8 stagioni');
  let goals = 0, matches = 0, champ = 0, n = 0;
  [41, 42].forEach(seed => {
    const G = harness.load(), st = G.game.newCareer({ name: 'Test Player', nat: 'ITA', role: 'CC', foot: 'D', start: 'random', seed: seed });
    const end = G.season.end;
    G.season.end = function (s) {
      G.LEAGUES.forEach(L => {
        const tab = s.S.lg[L.key].tab, ids = G.season.sortTable(s.S, L.key);
        ids.forEach(id => { goals += tab[id][4]; matches += tab[id][0]; });
        if (L.tier === 1) { champ += tab[ids[0]][6]; n++; }
      });
      return end.apply(this, arguments);
    };
    for (let y = 0; y < 8 && !st.over; y++) { G.game.simSeason(st); st.recap = null; st.event = null; }
  });
  console.log('  gol per partita ' + (2 * goals / matches).toFixed(3) + ' · punti medi dei campioni ' + (champ / n).toFixed(2) + ' su ' + n + ' campionati');
}

const TESTS = { start, nt, balance, leagues };
Object.keys(TESTS).filter(k => !want.length || want.indexOf(k) >= 0).forEach(k => { const t0 = Date.now(); TESTS[k](); console.log('  (' + Math.round((Date.now() - t0) / 1000) + 's)'); });
console.log(failed ? failed + ' test(s) failed' : 'all tests passed');
process.exitCode = failed ? 1 : 0;
