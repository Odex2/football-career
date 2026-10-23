// @ts-check
// Headless career simulations for balancing (browser console or node):
// G.debug.simCareers(200) averages full careers; G.debug.compare(a, b) plays the same careers twice with two plans.

G.debug = {};

// One career with the debug policy (take the best offer from a clearly bigger club); plan = { focus, intensity } kept all career
/** @param {number} i @param {DebugOpts} opts @returns {Dict<any>} */
G.debug.career = function (i, opts) {
  var roles = Object.keys(G.ROLES), nats = Object.keys(G.NATIONS);
  var st = G.game.newCareer({ name: 'Sim ' + i, nat: opts.nat || nats[i % nats.length], role: opts.role || roles[i % roles.length],
    foot: 'D', start: i % 3 ? 'second' : 'loan', seed: (opts.seed || 1000) + i });
  st.debug = 1;
  var p = st.player, peak = 0, ovrAt = null, inj = 0;
  if (opts.plan) { p.plan.focus = opts.plan.focus || p.plan.focus; if (opts.plan.intensity !== undefined) p.plan.intensity = opts.plan.intensity; }
  while (!st.over) {
    var own = st.world.clubs[p.clubId], best = (st.offers || []).filter(function (o) { return o.type !== 'loan' && st.world.clubs[o.club].rep > own.rep + 3; })
      .sort(function (a, b) { return st.world.clubs[b.club].rep - st.world.clubs[a.club].rep; })[0];
    if (best) { if (best.blocked) G.contracts.payClause(st, best.id); G.transfers.accept(st, best.id); }
    G.game.simSeason(st);
    st.recap = null; st.event = null;
    peak = Math.max(peak, p.ovr);
    if (opts.at && p.age === opts.at) ovrAt = p.ovr;
    if (!st.over && (p.age >= (opts.retireAge || 36) || (opts.stopAge && p.age >= opts.stopAge)) && (opts.stopAge || G.game.canRetire(st))) G.game.retire(st);
  }
  p.history.forEach(function (h) { inj += h.inj || 0; });
  return { role: p.role, pot: p.pot, goals: p.tot.goals, apps: p.tot.apps, trophies: p.trophies.length, peak: peak, ovrAt: ovrAt === null ? p.ovr : ovrAt,
    retire: p.age, awards: p.awards.length, bdo: p.awards.filter(function (a) { return a.name === 'Pallone d’Oro'; }).length,
    fame: p.fame, money: p.money, inj: inj };
};

/** @param {Dict<any>[]} list @param {string} k @returns {number} */
G.debug.avg = function (list, k) { return list.length ? Math.round(list.reduce(function (a, x) { return a + x[k]; }, 0) / list.length * 10) / 10 : 0; };

/** @param {number} [n] @param {DebugOpts} [opts] */
G.debug.simCareers = function (n, opts) {
  n = n || 20; opts = opts || {};
  var /** @type {Dict<any>[]} */ agg = [], t0 = Date.now(), saved = G.rng, A = G.debug.avg;
  for (var i = 0; i < n; i++) {
    var r = G.debug.career(i, opts); agg.push(r);
    if (opts.verbose) console.log(r.role, 'pot', r.pot, 'peak', r.peak, 'goals', r.goals, 'trophies', r.trophies, 'awards', r.awards);
  }
  G.rng = saved;
  var out = { careers: n, ms: Date.now() - t0, goals: A(agg, 'goals'), apps: A(agg, 'apps'), trophies: A(agg, 'trophies'), peakOvr: A(agg, 'peak'),
    retireAge: A(agg, 'retire'), awards: A(agg, 'awards'), ballonDor: A(agg, 'bdo'), fame: A(agg, 'fame'), money: A(agg, 'money'), injuries: A(agg, 'inj'), byRole: /** @type {Dict<Dict<number>>} */ ({}) };
  Object.keys(G.ROLES).forEach(function (r) {
    var l = agg.filter(function (x) { return x.role === r; });
    if (l.length) out.byRole[r] = { goals: A(l, 'goals'), peak: A(l, 'peak'), trophies: A(l, 'trophies') };
  });
  console.log(out);
  return out;
};

// Same seeds, two plans: G.debug.compare({ focus: 'att' }, { focus: 'bal' }, { n: 6, role: 'ATT', stopAge: 24, at: 23 })
/** @param {DebugOpts['plan']} a @param {DebugOpts['plan']} b @param {DebugOpts} [opts] */
G.debug.compare = function (a, b, opts) {
  opts = opts || {};
  var n = opts.n || 6, saved = G.rng, keys = ['ovrAt', 'peak', 'goals', 'apps', 'inj', 'trophies', 'awards'], res = [a, b].map(function (plan) {
    var /** @type {DebugOpts} */ o = {}, k; for (k in opts) o[k] = opts[k]; o.plan = plan;
    var /** @type {Dict<any>[]} */ list = []; for (var i = 0; i < n; i++) list.push(G.debug.career(i, o));
    var /** @type {Dict<number>} */ out = {}; keys.forEach(function (k2) { out[k2] = G.debug.avg(list, k2); });
    return out;
  });
  G.rng = saved;
  var /** @type {Dict<number>} */ diff = {}; keys.forEach(function (k) { diff[k] = Math.round((res[0][k] - res[1][k]) * 10) / 10; });
  var out = { a: res[0], b: res[1], diff: diff };
  console.log(JSON.stringify(a), 'vs', JSON.stringify(b), out);
  return out;
};
