// @ts-check
// World: clubs, leagues, rivalries, yearly evolution, crests.

G.world = {};

// Static league list (built from DATA, never saved)
/** @type {LeagueInfo[]} */
G.LEAGUES = [];
/** @type {Dict<NationInfo>} */
G.NATIONS = {};
G.DATA.nations.forEach(function (n) {
  G.NATIONS[n.id] = n;
  n.leagues.forEach(function (l, i) {
    G.LEAGUES.push({ key: n.id + (i + 1), nat: n.id, tier: i + 1, name: l.n, size: l.c.split(';').length });
  });
});
/** @param {LeagueKey} k @returns {LeagueInfo} */
G.leagueByKey = function (k) {
  for (var i = 0; i < G.LEAGUES.length; i++) if (G.LEAGUES[i].key === k) return G.LEAGUES[i];
  return /** @type {LeagueInfo} */ (/** @type {unknown} */ (undefined));  // only real keys are asked for
};

/** @param {string} name */
G.shortName = function (name) {
  /** @type {Dict<number>} */
  var skip = { FC: 1, SC: 1, CF: 1, SV: 1, AC: 1, VfB: 1, VfL: 1, TSG: 1, Al: 1, CP: 1, SG: 1, 'St.': 0 };
  var w = name.split(/[\s-]+/).filter(function (x) { return x && !skip[x] && !/^\d/.test(x) && x.length > 1; });
  if (!w.length) w = [name];
  if (w.length === 1) return w[0].slice(0, 3).toUpperCase();
  return w.slice(0, 3).map(function (x) { return x[0]; }).join('').toUpperCase();
};

/** @param {Rng} rng @returns {World} */
G.world.create = function (rng) {
  // the agents come with G.game.newCareer
  var W = /** @type {World} */ (/** @type {unknown} */ ({ clubs: [], players: [], coaches: [], nextPid: 0, nextCid: 0 })), /** @type {Dict<Club>} */ byName = {};
  G.DATA.nations.forEach(function (n) {
    n.leagues.forEach(function (l, i) {
      l.c.split(';').forEach(function (s) {
        var p = s.split(':');
        // reputation, short name, revenue and budget just below
        var c = /** @type {Club} */ (/** @type {unknown} */ ({ id: W.clubs.length, name: p[0], nat: n.id, lg: n.id + (i + 1), base: +p[1], str: +p[1],
          c1: '#' + p[2], c2: '#' + p[3], sty: p[4] || 's', riv: [], sq: [], coach: -1, hon: {} }));
        c.rep = Math.round(c.base + rng.range(-2, 2));
        c.short = G.shortName(c.name);
        W.clubs.push(c); byName[c.name] = c;
      });
    });
  });
  G.DATA.derbies.split(';').forEach(function (d) {
    var a = byName[d.split('|')[0]], b = byName[d.split('|')[1]];
    if (a && b) { a.riv.push(b.id); b.riv.push(a.id); }
  });
  // Clubs without a famous derby get one rival of similar strength from the same nation
  W.clubs.forEach(function (c) {
    if (c.riv.length) return;
    var cand = W.clubs.filter(function (o) { return o.nat === c.nat && o.id !== c.id && Math.abs(o.base - c.base) <= 4; });
    if (!cand.length) return;
    var o = rng.pick(cand);
    c.riv.push(o.id); if (o.riv.length < 2) o.riv.push(c.id);
  });
  G.squads.generate(W, rng);
  G.coaches.generate(W, rng);
  G.world.updateStrength(W);
  W.clubs.forEach(function (c) {
    c.rev = G.world.revenue(c);
    c.bud = Math.round(c.rev * G.CFG.TRANSFER_SHARE);
  });
  return W;
};

/** @param {Club} c @returns {number} */
G.world.leagueMult = function (c) {
  var M = G.CFG.LEAGUE_MULT;
  if (M[c.lg] !== undefined) return M[c.lg];
  return c.lg.slice(-1) === '2' ? M.tier2 : M.other;
};

// Season revenue in M€
/** @param {Club} c */
G.world.revenue = function (c) {
  return Math.round(G.CFG.REV_BASE * Math.exp((c.rep - 55) / G.CFG.REV_DIV) * G.world.leagueMult(c) * 10) / 10;
};
/** @param {Club} c */
G.world.wageCap = function (c) { return c.rev * G.CFG.WAGE_SHARE; };
// Yearly wage bill in M€
/** @param {World} W @param {Club} c */
G.world.wageBill = function (W, c) {
  var s = 0;
  c.sq.forEach(function (id) { s += W.players[id].w; });
  return s * 52 / 1000;
};

