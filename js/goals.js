// @ts-check
// Season goal: at the start of each season the player picks one of three goals drawn from his situation.
// Reached at season end = fame, fans and (when hard) a small potential rise within POT_UP; missed = morale down.
// st.goalOffer = [goal x3], st.goal = the chosen one: { k, n, lvl, t, base }

G.goals = {};

/** @param {State} st @returns {SeasonGoal[]} */
G.goals.make = function (st) {
  var C = G.CFG.GOALS, p = st.player, W = st.world, club = W.clubs[p.clubId], L = G.leagueByKey(club.lg), last = p.history[p.history.length - 1];
  var macro = G.ROLES[p.role].macro, ids = W.clubs.filter(function (c) { return c.lg === club.lg; }).sort(function (a, b) { return b.str - a.str; });
  var rank = ids.indexOf(club) + 1, acc = G.CFG.UEFA_ACCESS[club.nat], eu = L.tier === 1 && acc ? acc[0] + acc[1] + acc[2] : 0, /** @type {SeasonGoal[]} */ out = [];
  var ch = G.season.startChance(st), same = last && last.clubId === club.id && last.matches && last.apps / last.matches >= 0.5;
  // last season's LEAGUE numbers (older saves only have all competitions: about 70% of them come in the league)
  var lastG = same ? (last.lgG !== undefined ? last.lgG : Math.round(last.goals * 0.7)) : 0, lastA = same ? (last.lgA !== undefined ? last.lgA : Math.round(last.assists * 0.7)) : 0;
  var add = /** @param {string} k @param {number} n @param {number} lvl @param {string} t */ function (k, n, lvl, t) { out.push({ k: k, n: n, lvl: lvl, t: t }); };
  var stN = Math.min(C.STARTER, Math.round((ch + 0.25) * 20) / 20);
  if (ch < C.STARTER) add('starter', stN, 2, 'Conquista il posto: titolare in almeno il ' + Math.round(stN * 100) + '% delle partite');
  else add('avg', ch > 0.75 ? C.AVG[1] : C.AVG[0], ch > 0.75 ? 2 : 1, 'Chiudi la stagione con un voto medio di almeno ' + String(ch > 0.75 ? C.AVG[1] : C.AVG[0]).replace('.', ','));
  if (macro === 'ATT' || p.role === 'ES' || p.role === 'CC') {
    // a stretch on what you did here last season (+10%, at most +C.STRETCH), otherwise on your expected minutes
    var cc = p.role === 'CC', prev = cc ? lastA : lastG, norm = ch * (cc ? 6 : p.role === 'ATT' ? 14 : 7);
    var exp = Math.max(p.role === 'ATT' ? 6 : 3, same ? Math.min(prev + C.STRETCH, Math.round(prev * 1.1 + 0.5)) : Math.round(norm * 1.15));  // 0 last season is a number too
    add(cc ? 'assists' : 'goals', exp, 2, 'Almeno ' + exp + (cc ? ' assist' : ' gol') + ' in campionato');
  } else if (p.role === 'POR') add('cs', Math.max(3, Math.round(ch * C.CS)), 1, 'Almeno ' + Math.max(3, Math.round(ch * C.CS)) + ' partite senza subire gol');
  else add('apps', Math.max(8, Math.round(ch * C.APPS)), 1, 'Almeno ' + Math.max(8, Math.round(ch * C.APPS)) + ' presenze in campionato');
  if (L.tier === 2 && rank <= G.CFG.PROMO_SLOTS + 3) add('promo', G.CFG.PROMO_SLOTS, 2, 'Conquista la promozione: chiudi almeno ' + G.CFG.PROMO_SLOTS + 'º');
  else if (L.tier === 1 && rank <= 2) add('title', 1, 2, 'Vinci il campionato');
  else if (eu && rank <= eu + 3) add('europe', eu, rank <= eu ? 1 : 2, 'Qualificazione europea: chiudi almeno ' + eu + 'º');
  else if (club.riv.length) add('derby', 1, 1, 'Vinci almeno un derby in stagione');
  else add('pos', Math.max(1, rank - 2), 2, 'Fai meglio del previsto: chiudi almeno ' + Math.max(1, rank - 2) + 'º');
  return out.slice(0, 3);
};

