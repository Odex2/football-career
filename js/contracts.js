// @ts-check
// Contract clauses: release clause and performance bonuses, negotiated with each offer and checked on the market.

G.contracts = {};

// Release clause in M€ asked by a club; Liga clubs always ask a very high one
/** @param {State} st @param {Club} club */
G.contracts.clauseFor = function (st, club) {
  var K = G.CFG.CLAUSE, m = club.nat === 'ESP' ? K.ESP : K.MULT, v = Math.max(1, G.transfers.value(st.player));
  return Math.round(v * G.rng.range(m[0], m[1]) * 10) / 10;
};

// Bonuses in k€: per goal, per appearance, per trophy, scaled on the weekly wage
/** @param {number} wage */
G.contracts.bonusFor = function (wage) {
  var B = G.CFG.BONUS;
  return { g: Math.round(wage * B.goal), a: Math.round(wage * B.app), t: Math.round(wage * B.trophy) };
};

// Contracts from older saves get a clause and no bonuses
/** @param {State} st @returns {Contract} */
G.contracts.ensure = function (st) {
  var c = st.player.contract;
  if (c && c.clause === undefined) { c.clause = Math.round(Math.max(1, G.transfers.value(st.player)) * 2 * 10) / 10; c.bonus = { g: 0, a: 0, t: 0 }; }
  return c;
};

// Negotiation: a lower clause or bigger bonuses
/** @param {State} st @param {Offer} o @param {string} kind */
G.contracts.raise = function (st, o, kind) {
  var K = G.CFG.CLAUSE;
  if (kind === 'clause') o.clause = Math.max(Math.round(G.transfers.value(st.player) * K.MIN * 10) / 10, Math.round(o.clause * (1 - K.CUT) * 10) / 10);
  if (kind === 'bonus') /** @type {('g'|'a'|'t')[]} */ (['g', 'a', 't']).forEach(function (k) { o.bonus[k] = Math.round(o.bonus[k] * (1 + G.CFG.BONUS.UP)); });
};

// A transfer bid while under contract: the buyer pays the clause when it is close to the fee,
// otherwise your club may block the move (it wants to keep you and the bid is under the clause)
/** @param {State} st @param {Offer} o */
G.contracts.checkBid = function (st, o) {
  var C = G.CFG, K = C.CLAUSE, p = st.player, c = G.contracts.ensure(st), buyer = st.world.clubs[o.club];
  if (o.type !== 'transfer' || !o.fee || !c || o.fee >= c.clause) return;
  if (c.clause <= o.fee * K.PAY_NEAR && buyer.bud >= c.clause) { o.fee = c.clause; o.viaClause = 1; o.note = (o.note ? o.note + ' · ' : '') + 'Paga la clausola'; return; }
  if (c.years >= 2 && !p.transferReq && G.transfers.ownWants(st) && G.rng.chance(K.BLOCK)) o.blocked = 1;
};

// Ask the buyer to pay the clause on a blocked bid: depends on its budget and how far the clause is from your value
/** @param {State} st @param {number} id @returns {string|null} */
G.contracts.payClause = function (st, id) {
  var p = st.player, o = G.transfers.find(st, id), c = G.contracts.ensure(st), ag = G.life.agent(p);
  if (!o || !o.blocked || o.tried) return null;
  var buyer = st.world.clubs[o.club], value = Math.max(1, G.transfers.value(p));
  var pr = G.clamp(buyer.bud / c.clause, 0, 1) * G.clamp(value * 1.6 / c.clause, 0.1, 1) + (ag ? ag.s * 0.04 : 0);
  o.tried = 1;
  if (G.rng.chance(pr)) {
    o.fee = c.clause; o.blocked = 0; o.viaClause = 1;
    G.news(st, '💥 Il ' + buyer.name + ' è pronto a pagare la tua clausola da ' + c.clause + ' M€');
    return 'ok';
  }
  st.offers = st.offers.filter(function (x) { return x.id !== id; });
  G.news(st, '✋ Il ' + buyer.name + ' non paga la clausola e si ritira');
  return 'no';
};

// Leaving through the clause upsets the fans of the club you leave
/** @param {State} st @param {Offer} o @param {Club} from */
G.contracts.onLeave = function (st, o, from) {
  if (!o.viaClause || st.player.transferReq) return;
  G.life.fans(st, from.id, G.CFG.CLAUSE.FANS);
  G.news(st, '😠 I tifosi del ' + from.name + ' non ti perdonano la clausola pagata');
};

// End of season: bonuses for goals, appearances and trophies, after tax and the agent's fee
/** @param {State} st @param {SeasonRecord} rec */
G.contracts.seasonBonus = function (st, rec) {
  var p = st.player, c = p.contract, ag = G.life.agent(p);
  if (!c || !c.bonus) return 0;
  var gross = rec.goals * c.bonus.g + rec.apps * c.bonus.a + rec.trophies.filter(function (t) { return t !== 'Promozione'; }).length * c.bonus.t;
  var net = Math.round(gross * (1 - G.CFG.TAX) * (1 - (ag ? ag.fee / 100 : 0)));
  if (net > 0) { p.money += net; G.news(st, '💶 Bonus contrattuali della stagione: ' + (net >= 1000 ? (net / 1000).toFixed(1) + ' M€' : net + ' k€') + ' netti'); }
  return net;
};

/** @param {Contract} c */
G.contracts.text = function (c) {
  if (!c || c.clause === undefined) return '';
  var b = c.bonus || /** @type {Contract['bonus']} */ ({});
  return 'Clausola ' + c.clause + ' M€' + (b.g || b.a || b.t ? ' · bonus ' + b.g + ' k€/gol, ' + b.a + ' k€/presenza, ' + b.t + ' k€/trofeo' : '');
};
