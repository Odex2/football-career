// @ts-check
// The "🗂️ Rosa" tab of the manager career (M8 phase B7): every player with his squad role, morale, form, fitness,
// contract and season, the captain, and the players' requests on top. On a phone a row shows name, overall, morale,
// form and fitness; the rest opens with a tap.

/** @param {State} st @param {string} act @param {string} v @returns {string|boolean} */
G.ui.mgrSqAct = function (st, act, v) {
  if (!st.mgr || !G.mgr.active(st)) return false;
  if (act === 'mcap') { G.ui.flash = { mgr: G.mgrSq.setCap(st, +v) }; return true; }
  if (act === 'mreq') { var x = v.split(':'); G.ui.flash = { mgr: G.mgrSq.answer(st, +x[0], x[1]) }; return true; }
  return false;
};

/** @param {PlayerRequest} r @returns {string} */
G.ui.reqText = function (r) { return r.k === 'spazio' ? 'chiede più spazio' : 'vuole andare via'; };

// The bench: one line per request, to the Rosa tab
/** @param {State} st @returns {string} */
G.ui.mgrReqNotes = function (st) {
  var m = G.mgr.job(st), W = st.world;
  return (m.req || []).map(function (r) { return '<div class="notice warn clickable" data-act="tab" data-v="squadra">😠 ' + W.players[r.id].n + ' ' + G.ui.reqText(r) + '</div>'; }).join('');
};

// The Rosa tab: the requests with their answers (and what the assistant answers if you do not)
/** @param {State} st @returns {string} */
G.ui.mgrReqs = function (st) {
  var m = G.mgr.job(st), W = st.world, Q = G.CFG2.MGR_SQ, L = G.mgrSq.LABEL;
  return (m.req || []).map(function (r) {
    var sr = m.sr[r.id], btn = /** @param {string} o @param {string} t */ function (o, t) { return '<button class="small ghost" data-act="mreq" data-v="' + r.id + ':' + o + '">' + t + '</button>'; };
    var opts = r.k === 'spazio' ? btn('promise', '🤝 Prometti più minuti · diventa ' + L[G.mgrSq.UP[sr]].toLowerCase()) + btn('talk', '💬 Spiega le tue scelte · ' + Math.round(G.mgrSq.talkP(m) * 100) + '%') + btn('list', '📋 Mettilo sul mercato') :
      btn('ok', '📋 Ok, cerchiamo una squadra') + btn('stay', '✋ Resti qui');
    var auto = /** @type {Dict<string>} */ ({ talk: 'gli spiegherà le tue scelte', ok: 'lo metterà sul mercato', stay: 'gli dirà che resta' })[G.mgrSq.autoAnswer(m, r)];
    return '<div class="notice warn sqreq"><div>😠 <b>' + W.players[r.id].n + '</b> ' + G.ui.reqText(r) + ' <span class="muted small">' + L[sr] + ' · morale ' + G.mgrSq.pm(m, r.id) +
      (r.k === 'spazio' ? ' · titolare atteso ' + Math.round(Q.SHARE[sr] * 100) + '% delle partite' : '') + '</span></div><div class="row">' + opts + '</div>' +
      '<div class="muted small">Se non rispondi entro la fine del prossimo blocco, il tuo vice ' + auto + '.</div></div>';
  }).join('');
};

// The lines of the player sheet on the Formazione tab: squad role, morale, form, injury
/** @param {State} st @param {Npc} pl @returns {string} */
G.ui.sqRows = function (st, pl) {
  var m = G.mgr.job(st), id = pl.i, f = G.mgrSq.form(m, id), inj = G.mgrSq.inj(m, id);
  return G.ui.pRow('Ruolo in rosa', (G.mgrSq.LABEL[m.sr && m.sr[id]] || '-') + (m.cap === id ? ' · ©' : '')) + G.ui.pRow('Morale', G.mgrSq.face(G.mgrSq.pm(m, id)) + ' ' + G.mgrSq.pm(m, id)) +
    G.ui.pRow('Forma', G.mgrSq.formSym(f) + ' ' + (f > 0 ? '+' : '') + f.toFixed(1)) + (inj ? G.ui.pRow('Infortunio', '🚑 fuori ' + inj + (inj === 1 ? ' partita' : ' partite')) : '');
};

