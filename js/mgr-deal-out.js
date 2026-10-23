// @ts-check
// The FIFA-style market (M8 phase D), the other side: the windows opening and closing, other
// clubs' offers for our players and the transfer list (D3), renewals (D4), loans out and the option on a player
// taken on loan (D5), the budget moved to wages (D6). A loan is m.loans[id] = { to, y } with pl.ln the club that
// owns the player and `to` the club that has him; a loan in also has opt, the fee of the option to buy him.

// ---------- the windows ----------
// A window opens (G.mgr.seasonStart, the end of block 1): its state starts again, the other clubs make their offers
/** @param {State} st */
G.mgrDeal.window = function (st) {
  var m = st.mgr;
  if (!G.mgr.active(st)) return;
  if (!m.neg) G.mgrDeal.start(st);
  m.rep2 = {}; m.neg = {}; m.bids = []; m.deal = null;
  G.mgrDeal.lapse(st, false);
  G.mgrDeal.makeBids(st);
  if (m.assist && m.assist.market) G.mgrDeal.autoBids(st);
};

// A window closes (block 0 or 2 begins): the assistant buys last, so the manager comes first; open talks and offers
// end; in summer the options not taken lapse
/** @param {State} st */
G.mgrDeal.close = function (st) {
  var m = st.mgr;
  if (!m || !m.loans) return;
  if (m.assist && m.assist.market && G.mgr.open(st)) G.mgrDeal.autoBuy(st);
  m.bids = []; m.deal = null;
  if (st.S.block === 0) G.mgrDeal.lapse(st, true);
};

// Options on players taken on loan, back at their club: they lapse when the window closes (all) or when they can
// no longer be used (the manager left that club, the player moved on)
/** @param {State} st @param {boolean} all */
G.mgrDeal.lapse = function (st, all) {
  var m = st.mgr, W = st.world;
  Object.keys(m.loans || {}).forEach(function (k) {
    var id = +k, L = m.loans[id], pl = W.players[id];
    if (L.opt === undefined || (pl && pl.c === L.to)) return;
    if (!all && G.mgr.active(st) && L.to === m.club && pl && pl.c === pl.ln) return;
    if (pl && all && pl.c === pl.ln) G.news(st, '↩️ ' + pl.n + ' resta al ' + W.clubs[pl.c].name + ': riscatto non esercitato');
    if (pl) delete pl.ln;
    delete m.loans[id];
  });
};

// The end of the season, before the contracts (G.season.end): every loan comes back (a young player who played
// grows), an option waits for the summer window; the budget split ends. Returns the managed club when its
// contracts are left to the manager (D4): G.squads.yearEnd lets go who was not renewed
/** @param {State} st @returns {ClubId|undefined} */
G.mgrDeal.seasonEnd = function (st) {
  var D = G.CFG2.MGR_DEAL, m = st.mgr, W = st.world, act = G.mgr.active(st);
  Object.keys(m.loans || {}).forEach(function (k) {
    var id = +k, L = m.loans[id], pl = W.players[id];
    if (!pl || pl.ln === undefined) { if (pl) delete pl.ln; delete m.loans[id]; return; }
    if (pl.c === L.to) {
      var at = W.clubs[pl.c], home = W.clubs[pl.ln];
      at.sq.splice(at.sq.indexOf(id), 1); home.sq.push(id); pl.c = home.id;
      if (L.opt === undefined) {
        var up = pl.o >= at.str - 2 ? Math.min(D.LOAN_GROW, Math.max(0, pl.p - pl.o)) : 0;
        pl.o = Math.round((pl.o + up) * 10) / 10;
        G.news(st, '🔁 ' + pl.n + ' torna dal prestito al ' + at.name + (up ? ': ' + G.mgrLive.num(up) : ''));
      } else if (act && L.to === m.club) { G.news(st, '↩️ ' + pl.n + ' torna al ' + home.name + ': puoi riscattarlo in estate per ' + L.opt + ' M€'); return; }
    }
    if (L.opt !== undefined && act && L.to === m.club && pl.c === pl.ln) return;
    delete pl.ln; delete m.loans[id];
  });
  m.split = 0; m.wageRoom = 0;
  return act && m.assist && !m.assist.contracts ? m.club : undefined;
};

