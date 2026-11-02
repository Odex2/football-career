// @ts-check
// Legacy score and Hall of Fame (finished careers kept in localStorage, across saves).

G.hof = {};
G.hof.KEY = 'pc_hof_v1';

/** @type {[number, string, string][]} */
G.hof.GRADES = [[900, 'Leggenda', '🐐'], [600, 'Fuoriclasse', '👑'], [380, 'Campione', '🏆'], [220, 'Big', '⭐'], [100, 'Professionista', '👟'], [0, 'Gregario', '🙂']];

/** @param {string} name @returns {number} */
G.hof.TROPHY = function (name) {
  var tier1 = G.LEAGUES.filter(function (L) { return L.name === name; })[0];
  if (tier1) return tier1.tier === 1 ? (['ENG1', 'ESP1', 'ITA1', 'GER1', 'FRA1'].indexOf(tier1.key) >= 0 ? 16 : 9) : 4;
  return /** @type {Dict<number>} */ ({ 'Champions League': 32, 'Europa League': 13, 'Conference League': 8, 'Mondiale': 45, 'Europeo': 25, 'Copa América': 22,
    'Coppa d’Asia': 10, 'Coppa d’Africa': 12 })[name] || 5;
};

/** @param {string} name @returns {number} */
G.hof.AWARD = function (name) {
  if (name === 'Pallone d’Oro') return 60;
  if (name === 'Scarpa d’Oro') return 15;
  if (/^Capocannoniere (Mondiale|Europeo|Copa|Coppa)/.test(name)) return 8;
  return /Capocannoniere|Player of the Season|Guanto|Re degli assist/.test(name) ? 4 : 2;
};

// Score and its parts, so the end screen can explain it
/** @param {State} st @returns {HofScore} */
G.hof.score = function (st) {
  var p = st.player, nt = p.nt || /** @type {NationalCareer} */ ({ caps: 0, goals: 0 }), /** @type {Dict<number>} */ parts = {};
  parts.campo = Math.round(p.tot.goals * 1 + p.tot.assists * 0.7 + p.tot.apps * 0.15);
  parts.trofei = p.trophies.reduce(function (s, t) { return s + G.hof.TROPHY(t.name); }, 0);
  parts.premi = p.awards.reduce(function (s, a) { return s + G.hof.AWARD(a.name) * (a.w === 1 ? 0.5 : 1); }, 0) +
    p.history.reduce(function (s, h) { return s + (h.bdo && h.bdo <= 3 ? 15 : h.bdo && h.bdo <= 10 ? 4 : 0); }, 0);
  parts.nazionale = Math.round(nt.caps * 0.4 + nt.goals);
  parts.picco = p.mgrOnly ? 0 : Math.max(0, (Math.max(p.peak || 0, p.ovr) - 70) * 4);
  var m = st.mgr;
  // a manager-only career is judged on the bench alone, so its trophies weigh as much as a player's
  var mw = p.mgrOnly ? 1 : 0.5;
  parts.panchina = m ? m.trophies.reduce(function (s, t) { return s + G.hof.TROPHY(t.name) * mw; }, 0) + m.seasons * 2 * mw * 2 + G.mgrAw.score(m) * mw * 2 : 0;
  parts.fascia = (p.capSeasons || 0) * 3 + (nt.cap ? 10 : 0);
  parts.obiettivi = Object.keys(p.ach || {}).length * 2;
  var total = 0;
  Object.keys(parts).forEach(function (k) { parts[k] = Math.round(parts[k]); total += parts[k]; });
  var g = G.hof.GRADES.filter(function (x) { return total >= x[0]; })[0];
  return { total: total, parts: parts, grade: g[1], icon: g[2] };
};

/** @returns {HofEntry[]} */
G.hof.read = function () {
  try { return JSON.parse(localStorage.getItem(G.hof.KEY) || '[]'); } catch (e) { return []; }
};

