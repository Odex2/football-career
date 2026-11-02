// Simulated manager careers for the M8 features (D-G), for tests/checks-m8.js. Each plays a
// few whole seasons block by block and checks the rules after every block, where the quick checks only look at
// one moment. They take a few seconds each, so tests/run.js skips them with --quick.
//   market    the manager buys, sells and lends in every window: every squad and every loan stays consistent, the
//             managed squad stays within SQUAD_MIN-SQUAD_MAX, no money goes missing, no talk outlives its window
//   academy   two scouts and the assistant on everything: the youth squad stays within its limits, nobody is left
//             waiting at the first match, the boys promoted join the squad, no contract at the club runs out
//   board     a manager good enough for a national team: every season has its goals and a verdict in range, the
//             nation he coaches gets his bonus, and only that one
//   slots     a career saved, another played in the other slot, the first one read back: it goes on exactly as the
//             same career played without stopping (the same save, but for the place of rngState among the keys).
//             The save keeps the generator's state but not the second value G.rng.normal holds back, so the straight
//             career restarts its generator from the same state at that point, as reading a save does
'use strict';

const { bologna } = require('./checks-deal');

// Plays a manager's seasons with everything automatic; each(st) after every block. The board is kept patient,
// so the career lasts; offers of other clubs are turned down. Returns the seasons played.
function play(G, st, seasons, each) {
  const m = st.mgr, h0 = m.hist.length;
  for (let k = 0; k < 7 * seasons && G.mgr.active(st) && m.hist.length < h0 + seasons; k++) {
    st.event = null; st.recap = null; st.mgrOffers = null; m.conf = Math.max(m.conf, 40);
    if (each.before) each.before(st);
    G.game.next(st, true);
    each(st);
  }
  return m.hist.length - h0;
}

// Every club's squad holds its own players once, and every player under contract is in his club's squad
function squads(W) {
  const out = [], seen = {};
  W.clubs.forEach(c => c.sq.forEach(id => {
    const pl = W.players[id];
    if (!pl || pl.c !== c.id) out.push(c.name + ': player ' + id + ' is ' + (pl ? 'at club ' + pl.c : 'gone'));
    if (seen[id]) out.push((pl ? pl.n : id) + ' in two squads');
    seen[id] = 1;
  }));
  W.players.forEach(pl => { if (pl && pl.c >= 0 && !seen[pl.i]) out.push(pl.n + ' at ' + W.clubs[pl.c].name + ' but not in its squad'); });
  return out;
}

// D: three windows a season with the manager's own deals (a signing, a sale, a loan out), the assistant off
function market(load) {
  const G = load(), st = bologna(G, 71), m = st.mgr, W = st.world, C = G.CFG, out = [], seen = {};
  const add = t => { if (!seen[t] && out.length < 12) { seen[t] = 1; out.push(t); } };
  m.assist = { contracts: 0, market: 0, youth: 0 };
  let buys = 0, sales = 0, loans = 0;
  const each = s => {
    const club = W.clubs[m.club], y = s.S ? s.S.year + '/' + s.S.block : s.year;
    squads(W).forEach(add);
    if (club.sq.length < C.SQUAD_MIN || club.sq.length > C.SQUAD_MAX) add(y + ': ' + club.sq.length + ' players at ' + club.name);
    if (!Number.isFinite(club.bud) || club.bud < 0 || !Number.isFinite(m.wageRoom)) add(y + ': budget ' + club.bud + ', wage room ' + m.wageRoom);
    if (m.deal && !G.mgr.open(s)) add(y + ': a negotiation still open with the window shut');
    Object.keys(m.loans).forEach(id => {
      const pl = W.players[id], L = m.loans[id];
      if (!pl) add(y + ': loan of player ' + id + ', who is gone');
      else if (pl.ln === club.id && pl.c !== L.to) add(y + ': ' + pl.n + ' on loan to ' + L.to + ' but at ' + pl.c);
      else if (pl.ln !== undefined && pl.ln !== club.id && pl.c !== club.id) add(y + ': ' + pl.n + ' taken on loan but at ' + pl.c);
    });
  };
  each.before = s => {
    if (!s.S || !G.mgr.open(s)) return;
    const club = W.clubs[m.club];
    // a signing: the first target the club can afford
    const t = G.mgr.targets(s).find(pl => pl.c !== club.id && !G.mgrDeal.can(s, pl, G.mgr.price(s, pl), G.mgrDeal.wage(s, pl, 1)));
    if (t && club.sq.length < C.SQUAD_MAX && G.mgrDeal.quick(s, t.i) === 'ok') {
      buys++;
      if (t.c !== club.id || club.sq.indexOf(t.i) < 0) add(t.n + ' signed but at ' + t.c);
    }
    // a sale: the first offer of another club, when it is no key player
    const i = m.bids.findIndex(b => m.sr[b.id] !== 'cru');
    if (i >= 0) { const b = m.bids[i], pl = W.players[b.id]; if (/^💰/.test(G.mgrDeal.bid(s, i))) { sales++; if (pl.c !== b.by) add(pl.n + ' sold to ' + b.by + ' but at ' + pl.c); } }
    // a loan out in the summer
    const id = s.S.block === 0 ? G.mgrDeal.loanOuts(s)[0] : undefined;
    if (id !== undefined) { G.mgrDeal.loanOut(s, id); if (W.players[id].ln === club.id) loans++; }
  };
  const n = play(G, st, 5, each);
  if (n < 5) out.push('the career stopped after ' + n + ' seasons');
  if (buys < 3 || sales < 1 || loans < 1) out.push(buys + ' signings, ' + sales + ' sales and ' + loans + ' loans in ' + n + ' seasons');
  return out;
}

