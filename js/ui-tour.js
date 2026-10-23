// @ts-check
// UI: full-screen tournament screen, shown after the club season (block 5). One look for the World Cup, one for continental cups.

/** @type {Dict<string>} */
G.ui.TOUR_ICON = { WC: '🌎', EURO: '🇪🇺', COPA: '🌎', ASIA: '🌏', AFCON: '🌍' };

/** @param {Tournament} T @returns {string} */
G.ui.tourPhase = function (T) {
  if (T.stage === 'done') return '🏆 ' + G.ui.nat(T.winner) + ' campione';
  if (T.stage === 'g') return 'Fase a gironi · giornata ' + Math.min(3, T.md + 1) + ' di 3';
  return G.tour.ROUND[T.ko.length * 2];
};

// The player's side of the tournament: call-up, next match, results so far
/** @param {State} st @param {Tournament} T @returns {string} */
G.ui.tourMe = function (st, T) {
  var p = st.player, me = p.nat, S = st.S, call = S.ntCall, out = T.out[me], opp = G.tour.nextOpp(T, me);
  if (T.teams.indexOf(me) < 0) return '<div class="ts-me"><div class="ts-flag">' + G.ui.flag(me) + '</div><div><h2>' + G.nationInfo(me).name + ' non c’è</h2>' +
    '<p class="muted">La tua nazionale non si è qualificata: segui il torneo da spettatore.</p></div></div>';
  var name = T.n + ' ' + T.year, rows = (S.blockRows || []).filter(function (r) { return r.nt && r.comp === name; });
  var called = call && call.called;
  var state = out === 'Campione' ? '<span class="ts-win">🏆 Campioni!</span>' : out ? '<span class="ts-out">Eliminati: ' + out.toLowerCase() + '</span>' :
    opp ? 'Prossima partita: <b>' + G.ui.nat(opp) + '</b> · ' + G.ui.tourPhase(T) : '';
  var mine = rows.map(function (r) {
    var res = r.gf > r.ga ? 'V' : r.gf < r.ga ? 'S' : 'P';
    return '<div class="ts-row"><span class="ts-res ' + res + '">' + res + '</span> ' + G.ui.nat(/** @type {NationCode} */ (r.opp)) + ' <b>' + r.gf + '-' + r.ga + '</b> ' +
      (r.mins ? '<span class="' + G.ui.rcls(r.r) + '">' + r.r + '</span> ' + (r.g ? '⚽'.repeat(Math.min(r.g, 5)) : '') + (r.a ? '🅰️'.repeat(Math.min(r.a, 4)) : '') + ' <span class="muted small">' + r.mins + '’</span>' : '<span class="muted small">in panchina</span>') + '</div>';
  }).join('');
  var avg = rows.filter(function (r) { return r.mins; }), av = avg.length ? avg.reduce(function (s, r) { return s + r.r; }, 0) / avg.length : 0;
  return '<div class="ts-me"><div class="ts-flag">' + G.ui.flag(me) + '</div><div class="ts-me-in">' +
    '<div class="muted">' + (called ? (p.nt.cap ? '©️ Capitano, convocato dal ct' : 'Convocato dal ct') : 'Non convocato: segui la tua nazionale da casa') + '</div><h2>' + state + '</h2>' +
    (called ? '<div class="ts-kpis">' + G.ui.kpi(T.my.apps, 'Presenze') + G.ui.kpi(T.my.g, 'Gol') + G.ui.kpi(T.my.a, 'Assist') + G.ui.kpi(av ? av.toFixed(2) : '-', 'Voto medio') + '</div>' : '') +
    (mine ? '<div class="ts-rows">' + mine + '</div>' : '') + '</div></div>';
};

/** @param {State} st @param {Tournament} T @returns {string} */
G.ui.tourGroups = function (st, T) {
  var me = st.player.nat, idx = T.groups.map(function (g, i) { return i; });
  idx.sort(function (a, b) { return /** @type {any} */ (T.groups[b].indexOf(me) >= 0) - /** @type {any} */ (T.groups[a].indexOf(me) >= 0); });
  return '<div class="ts-groups">' + idx.map(function (i) {
    var grp = T.groups[i], mine = grp.indexOf(me) >= 0;
    var rows = G.tour.groupTable(T, grp).map(function (id, pos) {
      var r = T.tab[id], cls = (id === me ? 'me ' : '') + (pos < 2 ? 'q' : '');
      return '<tr class="' + cls + '"><td>' + G.ui.nat(id) + '</td><td class="num">' + r[0] + '</td><td class="num">' + (r[4] - r[5]) + '</td><td class="num"><b>' + r[6] + '</b></td></tr>';
    }).join('');
    return '<div class="ts-group' + (mine ? ' mine' : '') + '"><div class="ts-gname">Girone ' + String.fromCharCode(65 + i) + '</div><table>' + rows + '</table></div>';
  }).join('') + '</div>';
};

