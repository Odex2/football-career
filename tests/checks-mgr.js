// M8 phases B-G: the manager's new screens and rules.
//   watch(G, seen)   called by checks.watch for every career: an injured player never takes the pitch, and a manager
//                    has 2 to 7 injuries a season on average (B8.3); a block or a season played whole never stops at
//                    half time (C5.2). Problems go to seen.mgr.
//   CHECKS           quick checks for tests/checks-m8.js: a key player left on the bench loses morale and asks within
//                    two blocks (B8.2), the captain on the pitch adds CAP to the side (B8.4), "Gioca in diretta" stops
//                    once and plays the match (C5.1), the halves score like a whole match (C5.3), without a calendar
//                    it just plays (C5.4)
'use strict';

function watch(G, seen) {
  const out = seen.mgr = [], inj = { n: 0, seasons: 0 };
  require('./checks-deal').watch(G, seen);  // phase D: loans
  const side = G.mgrTeam.side;
  G.mgrTeam.side = function (st) {
    const r = side.apply(this, arguments), m = st.mgr;
    r.ids.concat(r.cameOn).forEach(id => { if (G.mgrSq.inj(m, id) && out.length < 5) out.push(st.S.year + ': ' + st.world.players[id].n + ' plays while injured'); });
    return r;
  };
  const news = G.news;
  G.news = function (st, t) { if (st.mgr && /^🚑/.test(String(t))) inj.n++; return news.apply(this, arguments); };
  const end = G.mgr.seasonEnd;
  G.mgr.seasonEnd = function (st) { if (G.mgr.active(st)) inj.seasons++; return end.apply(this, arguments); };
  seen.mgrInj = inj;
  const next = G.game.next;
  G.game.next = function (st, auto) {
    const r = next.apply(this, arguments);
    if (auto && st.event && st.event.mgrht && out.length < 5) out.push(st.S.year + ': a block played whole stopped at half time');
    return r;
  };
}

// What watch saw, once the career is over
function watched(seen) {
  const out = (seen.mgr || []).concat(seen.deal || []), inj = seen.mgrInj;
  if (inj && inj.seasons >= 4 && (inj.n / inj.seasons < 2 || inj.n / inj.seasons > 7)) out.push((inj.n / inj.seasons).toFixed(1) + ' injuries a season as a manager (the spec: 2 to 7)');
  return out;
}

// A manager at Bologna, everything automatic but the XI
function bologna(G, seed) {
  const st = G.game.newManager({ name: 'Test Manager', nat: 'ITA', bg: 'prov', age: 40, seed: seed });
  G.state = st;
  G.mgr.start(st, { club: st.world.clubs.find(c => c.name === 'Bologna').id, fans: 0, perks: null, bandiera: 0 });
  return st;
}

// B8.2: a 'cru' kept out of the XI for a whole block loses at least 7 points of morale and asks within two blocks
function benched(load) {
  const G = load(), out = [], st = bologna(G, 41), m = st.mgr, W = st.world;
  const id = Object.keys(m.sr).map(Number).filter(k => m.sr[k] === 'cru' && W.players[k].r !== 'POR')[0];
  const xi = G.mgrTeam.xi;
  G.mgrTeam.xi = function (s) {
    const x = xi.apply(this, arguments), k = x.findIndex(e => e.id === id);
    if (k >= 0) {
      const club = W.clubs[m.club], sub = G.squads.roleList(W, club, x[k].r).filter(p => p !== id && !x.some(e => e.id === p) && !G.mgrSq.inj(m, p))[0];
      if (sub !== undefined) x[k].id = sub;
    }
    m.mode = 'manual';
    return x;
  };
  let asked = -1;
  const blk = G.mgrSq.block;
  G.mgrSq.block = function (s, b) { const r = blk.apply(this, arguments); if (asked < 0 && m.req.some(q => q.id === id)) asked = b; return r; };
  const pm0 = G.mgrSq.pm(m, id);
  G.game.next(st, true); st.event = null;
  const pm1 = G.mgrSq.pm(m, id);
  if (pm0 - pm1 < 7) out.push(W.players[id].n + ' (Fondamentale) out of the XI for a block: morale ' + pm0 + ' → ' + pm1 + ', at least 7 less wanted');
  G.game.next(st, true);
  if (asked < 0) out.push(W.players[id].n + ' out of the XI for two blocks never asked for more space (morale ' + G.mgrSq.pm(m, id) + ')');
  return out;
}

