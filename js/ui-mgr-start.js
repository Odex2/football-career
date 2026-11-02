// @ts-check
// Manager career from the start: the creation form and the end screen of a manager-only career.

// Switch at the top of the creation screen: player or manager career
G.ui.careerSwitch = function () {
  var t = G.ui.ctype || 'pl';
  return '<div class="opts" style="margin-bottom:10px">' + [['pl', '⚽ Giocatore'], ['mgr', '📋 Manager']].map(function (x) {
    return '<button data-act="ctype" data-v="' + x[0] + '" class="' + (t === x[0] ? 'on' : 'ghost') + '">' + x[1] + '</button>';
  }).join('') + '</div>';
};

G.ui.mgrCreateForm = function () {
  var ages = ''; for (var a = 30; a <= 55; a++) ages += '<option' + (a === 38 ? ' selected' : '') + '>' + a + '</option>';
  var bg = Object.keys(G.mgr.BG).map(function (k, i) {
    var b = G.mgr.BG[k];
    return '<label class="bgopt"><input type="radio" name="c-bg" value="' + k + '"' + (i === 0 ? ' checked' : '') + '> <b>' + b.n + '</b> <span class="muted small">· reputazione ' + b.rep + ' · ' + b.d + '</span></label>';
  }).join('');
  return '<div class="card create"><h3>Nuova carriera</h3>' + G.ui.careerSwitch() +
    '<label>Nome</label><input id="c-name" value="Marco Rossi" maxlength="30">' +
    '<label>Nazione</label><select id="c-nat">' + G.ui.natOptions('ITA') + '</select><p class="muted small" id="c-natnote"></p>' +
    '<label>Età</label><select id="c-age">' + ages + '</select>' +
    '<label>Passato</label>' + bg +
    '<p class="muted">Parti senza squadra: scegli tra i club che cercano un manager del tuo livello. Da manager decidi modulo, titolari e tattica, e fai il mercato. La carriera finisce quando vuoi, al massimo a ' + G.CFG.MGR.MAX_AGE + ' anni.</p>' +
    G.ui.slotPick() + '<button class="big" data-act="createmgr">Inizia da manager ▶</button></div>';
};

G.ui.createMgr = function () {
  var slot = G.ui.pickSlot(), bg = /** @type {HTMLInputElement} */ (document.querySelector('input[name="c-bg"]:checked'));
  if (slot < 0) return;
  G.state = G.game.newManager({ name: $('#c-name').value.trim() || 'Manager', nat: $('#c-nat').value, age: +$('#c-age').value, bg: bg ? bg.value : 'prov' });
  G.ui.tab = 'panchina';
  G.save.slot = slot; G.save.write(G.state); G.ui.render();
};

// End screen of a manager-only career
/** @param {State} st */
G.ui.renderMgrEnd = function (st) {
  var p = st.player, m = G.sure(st.mgr), sc = G.hof.score(st);
  G.hof.add(st); G.save.write(st);
  $('#app').innerHTML = '<div class="card end-hero"><div class="muted">' + st.retireReason + '</div><h1>' + G.ui.flag(p.nat) + ' ' + p.name + '</h1>' +
    '<div class="grade">' + sc.icon + ' ' + sc.grade + '</div><div class="score" id="end-score" data-to="' + sc.total + '">0</div><div class="muted">punti leggenda</div>' +
    '<div>' + p.age + ' anni · ' + m.seasons + (m.seasons === 1 ? ' stagione' : ' stagioni') + ' in panchina · ' + m.trophies.length + (m.trophies.length === 1 ? ' trofeo' : ' trofei') + ' · ' + m.jobs + ' club</div>' +
    '<p class="row" style="justify-content:center"><button class="big" onclick="G.ui.renderCreate()">🆕 Nuova carriera</button><button class="ghost" onclick="G.save.exportFile(G.state)">⬇️ Esporta la carriera</button></p></div>' +
    '<div class="grid two" style="margin-top:14px"><div class="span3">' + G.ui.cabinetTab(st) + '</div>' +
    G.ui.card('📋 La tua carriera da manager', G.ui.mgrSummary(st), 'span3') + G.ui.hofCard(st.hofId, 15, 'mgr', 'span3') + '</div>';
  G.ui.countUp(document.getElementById('end-score'));
};
