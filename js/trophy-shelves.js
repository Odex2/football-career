// @ts-check
// What goes in each cabinet: who = 'pl' (the player) or 'mg' (the second career), comp = 'tro' (trophies) or 'per' (personal awards).
// A shelf is { t: title, mem: keepsakes?, items: [{ k, name, d: sprite def, wins: [{ year, club }], miss }] }; trophies not won yet are silhouettes.

/** @param {Won[]} list @returns {TroItem[]} */
G.tro.group = function (list) {
  var /** @type {Dict<TroItem>} */ by = {}, /** @type {TroItem[]} */ out = [];
  list.forEach(function (x) {
    if (!by[x.name]) { by[x.name] = { k: x.name, name: x.name, d: G.tro.def(x.name, x.w), wins: [] }; out.push(by[x.name]); }
    by[x.name].wins.push({ year: x.year, club: x.club || '' });
  });
  return out;
};

/** @param {string} name @returns {TroItem} */
G.tro.ghost = function (name) { return { k: name, name: name, d: G.tro.def(name), wins: [], miss: 1 }; };

// These always show, won or not, first and in this order
/** @param {TroItem[]} items @param {string[]} names @returns {TroItem[]} */
G.tro.must = function (items, names) {
  var /** @type {Dict<TroItem>} */ have = {}; items.forEach(function (i) { have[i.k] = i; });
  return names.map(function (n) { return have[n] || G.tro.ghost(n); }).concat(items.filter(function (i) { return names.indexOf(i.k) < 0; }));
};

/** @param {string} n @returns {boolean} */
G.tro.isLeague = function (n) { return /^Promozione/.test(n) || G.LEAGUES.some(function (L) { return L.name === n; }); };
/** @param {string} n @returns {boolean} */
G.tro.isCup = function (n) { return G.DATA.nations.some(function (x) { return x.cup === n; }); };

// Promotions are not trophies in the game, but they earn a place in the cabinet
/** @param {CareerRow[]} hist @returns {Trophy[]} */
G.tro.promos = function (hist) {
  return hist.filter(function (h) { var w = h.trophies || h.won || []; return w.indexOf('Promozione') >= 0 && w.indexOf(h.lg) < 0; })
    .map(function (h) { return { name: 'Promozione (' + h.lg + ')', year: h.year, club: h.club }; });
};

// The club the career is at now (or ended at): its league and cup are the "still to win" silhouettes
/** @param {State} st @param {string} who @returns {Club|null} */
G.tro.homeClub = function (st, who) {
  var h = who === 'mg' ? G.sure(st.mgr).hist : st.player.history, id = who === 'mg' ? G.sure(st.mgr).club : st.player.clubId;
  if (id === null || id === undefined) id = h.length ? h[h.length - 1].clubId : null;
  return id === null || id === undefined ? null : st.world.clubs[id];
};

/** @param {State} st @param {string} who @returns {Shelf[]} */
G.tro.trophyShelves = function (st, who) {
  var p = st.player, m = st.mgr, club = G.tro.homeClub(st, who), nat = club ? club.nat : null;
  var all = G.tro.group(who === 'mg' ? G.sure(m).trophies.concat(G.tro.promos(G.sure(m).hist)) : p.trophies.concat(G.tro.promos(p.history)));
  var top = G.LEAGUES.filter(function (L) { return L.nat === nat && L.tier === 1; })[0], cup = G.DATA.nations.filter(function (n) { return n.id === nat; })[0];
  var pick = /** @param {(k: string) => boolean} f */ function (f) { return all.filter(function (i) { return f(i.k); }); };
  var lg = pick(G.tro.isLeague), cups = pick(G.tro.isCup);
  var /** @type {Shelf[]} */ sh = [{ t: 'Coppe europee', items: G.tro.must(pick(function (n) { return G.tro.EU.indexOf(n) >= 0; }), G.tro.EU) },
    { t: 'Campionati', items: lg.length || !top ? lg : [G.tro.ghost(top.name)] },
    { t: 'Coppe nazionali', items: cups.length || !cup || !cup.cup ? cups : [G.tro.ghost(cup.cup)] }];
  if (who === 'pl') {
    var nt = G.NT[p.nat], ck = nt && G.CFG.NT.CONT[nt.conf], cn = ck ? G.CFG.NT.TOURS[ck].n : null;
    sh.push({ t: 'Nazionale', items: G.tro.must(pick(function (n) { return G.tro.WORLD.indexOf(n) >= 0; }), ['Mondiale'].concat(cn ? [cn] : [])) });
  }
  var /** @type {Dict<number>} */ used = {}; sh.forEach(function (s) { s.items.forEach(function (i) { used[i.k] = 1; }); });
  var rest = all.filter(function (i) { return !used[i.k]; });
  if (rest.length) sh.push({ t: 'Altri trofei', items: rest });
  return sh;
};

