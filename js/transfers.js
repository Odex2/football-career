// @ts-check
// Transfer market: AI clubs (summer/January windows) and the main player's offers and negotiation.

G.transfers = {};

/** @param {World} W @returns {Dict<Npc[]>} */
G.transfers.buckets = function (W) {
  /** @type {Dict<Npc[]>} */
  var b = {};
  G.ROLE_KEYS.forEach(function (r) { b[r] = []; });
  W.players.forEach(function (pl) { if (pl) b[pl.r].push(pl); });
  G.ROLE_KEYS.forEach(function (r) { b[r].sort(function (x, y) { return x.o - y.o; }); });
  return b;
};

// Players of role r with o in [lo, hi], random sample of up to n
/** @param {Npc[]} bucket @param {number} lo @param {number} hi @param {number} n @param {Rng} rng @returns {Npc[]} */
G.transfers.sample = function (bucket, lo, hi, n, rng) {
  var a = 0, z = bucket.length;
  while (a < z) { var m = (a + z) >> 1; if (bucket[m].o < lo) a = m + 1; else z = m; }
  var b = a, y = bucket.length;
  while (b < y) { var k = (b + y) >> 1; if (bucket[k].o <= hi) b = k + 1; else y = k; }
  if (b - a <= n * 3) return rng.sample(bucket.slice(a, b), n);
  var /** @type {Npc[]} */ out = [], /** @type {Dict<number>} */ seen = {};
  while (out.length < n) { var i = a + Math.floor(rng.next() * (b - a)); if (!seen[i]) { seen[i] = 1; out.push(bucket[i]); } }
  return out;
};

/** @param {World} W @param {Club} club @returns {MarketNeed|null} */
G.transfers.need = function (W, club) {
  var F = G.CFG.FORMATION, best = /** @type {MarketNeed|null} */ (null);
  G.ROLE_KEYS.forEach(function (r) {
    var list = G.squads.roleList(W, club, r), n = F[r];
    var weak = list[n - 1] !== undefined ? W.players[list[n - 1]].o : 40;
    var gap = (club.str + 1) - weak;
    if (gap > 1.5 && (!best || gap > best.gap)) best = { r: r, lo: weak + 2, hi: weak + 12, gap: gap };
    if (list.length < n + 1 && (!best || best.gap < 2)) best = { r: r, lo: club.str - 9, hi: club.str - 1, gap: 2, depth: 1 };
  });
  return best;
};

/** @param {State} st @param {Npc} pl @param {Club} club @param {number} fee @param {number} wage */
G.transfers.move = function (st, pl, club, fee, wage) {
  var W = st.world, from = pl.c >= 0 ? W.clubs[pl.c] : null;
  if (from) { from.sq.splice(from.sq.indexOf(pl.i), 1); from.bud += fee; }
  club.bud -= fee; club.sq.push(pl.i);
  pl.c = club.id; pl.w = wage; pl.y = G.rng.int(2, 5); pl.fa = 0;
  var p = st.player;
  if (fee >= 40 || club.id === p.clubId || (from && from.id === p.clubId))
    G.news(st, '💰 ' + pl.n + ' (' + Math.round(pl.o) + ') ' + (from ? 'dal ' + from.name + ' ' : 'svincolato ') + 'al ' + club.name + (fee ? ' per ' + Math.round(fee) + ' M€' : ''));
  if (club.id === p.clubId && pl.r === p.role && pl.o >= p.ovr - 2) (st.flags || (st.flags = {})).newRival = pl.n;
};

