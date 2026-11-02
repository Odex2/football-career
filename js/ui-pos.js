// @ts-check
// The player's positions on screen (M9 S5, js/positions.js): the choice at creation, the "🧭 Posizioni" card of the
// Profile (familiarity, the overall and the chance to start in each one, why, asking the coach) and its clicks.

/** @param {string} [cur] @returns {string} the <option>s of the 13 positions (11, with both sides of two) */
G.ui.posOptions = function (cur) {
  return Object.keys(G.POS).map(function (k) { return '<option value="' + k + '"' + (k === (cur || 'PP') ? ' selected' : '') + '>' + k + ' · ' + G.POS[k].n + ' (' + G.ROLES[G.POS[k].r].label + ')</option>'; }).join('');
};

// The positions he knows, then the neighbours of his own: familiarity, overall, start chance, the request's chance
/** @param {State} st @returns {string} */
G.ui.posCard = function (st) {
  var p = st.player, k0 = G.pos.of(p), f = p.fam || {}, why = G.pos.cannotAsk(st);
  var list = Object.keys(G.POS).filter(function (k) { return (f[k] || 0) > 0 || k === k0 || G.pos.NEAR[k0].indexOf(k) >= 0; })
    .filter(function (k) { return (k === 'POR') === (k0 === 'POR'); })
    .sort(function (a, b) { return (a === k0 ? -1 : b === k0 ? 1 : 0) || G.pos.fam(p, b) - G.pos.fam(p, a); });
  var rows = list.map(function (k) {
    var t = G.pos.tryAt(st, k), fam = G.pos.fam(p, k), side = G.POS[k].side && p.foot !== 'A' && p.foot !== G.POS[k].side;
    var btn = k === k0 ? '<span class="chip on">ci giochi</span>' : why ? '' : G.ui.btn('posask', k, 'Chiedi · ' + Math.round(G.pos.askChance(st, k) * 100) + '%');
    return '<tr class="' + (k === k0 ? 'me' : '') + '"><td><b>' + k + '</b> <span class="small muted">' + G.POS[k].n + (k === p.main ? ' · principale' : '') + (side ? ' · piede debole' : '') + '</span></td>' +
      '<td class="num">' + fam + G.ui.meter(fam, 100, fam >= 90 ? 'var(--good)' : fam >= 65 ? 'var(--mid)' : 'var(--bad)') + '</td><td class="num"><b>' + t.ovr + '</b></td><td class="num">' + Math.round(t.ch * 100) + '%</td><td>' + btn + '</td></tr>';
  }).join('');
  var fl = G.ui.flash && G.ui.flash.r && G.ui.flash.id === -5 ? '<div class="notice">' + G.ui.flash.r + '</div>' : '';
  return G.ui.card('🧭 Posizioni', fl + '<div class="scroll"><table class="cmp"><tr><th>Posizione</th><th class="num">Familiarità</th><th class="num">OVR</th><th class="num">Titolare</th><th></th></tr>' + rows + '</table></div>' +
    '<p class="muted small">L’overall usa i pesi della posizione e perde ' + String(G.CFG2.POS.FAM).replace('.', ',') + ' per ogni punto di familiarità sotto 100 (e 1 sul lato del piede debole). ' +
    '"Titolare" confronta te con i titolari del ruolo ' + G.ROLES[p.role].label + ' (o di quello della posizione): è per questo che il mister può vederti meglio in un posto che in un altro. ' +
    'Ogni partita da titolare vale +' + G.CFG2.POS.START + ' di familiarità; il focus "Imparare la posizione" +' + G.CFG2.POS.LEARN + ' a blocco, ma la crescita degli attributi si dimezza. ' +
    (why ? 'Richieste: ' + why + '.' : 'Una richiesta al mister per blocco: se dice no, relazione −' + G.CFG2.POS.ASK.NO + ' (di più la seconda volta in stagione).') + '</p>');
};

/** @param {State} st @param {string} act @param {string} v @returns {boolean} */
G.ui.posAct = function (st, act, v) {
  if (act !== 'posask' || st.mgr) return false;
  G.ui.flash = { id: -5, r: G.pos.ask(st, v) };
  return true;
};
