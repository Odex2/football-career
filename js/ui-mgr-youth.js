// @ts-check
// The academy on screen (M8 phase E): the "🌱 Vivaio" tab with the youth scouts, the youth squad and the players
// learning a new role; the training on the Formazione tab; a new role from the Rosa tab (panel on top, G.ui.sel.dev).

/** @param {State} st @param {string} act @param {string} v @returns {string|boolean} */
G.ui.mgrYouthAct = function (st, act, v) {
  if (!st.mgr || !G.mgr.active(st)) return false;
  var Y = G.mgrYouth, say = /** @param {string} t */ function (t) { G.ui.flash = { mgr: t }; };
  if (act === 'myhire') { say(Y.hire(st)); return 'keep'; }
  if (act === 'myfire') { Y.fire(st, +v); return 'keep'; }
  if (act === 'mypro') { say(Y.promote(st, +v)); return 'keep'; }
  if (act === 'myrel') { say(Y.release(st, +v)); return 'keep'; }
  if (act === 'mtrain') { if (G.CFG2.MGR_YOUTH.TRAIN[v]) st.mgr.train = /** @type {Training} */ (v); return 'keep'; }
  if (act === 'mdev') { G.ui.sel.dev = +v; G.ui.tab = 'squadra'; return true; }
  if (act === 'mdevx') { var x = v.split(':'); say(Y.setDev(st, +x[0], x[1] || '')); G.ui.sel.dev = null; return 'keep'; }
  if (act === 'mdevc') { G.ui.sel.dev = null; return 'view'; }
  return false;
};

// A select that changes field k of scout i (the change goes through G.ui.onChange, data-mys)
/** @param {number} i @param {string} k @param {Dict<string>} opts @param {string} cur @returns {string} */
G.ui.ysSel = function (i, k, opts, cur) {
  return '<select data-mys="' + i + ':' + k + '">' + Object.keys(opts).map(function (o) { return '<option value="' + o + '"' + (o === cur ? ' selected' : '') + '>' + opts[o] + '</option>'; }).join('') + '</select>';
};

/** @param {YouthProspect} x @returns {string} */
G.ui.ysPot = function (x) { var r = G.mgrYouth.pot(x); return r[0] + '–' + r[1]; };

// ---------- the Vivaio tab ----------
/** @param {State} st @returns {string} */
G.ui.mgrYouth = function (st) {
  var Y = G.CFG2.MGR_YOUTH, m = G.mgr.job(st), W = st.world, club = W.clubs[m.club];
  var fl = G.ui.flash && G.ui.flash.mgr ? '<div class="notice">' + G.ui.flash.mgr + '</div>' : '';
  var /** @type {Dict<string>} */ nats = {}, /** @type {Dict<string>} */ lvls = {};
  G.NT_IDS.slice().sort(function (a, b) { return G.NT[a].name.localeCompare(G.NT[b].name); }).forEach(function (id) { nats[id] = G.NT[id].flag + ' ' + G.NT[id].name; });
  Y.LVL_COST.forEach(function (c, k) { lvls[k + 1] = 'Livello ' + (k + 1) + ' · ' + G.mgrLive.num(c).replace('+', '') + ' M€'; });
  var scouts = m.ys.map(function (s, i) {
    return '<div class="ysc">🔭 <b>' + (i + 1) + '</b>' + G.ui.ysSel(i, 'nat', nats, s.nat) + G.ui.ysSel(i, 'focus', G.mgrYouth.FOCUS, s.focus) + G.ui.ysSel(i, 'lvl', lvls, String(s.lvl)) +
      G.ui.btn('myfire', i, '✖ Licenzia', 'ghost small') + '</div>';
  }).join('') + (m.ys.length < Y.SCOUTS ? G.ui.btn('myhire', '', '➕ Assumi un osservatore · ' + G.mgrLive.num(Y.LVL_COST[0]).replace('+', '') + ' M€ a stagione', 'small', club.bud < Y.LVL_COST[0]) : '');
  var scoutCard = G.ui.card('🔭 Osservatori giovanili · ' + m.ys.length + '/' + Y.SCOUTS, fl + scouts +
    '<p class="muted small">Mandali in qualunque nazione, anche dove non ci sono campionati, come Brasile e Argentina. A ogni blocco, una volta su due, ognuno ti segnala un ragazzo di 15–17 anni. ' +
    'Più alto il livello, più forte il ragazzo e più preciso il potenziale (±' + Y.LVL_FOG.join(', ±') + '); nelle nazionali più forti c’è più talento. Il costo è a stagione, dal budget (oggi ' + Math.round(club.bud) + ' M€); salire di livello costa la differenza.</p>', 'span3');
  var full = club.sq.length >= G.CFG.SQUAD_MAX;
  var boys = m.yth.map(function (x, i) {
    var old = x.a >= Y.OUT_AGE;
    return '<div class="yb"><div>' + G.ui.flag(x.nt) + ' <b>' + x.n + '</b> <span class="muted small">' + x.a + ' anni · ' + G.ROLES[x.r].label + ' · OVR ' + Math.round(x.o) + ' · potenziale ' + G.ui.ysPot(x) + '</span>' +
      (old ? '<div class="small ywait">⏳ Ha ' + x.a + ' anni: promuovilo o lascialo andare prima della prima partita, se no decide il vice.</div>' : '') + '</div>' +
      '<div class="row">' + G.ui.btn('mypro', i, '⬆️ Promuovi', 'small', full) + G.ui.btn('myrel', i, '👋 Svincola', 'ghost small') + '</div></div>';
  }).join('');
  var youthCard = G.ui.card('🌱 Squadra giovanile · ' + m.yth.length + '/' + Y.MAX, (boys || '<p class="muted">Nessun ragazzo: assumi un osservatore.</p>') +
    '<p class="muted small">I ragazzi crescono a fine stagione (di più con l’allenamento intenso) ma non giocano: per farli giocare promuovili in prima squadra, dove entrano come promesse con un contratto di 3 anni' +
    (full ? ' (oggi la rosa è piena)' : '') + '. A ' + Y.OUT_AGE + ' anni devono salire o andare via. ' + (m.assist && m.assist.youth ? 'Il vice decide per te: promuove chi ha un potenziale da almeno 72.' : '') + '</p>', 'span3');
  var devs = Object.keys(m.dev).map(Number).filter(function (id) { return W.players[id]; }).map(function (id) {
    var pl = W.players[id], d = m.dev[id];
    return '<div class="ydev small">🔄 ' + pl.n + ' <span class="muted">' + G.ROLES[pl.r].label + ' → ' + G.ROLES[d.to].label + '</span>' + G.ui.meter(d.pr, 100) + d.pr + '%' + G.ui.btn('mdevx', id + ':', '✖ Ferma', 'ghost small') + '</div>';
  }).join('');
  var devCard = G.ui.card('🔄 Cambi di ruolo', (devs || '<p class="muted small">Nessuno. Si comincia dalla scheda Rosa (🔄).</p>') +
    '<p class="muted small">Un blocco da titolare (almeno il ' + Math.round(Y.DEV_SHARE * 100) + '% delle partite) vale ' + Y.DEV_RUN + ' punti, un blocco in panchina ' + Y.DEV_IDLE + ': a 100 il ruolo è suo.</p>', 'span3');
  return '<div class="grid">' + scoutCard + youthCard + devCard + '</div>';
};

