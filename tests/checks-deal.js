// The manager's market (M8 phase D D8), for tests/checks.js and tests/checks-m8.js:
//   watch(G, seen)   while a career plays: no AI window moves a player on loan, every loan comes back at the end
//                    of the season (only an option on a player we had on loan waits for the summer)
//   CHECKS           quick checks: club offers accepted at FEE_P (D8.2), contracts not renewed (D8.3), a loan out
//                    and a loan in (D8.4), the same search twice (D8.5), a whole negotiation
'use strict';

function watch(G, seen) {
  const out = seen.deal = [];
  let ai = false;
  const win = G.transfers.window, move = G.transfers.move;
  G.transfers.window = function () { ai = true; try { return win.apply(this, arguments); } finally { ai = false; } };
  G.transfers.move = function (st, pl) { if (ai && pl.ln !== undefined && out.length < 5) out.push(st.year + ': the AI bought ' + pl.n + ', who is on loan'); return move.apply(this, arguments); };
  const end = G.mgrDeal.seasonEnd;
  G.mgrDeal.seasonEnd = function (st) {
    const r = end.apply(this, arguments), m = st.mgr;
    st.world.players.forEach(pl => {
      if (!pl || pl.ln === undefined || out.length >= 5) return;
      const L = m.loans[pl.i];
      if (!L || L.opt === undefined || pl.c !== pl.ln) out.push(st.S.year + ': ' + pl.n + ' still away on loan after the season');
    });
    return r;
  };
}

// A manager at Bologna in the summer window
function bologna(G, seed) {
  const st = G.game.newManager({ name: 'Test Manager', nat: 'ITA', bg: 'prov', age: 40, seed: seed });
  G.state = st;
  G.mgr.start(st, { club: st.world.clubs.find(c => c.name === 'Bologna').id, fans: 0, perks: null, bandiera: 0 });
  return st;
}

// D8.2: 1,000 offers at 90/100/115% of the price to a club with no correction: accepted with FEE_P (±4 points)
function feeOdds(load) {
  const G = load(), out = [], st = bologna(G, 51), m = st.mgr, W = st.world, club = W.clubs[m.club], D = G.CFG2.MGR_DEAL;
  const pl = W.players.find(x => {
    if (!x || x.c < 0 || x.c === club.id || x.y <= 1 || x.ln !== undefined) return false;
    const s = W.clubs[x.c];
    return s.rep <= club.rep + 6 && club.riv.indexOf(s.id) < 0 && G.mgr.price(st, x) * 1.15 < club.bud && G.mgrDeal.clubP(st, x, 0) === D.FEE_P[0] && G.mgrDeal.clubP(st, x, 2) === D.FEE_P[2];
  });
  if (!pl) return ['no player to try the offers on'];
  [0, 1, 2].forEach(k => {
    let yes = 0;
    for (let i = 0; i < 1000; i++) {
      m.neg = {}; m.deal = null;
      G.mgrDeal.open(st, pl.i); G.mgrDeal.offer(st, k);
      if (m.deal && m.deal.step === 'player') yes++;
    }
    if (Math.abs(yes / 1000 - D.FEE_P[k]) > 0.04) out.push('offers at ' + Math.round(D.FEE[k] * 100) + '%: ' + (yes / 10).toFixed(1) + '% accepted, not ' + D.FEE_P[k] * 100 + '%');
  });
  return out;
}

// D8.3: with the contracts left to the manager, who is not renewed leaves at the end of the season; with the
// assistant on, the club keeps renewing the useful players as before
function expiry(load) {
  const out = [];
  [0, 1].forEach(on => {
    const G = load(), st = bologna(G, 52), m = st.mgr, W = st.world, club = W.clubs[m.club];
    m.assist.contracts = on;
    const exp = club.sq.filter(id => W.players[id].y === 1).map(id => W.players[id]);
    G.game.simSeason(st);
    const stay = exp.filter(pl => W.players[pl.i] === pl && pl.c === club.id), gone = (st.news || []).filter(n => /^👋 .* lascia a parametro zero/.test(n.t)).length;
    if (!exp.length) out.push('no contract running out at Bologna (seed 52)');
    else if (!on && stay.length) out.push(stay.length + ' players stayed without a renewal: ' + stay.map(p => p.n).join(', '));
    else if (!on && !gone) out.push('no news of a player leaving on a free');
    else if (on && (!stay.length || gone)) out.push('with the assistant ' + stay.length + ' of ' + exp.length + ' renewed and ' + gone + ' left on a free');
  });
  return out;
}

