// @ts-check
// UI tab: national team (status, ct, qualifiers, live tournament, roll of honour, ranking).

/** @param {NationCode} id @returns {string} */
G.ui.nat = function (id) { return G.national.name(id); };

/** @param {State} st @param {Tournament} T @returns {string} */
G.ui.tourCard = function (st, T) {
  var p = st.player, me = p.nat;
  var groups = T.groups.map(function (grp, i) {
    var rows = G.tour.groupTable(T, grp).map(function (id) {
      var r = T.tab[id];
      return '<tr class="' + (id === me ? 'me' : '') + '"><td>' + G.ui.nat(id) + '</td><td class="num">' + r[0] + '</td><td class="num">' + (r[4] - r[5]) + '</td><td class="num"><b>' + r[6] + '</b></td></tr>';
    }).join('');
    return '<div><div class="group">Girone ' + String.fromCharCode(65 + i) + '</div><table>' + rows + '</table></div>';
  }).join('');
  var ko = '', last = '';
  T.log.forEach(function (l) {
    if (l.stage !== last) { ko += '<div class="group">' + l.stage + '</div>'; last = l.stage; }
    ko += '<div class="tie' + (l.a === me || l.b === me ? ' mine' : '') + '">' + G.ui.nat(l.a) + ' <b>' + l.ga + '-' + l.gb + '</b>' + (l.pens ? ' <span class="muted small">(rig.)</span>' : '') + ' ' + G.ui.nat(l.b) + '</div>';
  });
  if (T.stage === 'ko') ko += '<div class="group">Prossimo turno: ' + G.tour.ROUND[T.ko.length * 2] + '</div>' +
    T.ko.map(function (t) { return '<div class="tie' + (t.indexOf(me) >= 0 ? ' mine' : '') + '">' + G.ui.nat(t[0]) + ' vs ' + G.ui.nat(t[1]) + '</div>'; }).join('');
  var sc = Object.keys(T.sc).sort(function (a, b) { return T.sc[b] - T.sc[a]; }).slice(0, 8).map(function (id) {
    var n = id === 'me' ? p.name : st.world.players[/** @type {any} */ (id)].n;
    return '<tr class="' + (id === 'me' ? 'me' : '') + '"><td>' + G.ui.flag(T.scN[id]) + ' ' + n + '</td><td class="num"><b>' + T.sc[id] + '</b></td></tr>';
  }).join('');
  var status = T.winner ? '🏆 Campione: ' + G.ui.nat(T.winner) : T.stage === 'g' ? 'Fase a gironi, giornata ' + T.md + '/3' : 'Eliminazione diretta';
  return G.ui.card('🌍 ' + T.n + ' ' + T.year + ' · ' + status,
    '<div class="grid three">' + groups + '</div>', 'span3') +
    G.ui.card('Eliminazione diretta', ko || '<p class="muted">Si gioca dopo i gironi.</p>') +
    G.ui.card('Capocannonieri', sc ? '<table>' + sc + '</table>' : '<p class="muted">Ancora nessun gol.</p>');
};

