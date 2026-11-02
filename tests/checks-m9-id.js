// Quick checks for M9 S3, for tests/checks-m9.js: the club's identity (js/mgr-identity.js)
//   traits     every club has 1 or 2 known traits; the clubs written by hand have theirs
//   patience   respecting the identity lengthens the patience and pleases the fans, betraying it shortens it
//   interview  the right answers raise the chance of being picked, the wrong ones lower it
'use strict';

const { bologna } = require('./checks-deal');

function traits(load) {
  const G = load(), out = [], st = bologna(G, 171), W = st.world;
  W.clubs.forEach(c => {
    const t = G.mgrId.traits(W, c);
    if (t.length < 1 || t.length > 2 || t.some(k => !G.mgrId.T[k]) || t[0] === t[1]) out.push(c.name + ': ' + t.join(','));
  });
  [['Ajax', 'yth'], ['Athletic Club', 'yth'], ['Atalanta', 'show'], ['Real Madrid', 'star'], ['Bologna', 'yth']].forEach(x => {
    const c = W.clubs.find(c => c.name === x[0]);
    if (!c || G.mgrId.traits(W, c).indexOf(x[1]) < 0) out.push(x[0] + ' should be ' + x[1]);
  });
  const again = G.game.newManager({ name: 'Test Manager', nat: 'ITA', bg: 'prov', age: 40, seed: 171 }).world;
  if (W.clubs.some((c, i) => G.mgrId.traits(W, c).join() !== G.mgrId.traits(again, again.clubs[i]).join())) out.push('the same world gives other traits');
  if (!st.mgr.goals.some(g => g.k === 'idt' && g.imp === 'media')) out.push('no goal of identity, weight media');
  return out;
}

// Bologna asks for its academy: two boys with 8 starts respect it, none betrays it
function patience(load) {
  const G = load(), out = [], st = bologna(G, 173), m = st.mgr, W = st.world, club = W.clubs[m.club], I = G.CFG2.MGR_ID;
  const boys = club.sq.filter(id => W.players[id].a <= 21).slice(0, 2);
  if (boys.length < 2) return ['Bologna has fewer than 2 boys'];
  const run = starts => {
    m.starts = {}; boys.forEach(id => { m.starts[id] = starts; });
    G.mgrBoard.check(st, true);
    const g = m.goals.find(g => g.k === 'idt'), pat = m.pat, fans = st.player.fans[club.id] || 0;
    G.mgrId.seasonEnd(st);
    return { st: g.st, dp: m.pat - pat, df: (st.player.fans[club.id] || 0) - fans };
  };
  const ok = run(8), ko = run(0);
  if (ok.st !== 'ok' || ok.dp !== I.PAT[0] || !(ok.df > 0)) out.push('respected: ' + JSON.stringify(ok));
  if (ko.st !== 'ko' || ko.dp !== -I.PAT[1]) out.push('betrayed: ' + JSON.stringify(ko));
  if (m.style.yth !== 0) out.push('record of Vivaio ' + m.style.yth + ' after one good and one bad season');
  // a club of Bandiere: selling a boy costs patience
  m.pat = 0; G.mgrId.HAND.Bologna = ['flag'];
  const boy = W.players[boys[0]], to = W.clubs.find(c => c.id !== club.id && c.lg === club.lg);
  G.mgrDeal.sell(st, boy, to, 1);
  if (m.pat !== -I.FLAG_PAT || m.soldOwn !== 1) out.push('a boy sold by a club of Bandiere: patience ' + m.pat + ', sold ' + m.soldOwn);
  G.mgrId.HAND.Bologna = ['yth'];
  return out;
}

// An open bench at Atalanta (Spettacolo): attack is the right answer, "non prenderle" the wrong one
function interview(load) {
  const G = load(), out = [], st = bologna(G, 175), W = st.world, J = G.CFG2.MGR_JOBS;
  st.mgr.rep = 82;  // a manager Atalanta follows, so that nothing is cut at 0 or 100
  const club = W.clubs.find(c => c.name === 'Atalanta'), now = G.mgrJobs.now(st);
  const good = G.mgrId.answers(W, club, { play: 'att', mkt: 'fin' }), bad = G.mgrId.answers(W, club, { play: 'def', mkt: 'fin' });
  if (!(good > 0) || !(bad < 0)) out.push('answers: right ' + good + ', wrong ' + bad);
  if (G.mgrId.questions(W, club).length !== 2 || G.mgrId.questions(W, W.clubs.find(c => c.name === 'Ajax')).length !== 3) out.push('2 questions, 3 when the club cares for its boys');
  st.mgr.tactic = 'att'; const att = G.mgrJobs.interest(st, club); st.mgr.tactic = 'def'; const def = G.mgrJobs.interest(st, club); st.mgr.tactic = 'bal';
  if (att - def !== 2 * J.IDT) out.push('interest with an attacking style ' + att + ', defensive ' + def);
  const p0 = G.mgrJobs.chance(st, club);
  st.vac = [{ club: club.id, from: now, until: now + 7, co: 0 }];
  G.mgrJobs.apply(st, club.id, { play: 'att', mkt: 'fin' });
  const hi = st.vac[0].app;
  st.vac = [{ club: club.id, from: now, until: now + 7, co: 0 }];
  G.mgrJobs.apply(st, club.id, { play: 'def', mkt: 'star' });
  const lo = st.vac[0].app;
  if (!(hi > p0) || !(lo < p0)) out.push('chance ' + p0 + ': right answers ' + hi + ', wrong ' + lo);
  return out;
}

const CHECKS = [
  { t: 'M9 S3: every club has 1 or 2 traits, the famous ones those written by hand, and a goal of identity', f: traits },
  { t: 'M9 S3: respecting the identity lengthens the patience, betraying it or selling a boy shortens it', f: patience },
  { t: 'M9 S3: the right answers at the interview raise the chance, the wrong ones lower it', f: interview }
];

module.exports = { CHECKS };
