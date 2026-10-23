// @ts-check
// Life off the pitch: money, staff and purchases, agent, fame, fans, club legend, rivalries, coach relationships.

G.life = {};

/** @param {Player} p */
G.life.init = function (p) {
  p.fame = G.CFG.FAME_START; p.money = 20; p.agent = null; p.staff = {}; p.items = {}; p.invest = 0;
  p.fans = {}; p.seasonsAt = {}; p.goalsAt = {}; p.traitor = {}; p.bandiera = {}; p.rel = {}; p.awards = [];
  p.derbyWins = 0; p.transferReq = false;
};

/** @param {Player} p @returns {Agent|null} */
G.life.agent = function (p) { var pool = G.agents.pool; return p.agent !== null && p.agent !== undefined && pool ? pool[p.agent] || null : null; };
// Staff effect plus permanent bonuses from owned items (gym, chef, recovery centre)
/** @param {Player} p @param {string} key */
G.life.staff = function (p, key) {
  var lv = (p.staff || {})[key] || 0, v = lv ? G.SHOP.staff[key].lv[lv - 1][1] : 0, I = G.SHOP.items;
  Object.keys(p.items || {}).forEach(function (k) { if (p.items[k] && I[k] && I[k].st && I[k].st[key]) v += I[k].st[key]; });
  return v;
};
// Yearly income from owned businesses (k€)
/** @param {Player} p */
G.life.income = function (p) {
  var I = G.SHOP.items, s = 0;
  Object.keys(p.items || {}).forEach(function (k) { if (p.items[k] && I[k] && I[k].inc) s += I[k].inc; });
  return s;
};
/** @param {Player} p */
G.life.staffCost = function (p) {
  var s = 0;
  Object.keys(p.staff || {}).forEach(function (k) { if (p.staff[k]) s += G.SHOP.staff[k].lv[p.staff[k] - 1][0]; });
  return s;
};
/** @param {State} st @param {ClubId} clubId */
G.life.isBandiera = function (st, clubId) { return !!st.player.bandiera[clubId]; };
/** @param {State} st @param {ClubId} clubId @param {number} d */
G.life.fans = function (st, clubId, d) {
  var p = st.player;
  if (p.traitor[clubId] && d > 0) d *= 0.3;
  p.fans[clubId] = Math.round(G.clamp((p.fans[clubId] || 0) + d, 0, 100) * 10) / 10;
};
/** @param {State} st @param {number} d */
G.life.fame = function (st, d) { var p = st.player; p.fame = Math.round(G.clamp(p.fame + d, 0, 100) * 10) / 10; };
/** @param {State} st */
G.life.coach = function (st) { return G.coaches.of(st.world, st.world.clubs[st.player.clubId]); };
/** @param {State} st @param {number} d */
G.life.relCurrent = function (st, d) {
  var co = G.life.coach(st);
  if (co) st.player.rel[co.i] = Math.round(G.clamp((st.player.rel[co.i] || 0) + d, -100, 100));
};
/** @param {State} st */
G.life.moraleBonus = function (st) {
  var p = st.player, b = G.life.staff(p, 'mental') * 0.5;
  if (p.bandiera[p.clubId]) b += 2;
  if (p.captain === p.clubId) b += G.CFG.CAPTAIN.MORALE;
  ['island', 'luxury', 'villa', 'flat'].some(function (k) { if (p.items[k]) { b += G.SHOP.items[k].mo * 0.25; return true; } });
  return b;
};

// After each playing block: money, fame, fans, coach relationship
/** @param {State} st @param {BlockSum} sum */
G.life.block = function (st, sum) {
  var C = G.CFG, p = st.player, ag = G.life.agent(p), club = st.world.clubs[p.clubId];
  var gross = p.contract.wage * C.WEEKS_PER_BLOCK;
  var net = gross * (1 - C.TAX) * (1 - (ag ? ag.fee / 100 : 0));
  p.money = Math.round(p.money + net + (G.life.income(p) - G.life.staffCost(p)) / 4);
  if (p.money < 0 && G.life.staffCost(p) > 0) {
    Object.keys(p.staff).forEach(function (k) { p.staff[k] = 0; });
    G.news(st, '💸 Conto in rosso: hai dovuto licenziare il tuo staff personale');
  }
  // Fame drifts toward a target set by level, club and honours; performances and PR push it around
  var target = G.clamp((p.ovr - 55) * 1.5 + (club.rep - 65) * 0.8 + p.awards.reduce(function (s, a) { return s + (a.w || 3); }, 0) + p.trophies.length, 0, 100);
  var dFame = (target - p.fame) * 0.15 + (sum.avg ? (sum.avg - 6.6) * 0.6 : -0.2) + sum.goals * 0.05 + G.life.staff(p, 'pr');
  G.life.fame(st, dFame);
  var fd = sum.apps * 0.12 + sum.goals * 0.25 + (sum.avg ? (sum.avg - 6.5) : 0);
  G.life.fans(st, p.clubId, fd > 0 && p.captain === p.clubId ? fd * C.CAPTAIN.FANS : fd);
  p.goalsAt[p.clubId] = (p.goalsAt[p.clubId] || 0) + sum.goals;
  var co = G.life.coach(st);
  if (co) {
    var d = (sum.avg ? (sum.avg - 6.6) * 4 : -1) + (co.sty === 'giovani' && p.age <= 22 ? 1 : 0) + (co.sty === 'motivatore' && p.morale > 60 ? 1 : 0);
    if (sum.minShare < 0.2 && sum.matches > 3) d -= 1.5;
    G.life.relCurrent(st, d);
  }
};

