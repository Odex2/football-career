// @ts-check
// UI: achievements grid, end-of-career screen (animated), the start screen with the two save slots and the Hall of
// Fame of players and of managers (M8 phase G).

/** @param {State} st @returns {string} */
G.ui.achCard = function (st) {
  var got = st.player.ach || {}, n = Object.keys(got).length;
  var items = G.ach.list.map(function (a) {
    var y = got[a[0]];
    return '<div class="ach-item' + (y ? '' : ' locked') + '" title="' + a[3] + '"><span class="ach-ico">' + a[1] + '</span><div><b>' + a[2] + '</b>' +
      '<div class="muted small">' + a[3] + (y ? ' · ' + G.season.label(y) : '') + '</div></div></div>';
  }).join('');
  return G.ui.card('Obiettivi · ' + n + '/' + G.ach.list.length, '<div class="achgrid">' + items + '</div>', 'span3');
};

/** @param {Won[]} list @param {string} [icon] @returns {string} */
G.ui.grouped = function (list, icon) {
  var /** @type {Dict<number>} */ c = {}, /** @type {string[]} */ order = [];
  list.forEach(function (x) { if (!c[x.name]) { c[x.name] = 0; order.push(x.name); } c[x.name]++; });
  return order.map(function (n) { return '<div class="trophy">' + G.ui.troTag(n) + (c[n] > 1 ? ' <b>×' + c[n] + '</b>' : '') + '</div>'; }).join('');
};

G.ui.renderEnd = function () {
  if (G.state.player.mgrOnly) return G.ui.renderMgrEnd(G.state);
  var st = G.state, p = st.player, W = st.world, sc = G.hof.score(st), nt = p.nt || /** @type {NationalCareer} */ ({ caps: 0, goals: 0, tours: [] });
  G.hof.add(st); G.save.write(st);
  var parts = Object.keys(sc.parts).map(function (k) { return '<span class="chip">' + k + ' ' + sc.parts[k] + '</span>'; }).join(' ');
  var tl = p.history.map(function (h, i) {
    var c = W.clubs[h.clubId];
    return '<tr class="tl-row" style="animation-delay:' + (0.3 + i * 0.12).toFixed(2) + 's"><td>' + G.season.label(h.year) + '</td><td>' + (c ? G.crest(c, 20) : '') + ' ' + h.club + '</td>' +
      '<td class="muted small">' + h.lg + '</td><td class="num">' + h.apps + (h.matches ? '<span class="muted">/' + h.matches + '</span>' : '') + '</td><td class="num">' + h.goals + '</td><td class="num">' + h.assists + '</td>' +
      '<td class="num ' + G.ui.rcls(h.avg) + '">' + (h.avg ? h.avg.toFixed(2) : '-') + '</td><td class="num">' + h.ovr + '</td>' +
      '<td class="small">' + h.trophies.concat(h.awards).map(function (t) { return G.ui.troTag(t); }).join(' ') + (h.bdo ? ' ⚽ ' + h.bdo + 'º' : '') + (h.nt ? ' 🌍 ' + h.nt : '') + '</td></tr>';
  }).join('');
  var ntCard = nt.caps ? '<div class="kpis">' + G.ui.kpi(nt.caps, 'Presenze') + G.ui.kpi(nt.goals, 'Gol') + G.ui.kpi(nt.tours.length, 'Tornei') + '</div>' +
    nt.tours.map(function (t) { return '<div class="small">' + t.n + ' ' + t.year + ': ' + t.res + ' · ' + t.g + ' gol</div>'; }).join('') : '<p class="muted">Mai convocato.</p>';
  var ach = Object.keys(p.ach || {}).map(function (id) { var a = G.ach.get(id); return a ? '<span class="ach-ico" title="' + a[2] + '">' + a[1] + '</span>' : ''; }).join('');
  $('#app').innerHTML = '<div class="card end-hero"><div class="muted">' + st.retireReason + '</div><h1>' + G.ui.flag(p.nat) + ' ' + p.name + '</h1>' +
    '<div class="grade">' + sc.icon + ' ' + sc.grade + '</div><div class="score" id="end-score" data-to="' + sc.total + '">0</div><div class="muted">punti leggenda</div>' +
    '<div class="parts">' + parts + '</div>' +
    '<div>' + p.age + ' anni · ' + p.seasons + ' stagioni · ' + p.tot.apps + ' presenze · ' + p.tot.goals + ' gol · ' + p.tot.assists + ' assist · picco ' + Math.max(p.peak || 0, p.ovr) + ' di overall</div>' +
    '<p class="row" style="justify-content:center"><button class="big" onclick="G.ui.renderCreate()">🆕 Nuova carriera</button><button class="ghost" onclick="G.save.exportFile(G.state)">⬇️ Esporta la carriera</button></p></div>' +
    '<div class="grid two" style="margin-top:14px">' +
    '<div class="span3">' + G.ui.cabinetTab(st) + '</div>' +
    G.ui.card('Nazionale', ntCard) +
    G.ui.card('Obiettivi · ' + Object.keys(p.ach || {}).length + '/' + G.ach.list.length, '<div class="ach-row">' + (ach || '<span class="muted">Nessuno.</span>') + '</div>') +
    G.ui.card('La tua carriera, stagione per stagione', '<div class="scroll"><table><tr><th>Stagione</th><th>Club</th><th>Lega</th><th class="num">Pres</th><th class="num">Gol</th><th class="num">Ass</th><th class="num">Voto</th><th class="num">OVR</th><th>Trofei e premi</th></tr>' + tl + '</table></div>', 'span3') +
    G.ui.secondCareerCard(st) + G.ui.hofCard(st.hofId, 15, 'pl', 'span3') + '</div>';
  G.ui.countUp(document.getElementById('end-score'));
};

