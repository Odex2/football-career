// @ts-check
// Game flow and debug tools.

G.game = {};

/** @param {CareerOpts} o @returns {State} */
G.game.newCareer = function (o) {
  var C = G.CFG, seed = o.seed || (Date.now() ^ (Math.random() * 1e9)) >>> 0;
  G.rng = G.makeRng(seed); G.fixCache = {};
  var rng = G.rng, W = G.world.create(rng), p = G.player.create(o, rng);
  W.agents = G.agents.create(rng); G.agents.pool = W.agents;
  var d = G.game.firstClub(W, p, o.nat, o.start || 'random', rng), club = d.club;
  // ntRoll comes with G.national.init below (the order of the keys stays the one of the saves)
  var st = /** @type {State} */ (/** @type {unknown} */ ({ v: 2, seed: seed, year: C.START_YEAR, world: W, player: p, S: null, euQual: null, over: false,
    news: [], roll: [], flags: {}, offers: [] }));
  p.clubId = club.id;
  G.national.init(st);
  p.contract = { years: 3, wage: G.squads.wage(p.ovr, W.clubs[p.loanFrom !== null ? p.loanFrom : club.id]), role: 'rotazione' };
  G.season.start(st);
  st.offers = [];
  p.contract.role = G.transfers.roleFor(st, club, p.ovr);
  if (d.odds < G.CFG2.START_CLUB.LUCKY) G.news(st, '🍀 Colpo di fortuna: debutti con il ' + club.name + ' (' + G.game.oddsText(d.odds) + ')');
  G.news(st, p.loanFrom !== null ? '📝 In prestito al ' + club.name + ' dal ' + W.clubs[p.loanFrom].name : '📝 Primo contratto con il ' + club.name);
  G.events.roll(st);
  return st;
};

// Manager career from day one: a world, a retired-looking person with no playing past, and the first job offers
/** @param {MgrCareerOpts} o @returns {State} */
G.game.newManager = function (o) {
  var C = G.CFG, seed = o.seed || (Date.now() ^ (Math.random() * 1e9)) >>> 0, B = G.mgr.BG[o.bg || 'prov'] || G.mgr.BG.prov;
  G.rng = G.makeRng(seed); G.fixCache = {};
  var rng = G.rng, W = G.world.create(rng), p = G.player.create({ name: o.name, nat: o.nat, role: 'CC', foot: 'D', goat: 0 }, rng);
  W.agents = G.agents.create(rng); G.agents.pool = W.agents;
  delete p.pos; delete p.main; delete p.fam; delete p.famY;  // never a player: no positions (M9 S5), the same saves as before
  p.age = o.age || 38; p.mgrOnly = 1; p.fame = B.fame; p.ovr = 0; p.peak = 0; p.clubId = /** @type {ClubId} */ (/** @type {unknown} */ (null));  // no club until the first job
  // ntRoll comes with G.national.init below (the order of the keys stays the one of the saves)
  var st = /** @type {State} */ (/** @type {unknown} */ ({ v: 2, seed: seed, year: C.START_YEAR, world: W, player: p, S: null, euQual: null, over: false,
    news: [], roll: [], flags: {}, offers: [] }));
  G.national.init(st);
  // an ex international is still loved at one club of his country
  if (B.love) {
    // a club of his country a notch above his level, so it can call him (fans' love opens doors up to +10 reputation)
    var ln = G.NATIONS[o.nat] ? o.nat : G.SA_LINK[o.nat];  // South Americans are loved in their bridge country
    var near = W.clubs.filter(function (c) { return c.nat === ln && c.rep >= B.rep && c.rep <= B.rep + 9; });
    var c = near.length ? rng.pick(near) : W.clubs.filter(function (x) { return x.nat === ln; }).sort(function (a, b) { return Math.abs(a.rep - B.rep) - Math.abs(b.rep - B.rep); })[0];
    if (c) { p.fans[c.id] = 60; p.seasonsAt[c.id] = 6; }
  }
  var m = G.mgr.make(st, B.rep);
  if (B.youthX) m.youthX = B.youthX;
  G.mgr.offerSet(st, 'start');
  return st;
};

// Before playing a block: settle what cannot be left pending
/** @param {State} st @param {boolean} [auto] */
G.game.settle = function (st, auto) {
  var p = st.player;
  if (st.event && auto) G.events.apply(st, 0);
  if (G.sure(st.S).block === 0 && (!p.contract || p.contract.years <= 0) && p.loanFrom === null) {
    if (st.noOffers || !(st.offers || []).length) { st.over = true; st.retireReason = 'Nessun club ti offre un contratto'; return; }
    var own = st.offers.filter(function (o) { return o.type === 'renew'; })[0];
    G.transfers.accept(st, (own || st.offers[0]).id);
  }
};

