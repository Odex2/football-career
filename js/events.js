// @ts-check
// Event engine. Cards live in js/events-data.js as plain data:
// { id, w: weight or function(X), c: condition(X), t: title, d: text, o: [[label, effects, resultText, failText]] }
// Effects: mo morale, rel coach relation, fa fame, fn fans current club, $ money k€, fo form, inj matches out,
// at {attr: +n}, req request transfer, vis extra visibility, p probability with ok/ko sub-effects,
// special: agent, renew, offer: 'KSA'|'USA'|'HOME'|'COACH', promise, buy: itemKey

G.events = {}; /** @type {EventDef[]} */ G.events.cards = [];

// Context object passed to conditions and used for text placeholders
/** @param {State} st @returns {EvCtx} */
G.events.ctx = function (st) {
  var p = st.player, W = st.world, club = W.clubs[p.clubId], S = st.S, L = G.leagueByKey(club.lg);
  var co = G.coaches.of(W, club), last = st.lastBlock || /** @type {BlockSum} */ ({});
  var ids = S ? G.season.sortTable(S, club.lg) : [];
  var riv = club.riv.length ? W.clubs[club.riv[0]] : null;
  var euro = S ? G.europe.compsOf(st, club.id) : [];
  var X = /** @type {EvCtx} */ ({ st: st, p: p, W: W, club: club, L: L, co: co, rel: co ? p.rel[co.i] || 0 : 0, b: S ? S.block : 0,
    age: p.age, fame: p.fame, money: p.money, ovr: p.ovr, form: p.form, morale: p.morale, last: last,
    minShare: last.minShare === undefined ? 0.5 : last.minShare, avg: last.avg || 0, goalsS: S ? S.ps.goals : 0, appsS: S ? S.ps.apps : 0,
    pos: ids.indexOf(club.id) + 1, n: ids.length, tier: L.tier, big: club.rep >= 80, euro: euro, riv: riv,
    loan: p.loanFrom !== null, flags: st.flags || {}, seasons: p.seasons, atClub: p.seasonsAt[club.id] || 0,
    abroad: club.nat !== p.nat, homeLg: !!G.NATIONS[p.nat], att: p.role === 'ATT' || p.role === 'ES', def: p.role === 'DC' || p.role === 'TS' || p.role === 'POR' });
  return G.events.stats(st, X);
};

// Real numbers for conditions and texts: league goals and scorer ranking, recent matches, team and cup status
/** @param {State} st @param {EvCtx} X @returns {EvCtx} */
G.events.stats = function (st, X) {
  var S = st.S, p = X.p, W = X.W, club = X.club, ps = S ? S.ps : G.season.emptyStats();
  X.lgG = ps.lg[1]; X.lgA = ps.lg[2]; X.lgApps = ps.lg[0];
  X.lastApps = X.last.apps || 0; X.lastG = X.last.goals || 0; X.lastMatches = X.last.matches || 0;
  X.minPct = Math.round(X.minShare * 100);
  var played = (X.last.rows || []).filter(function (r) { return r.mins > 0; });
  X.recent = function (n, f) { var r = played.slice(-n); return r.length === n && r.every(f); };
  X.dry = 0;
  for (var i = played.length - 1; i >= 0 && !played[i].g; i--) X.dry++;
  X.scorerRank = 99; X.leaderG = 0;
  if (S && X.lgG > 0) {
    var others = G.awards.entries(st, club.lg, 'lg').filter(function (e) { return !e.me; });
    X.scorerRank = 1 + others.filter(function (e) { return e.g > X.lgG; }).length;
    X.leaderG = others.reduce(function (m, e) { return Math.max(m, e.g); }, X.lgG);
  }
  X.bdoRank = 99;
  if (S && X.fame >= 40 && X.b >= 2) {
    var list = G.awards.bdo(st);
    for (var k = 0; k < Math.min(10, list.length); k++) if (list[k].me) X.bdoRank = k + 1;
  }
  X.teamBest = club.sq.reduce(function (m, id) { return Math.max(m, W.players[id].o); }, 0);
  var cup = S ? S.cups[club.nat] : null;
  X.cupAlive = !!cup && cup.winner === null && cup.alive.indexOf(club.id) >= 0;
  X.euAlive = X.euro.some(function (k) {
    var c = G.sure(S).eu[k];  // X.euro is empty without a season
    return c.stage === 'lp' || (c.stage !== 'done' && (c.ties || []).some(function (t) { return t.indexOf(club.id) >= 0; }));
  });
  X.ptsGap = 0;
  if (S && X.pos > 0) {
    var ids = G.season.sortTable(S, club.lg), tab = S.lg[club.lg].tab, rival = X.pos === 1 ? ids[1] : ids[0];
    X.ptsGap = Math.abs(tab[rival][6] - tab[club.id][6]);
  }
  return X;
};

