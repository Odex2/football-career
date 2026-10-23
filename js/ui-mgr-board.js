// @ts-check
// The board on screen (M8 phase F): the "🎯 Obiettivi della società" card on the bench, a national team's offer and
// the ct's line on the Carriera tab. Phase G: the assistant's switches and the season preview, both on the bench.

/** @param {State} st @param {string} act @param {string} v @returns {string|boolean} */
G.ui.mgrBoardAct = function (st, act, v) {
  if (!st.mgr || !G.mgr.active(st)) return false;
  if (act === 'mnt') { G.ui.flash = { mgr: G.mgrBoard.ntAnswer(st, v === '1') }; return true; }
  if (act === 'massist') { G.ui.sel.assist = !G.ui.sel.assist; return 'view'; }
  var a = st.mgr.assist;
  if (act === 'mast' && a && (v === 'contracts' || v === 'market' || v === 'youth')) { a[v] = a[v] ? 0 : 1; return 'keep'; }
  return false;
};

// Where a goal stands, in words
/** @param {State} st @param {BoardGoal} g @returns {string} */
G.ui.goalNow = function (st, g) {
  var m = st.mgr, W = st.world, S = st.S, club = W.clubs[m.club];
  if (g.k === 'lg') return 'ora ' + (G.season.sortTable(S, club.lg).indexOf(club.id) + 1) + 'º, obiettivo ' + m.obj.tgt + 'º';
  if (g.k === 'cup') {
    var cup = S.cups[club.nat], R = /** @type {Dict<string>} */ ({ 1: 'vinta', 2: 'in finale', 4: 'in semifinale', 8: 'ai quarti', 16: 'agli ottavi', 32: 'ai sedicesimi' });
    var at = g.at || 99, alive = cup && cup.winner === null && cup.alive.indexOf(club.id) >= 0;
    return alive ? 'ancora in corsa' + (R[at] ? ', ' + R[at] : '') : at === 1 ? 'coppa vinta' : 'eliminati' + (R[at] ? ' ' + R[at] : '');
  }
  if (g.k === 'eu') {
    var comp = S.eu[g.c || ''];
    if (!comp) return '';
    var s = G.mgrBoard.euStage(comp, club.id), pos = G.europe.sortTable(comp).indexOf(club.id) + 1;
    if (comp.stage === 'lp') return 'ora ' + pos + 'º nella fase campionato';
    if (s[0] === 6) return 'coppa vinta';
    var where = s[0] === 0 ? pos + 'º nella fase campionato' : (G.europe.STAGES[G.mgrBoard.EU[s[0]]] || '').toLowerCase();
    return (s[1] ? 'eliminati: ' : 'ancora in corsa: ') + where;
  }
  if (g.k === 'fin') return 'budget ' + Math.round(club.bud) + ' M€ · ingaggi ' + G.mgrLive.num(G.world.wageBill(W, club)).slice(1) + ' M€ su ' + G.mgrLive.num((g.lim || 0) + Math.max(0, m.wageRoom || 0)).slice(1);
  return G.mgrBoard.young(st) + ' su 2';
};

/** @param {State} st @returns {string} the card on the bench */
G.ui.mgrGoals = function (st) {
  var m = st.mgr;
  if (!m.goals) return '';
  var rows = m.goals.map(function (g) {
    return '<div class="goal"><span class="gi">' + G.mgrBoard.ICON[g.st] + '</span><div><div>' + g.txt + ' <span class="chip">' + g.imp + '</span></div>' +
      '<div class="muted small">' + G.ui.goalNow(st, g) + (g.run ? ' · in corso' : '') + '</div></div></div>';
  }).join('');
  return G.ui.card('🎯 Obiettivi della società', rows +
    '<p class="muted small">✅ raggiunto · 🟡 mancato di poco (o ancora in bilico) · ❌ mancato. A fine stagione la società fa la media, con peso 3 per l’importanza alta, 2 per la media e 1 per la bassa: ' +
    'sopra la metà la sicurezza del posto sale, sotto scende. Uscire da una coppa o dall’Europa prima dell’obiettivo costa subito 4 punti.</p>', 'goals');
};

/** @param {State} st @returns {string} a national team's offer, on the bench */
G.ui.mgrNtNote = function (st) {
  var m = st.mgr, nat = m.ntOffer;
  if (!nat) return '';
  return '<div class="notice sqreq"><div>🌍 <b>' + G.national.name(nat) + '</b> ti vuole come ct, senza lasciare il club. <span class="muted small">Con te la nazionale avrebbe ' + G.mgrLive.num(G.mgrBoard.power(m)) + ' di forza; se non si qualifica a un torneo, l’incarico finisce.</span></div>' +
    '<div class="row">' + G.ui.btn('mnt', 1, '✅ Accetta') + G.ui.btn('mnt', 0, '❌ No, grazie', 'ghost small') + '</div><div class="muted small">Se non rispondi entro la prima partita, sceglie un altro ct.</div></div>';
};

/** @param {State} st @returns {string} the ct's line on the Carriera tab */
G.ui.mgrNtLine = function (st) {
  var m = st.mgr;
  if (m.nt) return '<div class="notice">🌍 Sei anche il ct di <b>' + G.national.name(m.nt) + '</b>: con te la nazionale ha ' + G.mgrLive.num(G.mgrBoard.ntBonus(st, m.nt)) + ' di forza. Se non si qualifica a un torneo, l’incarico finisce.</div>';
  return '<div class="muted small">🌍 Nessuna nazionale. Con una reputazione da 70 in su, a fine stagione può arrivare un’offerta da ct, da tenere insieme al club.</div>';
};