// D8.4: a loan out comes back at the end of the season, nobody buys him meanwhile; a loan in goes home, the option
// waits for the summer and lapses when the window closes
function loans(load) {
  const G = load(), out = [], st = bologna(G, 53), m = st.mgr, W = st.world, club = W.clubs[m.club];
  const id = G.mgrDeal.loanOuts(st)[0];
  if (id === undefined) return ['nobody to send on loan'];
  const t = G.mgrDeal.loanOut(st, id), pl = W.players[id], to = pl.c;
  if (to === club.id || pl.ln !== club.id) return ['the loan did not happen: ' + t];
  // a loan in from a club that can lend
  const inn = W.players.find(x => x && x.c >= 0 && x.c !== club.id && x.ln === undefined && G.mgrDeal.loanable(st, x) && x.o > club.str - 8 && G.mgr.price(st, x) < club.bud * 0.5);
  m.wageRoom = 50;  // room for his wage, as with the budget moved to wages (D6)
  for (let k = 0; k < 20 && !(inn.ln !== undefined); k++) { m.neg = {}; m.deal = { id: inn.i, step: 'player', fee: 1, loan: 1, wk: 2, sr: 'cru', want: 'cru' }; G.mgrDeal.sign(st); }
  if (inn.c !== club.id || inn.ln === undefined) out.push('the loan in did not happen');
  const home = inn.ln;
  for (let b = 0; b < 5; b++) {  // the 5 blocks of the season, then the next one starts
    G.game.next(st, true);
    if (b < 4 && pl.c !== to) out.push('block ' + b + ': ' + pl.n + ' left the club that has him on loan');
  }
  if (pl.c !== club.id || pl.ln !== undefined || m.loans[id]) out.push('after the season ' + pl.n + ' is at ' + (W.clubs[pl.c] ? W.clubs[pl.c].name : pl.c));
  if (inn.c !== home || inn.ln !== home || !m.loans[inn.i] || !G.mgr.open(st)) out.push('the option on ' + inn.n + ' is not waiting in the summer window');
  st.event = null; G.game.next(st, true);
  if (inn.ln !== undefined || m.loans[inn.i]) out.push('the option did not lapse when the window closed');
  return out;
}

// D8.5 and D2: the same search in the same window gives the same players; a whole negotiation signs a player with
// the role promised
function search(load) {
  const G = load(), out = [], st = bologna(G, 54), m = st.mgr, W = st.world, club = W.clubs[m.club];
  const f = { r: 'ATT', age: 28, price: 100, pot: false, exp: false, nat: '' };
  const a = G.mgrDeal.search(st, f).map(p => p.i);
  G.rng.next(); G.mgrDeal.report(st, a[0]);
  const b = G.mgrDeal.search(st, f).map(p => p.i);
  if (!a.length || a.join() !== b.join()) out.push('the same search gave ' + a.join() + ' then ' + b.join());
  if (G.mgrDeal.search(st, f).some(p => p.r !== 'ATT' || p.a > 28 || G.mgr.price(st, p) > club.bud)) out.push('a search result outside the filter');
  const pot = G.mgrDeal.pot(st, W.players[a[0]]), p0 = W.players[a[0]].p;
  if (pot[0] > p0 || pot[1] < p0 || pot[1] - pot[0] > 2 * G.CFG2.MGR_DEAL.POT_SCOUTED) out.push('the reported potential ' + pot.join('-') + ' for a true ' + p0);
  let signed = null;
  for (const id of a) { if (G.mgrDeal.quick(st, id) === 'ok') { signed = W.players[id]; break; } }
  if (!signed) out.push('no player of the search signed at 100%');
  else if (signed.c !== club.id || !m.sr[signed.i] || !m.promise[signed.i] || m.pm[signed.i] !== 70) out.push(signed.n + ' signed without his role, promise or morale');
  return out;
}

const CHECKS = [
  { t: 'M8 D: offers to a club are accepted at the odds of the spec', f: feeOdds },
  { t: 'M8 D: contracts not renewed end; the assistant renews as before', f: expiry },
  { t: 'M8 D: loans come back at the end of the season, the option waits for the summer', f: loans },
  { t: 'M8 D: the same search gives the same players, a negotiation signs one', f: search }
];

module.exports = { watch, CHECKS, bologna };