/** @param {string} txt @param {EvCtx} X */
G.events.fill = function (txt, X) {
  /** @type {Dict<string|number|undefined>} */
  var v = { club: X.club.name, coach: X.co ? X.co.n : 'il mister', league: X.L.name, name: X.p.name, rival: X.flags.newRival || (X.riv ? X.riv.name : 'i rivali'),
      riv: X.riv ? X.riv.name : 'i rivali', age: X.age, lgG: X.lgG, rank: X.scorerRank, leaderG: X.leaderG, bdoRank: X.bdoRank,
      lastG: X.lastG, lastApps: X.lastApps, avg: X.avg ? X.avg.toFixed(1) : '-', minPct: X.minPct, dry: X.dry, pos: X.pos, gap: X.ptsGap, nation: G.nationInfo(X.p.nat).name, follow: G.life.followers(X.p),
      derby: X.derbyName || '', betN: X.betN, newRole: X.swap ? G.POS[X.swap.pos || G.pos.std(X.swap.to, X.p.foot)].n.toLowerCase() : '', newOvr: X.swap ? X.swap.ovr : '',
      newPct: X.swap ? Math.round(X.swap.ch * 100) : '', nowPct: X.swap ? Math.round(X.swap.now * 100) : '', rivalName: X.st.records && X.st.records.rival ? X.st.records.rival.n : 'il tuo rivale' };
  return txt.replace(/\{(\w+)\}/g, function (m, k) { return v[k] !== undefined ? String(v[k]) : m; });
};

/** @param {State} st */
G.events.roll = function (st) {
  if (st.over || st.event || !st.S) return;
  var X = G.events.ctx(st), rng = G.rng;
  var used = st.evUsed || (st.evUsed = {});
  var pool = G.events.cards.filter(function (c) {
    if (used[c.id] && (c.once || used[c.id] === st.year)) return false;
    try { return c.c(X); } catch (e) { return false; }
  });
  var forced = pool.filter(function (c) { return c.force; });
  if (!forced.length && !rng.chance(G.CFG.EVENT_CHANCE)) return;
  if (forced.length) pool = forced;
  var w = pool.map(function (c) { return typeof c.w === 'function' ? c.w(X) : (c.w || 1); });
  var i = G.match.pickWeighted(w, rng);
  if (i < 0) return;
  var card = pool[i];
  used[card.id] = card.once ? 1 : st.year;
  st.event = { id: card.id, t: G.events.fill(card.t, X), d: G.events.fill(card.d, X), o: card.o.map(function (o) { return G.events.fill(o[0], X); }) };
  if (card.clear) delete (st.flags || {})[card.clear];
};

/** @param {State} st @param {number} idx */
G.events.apply = function (st, idx) {
  var ev = G.sure(st.event);
  if (!ev) return;
  if (ev.moment) return G.moments.pick(st, idx);
  if (ev.mgrht) return G.mgrLive.pick(st, idx);
  if (ev.mgr) return G.mgrEv.apply(st, idx);
  var card = (ev.press ? G.press.cards : G.events.cards).filter(function (c) { return c.id === ev.id; })[0];
  var opt = card.o[idx] || card.o[0], fx = opt[1] || /** @type {EventFx} */ ({}), X = G.events.ctx(st), txt = /** @type {string|undefined} */ (opt[2] || '');
  if (fx.p !== undefined) {
    var ok = G.rng.chance(fx.p);
    G.events.effects(st, fx, X);
    G.events.effects(st, ok ? fx.ok || {} : fx.ko || {}, X);
    txt = ok ? opt[2] : (opt[3] || opt[2]);
  } else G.events.effects(st, fx, X);
  var bn = G.sure(ev.betN);  // read only on press cards with a bet, which have it
  if (fx.bet) G.press.bet(st, fx.bet, bn[idx] !== undefined ? bn[idx] : bn[0], ev.o[idx] || ev.o[0]);
  st.event = null;
  st.eventResult = { t: ev.t, r: G.events.fill(txt || 'Fatto.', X) };
  G.news(st, (ev.press ? '' : '🗒️ ') + ev.t + ': ' + st.eventResult.r);
};