// B8.4: the side gets CAP stronger when the captain starts
function captain(load) {
  const G = load(), out = [], st = bologna(G, 42), m = st.mgr, W = st.world, club = W.clubs[m.club];
  const xi = G.mgrTeam.xi(st), on = xi[5].id, off = club.sq.filter(id => !xi.some(x => x.id === id))[0];
  m.cap = on; const a = G.mgrTeam.side(st, club).str;
  m.cap = off; const b = G.mgrTeam.side(st, club).str;
  if (Math.abs(a - b - G.CFG2.MGR_SQ.CAP) > 1e-9) out.push('the captain in the XI adds ' + (a - b).toFixed(3) + ' to the side, the spec says ' + G.CFG2.MGR_SQ.CAP);
  return out;
}

// C5.1: "Gioca in diretta" stops once at half time; after the answer the match is played with the first-half goals in
// it, and the block goes on
function liveOnce(load) {
  const G = load(), out = [], st = bologna(G, 43), m = st.mgr, S = st.S;
  let stops = 0;
  const stop = G.mgrLive.stop;
  G.mgrLive.stop = function () { const r = stop.apply(this, arguments); if (r) stops++; return r; };
  const e = G.cal.next(st, m.club);
  st.mgrLiveReq = 1; G.game.next(st, false, true);
  if (!st.event || !st.event.mgrht || !st.mgrHT) return ['"Gioca in diretta" did not stop at half time before ' + (e ? e.name : 'the first match')];
  const ht = st.mgrHT.ht.slice(), rows = S.blockRows.length;
  G.events.apply(st, 1); G.game.next(st, false, true);
  const r = S.blockRows[S.blockRows.length - 1];
  if (stops !== 1) out.push('it stopped ' + stops + ' times for one match');
  if (S.blockRows.length !== rows + 1 || !r || !r.live) out.push('after the answer the match was not played live');
  else if (r.gf < ht[0] || r.ga < ht[1] || r.ht[0] !== ht[0] || r.ht[1] !== ht[1]) out.push('final ' + r.gf + '-' + r.ga + ' without the half-time ' + ht.join('-'));
  if (st.mgrHT || st.event || st.mgrLiveReq) out.push('half time left behind: ' + JSON.stringify({ ht: st.mgrHT, ev: !!st.event, req: st.mgrLiveReq }));
  const sum = G.game.next(st, true);
  if (!sum || sum.partial || stops !== 1) out.push('the block did not go on to its end (' + stops + ' stops)');
  return out;
}

// C5.3: two halves with no change score as many goals as a whole match (equal strengths, 20,000 matches)
function halves(load) {
  const G = load(), out = [], rng = G.makeRng(7), N = 20000, H = { key: '', opp: 0, home: true, ht: [0, 0], my: 70, op: 70, pick: null }, L = G.CFG2.MGR_LIVE.HALF1;
  let whole = 0, two = 0;
  for (let i = 0; i < N; i++) {
    const a = G.mgrTeam.sim(70, 70, [0, 0], null, rng); whole += a[0] + a[1];
    const h1 = G.mgrLive.goals(H, [0, 0], 0, L, rng), h2 = G.mgrLive.goals(H, [0, 0], 0, 1 - L, rng); two += h1[0] + h1[1] + h2[0] + h2[1];
  }
  if (Math.abs(two / whole - 1) > 0.03) out.push('goals per match ' + (whole / N).toFixed(3) + ' whole, ' + (two / N).toFixed(3) + ' in two halves');
  return out;
}

// C5.4: without a calendar (a season begun before M8) the opponent of a cup round is not known before the day:
// "Gioca in diretta" just plays, and no request is left hanging
function liveOld(load) {
  const G = load(), out = [], st = bologna(G, 44), S = st.S;
  delete S.cal; delete S.today; Object.keys(S.cups).forEach(k => delete S.cups[k].ties);
  st.mgrLiveReq = 1; const n = S.blockRows.length; G.game.next(st, false, true);
  if (st.event && st.event.mgrht) out.push('it stopped at half time without a calendar');
  if (S.blockRows.length === n) out.push('no match was played');
  if (st.mgrLiveReq) out.push('mgrLiveReq left at ' + st.mgrLiveReq);
  return out;
}

const CHECKS = [
  { t: 'M8 B: a key player left on the bench loses morale and asks for space', f: benched },
  { t: 'M8 B: the captain on the pitch makes the side stronger', f: captain },
  { t: 'M8 C: "Gioca in diretta" stops once at half time, then plays the match', f: liveOnce },
  { t: 'M8 C: two halves score like a whole match', f: halves },
  { t: 'M8 C: without a calendar "Gioca in diretta" just plays', f: liveOld }
];

module.exports = { watch, watched, CHECKS };
