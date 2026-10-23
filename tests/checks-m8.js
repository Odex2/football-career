// Quick checks for the M8 features, run by tests/run.js right after the data check,
// also with --quick. Each check takes the harness's load() and returns a list of problems (empty = fine);
// a check that changes the game loads its own copy.
'use strict';

// §1.1: the AI market never buys or sells for the managed club, even when it is club 0 (Liverpool)
function aiMarket(load) {
  const G = load(), out = [];
  const st = G.game.newManager({ name: 'Test Manager', nat: 'ENG', bg: 'prov', age: 40, seed: 1 });
  G.mgr.start(st, { club: 0, fans: 0, perks: null, bandiera: 0 });
  const W = st.world, club = W.clubs[0];
  // a club the AI would surely trade for: money, needs, cheap wages, expiring contracts
  club.str += 6; club.bud = 500; club.sq.forEach(id => { W.players[id].w = 1; W.players[id].y = 1; });
  const move = G.transfers.move;
  G.transfers.move = function (s, pl, to) {
    if ((to.id === 0 || pl.c === 0) && club.sq.length >= G.CFG.SQUAD_MIN) out.push('the AI moved ' + pl.n + (to.id === 0 ? ' to ' : ' away from ') + club.name + ', the managed club');
    return move.apply(this, arguments);
  };
  [0, 1, 0].forEach(w => G.transfers.window(st, w));
  return out;
}

// A3: the exact odds of the random first club on one world (the 1,000-draw test is in tests/stats.js)
function startOdds(load) {
  const G = load(), out = [];
  G.rng = G.makeRng(3); const W = G.world.create(G.rng);
  const share = (nat, f) => { const w = G.game.startWeights(W, nat), tot = w.reduce((a, b) => a + b, 0); return W.clubs.reduce((s, c, i) => s + (f(c) ? w[i] : 0), 0) / tot; };
  const top5two = c => ['ENG2', 'ESP2', 'ITA2', 'GER2', 'FRA2'].indexOf(c.lg) >= 0;
  [['ITA', 0.46], ['ESP', 0.48], ['BRA', 0.39]].forEach(([nat, want]) => {
    const got = share(nat, top5two);
    if (Math.abs(got - want) > 0.06) out.push(nat + ': second divisions of the top 5 drawn ' + Math.round(got * 100) + '% of the time, the spec says ' + want * 100 + '%');
    const big = share(nat, c => c.str >= 80);
    if (big > 0.01) out.push(nat + ': a club of strength 80+ drawn ' + (big * 100).toFixed(2) + '% of the time');
    const rm = share(nat, c => c.name === 'Real Madrid');
    if (!(rm > 0 && rm < 1 / 10000)) out.push(nat + ': Real Madrid drawn 1 time in ' + Math.round(1 / rm));
  });
  if (share('BRA', c => c.nat === 'BRA') !== 0) out.push('BRA: a Brazilian club was drawn, there is no Brazilian league');
  const home = share('ITA', c => c.nat === 'ITA'), away = share('NED', c => c.nat === 'ITA');
  if (!(home > away * 2)) out.push('ITA: no home bonus (' + Math.round(home * 100) + '% Italian clubs, ' + Math.round(away * 100) + '% for a Dutch player)');
  return out;
}

