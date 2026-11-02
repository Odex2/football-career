// @ts-check
// Player: creation, overall, growth curves, injuries.

G.player = {};

G.player.keys = function () { return G.ATTRS; };
/** @param {Player} p @param {AttrKey} k */
G.player.w = function (p, k) { return G.pos.weights(G.pos.of(p))[k] || 0; };  // the weights of his position (M9 S5)

/** @param {CareerOpts} o @param {Rng} rng @returns {Player} */
G.player.create = function (o, rng) {
  var C = G.CFG, goat = C.GOAT[o.goat || 0];
  // the attributes, overall, stars and the rest are filled below
  var pos0 = o.pos && G.POS[o.pos] ? o.pos : G.pos.std(o.role, o.foot);
  var p = /** @type {Player} */ (/** @type {unknown} */ ({ name: o.name, nat: o.nat, role: G.POS[pos0].r, pos: pos0, foot: o.foot, age: C.START_AGE,
    pot: Math.round(goat ? rng.range(goat.pot[0], goat.pot[1]) : rng.range(C.POT_MIN, C.POT_MAX)), attrs: {}, ceil: {}, traits: [],
    morale: C.MORALE_START, form: 0, inj: 0, seasons: 0, history: [], trophies: [],
    tot: { apps: 0, goals: 0, assists: 0 }, clubId: null, loanFrom: null, contract: null,
    plan: { focus: 'bal', intensity: 1 } }));
  // Scouting band: true potential blurred into a star range (half stars)
  var est = p.pot + rng.range(-4, 4);
  p.stars = G.clamp(Math.round((est - 55) / 8 * 2) / 2, 1, 5);
  if (goat) p.goat = o.goat;

  // Random attributes scaled for the chosen role: key stats high, irrelevant ones low
  var startOvr = C.START_OVR_BASE + (p.pot - 60) * C.START_OVR_POT + rng.range(-2, 2) + (goat ? goat.start : 0);
  G.ATTRS.forEach(function (k) {
    var w = G.player.w(p, k), bias = 0;
    for (var i = 0; i < C.GEN_BIAS.length; i++) if (w >= C.GEN_BIAS[i][0]) { bias = C.GEN_BIAS[i][1]; break; }
    var ceil = G.clamp(p.pot + bias + rng.range(-C.CEIL_NOISE, C.CEIL_NOISE), 25, 99);
    p.ceil[k] = ceil;
    p.attrs[k] = G.clamp(ceil * startOvr / p.pot + rng.range(-C.GEN_NOISE, C.GEN_NOISE), 15, 90);
  });
  // Rescale so the starting overall matches startOvr regardless of noise
  var o0 = G.player.ovrRaw(p), adj = startOvr - o0;
  G.ATTRS.forEach(function (k) { p.attrs[k] = G.clamp(p.attrs[k] + adj, 15, 90); });
  var tk = Object.keys(G.TRAITS);
  var n = rng.int(C.TRAIT_COUNT[0], C.TRAIT_COUNT[1]);
  while (p.traits.length < n) {
    var t = rng.pick(tk);
    if (goat && (t === 'fragile' || t === 'tardivo')) continue;
    if (p.traits.indexOf(t) < 0 && !(t === 'integro' && p.traits.indexOf('fragile') >= 0) &&
        !(t === 'fragile' && p.traits.indexOf('integro') >= 0) &&
        !(t === 'precoce' && p.traits.indexOf('tardivo') >= 0) &&
        !(t === 'tardivo' && p.traits.indexOf('precoce') >= 0)) p.traits.push(t);
  }
  G.pos.init(p, o.name + ':' + o.nat + ':' + pos0 + ':' + p.pot);  // familiarity, with numbers of its own (M9 S5)
  p.ovr = G.player.ovr(p);
  G.life.init(p);
  return p;
};

/** @param {Player} p */
// The overall in the position he plays (M9 S5: its weights and familiarity; the 6 roles of before give the same number)
G.player.ovrRaw = function (p) { return G.pos.ovrAt(p, G.pos.of(p)); };
/** @param {Player} p */
G.player.ovr = function (p) { return Math.round(G.player.ovrRaw(p)); };

/** @param {Player} p @param {'peak'|'young'|'mid'|'inj'|'decl'|'key'} field @param {number} def */
G.player.trait = function (p, field, def) {
  var v = def;
  p.traits.forEach(function (t) { var T = G.TRAITS[t]; if (T[field] !== undefined) v = field === 'peak' ? v + T[field] : v * T[field]; });
  return v;
};

