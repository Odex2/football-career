// Fixed-seed careers played with simple, deterministic policies. They are the same in every run, so their
// results can be compared before and after a change and checked for sanity (node tests/run.js).
'use strict';
const harness = require('./harness');

// Full playing career: accept the best offer from a clearly bigger club, pick the first season goal,
// train the role's key attributes; retire at 35
function player(G, o) {
  const st = o.st || G.game.newCareer({ name: o.name, nat: o.nat, role: o.role || G.POS[o.pos].r, pos: o.pos, foot: o.foot || 'D', start: o.start || 'second', seed: o.seed });
  const p = st.player;
  p.plan.focus = o.focus || 'key';
  if (o.intensity !== undefined) p.plan.intensity = o.intensity;
  let guard = 0;
  while (!st.over && guard++ < (o.seasons || 40)) {
    const own = st.world.clubs[p.clubId];
    const best = (st.offers || []).filter(x => x.type !== 'loan' && st.world.clubs[x.club].rep > own.rep + 3)
      .sort((a, b) => st.world.clubs[b.club].rep - st.world.clubs[a.club].rep)[0];
    if (best) { if (best.blocked) G.contracts.payClause(st, best.id); G.transfers.accept(st, best.id); }
    if (st.goalOffer && !st.goal) G.goals.pick(st, guard % st.goalOffer.length);
    G.game.simSeason(st);
    st.recap = null; st.event = null;
    if (!st.over && p.age >= (o.retireAge || 35) && G.game.canRetire(st)) G.game.retire(st);
  }
  return st;
}

// Manager seasons: tactic and formation change every season, a manual XI every third season,
// two signings each summer (a plain negotiation, js/mgr-deal.js), a move when a bigger club calls (from season 4)
function manager(G, st, seasons) {
  const m = st.mgr, forms = Object.keys(G.mgrTeam.FORMS), tactics = ['bal', 'att', 'def'];
  for (let s = 0; s < seasons && !st.over; s++) {
    // the end-of-season calls from season 4; any other offer only without a job (M9 S2: mid-season offers are not taken)
    if (st.mgrOffers && st.mgrOffers.list && st.mgrOffers.list.length && (st.mgrOffers.why === 'calls' ? s >= 4 : !G.mgr.active(st))) G.mgr.start(st, st.mgrOffers.list[0]);
    st.mgrOffers = null;
    if (!G.mgr.active(st)) break;
    const W = st.world, club = W.clubs[m.club];
    m.tactic = tactics[s % 3];
    G.mgrTeam.setForm(st, forms[s % forms.length]);
    if (s % 3 === 2) {
      const xi = G.mgrTeam.xi(st), k = 4, bench = club.sq.filter(id => !xi.some(x => x.id === id) && W.players[id].r === xi[k].r);
      if (bench.length) G.mgrTeam.setSlot(st, k, bench[0]);
    } else m.mode = 'auto';
    if (st.S && !st.S.cur && st.S.block === 0) G.mgr.targets(st).slice(0, 2).forEach(pl => G.mgrDeal.quick(st, pl.i));  // 100%, the role he would get
    G.game.simSeason(st);
    if (st.recap && st.recap.last) G.mgr.retire(st);
    st.recap = null;
    if (st.event) G.mgrEv.apply(st, 0);
  }
  return st;
}

