// @ts-check
// Personal awards of the second career, kept in st.mgr.awards like the player's p.awards:
// Manager del mese (coach whose club took the most league points in the block), Manager / Dirigente dell'anno
// (club that beat its strength rank by the most) and the world award (club with the heaviest haul of the season).

G.mgrAw = {};

/** @param {State} st @param {string} name @param {number} tier @param {string} news */
G.mgrAw.add = function (st, name, tier, news) {
  var m = G.mgr.job(st); m.awards = m.awards || [];
  m.awards.push({ name: name, year: G.sure(st.S).year, w: tier === 2 ? 1 : 3, club: st.world.clubs[m.club].name });
  G.news(st, '🏅 ' + news);
};

// Points, goal difference and matches of every club in the league right now
/** @param {Season} S @param {LeagueKey} key @returns {{ [club: number]: number[] }} */
G.mgrAw.snap = function (S, key) {
  var t = S.lg[key].tab, /** @type {{ [club: number]: number[] }} */ o = {};
  S.lg[key].ids.forEach(function (id) { o[id] = [t[id][6], t[id][4] - t[id][5], t[id][0]]; });
  return o;
};

/** @param {State} st @param {number} b */
G.mgrAw.block = function (st, b) {
  var m = G.mgr.job(st), S = G.sure(st.S), club = st.world.clubs[m.club], key = club.lg, L = G.leagueByKey(key), now = G.mgrAw.snap(S, key);
  var old = m.snap && m.snap.year === S.year && m.snap.key === key ? m.snap.t : null;
  m.snap = { year: S.year, key: key, t: now };
  if (!old && b > 0) return;
  var zero = [0, 0, 0], gain = /** @param {number} id */ function (id) { var o = old ? old[id] : zero; return [now[id][0] - o[0], now[id][1] - o[1], now[id][2] - o[2]]; };
  if (gain(club.id)[2] < G.CFG.MGR_AW.MONTH_MIN) return;
  var best = Object.keys(now).map(Number).sort(function (a, c) { var x = gain(a), y = gain(c); return (y[0] - x[0]) || (y[1] - x[1]) || (a - c); })[0];
  if (best === club.id) G.mgrAw.add(st, 'Manager del mese ' + L.name, L.tier, 'Sei il manager del mese in ' + L.name);
};

/** @param {State} st @param {Dict<ClubId[]>} tables @param {[ClubId, string][]} honours */
G.mgrAw.season = function (st, tables, honours) {
  var C = G.CFG.MGR_AW, m = G.mgr.job(st), W = st.world, club = W.clubs[m.club], L = G.leagueByKey(club.lg), ids = tables[club.lg];
  var byStr = ids.slice().sort(function (a, b) { return W.clubs[b].str - W.clubs[a].str; });
  var best = ids.map(function (id, i) { return [id, byStr.indexOf(id) - i + (i === 0 ? C.CHAMP : 0)]; }).sort(function (a, b) { return b[1] - a[1]; })[0];
  if (best[0] === club.id && best[1] >= 1) G.mgrAw.add(st, 'Manager dell’anno ' + L.name, L.tier, 'Manager dell’anno in ' + L.name);
  var /** @type {{ [club: number]: number }} */ pts = {};
  honours.forEach(function (h) { pts[h[0]] = (pts[h[0]] || 0) + G.hof.TROPHY(h[1]); });
  var top = Object.keys(pts).map(Number).sort(function (a, b) { return pts[b] - pts[a] || W.clubs[b].str - W.clubs[a].str; })[0];
  if (top === club.id && pts[top] >= C.WORLD_MIN) G.mgrAw.add(st, 'Allenatore dell’anno', 1, 'Allenatore dell’anno nel mondo');
};

// Hall of Fame points of the second career's awards
/** @param {Mgr} m @returns {number} */
G.mgrAw.score = function (m) {
  var H = G.CFG.MGR_AW.HOF;
  return (m.awards || []).reduce(function (s, a) {
    var v = /^Manager del mese/.test(a.name) ? H[0] : /^(Allenatore|Dirigente) dell’anno$/.test(a.name) ? H[2] : H[1];
    return s + v * (a.w === 1 ? 0.5 : 1);
  }, 0);
};