// Bracket: played rounds from the log, the current round from T.ko, later rounds as empty slots
/** @param {State} st @param {Tournament} T @returns {string} */
G.ui.tourBracket = function (st, T) {
  var me = st.player.nat, cols = '', n = G.tour.koSize(T);
  var tie = /** @param {NationCode} a @param {NationCode} b @param {number} [ga] @param {number} [gb] @param {NationCode} [w] @param {any} [pens] */ function (a, b, ga, gb, w, pens) {
    var side = /** @param {NationCode} id @param {number} [g] */ function (id, g) { return '<div class="' + (w === id ? 'w ' : '') + (id === me ? 'me' : '') + '">' + (id ? G.ui.nat(id) : '<span class="muted">—</span>') + '<b>' + (g === undefined ? '' : g) + '</b></div>'; };
    return '<div class="ts-tie">' + side(a, ga) + side(b, gb) + (pens ? '<i>rigori</i>' : '') + '</div>';
  };
  for (; n >= 2; n /= 2) {
    var name = G.tour.ROUND[n], played = T.log.filter(function (l) { return l.stage === name; }), body = '';
    if (played.length) body = played.map(function (l) { return tie(l.a, l.b, l.ga, l.gb, l.w, l.pens); }).join('');
    else if (T.stage === 'ko' && T.ko.length * 2 === n) body = T.ko.map(function (t) { return tie(t[0], t[1]); }).join('');
    else for (var i = 0; i < n / 2; i++) body += tie(null, null);
    cols += '<div class="ts-col"><div class="ts-gname">' + name + '</div><div class="ts-ties">' + body + '</div></div>';
  }
  return '<div class="ts-bracket">' + cols + '</div>';
};

/** @param {State} st @param {Tournament} T @returns {string} */
G.ui.tourScorers = function (st, T) {
  var p = st.player, ids = Object.keys(T.sc).sort(function (a, b) { return T.sc[b] - T.sc[a]; }).slice(0, 8);
  if (!ids.length) return '<p class="muted">Ancora nessun gol.</p>';
  return '<table>' + ids.map(function (id, i) {
    var n = id === 'me' ? p.name : st.world.players[/** @type {any} */ (id)].n;
    return '<tr class="' + (id === 'me' ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + G.ui.flag(T.scN[id]) + ' ' + n + '</td><td class="num"><b>' + T.sc[id] + '</b></td></tr>';
  }).join('') + '</table>';
};

/** @param {State} st @returns {string} */
G.ui.tourScreen = function (st) {
  var S = st.S, p = st.player, keys = Object.keys(S.tours), k = keys.indexOf(G.ui.sel.tour) >= 0 ? G.ui.sel.tour : G.tour.mine(st), T = S.tours[k];
  var me = p.nat, mineK = G.tour.mine(st), MT = S.tours[mineK], called = S.ntCall && S.ntCall.called;
  var alive = MT.teams.indexOf(me) >= 0 && called && !MT.out[me];
  var allDone = keys.every(function (x) { return S.tours[x].stage === 'done'; });
  var tabs = keys.length > 1 ? '<div class="ts-tabs">' + keys.map(function (x) {
    return '<button class="' + (x === k ? 'on' : 'ghost') + '" data-act="tsel" data-v="' + x + '">' + G.ui.TOUR_ICON[x] + ' ' + S.tours[x].n + (x === mineK && MT.teams.indexOf(me) >= 0 ? ' ' + G.ui.flag(me) : '') + '</button>';
  }).join('') + '</div>' : '';
  var btns = allDone ? '<button class="big" data-act="next">Chiudi la stagione ▶</button>' :
    (alive ? '<button class="big" data-act="match">⚽ Prossima partita</button>' : '') +
    '<button class="' + (alive ? 'ghost' : 'big') + '" data-act="tday">▶ Turno successivo</button><button class="ghost" data-act="next">⏩ Simula il torneo</button>';
  return '<div class="ts ' + (k === 'WC' ? 'wc' : 'cont ' + k.toLowerCase()) + '"><div class="ts-in">' +
    '<div class="ts-head"><div class="ts-trophy">' + (k === 'WC' ? '🏆' : G.ui.TOUR_ICON[k]) + '</div><div><div class="ts-kicker">' + (k === 'WC' ? 'FIFA World Cup · ' + T.teams.length + ' nazionali' : 'Torneo continentale · ' + T.teams.length + ' nazionali') + '</div>' +
    '<h1>' + T.n + ' ' + T.year + '</h1><div class="ts-phase">' + G.ui.tourPhase(T) + '</div></div></div>' + tabs +
    G.ui.tourMe(st, T) + '<div class="ts-actions">' + btns + '</div>' +
    '<div class="ts-sec"><h4>Eliminazione diretta</h4>' + G.ui.tourBracket(st, T) + '</div>' +
    '<div class="ts-cols"><div class="ts-sec"><h4>Gironi</h4>' + G.ui.tourGroups(st, T) + '</div>' +
    '<div class="ts-sec"><h4>Capocannonieri</h4>' + G.ui.tourScorers(st, T) + '</div></div></div></div>';
};
