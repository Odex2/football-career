// @ts-check
// UI: the pixel-art trophy cabinets. One cabinet per career (player, second career), each split into two
// compartments (trophies, personal awards) behind glass doors that open; click a trophy to see when it was won.

/** @type {{ open: Dict<boolean>, anim: string|null, sel: Dict<string|null> }} doors open, the compartment being animated, the trophy selected in each cabinet */
G.ui.cab = { open: {}, anim: null, sel: {} };

// Small inline trophy with its name, for tables, lists and recap badges
/** @param {string} name @param {number} [w] @returns {string} */
G.ui.troTag = function (name, w) { return '<span class="tro-tag">' + G.tro.icon(name, 16, w) + name + '</span>'; };

/** @param {TroItem} it @param {string} who @param {number} i @param {boolean} sel @returns {string} */
G.ui.cabItem = function (it, who, i, sel) {
  var n = it.wins.length;
  return '<button class="tro-item' + (it.miss ? ' miss' : '') + (sel ? ' sel' : '') + '" data-act="cabsel" data-v="' + who + '" data-w="' + it.k + '" title="' + it.name +
    (it.miss ? ' · ancora da vincere' : '') + '" style="--d:' + (0.45 + i * 0.07).toFixed(2) + 's">' + G.tro.svg(it.d, 64, it.miss) +
    (n > 1 ? '<b class="tro-n">×' + n + '</b>' : '') + (it.miss ? '<b class="tro-q">?</b>' : '') + '<span class="tro-name">' + it.name + '</span></button>';
};

/** @param {State} st @param {string} who @param {string} comp @param {string} title @returns {string} */
G.ui.cabComp = function (st, who, comp, title) {
  var C = G.ui.cab, id = who + comp, open = !!C.open[id], sh = G.tro.shelves(st, who, comp), k = 0;
  var body = sh.map(function (s) {
    var items = s.items.map(function (it) { return G.ui.cabItem(it, who, k++, C.sel[who] === it.k); }).join('');
    return '<div class="shelf"><div class="shelf-items">' + (items || '<i class="shelf-empty">scaffale vuoto</i>') + '</div><div class="plank"><span>' + s.t + '</span></div></div>';
  }).join('');
  return '<div class="cab-comp' + (open ? ' open' : '') + (C.anim === id ? ' anim' : '') + '">' +
    '<div class="cab-label"><span>' + title + ' · ' + G.tro.count(sh) + '</span><button data-act="cab" data-v="' + id + '">' + (open ? '✕ Chiudi' : '▶ Apri') + '</button></div>' +
    '<div class="cab-box"><div class="cab-in">' + body + '</div>' +
    '<div class="cab-doors" data-act="cab" data-v="' + id + '" role="button" tabindex="0" aria-label="Apri la bacheca"><span class="door l"></span><span class="door r"></span><b class="cab-hint">▶ APRI</b></div></div></div>';
};

/** @param {State} st @param {string} who @returns {string} */
G.ui.cabinet = function (st, who) {
  var title = who === 'pl' ? 'Bacheca del giocatore' : 'Bacheca del manager';
  return '<div class="cab-wrap" data-who="' + who + '"><div class="cab"><div class="cab-crown"><span>' + title + '</span></div>' +
    '<div class="cab-body">' + G.ui.cabComp(st, who, 'tro', 'Trofei') + G.ui.cabComp(st, who, 'per', 'Premi personali') + '</div>' +
    '<div class="cab-feet"><i></i><i></i></div></div>' + G.ui.cabDetail(st, who) + '</div>';
};

// The selected trophy, big, with every season it was won
/** @param {State} st @param {string} who @returns {string} */
G.ui.cabDetail = function (st, who) {
  var k = G.ui.cab.sel[who], it = /** @type {TroItem|null} */ (null), mem = /** @type {number|undefined} */ (0), /** @type {Dict<Club>} */ clubs = {};
  if (!k) return '';
  ['tro', 'per'].forEach(function (c) { G.tro.shelves(st, who, c).forEach(function (s) { s.items.forEach(function (x) { if (x.k === k) { it = x; mem = s.mem; } }); }); });
  if (!it) return '';
  st.world.clubs.forEach(function (c) { clubs[c.name] = c; });
  var rows = it.miss ? '<p class="muted">Ancora da vincere: il posto in bacheca è pronto.</p>' : it.wins.map(function (w) {
    var c = clubs[w.club];
    return '<div class="cab-win"><b>' + (w.year !== null ? G.season.label(w.year) : 'Oggi') + '</b>' + (c ? G.crest(c, 18) : '') + '<span>' + w.club + '</span></div>';
  }).join('');
  var n = it.wins.length, sub = it.miss || mem ? '' : '<div class="muted small">' + (n > 1 ? 'Vinto ' + n + ' volte' : 'Vinto una volta') + '</div>';
  return '<div class="cab-detail">' + G.tro.svg(it.d, 112, it.miss) + '<div class="cab-dinfo"><h4>' + it.name + '</h4>' + sub + rows + '</div>' +
    '<button class="ghost cab-x" data-act="cabsel" data-v="' + who + '" data-w="' + k + '" aria-label="Chiudi">✕</button></div>';
};

// Doors and selection only redraw the cabinet they belong to
/** @param {HTMLElement} el @param {string} act @param {string} v @param {string} w */
G.ui.cabAct = function (el, act, v, w) {
  var C = G.ui.cab, wrap = /** @type {HTMLElement} */ (el.closest('.cab-wrap'));
  if (act === 'cab') { C.open[v] = !C.open[v]; C.anim = v; } else C.sel[v] = C.sel[v] === w ? null : w;
  if (wrap) wrap.outerHTML = G.ui.cabinet(G.sure(G.state), G.sure(wrap.dataset.who));
  C.anim = null;
};

/** @param {State} st @returns {string} */
G.ui.cabinetTab = function (st) {
  return '<div class="cab-page">' + (st.mgr ? G.ui.cabinet(st, 'mg') : '') + G.ui.cabinet(st, 'pl') + '</div>';
};

// A row of the latest trophies and awards, leading to the cabinets
/** @param {State} st @returns {string} */
G.ui.cabStrip = function (st) {
  var p = st.player, all = /** @type {Won[]} */ (p.trophies).concat(p.awards).sort(function (a, b) { return a.year - b.year; });
  var icons = all.slice(-24).map(function (t) { return '<span title="' + t.name + ' · ' + G.season.label(t.year) + '">' + G.tro.icon(t.name, 32, t.w) + '</span>'; }).join('');
  return G.ui.card('I tuoi trofei · ' + p.trophies.length + ' trofei, ' + p.awards.length + ' premi', '<div class="tro-strip">' + (icons || '<span class="muted">Ancora nessun trofeo.</span>') + '</div>' +
    '<p><button data-act="tab" data-v="bacheca">🏆 Apri la bacheca</button></p>');
};