// AI window: w = 0 summer, 1 January
/** @param {State} st @param {number} w */
G.transfers.window = function (st, w) {
  var C = G.CFG, W = st.world, rng = G.rng, /** @type {Dict<number>} */ buys = {}, ds = G.mgr.active(st) ? G.mgr.job(st).club : null;
  for (var pass = 0; pass < C.MARKET_PASSES[w]; pass++) {
    var bk = G.transfers.buckets(W);
    rng.shuffle(W.clubs.slice()).forEach(function (club) {
      if ((buys[club.id] || 0) >= C.MAX_BUYS[w] || (ds !== null && club.id === ds)) return;
      var need = G.transfers.need(W, club);
      if (!need) return;
      var bill = G.world.wageBill(W, club), cap = G.world.wageCap(club) * 1.05, best = /** @type {{ pl: Npc, fee: number, wage: number, score: number }|null} */ (null);
      G.transfers.sample(bk[need.r], need.lo, need.hi, C.CAND_SAMPLE, rng).forEach(function (pl) {
        if (pl.c === club.id || pl.ln !== undefined) return;  // a player on loan stays where he is (M8 D5)
        var seller = pl.c >= 0 ? W.clubs[pl.c] : null;
        if (seller && (seller.id === ds || (seller.id === st.player.clubId && rng.chance(0.5)))) return;
        if (seller && !(seller.rep <= club.rep + 2 || pl.y <= 1 || rng.chance(C.SELL_RESIST))) return;
        var fee = seller ? G.squads.value(pl.o, pl.a, pl.p) * (pl.y <= 1 ? 0.6 : 1) * (seller.rep > club.rep ? 1.2 : 1) : 0;
        var wage = Math.round(Math.max(pl.w, G.squads.wage(pl.o, club)) * 1.1);
        if (fee > club.bud || bill + wage * 52 / 1000 > cap) return;
        var score = pl.o - fee / (club.bud + 1) * 4 + (pl.a < 25 ? 1 : pl.a > 31 ? -2 : 0);
        if (!best || score > best.score) best = { pl: pl, fee: Math.round(fee * 10) / 10, wage: wage, score: score };
      });
      if (best) {
        G.transfers.move(st, best.pl, club, best.fee, best.wage);
        buys[club.id] = (buys[club.id] || 0) + 1;
        G.squads.trim(W, club);
      }
    });
  }
  // Fill thin squads with free agents, then youth
  var fa = G.squads.freeAgents(W).sort(function (a, b) { return b.o - a.o; });
  W.clubs.forEach(function (club) {
    var guard = 0;
    while (club.sq.length < C.SQUAD_MIN && guard++ < 10) {
      var need = G.transfers.need(W, club), r = need ? need.r : rng.pick(G.ROLE_KEYS);
      var idx = -1;
      for (var i = 0; i < fa.length; i++) if (fa[i].c < 0 && fa[i].r === r && fa[i].o <= club.str + 2) { idx = i; break; }
      if (idx >= 0) G.transfers.move(st, fa[idx], club, 0, G.squads.wage(fa[idx].o, club));
      else G.squads.make(W, club, r, club.str - 10 + rng.normal() * 3, rng.int(18, 30), rng);
    }
  });
};

// ---------- main player ----------
/** @param {Player} p */
G.transfers.value = function (p) { return G.squads.value(p.ovr, p.age, Math.max(p.ovr, Math.round((p.pot + p.ovr) / 2))) * G.pos.valX(p); };  // the position counts (M9 S5)

/** @param {State} st @param {Club} club @param {number} ovr */
G.transfers.roleFor = function (st, club, ovr) {
  var W = st.world, p = st.player, list = G.squads.roleList(W, club, p.role), n = G.CFG.FORMATION[p.role];
  var lvl = list[n - 1] !== undefined ? W.players[list[n - 1]].o : 40;
  return ovr >= lvl + 2 ? 'titolare' : ovr >= lvl - 3 ? 'rotazione' : 'riserva';
};

/** @param {State} st @param {Club} club */
G.transfers.wageFor = function (st, club) {
  var p = st.player, ag = G.life.agent(p);
  return Math.round(G.squads.wage(p.ovr, club) * G.pos.valX(p) * (1 + p.fame / 150) * G.rng.range(0.9, 1.12) * (ag ? 1 + ag.s * 0.03 : 1));
};

/** @param {State} st @param {Club} club @param {string} type @param {string} [note] @returns {Offer} */
G.transfers.makeOffer = function (st, club, type, note) {
  var C = G.CFG, p = st.player, rng = G.rng, own = club.id === p.clubId;
  var contracted = p.contract && p.contract.years > 0;
  var fee = type === 'transfer' && contracted ? Math.round(G.transfers.value(p) * (G.sure(p.contract).years <= 1 ? 0.5 : 1) * 10) / 10 : 0;
  /** @type {Offer} */
  var o = { id: (st.offerSeq = (st.offerSeq || 0) + 1), club: club.id, type: type, fee: fee, wage: G.transfers.wageFor(st, club),
    years: rng.int(C.CONTRACT_YEARS[0], Math.min(C.CONTRACT_YEARS[1], Math.max(2, 37 - p.age))), role: G.transfers.roleFor(st, club, p.ovr),
    rounds: 0, note: note || '' };
  if (own && type === 'renew') {
    // legend and captain premiums apply to the market wage, so renewals don't compound
    o.wage = Math.round(Math.max(o.wage * (G.life.isBandiera(st, club.id) ? 1.2 : 1) * (p.captain === club.id ? C.CAPTAIN.RENEW : 1), G.sure(p.contract).wage));
    if (G.life.isBandiera(st, club.id)) o.note = 'Rinnovo da bandiera';
  }
  if (type === 'loan') { o.wage = G.sure(p.contract).wage; o.years = 1; o.role = 'titolare'; }
  else { o.clause = G.contracts.clauseFor(st, club); o.bonus = G.contracts.bonusFor(o.wage); G.contracts.checkBid(st, o); }
  return o;
};