// ---------- G1 · the assistant: what he does by himself, three switches opened from the bench ----------
/** @param {State} st @returns {string} */
G.ui.mgrAssist = function (st) {
  var a = st.mgr.assist;
  if (!G.ui.sel.assist || !a) return '';
  var D = G.CFG2.MGR_DEAL, Y = G.CFG2.MGR_YOUTH;
  var /** @type {[string, string, string, string][]} */ rows = [
    ['contracts', '✍️ Contratti', 'A fine stagione rinnova chi serve, cioè i titolari e i giovani migliori, e lascia andare gli altri.', 'I contratti in scadenza li rinnovi tu dalla Rosa: chi non rinnovi a giugno se ne va.'],
    ['market', '💼 Mercato', 'Risponde alle offerte (sì da 1,2 volte il valore in su, mai per un perno) e prima che il mercato chiuda compra: per un titolare ' + D.AUTO_GAP + ' o più punti sotto la forza della squadra, il miglior consigliato del suo ruolo che puoi permetterti.', 'Offerte e acquisti li fai tu.'],
    ['youth', '🌱 Giovani', 'A ' + Y.OUT_AGE + ' anni promuove i ragazzi con un potenziale da almeno 72, se c’è posto, e svincola gli altri.', 'I ragazzi di ' + Y.OUT_AGE + ' anni aspettano te nel Vivaio.']];
  return '<div class="notice sqreq"><div>🤖 <b>Assistente</b> <span class="muted small">Tocca un interruttore per accenderlo o spegnerlo. Anche con “Simula stagione” fa solo quello che è acceso.</span></div>' +
    '<div class="trn">' + rows.map(function (r) {
      var on = a[/** @type {'contracts'|'market'|'youth'} */ (r[0])];
      return '<button data-act="mast" data-v="' + r[0] + '" class="' + (on ? 'on' : 'ghost') + '"><b>' + r[1] + ' · ' + (on ? 'acceso' : 'spento') + '</b><small>' + (on ? r[2] : r[3]) + '</small></button>';
    }).join('') + '</div>' + G.ui.btn('massist', '', 'Chiudi', 'ghost small') + '</div>';
};

// ---------- G2 · the season preview: on the bench at block 0, before the first match ----------
/** @param {State} st @returns {string} */
G.ui.mgrPreview = function (st) {
  var m = st.mgr, S = st.S, W = st.world, club = W.clubs[m.club], name = club.name;
  if (S.block !== 0 || S.cur || !m.goals) return '';
  var lg = W.clubs.filter(function (c) { return c.lg === club.lg; }).sort(function (a, b) { return b.str - a.str || a.id - b.id; });
  var riv = lg.filter(function (c) { return c.id !== club.id; }).sort(function (a, b) { return Math.abs(a.str - club.str) - Math.abs(b.str - club.str) || a.id - b.id; }).slice(0, 3);
  // the summer's moves, from the 💰 news: '💰 Name (80) dal From al To per 12 M€'
  var /** @type {string[]} */ ins = [], /** @type {string[]} */ outs = [];
  (st.news || []).forEach(function (n) {
    if (n.y !== S.year || n.t.indexOf('💰 ') !== 0) return;
    var t = n.t.slice(3), at = t.lastIndexOf(' al ' + name);
    if (t.indexOf('dal ' + name + ' al ') >= 0) outs.push(t.replace('dal ' + name + ' ', ''));
    else if (at >= 0 && (at + 4 + name.length === t.length || t.indexOf(' al ' + name + ' per ') === at)) ins.push(t.slice(0, at) + t.slice(at + 4 + name.length));
  });
  var list = /** @param {string[]} x @returns {string} */ function (x) { return x.length ? x.slice(0, 6).join(' · ') + (x.length > 6 ? ' · e altri ' + (x.length - 6) : '') : 'nessuno'; };
  var kid = club.sq.map(function (id) { return W.players[id]; }).filter(function (pl) { return pl.a <= 23; }).sort(function (a, b) { return (b.p - b.o) - (a.p - a.o) || b.p - a.p; })[0];
  var goals = m.goals.map(function (g) { return '<div class="small">🎯 ' + g.txt + ' <span class="chip">' + g.imp + '</span></div>'; }).join('');
  return G.ui.card('🔮 La stagione ' + G.season.label(S.year) + ' che comincia', '<div class="prev">' +
    '<div><div class="muted small">Gli obiettivi della società</div>' + goals + '</div>' +
    '<div><div class="muted small">Il pronostico</div><b>' + (lg.indexOf(club) + 1) + 'º</b> su ' + lg.length + ' <span class="muted small">per forza della rosa (' + club.str.toFixed(1) + ')</span></div>' +
    '<div><div class="muted small">I rivali più vicini</div>' + riv.map(function (c) { return '<div class="small">' + G.ui.club(c.id, 16) + ' <span class="muted">· ' + c.str.toFixed(1) + '</span></div>'; }).join('') + '</div>' +
    '<div><div class="muted small">Il mercato dell’estate</div><div class="small">⬅️ Arrivi: ' + list(ins) + '</div><div class="small">➡️ Partenze: ' + list(outs) + '</div></div>' +
    (kid ? '<div><div class="muted small">Da tenere d’occhio</div><div class="small">👀 <b>' + kid.n + '</b>, ' + kid.a + ' anni, ' + G.ROLES[kid.r].label + ' · OVR ' + Math.round(kid.o) + ', potenziale ' + Math.round(kid.p) + '</div></div>' : '') +
    '</div>', 'goals');
};