const LIST = [
  { id: 'player-att-ita', run: G => player(G, { name: 'Luca Neri', nat: 'ITA', role: 'ATT', seed: 101 }) },
  { id: 'player-por-eng', run: G => player(G, { name: 'Tom Hale', nat: 'ENG', role: 'POR', seed: 202, start: 'loan' }) },
  { id: 'player-cc-esp', run: G => player(G, { name: 'Pablo Ruiz', nat: 'ESP', role: 'CC', seed: 303, focus: 'bal', intensity: 0 }) },
  { id: 'player-dc-ger', run: G => player(G, { name: 'Jan Vogt', nat: 'GER', role: 'DC', seed: 404, intensity: 2 }) },
  { id: 'player-es-fra', run: G => player(G, { name: 'Hugo Blanc', nat: 'FRA', role: 'ES', seed: 505, retireAge: 33 }) },
  // M9 S5 (P6): a new career for three positions that are not a role of before, 8 seasons
  { id: 'player-trq-ita', run: G => player(G, { name: 'Dario Fanti', nat: 'ITA', pos: 'TRQ', seed: 1201, seasons: 8 }) },
  { id: 'player-med-eng', run: G => player(G, { name: 'Jack Moss', nat: 'ENG', pos: 'MED', seed: 1202, seasons: 8 }) },
  { id: 'player-sp-arg', run: G => player(G, { name: 'Lucas Paz', nat: 'ARG', pos: 'SP', foot: 'S', seed: 1203, seasons: 8 }) },
  { id: 'manager-prov', run: G => { const st = G.game.newManager({ name: 'Rino Sala', nat: 'ITA', bg: 'prov', age: 38, seed: 606 }); G.mgr.start(st, st.mgrOffers.list[0]); return manager(G, st, 10); } },
  { id: 'manager-naz', run: G => { const st = G.game.newManager({ name: 'Iker Mora', nat: 'ESP', bg: 'naz', age: 42, seed: 707 }); G.mgr.start(st, st.mgrOffers.list[0]); return manager(G, st, 10); } },
  { id: 'manager-young', run: G => { const st = G.game.newManager({ name: 'Ben Ward', nat: 'ENG', bg: 'young', age: 33, seed: 808 }); G.mgr.start(st, st.mgrOffers.list[0]); return manager(G, st, 10); } },
  { id: 'player-then-manager', run: G => {
    const st = player(G, { name: 'Marco Gialli', nat: 'ITA', role: 'TS', seed: 909, retireAge: 34 });
    G.mgr.offerSet(st, 'start'); G.mgr.start(st, st.mgrOffers.list[0]);
    return manager(G, st, 6);
  } },
  // a save written before coach and director were merged (and before M8): a director whose club has its own coach
  { id: 'old-director-save', run: G => {
    const st = player(G, { name: 'Ugo Riva', nat: 'ITA', role: 'CC', seed: 111, retireAge: 33 });
    G.mgr.offerSet(st, 'start'); const o = st.mgrOffers.list[0]; G.mgr.start(st, o);
    const m = st.mgr, W = st.world, club = W.clubs[m.club];
    m.role = 'ds'; delete m.form; delete m.mode; delete m.xi; delete m.cond; delete m.starts; delete m.played;
    ['sr', 'pm', 'fm', 'inj', 'cap', 'bs', 'bp', 'req', 'promise', 'list'].forEach(k => delete m[k]);  // nor the M8 squad (phase B)
    ['rep2', 'neg', 'bids', 'loans', 'split', 'wageRoom', 'deal', 'assist', 'ys', 'yth', 'dev', 'train', 'goals', 'nt', 'ntOffer'].forEach(k => delete m[k]);  // nor the market, the academy, the board (D-F)
    W.clubs.forEach(c => delete c.fm);  // nor the clubs' form (phase C)
    W.coaches[m.co].c = -1; G.coaches.hire(st, club, G.rng); m.co = -1; m.policy = 'rot';
    st.mgrOffers = { why: 'calls', coach: [o], ds: [o] };
    const back = G.save.restore(G.save.parse(G.save.json(st)));
    back.mgrOffers = null;
    return manager(G, back, 3);
  } },
  // M8 phase A: South American nationalities and the random first club
  { id: 'player-bra-random', run: G => player(G, { name: 'Caio Lima', nat: 'BRA', role: 'ATT', seed: 1001, start: 'random' }) },
  { id: 'player-ecu-loan', run: G => player(G, { name: 'Kendry Mena', nat: 'ECU', role: 'CC', seed: 1002, start: 'loan' }) },
  { id: 'player-ita-random', run: G => player(G, { name: 'Dario Fumo', nat: 'ITA', role: 'DC', seed: 1003, start: 'random' }) },
  { id: 'manager-arg-naz', run: G => { const st = G.game.newManager({ name: 'Diego Paz', nat: 'ARG', bg: 'naz', age: 41, seed: 1004 }); G.mgr.start(st, st.mgrOffers.list[0]); return manager(G, st, 6); } },
  { id: 'old-save-pre-m8', run: G => oldSave(G) },
  // M8 phase C: one season match by match with "Gioca in diretta", every half-time answer in turn
  { id: 'manager-live', run: G => live(G) },
  // M8 phases D and E: the FIFA-style market (and the academy)
  { id: 'manager-fifa', run: G => fifa(G) },
  // M9 S2: the coaches' market, applying to every open bench where the interest is 70 or more
  { id: 'manager-carousel', run: G => carousel(G) },
  // M9 S4: 8 seasons, the pact alternating "Ambizioso" and "Ricostruzione" (when the board says no, "Normale")
  { id: 'manager-pact', run: G => pact(G) }
];