// Growth applied after each playing block (frac = share of the season)
/** @param {Player} p @param {number} minShare @param {number} frac @param {Rng} rng @returns {number} */
G.player.grow = function (p, minShare, frac, rng) {
  var C = G.CFG, keys = G.ATTRS, before = p.ovr;
  var intens = C.INTENSITY[p.plan.intensity];
  var talent = C.GROW_TALENT_BASE + (p.pot - 60) / C.GROW_TALENT_DIV;
  var minF = C.GROW_MIN_FACTOR + C.GROW_MIN_SLOPE * minShare;
  var moraleF = 0.85 + 0.3 * p.morale / 100;
  var peakShift = G.player.trait(p, 'peak', 0);
  var ageF = 1;
  for (var y = 0; y < C.GROW_YOUNG.length; y++) if (p.age <= C.GROW_YOUNG[y][0]) { ageF = C.GROW_YOUNG[y][1]; break; }
  if (p.age < 21) ageF *= G.player.trait(p, 'young', 1);
  else if (p.age <= 25 && p.traits.indexOf('tardivo') >= 0) ageF *= G.sure(G.TRAITS.tardivo.mid);
  var declTalent = Math.max(0.4, C.DECL_TALENT - (p.pot - 60) / 60) * G.player.trait(p, 'decl', 1) * (1 - G.life.staff(p, 'nutri'));
  var trainer = 1 + G.life.staff(p, 'trainer');
  var keyAttr = p.role === 'POR' ? 'rif' : 'fin';
  var focusKeys = G.player.focusKeys(p), fMult = p.plan.focus === 'key' ? C.FOCUS_KEY : C.FOCUS_MULT, learn = p.plan.focus === 'learn' ? G.CFG2.POS.LEARN_GROW : 1;
  keys.forEach(function (k) {
    var peak = C.PEAK[k] + peakShift, cur = p.attrs[k], d;
    var focus = !focusKeys ? 1 : focusKeys.indexOf(k) >= 0 ? fMult : C.FOCUS_OTHERS;
    if (p.age <= peak) {
      var taper = Math.min(1, (peak + 1 - p.age) / 3);
      d = (p.ceil[k] - cur) * C.GROW_RATE * talent * minF * moraleF * intens.grow * focus * ageF * taper * trainer;
      if (k === keyAttr) d *= G.player.trait(p, 'key', 1);
      d = Math.max(0, d) * learn;  // learning a position halves the growth (M9 S5)
    } else {
      var yrs = p.age - peak;
      d = -C.DECL_BASE * Math.pow(yrs, C.DECL_EXP) * C.DECL_MULT[k] * declTalent;
      d *= (focus > 1 ? 0.7 : 1) * (intens.decl || 1); // focused or light training slows decline
    }
    p.attrs[k] = G.clamp(cur + d * frac + rng.normal() * 0.4 * frac * 4, 15, 99);
  });
  p.ovr = G.player.ovr(p);
  return p.ovr - before;
};

// The coach's proposal accepted (M9 S5: a position, js/positions.js)
/** @param {State} st @param {RoleSwap} swap */
G.player.setRole = function (st, swap) {
  var p = st.player;
  if (!swap) return;
  p.roleFrom = p.role;
  G.pos.set(st, swap.pos || G.pos.std(swap.to, p.foot), 'Accetti la proposta del mister');
};

/** @param {Player} p @returns {AttrKey[]|null} */
G.player.focusKeys = function (p) {
  if (p.plan.focus === 'bal' || p.plan.focus === 'learn') return null;
  if (p.plan.focus === 'key') return G.ATTRS.filter(function (k) { return G.player.w(p, k) >= G.CFG.FOCUS_KEY_W; });
  return G.GROUPS[p.plan.focus].keys;
};

// Expected attribute change in one block with a given focus (no randomness, nothing changed on the player)
/** @param {Player} p @param {string} focus @param {number} minShare */
G.player.preview = function (p, focus, minShare) {
  var q = /** @type {Player} */ (Object.assign({}, p)), k;
  q.attrs = {}; for (k in p.attrs) q.attrs[k] = p.attrs[k];
  q.plan = { focus: focus, intensity: p.plan.intensity };
  G.player.grow(q, minShare, 0.25, /** @type {Rng} */ ({ normal: function () { return 0; } }));
  /** @type {Attrs} */
  var d = {}; G.ATTRS.forEach(function (a) { d[a] = q.attrs[a] - p.attrs[a]; });
  return { d: d, ovr: G.player.ovrRaw(q) - G.player.ovrRaw(p) };  // unrounded, so the screens can compare focuses
};

// A great season raises the ceiling: talent shown on the pitch, up to POT_UP.MAX over the starting potential
/** @param {State} st @param {SeasonRecord} rec */
G.player.potUp = function (st, rec) {
  var P = G.CFG.POT_UP, p = st.player, club = st.world.clubs[rec.clubId];
  if (p.pot0 === undefined) p.pot0 = p.pot;
  if (p.age > P.AGE || !rec.matches || rec.apps / rec.matches < P.SHARE || club.str < p.ovr - P.LEVEL) return 0;
  var up = Math.min(rec.avg >= P.AVG[1] ? 2 : rec.avg >= P.AVG[0] ? 1 : 0, p.pot0 + P.MAX - p.pot, P.CAP - p.pot);
  if (up <= 0) return 0;
  p.pot += up;
  G.ATTRS.forEach(function (k) { p.ceil[k] = Math.min(99, p.ceil[k] + up); });
  p.starsX = (p.starsX || p.stars) + up / 4;
  p.stars = Math.min(5, Math.round(p.starsX * 2) / 2);
  G.news(st, '📈 Stagione da protagonista: il tuo potenziale cresce' + (up > 1 ? ' molto' : ''));
  return up;
};

// Injury roll for a block; returns matches missed (0 = fit)
/** @param {Player} p @param {Rng} rng */
G.player.injuryRoll = function (p, rng) {
  var C = G.CFG;
  var prob = C.INJ_BASE * C.INTENSITY[p.plan.intensity].inj * G.player.trait(p, 'inj', 1) * (p.age >= C.INJ_OLD_AGE ? C.INJ_OLD_MULT : 1) * (1 - G.life.staff(p, 'physio'));
  if (!rng.chance(prob)) return 0;
  var m = Math.round((C.INJ_MATCHES[0] + Math.pow(rng.next(), 2) * (C.INJ_MATCHES[1] - C.INJ_MATCHES[0])) * (1 - G.life.staff(p, 'physio') * 0.5));
  p.inj += m;
  return m;
};

