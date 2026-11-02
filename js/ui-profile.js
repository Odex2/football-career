// @ts-check
// Profile tab of the playing career (M8 phase I): the attributes in detail, how the start chance is made,
// training focus and intensity side by side, the overall over the seasons, injuries, the player against his role.

/** @param {number} x @param {number} [d] decimals, 2 if missing @returns {string} '+0,40', '−1,3' */
G.ui.signed = function (x, d) { return (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(d === undefined ? 2 : d).replace('.', ','); };

/** @param {Player} p @returns {string[][]} the training focuses as [id, name] */
G.ui.focusList = function (p) {
  return [['bal', 'Equilibrato'], ['key', 'Chiave del ruolo'], ['learn', 'Imparare la posizione']].concat(G.ui.groupsOf(p).map(function (g) { return [g, G.GROUPS[g].name]; }));
};

/** @param {Player} p @returns {string[]} the attribute groups that can be trained (goalkeeping only for a goalkeeper) */
G.ui.groupsOf = function (p) { return Object.keys(G.GROUPS).filter(function (g) { return g !== 'gk' || p.role === 'POR'; }); };

/** @param {number} ch the start chance @returns {string} */
G.ui.startLabel = function (ch) { return ch >= 0.8 ? 'Titolare fisso' : ch >= 0.6 ? 'Titolare' : ch >= 0.4 ? 'Alternativa' : ch >= 0.2 ? 'Riserva' : 'Fuori dalle rotazioni'; };

/** @param {State} st @returns {string} */
G.ui.profileTab = function (st) {
  return '<div class="grid two prof"><div class="stack">' + G.ui.attrsCard(st) + '</div>' +
    '<div class="stack">' + G.ui.hierCard(st) + G.ui.posCard(st) + G.ui.focusCard(st) + G.ui.intensityCard(st) + '</div>' +
    G.ui.trendCard(st) + '<div class="stack">' + G.ui.injuryCard(st) + G.ui.compareCard(st) + '</div></div>';
};

// The one line of the career tab that stands for all of this, and leads here
/** @param {State} st @returns {string} */
G.ui.trainLine = function (st) {
  var p = st.player, ch = G.season.startChance(st), f = G.ui.focusList(p).filter(function (x) { return x[0] === p.plan.focus; })[0];
  var t = G.sure(st.S).block === 4 ? '🏋️ Nel blocco delle finali non ci si allena' : '🏋️ Allenamento: <b>' + (f ? f[1] : '') + '</b> · ' + G.CFG.INTENSITY[p.plan.intensity].name +
    ' · previsto OVR ' + G.ui.signed(G.player.preview(p, p.plan.focus, ch * 0.9).ovr);
  return '<div class="trainline clickable" data-act="tab" data-v="profilo">' + t + ' · Gerarchie: <b>' + G.ui.startLabel(ch) + '</b> (' + Math.round(ch * 100) + '%) <span class="go">›</span></div>';
};

// ---------- 1. attributes ----------
/** @param {State} st @returns {string} */
G.ui.attrsCard = function (st) {
  var p = st.player, C = G.CFG, prev = st.prevAttrs || {}, s0 = st.attrs0, w = G.pos.weights(G.pos.of(p)), shift = G.player.trait(p, 'peak', 0);
  var dl = /** @param {number} d */ function (d) { return '<span class="' + (d > 0 ? 'up' : 'down') + '">' + (d > 0 ? '▲' + d : d < 0 ? '▼' + (-d) : '') + '</span>'; };
  var h = '<div class="pa hd' + (s0 ? '' : ' no0') + '"><span></span><span>Val</span><span title="Dall’ultimo blocco">Blocco</span>' +
    (s0 ? '<span title="Dall’inizio della stagione">Stagione</span>' : '') + '<span title="Peso nell’overall del ruolo">Peso</span></div>';
  Object.keys(G.GROUPS).forEach(function (g) {
    h += '<div class="group">' + G.GROUPS[g].name + '</div>';
    G.GROUPS[g].keys.forEach(function (k) {
      var v = Math.round(p.attrs[k]), peak = C.PEAK[k] + shift, wk = w[k] || 0;
      h += '<div class="pa' + (wk >= 0.1 ? ' key' : '') + (s0 ? '' : ' no0') + '"><span>' + G.ATTR_NAMES[k] +
        '<small class="muted">picco a ' + peak + (p.age > peak ? ' · in calo' : '') + '</small></span><b>' + v + '</b>' +
        dl(prev[k] !== undefined ? v - Math.round(prev[k]) : 0) + (s0 ? dl(s0[k] !== undefined ? v - Math.round(s0[k]) : 0) : '') +
        '<span class="muted small">' + (wk > 0 ? Math.round(wk * 100) + '%' : '') + '</span>' +
        '<div class="bar"><i style="width:' + v + '%;background:' + G.ui.colorFor(v) + '"></i></div></div>';
    });
  });
  var traits = p.traits.map(function (t) { return '<div class="trait"><span class="chip">' + G.TRAITS[t].name + '</span> <span class="small">' + G.TRAITS[t].desc + '</span></div>'; }).join('');
  return G.ui.card('Attributi', traits + h + '<p class="muted small">In giallo gli attributi chiave del ruolo. Blocco: dall’ultimo blocco; ' +
    (s0 ? 'Stagione: dall’inizio della stagione; ' : 'la colonna Stagione compare dalla prossima stagione; ') + 'Peso: quanto conta nell’overall del ruolo. Dopo il picco l’attributo cala.</p>');
};

// ---------- 2. hierarchy: how the start chance is made ----------
/** @param {State} st @returns {string} */
G.ui.hierCard = function (st) {
  var p = st.player, W = st.world, C = G.CFG, x = G.season.startParts(st), riv = x.rival !== null ? W.players[x.rival] : null, role = G.ROLES[p.role].label;
  var n1 = /** @param {number} v */ function (v) { return G.ui.signed(v, 1); };
  var me = p.ovr + x.form + x.morale + x.coach + x.young + x.analyst, base = C.ROLE_FLOOR[G.sure(p.contract).role] || 0;
  var h = G.ui.pRow('Ultimo titolare ' + role, riv ? riv.n + ' (' + role + ', ' + Math.round(x.level) + ') · tu ' + p.ovr : 'nessuno, il posto è libero · tu ' + p.ovr) +
    G.ui.pRow('Forma', n1(x.form)) + G.ui.pRow('Morale', n1(x.morale)) + G.ui.pRow('Fiducia del mister', n1(x.coach)) +
    (x.young ? G.ui.pRow('Bonus giovani', n1(x.young)) : '') + (x.analyst ? G.ui.pRow('Analista dello staff', n1(x.analyst)) : '') +
    G.ui.pRow('Il tuo valore per il mister', me.toFixed(1).replace('.', ',') + ' contro ' + Math.round(x.level)) +
    G.ui.pRow('Minimo dal contratto (' + G.sure(p.contract).role + ')', base ? Math.round(x.floor * 100) + '%' + (x.floor < base ? ' · ridotto per la forma brutta' : '') : 'nessuno');
  return G.ui.card('📋 Gerarchie', '<div class="notice">Gerarchie: <b>' + G.ui.startLabel(x.chance) + '</b> · titolare nel <b>' + Math.round(x.chance * 100) + '%</b> delle partite' +
    (base && x.chance === x.floor ? ' (il minimo del contratto)' : '') + '</div>' + h +
    '<p class="muted small">Forma, morale, fiducia e bonus contano come punti di overall. Più il tuo valore supera l’ultimo titolare del ruolo, più giochi.</p>');
};

// ---------- 3. training focus ----------
// What the chosen focus should bring in this block, next to the balanced plan
/** @param {State} st @returns {string} */
G.ui.focusHint = function (st) {
  var p = st.player, share = G.season.startChance(st) * 0.9, f = G.player.preview(p, p.plan.focus, share), f0 = G.player.preview(p, 'bal', share);
  var n = G.ui.signed;
  var groups = G.ui.groupsOf(p).map(function (g) {
    var ks = G.GROUPS[g].keys, d = ks.reduce(function (a, k) { return a + f.d[k]; }, 0) / ks.length;
    return Math.abs(d) >= 0.05 ? G.GROUPS[g].name + ' ' + n(d) : '';
  }).filter(Boolean).join(' · ');
  return '<div class="muted small">Previsto in questo blocco: <b>OVR ' + n(f.ovr) + '</b>' + (p.plan.focus !== 'bal' ? ' (equilibrato ' + n(f0.ovr) + ')' : '') + (groups ? ' · ' + groups : '') + '</div>';
};

/** @param {State} st @returns {string} */
G.ui.focusCard = function (st) {
  var p = st.player;
  if (G.sure(st.S).block === 4) return G.ui.card('🏋️ Focus allenamento', '<p class="muted">Nel blocco delle finali non ci si allena.</p>');
  var share = G.season.startChance(st) * 0.9, groups = G.ui.groupsOf(p), list = G.ui.focusList(p);
  var btn = list.map(function (f) { return '<button data-act="focus" data-v="' + f[0] + '" class="' + (p.plan.focus === f[0] ? 'on' : '') + '">' + f[1] + '</button>'; }).join('');
  var rows = list.map(function (f) {
    var pr = G.player.preview(p, f[0], share);
    return '<tr class="' + (p.plan.focus === f[0] ? 'me' : '') + '"><td>' + f[1] + '</td><td class="num"><b>' + G.ui.signed(pr.ovr) + '</b></td>' + groups.map(function (g) {
      var ks = G.GROUPS[g].keys;
      return '<td class="num">' + G.ui.signed(ks.reduce(function (a, k) { return a + pr.d[k]; }, 0) / ks.length) + '</td>';
    }).join('') + '</tr>';
  }).join('');
  return G.ui.card('🏋️ Focus allenamento', '<div class="opts">' + btn + '</div>' + G.ui.focusHint(st) +
    '<div class="scroll"><table class="cmp"><tr><th>Focus</th><th class="num">OVR</th>' + groups.map(function (g) { return '<th class="num">' + G.GROUPS[g].name + '</th>'; }).join('') + '</tr>' + rows + '</table></div>' +
    '<p class="muted small">Previsioni per questo blocco senza la parte casuale; i gruppi mostrano la variazione media dei loro attributi.</p>', 'plan');
};

// ---------- 4. intensity ----------
/** @param {State} st @returns {string} */
G.ui.intensityCard = function (st) {
  var p = st.player, C = G.CFG, cur = C.INTENSITY[p.plan.intensity], x = /** @param {number} v */ function (v) { return '×' + String(v).replace('.', ','); };
  var btn = C.INTENSITY.map(function (it, i) { return '<button data-act="intensity" data-v="' + i + '" class="' + (p.plan.intensity === i ? 'on' : '') + '">' + it.name + '</button>'; }).join('');
  var rows = C.INTENSITY.map(function (it, i) {
    return '<tr class="' + (p.plan.intensity === i ? 'me' : '') + '"><td>' + it.name + '</td><td class="num">' + x(it.grow) + '</td><td class="num">' + x(it.inj) + '</td>' +
      '<td class="num">' + x(it.heal || 1) + '</td><td class="num">' + (it.mo ? G.ui.signed(it.mo, 0) : '0') + '</td><td class="num">' + x(it.decl || 1) + '</td></tr>';
  }).join('');
  return G.ui.card('💪 Intensità', (G.sure(st.S).block === 4 ? '<p class="muted">Nel blocco delle finali non ci si allena.</p>' :
    '<div class="opts">' + btn + '</div><div class="muted small">' + cur.name + ': ' + cur.desc + '</div>') +
    '<div class="scroll"><table class="cmp"><tr><th>Intensità</th><th class="num">Crescita</th><th class="num">Infortuni</th><th class="num">Guarigione</th><th class="num">Morale</th><th class="num">Declino</th></tr>' + rows + '</table></div>' +
    '<p class="muted small">Morale: punti a ogni blocco. Guarigione: partite di stop recuperate per ogni partita. Declino: dopo l’età del picco.</p>', 'plan');
};

// ---------- 5. overall over the seasons ----------
/** @param {State} st @returns {string} */
G.ui.trendCard = function (st) {
  var p = st.player, short = /** @param {number} y */ function (y) { return String(y).slice(2) + '/' + String(y + 1).slice(2); };
  var /** @type {[string, number][]} */ pts = p.history.map(function (h) { return /** @type {[string, number]} */ ([short(h.year), h.ovr]); });
  return G.ui.card('📈 Andamento', G.ui.pRow('Potenziale stimato dagli osservatori', G.ui.stars(p.stars)) +
    G.ui.lineChart(pts.map(function (q) { return q[0]; }), [{ name: 'Tu', color: G.ui.CH.me, pts: pts }]) +
    '<p class="muted small">L’overall a fine stagione. Il potenziale vero resta nascosto: le stelle sono la stima degli osservatori.</p>');
};

// ---------- 6. injuries ----------
/** @param {State} st @returns {string} */
G.ui.injuryCard = function (st) {
  var p = st.player, S = G.sure(st.S), risk = p.traits.filter(function (t) { return G.TRAITS[t].inj; }).map(function (t) { return G.TRAITS[t].name + ' ×' + String(G.TRAITS[t].inj).replace('.', ','); });
  var rows = p.history.map(function (h) { return '<tr><td>' + G.season.label(h.year) + '</td><td>' + G.ui.club(h.clubId, 16) + '</td><td class="num">' + (h.inj || 0) + '</td></tr>'; }).join('') +
    '<tr><td>' + G.season.label(S.year) + ' <span class="muted small">in corso</span></td><td>' + G.ui.club(p.clubId, 16) + '</td><td class="num">' + S.ps.inj + '</td></tr>';
  return G.ui.card('🚑 Infortuni', (p.inj > 0 ? '<div class="chip bad">🚑 Infortunato: fuori ancora ' + p.inj + (p.inj === 1 ? ' partita' : ' partite') + '</div>' : '<p>✅ Nessun infortunio in corso.</p>') +
    '<div class="scroll" style="max-height:260px"><table><tr><th>Stagione</th><th>Club</th><th class="num">Partite saltate</th></tr>' + rows + '</table></div>' +
    '<p class="muted small">Rischio: intensità ' + G.CFG.INTENSITY[p.plan.intensity].name.toLowerCase() + ' ×' + String(G.CFG.INTENSITY[p.plan.intensity].inj).replace('.', ',') +
    (risk.length ? ' · ' + risk.join(' · ') : '') + (p.age >= G.CFG.INJ_OLD_AGE ? ' · età ×' + String(G.CFG.INJ_OLD_MULT).replace('.', ',') : '') + '.</p>');
};

// ---------- 7. the player against the starters of his role ----------
/** @param {State} st @returns {string} */
G.ui.compareCard = function (st) {
  var p = st.player, W = st.world, club = W.clubs[p.clubId], n = G.CFG.FORMATION[p.role], L = G.leagueByKey(club.lg), role = G.ROLES[p.role].label, /** @type {number[]} */ os = [];
  W.clubs.forEach(function (c) { if (c.lg === club.lg) G.squads.roleList(W, c, p.role).slice(0, n).forEach(function (id) { os.push(W.players[id].o); }); });
  var avg = os.length ? Math.round(os.reduce(function (a, b) { return a + b; }, 0) / os.length) : 0, best = /** @type {Npc|null} */ (null);
  W.players.forEach(function (pl) { if (pl && pl.r === p.role && (!best || pl.o > best.o)) best = pl; });
  var top = best ? Math.round(best.o) : 0, rank = os.filter(function (o) { return o > p.ovr; }).length + 1;
  var bar = /** @param {string} l @param {number} v @param {string} [col] */ function (l, v, col) { return '<div class="cmpbar"><span>' + l + '</span><b>' + v + '</b>' + G.ui.meter(v, 100, col) + '</div>'; };
  return G.ui.card('⚖️ Confronto', '<p>Sei <b>' + p.ovr + '</b>: la media dei titolari ' + role + ' in ' + L.name + ' è <b>' + avg + '</b>' +
    (best ? ', il migliore del mondo ha <b>' + top + '</b> (' + best.n + ', ' + (best.c >= 0 ? W.clubs[best.c].name : 'svincolato') + ')' : '') + '.</p>' +
    bar('Tu', p.ovr, 'var(--accent)') + bar('Media titolari ' + role + ' · ' + L.name, avg) + (best ? bar('Il migliore del mondo', top, 'var(--accent2)') : '') +
    '<p class="muted small">Tra i ' + os.length + ' titolari ' + role + ' del campionato saresti il ' + rank + 'º.</p>');
};