// ---------- D3 · offers for our players and the transfer list ----------
// At every window BIDS[0]..BIDS[1] offers: for a listed player (with chance BID_LIST), else for one of the 6 best
// or a young one with room to grow; from a club that can afford him and would play him. Their own random numbers,
// so the season plays the same with or without them
/** @param {State} st */
G.mgrDeal.makeBids = function (st) {
  var D = G.CFG2.MGR_DEAL, m = st.mgr, W = st.world, club = W.clubs[m.club];
  var rng = G.makeRng(G.mgrDeal.hash('bids:' + st.seed + ':' + st.S.year + ':' + st.S.block + ':' + m.club));
  var mine = club.sq.filter(function (id) { return W.players[id].ln === undefined; });
  var listed = mine.filter(function (id) { return m.list[id]; });
  var top = mine.slice().sort(function (a, b) { return W.players[b].o - W.players[a].o || a - b; }).slice(0, 6);
  var others = mine.filter(function (id) { var pl = W.players[id]; return top.indexOf(id) >= 0 || pl.p - pl.o >= 10; });
  for (var n = rng.int(D.BIDS[0], D.BIDS[1]), i = 0; i < n; i++) {
    var pool = (listed.length && rng.chance(D.BID_LIST) ? listed : others).filter(function (id) { return !m.bids.some(function (b) { return b.id === id; }); });
    if (!pool.length) continue;
    var pl = W.players[rng.pick(pool)], val = G.squads.value(pl.o, pl.a, pl.p);
    var buyers = W.clubs.filter(function (c) { return c.id !== club.id && c.rep >= club.rep - 5 && c.bud >= val && c.str >= pl.o - 6 && c.sq.length < G.CFG.SQUAD_MAX; });
    if (!buyers.length) continue;
    var by = rng.pick(buyers), fee = G.mgrDeal.r1(Math.min(by.bud, val * rng.range(D.BID_FEE[0], D.BID_FEE[1])));
    if (fee < 0.1) continue;
    m.bids.push({ id: pl.i, by: by.id, fee: fee });
    G.news(st, '📨 Il ' + by.name + ' offre ' + fee + ' M€ per ' + pl.n);
  }
};

/** @param {Mgr} m @param {PlayerId} id @returns {boolean} he asked to leave (a request, or listed on his request) */
G.mgrDeal.wantsOut = function (m, id) { return m.list[id] === 1 || m.req.some(function (r) { return r.id === id && r.k === 'via'; }); };

// A sale to club `to` for fee: the offers for him go, the squad's maps follow
/** @param {State} st @param {Npc} pl @param {Club} to @param {number} fee */
G.mgrDeal.sell = function (st, pl, to, fee) {
  var m = st.mgr;
  G.transfers.move(st, pl, to, fee, Math.round(Math.max(pl.w, G.squads.wage(pl.o, to))));
  m.bids = m.bids.filter(function (b) { return b.id !== pl.i; });
  if (m.cond) delete m.cond[pl.i];
  G.mgrSq.sync(st); G.season.refresh(st);
};

// The answer to offer i: 'si' sells, 'no' turns it down (who wanted to leave takes it badly), 'su' asks 15% more
/** @param {State} st @param {number} i @param {string} opt @returns {string} */
G.mgrDeal.bid = function (st, i, opt) {
  var D = G.CFG2.MGR_DEAL, m = st.mgr, W = st.world, club = W.clubs[m.club], b = m.bids[i];
  if (!b || !G.mgr.open(st)) return '';
  var pl = W.players[b.id], by = W.clubs[b.by];
  if (!pl || pl.c !== club.id) { m.bids.splice(i, 1); return ''; }
  if (opt === 'no') {
    var sad = G.mgrDeal.wantsOut(m, pl.i);
    m.bids.splice(i, 1);
    if (sad) G.mgrSq.addPm(m, pl.i, -8);
    return '❌ Offerta del ' + by.name + ' rifiutata' + (sad ? ': ' + pl.n + ' voleva andare e ci resta male.' : '.');
  }
  if (club.sq.length <= G.CFG.SQUAD_MIN) return 'La rosa è già al minimo.';
  if (opt === 'su') {
    if (!G.rng.chance(D.BID_COUNTER_P)) { m.bids.splice(i, 1); return '🚪 Il ' + by.name + ' non alza l’offerta e si ritira.'; }
    b.fee = G.mgrDeal.r1(b.fee * 1.15);
  }
  G.mgrDeal.sell(st, pl, by, b.fee);
  return '💰 ' + pl.n + ' ceduto al ' + by.name + ' per ' + b.fee + ' M€.';
};

