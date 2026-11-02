// @ts-check
// Manager's market: the windows (summer and winter), prices and wages, the scouts' shortlist by role, the signing
// of a deal and the quick sale. The negotiations are in js/mgr-deal.js (M8 phase D).

/** @param {State} st @returns {boolean} */
G.mgr.open = function (st) { var S = st.S; return !!S && !S.cur && (S.block === 0 || S.block === 2) && G.mgr.active(st); };

/** @param {State} st @param {Npc} pl @returns {number} */
G.mgr.price = function (st, pl) {
  var W = st.world, club = W.clubs[G.mgr.job(st).club], s = pl.c >= 0 ? W.clubs[pl.c] : null;
  return s ? Math.round(G.squads.value(pl.o, pl.a, pl.p) * (pl.y <= 1 ? 0.6 : 1) * (s.rep > club.rep ? 1.1 : 1) * G.CFG.MGR.PRICE * 10) / 10 : 0;
};
/** @param {State} st @param {Npc} pl @returns {number} */
G.mgr.wageFor = function (st, pl) { return Math.round(Math.max(pl.w, G.squads.wage(pl.o, st.world.clubs[G.mgr.job(st).club])) * 1.1); };

// Shortlist of players who would improve the XI and the club can afford, refreshed each window
/** @param {State} st @returns {Npc[]} */
G.mgr.targets = function (st) {
  var m = G.mgr.job(st), W = st.world, club = W.clubs[m.club], key = G.sure(st.S).year + ':' + G.sure(st.S).block;
  if (!m.tg || m.tgKey !== key) {
    var bk = G.transfers.buckets(W), /** @type {{ id: PlayerId, r: RoleKey, sc: number }[]} */ out = [];
    G.ROLE_KEYS.forEach(function (r) {
      var list = G.squads.roleList(W, club, r), n = Math.max(1, G.mgrTeam.FORMS[m.form || '4-4-2'].s[r] || 1), weak = list[n - 1] !== undefined ? W.players[list[n - 1]].o : 40;
      G.transfers.sample(bk[r], weak - 2, weak + 14, 30, G.rng).forEach(function (pl) {
        if (pl.c === club.id || pl.a > 33 || pl.ln !== undefined) return;
        var price = G.mgr.price(st, pl);
        if (price > club.bud * 1.3) return;
        out.push({ id: pl.i, r: r, sc: pl.o - weak + (pl.a <= 24 ? 2 : 0) + (pl.p - pl.o) / 4 - price / Math.max(5, club.bud) * 3 });
      });
    });
    out.sort(function (a, b) { return b.sc - a.sc; });
    // keep the best few of every role, so the filter by role always has names
    var /** @type {Dict<number>} */ per = {}, /** @type {PlayerId[]} */ keep = [];
    out.forEach(function (x) { per[x.r] = (per[x.r] || 0) + 1; if (per[x.r] <= 6) keep.push(x.id); });
    m.tg = keep; m.tgKey = key;
  }
  return m.tg.map(function (id) { return W.players[id]; }).filter(function (pl) { return pl && pl.c !== club.id; });
};

// The signing at the end of a negotiation (js/mgr-deal.js): fee, wage (k€ a week) and years agreed
/** @param {State} st @param {Npc} pl @param {number} fee @param {number} wage @param {number} years */
G.mgr.buy = function (st, pl, fee, wage, years) {
  var m = G.mgr.job(st);
  G.transfers.move(st, pl, st.world.clubs[m.club], fee, wage);
  pl.y = years;
  G.mgrId.bought(st, pl);
  if (m.tg) m.tg = m.tg.filter(function (x) { return x !== pl.i; });
  G.season.refresh(st);
};

// "Vendi subito": at once, 10% under his value, to the best club that can take him
/** @param {State} st @param {PlayerId} id @returns {string} */
G.mgr.sell = function (st, id) {
  var C = G.CFG, m = G.mgr.job(st), W = st.world, club = W.clubs[m.club], pl = W.players[id];
  if (!G.mgr.open(st) || !pl || pl.c !== club.id) return 'chiuso';
  if (pl.ln !== undefined) return 'prestito';
  if (club.sq.length <= C.SQUAD_MIN) return 'rosa';
  var price = Math.round(G.squads.value(pl.o, pl.a, pl.p) * C.MGR.SELL * 10) / 10;
  var buyers = W.clubs.filter(function (c) { return c.id !== club.id && c.bud >= price && c.str <= pl.o + 4 && c.str >= pl.o - 8 && c.sq.length < C.SQUAD_MAX; })
    .sort(function (a, b) { return b.rep - a.rep; }).slice(0, 3);
  if (!buyers.length) return 'nessuno';
  G.mgrDeal.sell(st, pl, G.rng.pick(buyers), price);
  return 'ok';
};

// The managed club can always do something on the market (M9, fix after S2): a floor for the budget and the wage
// room when the manager signs and every summer (G.CFG2.MGR_FLOOR). Only the managed club: the NPC world is the same
/** @param {State} st */
G.mgr.marketFloor = function (st) {
  var F = G.CFG2.MGR_FLOOR, m = G.mgr.job(st), W = st.world, club = W.clubs[m.club], tier = G.leagueByKey(club.lg).tier;
  // the wage a player at the squad’s level asks (the upper quartile of up to 40 of them, M€ a year)
  var asks = W.players.filter(function (pl) { return pl && pl.c >= 0 && pl.c !== club.id && pl.o >= club.str - 2 && pl.o <= club.str + F.LEVEL; }).slice(0, 40)
    .map(function (pl) { return G.mgrDeal.wage(st, pl, 1); }).sort(function (a, b) { return a - b; });
  var wage = (asks.length ? asks[Math.floor(asks.length * 0.75)] : G.squads.wage(club.str, club)) * 52 / 1000;
  var bud = Math.round(Math.max(club.rev * F.REV, F.ABS[Math.min(tier, F.ABS.length) - 1]) * 10) / 10;
  if (club.bud < bud) club.bud = bud;
  var room = G.world.wageCap(club) * 1.3 - G.world.wageBill(W, club) + (m.wageRoom || 0), need = wage * F.ROOM;
  if (room < need) m.wageRoom = Math.round(((m.wageRoom || 0) + need - room) * 100) / 100;
};