// Build the offer list at the opening of a window (w = 0 summer, 1 January)
/** @param {State} st @param {number} w */
G.transfers.playerOffers = function (st, w) {
  var C = G.CFG, p = st.player, W = st.world, rng = G.rng, own = W.clubs[p.clubId];
  var /** @type {Offer[]} */ offers = [], ag = G.life.agent(p);
  st.offers = offers; st.renewAsked = false;
  if (p.loanFrom !== null) return;
  var expired = !p.contract || p.contract.years <= 0;
  var vis = 0.2 + p.fame / 120 + (ag ? ag.s * 0.08 : 0) + (p.transferReq ? 0.3 : 0) + (expired ? 0.2 : 0) - (w ? 0.1 : 0) + (p.visBonus || 0);
  p.visBonus = 0;
  var value = G.transfers.value(p);
  var cand = W.clubs.filter(function (c) {
    if (c.id === p.clubId || c.str > p.ovr + 6 + p.fame / 20 || c.str < p.ovr - 14) return false;
    if (!expired && value * 0.9 > c.bud * 1.2) return false;
    var list = G.squads.roleList(W, c, p.role), n = C.FORMATION[p.role];
    var lvl = list[n - 1] !== undefined ? W.players[list[n - 1]].o : 40;
    return lvl < p.ovr + 2 && p.age < 36;
  });
  rng.shuffle(cand).forEach(function (c) {
    if (offers.length >= C.OFFER_MAX) return;
    var pr = vis * 0.35 * (p.age >= 32 ? 0.6 : 1) * (c.rep > own.rep ? 1.2 : 0.8);
    if (rng.chance(pr)) offers.push(G.transfers.makeOffer(st, c, 'transfer'));
  });
  (st.coachCalls || []).forEach(function (cc) {
    var club = W.clubs[cc.club], co = W.coaches[cc.coach];
    if (club.coach !== co.i || club.id === p.clubId || offers.some(function (o) { return o.club === club.id; })) return;
    var o = G.transfers.makeOffer(st, club, 'transfer', co.n + ' ti vuole con sé');
    if (o.role === 'riserva') o.role = 'rotazione';
    offers.push(o);
  });
  st.coachCalls = [];
  if (p.contract && p.contract.years <= 1 && G.transfers.ownWants(st)) offers.push(G.transfers.makeOffer(st, own, 'renew'));
  var last = p.history[p.history.length - 1];
  if (w === 0 && p.age <= 21 && last && last.apps < 18 && !expired) {
    var weaker = W.clubs.filter(function (c) { return c.id !== own.id && Math.abs(c.str - (p.ovr + 1)) <= 3; });
    if (weaker.length) offers.push(G.transfers.makeOffer(st, rng.pick(weaker), 'loan', 'Prestito proposto dal tuo club'));
  }
  if (expired && !offers.length) {
    if (p.age >= C.RETIRE_FORCED_AGE) { st.noOffers = true; return; }
    var fb = W.clubs.filter(function (c) { return c.str <= p.ovr + 1; }).sort(function (a, b) { return b.str - a.str; }).slice(0, 8);
    if (!fb.length) fb = W.clubs.slice().sort(function (a, b) { return a.str - b.str; }).slice(0, 8);
    offers.push(G.transfers.makeOffer(st, rng.pick(fb), 'transfer'));
  }
  offers.sort(function (a, b) { return W.clubs[b.club].rep - W.clubs[a.club].rep; });
  // The club may want to cash in on a big offer
  var big = offers.filter(function (o) { return o.type === 'transfer' && !o.blocked && o.fee >= value * 1.0 && W.clubs[o.club].rep >= own.rep; })[0];
  if (big && !expired && !p.transferReq && own.bud < big.fee && rng.chance(0.35)) st.clubSell = big.id;
  if (offers.length) G.news(st, '📨 ' + offers.length + (offers.length > 1 ? ' nuove proposte' : ' nuova proposta') + ' per te sul mercato');
};

/** @param {State} st */
G.transfers.ownWants = function (st) {
  var p = st.player, W = st.world, club = W.clubs[p.clubId];
  return p.ovr >= club.str - 6 && p.age < 36 && !p.transferReq;
};

/** @param {State} st @param {number} id @returns {Offer} */
G.transfers.find = function (st, id) { return (st.offers || []).filter(function (o) { return o.id === id; })[0]; };