// ---------- the training, on the Formazione tab ----------
/** @param {State} st @returns {string} */
G.ui.mgrTrain = function (st) {
  var T = G.CFG2.MGR_YOUTH.TRAIN, cur = G.mgr.job(st).train || 'normale', pc = /** @param {number} x */ function (x) { return Math.round(Math.abs(x - 1) * 100) + '%'; };
  var /** @type {Dict<string[]>} */ D = {
    leggero: ['🧘 Leggero', 'Si recupera il ' + pc(T.leggero.rest) + ' più in fretta e ci si fa male il ' + pc(T.leggero.inj) + ' in meno, ma i giovani crescono il ' + pc(T.leggero.grow) + ' in meno'],
    normale: ['⚖️ Normale', 'Il solito equilibrio tra crescita, fatica e infortuni'],
    intenso: ['🔥 Intenso', 'I giovani crescono il ' + pc(T.intenso.grow) + ' in più, ma ci si stanca e ci si fa male di più']
  };
  return G.ui.card('🏋️ Allenamento', '<div class="trn">' + Object.keys(D).map(function (k) {
    return '<button data-act="mtrain" data-v="' + k + '" class="' + (cur === k ? 'on' : 'ghost') + '"><b>' + D[k][0] + '</b><small>' + D[k][1] + '</small></button>';
  }).join('') + '</div>', 'span3');
};

// ---------- a new role, on top of the Rosa tab ----------
/** @param {State} st @returns {string} */
G.ui.mgrDev = function (st) {
  var Y = G.CFG2.MGR_YOUTH, m = G.mgr.job(st), id = G.ui.sel.dev, pl = id === null || id === undefined ? null : st.world.players[id];
  if (!pl || pl.c !== m.club) return '';
  var d = m.dev[pl.i], near = G.mgrYouth.near(pl), body = '';
  if (d) body = '<div class="ydev small">Sta imparando il ruolo di ' + G.ROLES[d.to].name.toLowerCase() + ' ' + G.ui.meter(d.pr, 100) + d.pr + '%' + G.ui.btn('mdevx', pl.i + ':', '✖ Ferma', 'ghost small') + '</div>';
  else if (!near.length) body = '<div class="muted small">Non c’è un ruolo abbastanza vicino al suo.</div>';
  else { var who = pl; body = '<div class="row">' + near.map(function (r) { return G.ui.btn('mdevx', who.i + ':' + r, '🔄 ' + G.ROLES[r].name + ' · oggi −' + G.mgrTeam.fit(who, r) + ' di OVR'); }).join('') + '</div>'; }
  return '<div class="notice sqreq"><div>🔄 <b>Nuovo ruolo per ' + pl.n + '</b> <span class="muted small">' + G.ROLES[pl.r].name + ' · OVR ' + Math.round(pl.o) + '</span></div>' + body +
    '<div class="muted small">Con ' + 100 / Y.DEV_RUN + ' blocchi da titolare (o ' + 100 / Y.DEV_IDLE + ' giocando poco) il nuovo ruolo diventa suo e ci rende al massimo. Fino ad allora, in quel ruolo rende meno.</div>' +
    G.ui.btn('mdevc', '', 'Chiudi', 'ghost small') + '</div>';
};

// The bench: boys who must be promoted or let go
/** @param {State} st @returns {string} */
G.ui.mgrYouthNotes = function (st) {
  var n = G.mgrYouth.waiting(G.mgr.job(st));
  return n ? '<div class="notice warn clickable" data-act="tab" data-v="vivaio">⏳ ' + (n === 1 ? 'Un ragazzo del vivaio ha' : n + ' ragazzi del vivaio hanno') + ' ' + G.CFG2.MGR_YOUTH.OUT_AGE + ' anni: promuovi o svincola.</div>' : '';
};