// The cells of a player, shared by the table and the phone list
/** @param {State} st @param {Npc} pl @param {MatchRow} last @returns {Dict<string>} */
G.ui.sqCells = function (st, pl, last) {
  var m = G.mgr.job(st), id = pl.i, inj = G.mgrSq.inj(m, id), pm = G.mgrSq.pm(m, id), f = G.mgrSq.form(m, id), c = G.mgrTeam.cond(m, id), s = pl.s, T = G.CFG.MGR_TEAM, ren = G.mgrDeal.canRenew(st, pl), dev = m.dev && m.dev[id], near = G.mgrYouth.near(pl).length;
  var sel = '<select data-msr="' + id + '">' + G.mgrSq.ORDER.map(function (r) { return '<option value="' + r + '"' + (m.sr[id] === r ? ' selected' : '') + '>' + G.mgrSq.LABEL[r] + '</option>'; }).join('') + '</select>';
  var col = c >= T.COND_OK ? 'var(--good)' : c >= T.REST_AT ? 'var(--mid)' : 'var(--bad)';
  return {
    name: G.ui.flag(pl.nt) + ' ' + pl.n + (m.cap === id ? ' <b title="Capitano">©</b>' : '') + (inj ? ' <span class="r-bad" title="Infortunato: fuori ' + inj + ' partite">🚑' + inj + '</span>' : '') +
      (last && last.mom && last.mom.n === pl.n ? ' <span title="Migliore in campo nell’ultima partita (' + last.mom.r + ')">⭐</span>' : '') + (pl.heir ? ' 🌱' : '') + (m.list && m.list[id] ? ' <span title="Sul mercato">📋</span>' : '') +
      (pl.ln !== undefined ? ' <span title="In prestito dal ' + st.world.clubs[pl.ln].name + '">🔁</span>' : '') +
      (dev ? ' <span class="muted small" title="Sta imparando il ruolo di ' + G.ROLES[dev.to].name.toLowerCase() + '">🔄' + G.ROLES[dev.to].label + ' ' + dev.pr + '%</span>' : ''),
    role: G.ROLES[pl.r].label, age: String(pl.a), ovr: '<b>' + Math.round(pl.o) + '</b>', pot: String(Math.round(pl.p)), sr: sel,
    pm: '<span title="Morale">' + G.mgrSq.face(pm) + ' ' + pm + '</span>', form: '<span title="Forma: ' + (f > 0 ? '+' : '') + f.toFixed(2) + ' a partita rispetto alle attese">' + G.mgrSq.formSym(f) + '</span>',
    cond: '<span class="sqc">' + G.ui.meter(c, 100, col) + '<small>' + c + '%</small></span>',
    con: pl.ln !== undefined ? 'in prestito' : (pl.y === 1 ? '1 anno' : pl.y + ' anni') + (pl.y <= 1 ? ' ⚠️' : ''),
    season: s[5] + ' · ' + s[6] + ' · ' + s[7] + ' · ' + (s[5] ? (s[9] / s[5]).toFixed(2) : '-'),
    // four slots that stay in line from row to row: captain, renewal, a new role, transfer list
    act: (m.cap === id ? '<i class="sqgap"></i>' : '<button class="ghost small sqcap" data-act="mcap" data-v="' + id + '" title="Nomina capitano">©</button>') +
      (ren ? '<button class="ghost small sqcap" data-act="mren" data-v="' + id + '" title="Rinnova il contratto">✍️</button>' : '<i class="sqgap"></i>') +
      (near ? '<button class="ghost small sqcap' + (dev ? ' on' : '') + '" data-act="mdev" data-v="' + id + '" title="Nuovo ruolo">🔄</button>' : '<i class="sqgap"></i>') +
      (pl.ln === undefined ? '<button class="ghost small sqcap' + (m.list[id] ? ' on' : '') + '" data-act="mlist" data-v="' + id + '" title="' + (m.list[id] ? 'Togli dal mercato' : 'Metti sul mercato') + '">📋</button>' : ''),
    actL: (m.cap === id ? '<span class="muted">© È il capitano</span>' : '<button class="ghost small" data-act="mcap" data-v="' + id + '">© Nomina capitano</button>') +
      (ren ? '<button class="ghost small" data-act="mren" data-v="' + id + '">✍️ Rinnova il contratto</button>' : '') +
      (near ? '<button class="ghost small" data-act="mdev" data-v="' + id + '">🔄 ' + (dev ? 'Nuovo ruolo: ' + dev.pr + '%' : 'Insegnagli un nuovo ruolo') + '</button>' : '') +
      (pl.ln === undefined ? '<button class="ghost small" data-act="mlist" data-v="' + id + '">' + (m.list[id] ? '📋 Togli dal mercato' : '📋 Metti sul mercato') + '</button>' : '')
  };
};

