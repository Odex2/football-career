// @ts-check
// Cards of the main screen (M8 phase I): the national cup and the European cup of a club, for the playing
// career and the manager's bench alike. A click opens the Campionati or Europa tab on the right competition.

/** @type {Dict<string>} a round's name after 'eliminati' (any other round: 'al 2º turno') */
G.ui.ROUND_AT = { Sedicesimi: 'ai sedicesimi', Ottavi: 'agli ottavi', Quarti: 'ai quarti', Semifinali: 'in semifinale', Finale: 'in finale', Playoff: 'ai playoff' };

/** @param {string} rd @returns {string} */
G.ui.roundAt = function (rd) { return G.ui.ROUND_AT[rd] || 'al ' + rd; };

/** @param {State} st @param {string} act @param {string} v @returns {string|false} */
G.ui.homeAct = function (st, act, v) {
  if (act === 'gocup') { G.ui.sel.lg = v; G.ui.tab = 'campionati'; return 'view'; }
  if (act === 'goeu') { G.ui.sel.eu = v; G.ui.tab = 'europa'; return 'view'; }
  return false;
};

/** @param {string} cls @param {string} act @param {string} v @param {string} title @param {string} body @param {string} link @returns {string} */
G.ui.homeCard = function (cls, act, v, title, body, link) {
  return '<div class="card ' + cls + ' clickable" data-act="' + act + '" data-v="' + v + '"><h3>' + title + '</h3>' + body + '<div class="golink">' + link + ' ›</div></div>';
};

/** @param {State} st @returns {MatchRow[]} the season's matches of the user's club so far, the block in progress included */
G.ui.seasonRows = function (st) { return G.cal.rows(st); };

// One line per round played: round, opponent, home or away, result, and whether we went through
/** @param {{ rd: string, opp: ClubId, where: string, gf: number, ga: number, pen?: number, ok: boolean }[]} path @returns {string} */
G.ui.pathTable = function (path) {
  if (!path.length) return '';
  return '<table class="path">' + path.map(function (x) {
    return '<tr><td class="muted small">' + x.rd + '</td><td class="muted small">' + x.where + '</td><td>' + G.ui.club(x.opp, 16) + '</td>' +
      '<td class="num"><b>' + x.gf + '-' + x.ga + '</b>' + (x.pen ? ' <span class="muted small">ai rigori</span>' : '') + '</td><td class="' + (x.ok ? 'up' : 'down') + '">' + (x.ok ? '✓' : '✗') + '</td></tr>';
  }).join('') + '</table>';
};

// ---------- national cup ----------
/** @param {State} st @param {ClubId} clubId @returns {string} */
G.ui.cupCard = function (st, clubId) {
  var S = st.S, W = st.world, club = W.clubs[clubId], nat = club.nat, cup = S.cups[nat];
  if (!cup) return '';
  // with a calendar the round is drawn in advance: the tie of the club, still to play or played while the round goes on
  var tie = cup.ties && cup.winner === null ? cup.ties.filter(function (t) { return t[0] === clubId || t[1] === clubId; })[0] : null;
  var rows = G.ui.seasonRows(st).filter(function (r) { return r.ck === nat; }), won = cup.winner === clubId;
  var alive = won || (cup.winner === null && cup.alive.indexOf(clubId) >= 0 && !(tie && tie[2] !== undefined && tie[2] !== clubId));
  var path = rows.map(function (r, i) {
    return { rd: r.rd || '', opp: /** @type {ClubId} */ (r.opp), where: r.rd === 'Finale' ? 'N' : r.home ? 'C' : 'T', gf: r.gf, ga: r.ga, pen: r.pen, ok: i < rows.length - 1 || alive };
  });
  var last = rows[rows.length - 1], name = /** @param {ClubId} id */ function (id) { return W.clubs[id].name; }, score = last ? ' (' + last.gf + '-' + last.ga + (last.pen ? ', ai rigori' : '') + ')' : '', head;
  if (won) head = '🏆 <b>' + cup.name + ' vinta!</b>' + (last ? ' <span class="muted">Finale contro il ' + name(/** @type {ClubId} */ (last.opp)) + score + '</span>' : '');
  else if (alive && tie && tie[1] < 0) head = '<b>' + G.season.cupRound(cup) + '</b> · passi il turno senza giocare';
  else if (alive && tie && tie[2] === clubId) head = '<b>Turno superato</b> · il prossimo avversario si sorteggia a fine turno';
  else if (alive && tie) {
    var real = cup.ties.filter(function (t) { return t[1] >= 0; }).length, fin = cup.alive.length === 2;
    head = '<b>' + G.season.cupRound(cup) + '</b> contro il ' + name(tie[0] === clubId ? tie[1] : tie[0]) + ' · ' + (fin ? 'campo neutro' : tie[0] === clubId ? 'in casa' : 'in trasferta') +
      (st.S.cal ? ' · ' + G.cal.label(st.S.cal, G.cal.half(st.S.cal.cup[nat][cup.r], cup.ties.indexOf(tie), real, 1)) : '');
  } else if (alive && cup.alive.length === 2) head = '<b>Finale</b> contro il ' + name(cup.alive[0] === clubId ? cup.alive[1] : cup.alive[0]) + ' · campo neutro';
  else if (alive) head = '<b>' + G.season.cupRound(cup) + '</b> · avversario da sorteggiare';
  else if (last && last.rd === 'Finale') head = 'Finale persa contro il ' + name(/** @type {ClubId} */ (last.opp)) + score;
  else head = last ? 'Eliminati ' + G.ui.roundAt(last.rd || '') + ' dal ' + name(/** @type {ClubId} */ (last.opp)) + score : 'Fuori dalla coppa';
  return G.ui.homeCard('cupc' + (alive ? '' : ' out'), 'gocup', club.lg, '🏆 ' + cup.name, '<div class="cuphead' + (won ? ' win' : '') + '">' + head + '</div>' +
    (alive || won ? G.ui.pathTable(path) : '') + (cup.r === 0 ? '<p class="muted small">Il primo turno non è ancora stato giocato.</p>' : ''), 'Vedi il campionato');
};