// The automatic answer: sell for at least 1.2 times his value unless he is a key player, otherwise no
/** @param {State} st */
G.mgrDeal.autoBids = function (st) {
  var m = st.mgr, W = st.world;
  m.bids.slice().forEach(function (b) {
    var i = m.bids.indexOf(b), pl = W.players[b.id];
    if (i < 0 || !pl) return;
    var t = G.mgrDeal.bid(st, i, b.fee >= 1.2 * G.squads.value(pl.o, pl.a, pl.p) && m.sr[b.id] !== 'cru' ? 'si' : 'no');
    if (t) G.news(st, t.replace(/\.$/, '') + ' (ha deciso il vice)');
  });
};

// The assistant's buys (G1): for every starter AUTO_GAP or more under the club's strength, the best of the scouts'
// list for his role who is better and the club can afford, at 100% of the price, the wage he asks and the role he
// would get (G.mgrDeal.quick); if his club or he says no, the next one
/** @param {State} st */
G.mgrDeal.autoBuy = function (st) {
  var D = G.CFG2.MGR_DEAL, m = st.mgr, W = st.world, str = W.clubs[m.club].str;
  G.mgrTeam.xi(st).slice().forEach(function (x) {
    var old = W.players[x.id];
    if (!old || old.o > str - D.AUTO_GAP) return;
    var list = G.mgr.targets(st).filter(function (pl) { return pl.r === x.r && pl.o > old.o && !G.mgrDeal.can(st, pl, G.mgr.price(st, pl), G.mgrDeal.wage(st, pl, 1)); });
    for (var i = 0; i < Math.min(D.AUTO_TRIES, list.length); i++) {
      if (G.mgrDeal.quick(st, list[i].i) !== 'ok') continue;
      G.news(st, '🤖 Il vice compra ' + list[i].n + ' (' + Math.round(list[i].o) + ') per il posto di ' + old.n + ' (' + Math.round(old.o) + ')');
      return;
    }
  });
};

// On or off the transfer list; listing a player who did not ask costs him 10 of morale
/** @param {State} st @param {PlayerId} id @returns {string} */
G.mgrDeal.setList = function (st, id) {
  var m = st.mgr, pl = st.world.players[id];
  if (!pl || pl.c !== m.club || pl.ln !== undefined) return '';
  if (m.list[id]) { delete m.list[id]; return '📋 ' + pl.n + ' non è più sul mercato.'; }
  if (m.req.some(function (r) { return r.id === id && r.k === 'via'; })) return G.mgrSq.answer(st, id, 'ok');
  m.list[id] = 2; G.mgrSq.addPm(m, id, -10);
  return '📋 ' + pl.n + ' è sul mercato: non l’ha presa bene.';
};

