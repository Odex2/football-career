// @ts-check
// The calendar on screen (M8 phase J): the Calendario tab, the "Prossime partite" card of the main screen and of
// the manager's bench, and the ⏭ button that plays up to the next important match.

/** @type {Dict<string>} */
G.ui.CAL_ICON = { lg: '⚽', UCL: '⭐', UEL: '🟠', UECL: '🟢' };
/** @type {string[][]} the filters of the tab */
G.ui.CAL_F = [['all', 'Tutte'], ['lg', 'Campionato'], ['cup', 'Coppe'], ['eu', 'Europa'], ['nt', 'Nazionale']];

/** @param {State} st @param {string} act @param {string} v @returns {string|boolean} */
G.ui.calAct = function (st, act, v) {
  if (act === 'calf') { G.ui.sel.calf = v; return 'view'; }
  if (act === 'skip') { if (!st.mgr || G.mgr.active(st)) G.game.skip(st); return true; }
  return false;
};

/** @param {State} st @param {CalEntry} e @returns {string} */
G.ui.calIcon = function (st, e) { return e.ck === 'nt' || e.ck === 'brk' ? G.ui.flag(st.player.nat) : G.ui.CAL_ICON[e.ck] || '🏆'; };

/** @param {CalEntry} e @returns {string} the filter an entry belongs to */
G.ui.calKind = function (e) { return e.ck === 'lg' ? 'lg' : e.ck === 'nt' || e.ck === 'brk' ? 'nt' : G.CFG.UEFA[e.ck] ? 'eu' : 'cup'; };

/** @param {CalEntry} e @returns {string} 'Serie A · 8ª giornata', 'Coppa Italia · Ottavi', 'Champions League · Ottavi · andata' */
G.ui.calComp = function (e) {
  return e.name + (e.ck === 'lg' && e.md !== undefined ? ' · ' + (e.md + 1) + 'ª giornata' : e.rd ? ' · ' + e.rd : '') + (e.leg ? (e.leg === 1 ? ' · andata' : ' · ritorno') : '');
};

/** @param {State} st @param {CalEntry} e @returns {string} the opponent, or the round still to draw */
G.ui.calOpp = function (st, e) {
  if (e.ck === 'brk') return '<b>' + e.name + '</b>';
  if (e.opp === null) return '<span class="muted">avversario da sorteggiare</span>';
  return e.ck === 'nt' ? G.ui.flag(/** @type {NationCode} */ (e.opp)) + ' ' + G.ui.nat(/** @type {NationCode} */ (e.opp)) : G.ui.club(/** @type {ClubId} */ (e.opp), 18);
};

/** @param {CalEntry} e @returns {string} C, T, or N for a final on neutral ground */
G.ui.calWhere = function (e) { return e.ck === 'brk' || e.home === null ? '' : e.rd === 'Finale' ? 'N' : e.home ? 'C' : 'T'; };

// The labels of a match: why it counts (the matches to play) or what it was (played), and a postponement
/** @param {State} st @param {CalEntry} e @param {number} now @returns {string} */
G.ui.calTags = function (st, e, now) {
  var id = G.season.myClub(st), W = st.world, t = [];
  if (e.d > now && e.opp !== null && e.ck !== 'brk' && e.ck !== 'nt') { var imp = G.season.importance(st, id, e); if (imp) t.push(imp.tag + ' ' + imp.why); }
  else if (e.res && e.ck !== 'nt') {
    var opp = typeof e.opp === 'number' ? W.clubs[e.opp] : null;
    if (e.rd === 'Finale') t.push('🏆 finale');
    else if (opp && W.clubs[id] && W.clubs[id].riv.indexOf(opp.id) >= 0) t.push('🔥 derby');
    else if (opp && opp.rep >= G.CFG2.CAL.BIG_REP) t.push('⚔️ big match');
  }
  if (e.moved !== undefined) t.push('⟳ ' + (e.moved < e.d ? 'rinviata dal ' : 'anticipata dal ') + G.cal.label(G.sure(G.sure(st.S).cal), e.moved).slice(4));
  return t.length ? '<span class="ct">' + t.join(' · ') + '</span>' : '';
};

