// @ts-check
// The manager's Mercato tab (M8 phase D7): budget, wage margin, buys and reports left always on top, then four inner
// tabs: the search (filters, results with the scouts' range of the potential), the negotiation in two steps, the
// offers for our players, loans and the transfer list with the budget split (js/ui-mgr-deal2.js).

/** @type {Dict<string>} */
G.ui.MKT = { cerca: '🔎 Cerca', tratta: '🤝 Trattativa', offerte: '📨 Offerte ricevute', prestiti: '🔁 Prestiti e lista' };

// The search on screen (G.ui.sel), or null for the scouts' shortlist (the role alone filters the shortlist)
/** @returns {DealFilter|null} */
G.ui.mktFilter = function () {
  var s = G.ui.sel;
  if (!s.mfon) return null;
  return { r: s.mfr || '', age: +(s.mfage || 0), price: +(s.mfprice || 0), pot: !!s.mfpot, exp: !!s.mfexp, nat: s.mfnat || '' };
};
/** @param {number} p @returns {string} */
G.ui.pct = function (p) { return Math.round(p * 100) + '%'; };
/** @param {string} act @param {string|number} v @param {string} t @param {string} [cls] @param {boolean} [off] @returns {string} */
G.ui.btn = function (act, v, t, cls, off) { return '<button class="' + (cls || 'small') + '" data-act="' + act + '" data-v="' + v + '"' + (off ? ' disabled' : '') + '>' + t + '</button>'; };

/** @param {State} st @param {string} act @param {string} v @returns {string|boolean} */
G.ui.mgrDealAct = function (st, act, v) {
  if (!st.mgr || !G.mgr.active(st)) return false;
  var D = G.mgrDeal, m = G.mgr.job(st), s = G.ui.sel, say = /** @param {string} t */ function (t) { G.ui.flash = { mgr: t }; };
  if (act === 'mkt') { G.ui.tab = 'mercato'; s.mkt = v; return 'view'; }
  if (act === 'mf') {
    var x = v.split(':');
    if (x[0] === 'pot' || x[0] === 'exp') s['mf' + x[0]] = !s['mf' + x[0]]; else s['mf' + x[0]] = x[1];
    if (x[0] !== 'r') s.mfon = 1;
    return 'view';
  }
  if (act === 'mfoff') { s.mfon = 0; s.mfage = s.mfprice = s.mfnat = ''; s.mfpot = s.mfexp = false; return 'view'; }
  if (act === 'mrep') { say(D.report(st, +v)); return 'keep'; }
  if (act === 'mdeal') { var t = D.open(st, +v); if (t) say(t); else s.mkt = 'tratta'; return true; }
  if (act === 'moff') { say(D.offer(st, +v)); return 'keep'; }
  if (act === 'mctr') { say(D.counter(st, v === '1')); return 'keep'; }
  if (act === 'mdk') {
    var d = m.deal, y = v.split(':');
    if (d && d.step === 'player') { if (y[0] === 'wk') d.wk = +y[1]; if (y[0] === 'sr') d.sr = /** @type {SquadRole} */ (y[1]); if (y[0] === 'yrs') d.yrs = +y[1]; }
    return 'keep';
  }
  if (act === 'msign') { say(D.sign(st)); return 'keep'; }
  if (act === 'mdealx') { if (m.deal && m.deal.step === 'counter') m.neg[m.deal.id] = 'ko'; m.deal = null; return 'keep'; }
  if (act === 'mbid') { var b = v.split(':'); say(D.bid(st, +b[0], b[1])); return 'keep'; }
  if (act === 'mlist') { say(D.setList(st, +v)); return 'keep'; }
  if (act === 'mloan') { say(D.loanOut(st, +v)); return 'keep'; }
  if (act === 'mopt') { var o = v.split(':'); say(D.option(st, +o[0], o[1] === '1')); return 'keep'; }
  if (act === 'msplit') { say(D.setSplit(st, +v.slice(1))); return 'keep'; }
  if (act === 'mren') { s.ren = +v; G.ui.tab = 'squadra'; return true; }
  if (act === 'mrenx') { say(D.renew(st, s.ren, +v)); s.ren = null; return 'keep'; }
  if (act === 'mrenc') { s.ren = null; return 'view'; }
  return false;
};