// ---------- D4 · renewals ----------
/** @param {State} st @param {Npc} pl @returns {boolean} */
G.mgrDeal.canRenew = function (st, pl) { return !!pl && pl.c === st.mgr.club && pl.ln === undefined && pl.y <= 2 && pl.a < 36 && st.S.block <= 4; };
/** @param {State} st @param {PlayerId} id @returns {{ wage: number, p: number }} the wage he asks and the chance he signs */
G.mgrDeal.renewAsk = function (st, id) {
  var m = st.mgr, W = st.world, pl = W.players[id], pm = G.mgrSq.pm(m, id);
  var wage = Math.round(Math.max(pl.w, G.squads.wage(pl.o, W.clubs[m.club])) * (m.sr[id] === 'cru' || m.sr[id] === 'imp' ? 1.1 : 1));
  return { wage: wage, p: pm < 30 ? 0 : G.clamp(G.CFG2.MGR_DEAL.RENEW_P + (pm - 60) / 100, 0.05, 0.95) };
};
// A renewal for yrs more seasons after this one; one try a window
/** @param {State} st @param {PlayerId} id @param {number} yrs @returns {string} */
G.mgrDeal.renew = function (st, id, yrs) {
  var m = st.mgr, S = st.S, pl = st.world.players[id];
  if (!G.mgrDeal.canRenew(st, pl)) return '';
  if (m.neg[id]) return pl.n + ' ha già detto no: riprova nella prossima finestra di mercato.';
  var a = G.mgrDeal.renewAsk(st, id);
  if (!a.p || !G.rng.chance(a.p)) { m.neg[id] = 'rin'; return '🙅 ' + pl.n + (a.p ? ' rifiuta il rinnovo.' : ' vuole cambiare aria: non rinnova.'); }
  pl.w = a.wage; pl.y = Math.max(pl.y, 1 + G.clamp(yrs, 1, 4)); G.mgrSq.addPm(m, id, 5);
  var t = '✍️ ' + pl.n + ' rinnova fino al ' + (S.year + pl.y) + ' a ' + a.wage + ' k€ a settimana';
  G.news(st, t);
  return t + '.';
};
/** @param {State} st @returns {number} contracts that end in June */
G.mgrDeal.expiring = function (st) {
  var W = st.world;
  return W.clubs[st.mgr.club].sq.filter(function (id) { return W.players[id].y <= 1 && W.players[id].ln === undefined; }).length;
};

// ---------- D5 · loans ----------
// Who can go on loan now: 21 or younger and not among the 16 who start most
/** @param {State} st @returns {PlayerId[]} */
G.mgrDeal.loanOuts = function (st) {
  var m = st.mgr, W = st.world, club = W.clubs[m.club];
  if (!G.mgr.open(st)) return [];
  var top = club.sq.slice().sort(function (a, b) { return (m.starts[b] || 0) - (m.starts[a] || 0) || W.players[b].o - W.players[a].o; }).slice(0, 16);
  return club.sq.filter(function (id) { return W.players[id].a <= 21 && top.indexOf(id) < 0 && W.players[id].ln === undefined; });
};
/** @param {State} st @returns {PlayerId[]} our players away on loan */
G.mgrDeal.away = function (st) {
  var m = st.mgr, W = st.world;
  return Object.keys(m.loans || {}).map(Number).filter(function (id) { var pl = W.players[id]; return pl && pl.ln === m.club && pl.c === m.loans[id].to; });
};
// A loan out to a club of about his level with room, from the lowest division
/** @param {State} st @param {PlayerId} id @returns {string} */
G.mgrDeal.loanOut = function (st, id) {
  var D = G.CFG2.MGR_DEAL, m = st.mgr, W = st.world, club = W.clubs[m.club], pl = W.players[id];
  if (G.mgrDeal.loanOuts(st).indexOf(id) < 0) return '';
  if (G.mgrDeal.away(st).length >= D.LOAN_MAX) return 'Hai già ' + D.LOAN_MAX + ' giocatori in prestito.';
  if (club.sq.length <= G.CFG.SQUAD_MIN) return 'La rosa è già al minimo.';
  var to = W.clubs.filter(function (c) { return c.id !== club.id && c.str >= pl.o - 4 && c.str <= pl.o + 2 && c.sq.length < G.CFG.SQUAD_MAX; })
    .sort(function (a, b) { return G.leagueByKey(b.lg).tier - G.leagueByKey(a.lg).tier || Math.abs(a.str - pl.o) - Math.abs(b.str - pl.o) || a.id - b.id; })[0];
  if (!to) return 'Nessun club adatto lo vuole in prestito.';
  club.sq.splice(club.sq.indexOf(id), 1); to.sq.push(id); pl.c = to.id; pl.ln = club.id;
  m.loans[id] = { to: to.id, y: st.S.year };
  G.mgrSq.sync(st); G.season.refresh(st);
  var t = '🔁 ' + pl.n + ' va in prestito al ' + to.name;
  G.news(st, t);
  return t + ': torna a fine stagione.';
};
// A loan in (D2): the player joins us now, his club keeps him; the option is his full price of today
/** @param {State} st @param {Npc} pl @param {number} fee @param {number} wage */
G.mgrDeal.loanIn = function (st, pl, fee, wage) {
  var m = st.mgr, W = st.world, club = W.clubs[m.club], from = W.clubs[pl.c], opt = G.mgr.price(st, pl);
  from.sq.splice(from.sq.indexOf(pl.i), 1); club.sq.push(pl.i);
  from.bud += fee; club.bud -= fee; pl.c = club.id; pl.ln = from.id; pl.w = wage;
  m.loans[pl.i] = { to: club.id, y: st.S.year, opt: opt };
  G.news(st, '🔁 ' + pl.n + ' arriva in prestito dal ' + from.name + ' (riscatto ' + opt + ' M€)');
  G.season.refresh(st);
};
// The option in the summer window: yes buys him at the agreed fee (it does not count as a buy of the window)
/** @param {State} st @param {PlayerId} id @param {boolean} yes @returns {string} */
G.mgrDeal.option = function (st, id, yes) {
  var m = st.mgr, W = st.world, club = W.clubs[m.club], L = m.loans[id], pl = W.players[id];
  if (!L || L.opt === undefined || !pl || pl.c !== pl.ln || !G.mgr.open(st)) return '';
  var home = W.clubs[pl.c];
  if (!yes) { delete pl.ln; delete m.loans[id]; return '↩️ ' + pl.n + ' resta al ' + home.name + '.'; }
  if (club.sq.length >= G.CFG.SQUAD_MAX) return G.mgrDeal.WHY.piena;
  if (L.opt > club.bud) return G.mgrDeal.WHY.soldi;
  if (G.mgrDeal.margin(st) < pl.w * 52 / 1000) return G.mgrDeal.WHY.ingaggi;
  delete pl.ln; delete m.loans[id];
  G.mgr.buy(st, pl, L.opt, pl.w, 3);
  G.mgrSq.sync(st);
  return '✍️ Riscattato: ' + pl.n + ' è tuo per ' + L.opt + ' M€.';
};

