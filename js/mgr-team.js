// @ts-check
// Manager: formation, starting XI and fitness of the managed club.
// m.form = formation key, m.mode = 'auto' (best fit players, tired ones rested) or 'manual' (m.xi kept as picked),
// m.xi = [{ r: slot role, id }], m.cond = { id: 0..100 } fitness (100 when missing).
// The managed club plays with this XI instead of the engine's rotation; formation and tactic move both sides' goals.

G.mgrTeam = {};

/** @type {Dict<Formation>} */
G.mgrTeam.FORMS = {
  '4-4-2': { s: { POR: 1, DC: 2, TS: 2, CC: 2, ES: 2, ATT: 2 }, atk: 0, def: 0, d: 'equilibrio classico' },
  '4-3-3': { s: { POR: 1, DC: 2, TS: 2, CC: 3, ES: 2, ATT: 1 }, atk: 0.03, def: 0.03, d: 'possesso e ampiezza' },
  '3-5-2': { s: { POR: 1, DC: 3, TS: 0, CC: 3, ES: 2, ATT: 2 }, atk: 0.06, def: -0.04, d: 'centrocampo folto, esterni a tutta fascia' },
  '3-4-3': { s: { POR: 1, DC: 3, TS: 0, CC: 2, ES: 2, ATT: 3 }, atk: 0.12, def: -0.1, d: 'tre punte, si segna e si rischia' },
  '5-3-2': { s: { POR: 1, DC: 3, TS: 2, CC: 3, ES: 0, ATT: 2 }, atk: -0.08, def: 0.1, d: 'difesa a cinque, si concede poco' }
};
// Tactic: [our goals, goals we stop] as multipliers
/** @type {Dict<number[]>} */
G.mgrTeam.TACTIC = { att: [0.15, -0.12], bal: [0, 0], def: [-0.15, 0.18] };

// Overall lost playing out of position (slot role <- natural role)
/** @type {Dict<number>} */
G.mgrTeam.FIT = { 'DC>TS': 3, 'TS>DC': 4, 'TS>ES': 4, 'ES>TS': 4, 'ES>ATT': 4, 'ATT>ES': 5, 'CC>ES': 4, 'ES>CC': 4,
  'CC>DC': 6, 'DC>CC': 7, 'CC>TS': 6, 'TS>CC': 6, 'CC>ATT': 6, 'ATT>CC': 7, 'DC>ES': 9, 'ES>DC': 9, 'TS>ATT': 10, 'ATT>TS': 10, 'DC>ATT': 11, 'ATT>DC': 12 };
/** @param {Npc} pl @param {RoleKey} r @returns {number} */
G.mgrTeam.fit = function (pl, r) {
  if (pl.r === r) return 0;
  if (pl.r === 'POR' || r === 'POR') return 30;
  return G.mgrTeam.FIT[pl.r + '>' + r] || 12;
};

/** @param {Mgr} m @param {PlayerId} id @returns {number} */
G.mgrTeam.cond = function (m, id) { var c = m.cond && m.cond[id]; return c === undefined ? 100 : c; };

// What a player is worth today in a slot: overall, position and fitness (only below COND_OK: a sensible rotation
// costs nothing), his morale and his form (js/mgr-squad.js)
/** @param {Mgr} m @param {Npc} pl @param {RoleKey} r @returns {number} */
G.mgrTeam.eff = function (m, pl, r) {
  var T = G.CFG.MGR_TEAM;
  return pl.o - G.mgrTeam.fit(pl, r) - Math.max(0, T.COND_OK - G.mgrTeam.cond(m, pl.i)) * T.COND_K + G.mgrSq.eff(m, pl.i);
};

/** @param {string} form @returns {RoleKey[]} */
G.mgrTeam.slots = function (form) {
  var s = G.mgrTeam.FORMS[form].s, /** @type {RoleKey[]} */ out = [];
  G.ROLE_KEYS.forEach(function (r) { for (var i = 0; i < (s[r] || 0); i++) out.push(r); });
  return out;
};

/** @param {Mgr} m */
G.mgrTeam.init = function (m) {
  if (!m.form) m.form = '4-4-2';
  if (!m.mode) m.mode = 'auto';
  if (!m.cond) m.cond = {};
  if (!m.starts) m.starts = {};
};