// Keepsakes per club, in the order the career went through them
/** @template {CareerRow} R @param {R[]} rows @param {(r: R) => unknown} keep @returns {{ order: ClubId[], by: { [club: number]: R[] } }} */
G.tro.byClub = function (rows, keep) {
  var /** @type {ClubId[]} */ order = [], /** @type {{ [club: number]: R[] }} */ by = {};
  rows.forEach(function (r) {
    if (!keep(r)) return;
    if (!by[r.clubId]) { by[r.clubId] = []; order.push(r.clubId); }
    by[r.clubId].push(r);
  });
  return { order: order, by: by };
};

/** @param {State} st @returns {Shelf[]} */
G.tro.plAwards = function (st) {
  var p = st.player, W = st.world, /** @type {Won[]} */ aw = p.awards.slice(), /** @type {TroItem[]} */ mem = [];
  p.history.forEach(function (h) { if (h.bdo === 2 || h.bdo === 3) aw.push({ name: h.bdo === 2 ? 'Pallone d’Argento' : 'Pallone di Bronzo', year: h.year, club: h.club }); });
  var all = G.tro.group(aw), isW = /** @param {string} n */ function (n) { return /^(Pallone|Scarpa)/.test(n) || /^Capocannoniere (Mondiale|Europeo|Copa|Coppa)/.test(n); };
  var C = G.tro.byClub(p.history, function (h) { return h.captain; });
  if (p.captain !== null && p.captain !== undefined && !C.by[p.captain]) { C.order.push(p.captain); C.by[p.captain] = []; }
  C.order.forEach(function (id) {
    var c = W.clubs[id], w = C.by[id].map(function (h) { return { year: h.year, club: c.name }; });
    mem.push({ k: 'cap' + id, name: 'Fascia da capitano · ' + c.name, d: { s: 'band', c: [c.c1, c.c2] }, wins: w.length ? w : [{ year: null, club: c.name + ' (in corso)' }] });
  });
  if (p.nt && p.nt.cap) mem.push({ k: 'ntcap', name: 'Fascia della nazionale', d: { s: 'band', c: G.tro.RIB[p.nat] || G.tro.RIB.x }, wins: [{ year: p.nt.cap, club: G.nationInfo(p.nat).name }] });
  var R = st.records && st.records.lg || {};
  G.LEAGUES.forEach(function (L) {
    var r = R[L.key];
    if (r && r.me) mem.push({ k: 'rec' + L.key, name: 'Record di gol · ' + L.name, d: G.tro.def('Record'), wins: [{ year: r.year, club: r.g + ' gol in una stagione' }] });
  });
  return [{ t: 'Premi mondiali', items: G.tro.must(all.filter(function (i) { return isW(i.k); }), ['Pallone d’Oro', 'Scarpa d’Oro']) },
    { t: 'Premi di campionato', items: all.filter(function (i) { return !isW(i.k); }) }, { t: 'Ricordi', mem: 1, items: mem }];
};

/** @param {State} st @returns {Shelf[]} */
G.tro.mgrAwards = function (st) {
  var m = G.sure(st.mgr), W = st.world, all = G.tro.group(m.awards || []), /** @type {TroItem[]} */ mem = [];
  var isW = /** @param {string} n */ function (n) { return n === 'Allenatore dell’anno' || n === 'Dirigente dell’anno'; };
  var C = G.tro.byClub(m.hist, function () { return true; });
  if (m.club !== null && !C.by[m.club]) { C.order.push(m.club); C.by[m.club] = []; }
  C.order.forEach(function (id) {
    var c = W.clubs[id], w = C.by[id].map(function (r) { return { year: r.year, club: G.mgr.ROLE[r.role] + (r.pos ? ' · ' + r.pos + 'º in ' + r.lg : '') }; });
    mem.push({ k: 'pen' + id, name: 'Gagliardetto · ' + c.name, d: { s: 'flag', c: [c.c1, c.c2] }, wins: w.length ? w : [{ year: null, club: 'In corso' }] });
  });
  return [{ t: 'Premi mondiali', items: G.tro.must(all.filter(function (i) { return isW(i.k); }), [m.role === 'ds' ? 'Dirigente dell’anno' : 'Allenatore dell’anno']) },
    { t: 'Premi di campionato', items: all.filter(function (i) { return !isW(i.k); }) }, { t: 'Le tue panchine', mem: 1, items: mem }];
};

/** @param {State} st @param {string} who @param {string} comp @returns {Shelf[]} */
G.tro.shelves = function (st, who, comp) {
  if (comp === 'tro') return G.tro.trophyShelves(st, who);
  return who === 'mg' ? G.tro.mgrAwards(st) : G.tro.plAwards(st);
};

// Trophies or awards actually won in a compartment (keepsakes excluded)
/** @param {Shelf[]} shelves @returns {number} */
G.tro.count = function (shelves) {
  return shelves.reduce(function (s, sh) { return s + (sh.mem ? 0 : sh.items.reduce(function (a, i) { return a + (i.miss ? 0 : i.wins.length); }, 0)); }, 0);
};