// A1-A5, A7: careers from a nation with no league start abroad, and the creation list shows them
function southAmerica(load) {
  const out = [];
  [['BRA', 'random'], ['ARG', 'loan'], ['BRA', 'second'], ['BOL', 'second']].forEach(([nat, start], i) => {
    const G = load(), st = G.game.newCareer({ name: 'Test Player', nat: nat, role: 'ATT', foot: 'D', start: start, seed: 50 + i }), p = st.player, W = st.world;
    const club = W.clubs[p.clubId], link = G.SA_LINK[nat];
    if (p.nat !== nat) out.push(nat + ' ' + start + ': the player is from ' + p.nat);
    if (start === 'loan') {
      const par = W.clubs[p.loanFrom];
      if (!par || par.lg !== link + '1') out.push(nat + ' loan: the parent club is not a top club of ' + link);
      else if (club.str > par.str - 5) out.push(nat + ' loan: ' + club.name + ' (' + club.str + ') is not smaller than ' + par.name + ' (' + par.str + ')');
    }
    if (start === 'second' && club.nat !== link) out.push(nat + ' second: starts at ' + club.name + ', not in ' + link);
  });
  const G = load(), html = G.ui.natOptions('BRA');
  if (!/<optgroup label="Campionati nel gioco">/.test(html) || !/<optgroup label="Sud America/.test(html)) out.push('natOptions: the two groups are missing');
  G.SA_NATS.forEach(id => { if (html.indexOf('value="' + id + '"') < 0) out.push('natOptions: ' + id + ' is missing'); });
  if (!/value="BRA" selected/.test(html)) out.push('natOptions: the chosen nation is not selected');
  if (G.ui.natNote('BRA') === '' || G.ui.natNote('ITA') !== '') out.push('the note under the nation is wrong');
  // every South American nation has players to build a national team from
  G.rng = G.makeRng(7); const W = G.world.create(G.rng);
  G.SA_NATS.forEach(id => { const n = W.players.filter(pl => pl && pl.nt === id).length; if (n < 25) out.push(id + ': only ' + n + ' players in the world'); });
  // an Argentinian ex international is loved at a Spanish club, which calls among the first offers
  const st = G.game.newManager({ name: 'Test Manager', nat: 'ARG', bg: 'naz', age: 42, seed: 9 }), p = st.player;
  const loved = Object.keys(p.fans).filter(id => p.fans[id] === 60);
  if (loved.length !== 1 || st.world.clubs[loved[0]].nat !== 'ESP') out.push('ARG naz: the loved club is ' + loved.map(id => st.world.clubs[id].name).join(', '));
  else if (!st.mgrOffers.list.some(o => o.club === +loved[0])) out.push('ARG naz: ' + st.world.clubs[loved[0]].name + ' is not among the first offers');
  return out;
}

// H9.1: 11 points per formation, in the order of the slots' roles, no two cards overlapping
function pitchPos(load) {
  const G = load(), out = [], W = 17, H = 17 * 1.2 / 1.12, GAP = 1, side = { TD: 'TS', ED: 'ES' };
  Object.keys(G.mgrTeam.FORMS).forEach(f => {
    const pos = G.ui.PITCH_POS[f], slots = G.mgrTeam.slots(f);
    if (!pos || pos.length !== 11) return out.push(f + ': ' + (pos ? pos.length : 'no') + ' points in PITCH_POS');
    pos.forEach((x, k) => { if ((side[x[2]] || x[2]) !== slots[k]) out.push(f + ' point ' + k + ': ' + x[2] + ' where the slot is ' + slots[k]); });
    for (let i = 0; i < 11; i++) for (let j = i + 1; j < 11; j++) {
      const a = pos[i], b = pos[j];
      if (Math.abs(a[0] - b[0]) < W + GAP && Math.abs(a[1] - b[1]) < H + GAP) out.push(f + ': cards ' + i + ' (' + a[2] + ') and ' + j + ' (' + b[2] + ') overlap');
    }
  });
  return out;
}

// H9.2 and H9.3: the manager's pitch has the XI and the bench, and two taps swap players
function pitchSwap(load) {
  const G = load(), out = [], st = G.game.newManager({ name: 'Test Manager', nat: 'ITA', bg: 'prov', age: 40, seed: 3 }), W = st.world;
  G.mgr.start(st, { club: W.clubs.find(c => c.name === 'Bologna').id, fans: 0, perks: null, bandiera: 0 });
  const m = st.mgr, club = W.clubs[m.club], count = h => (h.match(/class="pc[ "]/g) || []).length;
  ['4-4-2', '3-4-3'].forEach(f => {
    G.mgrTeam.setForm(st, f);
    const o = G.ui.mgrPitchOpts(st), P = G.ui.pitch(o), xi = G.mgrTeam.xi(st);
    if (count(P.field) !== 11) out.push(f + ': ' + count(P.field) + ' cards on the pitch');
    if (count(P.bench) !== club.sq.length - 11) out.push(f + ': ' + count(P.bench) + ' cards on the bench, ' + (club.sq.length - 11) + ' players out of the XI');
    if (xi.some(x => P.bench.indexOf('b:' + x.id + '"') >= 0)) out.push(f + ': a starter is on the bench');
  });
  const tap = v => G.ui.pitchAct(st, 'mxsel', v), ids = () => G.mgrTeam.xi(st).map(x => x.id);
  G.ui.sel.mx = null;
  let xi = ids();
  // pitch - pitch: the two starters swap places
  tap('s:9'); const r1 = tap('s:10'), after = ids();
  if (r1 !== 'keep' || after[9] !== xi[10] || after[10] !== xi[9]) out.push('slot 9 and slot 10 did not swap');
  if (m.mode !== 'manual') out.push('a swap does not switch to the manual XI');
  // bench - pitch: the bench player comes in, the starter goes out
  xi = ids();
  const bench = club.sq.filter(id => xi.indexOf(id) < 0);
  tap('b:' + bench[0]); tap('s:5');
  if (ids()[5] !== bench[0] || ids().indexOf(xi[5]) >= 0) out.push('the bench player did not come in for slot 5');
  // bench - bench changes the selection only; the same card again cancels
  tap('b:' + bench[1]); tap('b:' + bench[2]);
  if (!G.ui.sel.mx || G.ui.sel.mx.id !== bench[2]) out.push('a second bench player does not take the selection');
  tap('b:' + bench[2]);
  if (G.ui.sel.mx) out.push('tapping the selected card again does not cancel');
  if (JSON.stringify(G.ui.mgrPitchOpts(st)).indexOf('undefined') >= 0) out.push('a card has an undefined field');
  // the playing career: the club's XI with the user in it or on the bench, to look at
  const pc = G.game.newCareer({ name: 'Test Player', nat: 'ITA', role: 'ATT', foot: 'D', start: 'random', seed: 4 }), x = G.ui.squadPitchOpts(pc), sq = pc.world.clubs[pc.player.clubId].sq.length;
  if (x.o.slots.length !== 11 || x.o.bench.length !== sq + 1 - 11) out.push('player pitch: ' + x.o.slots.length + ' starters and ' + x.o.bench.length + ' on the bench for ' + (sq + 1) + ' players');
  if (x.o.slots.concat(x.o.bench).filter(c => c.me).length !== 1 || x.meIn !== x.o.slots.some(c => c.me)) out.push('player pitch: the user is not shown once, where his start chance says');
  return out;
}