/** @param {State} st @param {CalEntry} e @param {number} now @returns {string} one line of the calendar */
G.ui.calRow = function (st, e, now) {
  var cal = G.sure(G.sure(st.S).cal), r = e.res, cls = r ? (r[0] > r[1] ? 'r-good' : r[0] < r[1] ? 'r-bad' : 'r-mid') : '';
  var res = e.ck === 'brk' ? '' : r ? '<b>' + r[0] + '-' + r[1] + '</b>' + (e.row && e.row.pen ? '<small>rigori</small>' : '') : '<span class="muted small">da giocare</span>';
  var line = '<span class="cd">' + G.cal.label(cal, e.d) + '</span><span class="ci">' + G.ui.calIcon(st, e) + '</span><span class="ch muted">' + G.ui.calWhere(e) + '</span>' +
    '<span class="co">' + G.ui.calOpp(st, e) + (e.ck === 'brk' ? '' : '<small class="muted">' + G.ui.calComp(e) + '</small>') + G.ui.calTags(st, e, now) + '</span><span class="cr ' + cls + '">' + res + '</span>';
  if (!e.row) return '<div class="calr' + (e.ck === 'brk' ? ' brk' : '') + '">' + line + '</div>';
  var x = e.row, more = x.mgr ? (x.sc && x.sc.length ? '⚽ ' + x.sc.join(', ') : 'Nessun gol') + (x.form ? ' · ' + x.form + ', tattica ' + (G.mgr.TACTIC[x.tac || ''] || '').toLowerCase() : '') :
    x.mins ? x.mins + '’ in campo · voto <b class="' + G.ui.rcls(x.r) + '">' + x.r + '</b>' + (x.g ? ' · ⚽ ' + x.g : '') + (x.a ? ' · 🅰️ ' + x.a : '') : 'Non sei sceso in campo';
  return '<details class="calp"><summary class="calr">' + line + '</summary><div class="calx small">' + more + '</div></details>';
};

// ---------- the tab ----------
/** @param {State} st @returns {string} */
G.ui.calendarTab = function (st) {
  var S = G.sure(st.S), cal = G.sure(S.cal), f = G.ui.sel.calf || 'all', nt = !st.mgr && !!G.NT[st.player.nat];
  if (!cal) return '<div class="grid">' + G.ui.card('📅 Calendario', '<p class="muted">Questa stagione è cominciata con una versione precedente del gioco, senza le date delle partite. Il calendario parte dalla prossima stagione.</p>', 'span3') + '</div>';
  var now = G.cal.now(st), cur = G.cal.date(cal, Math.max(0, now)), curM = cur.getUTCFullYear() * 12 + cur.getUTCMonth(), today = false;
  var list = G.cal.entries(st).filter(function (e) { return f === 'all' || G.ui.calKind(e) === f; }), /** @type {Dict<string[]>} */ months = {}, /** @type {number[]} */ keys = [];
  list.forEach(function (e) {
    var t = G.cal.date(cal, e.d), k = t.getUTCFullYear() * 12 + t.getUTCMonth();
    if (!months[k]) { months[k] = []; keys.push(k); }
    if (!today && e.d > now) { today = true; months[k].push('<div class="caltoday">OGGI · ' + G.cal.label(cal, Math.max(0, now)) + '</div>'); }
    months[k].push(G.ui.calRow(st, e, now));
  });
  var body = keys.map(function (k) {
    var n = months[k].filter(function (h) { return h.indexOf('caltoday') < 0 && h.indexOf(' brk') < 0; }).length, name = G.cal.MONL[k % 12];
    return '<details class="calm"' + (k === curM ? ' open' : '') + '><summary><b>' + name.charAt(0).toUpperCase() + name.slice(1) + '</b> <span class="muted small">' + n + (n === 1 ? ' partita' : ' partite') + '</span></summary>' + months[k].join('') + '</details>';
  }).join('');
  var tours = S.tours ? Object.keys(S.tours).map(function (k) { return G.sure(S.tours)[k].n + ' ' + G.sure(S.tours)[k].year; }).join(', ') : '';
  var summer = '<div class="calm last"><b>Giugno–luglio</b> <span class="muted small">' + (tours ? '🌍 ' + tours + ': il torneo ha la sua schermata' + (nt ? ' · <span class="golink clickable" data-act="tab" data-v="nazionale">Nazionale ›</span>' : '') : 'vacanze e mercato estivo') + '</span></div>';
  var bar = '<div class="opts calf">' + G.ui.CAL_F.filter(function (x) { return x[0] !== 'nt' || nt; }).map(function (x) { return '<button data-act="calf" data-v="' + x[0] + '" class="' + (f === x[0] ? 'on' : 'ghost') + '">' + x[1] + '</button>'; }).join('') + '</div>';
  return '<div class="grid">' + G.ui.card('📅 Calendario ' + G.season.label(S.year), bar +
    '<p class="muted small">⚽ campionato · 🏆 coppa · ⭐ Champions League · 🟠 Europa League · 🟢 Conference League · 🔥 derby · ⚔️ big match · 🏁 decisiva · ⟳ partita spostata. Tocca una partita giocata per i dettagli.</p>' +
    (body || '<p class="muted">Nessuna partita.</p>') + summer, 'span3 calcard') + '</div>';
};