// The tab: the numbers on top, then the inner tabs (only the loans while the window is shut)
/** @param {State} st @returns {string} */
G.ui.mgrMarket = function (st) {
  var W = st.world, m = G.mgr.job(st), club = W.clubs[m.club], open = G.mgr.open(st), D = G.CFG2.MGR_DEAL, s = G.ui.sel;
  var left = G.CFG.MGR.BUYS[G.sure(st.S).block === 0 ? 0 : 1] - (m.buys || 0), reps = D.REPORTS - Object.keys(m.rep2 || {}).length;
  var head = '<div class="kpis">' + G.ui.kpi(Math.round(club.bud) + ' M€', 'Budget') + G.ui.kpi(G.mgrDeal.margin(st).toFixed(1) + ' M€', 'Margine ingaggi l’anno') +
    G.ui.kpi(open ? String(left) : '-', 'Acquisti rimasti') + G.ui.kpi(open ? String(reps) : '-', 'Relazioni rimaste') + G.ui.kpi(club.sq.length + '/' + G.CFG.SQUAD_MAX, 'Rosa') + '</div>';
  var fl = G.ui.flash && G.ui.flash.mgr ? '<div class="notice">' + G.ui.flash.mgr + '</div>' : '';
  if (!open) {
    var news = (st.news || []).filter(function (n) { return /💰|🔁|✍️|👋/.test(n.t) && n.t.indexOf(club.name) >= 0; }).slice(0, 8).map(function (n) { return '<div class="small">' + n.t + '</div>'; }).join('');
    return '<div class="grid">' + G.ui.card('💼 Mercato · chiuso', fl + head + '<p class="muted">Il mercato è chiuso: riapre in Estate e in Inverno. I rinnovi si fanno dalla scheda Rosa anche adesso.</p>' + G.ui.mktLoans(st) + news, 'span3 mkt') + '</div>';
  }
  var tab = G.ui.MKT[s.mkt] ? s.mkt : 'cerca', n = (m.bids || []).length;
  var nav = '<nav class="mktn">' + Object.keys(G.ui.MKT).map(function (k) {
    return '<button data-act="mkt" data-v="' + k + '" class="' + (tab === k ? 'on' : 'ghost') + '">' + G.ui.MKT[k] + (k === 'offerte' && n ? ' (' + n + ')' : k === 'tratta' && m.deal ? ' •' : '') + '</button>';
  }).join('') + '</nav>';
  var body = tab === 'cerca' ? G.ui.mktSearch(st) : tab === 'tratta' ? G.ui.mktDeal(st) : tab === 'offerte' ? G.ui.mktBids(st) : G.ui.mktLoans(st);
  return '<div class="grid">' + G.ui.card('💼 Mercato · aperto (' + (G.sure(st.S).block === 0 ? 'estate' : 'inverno') + ')', fl + head + nav + body, 'span3 mkt') + '</div>';
};

