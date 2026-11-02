// Long statistical tests of M8, run by hand at the end of a phase, not by run.js:
//   node tests/stats.js                 every test
//   node tests/stats.js start nt        only some of them
//   node tests/stats.js balance --root=../copy   the same test on another copy of the game (to compare before/after)
//   node tests/stats.js balance --seeds=3        fewer careers (default 16)
//   node tests/stats.js balance --rotate         with the assistant's turnover on (M9 S1)
//   node tests/stats.js pact --pol=norm          the board's pact fixed every summer (M9 S4; off, norm, all, reb)
//   node tests/stats.js tactic --pol=counter     the levers before every match (M9 S6; mid, counter, wrong, generic, big)
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
const seedsArg = process.argv.find(a => a.startsWith('--seeds=')), rotateArg = process.argv.includes('--rotate');  // --rotate: with the assistant's turnover on (M9 S1)
function balance(setup) {
  const seeds = Array.from({ length: seedsArg ? +seedsArg.slice(8) : 16 }, (x, i) => 11 * (i + 1));
  if (!setup) console.log('§0 · bilanciamento: punti del club gestito, tutto automatico, 8 stagioni, ' + seeds.length + ' carriere per club');
  ['Bologna', 'Inter'].forEach(name => {
    const all = [], fam = [];
    seeds.forEach(seed => {
      const G = harness.load(), st = G.game.newManager({ name: 'Test Manager', nat: 'ITA', bg: 'prov', age: 40, seed: seed });
      const club = st.world.clubs.find(c => c.name === name), pts = [];
      G.mgr.start(st, { club: club.id, fans: 0, perks: null, bandiera: 0 });
      if (rotateArg) st.mgr.assist.rotate = 1;
      if (setup) setup(G);
      const end = G.mgr.seasonEnd;
      G.mgr.seasonEnd = function (s) { if (G.mgr.active(s) && s.mgr.club === club.id) { pts.push(s.S.lg[club.lg].tab[club.id][6]); fam.push(G.mgrTac.fam(s.mgr)); } s.mgr.conf = 100; return end.apply(this, arguments); };
      for (let y = 0; y < 8 && G.mgr.active(st); y++) { G.game.simSeason(st); st.recap = null; st.mgrOffers = null; if (st.event) G.mgrEv.apply(st, 0); }
      all.push(...pts);
      console.log('  ' + name + ' seed ' + seed + ': ' + pts.join(' '));
    });
    const avg = all.reduce((a, b) => a + b, 0) / all.length, sd = Math.sqrt(all.reduce((a, b) => a + (b - avg) * (b - avg), 0) / (all.length - 1));
    console.log('  ' + name + ': media ' + avg.toFixed(1) + ' ± ' + (sd / Math.sqrt(all.length)).toFixed(1) + ' punti in ' + all.length + ' stagioni' + (setup ? ' · intesa a fine stagione ' + (fam.reduce((a, b) => a + b, 0) / fam.length).toFixed(0) : ''));
  });
}