/** @param {State} st @returns {string} */
G.ui.mgrRosa = function (st) {
  var m = G.mgr.job(st), W = st.world, S = G.sure(st.S), club = W.clubs[m.club];
  G.mgrSq.sync(st);
  var mine = /** @param {MatchRow} r */ function (r) { return !!r.mgr; };
  var last = S.blockRows.filter(mine).slice(-1)[0] || (S.rows || []).filter(mine).slice(-1)[0];
  var /** @type {Npc[]} */ list = [];
  G.ROLE_KEYS.forEach(function (r) { G.squads.roleList(W, club, r).forEach(function (id) { list.push(W.players[id]); }); });
  var cells = list.map(function (pl) { return G.ui.sqCells(st, pl, last); });
  var rows = cells.map(function (c, i) {
    return '<tr' + (G.mgrSq.inj(m, list[i].i) ? ' class="sqinj"' : '') + '><td>' + c.name + '</td><td class="muted small">' + c.role + '</td><td class="num">' + c.age + '</td><td class="num">' + c.ovr + '</td><td class="num muted">' + c.pot + '</td>' +
      '<td>' + c.sr + '</td><td>' + c.pm + '</td><td class="num">' + c.form + '</td><td>' + c.cond + '</td><td class="small">' + c.con + '</td><td class="small muted">' + c.season + '</td><td>' + c.act + '</td></tr>';
  }).join('');
  var phone = cells.map(function (c) {
    return '<details class="sqm"><summary><span class="sqn">' + c.name + '</span><span class="num">' + c.ovr + '</span><span>' + c.pm + '</span><span class="num">' + c.form + '</span>' + c.cond + '</summary>' +
      '<div class="sqx small"><span>' + c.role + ' · ' + c.age + ' anni · potenziale ' + c.pot + '</span><span>Contratto: ' + c.con + '</span><span>Stagione (pres. · gol · assist · media): ' + c.season + '</span><span>' + c.sr + '</span>' + c.actL + '</div></details>';
  }).join('');
  var avg = Math.round(club.sq.reduce(function (s, id) { return s + G.mgrSq.pm(m, id); }, 0) / Math.max(1, club.sq.length));
  var inj = club.sq.filter(function (id) { return G.mgrSq.inj(m, id); }).length, exp = club.sq.filter(function (id) { return W.players[id].y <= 1; }).length;
  var sum = '<div class="sqsum">Morale medio <b>' + avg + '</b> ' + G.mgrSq.face(avg) + ' · ' + (inj === 1 ? '1 infortunato' : inj + ' infortunati') + ' · ' + (exp === 1 ? '1 contratto in scadenza' : exp + ' contratti in scadenza') + '</div>';
  var fl = G.ui.flash && G.ui.flash.mgr ? '<div class="notice">' + G.ui.flash.mgr + '</div>' : '';
  var head = '<tr><th>Giocatore</th><th>Ruolo</th><th class="num">Età</th><th class="num">OVR</th><th class="num">Pot</th><th>Ruolo in rosa</th><th>Morale</th><th class="num">Forma</th><th>Condizione</th><th>Contratto</th><th>Stagione</th><th></th></tr>';
  return '<div class="grid">' + G.ui.card('🗂️ Rosa · ' + club.name + ' · ' + club.sq.length + ' giocatori', fl + G.ui.mgrRenew(st) + G.ui.mgrDev(st) + G.ui.mgrReqs(st) + sum +
    '<div class="scroll sqt"><table>' + head + rows + '</table></div><div class="sqlist">' + phone + '</div>' +
    '<p class="muted small">Il ruolo in rosa è lo spazio che il giocatore si aspetta: chi gioca meno del previsto perde morale, chi gioca di più lo guadagna. Morale e forma (le ultime 5 valutazioni rispetto alle attese) contano in campo. ' +
    'Abbassare il ruolo costa 10 punti di morale, alzarlo ne dà 5. Il capitano titolare dà forza alla squadra. Stagione: presenze · gol · assist · voto medio. ' +
    '✍️ rinnova un contratto che scade entro 2 anni; 🔄 gli insegna un ruolo vicino al suo; 📋 mette un giocatore sul mercato (se non l’ha chiesto lui, perde 10 di morale).</p>', 'span3') + '</div>';
};