// Store a finished career once
/** @param {State} st */
G.hof.add = function (st) {
  if (st.hofSaved || st.debug) return;
  var p = st.player, sc = G.hof.score(st), list = G.hof.read(), /** @type {string[]} */ clubs = [];
  p.history.forEach(function (h) { if (clubs.indexOf(h.club) < 0) clubs.push(h.club); });
  var big = p.trophies.map(function (t) { return t.name; }).filter(function (n) { return G.hof.TROPHY(n) >= 20; });
  var /** @type {HofEntry} */ e = { id: st.seed + ':' + p.name, name: p.name, nat: p.nat, role: p.role, pos: G.pos.of(p), from: G.CFG.START_YEAR, to: st.year, seasons: p.seasons,
    clubs: clubs, apps: p.tot.apps, goals: p.tot.goals, assists: p.tot.assists, caps: (p.nt || {}).caps || 0,
    trophies: p.trophies.length, big: big, bdo: p.awards.filter(function (a) { return a.name === 'Pallone d’Oro'; }).length,
    score: sc.total, grade: sc.grade, mgr: st.mgr ? G.hof.mgrPart(st.mgr, p) : null, icon: sc.icon, goat: p.goat || 0, peak: Math.max(p.peak || 0, p.ovr), date: Date.now(),
    t: p.mgrOnly ? 'mgr' : 'pl' };
  list = list.filter(function (x) { return x.id !== e.id; });
  list.push(e);
  list.sort(function (a, b) { return b.score - a.score; });
  // the best 50 of each Hall of Fame
  var /** @type {Dict<number>} */ per = {};
  list = list.filter(function (x) { var k = G.hof.type(x); per[k] = (per[k] || 0) + 1; return per[k] <= 50; });
  try { localStorage.setItem(G.hof.KEY, JSON.stringify(list)); } catch (err) {}
  st.hofSaved = true;
  st.hofId = e.id;
};

/** @param {Mgr} m @param {Player} p @returns {HofMgr} the bench's part of an entry: the clubs coached, the matches */
G.hof.mgrPart = function (m, p) {
  var /** @type {string[]} */ clubs = [];
  m.hist.forEach(function (h) { if (clubs.indexOf(h.club) < 0) clubs.push(h.club); });
  return { only: p.mgrOnly ? 1 : 0, role: m.role, seasons: m.seasons, trophies: m.trophies.length, clubs: clubs, games: m.games || 0 };
};

/** @param {HofEntry} e @returns {string} 'pl' or 'mgr' (an entry from before phase G: by the career it was) */
G.hof.type = function (e) { return e.t || (e.mgr && e.mgr.only ? 'mgr' : 'pl'); };

// The players' Hall of Fame, or with t = 'mgr' the managers': its own columns, its own ranking
/** @param {string} [highlight] @param {number} [n] @param {string} [t] @returns {string} */
G.hof.table = function (highlight, n, t) {
  var list = G.hof.read().filter(function (e) { return G.hof.type(e) === (t || 'pl'); }).sort(function (a, b) { return b.score - a.score; });
  if (!list.length) return '<p class="muted">Nessuna carriera ' + (t === 'mgr' ? 'da manager' : 'da calciatore') + ' conclusa: la prima entrerà qui.</p>';
  if (t === 'mgr') return '<table><tr><th>#</th><th>Manager</th><th class="num">Stagioni</th><th>Club</th><th class="num">Trofei</th><th class="num">Panchine</th><th class="num">Punti</th></tr>' +
    list.slice(0, n || 10).map(function (e, i) {
      var M = e.mgr || /** @type {HofMgr} */ ({ seasons: e.seasons, trophies: e.trophies }), cl = M.clubs || [];
      return '<tr class="' + (e.id === highlight ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + G.ui.flag(e.nat) + ' <b>' + e.name + '</b> <span class="muted small">' + e.from + '–' + e.to + '</span></td>' +
        '<td class="num">' + M.seasons + '</td><td class="small muted">' + (cl.length ? cl.slice(0, 4).join(', ') + (cl.length > 4 ? '…' : '') : '-') + '</td><td class="num">' + M.trophies + '</td>' +
        '<td class="num">' + (M.games || '-') + '</td><td class="num"><b>' + e.score + '</b> ' + e.icon + '</td></tr>';
    }).join('') + '</table>';
  return '<table><tr><th>#</th><th>Giocatore</th><th>Ruolo</th><th>Club</th><th class="num">Gol</th><th class="num">Trofei</th><th class="num">⚽ d’Oro</th><th class="num">Punti</th></tr>' +
    list.slice(0, n || 10).map(function (e, i) {
      return '<tr class="' + (e.id === highlight ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + G.ui.flag(e.nat) + ' <b>' + e.name + '</b>' + (e.goat ? ' <span title="GOAT">' + (e.goat > 1 ? '✦✦' : '✦') + '</span>' : '') + ' <span class="muted small">' + e.from + '–' + e.to + '</span></td>' +
        '<td>' + (e.pos || e.role) + '</td><td class="small muted">' + e.clubs.slice(0, 4).join(', ') + (e.clubs.length > 4 ? '…' : '') + '</td><td class="num">' + e.goals + '</td><td class="num">' + e.trophies + '</td>' +
        '<td class="num">' + e.bdo + '</td><td class="num"><b>' + e.score + '</b> ' + e.icon + '</td></tr>';
    }).join('') + '</table>';
};