// M1: the balance test with the levers set before every match (G.mgrTac.policy), paying the
// tactical familiarity. mid: the vice's (as balance); counter: the best against the real style; wrong: the worst;
// generic: the best against the coach's style only (what a manager knows without an analyst); big: counter only
// against a stronger side, medium otherwise; free: counter with no familiarity cost (what the counter is worth);
// stable: every summer the levers best on average against the league's styles, kept all season. Good choices must
// pay, bad ones cost
function tactic() {
  const polArg = process.argv.find(a => a.startsWith('--pol=')), pols = polArg ? [polArg.slice(6)] : ['mid', 'counter', 'wrong', 'generic', 'big', 'free', 'stable'];
  pols.forEach(pol => {
    console.log('M1 · leve prima di ogni partita: ' + pol);
    balance(G => {
      const T = G.mgrTac, mid = { press: 1, build: 1, line: 1 };
      T.policy = pol === 'mid' ? null : (s, opp) => {
        const W = s.world, o = W.clubs[opp], co = G.coaches.of(W, o), m = s.mgr;
        if (pol === 'counter') m.lev = T.counter(T.style(W, o));
        if (pol === 'wrong') m.lev = T.counter(T.style(W, o), -1);
        if (pol === 'generic') m.lev = T.counter(Object.assign({ fast: 0 }, T.COACH[co ? co.sty : 'motivatore']));
        if (pol === 'big') m.lev = o.str > W.clubs[m.club].str ? T.counter(T.style(W, o)) : mid;
        if (pol === 'free') { m.lev = T.counter(T.style(W, o)); m.tsys = T.sys(m); }
        if (pol === 'stable' && m.ty !== s.S.year) {
          const lg = W.clubs.filter(c => c.lg === W.clubs[m.club].lg && c.id !== m.club).map(c => T.style(W, c));
          let best = mid, bv = -1;
          for (let x = 0; x < 27; x++) {
            const l = { press: x % 3, build: Math.floor(x / 3) % 3, line: Math.floor(x / 9) }, v = lg.reduce((a, o2) => { const e = T.effect(l, o2); return a + e[0] + e[1]; }, 0);
            if (v > bv) { bv = v; best = l; }
          }
          m.lev = best; m.ty = s.S.year;
        }
      };
    });
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

// M11.8: careers of 8 seasons at mid-table clubs of the top 5 first divisions (the 7th to 12th
// strength), the pact fixed every summer. --pol=off|norm|all|reb runs one of them ('off': S4 switched off, as before
// it); a sacked manager takes the first offer. Prints sackings per season, points, trophies, expectations, and for
// "Ricostruzione" the budget and the strength from the first summer to the last
function pact() {
  const polArg = process.argv.find(a => a.startsWith('--pol=')), pols = polArg ? [polArg.slice(6)] : ['off', 'norm', 'all', 'reb'];
  const seedArg = process.argv.find(a => a.startsWith('--seeds=')), N = seedArg ? +seedArg.slice(8) : 16;
  pols.forEach(pol => {
    let sacks = 0, seasons = 0, pts = 0, pts1 = 0, n1 = 0, cups = 0, exp = 0, careers0 = 0;
    const bud = [], str = [];
    for (let i = 0; i < N; i++) {
      const G = harness.load(), st = G.game.newManager({ name: 'Test Manager', nat: 'ITA', bg: 'naz', age: 40, seed: 500 + i }), W = st.world;
      if (pol === 'off') {  // S4 switched off: today's goal, no president, no requests, no pact
        G.mgrPact.target = (s, base) => base; G.mgrPact.pat = s => s.mgr.pat; G.mgrPact.loss = () => 1; G.mgrPact.block = () => {};
        G.mgrAsk.window = () => {}; G.mgrAsk.block = () => {}; G.mgrPact.seasonEnd = () => {}; G.mgrPact.seasonStart = s => { s.mgr.pact = null; };
      }
      const lg = ['ITA1', 'ESP1', 'ENG1', 'GER1', 'FRA1'][i % 5], ids = W.clubs.filter(c => c.lg === lg).sort((a, b) => b.str - a.str);
      const first = ids[6 + (i % 6)].id, start = seasons;
      G.mgr.start(st, { club: first, fans: 0, perks: null, bandiera: 0 });
      const end = G.mgr.seasonEnd;
      G.mgr.seasonEnd = function (s, tables, honours) {
        const m = s.mgr, c = W.clubs[m.club];
        pts += s.S.lg[c.lg].tab[c.id][6]; cups += honours.filter(h => h[0] === c.id).length; seasons++;
        if (c.id === first && seasons === 1 + start) { pts1 += s.S.lg[c.lg].tab[c.id][6]; n1++; }
        const r = end.apply(this, arguments);
        if (G.mgr.active(s)) exp += c.exp || 0;
        return r;
      };
      for (let y = 0; y < 8 && !st.over; y++) {
        if (!G.mgr.active(st)) { if (!st.mgrOffers || !st.mgrOffers.list.length) G.mgr.offerSet(st, 'free', 4); G.mgr.start(st, st.mgrOffers.list[0]); }
        if (pol !== 'off' && G.mgrPact.open(st)) G.mgrPact.set(st, pol);
        if (y === 0 || y === 7) { const c = W.clubs[st.mgr.club]; bud.push(c.bud); str.push(c.str); }
        G.game.simSeason(st); st.recap = null; if (st.mgrOffers && st.mgrOffers.why === 'calls') st.mgrOffers = null; if (st.event) G.mgrEv.apply(st, 0);
      }
      sacks += st.mgr.sacked; if (!st.mgr.sacked) careers0++;
    }
    const half = a => [a.filter((x, k) => k % 2 === 0), a.filter((x, k) => k % 2 === 1)].map(x => (x.reduce((p, q) => p + q, 0) / x.length).toFixed(1));
    console.log('  ' + pol + ': esoneri ' + sacks + ' in ' + seasons + ' stagioni (' + (sacks / seasons * 100).toFixed(1) + '% a stagione, ' + (sacks / N).toFixed(2) + ' a carriera, ' + careers0 + '/' + N + ' carriere senza) · punti ' + (pts / seasons).toFixed(1) +
      ' (prima stagione ' + (pts1 / n1).toFixed(1) + ')' + ' · trofei ' + cups + ' · aspettative medie ' + (exp / seasons).toFixed(2) + ' · budget ' + half(bud).join(' → ') + ' M€ · forza ' + half(str).join(' → '));
  });
}

const TESTS = { start, nt, balance: () => balance(), leagues, pact, tactic };
Object.keys(TESTS).filter(k => !want.length || want.indexOf(k) >= 0).forEach(k => { const t0 = Date.now(); TESTS[k](); console.log('  (' + Math.round((Date.now() - t0) / 1000) + 's)'); });
console.log(failed ? failed + ' test(s) failed' : 'all tests passed');
process.exitCode = failed ? 1 : 0;