// Best XI for the formation: goalkeeper first, then each slot takes the best player left; like a sensible coach,
// the automatic pick rests a tired starter (fitness under REST_AT) when someone fresh can stand in, and never picks
// an injured player while anyone else can play (an injured player kept in a manual XI is replaced).
// fresh: overall and position only, as if everyone were fit and happy (the squad roles, js/mgr-squad.js)
/** @param {State} st @param {XiSlot[]} [keep] @param {boolean} [fresh] @returns {XiSlot[]} */
G.mgrTeam.auto = function (st, keep, fresh) {
  var T = G.CFG.MGR_TEAM, m = st.mgr, W = st.world, club = W.clubs[m.club], /** @type {Dict<number>} */ used = {}, /** @type {XiSlot[]} */ xi = [], /** @type {number[]} */ fixed = [];
  var sq = club.sq.map(function (id) { return W.players[id]; }), slots = G.mgrTeam.slots(m.form);
  var val = /** @param {Npc} pl @param {RoleKey} r */ function (pl, r) {
    return fresh ? pl.o - G.mgrTeam.fit(pl, r) : G.mgrTeam.eff(m, pl, r) - (G.mgrTeam.cond(m, pl.i) < T.REST_AT ? T.REST_PEN : 0) - (G.mgrSq.inj(m, pl.i) ? 1000 : 0);
  };
  slots.forEach(function (r, k) {
    var kept = keep && keep[k];
    if (kept && !used[kept.id] && club.sq.indexOf(kept.id) >= 0 && !G.mgrSq.inj(m, kept.id)) { used[kept.id] = 1; fixed[k] = 1; xi[k] = { r: r, id: kept.id }; }
  });
  // first players in their own role, then the gaps with whoever fits best
  [true, false].forEach(function (own) {
    slots.forEach(function (r, k) {
      if (xi[k]) return;
      var /** @type {Npc} */ best = null, bv = -1e9;
      sq.forEach(function (pl) { if (!used[pl.i] && (!own || pl.r === r)) { var v = val(pl, r); if (v > bv) { bv = v; best = pl; } } });
      if (best) { used[best.i] = 1; xi[k] = { r: r, id: best.i }; }
    });
  });
  // then swap pairs of starters, or a starter with a bench player, while the XI gets better
  for (var pass = 0, better = true; better && pass < 6; pass++) {
    better = false;
    for (var i = 0; i < xi.length; i++) {
      if (fixed[i] || !xi[i]) continue;
      var a = W.players[xi[i].id];
      for (var j = i + 1; j < xi.length; j++) {
        if (fixed[j] || !xi[j]) continue;
        var b = W.players[xi[j].id];
        if (val(b, xi[i].r) + val(a, xi[j].r) > val(a, xi[i].r) + val(b, xi[j].r) + 0.01) { xi[i].id = b.i; xi[j].id = a.i; a = b; better = true; }
      }
      sq.forEach(function (pl) {
        if (used[pl.i] || val(pl, xi[i].r) <= val(W.players[xi[i].id], xi[i].r) + 0.01) return;
        used[xi[i].id] = 0; used[pl.i] = 1; xi[i].id = pl.i; better = true;
      });
    }
  }
  return xi.filter(Boolean);
};

// The XI for the next match: automatic, or the manual one with gaps (sold players) filled
/** @param {State} st @returns {XiSlot[]} */
G.mgrTeam.xi = function (st) {
  var m = st.mgr;
  G.mgrTeam.init(m);
  var keep = m.mode === 'manual' && m.xi && m.xi.length === 11 && m.xiForm === m.form ? m.xi : null;
  m.xi = G.mgrTeam.auto(st, keep); m.xiForm = m.form;
  return m.xi;
};

/** @param {State} st @param {string} f */
G.mgrTeam.setForm = function (st, f) { if (G.mgrTeam.FORMS[f]) { st.mgr.form = f; G.mgrTeam.xi(st); } };

// Manual pick: put player id in slot k (a player already in the XI swaps places)
/** @param {State} st @param {number} k @param {PlayerId} id */
G.mgrTeam.setSlot = function (st, k, id) {
  var m = st.mgr, xi = G.mgrTeam.xi(st), j = -1;
  xi.forEach(function (x, i) { if (x.id === id) j = i; });
  if (j >= 0) xi[j].id = xi[k].id;
  xi[k].id = id; m.mode = 'manual';
};

// Strength of the XI as the engine sees it (average effective overall plus the coach's bonus)
/** @param {State} st @returns {number} */
G.mgrTeam.str = function (st) {
  var m = st.mgr, W = st.world, club = W.clubs[m.club], s = 0;
  G.mgrTeam.xi(st).forEach(function (x) { s += G.mgrTeam.eff(m, W.players[x.id], x.r); });
  return s / 11 + G.coaches.bonus(W, club);
};