/** @param {State} st @returns {string} */
G.ui.nationalTab = function (st) {
  var p = st.player, n = p.nt, N = G.CFG.NT, S = st.S, co = G.national.coach(st), ch = G.national.chances(st);
  var rank = G.NT_IDS.map(function (id) { return /** @type {[NationCode, number]} */ ([id, G.national.str(st, id)]); }).sort(function (a, b) { return b[1] - a[1]; });
  var pos = rank.findIndex(function (x) { return x[0] === p.nat; }) + 1, rel = co ? p.rel[co.i] || 0 : 0;
  var call = S.ntCall ? (S.ntCall.called ? '✅ Convocato nell’ultima finestra' : '❌ Non convocato nell’ultima finestra') : (n.caps ? 'Prossima convocazione' : 'Possibile prima convocazione') + ': finestra d’autunno';
  var me = '<div class="kpis">' + G.ui.kpi(n.caps, 'Presenze') + G.ui.kpi(n.goals, 'Gol') + G.ui.kpi(n.assists, 'Assist') +
    G.ui.kpi(n.rN ? (n.rSum / n.rN).toFixed(2) : '-', 'Voto medio') + '</div>' +
    (n.cap ? '<div class="chip cap">©️ Capitano della nazionale dal ' + n.cap + '</div>' : '') + '<div>' + call + '</div>' +
    '<div class="small">Probabilità di convocazione <b>' + Math.round(ch.call * 100) + '%</b> · da titolare <b>' + Math.round(ch.start * 100) + '%</b></div>' +
    '<p class="muted small">Il ct chiama ' + N.QUOTA[p.role] + ' giocatori nel tuo ruolo: oggi l’ultimo convocato ha overall ' + ch.cut + '. Contano overall, forma, fama e il rapporto con il ct.</p>' +
    (co ? '<div>ct: <b>' + G.ui.flag(co.nt) + ' ' + co.n + '</b></div>' + G.ui.meter(rel + 100, 200, rel >= 0 ? 'var(--good)' : 'var(--bad)') + '<div class="muted small">Rapporto ' + rel + '</div>' : '');
  var nx = G.national.nextTour(st), Tn = S.tours && S.tours[nx.key], D = N.TOURS[nx.key], q = st.ntq;
  var next = '<div><b>' + D.n + ' ' + nx.year + '</b></div>' +
    (Tn ? (Tn.teams.indexOf(p.nat) >= 0 ? '<div>✅ Qualificata</div>' : '<div>❌ Non qualificata</div>') :
      (q && q.key === nx.key && q.year === nx.year ? '<div>Qualificazioni: ' + q.n + ' partite, ' + q.pts + ' punti (' + (q.pts / q.n).toFixed(2) + ' a partita)</div>' : '<div class="muted">Le qualificazioni si giocano nelle finestre d’autunno e primavera.</div>') +
      '<p class="muted small">Le qualificate si decidono a gennaio della stagione del torneo; il torneo si gioca nel blocco Finale.</p>');
  var tours = n.tours.length ? '<table>' + n.tours.slice().reverse().map(function (t) {
    return '<tr><td>' + t.n + ' ' + t.year + '</td><td>' + t.res + '</td><td class="num">' + t.apps + ' pres.</td><td class="num">' + t.g + ' gol</td></tr>';
  }).join('') + '</table>' : '<p class="muted">Nessun torneo giocato.</p>';
  var roll = st.ntRoll.length ? '<table>' + st.ntRoll.map(function (r) {
    return '<tr><td>' + r.n + ' ' + r.year + '</td><td>🏆 ' + G.ui.nat(r.winner) + '</td><td class="muted small">finale con ' + G.ui.nat(r.runner) + '</td>' +
      '<td class="small">' + (r.scorer ? '⚽ ' + r.scorer.n + ' (' + r.scorer.g + ')' : '') + '</td><td class="small">' + (r.mine ? G.ui.flag(p.nat) + ' ' + r.mine : '') + '</td></tr>';
  }).join('') + '</table>' : '<p class="muted">Il primo Europeo si gioca nell’estate ' + (st.year + (st.year % 2 ? 1 : 2)) + '.</p>';
  var top = '<table>' + rank.slice(0, 20).map(function (x, i) {
    return '<tr class="' + (x[0] === p.nat ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + G.ui.nat(x[0]) + '</td><td class="num">' + x[1].toFixed(1) + '</td></tr>';
  }).join('') + (pos > 20 ? '<tr class="me"><td>' + pos + '</td><td>' + G.ui.nat(p.nat) + '</td><td class="num">' + rank[pos - 1][1].toFixed(1) + '</td></tr>' : '') + '</table>';
  var live = '';
  if (S.tours) {
    var keys = Object.keys(S.tours), mine = keys.filter(function (k) { return S.tours[k].teams.indexOf(p.nat) >= 0; })[0];
    live = G.ui.tourCard(st, S.tours[mine || keys[0]]);
  }
  return '<div class="grid two">' + G.ui.card(G.ui.nat(p.nat) + ' · ' + pos + 'ª nel ranking', me) +
    '<div class="stack">' + G.ui.card('Prossimo torneo', next) + G.ui.card('I tuoi tornei', tours) + '</div>' +
    live + G.ui.card('Albo d’oro', roll) + G.ui.card('Ranking nazionali', top) + '</div>';
};
