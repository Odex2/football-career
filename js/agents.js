// @ts-check
// Agent market: agents change every season (skill, fees, who they follow, retirements, newcomers)
// and reopen or close to new clients at each transfer window.
// Agent: { i id, n name, nt nation, s stars 1-5, fee %, fame needed, open, ret retired }

G.agents = {};
/** @type {Agent[]|null} */
G.agents.pool = null;

/** @param {Agent} a @param {Rng} rng */
G.agents.price = function (a, rng) {
  var A = G.CFG.AGENT;
  a.fee = A.FEE[a.s] + rng.int(-1, 1);
  a.fame = Math.max(0, A.FAME[a.s] + rng.int(-A.JITTER, A.JITTER));
  a.open = !rng.chance(A.CLOSED);
};

/** @param {Agent[]} list @param {string} n @param {NationCode} nt @param {number} s @param {Rng} rng */
G.agents.add = function (list, n, nt, s, rng) {
  var a = /** @type {Agent} */ ({ i: list.length, n: n, nt: nt, s: s, ret: false });
  G.agents.price(a, rng);
  list.push(a);
  return a;
};

/** @param {Rng} rng */
G.agents.create = function (rng) {
  /** @type {Agent[]} */
  var list = [];
  G.AGENTS.forEach(function (x) { G.agents.add(list, x.n, x.nt, x.s, rng); });
  for (var k = 0; k < G.CFG.AGENT.EXTRA; k++) G.agents.newcomer(list, rng);
  return list;
};

/** @param {Agent[]} list @param {Rng} rng */
G.agents.newcomer = function (list, rng) {
  var nt = rng.pick(G.allNations());
  return G.agents.add(list, G.squads.name(nt, rng), nt, rng.pick([1, 1, 2, 2, 3]), rng);
};

// Older saves have no agent market: build it and keep the player's agent index valid
/** @param {State} st */
G.agents.ensure = function (st) {
  if (!st.world.agents) st.world.agents = G.agents.create(G.rng);
  G.agents.pool = st.world.agents;
};

/** @param {State} st */
G.agents.active = function (st) {
  return st.world.agents.filter(function (a) { return !a.ret && a.i !== st.player.agent; }).sort(function (a, b) { return (b.s - a.s) || (a.fame - b.fame); });
};

// Can this agent take the player on now?
/** @param {State} st @param {Agent} a */
G.agents.available = function (st, a) {
  return !a.ret && a.open && st.player.fame >= a.fame;
};

// January: agents open or close to new clients
/** @param {State} st @param {Rng} rng */
G.agents.reshuffle = function (st, rng) {
  st.world.agents.forEach(function (a) { if (!a.ret) a.open = !rng.chance(G.CFG.AGENT.CLOSED); });
};

// End of season: skills drift, fees and requirements move, some retire, newcomers arrive
/** @param {State} st @param {Rng} rng */
G.agents.yearEnd = function (st, rng) {
  var A = G.CFG.AGENT, p = st.player, list = st.world.agents;
  list.forEach(function (a) {
    if (a.ret) return;
    // your own agent never quits on you because of the market turnover
    if (p.agent !== a.i && rng.chance(A.RETIRE)) { a.ret = true; return; }
    if (rng.chance(A.DRIFT)) {
      var up = rng.chance(a.s <= 2 ? 0.55 : a.s === 3 ? 0.5 : 0.45), s = G.clamp(a.s + (up ? 1 : -1), 1, 5);
      if (s !== a.s && p.agent === a.i) G.news(st, (s > a.s ? '📈 ' : '📉 ') + 'Il tuo agente ' + a.n + (s > a.s ? ' sale di livello' : ' perde peso nel mercato'));
      a.s = s;
    }
    G.agents.price(a, rng);
  });
  // Keep a few elite agents around: the best mid-level ones step up
  var elite = list.filter(function (a) { return !a.ret && a.s >= 4; }).length;
  rng.shuffle(list.filter(function (a) { return !a.ret && a.s === 3; })).slice(0, Math.max(0, A.ELITE - elite)).forEach(function (a) {
    a.s = 4; G.agents.price(a, rng); G.news(st, '📈 ' + a.n + ' entra tra i super agenti');
  });
  var act = list.filter(function (a) { return !a.ret; }).length;
  for (; act < A.MIN || rng.chance(0.25 / (act - A.MIN + 1)); act++) {
    var a = G.agents.newcomer(list, rng);
    G.news(st, '🆕 Nuovo agente sul mercato: ' + a.n + ' (' + '★'.repeat(a.s) + ')');
  }
};