// E and G: the academy with two scouts, the assistant deciding contracts, market and boys
function academy(load) {
  const G = load(), st = bologna(G, 72), m = st.mgr, W = st.world, Y = G.CFG2.MGR_YOUTH, out = [], seen = {};
  const add = t => { if (!seen[t] && out.length < 12) { seen[t] = 1; out.push(t); } };
  m.assist = { contracts: 1, market: 1, youth: 1 };
  [0, 1].forEach(i => { G.mgrYouth.hire(st); G.mgrYouth.setScout(st, i, 'lvl', '2'); });
  let found = 0, promoted = 0, before = m.yth.length;
  const each = s => {
    const club = W.clubs[m.club], y = s.S ? s.S.year + '/' + s.S.block : s.year;
    if (m.ys.length > Y.SCOUTS || m.yth.length > Y.MAX) add(y + ': ' + m.ys.length + ' scouts, ' + m.yth.length + ' boys');
    m.yth.forEach(x => { const r = G.mgrYouth.pot(x); if (x.p < r[0] || x.p > r[1]) add(x.n + ': potential ' + x.p + ' shown as ' + r.join('-')); });
    if (s.S && s.S.block === 1 && G.mgrYouth.waiting(m)) add(y + ': ' + G.mgrYouth.waiting(m) + ' boys still waiting after the first block');
    Object.keys(m.dev).forEach(id => { if (!W.players[id] || W.players[id].c !== club.id) add(y + ': a new role for player ' + id + ', not at the club'); });
    club.sq.forEach(id => { const pl = W.players[id]; if (pl.ln === undefined && pl.y < 1) add(y + ': ' + pl.n + ' at the club with ' + pl.y + ' years of contract'); });
    if (club.sq.length < G.CFG.SQUAD_MIN) add(y + ': ' + club.sq.length + ' players');
    found += Math.max(0, m.yth.length - before); before = m.yth.length;
  };
  // the boys promoted by the vice: in the news, then in the squad as players of the world
  const promote = G.mgrYouth.promote;
  G.mgrYouth.promote = function (s, i) {
    const x = m.yth[i], t = promote.apply(this, arguments), pl = W.players.find(p => p && p.n === x.n && p.c === m.club);
    if (pl) promoted++; else add(x.n + ' promoted but not in the squad');
    before--;
    return t;
  };
  let bought = 0;  // counted as they come: the news list keeps the last 80 only
  const say = G.news;
  G.news = function (s, t) { if (/^🤖 Il vice compra/.test(t)) bought++; return say.apply(this, arguments); };
  const n = play(G, st, 6, each);
  if (n < 6) out.push('the career stopped after ' + n + ' seasons');
  if (found < 4 || promoted < 1) out.push(found + ' boys found and ' + promoted + ' promoted in ' + n + ' seasons');
  if (!bought) out.push('the vice bought no one with the market switch on');
  return out;
}

