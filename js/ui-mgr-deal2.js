// @ts-check
// The manager's market, the rest of the screens (M8 phase D): the offers for our players, loans and the transfer
// list with the budget split (inner tabs of Mercato), the market notices on the bench and the renewal panel on top
// of the Rosa tab.

// ---------- offers received ----------
/** @param {State} st @returns {string} */
G.ui.mktBids = function (st) {
  var m = G.mgr.job(st), W = st.world, D = G.CFG2.MGR_DEAL, L = G.mgrSq.LABEL;
  var list = (m.bids || []).map(function (b, i) {
    var pl = W.players[b.id], by = W.clubs[b.by], val = G.squads.value(pl.o, pl.a, pl.p), out = G.mgrDeal.wantsOut(m, pl.i);
    return '<div class="notice sqreq"><div>📨 ' + G.crest(by, 16) + ' <b>' + by.name + '</b> offre <b>' + b.fee + ' M€</b> per ' + pl.n +
      ' <span class="muted small">' + G.ROLES[pl.r].label + ' · OVR ' + Math.round(pl.o) + ' · ' + pl.a + ' anni · valore ' + val + ' M€ · ' + (L[m.sr[pl.i]] || '').toLowerCase() + (out ? ' · vuole andare via' : '') + '</span></div>' +
      '<div class="row">' + G.ui.btn('mbid', i + ':si', '✅ Accetta') + G.ui.btn('mbid', i + ':no', '❌ Rifiuta', 'ghost small') +
      G.ui.btn('mbid', i + ':su', '↗️ Chiedi ' + G.mgrDeal.r1(b.fee * 1.15) + ' M€ · ' + G.ui.pct(D.BID_COUNTER_P), 'ghost small') + '</div>' +
      (out ? '<div class="muted small">Se rifiuti, il morale di ' + pl.n + ' scende di 8.</div>' : '') + '</div>';
  }).join('');
  return (list || '<p class="muted">Nessuna offerta per i tuoi giocatori in questa finestra.</p>') +
    '<p class="muted small">Le offerte arrivano all’apertura del mercato, più facilmente per chi è sul mercato, e scadono alla chiusura. Se chiedi di più, il club può ritirarsi. Per vendere subito c’è "Vendi subito (−10%)" nella scheda Formazione.</p>';
};

// ---------- loans, the transfer list, the budget split ----------
/** @param {State} st @returns {string} */
G.ui.mktLoans = function (st) {
  var m = G.mgr.job(st), W = st.world, D = G.CFG2.MGR_DEAL, club = W.clubs[m.club], open = G.mgr.open(st), h = '';
  if (open) {
    var /** @type {Dict<string>} */ sp = {};
    D.SPLIT.forEach(function (x) { sp['x' + x] = x > 0 ? '+' + x + '%' : x < 0 ? '−' + -x + '%' : '0'; });  // 'x': keys keep their order
    h += '<h4>💶 Budget e ingaggi</h4>' + G.ui.mgrOpts('msplit', sp, 'x' + (m.split || 0)) +
      '<p class="muted small">Con +10% sposti il 10% del budget nel margine ingaggi (oggi ' + (m.wageRoom >= 0 ? '+' : '') + (m.wageRoom || 0) + ' M€ l’anno); con −10% il 10% del tetto ingaggi torna nel budget, se il margine lo permette. A fine stagione il margine torna a zero e quello che non hai usato non torna nel budget.</p>';
  }
  var listed = club.sq.filter(function (id) { return m.list[id]; });
  h += '<h4>📋 Sul mercato</h4>' + (listed.length ? listed.map(function (id) {
    return '<div class="row small">' + W.players[id].n + ' <span class="muted">' + G.ROLES[W.players[id].r].label + ' · OVR ' + Math.round(W.players[id].o) + (m.list[id] === 1 ? ' · l’ha chiesto lui' : '') + '</span>' + G.ui.btn('mlist', id, '✖ Togli', 'ghost small') + '</div>';
  }).join('') : '<p class="muted small">Nessuno. Metti un giocatore sul mercato dalla scheda Rosa (📋): riceverà più offerte.</p>');
  // our players away, the ones who could go, the ones with us on loan and the options of the summer
  var away = G.mgrDeal.away(st), can = G.mgrDeal.loanOuts(st), loansIn = Object.keys(m.loans || {}).map(Number).filter(function (id) { var L = m.loans[id], pl = W.players[id]; return L.opt !== undefined && pl && L.to === m.club; });
  h += '<h4>🔁 Prestiti</h4>' + away.map(function (id) { var pl = W.players[id]; return '<div class="small">↗️ ' + pl.n + ' al ' + W.clubs[pl.c].name + ' <span class="muted">(forza ' + W.clubs[pl.c].str.toFixed(1) + ') · torna a fine stagione</span></div>'; }).join('') +
    loansIn.map(function (id) {
      var pl = W.players[id], L = m.loans[id];
      if (pl.c === m.club) return '<div class="small">↙️ ' + pl.n + ' in prestito dal ' + W.clubs[G.sure(pl.ln)].name + ' <span class="muted">· riscatto ' + L.opt + ' M€ nella finestra estiva</span></div>';
      return '<div class="notice sqreq"><div>↙️ <b>' + pl.n + '</b> è tornato al ' + W.clubs[pl.c].name + ' <span class="muted small">OVR ' + Math.round(pl.o) + ' · ' + pl.a + ' anni</span></div><div class="row">' +
        G.ui.btn('mopt', id + ':1', '✅ Riscatta per ' + L.opt + ' M€', 'small', !open) + G.ui.btn('mopt', id + ':0', '↩️ Lascia andare', 'ghost small', !open) + '</div><div class="muted small">Se non decidi entro la chiusura del mercato, resta lì.</div></div>';
    }).join('');
  if (open && can.length) {
    var full = away.length >= D.LOAN_MAX;
    h += '<div class="muted small" style="margin-top:6px">Possono andare in prestito (fino a 21 anni, fuori dai 16 che giocano di più; massimo ' + D.LOAN_MAX + '):</div>' + can.map(function (id) {
      var pl = W.players[id];
      return '<div class="row small">' + pl.n + ' <span class="muted">' + G.ROLES[pl.r].label + ' · ' + pl.a + ' anni · OVR ' + Math.round(pl.o) + ' · pot ' + Math.round(pl.p) + '</span>' + G.ui.btn('mloan', id, '🔁 Presta', 'ghost small', full) + '</div>';
    }).join('') + '<p class="muted small">Va in un club del suo livello, se possibile di una serie minore. Se gioca, torna più forte (+' + D.LOAN_GROW + ').</p>';
  } else if (!away.length && !loansIn.length) h += '<p class="muted small">Nessun prestito in corso.</p>';
  return h;
};

