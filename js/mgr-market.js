// @ts-check
// Manager's market: the windows (summer and winter), prices and wages, the scouts' shortlist by role, the signing
// of a deal and the quick sale. The negotiations are in js/mgr-deal.js (M8 phase D).

/** @param {State} st @returns {boolean} */
G.mgr.open = function (st) { var S = st.S; return !!S && !S.cur && (S.block === 0 || S.block === 2) && G.mgr.active(st); };

/** @param {State} st @param {Npc} pl @returns {number} */
G.mgr.price = function (st, pl) {
  var W = st.world, club = W.clubs[st.mgr.club], s = pl.c >= 0 ? W.clubs[pl.c] : null;
  return s ? Math.round(G.squads.value(pl.o, pl.a, pl.p) * (pl.y <= 1 ? 0.6 : 1) * (s.rep > club.rep ? 1.1 : 1) * G.CFG.MGR.PRICE * 10) / 10 : 0;
};
/** @param {State} st @param {Npc} pl @returns {number} */
G.mgr.wageFor = function (st, pl) { return Math.round(Math.max(pl.w, G.squads.wage(pl.o, st.world.clubs[st.mgr.club])) * 1.1); };

// Shortlist of players who would improve the XI and the club can afford, refreshed each window
/** @param {State} st @returns {Npc[]} */
G.mgr.targets = function (st) {
  var m = st.mgr, W = st.world, club = W.clubs[m.club], key = st.S.year + ':' + st.S.block;
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
  var m = st.mgr;
  G.transfers.move(st, pl, st.world.clubs[m.club], fee, wage);
  pl.y = years;
  if (m.tg) m.tg = m.tg.filter(function (x) { return x !== pl.i; });
  G.season.refresh(st);
};

// "Vendi subito": at once, 10% under his value, to the best club that can take him
/** @param {State} st @param {PlayerId} id @returns {string} */
G.mgr.sell = function (st, id) {
  var C = G.CFG, m = st.mgr, W = st.world, club = W.clubs[m.club], pl = W.players[id];
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
