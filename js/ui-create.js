// @ts-check
// Creation screens (player and manager): the nation list with the South American nationalities.

// The nations with a league in the game, then the South American ones (a career there starts abroad)
/** @param {NationCode} [sel] @returns {string} */
G.ui.natOptions = function (sel) {
  sel = sel || 'ITA';
  /** @param {NationRef} n @returns {string} */
  var opt = function (n) { return '<option value="' + n.id + '"' + (n.id === sel ? ' selected' : '') + '>' + n.flag + ' ' + n.name + '</option>'; };
  return '<optgroup label="Campionati nel gioco">' + G.DATA.nations.map(opt).join('') + '</optgroup>' +
    '<optgroup label="Sud America · nessun campionato nel gioco">' + G.SA_NATS.map(function (id) { return opt(G.nationInfo(id)); }).join('') + '</optgroup>';
};

// The note under the nation: shown for a nation whose league is not in the game
/** @param {NationCode} nat @returns {string} */
G.ui.natNote = function (nat) { return G.NATIONS[nat] ? '' : 'Il campionato del tuo paese non c’è nel gioco: comincerai all’estero.'; };
/** @param {NationCode} nat */
G.ui.showNatNote = function (nat) { var el = $('#c-natnote'); if (el) el.textContent = G.ui.natNote(nat); };
