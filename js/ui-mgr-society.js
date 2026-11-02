// @ts-check
// The 🏛️ Società tab (M9 S4 M11.7): the president and the confidence, the pact of the
// season, the board's goals (moved here from the bench, which keeps one line), the expectations, where the money came
// from, the requests. On a phone the sections fold: the pact opens first in the summer, the president during the season.

// The league goal a level of the pact would set (the objective is worked out again, then put back)
/** @param {State} st @param {string} lvl @returns {MgrObjective} */
G.ui.pactGoal = function (st, lvl) {
  var m = G.mgr.job(st), p = m.pact, o = m.obj, P = G.CFG2.PACT.LV;
  m.pact = { lvl: lvl, bud: 0, adv: 0, pres: 0, sh: P[lvl].sh, y: 0, cf: 0, open: 1 };
  G.mgr.objective(st);
  var r = m.obj;
  m.pact = p; m.obj = o;
  return r;
};

/** @param {State} st @returns {string} 1. the president and the confidence, block by block */
G.ui.socPres = function (st) {
  var m = G.mgr.job(st), club = st.world.clubs[m.club], pk = G.mgrPact.pres(club), P = G.mgrPact.PRES[pk], h = m.confH || [m.conf];
  var bars = h.map(function (c, i) { var v = G.clamp(c, 0, 100); return '<i title="' + (i ? 'dopo il blocco ' + i : 'inizio stagione') + ': ' + c + '" style="height:' + Math.max(4, v) + '%;background:' + (c >= 50 ? 'var(--good)' : c >= 25 ? 'var(--mid)' : 'var(--bad)') + '"></i>'; }).join('');
  return '<p><b>' + G.mgrPact.presName(club) + '</b> · presidente <b>' + P[0] + '</b>' + (club.pres && club.pres.to ? ' (nuovo proprietario, fino al ' + club.pres.to + ')' : '') + '<br><span class="muted small">' + P[1] + '.</span></p>' +
    '<div>Fiducia <b>' + m.conf + '</b>' + (m.grace ? ' · ⏳ ultima possibilità: ' + m.grace + ' blocchi' : '') + '</div><div class="socbar">' + G.ui.meter(Math.max(0, m.conf), 100, m.conf >= 50 ? 'var(--good)' : m.conf >= 25 ? 'var(--mid)' : 'var(--bad)') + '</div>' +
    '<div class="muted small">A 0 arriva l’esonero. La pazienza (' + G.mgrPact.pat(st) + ') riduce quanto pesa una classifica sotto l’obiettivo.</div>' +
    '<div class="confh" title="La fiducia blocco per blocco">' + bars + '</div>';
};

/** @param {State} st @returns {string} 2. the pact: the 4 levels with their numbers while it is open */
G.ui.socPact = function (st) {
  var m = G.mgr.job(st), club = st.world.clubs[m.club], p = m.pact || { lvl: 'norm', bud: 0, adv: 0, pres: 0 }, PL = G.CFG2.PACT.LV, open = G.mgrPact.open(st);
  var h = '<p>Patto <b>' + G.mgrPact.LV[p.lvl] + '</b> · budget <b>' + Math.round(club.bud) + ' M€</b>' + (p.bud ? ' (' + (p.bud > 0 ? '+' : '') + p.bud + ' dal patto)' : '') + ' · ' + m.obj.txt +
    (p.adv ? '<br><span class="small">💸 Anticipo da restituire se manchi l’obiettivo: <b>' + p.adv + ' M€</b> (dal budget dell’anno dopo, senza scendere sotto il minimo)</span>' : '') + '</p>';
  if (!open) return h + '<p class="muted small">Il patto si sceglie in estate, prima della prima partita.</p>';
  return h + '<div class="pacts">' + Object.keys(PL).map(function (lvl) {
    var L = G.mgrPact.L(m, lvl), no = G.mgrPact.no(st, lvl), g = G.mgrPact.money(st, lvl), o = G.ui.pactGoal(st, lvl), bud = Math.round(club.bud - (m.pact ? m.pact.bud : 0) + g[0]);
    var pat = L.conf ? '+' + L.conf + ' di fiducia subito' : L.loss > 1 ? 'le sconfitte pesano il ' + Math.round((L.loss - 1) * 100) + '% in più' : 'pazienza come oggi';
    return '<div class="pact' + (p.lvl === lvl ? ' on' : '') + '"><b>' + G.mgrPact.LV[lvl] + '</b><div class="small">Budget ' + bud + ' M€' + (g[1] ? ' (anticipo ' + g[1] + ')' : '') + ' · ' + o.txt + ' (' + o.tgt + 'º)' +
      '<br>Coppa ed Europa: ' + (L.cup < 0 ? 'un turno prima' : L.cup > 0 ? 'un turno dopo' + (L.top ? ', importanza alta' : '') : 'come oggi') + ' · ' + pat + ' · aspettative ' + (L.push > 0 ? '+' : '') + L.push + '</div>' +
      (no ? '<div class="muted small">⛔ ' + no + '</div>' : p.lvl === lvl ? '<span class="chip on">scelto</span>' : G.ui.btn('mpact', lvl, 'Scegli')) + '</div>';
  }).join('') + '</div><p class="muted small">Metà del budget in più è un anticipo sull’anno dopo, l’altra metà la mette il presidente. Se raggiungi un patto Ambizioso o Tutto per vincere: fiducia +8/+15, reputazione +1/+2, tifosi +4/+8.</p>';
};