// ---------- D6 · budget and wages ----------
/** @param {State} st @returns {number} M€ a year the wage bill can still grow */
G.mgrDeal.margin = function (st) {
  var m = st.mgr, W = st.world, club = W.clubs[m.club];
  return G.world.wageCap(club) * 1.3 + (m.wageRoom || 0) - G.world.wageBill(W, club);
};
// x % of the budget moved to wages (x > 0), or x % of the wage cap back to the budget (x < 0, within the free
// margin). The old split is undone first, as far as the wages signed since allow
/** @param {State} st @param {number} x @returns {string} */
G.mgrDeal.setSplit = function (st, x) {
  var D = G.CFG2.MGR_DEAL, m = st.mgr, club = st.world.clubs[m.club], r1 = G.mgrDeal.r1;
  if (!G.mgr.open(st) || D.SPLIT.indexOf(x) < 0 || x === (m.split || 0)) return '';
  var room = m.wageRoom || 0, back = room > 0 ? Math.min(room, Math.max(0, G.mgrDeal.margin(st))) : -Math.min(-room, Math.max(0, club.bud));
  club.bud = r1(club.bud + back); m.wageRoom = r1(room - back);
  var amt = x > 0 ? r1(Math.max(0, club.bud) * x / 100) : -r1(Math.min(G.world.wageCap(club) * -x / 100, Math.max(0, G.mgrDeal.margin(st))));
  club.bud = r1(club.bud - amt); m.wageRoom = r1(m.wageRoom + amt); m.split = x;
  return '💶 Margine ingaggi ' + (m.wageRoom >= 0 ? '+' : '') + m.wageRoom + ' M€ l’anno, budget ' + Math.round(club.bud) + ' M€.';
};

// Saves from before phase D
/** @param {State} st */
G.mgrDeal.migrate = function (st) { if (G.mgr.active(st) && !st.mgr.neg) G.mgrDeal.start(st); };