// ---------- European cup ----------
/** @param {State} st @param {ClubId} clubId @returns {string} */
G.ui.euroCard = function (st, clubId) {
  var S = st.S, W = st.world, ks = S.eu ? G.europe.compsOf(st, clubId) : [];
  if (!ks.length) return '';
  var k = ks[0], comp = S.eu[k], name = /** @param {ClubId} id */ function (id) { return W.clubs[id].name; }, head = '', body = '', out = false;
  var log = comp.log.filter(function (l) { return l.a === clubId || l.b === clubId; }).map(function (l) {
    var me = l.a === clubId, gf = me ? l.ag : l.bg, ga = me ? l.bg : l.ag;
    return { rd: G.europe.STAGES[l.stage], opp: me ? l.b : l.a, where: l.stage === 'f' ? 'N' : 'A/R', gf: gf, ga: ga, pen: gf === ga ? 1 : 0, ok: l.w === clubId, f: l.stage === 'f' };
  });
  var pos = G.europe.sortTable(comp).indexOf(clubId) + 1;
  if (comp.stage === 'lp') {
    var r = comp.tab[clubId], zone = pos <= 8 ? ['ucl', 'zona ottavi'] : pos <= 24 ? ['up', 'zona playoff'] : ['down', 'fuori'];
    var pair = comp.md < comp.fx.length ? comp.fx[comp.md].filter(function (m) { return m[0] === clubId || m[1] === clubId; })[0] : null;
    head = r[0] ? '<b>' + pos + 'º</b> · ' + r[6] + (r[6] === 1 ? ' punto' : ' punti') + ' dopo ' + r[0] + (r[0] === 1 ? ' giornata' : ' giornate') + ' su ' + comp.fx.length + ' · <span class="zp ' + zone[0] + '">' + zone[1] + '</span>' :
      '<b>Fase campionato</b> · ' + comp.fx.length + ' giornate, si comincia';
    if (pair) body = '<div class="small">Prossima: ' + (pair[0] === clubId ? 'in casa' : 'in trasferta') + ' contro ' + G.ui.club(pair[0] === clubId ? pair[1] : pair[0], 16) + '</div>';
    body += '<p class="muted small">1º-8º agli ottavi · 9º-24º ai playoff · 25º-36º fuori.</p>';
  } else if (comp.winner === clubId) {
    var fin = log[log.length - 1];
    head = '🏆 <b>' + comp.name + ' vinta!</b>' + (fin ? ' <span class="muted">Finale contro il ' + name(fin.opp) + ' (' + fin.gf + '-' + fin.ga + (fin.pen ? ', ai rigori' : '') + ')</span>' : '');
    body = G.ui.pathTable(log);
  } else {
    var tie = comp.stage !== 'done' ? comp.ties.filter(function (t) { return t[0] === clubId || t[1] === clubId; })[0] : null, lost = log.filter(function (l) { return !l.ok; })[0];
    var leg = tie && comp.leg ? comp.leg[comp.ties.indexOf(tie)] : null, home = tie && tie[0] === clubId;
    if (tie && tie[2] === undefined) {
      head = '<b>' + G.europe.STAGES[comp.stage] + '</b> contro il ' + name(home ? tie[1] : tie[0]) + (comp.stage === 'f' ? ' · finale secca' : leg ? ' · andata ' + (home ? leg[0] + '-' + leg[1] : leg[1] + '-' + leg[0]) : ' · andata e ritorno');
      body = G.ui.pathTable(log);
    } else if ((tie && tie[2] === clubId) || (!tie && comp.stage === 'po' && pos <= 8)) {
      head = tie ? '<b>Turno superato</b> · il sorteggio a fine turno' : '<b>Ottavi</b> · avversario dal playoff';
      body = G.ui.pathTable(log);
    } else {
      out = true;
      var sc = lost ? ' (' + lost.gf + '-' + lost.ga + (lost.f ? '' : ' tra andata e ritorno') + (lost.pen ? ', ai rigori' : '') + ')' : '';
      head = !lost ? 'Eliminati nella fase campionato (' + pos + 'º)' : lost.f ? 'Finale persa contro il ' + name(lost.opp) + sc : 'Eliminati ' + G.ui.roundAt(lost.rd) + ' dal ' + name(lost.opp) + sc;
    }
  }
  if (comp.stage !== 'lp' && !out) body = '<div class="muted small">Fase campionato chiusa al ' + pos + 'º posto</div>' + body;
  return G.ui.homeCard('euc' + (out ? ' out' : ''), 'goeu', k, '🌍 ' + comp.name, '<div class="cuphead' + (comp.winner === clubId ? ' win' : '') + '">' + head + '</div>' + body, 'Vedi la coppa');
};