/** @param {State} st @returns {string} 4. the expectations and next year's goal after three endings */
G.ui.socExp = function (st) {
  var m = G.mgr.job(st), club = st.world.clubs[m.club], e = club.exp || 0, t = m.obj.tgt, n = m.obj.n;
  /** @param {number} x */
  var pos = function (x) { var r = Math.round(x); return r ? (r > 0 ? r + (r === 1 ? ' posizione più in alto' : ' posizioni più in alto') : -r + (r === -1 ? ' posizione più in basso' : ' posizioni più in basso')) : 'come per la forza della rosa'; };
  var out = [['mancato di 2', Math.min(n, t + 2)], ['raggiunto', t], ['superato di 2', Math.max(1, t - 2)]].map(function (x) {
    return '<div class="small">Obiettivo ' + x[0] + ' (' + x[1] + 'º) → aspettative ' + G.mgrPact.expAfter(st, +x[1]) + ': ' + pos(G.mgrPact.expAfter(st, +x[1])) + '</div>';
  }).join('');
  return '<p>Aspettative <b>' + (e > 0 ? '+' : '') + e + '</b>: la società chiede ' + pos(e) + '.</p>' + out +
    '<p class="muted small">Ogni estate: 60% delle aspettative di prima, più il 30% dello scarto dall’obiettivo, più la spinta del patto e 0,5 per trofeo. Una retrocessione le porta a −1.</p>';
};

/** @param {State} st @returns {string} 5. where the budget of this season came from */
G.ui.socMoney = function (st) {
  var m = G.mgr.job(st), f = m.fin, club = st.world.clubs[m.club];
  if (!f || f.rev === undefined) return '<p>Budget <b>' + Math.round(club.bud) + ' M€</b>.</p><p class="muted small">Il dettaglio arriva dalla prossima estate.</p>';
  var rows = /** @type {[string, number|undefined][]} */ ([['Resto dell’anno prima', f.carry], ['Entrate (30%)', f.rev], ['Premi', f.prize], ['Margine ingaggi non usato', f.room], ['Anticipo restituito', -(f.repay || 0)], ['Minimo garantito', f.floor], ['Patto (anticipo)', f.pact], ['Presidente', f.pres]]);
  return '<table class="small">' + rows.filter(function (r) { return r[1]; }).map(function (r) { return '<tr><td>' + r[0] + '</td><td class="num">' + ((r[1] || 0) > 0 ? '+' : '') + G.mgrDeal.r1(+(r[1] || 0)) + ' M€</td></tr>'; }).join('') +
    '</table><p class="small">Budget oggi <b>' + Math.round(club.bud) + ' M€</b>: con acquisti e cessioni cambia durante la stagione.</p>';
};

/** @param {State} st @returns {string} 6. the board's request, the manager's requests with their chance, the history */
G.ui.socAsks = function (st) {
  var m = G.mgr.job(st), r = m.breq, h = '';
  if (r) h += '<div class="notice' + (r.acc ? '' : ' warn') + '">🏛️ La società chiede: ' + G.mgrAsk.boardText(st, r) + '.' + (r.acc ? ' <b>Hai detto sì.</b>' :
    '<div class="row" style="margin-top:6px">' + G.ui.btn('mbreq', 1, '✅ Sì (fiducia +' + G.CFG2.PACT.ASK.OK + ')') + G.ui.btn('mbreq', 0, '❌ No (fiducia −' + G.CFG2.PACT.ASK.NO + ')', 'ghost small') + '</div><div class="muted small">Se non rispondi, a fine blocco il vice dice sì.</div>') + '</div>';
  h += Object.keys(G.mgrAsk.K).map(function (k) {
    var why = G.mgrAsk.can(st, k), K = G.mgrAsk.K[k];
    return '<div class="askrow"><div><b>' + K[0] + '</b>' + (k === 'bud' ? ' (' + G.mgrAsk.budAmount(st) + ' M€)' : '') + '<div class="muted small">' + K[1] + (why ? ' · ' + why : '') + '</div></div>' +
      (why ? '' : G.ui.btn('mask', k, 'Chiedi · ' + Math.round(G.mgrAsk.chance(st, k) * 100) + '%')) + '</div>';
  }).join('');
  var past = (m.asks || []).slice(-6).reverse().map(function (a) { return '<div class="small">' + (a.ok ? '✅' : '❌') + ' ' + G.mgrAsk.K[a.k][0] + ' <span class="muted">· ' + G.season.label(a.y) + ', ' + G.CFG.BLOCKS[a.b] + '</span></div>'; }).join('');
  return h + (past ? '<h4 style="margin:10px 0 4px">Le richieste fatte</h4>' + past : '');
};