// Play the rest of the block (or only up to the player's next match); starts the next season when one ends
/** @param {State} st @param {boolean} [auto] @param {boolean|string} [oneMatch] @returns {BlockSum|null} */
G.game.next = function (st, auto, oneMatch) {
  if (st.over) return null;
  if (st.mgr && st.event && auto) { if (st.event.mgrht) G.mgrLive.pick(st, 0); else G.mgrEv.apply(st, 0); }
  if (st.event && !auto) return null;
  if (!G.sure(st.S).cur) {
    if (!st.mgr) {
      G.game.settle(st, auto);
      if (st.over) { G.hof.add(st); return null; }
      if (G.sure(st.S).block === 0) G.captain.check(st);
    }
    st.prevAttrs = JSON.parse(JSON.stringify(st.player.attrs));
    st.eventResult = null; st.pressResult = null;
  }
  var b = G.sure(st.S).block;
  st.achNew = []; st.live = !auto; st.momentResult = null;
  var sum = oneMatch === 'day' ? G.season.playOneDay(st) : oneMatch ? G.season.playMatch(st) : G.season.playBlock(st);
  if (st.mgrLiveReq && !(st.event && st.event.mgrht)) delete st.mgrLiveReq;  // "Gioca in diretta" is for one click
  if (!st.mgr) G.ach.check(st);
  if (!sum) return /** @type {BlockSum} */ ({ partial: true });
  if (b === 0 || b === 2) { st.offers = []; st.clubSell = null; }
  if (sum.season && !st.over) G.season.start(st);
  if (!st.over && !st.mgr && G.sure(st.S).block !== 5) { G.events.roll(st); G.press.roll(st); }
  else if (!st.over && st.mgr && G.mgr.active(st) && G.sure(st.S).block <= 4) G.mgrEv.roll(st);
  if (st.over) G.hof.add(st);
  return sum;
};

// ⏭ (M8 J8): "Prossima partita" again and again, up to the eve of the next important match of the user's club.
// It stops earlier where one match at a time stops too: an event or a decisive moment, the end of the season, the
// summer tournament, and at the end of a block the market with offers, the season goal, an expired contract.
/** @param {State} st @returns {BlockSum|null} */
G.game.skip = function (st) {
  var /** @type {BlockSum|null} */ sum = null, guard = 0;
  while (guard++ < 200 && !st.over && st.S && st.S.cal && st.S.block <= 4) {
    var id = G.season.myClub(st), e = id >= 0 ? G.cal.next(st, id) : null;
    if (!e || G.season.importance(st, id, e)) break;
    sum = G.game.next(st, false, true);
    if (!sum || st.event || (!sum.partial && G.game.blockStop(st, sum))) break;
  }
  return sum;
};

// After a block played by the skip: does the user have something to do?
/** @param {State} st @param {BlockSum} sum @returns {boolean} */
G.game.blockStop = function (st, sum) {
  var p = st.player;
  if (sum.season || st.over || !st.S || st.S.block > 4 || st.event) return true;
  if (st.mgr) return !G.mgr.active(st) || G.mgr.open(st) || !!(st.mgrOffers && /^(calls|mid|vacancy)$/.test(st.mgrOffers.why));
  return !!(st.offers || []).length || !!(st.goalOffer && !st.goal) || (st.S.block === 0 && (!p.contract || p.contract.years <= 0));
};

// stopAtTour: the UI stops when the summer tournament begins, so the player sees its screen
/** @param {State} st @param {boolean} [stopAtTour] @returns {BlockSum|null} */
G.game.simSeason = function (st, stopAtTour) {
  var /** @type {BlockSum|null} */ sum, guard = 0, ui = !!stopAtTour, mo0 = JSON.stringify(st.mgrOffers || null);
  // in the interface a new mid-season offer stops the simulation, so the manager can answer it
  var fresh = function () { var mo = st.mgrOffers; return !!mo && (mo.why === 'mid' || mo.why === 'vacancy') && JSON.stringify(mo) !== mo0; };
  if (st.mgr) stopAtTour = false;
  // without a job: a month of waiting, then the best offer (M9 S2); offers are never taken by themselves otherwise
  if (st.mgr && !st.mgr.done && !G.mgr.active(st)) G.mgrJobs.auto(st);
  do { sum = G.game.next(st, true); } while (sum && !sum.season && !(stopAtTour && G.sure(st.S).block === 5 && !G.sure(st.S).cur) && !(st.mgr && !G.mgr.active(st)) &&
    !(ui && fresh()) && guard++ < 10);
  return sum;
};

/** @param {State} st */
G.game.canRetire = function (st) {
  return !st.over && st.player.age >= G.CFG.RETIRE_MIN_AGE && st.S && st.S.block === 0;
};

/** @param {State} st @param {string} [why] */
G.game.retire = function (st, why) {
  st.over = true; st.retireReason = why || 'Ritiro volontario';
  G.ach.check(st);
  G.hof.add(st);
};