/** @param {World} W */
G.world.updateStrength = function (W) {
  W.clubs.forEach(function (c) {
    var xi = G.squads.xi(W, c);
    c.xi = xi;
    var sum = 0;
    xi.forEach(function (id) { sum += W.players[id].o; });
    c.str = Math.round((sum / Math.max(1, xi.length) + G.coaches.bonus(W, c)) * 10) / 10;
  });
};

/** @param {World} W @param {LeagueKey} key */
G.world.leagueClubs = function (W, key) {
  return W.clubs.filter(function (c) { return c.lg === key; });
};

// End of season: promotion/relegation, reputation, finances.
// tables: { leagueKey: [clubIds sorted by final position] }, prizes: { clubId: M€ }
/** @param {World} W @param {Dict<ClubId[]>} tables @param {Dict<number>} prizes */
G.world.evolve = function (W, tables, prizes) {
  var C = G.CFG;
  G.LEAGUES.forEach(function (L) {
    if (L.tier !== 1) return;
    var low = tables[L.nat + '2'];
    if (!low) return;
    var top = tables[L.key];
    top.slice(-C.PROMO_SLOTS).forEach(function (id) { W.clubs[id].lg = L.nat + '2'; W.clubs[id].rep -= 2; });
    low.slice(0, C.PROMO_SLOTS).forEach(function (id) { W.clubs[id].lg = L.key; W.clubs[id].rep += 2; });
  });
  W.clubs.forEach(function (c) {
    c.rep = Math.round(c.rep * 0.85 + c.str * 0.15 + (prizes[c.id] ? Math.min(2, prizes[c.id] / 30) : 0));
    c.rev = G.world.revenue(c);
    var room = G.world.wageCap(c) - G.world.wageBill(W, c);
    c.bud = Math.max(0, Math.round(c.bud * C.CARRY + c.rev * C.TRANSFER_SHARE + (prizes[c.id] || 0) + Math.min(room, c.rev * 0.2) * 0.5));
  });
};

// Club crest as inline SVG, drawn from colours and style
/** @param {Club} c @param {number} [size] */
G.crest = function (c, size) {
  size = size || 28;
  var a = c.c1, b = c.c2, id = 'k' + c.id, body, clip;
  /** @type {Dict<string>} */
  var shapes = {
    s: 'M5 4h30v14c0 10-7 16-15 19C12 34 5 28 5 18z',
    o: 'M20 3c9 0 15 7 15 17s-6 17-15 17S5 30 5 20 11 3 20 3z',
    c: 'M20 2a18 18 0 1 0 .01 0z'
  };
  var path = shapes[c.sty] || shapes.s;
  var fill = '<rect width="40" height="40" fill="' + a + '"/>';
  if (c.sty === 'v') fill += [10, 22].map(function (x) { return '<rect x="' + x + '" width="6" height="40" fill="' + b + '"/>'; }).join('');
  if (c.sty === 'h') fill += '<rect x="20" width="20" height="40" fill="' + b + '"/>';
  if (c.sty === 'x') fill += [12, 24].map(function (y) { return '<rect y="' + y + '" width="40" height="6" fill="' + b + '"/>'; }).join('');
  if (c.sty === 'd') fill += '<path d="M0 30L30 0h10L0 40z" fill="' + b + '"/>';
  if (c.sty === 'q') fill += '<rect x="20" width="20" height="20" fill="' + b + '"/><rect y="20" width="20" height="20" fill="' + b + '"/>';
  clip = '<clipPath id="' + id + '"><path d="' + path + '"/></clipPath>';
  body = '<g clip-path="url(#' + id + ')">' + fill + '</g><path d="' + path + '" fill="none" stroke="' + b + '" stroke-width="2"/>';
  var txt = c.short, fs = txt.length > 2 ? 10 : 12;
  var tcol = G.contrast(c.sty === 's' || c.sty === 'o' || c.sty === 'c' ? a : '#000');
  var label = '<text x="20" y="24" text-anchor="middle" font-size="' + fs + '" font-weight="800" font-family="Arial,sans-serif" fill="' + tcol +
    '" stroke="' + (tcol === '#fff' ? '#0006' : '#fff6') + '" stroke-width="0.6">' + txt + '</text>';
  return '<svg class="crest" width="' + size + '" height="' + size + '" viewBox="0 0 40 40"><defs>' + clip + '</defs>' + body + label + '</svg>';
};

/** @param {string} hex */
G.contrast = function (hex) {
  var h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(function (x) { return x + x; }).join('');
  var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111' : '#fff';
};