// The tab: six sections, folding on a phone
/** @param {State} st @returns {string} */
G.ui.societyTab = function (st) {
  var m = G.mgr.job(st), wide = typeof window === 'undefined' || window.innerWidth >= 900, first = G.mgrPact.open(st) ? 2 : 1;
  var fl = G.ui.flash && G.ui.flash.mgr ? '<div class="notice">' + G.ui.flash.mgr + '</div>' : '';
  var goals = G.ui.mgrGoals(st).replace(/^<div class="card goals"><h3>[^<]*<\/h3>/, '').replace(/<\/div>$/, '');
  var parts = [['👔 Il presidente e la fiducia', G.ui.socPres(st)], ['🤝 Il patto di questa stagione', G.ui.socPact(st)], ['🎯 Gli obiettivi', goals ? '<div class="goals">' + goals + '</div>' : '<p class="muted">Nessun obiettivo.</p>'],
    ['📈 Le aspettative', G.ui.socExp(st)], ['💶 I soldi', G.ui.socMoney(st)], ['📨 Le richieste', G.ui.socAsks(st)]];
  return fl + '<div class="grid soc">' + parts.map(function (x, i) {
    var o = G.ui.sel.soc && G.ui.sel.soc[i] !== undefined ? G.ui.sel.soc[i] : wide || i + 1 === first || (i === 5 && m.breq && !m.breq.acc);
    return '<details class="card"' + (o ? ' open' : '') + '><summary data-act="socopen" data-v="' + i + (o ? ':0' : ':1') + '"><h3>' + x[0] + '</h3></summary>' + x[1] + '</details>';
  }).join('') + '</div>';
};

/** @param {State} st @returns {string} the bench's line: pact, goals, a request waiting */
G.ui.societyLine = function (st) {
  var m = G.mgr.job(st), n = /** @type {Dict<number>} */ ({ ok: 0, mid: 0, ko: 0 }), r = m.breq;
  (m.goals || []).forEach(function (g) { n[g.st]++; });
  return (G.mgrPact.open(st) ? '<div class="notice clickable" data-act="tab" data-v="societa">🤝 Scegli il patto con la società prima della prima partita (ora ' + G.mgrPact.LV[m.pact ? m.pact.lvl : 'norm'] + ').</div>' : '') +
    (r && !r.acc ? '<div class="notice warn clickable" data-act="tab" data-v="societa">🏛️ La società ti chiede: ' + G.mgrAsk.boardText(st, r) + '.</div>' : '') +
    '<div class="notice clickable" data-act="tab" data-v="societa">🏛️ Obiettivi ✅ ' + n.ok + ' · 🟡 ' + n.mid + ' · ❌ ' + n.ko + ' · patto ' + G.mgrPact.LV[m.pact ? m.pact.lvl : 'norm'] + ' · fiducia ' + m.conf + ' <span class="muted small">· apri 🏛️ Società</span></div>';
};

// The sections opened or closed are remembered until the career is closed (G.ui.sel.soc); the page does not jump up
/** @param {State} st @param {string} act @param {string} v @returns {boolean|string} */
G.ui.societyAct = function (st, act, v) {
  if (!st.mgr || !G.mgr.active(st)) return false;
  if (act === 'socopen') { (G.ui.sel.soc = G.ui.sel.soc || /** @type {Dict<boolean>} */ ({}))[v.split(':')[0]] = v.split(':')[1] === '1'; return 'view'; }
  if (act === 'mpact') { G.ui.flash = { mgr: G.mgrPact.set(st, v) }; return 'keep'; }
  if (act === 'mask') { G.ui.flash = { mgr: G.mgrAsk.ask(st, v) }; return 'keep'; }
  if (act === 'mbreq') { G.ui.flash = { mgr: G.mgrAsk.answer(st, v === '1') }; return 'keep'; }
  return false;
};