// ---------- the card of the main screen and of the bench (J6) ----------
/** @param {State} st @returns {string} */
G.ui.nextCard = function (st) {
  var S = st.S;
  if (!S || !S.cal || S.block > 4) return '';
  var cal = S.cal, now = G.cal.now(st), list = G.cal.entries(st).filter(function (e) { return e.d > now && !e.res; }).slice(0, G.CFG2.CAL.NEXT);
  var rows = list.map(function (e) {
    var opp = e.ck === 'brk' ? '<b>' + e.name + '</b>' : e.opp === null ? e.name + ' · ' + e.rd + ' · <span class="muted">avversario da sorteggiare</span>' : G.ui.calOpp(st, e);
    var imp = e.opp !== null && e.ck !== 'brk' ? G.season.importance(st, G.season.myClub(st), e) : null;
    return '<div class="nxr"><span class="cd">' + G.cal.label(cal, e.d) + '</span><span class="ci">' + G.ui.calIcon(st, e) + '</span><span class="ch muted">' + (e.opp === null ? '' : G.ui.calWhere(e)) + '</span>' +
      '<span class="co">' + opp + (imp ? '<small class="ct">' + imp.tag + ' ' + imp.why + '</small>' : '') + '</span></div>';
  }).join('');
  return G.ui.homeCard('nextc', 'tab', 'calendario', '📅 Prossime partite', rows || '<p class="muted small">Nessuna partita da giocare in questa stagione.</p>', 'Tutto il calendario');
};

// ⏭: what and when (J8)
/** @param {State} st @returns {string} */
G.ui.skipBtn = function (st) {
  var S = st.S;
  if (!S || !S.cal || S.block > 4) return '';
  var x = G.cal.important(st);
  if (!x) return '<button class="ghost skip" disabled>⏭ Nessuna partita importante fino a fine stagione</button>';
  var when = G.cal.label(S.cal, x.e.d), what = '⏭ Prossima importante: ' + x.imp.why;
  if (!x.n) return '<button class="ghost skip" disabled>' + what + ' · è la prossima (' + when + ')</button>';
  return '<button class="ghost skip" data-act="skip">' + what + ' · tra ' + x.n + (x.n === 1 ? ' partita' : ' partite') + ' (' + when + ')</button>';
};