/** @param {State} st */
G.goals.offer = function (st) {
  if (st.mgr || !st.S) return;
  st.goalOffer = G.goals.make(st); st.goal = null; st.goalYear = st.S.year;
};

/** @param {State} st @param {number} i */
G.goals.pick = function (st, i) {
  var g = st.goalOffer && st.goalOffer[i];
  if (!g) return;
  st.goal = g; g.base = st.player.derbyWins || 0; st.goalOffer = null;
};

// Nobody chose by the end of the first block: the first goal is taken
/** @param {State} st */
G.goals.ensure = function (st) {
  if (st.goalOffer && !st.goal) { G.goals.pick(st, 0); G.news(st, '🎯 Obiettivo della stagione: ' + st.goal.t); }
};

// Where the goal stands now: { v: value, ok: reached }
/** @param {State} st @param {SeasonGoal} g @returns {{ v: number, ok: boolean, low: boolean }} */
G.goals.progress = function (st, g) {
  var S = st.S, ps = S.ps, p = st.player, club = st.world.clubs[p.clubId], pos = G.season.sortTable(S, club.lg).indexOf(club.id) + 1, v;
  if (g.k === 'goals') v = ps.lg[1];
  else if (g.k === 'apps') v = ps.lg[0];
  else if (g.k === 'assists') v = ps.lg[2];
  else if (g.k === 'cs') v = ps.cs;
  else if (g.k === 'avg') v = ps.rN ? Math.round(ps.rSum / ps.rN * 100) / 100 : 0;
  else if (g.k === 'starter') v = ps.matches ? Math.round(ps.starts / ps.matches * 100) / 100 : 0;
  else if (g.k === 'derby') v = (p.derbyWins || 0) - (g.base || 0);
  else v = pos;
  var low = g.k === 'title' || g.k === 'promo' || g.k === 'europe' || g.k === 'pos';
  return { v: v, ok: low ? v <= g.n : v >= g.n, low: low };
};

/** @param {SeasonGoal} g @param {{ v: number, low: boolean }} pr @returns {string} */
G.goals.label = function (g, pr) {
  if (pr.low) return pr.v + 'º ora';
  if (g.k === 'starter') return 'ora ' + Math.round(pr.v * 100) + '%';
  if (g.k === 'avg') return 'ora ' + String(pr.v.toFixed(2)).replace('.', ',');
  return 'ora ' + pr.v + ' su ' + g.n;
};

// Season end (before the recap): reward or morale hit
/** @param {State} st @param {SeasonRecord} rec */
G.goals.settle = function (st, rec) {
  var C = G.CFG.GOALS, g = st.goal, p = st.player;
  st.goal = null; st.goalOffer = null;
  if (!g || rec.club !== st.world.clubs[p.clubId].name) return;
  var pr = G.goals.progress(st, g);
  if (pr.ok) {
    G.life.fame(st, C.FAME * g.lvl); G.life.fans(st, p.clubId, C.FANS * g.lvl);
    var P = G.CFG.POT_UP, up = g.lvl === 2 && p.age <= P.AGE && p.pot < Math.min(P.CAP, (p.pot0 || p.pot) + P.MAX) ? 1 : 0;
    if (up) { if (p.pot0 === undefined) p.pot0 = p.pot; p.pot++; G.ATTRS.forEach(function (k) { p.ceil[k] = Math.min(99, p.ceil[k] + 1); }); }
    rec.goal = { ok: 1, t: g.t, up: up };
  } else { p.morale = Math.max(0, p.morale - C.MORALE * g.lvl); rec.goal = { ok: 0, t: g.t }; }
  G.news(st, '🎯 Obiettivo ' + (pr.ok ? 'raggiunto' : 'mancato') + ': ' + g.t);
};