// M9 S4 (M11.9): the pact of every summer, then the season as manager plays it; checks that
// the expectations and the goal stay inside their limits
function pact(G) {
  const st = G.game.newManager({ name: 'Paco Patto', nat: 'ESP', bg: 'naz', age: 41, seed: 1107 });
  G.mgr.start(st, st.mgrOffers.list[0]);
  for (let s = 0; s < 8 && !st.over; s++) {
    if (G.mgr.active(st) && G.mgrPact.open(st)) G.mgrPact.set(st, s % 2 ? 'reb' : 'amb');
    const m = st.mgr, club = m.club !== null ? st.world.clubs[m.club] : null;
    if (club && ((club.exp || 0) < -2 || (club.exp || 0) > 4 || m.obj.tgt < 1 || m.obj.tgt >= m.obj.n)) throw new Error('manager-pact: exp ' + club.exp + ', goal ' + m.obj.tgt);
    manager(G, st, 1);
  }
  return st;
}

// M9 S2 (M10.9): 10 seasons block by block; applies to every open bench with interest >= 70,
// takes every offer made mid-season (resigning if the club does not let him go) and the first one without a job,
// turns down the end-of-season calls. The board is kept patient, so the moves are the market's
function carousel(G) {
  const st = G.game.newManager({ name: 'Gino Giro', nat: 'ITA', bg: 'naz', age: 40, seed: 1006 });
  G.mgr.start(st, st.mgrOffers.list[0]);
  const y0 = st.S.year, m = st.mgr;
  let guard = 0;
  while (!st.over && (!st.S || st.S.year < y0 + 10) && guard++ < 200) {
    (st.vac || []).forEach(v => { if (!v.held && v.app === undefined && v.club !== m.club && G.mgrJobs.interest(st, st.world.clubs[v.club]) >= 70) G.mgrJobs.apply(st, v.club); });
    const mo = st.mgrOffers;
    if (mo && mo.list.length && (mo.why === 'mid' || mo.why === 'vacancy' || !G.mgr.active(st))) G.mgrJobs.take(st, 0, true);
    else if (!G.mgr.active(st)) { G.mgrJobs.wait(st); continue; }
    if (st.mgrOffers && st.mgrOffers.why === 'calls') st.mgrOffers = null;
    if (st.event) G.mgrEv.apply(st, 0);
    st.recap = null; m.conf = Math.max(m.conf, 30);
    G.game.next(st, true);
    benches(st);
  }
  if (m.jobs < 3) throw new Error('manager-carousel: ' + (m.jobs - 1) + ' changes of club in 10 seasons, at least 2 expected');
  return st;
}

// Every club has one coach, sitting on its bench, and no coach sits on two
function benches(st) {
  const W = st.world, seen = {};
  W.clubs.forEach(c => {
    const co = W.coaches[c.coach];
    if (!co || co.c !== c.id) throw new Error('benches: ' + c.name + ' has coach ' + c.coach + (co ? ', who is at club ' + co.c : ''));
  });
  W.coaches.forEach(co => {
    if (co.c < 0) return;
    if (seen[co.c] || W.clubs[co.c].coach !== co.i) throw new Error('benches: two coaches on the bench of ' + W.clubs[co.c].name);
    seen[co.c] = 1;
  });
}