// ---------- the bench and the Rosa tab ----------
/** @param {State} st @returns {string} the market's notices on the bench */
G.ui.mgrDealNotes = function (st) {
  var m = G.mgr.job(st), W = st.world, S = G.sure(st.S), h = '', n = (m.bids || []).length;
  if (G.mgr.open(st) && n) h += '<div class="notice clickable" data-act="mkt" data-v="offerte">📨 ' + (n === 1 ? '1 offerta' : n + ' offerte') + ' per i tuoi giocatori: guarda il mercato.</div>';
  if (G.mgr.open(st)) Object.keys(m.loans || {}).forEach(function (k) {
    var L = m.loans[+k], pl = W.players[+k];
    if (L.opt !== undefined && pl && L.to === m.club && pl.c !== m.club) h += '<div class="notice clickable" data-act="mkt" data-v="prestiti">🔁 Puoi riscattare ' + pl.n + ' per ' + L.opt + ' M€ fino alla chiusura del mercato.</div>';
  });
  var exp = (S.block === 2 || S.block === 3) ? G.mgrDeal.expiring(st) : 0;
  if (exp) h += '<div class="notice warn clickable" data-act="tab" data-v="squadra">⚠️ ' + (exp === 1 ? '1 contratto in scadenza' : exp + ' contratti in scadenza') + ' a giugno' + (m.assist && m.assist.contracts ? ': l’assistente rinnoverà i più utili, ma puoi farlo tu dalla Rosa.' : ': rinnova dalla Rosa chi vuoi tenere.') + '</div>';
  return h;
};

// The renewal on top of the Rosa tab (G.ui.sel.ren = the player)
/** @param {State} st @returns {string} */
G.ui.mgrRenew = function (st) {
  var m = G.mgr.job(st), S = G.sure(st.S), id = G.ui.sel.ren, pl = id === null || id === undefined ? null : st.world.players[id];
  if (!pl || !G.mgrDeal.canRenew(st, pl)) return '';
  var a = G.mgrDeal.renewAsk(st, pl.i), body = '';
  if (m.neg[pl.i]) body = '<div class="muted small">Ha già detto no: riprova nella prossima finestra di mercato.</div>';
  else if (!a.p) body = '<div class="muted small">Vuole cambiare aria: con il morale sotto 30 non rinnova.</div>';
  else body = '<div class="row">' + [1, 2, 3, 4].map(function (y) { return G.ui.btn('mrenx', y, '✍️ ' + y + (y === 1 ? ' anno' : ' anni') + ' · fino al ' + (S.year + 1 + y)); }).join('') + '</div>' +
    '<div class="muted small">Probabilità che accetti: ' + G.ui.pct(a.p) + '. Se rinnova, il morale sale di 5. Se rifiuta, ci puoi riprovare nella prossima finestra.</div>';
  return '<div class="notice sqreq"><div>✍️ <b>Rinnovo di ' + pl.n + '</b> <span class="muted small">contratto ' + pl.y + (pl.y === 1 ? ' anno' : ' anni') + ' · oggi ' + pl.w + ' k€ · chiede ' + a.wage + ' k€ a settimana · morale ' + G.mgrSq.pm(m, pl.i) + '</span></div>' +
    body + G.ui.btn('mrenc', '', 'Chiudi', 'ghost small') + '</div>';
};