// ---------- the search ----------
/** @param {State} st @returns {string} */
G.ui.mktSearch = function (st) {
  var m = G.mgr.job(st), W = st.world, s = G.ui.sel, D = G.CFG2.MGR_DEAL, reps = D.REPORTS - Object.keys(m.rep2).length;
  if (s.mfnat && !s.mfon) s.mfon = 1;  // the nation's select (data-sel) only sets mfnat
  var f = G.ui.mktFilter();
  var /** @type {Dict<string>} */ roles = { 'r:': 'Tutti' }; G.ROLE_KEYS.forEach(function (r) { roles['r:' + r] = G.ROLES[r].label; });
  var nats = G.DATA.nations.map(function (n) { return '<option value="' + n.id + '"' + (s.mfnat === n.id ? ' selected' : '') + '>' + n.flag + ' ' + n.name + '</option>'; }).join('');
  var filters = '<div class="mktf">' + G.ui.mgrOpts('mf', roles, 'r:' + (s.mfr || '')) +
    G.ui.mgrOpts('mf', { 'age:': 'Ogni età', 'age:21': 'Fino a 21', 'age:24': 'Fino a 24', 'age:28': 'Fino a 28' }, 'age:' + (s.mfage || '')) +
    G.ui.mgrOpts('mf', { 'price:': 'Ogni prezzo', 'price:25': '≤ 25% del budget', 'price:50': '≤ 50%', 'price:100': '≤ 100%' }, 'price:' + (s.mfprice || '')) +
    '<div class="opts">' + G.ui.btn('mf', 'pot:', '🌟 Alto potenziale', s.mfpot ? 'on' : 'ghost') + G.ui.btn('mf', 'exp:', '⏳ In scadenza', s.mfexp ? 'on' : 'ghost') +
    '<select data-sel="mfnat"><option value="">🌍 Club di ogni nazione</option>' + nats + '</select>' + G.ui.btn('mfoff', '', '⭐ Consigliati', f ? 'ghost' : 'on') + '</div></div>';
  var list = f ? G.mgrDeal.search(st, f) : G.mgr.targets(st).filter(function (pl) { return !s.mfr || pl.r === s.mfr; }).slice(0, D.RESULTS);
  var cells = list.map(function (pl) {
    var pot = G.mgrDeal.pot(st, pl), seller = pl.c >= 0 ? W.clubs[pl.c] : null, rep = m.rep2[pl.i], ko = m.neg[pl.i];
    var tr = rep ? G.mgrDeal.traits(pl).concat(['disponibile ' + G.ui.pct(G.mgrDeal.playerP(st, pl, { id: pl.i, step: 'player', fee: 0, wk: 1, sr: G.mgrDeal.deserve(st, pl) }))]) : [];
    return {
      name: G.ui.flag(pl.nt) + ' ' + pl.n + (tr.length ? ' <span class="muted small">· ' + tr.join(' · ') + '</span>' : ''),
      role: G.ROLES[pl.r].label, age: String(pl.a), ovr: '<b>' + Math.round(pl.o) + '</b>', pot: pot[0] === pot[1] ? String(pot[0]) : pot[0] + '-' + pot[1],
      club: seller ? G.crest(seller, 14) + ' ' + seller.name : '<span class="muted">svincolato</span>', price: G.mgr.price(st, pl) + ' M€', wage: G.mgr.wageFor(st, pl) + ' k€',
      con: pl.y + (pl.y === 1 ? ' anno' : ' anni'),
      act: (rep ? '' : G.ui.btn('mrep', pl.i, '📋 Relazione', 'ghost small', reps <= 0)) + (ko ? '<span class="muted small">✋ trattativa chiusa</span>' : G.ui.btn('mdeal', pl.i, '🤝 Tratta'))
    };
  });
  var rows = cells.map(function (c) {
    return '<tr><td>' + c.name + '</td><td class="muted small">' + c.role + '</td><td class="num">' + c.age + '</td><td class="num">' + c.ovr + '</td><td class="num">' + c.pot + '</td><td class="small">' + c.club + '</td>' +
      '<td class="num">' + c.price + '</td><td class="num muted">' + c.wage + '</td><td class="small">' + c.con + '</td><td class="mkta">' + c.act + '</td></tr>';
  }).join('');
  var phone = cells.map(function (c) {
    return '<details class="sqm mkm"><summary><span class="sqn">' + c.name + '</span><span class="num">' + c.ovr + '</span><span class="num">' + c.pot + '</span><span class="num">' + c.price + '</span></summary>' +
      '<div class="sqx small"><span>' + c.role + ' · ' + c.age + ' anni · ' + c.club + '</span><span>Ingaggio ' + c.wage + ' a settimana · contratto ' + c.con + '</span><div class="row">' + c.act + '</div></div></details>';
  }).join('');
  var head = '<tr><th>Giocatore</th><th>Ruolo</th><th class="num">Età</th><th class="num">OVR</th><th class="num">Pot</th><th>Club</th><th class="num">Prezzo</th><th class="num">Ingaggio</th><th>Contratto</th><th></th></tr>';
  return filters + '<div class="muted small">' + (f ? 'Ricerca degli osservatori' : 'Consigliati dagli osservatori per il tuo modulo') + ' · ' + list.length + ' giocatori</div>' +
    (list.length ? '<div class="scroll sqt"><table>' + head + rows + '</table></div><div class="sqlist">' + phone + '</div>' : '<p class="muted">Nessun giocatore con questi filtri.</p>') +
    '<p class="muted small">Il potenziale è una stima: una relazione completa la restringe e dice carattere e disponibilità. Prezzo e ingaggio sono quelli di partenza della trattativa.</p>';
};