function live(G) {
  const st = G.game.newManager({ name: 'Leo Vivo', nat: 'ITA', bg: 'prov', age: 39, seed: 1005 });
  G.mgr.start(st, st.mgrOffers.list[0]);
  const y = st.S.year;
  let n = 0, guard = 0;
  while (!st.over && G.mgr.active(st) && st.S.year === y && guard++ < 400) {
    if (st.event && st.event.mgrht) { G.mgrLive.pick(st, n++ % 4); G.game.next(st, false, true); continue; }
    if (st.event) G.mgrEv.apply(st, 0);
    st.recap = null;
    if (st.S.block > 4) { G.game.next(st, true); continue; }
    st.mgrLiveReq = 1; G.game.next(st, false, true);
  }
  if (n < 20) throw new Error('manager-live: only ' + n + ' matches played live');
  st.recap = null; st.mgrOffers = null;
  return st;
}

// M8 phases D and E: six seasons with the new market and the academy, the same policy at every turn: in every window
// the scouts' first name at 100% with the role he would get, the offers for our players answered by the rule of D3;
// the contracts left to the manager, who renews his key players when they have one year left; two youth scouts in
// Brazil at level 2, and the best boy of the youth squad promoted when a season begins
function fifa(G) {
  const st = G.game.newManager({ name: 'Ezio Fifa', nat: 'ITA', bg: 'prov', age: 41, seed: 1006 });
  // at Bologna, a club with the money for the market and the scouts (the first offers have none)
  G.mgr.start(st, { club: st.world.clubs.find(c => c.name === 'Bologna').id, fans: 0, perks: null, bandiera: 0 });
  const m = st.mgr, y0 = st.S.year;
  m.assist.contracts = 0;
  let guard = 0;
  while (!st.over && st.S && st.S.year < y0 + 6 && guard++ < 100) {
    if (st.mgrOffers && st.mgrOffers.list && st.mgrOffers.list.length && !G.mgr.active(st)) G.mgr.start(st, st.mgrOffers.list[0]);  // without a job only (M9 S2)
    st.mgrOffers = null; st.recap = null;
    if (st.event) G.mgrEv.apply(st, 0);
    if (!G.mgr.active(st)) break;
    const W = st.world, sq = W.clubs[m.club].sq;
    while (m.ys.length < 2 && !G.mgrYouth.hire(st)) G.mgrYouth.setScout(st, m.ys.length - 1, 'lvl', '2');
    if (G.mgr.open(st)) {
      const pl = G.mgr.targets(st)[0];
      if (pl) G.mgrDeal.quick(st, pl.i);
      G.mgrDeal.autoBids(st);
    }
    sq.filter(id => (m.sr[id] === 'cru' || m.sr[id] === 'imp') && W.players[id].y <= 1).forEach(id => G.mgrDeal.renew(st, id, 3));
    if (!st.S.cur && st.S.block === 0 && m.yth.length) {
      const mid = x => G.mgrYouth.pot(x).reduce((a, b) => a + b);
      G.mgrYouth.promote(st, m.yth.indexOf(m.yth.slice().sort((a, b) => mid(b) - mid(a))[0]));
    }
    G.game.next(st, true);
  }
  st.recap = null; st.mgrOffers = null;
  return st;
}

// M8 J11.8: a save written before the calendar, in the middle of a season. It ends that season with the old
// abstract days; the season after has a calendar.
function oldSave(G) {
  const st = G.game.newCareer({ name: 'Elia Conti', nat: 'ITA', role: 'ES', foot: 'D', start: 'second', seed: 1101 }), S = st.S;
  delete S.cal; delete S.today; delete st.attrs0;  // what a save made before M8 does not have
  Object.keys(S.cups).forEach(k => delete S.cups[k].ties);
  G.game.next(st, true); G.game.next(st, true); st.event = null;
  delete S.rows;
  const back = G.save.restore(G.save.parse(G.save.json(st)));
  G.game.simSeason(back); back.recap = null; back.event = null;
  if (!back.S || !back.S.cal) throw new Error('old-save-pre-m8: no calendar in the season after the old save');
  return player(G, { st: back, seasons: 3 });
}

// Plays one scenario in a fresh game
function play(sc) {
  const G = harness.load();
  const st = sc.run(G);
  return { G, st };
}

module.exports = { LIST, play, player, manager };
