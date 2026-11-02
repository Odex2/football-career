// @ts-check
// UI tabs: squad, leagues, Europe, awards.

/** @param {string} name @param {(string|number)[][]} opts @param {string|number} cur @returns {string} */
G.ui.select = function (name, opts, cur) {
  return '<select data-sel="' + name + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>';
};

/** @param {State} st @param {AwardEntry[]} list @param {'g'|'a'|'cs'|'avg'} key @param {string} [label] @param {(v: number) => string} [fmt] @returns {string} */
G.ui.leaderTable = function (st, list, key, label, fmt) {
  if (!list.length) return '<p class="muted">Nessun dato.</p>';
  return '<table>' + list.map(function (e, i) {
    return '<tr class="' + (e.me ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + G.ui.flag(e.nt) + ' ' + e.n + '</td><td class="muted small">' + st.world.clubs[e.club].name + '</td>' +
      '<td class="num"><b>' + (fmt ? fmt(e[key]) : e[key]) + '</b></td></tr>';
  }).join('') + '</table>';
};

// ---------- squad ----------
/** @param {State} st @returns {string} */
G.ui.squadTab = function (st) {
  var W = st.world, p = st.player, club = W.clubs[p.clubId], co = G.coaches.of(W, club), S = G.sure(st.S);
  var /** @type {Dict<number>} */ xi = {};
  G.sure(club.xi).forEach(function (id) { xi[id] = 1; });
  var rows = '';
  G.ROLE_KEYS.forEach(function (r) {
    var list = G.squads.roleList(W, club, r).map(function (id) { return W.players[id]; });
    rows += '<tr class="grouprow"><td colspan="9">' + G.ROLES[r].name + '</td></tr>';
    if (r === p.role && !st.mgr) rows += '<tr class="me"><td>' + G.ui.flag(p.nat) + ' ' + p.name + ' (tu)</td><td class="num">' + p.age + '</td><td class="num"><b>' + p.ovr + '</b></td>' +
      '<td class="num">' + S.ps.apps + '</td><td class="num">' + S.ps.goals + '</td><td class="num">' + S.ps.assists + '</td><td class="num">' + (S.ps.rN ? (S.ps.rSum / S.ps.rN).toFixed(2) : '-') + '</td><td></td><td class="muted small">' + G.sure(p.contract).role + '</td></tr>';
    list.forEach(function (pl) {
      rows += '<tr><td>' + G.ui.flag(pl.nt) + ' ' + pl.n + (xi[pl.i] ? ' <span class="chip">XI</span>' : '') + '</td><td class="num">' + pl.a + '</td><td class="num"><b>' + Math.round(pl.o) + '</b></td>' +
        '<td class="num">' + pl.s[5] + '</td><td class="num">' + pl.s[6] + '</td><td class="num">' + pl.s[7] + '</td><td class="num">' + (pl.s[5] ? (pl.s[9] / pl.s[5]).toFixed(2) : '-') + '</td>' +
        '<td class="num muted">' + G.squads.value(pl.o, pl.a, pl.p) + ' M€</td><td class="muted small">' + pl.y + ' anni</td></tr>';
    });
  });
  var hon = Object.keys(club.hon).map(function (k) { return '<span class="chip">🏆 ' + k + ' ×' + club.hon[k] + '</span>'; }).join('') || '<span class="muted">—</span>';
  var info = '<div class="row">' + G.crest(club, 64) + '<div><h2 style="margin:0">' + club.name + '</h2><div class="muted">' + G.leagueByKey(club.lg).name + ' · forza ' + club.str.toFixed(1) + ' · reputazione ' + club.rep + '</div>' +
    '<div class="muted">Budget mercato ' + Math.round(club.bud) + ' M€ · ricavi ' + club.rev + ' M€ · monte ingaggi ' + G.world.wageBill(W, club).toFixed(1) + ' M€</div>' +
    '<div class="muted">Rivali: ' + (club.riv.map(function (id) { return W.clubs[id].name; }).join(', ') || '—') + '</div></div></div>' +
    '<div style="margin-top:8px">' + hon + '</div>';
  var coach = co ? '<div><b>' + G.ui.flag(co.nt) + ' ' + co.n + '</b> · ' + co.a + ' anni · reputazione ' + co.rep + '</div><div class="muted">' + G.CFG.COACH_STYLES[co.sty] + '</div>' +
    '<div style="margin-top:6px">Rapporto con te: <b>' + (p.rel[co.i] || 0) + '</b></div>' + G.ui.meter((p.rel[co.i] || 0) + 100, 200, (p.rel[co.i] || 0) >= 0 ? 'var(--good)' : 'var(--bad)') : '<p class="muted">Panchina vacante.</p>';
  var fans = p.fans[club.id] || 0;
  return G.ui.squadPitch(st) + '<div class="grid two">' + G.ui.card('Club', info) + '<div class="stack">' + G.ui.card('Allenatore', coach) +
    G.ui.card('Tifosi', 'Affetto dei tifosi: <b>' + Math.round(fans) + '</b>/100' + G.ui.meter(fans, 100, 'var(--accent2)') +
      '<p class="muted small">Sopra ' + G.CFG.BANDIERA + ' con almeno ' + G.CFG.BANDIERA_SEASONS + ' stagioni diventi bandiera.</p>') + '</div>' +
    G.ui.card('Rosa', '<div class="scroll"><table><tr><th>Giocatore</th><th class="num">Età</th><th class="num">OVR</th><th class="num">Pres</th><th class="num">Gol</th><th class="num">Ass</th><th class="num">Voto</th><th class="num">Valore</th><th>Contratto</th></tr>' + rows + '</table></div>', 'span3') + '</div>';
};

// ---------- leagues ----------
/** @param {State} st @returns {string} */
G.ui.leagueTab = function (st) {
  var key = G.ui.sel.lg || st.world.clubs[st.player.clubId].lg;
  var opts = G.LEAGUES.map(function (L) { return [L.key, G.NATIONS[L.nat].flag + ' ' + L.name]; });
  var b = G.awards.leagueBoards(st, key, 10), L = G.leagueByKey(key), cup = G.sure(st.S).cups[L.nat];
  var cupTxt = cup.winner !== null ? '🏆 ' + G.ui.club(cup.winner, 16) : cup.alive.length + ' squadre ancora in corsa' + (cup.alive.indexOf(st.player.clubId) >= 0 ? ' (anche la tua)' : '');
  return '<div class="row" style="margin-bottom:10px">' + G.ui.select('lg', opts, key) + '<span class="muted">' + cup.name + ': ' + cupTxt + '</span></div>' +
    '<div class="grid two">' + G.ui.card(L.name, '<div class="scroll">' + G.ui.leagueTable(st, key) + '</div>' +
      '<p class="muted small">Verde scuro: Champions League · verde: altre coppe europee o promozione · rosso: retrocessione.</p>') +
    '<div class="stack">' + G.ui.card('Capocannonieri', G.ui.leaderTable(st, b.scorers, 'g')) + G.ui.card('Assist', G.ui.leaderTable(st, b.assists, 'a')) + '</div>' +
    G.ui.card('Guanto d’oro (clean sheet)', G.ui.leaderTable(st, b.gk, 'cs')) +
    G.ui.card('Player of the Season (voto medio)', G.ui.leaderTable(st, b.rating, 'avg', '', function (v) { return v.toFixed(2); })) + '</div>';
};

// ---------- Europe ----------
/** @param {State} st @returns {string} */
G.ui.euroTab = function (st) {
  var k = G.ui.sel.eu || (G.europe.compsOf(st, st.player.clubId)[0] || 'UCL'), comp = G.sure(st.S).eu[k];
  var opts = G.EU_KEYS.map(function (x) { return [x, G.sure(st.S).eu[x].name]; });
  var t = G.europe.sortTable(comp), me = st.player.clubId;
  var rows = t.map(function (id, i) {
    var r = comp.tab[id], zone = i < 8 ? 'zone-ucl' : i < 24 ? 'zone-up' : 'zone-down';
    return '<tr class="' + (id === me ? 'me ' : '') + zone + '"><td>' + (i + 1) + '</td><td>' + G.ui.club(id, 16) + ' <span class="muted small">' + G.ui.flag(st.world.clubs[id].nat) + '</span></td>' +
      '<td class="num">' + r[0] + '</td><td class="num">' + (r[4] - r[5]) + '</td><td class="num"><b>' + r[6] + '</b></td></tr>';
  }).join('');
  var ko = '', last = '';
  comp.log.forEach(function (l) {
    if (l.stage !== last) { ko += '<div class="group">' + G.europe.STAGES[l.stage] + '</div>'; last = l.stage; }
    ko += '<div class="tie' + (l.a === me || l.b === me ? ' mine' : '') + '">' + G.ui.club(l.a, 16) + ' <b>' + l.ag + '-' + l.bg + '</b> ' + G.ui.club(l.b, 16) + ' → ' + st.world.clubs[l.w].short + '</div>';
  });
  var nextTies = comp.ties.length && comp.stage !== 'done' && comp.stage !== 'lp' ? '<div class="group">Prossimo turno: ' + G.europe.STAGES[comp.stage] + '</div>' +
    comp.ties.map(function (tie, i) {
      var leg = comp.leg && comp.leg[i];  // with a calendar: the first leg played, the second to come (a tie decided is in the log)
      return tie[2] !== undefined ? '' : '<div class="tie' + (tie[0] === me || tie[1] === me ? ' mine' : '') + '">' + G.ui.club(tie[0], 16) + (leg ? ' <b>' + leg[0] + '-' + leg[1] + '</b> ' : ' vs ') + G.ui.club(tie[1], 16) +
        (leg ? ' <span class="muted small">andata</span>' : '') + '</div>';
    }).join('') : '';
  var status = comp.winner !== null ? '🏆 Vincitore: ' + G.ui.club(comp.winner, 20) : 'Fase: ' + (comp.stage === 'lp' ? 'campionato, giornata ' + comp.md + '/' + comp.fx.length : G.europe.STAGES[comp.stage]);
  return '<div class="row" style="margin-bottom:10px">' + G.ui.select('eu', opts, k) + '<span>' + status + '</span></div>' +
    '<div class="grid two">' + G.ui.card('Fase campionato', '<div class="scroll" style="max-height:700px"><table><tr><th>#</th><th>Club</th><th class="num">G</th><th class="num">DR</th><th class="num">Pt</th></tr>' + rows + '</table></div>' +
      '<p class="muted small">1-8 agli ottavi · 9-24 ai playoff · 25-36 eliminate.</p>') +
    G.ui.card('Fase a eliminazione', (ko || '<p class="muted">Non ancora iniziata.</p>') + nextTies) + '</div>';
};

// ---------- awards ----------
/** @param {State} st @returns {string} */
G.ui.awardsTab = function (st) {
  var W = st.world, p = st.player;
  var live = G.awards.bdo(st).slice(0, 15).map(function (e, i) {
    return '<tr class="' + (e.me ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + G.ui.flag(e.nt) + ' ' + e.n + '</td><td class="muted small">' + W.clubs[e.club].name + '</td>' +
      '<td class="num">' + e.g + '</td><td class="num">' + e.a + '</td><td class="num">' + e.avg.toFixed(2) + '</td></tr>';
  }).join('');
  var roll = st.roll || [], y = G.ui.sel.year !== undefined ? G.ui.sel.year : (roll[0] ? roll[0].year : null), R = roll.filter(function (r) { return r.year === y; })[0];
  var albo = roll.map(function (r) {
    return '<tr class="clickable" data-act="year" data-v="' + r.year + '"><td>' + G.season.label(r.year) + '</td><td>' + (r.bdo[0] ? (r.bdo[0].me ? '<b>' + r.bdo[0].n + '</b>' : r.bdo[0].n) + ' <span class="muted small">' + r.bdo[0].club + '</span>' : '—') + '</td>' +
      '<td>' + (r.boot ? r.boot.n + ' <span class="muted small">' + r.boot.g + ' gol</span>' : '—') + '</td><td class="small">' + (r.eu.UCL || '—') + '</td><td class="small">' + (r.eu.UEL || '—') + '</td><td class="small">' + (r.eu.UECL || '—') + '</td></tr>';
  }).join('');
  var detail = '';
  if (R) {
    detail = '<table><tr><th>Lega</th><th>Campione</th><th>Capocannoniere</th><th>Assist</th><th>Guanto d’oro</th><th>Player of the Season</th></tr>' +
      G.LEAGUES.map(function (L) {
        var x = R.lg[L.key] || /** @type {AwardRoll['lg'][string]} */ ({}), f = /** @param {AwardShort} e @param {'g'|'a'|'cs'} [k] */ function (e, k) { return e ? (e.me ? '<b>' : '') + e.n + (e.me ? '</b>' : '') + ' <span class="muted small">' + (k ? e[k] : e.avg) + '</span>' : '—'; };
        return '<tr><td class="small">' + G.NATIONS[L.nat].flag + ' ' + L.name + '</td><td class="small">' + (R.champs[L.key] || '—') + '</td><td class="small">' + f(x.scorer, 'g') + '</td><td class="small">' + f(x.assist, 'a') +
          '</td><td class="small">' + f(x.gk, 'cs') + '</td><td class="small">' + f(x.pots) + '</td></tr>';
      }).join('') + '</table>' +
      '<div class="group">Pallone d’Oro ' + G.season.label(R.year) + '</div>' + R.bdo.map(function (e, i) { return '<div class="small">' + (i + 1) + '. ' + (e.me ? '<b>' + e.n + '</b>' : e.n) + ' <span class="muted">' + e.club + ' · ' + e.g + ' gol · ' + e.a + ' assist</span></div>'; }).join('') +
      (R.myBdo ? '<p>Tu: ' + R.myBdo + 'º</p>' : '');
  }
  return '<div class="grid two">' + G.ui.card('Pallone d’Oro: corsa in tempo reale', '<table><tr><th>#</th><th>Giocatore</th><th>Club</th><th class="num">Gol</th><th class="num">Ass</th><th class="num">Voto</th></tr>' + (live || '<tr><td colspan="6" class="muted">Servono più partite.</td></tr>') + '</table>' +
      '<p class="muted small">Stima su statistiche attuali; a fine stagione contano anche trofei e premi.</p>') +
    G.ui.cabStrip(st) + G.ui.achCard(st) +
    G.ui.card('Albo d’oro', '<div class="scroll"><table><tr><th>Stagione</th><th>Pallone d’Oro</th><th>Scarpa d’Oro</th><th>UCL</th><th>UEL</th><th>UECL</th></tr>' + (albo || '<tr><td colspan="6" class="muted">Ancora nessuna stagione conclusa.</td></tr>') + '</table></div>', 'span3') +
    (R ? G.ui.card('Premi ' + G.season.label(R.year), '<div class="scroll">' + detail + '</div>', 'span3') : '') + '</div>';
};