// I7.2 and I7.3: after 6 seasons the season table is in the Statistics, not in the career tab; the Profile draws
// cleanly, also from a save with no attrs0
function profile(load) {
  const G = load(), out = [], st = G.game.newCareer({ name: 'Test Player', nat: 'ITA', role: 'CC', foot: 'D', start: 'random', seed: 12 });
  G.state = st;
  for (let s = 0; s < 6 && !st.over; s++) { G.game.simSeason(st); st.recap = null; st.event = null; }
  const bad = (what, h) => { const m = h.match(/NaN|undefined|\[object/); if (m) out.push(what + ' shows ' + m[0] + ': …' + h.slice(Math.max(0, m.index - 80), m.index + 20)); };
  const career = G.ui.career(st), stats = G.ui.statsTab(st), table = '<th>Stagione</th><th>Età</th>';
  if (career.indexOf(table) >= 0) out.push('the career tab still has the season table');
  if (stats.indexOf(table) < 0 || stats.indexOf('Stagione per stagione') < 0) out.push('the Statistics tab has no "Stagione per stagione"');
  if (career.indexOf('data-v="profilo"') < 0) out.push('the block card has no line leading to the Profile');
  bad('the career tab', career);
  const pr = G.ui.profileTab(st);
  bad('the Profile', pr);
  ['Attributi', 'Gerarchie', 'Focus allenamento', 'Intensità', 'Andamento', 'Infortuni', 'Confronto'].forEach(t => { if (pr.indexOf(t) < 0) out.push('the Profile has no ' + t); });
  if (pr.indexOf('title="Dall’inizio della stagione"') < 0) out.push('the Profile has no Stagione column');
  delete st.attrs0;
  const old = G.ui.profileTab(st);
  bad('the Profile of an old save', old);
  if (old.indexOf('title="Dall’inizio della stagione"') >= 0) out.push('an old save shows the Stagione column');
  return out;
}

// I7.4: the national cup card in the cup, out and as winner; the European card only for a club that plays in Europe
function cupCards(load) {
  const G = load(), out = [], st = G.game.newCareer({ name: 'Test Player', nat: 'ITA', role: 'ATT', foot: 'D', start: 'random', seed: 21 }), W = st.world;
  G.state = st;
  const strip = h => h.replace(/<[^>]+>/g, ''), club = W.clubs[st.player.clubId], cup = st.S.cups[club.nat];
  // a season played to the final block: the card agrees with the cup, and a drawn round is marked "ai rigori"
  for (let b = 0; b < 4; b++) { G.game.next(st, true); st.event = null; }
  const rows = st.S.rows.filter(r => r.ck === club.nat), card = strip(G.ui.cupCard(st, club.id)), alive = cup.alive.indexOf(club.id) >= 0;
  if (alive && card.indexOf(G.season.cupRound(cup)) < 0) out.push('in the cup, the card does not say the round: ' + card);
  if (!alive) { const l = rows[rows.length - 1]; if (!l || card.indexOf('dal ' + W.clubs[l.opp].name + ' (' + l.gf + '-' + l.ga) < 0) out.push('out of the cup, the card says: ' + card); }
  rows.forEach(r => { if ((r.gf === r.ga) !== !!r.pen) out.push('cup row ' + r.rd + ' ' + r.gf + '-' + r.ga + (r.pen ? ' marked' : ' not marked') + ' "ai rigori"'); });
  if (rows.some(r => !r.rd)) out.push('a cup row has no round');
  // the three states, set by hand on a fresh season
  const G2 = load(), s2 = G2.game.newCareer({ name: 'Test Player', nat: 'ITA', role: 'ATT', foot: 'D', start: 'random', seed: 22 }), W2 = s2.world, me = W2.clubs[s2.player.clubId];
  G2.state = s2;
  const c2 = s2.S.cups[me.nat], other = W2.clubs.find(c => c.nat === me.nat && c.id !== me.id), card2 = () => strip(G2.ui.cupCard(s2, me.id));
  const row = (rd, gf, ga, pen) => ({ opp: other.id, home: true, gf: gf, ga: ga, mins: 90, g: 0, a: 0, r: 6, comp: c2.name, derby: false, ck: me.nat, rd: rd, pen: pen });
  // M8 J: the first round is drawn when the season starts
  const t0 = c2.ties.find(t => t[0] === me.id || t[1] === me.id), opp0 = t0[0] === me.id ? t0[1] : t0[0];
  if (card2().indexOf(G2.season.cupRound(c2) + (opp0 < 0 ? ' · passi il turno' : ' contro il ' + W2.clubs[opp0].name)) < 0) out.push('at the start, the card says: ' + card2());
  c2.alive = [me.id, other.id]; c2.ties = [[me.id, other.id]]; c2.r = c2.R - 1;
  if (card2().indexOf('Finale contro il ' + other.name + ' · campo neutro') < 0) out.push('in the final, the card says: ' + card2());
  c2.alive = [other.id]; delete c2.ties; s2.S.rows = [row('Quarti', 1, 2)];
  if (card2().indexOf('Eliminati ai quarti dal ' + other.name + ' (1-2)') < 0) out.push('knocked out, the card says: ' + card2());
  c2.alive = [me.id]; c2.winner = me.id; s2.S.rows = [row('Ottavi', 2, 2, 1), row('Finale', 3, 1)];
  const won = card2();
  if (won.indexOf('🏆 ' + c2.name + ' vinta!') < 0 || won.indexOf('ai rigori') < 0) out.push('as winner, the card says: ' + won);
  // Europe: no card for a club that does not play there, a card with no junk for one that does
  const ins = W2.clubs.filter(c => G2.europe.compsOf(s2, c.id).length), outs = W2.clubs.filter(c => c.lg === me.lg && !G2.europe.compsOf(s2, c.id).length);
  if (outs.length && G2.ui.euroCard(s2, outs[0].id) !== '') out.push('a European card for ' + outs[0].name + ', not qualified');
  const eu = ins.length ? G2.ui.euroCard(s2, ins[0].id) : '';
  if (!/Fase campionato/.test(eu) || /NaN|undefined/.test(eu)) out.push('the European card of ' + (ins[0] ? ins[0].name : 'nobody') + ': ' + strip(eu));
  return out;
}

const CHECKS = [
  { t: 'M8 §1.1: the AI market leaves the managed club alone (club 0)', f: aiMarket },
  { t: 'M8 A3: odds of the random first club', f: startOdds },
  { t: 'M8 A: South American careers start abroad', f: southAmerica },
  { t: 'M8 H: pitch positions of every formation', f: pitchPos },
  { t: 'M8 H: the pitch shows XI and bench, two taps swap players', f: pitchSwap },
  { t: 'M8 I: the season table moves to the Statistics, the Profile draws cleanly', f: profile },
  { t: 'M8 I: the cup cards in the cup, out, as winner; Europe only when qualified', f: cupCards }
].concat(require('./checks-cal').CHECKS, require('./checks-mgr').CHECKS, require('./checks-deal').CHECKS, require('./checks-youth').CHECKS, require('./checks-board').CHECKS, require('./checks-extra').CHECKS);

module.exports = { CHECKS };