/** @param {State} st @param {SeasonRecord} rec @param {number} pos */
G.life.seasonEnd = function (st, rec, pos) {
  var C = G.CFG, p = st.player, id = rec.clubId, rng = G.rng;
  p.seasonsAt[id] = (p.seasonsAt[id] || 0) + 1;
  G.life.fans(st, id, 4 + rec.trophies.length * 6 + (pos === 1 ? 4 : 0));
  if (!p.bandiera[id] && (p.fans[id] || 0) >= C.BANDIERA && p.seasonsAt[id] >= C.BANDIERA_SEASONS) {
    p.bandiera[id] = 1;
    G.news(st, '🚩 Sei ufficialmente una bandiera del ' + st.world.clubs[id].name);
  }
  G.life.fame(st, rec.trophies.length * 2);
  if (p.invest > 0) {
    var r = G.SHOP.INVEST_MEAN + rng.normal() * G.SHOP.INVEST_SD, gain = Math.round(p.invest * r);
    p.invest = Math.max(0, p.invest + gain);
    G.news(st, (gain >= 0 ? '📈' : '📉') + ' Investimenti: ' + (gain >= 0 ? '+' : '') + gain + ' k€');
  }
  p.items.charityYear = 0;
};

/** @param {State} st @param {Club} from @param {Club} to */
G.life.onTransfer = function (st, from, to) {
  var p = st.player, W = st.world;
  if (from.id !== to.id) p.captain = null;
  Object.keys(p.seasonsAt).forEach(/** @param {string|number} ex */ function (ex) {
    ex = +ex;
    if (ex !== to.id && to.riv.indexOf(ex) >= 0 && (p.seasonsAt[ex] >= 1 || (p.fans[ex] || 0) > 20)) {
      p.traitor[ex] = 1; p.fans[ex] = 0;
      G.news(st, '🐍 Per i tifosi del ' + W.clubs[ex].name + ' sei un traditore');
    }
  });
  if (from.id !== to.id) G.life.fame(st, Math.max(0, (to.rep - from.rep) / 4));
};

/** @param {State} st @param {ClubId} opp @param {number} gf @param {number} gc */
G.life.derby = function (st, opp, gf, gc) {
  var C = G.CFG, p = st.player, mult = p.traitor[opp] ? 2 : 1;
  if (gf > gc) { G.life.fans(st, p.clubId, C.DERBY_FANS * mult); p.derbyWins++; p.morale = Math.min(100, p.morale + 2); }
  else if (gf < gc) { G.life.fans(st, p.clubId, -C.DERBY_FANS / 2); p.morale = Math.max(0, p.morale - (p.traitor[opp] ? 4 : 2)); }
};

/** @param {State} st @param {Coach} co */
G.life.coachArrived = function (st, co) {
  var p = st.player, r = p.rel[co.i] || 0;
  if (r >= 35) { p.morale = Math.min(100, p.morale + 5); G.news(st, '😊 Ritrovi ' + co.n + ', che ti stima molto'); }
  else if (r <= -30) { p.morale = Math.max(0, p.morale - 5); G.news(st, '😬 Arriva ' + co.n + ': tra voi non corre buon sangue'); }
  (st.flags || (st.flags = {})).newCoach = co.i;
};
/** @param {State} st @param {Coach} co */
G.life.coachLeft = function (st, co) {
  var p = st.player;
  if ((p.rel[co.i] || 0) >= 30) p.morale = Math.max(0, p.morale - 3);
};
/** @param {State} st */
G.life.refusedSale = function (st) {
  var p = st.player;
  p.morale = Math.max(0, p.morale - 6); G.life.relCurrent(st, -8); G.life.fans(st, p.clubId, 5);
  G.news(st, '✋ Hai rifiutato la cessione decisa dal club');
};

// ---------- spending ----------
/** @param {State} st @param {string} key @param {number} lv */
G.life.setStaff = function (st, key, lv) {
  var p = st.player, S = G.SHOP.staff[key];
  if (lv > 0 && p.money < S.lv[lv - 1][0] / 4) return false;
  p.staff[key] = lv;
  return true;
};
/** @param {State} st @param {string} key */
G.life.buy = function (st, key) {
  var p = st.player, it = G.SHOP.items[key];
  if (p.money < it.c || (it.once && p.items[key]) || (it.season && p.items.charityYear) || p.fame < (it.req || 0)) return false;
  p.money -= it.c; p.morale = Math.min(100, p.morale + it.mo); G.life.fame(st, it.fa);
  if (it.fans) Object.keys(p.fans).forEach(function (c) { G.life.fans(st, +c, it.fans); });
  if (it.season) p.items.charityYear = 1;
  else p.items[key] = 1;
  G.news(st, '🛍️ ' + it.n);
  return true;
};
/** @param {State} st @param {number} dir */
G.life.investMove = function (st, dir) {
  var p = st.player, step = G.SHOP.INVEST_STEP;
  if (dir > 0 && p.money >= step) { p.money -= step; p.invest += step; }
  if (dir < 0 && p.invest > 0) { var x = Math.min(step, p.invest); p.invest -= x; p.money += x; }
};
/** @param {State} st @param {number} idx */
G.life.hireAgent = function (st, idx) {
  var p = st.player, ag = st.world.agents[idx];
  if (!ag || !G.agents.available(st, ag)) return false;
  p.agent = idx;
  G.news(st, '🤝 ' + ag.n + ' è il tuo nuovo agente');
  return true;
};
/** @param {Player} p */
G.life.followers = function (p) { return Math.round(Math.pow(p.fame, 2.2) * 25) / 1000; }; // millions