// F: the board's goals every season, and the national team taken whenever it calls
function board(load) {
  const G = load(), st = bologna(G, 71), m = st.mgr, out = [], seen = {};
  const add = t => { if (!seen[t] && out.length < 12) { seen[t] = 1; out.push(t); } };
  let verdicts = 0, offers = 0, ctBlocks = 0;
  const each = s => {
    const R = s.recap, y = s.S ? s.S.year + '/' + s.S.block : s.year;
    if (R) {
      verdicts++;
      if (!R.goals || !R.goals.length || R.goals[0].k !== 'lg' || R.goals[0].imp !== 'alta') add(R.year + ': goals ' + JSON.stringify(R.goals));
      if (!(R.score >= 0 && R.score <= 1) || !(R.conf >= -20 && R.conf <= 100)) add(R.year + ': score ' + R.score + ', security ' + R.conf);
    }
    if (m.nt) {
      ctBlocks++;
      const other = G.NT_IDS.find(id => id !== m.nt);
      if (G.mgrBoard.ntBonus(s, m.nt) !== G.mgrBoard.power(m) || G.mgrBoard.ntBonus(s, other)) add(y + ': ct of ' + m.nt + ', bonus ' + G.mgrBoard.ntBonus(s, m.nt) + ' and ' + G.mgrBoard.ntBonus(s, other) + ' to ' + other);
      if (!G.NT[m.nt]) add(y + ': ct of an unknown nation ' + m.nt);
    }
  };
  each.before = s => { m.rep = Math.max(m.rep, 80); if (m.ntOffer) { offers++; G.mgrBoard.ntAnswer(s, true); } };
  const n = play(G, st, 6, each);
  if (verdicts !== n) out.push(verdicts + ' verdicts in ' + n + ' seasons');
  if (!offers || !ctBlocks) out.push(offers + ' national teams called in ' + n + ' seasons, ' + ctBlocks + ' blocks as ct');
  return out;
}

// G4: the same career played straight, and saved with another career played in between in the other slot
function slots(load) {
  const { isDeepStrictEqual } = require('util'), out = [];
  const same = (Ga, a, Gb, b) => isDeepStrictEqual(JSON.parse(Ga.save.json(a)), JSON.parse(Gb.save.json(b)));
  const each = () => {};
  const G1 = load(), a1 = bologna(G1, 73);
  play(G1, a1, 1, each);
  G1.rng = G1.makeRng(G1.rng.s);
  play(G1, a1, 2, each);
  const G2 = load(), a2 = bologna(G2, 73);
  play(G2, a2, 1, each);
  G2.save.slot = 1; G2.save.write(a2);
  const b = G2.game.newManager({ name: 'Altro Manager', nat: 'ESP', bg: 'naz', age: 45, seed: 74 });
  G2.state = b; G2.save.slot = 0;
  G2.mgr.start(b, b.mgrOffers.list[0]);
  play(G2, b, 1, each);
  G2.save.write(b);
  G2.save.slot = 1;
  const back = G2.save.restore(G2.save.read());
  G2.state = back;
  if (!back || back.player.name !== a2.player.name) return ['slot 2 did not read back the first career'];
  play(G2, back, 2, each);
  if (back.mgr.hist.length !== a1.mgr.hist.length || !same(G2, back, G1, a1)) out.push('the career read back from slot 2 went on differently: ' + back.mgr.hist.length + ' seasons, ' + back.year + ' instead of ' + a1.mgr.hist.length + ', ' + a1.year);
  const other = G2.save.info(0);
  if (!other || other.name !== 'Altro Manager') out.push('slot 1 lost the other career: ' + JSON.stringify(other));
  G2.save.slot = 0;
  return out;
}

const CHECKS = [
  { t: 'M8 D (5 seasons): signings, sales and loans keep every squad and loan consistent', f: market, slow: 1 },
  { t: 'M8 E+G (6 seasons): academy and assistant, nobody waiting, no contract running out', f: academy, slow: 1 },
  { t: 'M8 F (6 seasons): the board judges every season, the ct helps only his nation', f: board, slow: 1 },
  { t: 'M8 G4: a career saved in slot 2 goes on as if never stopped', f: slots, slow: 1 }
];

module.exports = { CHECKS };