/** @param {HTMLElement} el */
G.ui.countUp = function (el) {
  if (!el) return;
  var to = +el.dataset.to, /** @type {number} */ t0 = null, dur = 1600;
  var step = /** @param {number} t */ function (t) {
    if (t0 === null) t0 = t;
    var k = Math.min(1, (t - t0) / dur);
    el.textContent = /** @type {any} */ (Math.round(to * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

// The Hall of Fame card: two tabs, players and managers, each with its own ranking; a tab is redrawn in place
/** @param {string|null} hl @param {number} n @param {string} t @param {string} cls @returns {string} */
G.ui.hofCard = function (hl, n, t, cls) {
  var tabs = [['pl', '⚽ Calciatori'], ['mgr', '📋 Manager']].map(function (x) { return '<button data-act="hoft" data-v="' + x[0] + '" class="' + (t === x[0] ? 'on' : 'ghost') + '">' + x[1] + '</button>'; }).join('');
  return '<div class="card ' + cls + '" id="hof" data-hl="' + (hl || '') + '" data-n="' + n + '" data-cls="' + cls + '"><h3>🏛️ Hall of Fame</h3><div class="opts">' + tabs + '</div>' +
    '<div class="scroll">' + G.hof.table(hl || undefined, n, t) + '</div></div>';
};
/** @param {string} t */
G.ui.hofTab = function (t) {
  var el = $('#hof');
  if (el) el.outerHTML = G.ui.hofCard(el.dataset.hl || null, +el.dataset.n || 10, t, el.dataset.cls || 'span3');
};

// ---------- the start screen (G4): a career in each of two slots ----------
/** @returns {string} "Continua" for each slot with a career (nothing when both are empty) */
G.ui.slotsCard = function () {
  var I = [G.save.info(0), G.save.info(1)];
  if (!I[0] && !I[1]) return '';
  var rows = I.map(function (x, i) {
    if (!x) return '<div class="slot"><div class="grow"><b>Slot ' + (i + 1) + '</b> <span class="muted">· vuoto</span></div></div>';
    return '<div class="slot"><div class="grow"><b>Slot ' + (i + 1) + ' · ' + x.name + '</b><div class="muted small">' + (x.mgr ? '📋 Manager' : '⚽ Calciatore') + (x.club ? ' · ' + x.club : '') +
      ' · stagione ' + G.season.label(x.year) + (x.over ? ' · carriera finita' : '') + '</div></div>' +
      '<button class="big" data-act="slotgo" data-v="' + i + '">▶ Continua</button><button class="ghost small" data-act="slotdel" data-v="' + i + '">🗑️ Cancella</button></div>';
  }).join('');
  return '<div class="card create slots"><h3>💾 Le tue carriere</h3>' + rows + '<p class="muted small">Due slot, ognuno con la sua carriera. Per cominciarne una nuova, scegli lo slot in fondo al modulo qui sotto.</p></div>';
};

/** @returns {string} the slot of a new career, on the creation forms (only when a slot holds a career) */
G.ui.slotPick = function () {
  var I = [G.save.info(0), G.save.info(1)];
  if (!I[0] && !I[1]) return '';
  var def = !I[0] ? 0 : !I[1] ? 1 : G.save.slot;
  return '<label>Slot di salvataggio</label><select id="c-slot">' + I.map(function (x, i) {
    return '<option value="' + i + '"' + (i === def ? ' selected' : '') + '>Slot ' + (i + 1) + (x ? ' · al posto di ' + x.name : ' · vuoto') + '</option>';
  }).join('') + '</select>';
};
/** @returns {number} the slot picked for a new career, -1 when the career in it is kept */
G.ui.pickSlot = function () {
  var el = $('#c-slot'), i = el ? +el.value : G.save.slot, x = G.save.info(i);
  if (x && !confirm('Nello slot ' + (i + 1) + ' c’è la carriera di ' + x.name + ': la nuova la sostituisce per sempre. Continuare?')) return -1;
  return i;
};

/** @param {string} act @param {number} i */
G.ui.slotAct = function (act, i) {
  if (act === 'slotgo') {
    var st = G.save.read(i);
    if (!st || !G.save.valid(st)) return;
    G.save.slot = i; G.state = G.save.restore(st); G.ui.tab = 'carriera';
    window.scrollTo(0, 0); return G.ui.render();
  }
  var x = G.save.info(i);
  if (!x || !confirm('Cancellare per sempre la carriera di ' + x.name + ' (slot ' + (i + 1) + ')? Se vuoi tenerla, prima aprila ed esportala.')) return;
  G.save.wipe(i);
  if (G.save.slot === i) G.state = null;  // nothing writes it back
  G.ui.renderCreate();
};

// Start screen: the saved careers, the creation form, the Hall of Fame
G.ui.renderCreateBase = G.ui.renderCreate;
G.ui.renderCreate = function () {
  G.ui.renderCreateBase();
  var app = $('#app');
  app.innerHTML = G.ui.slotsCard() + app.innerHTML + (G.hof.read().length ? G.ui.hofCard(null, 10, G.ui.ctype === 'mgr' ? 'mgr' : 'pl', 'create hofstart') : '');
};