/** @param {State} st @param {EventFx} fx @param {EvCtx} X */
G.events.effects = function (st, fx, X) {
  var p = st.player, L = G.life, W = st.world;
  if (fx.mo) p.morale = Math.round(G.clamp(p.morale + fx.mo, 0, 100));
  if (fx.rel) L.relCurrent(st, fx.rel);
  if (fx.fa) L.fame(st, fx.fa);
  if (fx.fn) L.fans(st, p.clubId, fx.fn);
  if (fx.$) p.money = Math.max(Math.min(p.money, 0), Math.round(p.money + fx.$));
  if (fx.fo) p.form = G.clamp(p.form + fx.fo, -2, 2);
  if (fx.inj) p.inj = Math.max(0, p.inj + fx.inj);
  var at = fx.at;
  if (at) Object.keys(at).forEach(function (k) {
    var key = k === 'any' ? G.rng.pick(Object.keys(G.WEIGHTS[p.role])) : k;
    p.attrs[key] = G.clamp(p.attrs[key] + G.sure(at)[k], 15, 99);
  });
  if (fx.at) p.ovr = G.player.ovr(p);
  if (fx.req) G.transfers.requestMove(st);
  if (fx.vis) p.visBonus = (p.visBonus || 0) + fx.vis;
  if (fx.promise && p.contract) p.contract.role = 'titolare';
  if (fx.renew) G.transfers.requestRenewal(st, true);
  if (fx.buy) L.buy(st, fx.buy);
  if (fx.agent) {
    var best = -1;
    G.agents.active(st).forEach(function (a) { if (best < 0 && G.agents.available(st, a)) best = a.i; });
    if (best >= 0) L.hireAgent(st, best);
  }
  if (fx.dropAgent) { p.agent = null; G.news(st, '👋 Il tuo agente ti lascia'); }
  if (fx.offer) G.events.offer(st, fx.offer, X);
  if (fx.role) G.player.setRole(st, G.sure(G.events.roleSwap(st)));  // the card is drawn only when a swap exists
  if (fx.mark) (st.flags || (st.flags = {}))[fx.mark] = { y: st.year, club: p.clubId }; // follow-up cards in events-data3.js
};

/** @param {State} st @param {string} kind @param {EvCtx} X */
G.events.offer = function (st, kind, X) {
  var W = st.world, p = st.player, /** @type {Club[]} */ cand;
  if (kind === 'COACH') {
    var c = W.coaches.filter(function (co) { return co.c >= 0 && co.c !== p.clubId && (p.rel[co.i] || 0) >= 35; })[0];
    cand = c ? [W.clubs[c.c]] : [];
  } else {
    var nat = kind === 'HOME' ? p.nat : kind;
    cand = W.clubs.filter(function (c) { return c.nat === nat && c.lg === nat + '1' && c.id !== p.clubId && c.str <= p.ovr + 4; })
      .sort(function (a, b) { return b.rep - a.rep; }).slice(0, 3);
  }
  if (!cand.length) return;
  var o = G.transfers.makeOffer(st, G.rng.pick(cand), 'transfer', kind === 'COACH' ? 'Ti chiama il tuo ex allenatore' : 'Proposta nata da un evento');
  if (kind === 'KSA') o.wage = Math.round(o.wage * 2.2);
  if (kind === 'USA') o.wage = Math.round(o.wage * 1.3);
  (st.offers || (st.offers = [])).push(o);
};