// ---------- the negotiation ----------
/** @param {State} st @returns {string} */
G.ui.mktDeal = function (st) {
  var m = G.mgr.job(st), d = m.deal, W = st.world, D = G.CFG2.MGR_DEAL, r1 = G.mgrDeal.r1;
  if (!d) return '<p class="muted">Nessuna trattativa aperta: scegli un giocatore in 🔎 Cerca e premi 🤝 Tratta.</p>';
  var pl = W.players[d.id], s = pl.c >= 0 ? W.clubs[pl.c] : null, price = G.mgr.price(st, pl), pot = G.mgrDeal.pot(st, pl), L = G.mgrSq.LABEL;
  var h = '<div class="mkd">' + (s ? G.crest(s, 34) : '') + '<div><b>' + G.ui.flag(pl.nt) + ' ' + pl.n + '</b> <span class="muted small">' + G.ROLES[pl.r].label + ' · ' + pl.a + ' anni · OVR ' + Math.round(pl.o) +
    ' · potenziale ' + (pot[0] === pot[1] ? pot[0] : pot[0] + '-' + pot[1]) + '</span><div class="small muted">' + (s ? s.name + ' · contratto ' + pl.y + (pl.y === 1 ? ' anno' : ' anni') : 'Svincolato') + ' · prezzo ' + price + ' M€ · chiede ' + G.mgr.wageFor(st, pl) + ' k€ a settimana</div></div></div>';
  if (d.step === 'club' && s) {
    h += '<div class="muted small">1 · Offerta al ' + s.name + '</div><div class="row">' + [0, 1, 2].map(function (k) {
      return G.ui.btn('moff', k, '💶 ' + Math.round(D.FEE[k] * 100) + '% · ' + r1(price * D.FEE[k]) + ' M€ · ' + G.ui.pct(G.mgrDeal.clubP(st, pl, k)));
    }).join('') + (G.mgrDeal.loanable(st, pl) ? G.ui.btn('moff', 3, '🔁 Prestito con riscatto · subito ' + r1(price * D.LOAN_FEE) + ' M€, riscatto ' + price + ' M€ · ' + G.ui.pct(G.mgrDeal.clubP(st, pl, 3))) : '') + '</div>' +
      '<p class="muted small">La percentuale è la probabilità che il club accetti. Se rifiuta può chiedere il ' + Math.round(D.COUNTER_UP * 100) + '% in più; se no, per questa finestra non se ne parla più.</p>';
  } else if (d.step === 'counter' && s) {
    h += '<div class="notice warn">↩️ Il ' + s.name + ' chiede ' + d.fee + ' M€.</div><div class="row">' + G.ui.btn('mctr', 1, '✅ Accetta ' + d.fee + ' M€') + G.ui.btn('mctr', 0, '❌ Rifiuta', 'ghost small') + '</div>';
  } else if (d.step === 'player') {
    var /** @type {Dict<string>} */ wk = {}, /** @type {Dict<string>} */ sr = {}, /** @type {Dict<string>} */ yrs = {}, want = d.want;
    D.WAGE.forEach(function (x, k) { wk['wk:' + k] = Math.round(x * 100) + '% · ' + G.mgrDeal.wage(st, pl, k) + ' k€'; });
    ['cru', 'imp', 'rot'].concat(pl.a <= 21 ? ['pro'] : []).forEach(function (r) { sr['sr:' + r] = L[r] + (r === want ? ' (gli spetta)' : ''); });
    for (var y = 1; y <= 5; y++) yrs['yrs:' + y] = y + (y === 1 ? ' anno' : ' anni');
    h += '<div class="muted small">2 · Contratto con ' + pl.n + (s ? ' · accordo con il club: ' + d.fee + ' M€' + (d.loan ? ' per il prestito' : '') : '') + '</div>' +
      '<div class="small">Ingaggio a settimana</div>' + G.ui.mgrOpts('mdk', wk, 'wk:' + d.wk) +
      '<div class="small">Ruolo promesso <span class="muted">· gli spetterebbe: ' + L[d.want || 'ris'].toLowerCase() + '</span></div>' + G.ui.mgrOpts('mdk', sr, 'sr:' + d.sr) +
      (d.loan ? '<div class="small muted">In prestito fino a fine stagione, poi il riscatto a ' + price + ' M€ nella finestra estiva.</div>' : '<div class="small">Durata</div>' + G.ui.mgrOpts('mdk', yrs, 'yrs:' + d.yrs)) +
      (G.mgrDeal.wage(st, pl, d.wk || 0) * 52 / 1000 > G.mgrDeal.margin(st) ? '<div class="notice warn small">⚠️ Con questo ingaggio superi il monte ingaggi: sposta parte del budget sugli ingaggi in 🔁 Prestiti e lista.</div>' : '') +
      '<div class="row" style="margin-top:8px"><span>Probabilità che firmi: <b>' + G.ui.pct(G.mgrDeal.playerP(st, pl, d)) + '</b></span>' + G.ui.btn('msign', '', '✍️ Proponi il contratto', '') + '</div>' +
      '<p class="muted small">Promettere più spazio di quello che gli spetta lo convince di più, ma se poi non gioca il morale crolla. Se rifiuta, per questa finestra non se ne parla più.</p>';
  }
  return h + G.ui.btn('mdealx', '', 'Annulla la trattativa', 'ghost small');
};