// Side used by the match engine for the managed club (same shape as G.match.side); the captain on the pitch adds CAP
/** @param {State} st @param {Club} club @returns {MatchSide} */
G.mgrTeam.side = function (st, club) {
  var C = G.CFG, m = st.mgr, W = st.world, xi = G.mgrTeam.xi(st), /** @type {PlayerId[]} */ ids = [], sum = 0, eff = 0;
  xi.forEach(function (x) { var pl = W.players[x.id]; ids.push(x.id); sum += pl.o; eff += G.mgrTeam.eff(m, pl, x.r); });
  var bench = club.sq.filter(function (id) { return ids.indexOf(id) < 0 && !G.mgrSq.inj(m, id); }).map(function (id) { return W.players[id]; })
    .sort(function (a, b) { return G.mgrTeam.eff(m, b, b.r) - G.mgrTeam.eff(m, a, a.r); }).slice(0, C.SUBS).map(function (pl) { return pl.i; });
  var cap = m.cap !== null && m.cap !== undefined && ids.indexOf(m.cap) >= 0 ? G.CFG2.MGR_SQ.CAP : 0;
  return { ids: ids, main: false, str: eff / 11 + G.coaches.bonus(W, club) + (m.morale - 50) / C.MGR.MORALE_DIV + cap, avg: sum / 11, cameOn: bench, mgr: 1 };
};

// Formation and tactic as goal multipliers: [our attack, our defence]
/** @param {Mgr} m @returns {number[]} */
G.mgrTeam.mods = function (m) {
  var F = G.mgrTeam.FORMS[m.form || '4-4-2'], T = G.mgrTeam.TACTIC[m.tactic || 'bal'];
  return [F.atk + T[0], F.def + T[1]];
};

// Score of a match with modifiers (modH/modA = [attack, defence] or null); half = the share of the match played
// (a live match is played in two halves, js/mgr-live.js), 1 when missing
/** @param {number} hs @param {number} as @param {number[]|null} modH @param {number[]|null} modA @param {Rng} rng @param {number} [half] @returns {number[]} */
G.mgrTeam.sim = function (hs, as, modH, modA, rng, half) {
  var C = G.CFG, d = (hs - as + C.HOME_ADV) / C.GOAL_SCALE, h = modH || [0, 0], a = modA || [0, 0], base = C.GOAL_BASE * (half === undefined ? 1 : half);
  return [rng.poisson(base * Math.exp(d) * (1 + h[0]) * (1 - a[1])), rng.poisson(base * Math.exp(-d) * (1 + a[0]) * (1 - h[1]))];
};

// After a match of the managed club: injuries and form (js/mgr-squad.js), then starters tire, the others recover
// (faster or slower with the training, js/mgr-youth.js); starts are counted for youth growth
/** @param {State} st @param {MatchSide} side */
G.mgrTeam.after = function (st, side) {
  var T = G.CFG.MGR_TEAM, m = st.mgr, W = st.world, club = W.clubs[m.club];
  G.mgrSq.after(st, side);
  club.sq.forEach(function (id) {
    var c = G.mgrTeam.cond(m, id), pl = W.players[id];
    // a half-time substitution (side.sub = [on, off]): both play half a match
    if (side.ids.indexOf(id) >= 0) { c -= (T.COND_PLAY + (pl.a >= T.OLD ? T.COND_OLD : 0)) * (side.sub && side.sub[1] === id ? 0.5 : 1); m.starts[id] = (m.starts[id] || 0) + 1; }
    else if (side.sub && side.sub[0] === id) c -= T.COND_PLAY / 2;
    else c += T.COND_REST * G.mgrYouth.train(m).rest;
    m.cond[id] = Math.round(G.clamp(c, T.COND_MIN, 100));
  });
  m.played = (m.played || 0) + 1;
  m.games = (m.games || 0) + 1;  // the whole career's, for the Hall of Fame (M8 phase G)
};

// End of season: young players who got minutes grow, fitness and counters reset
/** @param {State} st */
G.mgrTeam.seasonEnd = function (st) {
  var T = G.CFG.MGR_TEAM, m = st.mgr, W = st.world, club = W.clubs[m.club], n = 0;
  club.sq.forEach(function (id) {
    var pl = W.players[id];
    if (pl.a <= 21 && m.played && (m.starts[id] || 0) >= m.played * T.YOUTH_SHARE) { pl.o = Math.min(pl.p, pl.o + T.YOUTH * (m.youthX || 1) * G.mgrYouth.train(m).grow); n++; }
  });
  if (n) G.news(st, '🌱 ' + n + (n > 1 ? ' giovani sono cresciuti' : ' giovane è cresciuto') + ' giocando con te');
  m.cond = {}; m.starts = {}; m.played = 0;
};