// Counter-offer: kind 'wage' | 'role' | 'years'. Returns 'ok' | 'firm' | 'gone'
/** @param {State} st @param {number} id @param {string} kind */
G.transfers.raise = function (st, id, kind) {
  var C = G.CFG, p = st.player, rng = G.rng, o = G.transfers.find(st, id), ag = G.life.agent(p);
  if (!o || o.rounds >= 2) return 'firm';
  var chance = C.RAISE_BASE_OK + (ag ? ag.s * C.RAISE_AGENT : 0) + p.fame / 300 - o.rounds * C.RAISE_ROUND - (kind === 'role' || kind === 'clause' ? 0.1 : 0);
  /** @type {string} */
  var out;
  if (rng.chance(chance)) {
    if (kind === 'wage') o.wage = Math.round(o.wage * (1 + C.RAISE_ASK));
    if (kind === 'years') o.years = Math.min(5, o.years + 1);
    if (kind === 'role') o.role = o.role === 'riserva' ? 'rotazione' : 'titolare';
    if (kind === 'clause' || kind === 'bonus') G.contracts.raise(st, o, kind);
    out = 'ok';
  } else if (rng.chance(C.WITHDRAW[o.rounds])) {
    st.offers = st.offers.filter(function (x) { return x.id !== id; });
    out = 'gone';
  } else out = 'firm';
  o.rounds++;
  return out;
};

// Let the agent negotiate: safe improvement based on skill
/** @param {State} st @param {number} id */
G.transfers.agentDeal = function (st, id) {
  var p = st.player, o = G.transfers.find(st, id), ag = G.life.agent(p);
  if (!o || !ag || o.rounds >= 2) return;
  o.wage = Math.round(o.wage * (1 + ag.s * 0.05));
  if (ag.s >= 3 && o.role === 'riserva') o.role = 'rotazione';
  if (ag.s >= 5 && o.role === 'rotazione') o.role = 'titolare';
  o.rounds = 2; o.agent = 1;
};

/** @param {State} st @param {number} id */
G.transfers.accept = function (st, id) {
  var p = st.player, W = st.world, o = G.transfers.find(st, id);
  if (!o || o.blocked) return;
  var from = W.clubs[p.clubId], to = W.clubs[o.club];
  if (o.type === 'renew') {
    p.contract = { years: o.years, wage: o.wage, role: o.role, clause: o.clause, bonus: o.bonus };
    G.news(st, '✍️ Rinnovi con il ' + to.name + ' fino al ' + (st.year + o.years));
  } else if (o.type === 'loan') {
    p.loanFrom = from.id; p.clubId = to.id; G.sure(p.contract).role = o.role;
    G.news(st, '🔁 In prestito al ' + to.name);
  } else {
    if (o.fee) { from.bud += o.fee; to.bud -= o.fee; }
    p.clubId = to.id; p.contract = { years: o.years, wage: o.wage, role: o.role, clause: o.clause, bonus: o.bonus };
    G.contracts.onLeave(st, o, from);
    G.news(st, '🔁 Firmi con il ' + to.name + (o.fee ? ' per ' + o.fee + ' M€' : ' a parametro zero') + ' · ' + o.wage + ' k€/sett.');
    G.life.onTransfer(st, from, to);
  }
  p.transferReq = false; st.offers = []; st.clubSell = null; st.noOffers = false;
  if (st.S) G.season.refresh(st);
  if (st.S && st.S.block === 0 && !st.S.cur && o.type !== 'renew') G.goals.offer(st); // new club, new goals
};

/** @param {State} st @param {number} id */
G.transfers.reject = function (st, id) {
  st.offers = (st.offers || []).filter(function (o) { return o.id !== id; });
  if (st.clubSell === id) { st.clubSell = null; G.life.refusedSale(st); }
};

/** @param {State} st */
G.transfers.requestMove = function (st) {
  var p = st.player;
  if (p.transferReq) return;
  p.transferReq = true;
  G.life.relCurrent(st, -10); G.life.fans(st, p.clubId, -10); p.morale = Math.max(0, p.morale - 3);
  G.news(st, '📢 Hai chiesto la cessione al ' + st.world.clubs[p.clubId].name);
};

/** @param {State} st @param {boolean} [force] */
G.transfers.requestRenewal = function (st, force) {
  var p = st.player, own = st.world.clubs[p.clubId];
  if ((st.offers || []).some(function (o) { return o.type === 'renew'; })) return 'già';
  if (st.renewAsked && !force) return 'già';
  st.renewAsked = true;
  if (!G.transfers.ownWants(st) || (!force && G.rng.chance(0.25))) return 'no';
  st.offers = st.offers || [];
  st.offers.push(G.transfers.makeOffer(st, own, 'renew'));
  return 'ok';
};
