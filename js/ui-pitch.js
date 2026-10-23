// @ts-check
// The formation on a pitch, like the squad screen of EA FC (M8 phase H): shirts instead of photos.
// Manager: tap a player, then another, to swap them (G.ui.sel.mx, in memory only). Player: the club's
// most likely XI, to look at. Pure functions that return HTML, like the rest of the interface.

// 11 points [x %, y %, label] per formation, in the order of G.mgrTeam.slots (POR, DC, TS, CC, ES, ATT).
// With cards 17% wide and 18.2% tall no two cards overlap (tests/checks-m8.js)
/** @type {Dict<PitchPos[]>} */
G.ui.PITCH_POS = {
  '4-4-2': [[50, 89, 'POR'], [37, 69, 'DC'], [63, 69, 'DC'], [12, 64, 'TS'], [88, 64, 'TD'], [37, 43, 'CC'], [63, 43, 'CC'], [12, 38, 'ES'], [88, 38, 'ED'], [37, 13, 'ATT'], [63, 13, 'ATT']],
  '4-3-3': [[50, 89, 'POR'], [37, 69, 'DC'], [63, 69, 'DC'], [12, 64, 'TS'], [88, 64, 'TD'], [27, 44, 'CC'], [50, 39, 'CC'], [73, 44, 'CC'], [14, 17, 'ES'], [86, 17, 'ED'], [50, 12, 'ATT']],
  '3-5-2': [[50, 89, 'POR'], [26, 67, 'DC'], [50, 69, 'DC'], [74, 67, 'DC'], [30, 45, 'CC'], [50, 48, 'CC'], [70, 45, 'CC'], [10, 40, 'ES'], [90, 40, 'ED'], [37, 13, 'ATT'], [63, 13, 'ATT']],
  '3-4-3': [[50, 89, 'POR'], [26, 67, 'DC'], [50, 69, 'DC'], [74, 67, 'DC'], [37, 44, 'CC'], [63, 44, 'CC'], [12, 41, 'ES'], [88, 41, 'ED'], [19, 17, 'ATT'], [50, 12, 'ATT'], [81, 17, 'ATT']],
  '5-3-2': [[50, 89, 'POR'], [30, 68, 'DC'], [50, 69, 'DC'], [70, 68, 'DC'], [10, 62, 'TS'], [90, 62, 'TD'], [28, 44, 'CC'], [50, 41, 'CC'], [72, 44, 'CC'], [37, 13, 'ATT'], [63, 13, 'ATT']]
};

// Pitch lines in perspective (viewBox 0..100, stretched to the pitch)
/** @returns {string} */
G.ui.pitchLines = function () {
  return '<svg class="lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
    '<path d="M13 3H87L99 97H1Z"/><path d="M7 50H93"/><ellipse cx="50" cy="50" rx="12" ry="7.5"/>' +
    '<path d="M31 3V16H69V3"/><path d="M41 3V7.5H59V3"/><path d="M43 16Q50 21 57 16"/>' +
    '<path d="M25 97L26 80H74L75 97"/><path d="M38 97L38.5 90H61.5L62 97"/><path d="M42 80Q50 74.5 58 80"/></svg>';
};

// A small shirt in the club's colours and pattern, initials in the middle; goalkeepers in lime.
// Every shirt gets its own clipPath id, or the browser would use the first one for all of them.
G.ui.shirtN = 0;
/** @param {Club} club @param {string} label @param {boolean} [gk] @returns {string} */
G.ui.shirt = function (club, label, gk) {
  var id = 'sh' + (G.ui.shirtN++), a = gk ? '#b6f03c' : club.c1, b = gk ? '#5c7a10' : club.c2, sty = gk ? 's' : club.sty;
  var body = 'M12 6L16.5 3.5Q20 7 23.5 3.5L28 6L36 11L32.5 18L29 16V36H11V16L7.5 18L4 11Z', fill = '<rect width="40" height="40" fill="' + a + '"/>';
  if (sty === 'v') fill += [13, 19, 25].map(function (x) { return '<rect x="' + x + '" width="3" height="40" fill="' + b + '"/>'; }).join('');
  else if (sty === 'h') fill += '<rect x="20" width="20" height="40" fill="' + b + '"/>';
  else if (sty === 'x') fill += [14, 22, 30].map(function (y) { return '<rect y="' + y + '" width="40" height="4" fill="' + b + '"/>'; }).join('');
  else if (sty === 'd') fill += '<path d="M8 40L32 0h6L14 40z" fill="' + b + '"/>';
  else if (sty === 'q') fill += '<rect x="20" width="20" height="20" fill="' + b + '"/><rect y="20" width="20" height="20" fill="' + b + '"/>';
  else fill += '<rect width="11" height="40" fill="' + b + '"/><rect x="29" width="11" height="40" fill="' + b + '"/>';
  return '<svg class="shirt" viewBox="0 0 40 40" aria-hidden="true"><defs><clipPath id="' + id + '"><path d="' + body + '"/></clipPath></defs><g clip-path="url(#' + id + ')">' + fill + '</g>' +
    '<path d="' + body + '" fill="none" stroke="#0007" stroke-width="1"/><path d="M16.5 3.5Q20 9 23.5 3.5" fill="none" stroke="' + (gk ? '#0006' : '#fff9') + '" stroke-width="1.2"/>' +
    '<text x="20" y="27" text-anchor="middle" font-size="9" font-weight="800" font-family="Arial,sans-serif" fill="#fff" stroke="#000b" stroke-width="1.6" paint-order="stroke">' + label + '</text></svg>';
};

/** @param {string} n @returns {string} */
G.ui.initials = function (n) { var w = n.split(' '); return (w.length > 1 ? w[0].charAt(0) + w[w.length - 1].charAt(0) : n.slice(0, 2)).toUpperCase(); };

// Names on the cards: the surname, with the initial of the first name when two players in view share it
/** @param {string[]} names @returns {Dict<string>} */
G.ui.shortNames = function (names) {
  /** @param {string} n */
  var sur = function (n) { var i = n.indexOf(' '); return i > 0 ? n.slice(i + 1) : n; };
  /** @type {Dict<number>} */ var count = {}, /** @type {Dict<string>} */ out = {};
  names.forEach(function (n) { count[sur(n)] = (count[sur(n)] || 0) + 1; });
  names.forEach(function (n) { out[n] = count[sur(n)] > 1 ? n.charAt(0) + '. ' + sur(n) : sur(n); });
  return out;
};

// Form arrow and glow from the average rating of the season (at least 3 appearances)
/** @param {number} apps @param {number} sum @returns {{ f: string, glow: boolean, avg: number }} */
G.ui.formOf = function (apps, sum) {
  var avg = apps ? sum / apps : 0, ok = apps >= 3;
  return { f: !ok ? 'eq' : avg >= 7.2 ? 'up2' : avg >= 6.8 ? 'up' : avg <= 6.2 ? 'dn' : 'eq', glow: ok && avg >= 7.2, avg: avg };
};

/** @param {number} c @returns {string} */
G.ui.condCls = function (c) { var K = G.CFG.MGR_TEAM; return c >= K.COND_OK ? '' : c >= K.REST_AT ? 'mid' : 'bad'; };

// One card; pos = [x, y] on the pitch, or nothing on the bench
/** @param {PitchCard} c @param {PitchPos} [pos] @returns {string} */
G.ui.pitchCard = function (c, pos) {
  var cls = 'pc' + (c.sel ? ' sel' : '') + (c.glow ? ' glow' : '') + (c.me ? ' me' : '') + (c.inj ? ' inj' : '') + (c.hint ? ' h' + c.hint[1] : '');
  var tl = c.hint ? '<span class="hint ' + c.hint[1] + '">' + c.hint[0] + '</span>' : c.me && pos ? '<span class="tl me">TU</span>' :
    pos ? '' : '<span class="tl">' + (c.sub ? '<span class="sub">↺ </span>' : '') + (c.me ? 'TU · ' : '') + c.r + '</span>';
  return '<button class="' + cls + '" data-act="' + c.act + '" data-v="' + c.v + '" aria-label="' + c.aria + '"' + (pos ? ' style="left:' + pos[0] + '%;top:' + pos[1] + '%"' : '') + '>' +
    G.ui.shirt(c.club, c.ini, c.r === 'POR') + tl +
    '<span class="tr"><span class="dia ' + c.form + '"></span><span class="ovr' + (c.low ? ' low' : '') + '">' + c.val + '</span></span>' +
    (c.off && pos ? '<span class="nat">' + c.r + '</span>' : '') + (c.inj ? '<span class="injb">🚑' + c.inj + '</span>' : '') +
    '<span class="bar"><i class="' + c.barCls + '" style="width:' + Math.round(G.clamp(c.bar, 0, 100)) + '%"></i></span>' +
    '<span class="name">' + (c.cap ? '<span class="cap">C</span>' : '') + c.name + (c.heir ? ' 🌱' : '') + '</span></button>';
};

// The pitch (11 cards in the formation's points) and the bench
/** @param {PitchOpts} o @returns {{ field: string, bench: string }} */
G.ui.pitch = function (o) {
  var pos = G.ui.PITCH_POS[o.form] || G.ui.PITCH_POS['4-4-2'];
  return { field: '<div class="pitch' + (o.selecting ? ' selecting' : '') + '">' + G.ui.pitchLines() + o.slots.map(function (c, k) { return G.ui.pitchCard(c, pos[k]); }).join('') + '</div>',
    bench: '<div class="bench">' + o.bench.map(function (c) { return G.ui.pitchCard(c); }).join('') + '</div>' };
};

/** @returns {string} */
G.ui.pitchLegend = function () {
  return '<div class="legend"><span><b class="g"></b>nel suo ruolo</span><span><b class="y"></b>ruolo vicino</span><span><b class="o"></b>adattato</span><span><b class="r"></b>fuori ruolo</span></div>';
};

// One row of the player's sheet
/** @param {string} k @param {string|number} v @returns {string} */
G.ui.pRow = function (k, v) { return '<div class="prow"><span class="muted">' + k + '</span><b>' + v + '</b></div>'; };

// Clicks on the pitch: 'view' = show only, 'keep' = the XI changed (saved), false = not a pitch action
/** @param {State} st @param {string} act @param {string} v @returns {string|boolean} */
G.ui.pitchAct = function (st, act, v) {
  if (act === 'pview') { G.ui.sel.pview = v; return 'view'; }
  if (act === 'pxsel') { G.ui.sel.px = G.ui.sel.px === v ? null : v; return 'view'; }
  if (act === 'mxcancel') { G.ui.sel.mx = null; return 'view'; }
  if (act !== 'mxsel' || !G.mgr.active(st)) return false;
  var x = v.split(':'), k = x[0] === 's' ? 'slot' : 'bench', id = +x[1], cur = G.ui.sel.mx, W = st.world, xi = G.mgrTeam.xi(st);
  /** @param {PlayerId} i */
  var nm = function (i) { var n = W.players[i].n; return n.slice(n.indexOf(' ') + 1); };
  if (!cur || (cur.k === 'bench' && k === 'bench' && cur.id !== id)) { G.ui.sel.mx = { k: k, id: id }; return 'view'; }
  if (cur.k === k && cur.id === id) { G.ui.sel.mx = null; return 'view'; }
  if (cur.k === 'slot' && k === 'slot') {
    var a = xi[cur.id].id, b = xi[id].id;
    G.mgrTeam.setSlot(st, id, a);
    G.ui.flash = { mgr: '↔️ Scambiati ' + nm(a) + ' e ' + nm(b) };
  } else {
    var slot = cur.k === 'slot' ? cur.id : id, inId = cur.k === 'bench' ? cur.id : id, out = xi[slot].id;
    G.mgrTeam.setSlot(st, slot, inId);
    G.ui.flash = { mgr: '🔁 Dentro ' + nm(inId) + ', fuori ' + nm(out) };
  }
  G.ui.sel.mx = null;
  return 'keep';
};

/** @param {number} fit @returns {string} */
G.ui.fitCls = function (fit) { return fit === 0 ? 'g' : fit <= 4 ? 'y' : fit <= 7 ? 'o' : 'r'; };

// ---------- manager: the formation tab ----------

// The selected player (G.ui.sel.mx), or null when there is none (or he left the squad)
/** @param {State} st @returns {Npc|null} */
G.ui.mxPlayer = function (st) {
  var mx = G.ui.sel.mx, club = st.world.clubs[st.mgr.club], xi = st.mgr.xi || [];
  var id = !mx ? -1 : mx.k === 'slot' ? (xi[mx.id] ? xi[mx.id].id : -1) : mx.id;
  if (mx && club.sq.indexOf(id) < 0) G.ui.sel.mx = null;
  return G.ui.sel.mx ? st.world.players[id] : null;
};

/** @param {State} st @returns {PitchOpts} */
G.ui.mgrPitchOpts = function (st) {
  var W = st.world, m = st.mgr, club = W.clubs[m.club], T = G.mgrTeam, xi = T.xi(st), view = G.ui.sel.pview || 'val', mx = G.ui.sel.mx, sp = G.ui.mxPlayer(st);
  var names = G.ui.shortNames(club.sq.map(function (id) { return W.players[id].n; })), subs = T.side(st, club).cameOn, /** @type {Dict<number>} */ inXi = {};
  xi.forEach(function (x) { inXi[x.id] = 1; });
  /** @param {Npc} pl @param {RoleKey|null} r the slot's role (null on the bench) @param {number} k @returns {PitchCard} */
  var card = function (pl, r, k) {
    var c = T.cond(m, pl.i), fo = G.ui.formOf(pl.s[5], pl.s[9]), worth = Math.round(r ? T.eff(m, pl, r) : pl.o);
    var val = view === 'cond' ? c : view === 'form' ? (pl.s[5] ? fo.avg.toFixed(1) : '–') : worth;
    return { club: club, name: names[pl.n] + (m.cap === pl.i ? ' ©' : '') + (G.mgrSq.inj(m, pl.i) ? ' 🚑' : ''), ini: G.ui.initials(pl.n), r: pl.r, val: val, low: view === 'val' && !!r && worth < Math.round(pl.o), bar: c, barCls: G.ui.condCls(c),
      form: fo.f, glow: fo.glow, heir: !!pl.heir, sub: !r && subs.indexOf(pl.i) >= 0, off: !!r && pl.r !== r,
      sel: !!(sp && sp.i === pl.i && (r ? mx.k === 'slot' : mx.k === 'bench')), hint: sp && r ? [Math.round(T.eff(m, sp, r)), G.ui.fitCls(T.fit(sp, r))] : undefined,
      act: 'mxsel', v: r ? 's:' + k : 'b:' + pl.i, aria: pl.n + ', ' + pl.r + ', valore ' + worth + ', condizione ' + c };
  };
  var bench = club.sq.filter(function (id) { return !inXi[id]; }).map(function (id) { return W.players[id]; }).sort(function (a, b) {
    var sa = subs.indexOf(a.i), sb = subs.indexOf(b.i);
    if (sa >= 0 || sb >= 0) return (sa < 0 ? 99 : sa) - (sb < 0 ? 99 : sb);
    return (G.ROLE_KEYS.indexOf(a.r) - G.ROLE_KEYS.indexOf(b.r)) || (b.o - a.o);
  });
  return { form: m.form, selecting: !!sp, slots: xi.map(function (x, k) { return card(W.players[x.id], x.r, k); }), bench: bench.map(function (pl) { return card(pl, null, -1); }) };
};

// The selected player's sheet (side card on a computer)
/** @param {State} st @param {Npc} pl @returns {string} */
G.ui.mgrPlayerSheet = function (st, pl) {
  var club = st.world.clubs[st.mgr.club], fo = G.ui.formOf(pl.s[5], pl.s[9]);
  return '<div class="phd"><div class="pshirt">' + G.ui.shirt(club, G.ui.initials(pl.n), pl.r === 'POR') + '</div><div><b class="big">' + pl.n + (pl.heir ? ' 🌱' : '') + '</b><div class="muted small">' + G.ui.flag(pl.nt) + ' ' + G.ROLES[pl.r].name + ' · ' + pl.a + ' anni</div></div></div>' +
    G.ui.pRow('Overall', Math.round(pl.o)) + G.ui.pRow('Potenziale', Math.round(pl.p)) + G.ui.pRow('Condizione', G.mgrTeam.cond(st.mgr, pl.i) + '%') + G.ui.sqRows(st, pl) +
    G.ui.pRow('Stagione', pl.s[5] + ' pres · ' + pl.s[6] + ' gol · ' + pl.s[7] + ' ass' + (pl.s[5] ? ' · ' + fo.avg.toFixed(2) : '')) + G.ui.pRow('Contratto', pl.y + (pl.y === 1 ? ' anno · ' : ' anni · ') + pl.w + ' k€/sett.') +
    '<div class="opts" style="margin-top:10px"><a class="btn-like ghost small" href="#sq-' + pl.i + '">Scheda completa</a><button class="ghost small" data-act="mxcancel">Annulla</button></div>';
};

// The formation tab: formations, mode and views above the pitch, the bench below, the selected player aside
/** @param {State} st @returns {string} */
G.ui.mgrFormation = function (st) {
  var m = st.mgr, T = G.mgrTeam, o = G.ui.mgrPitchOpts(st), P = G.ui.pitch(o), club = st.world.clubs[m.club], view = G.ui.sel.pview || 'val', sp = G.ui.mxPlayer(st);
  /** @type {Dict<string>} */ var views = { val: 'Valore', cond: 'Condizione', form: 'Forma' };
  var forms = G.ui.mgrOpts('mform', Object.keys(T.FORMS).reduce(function (x, k) { x[k] = k; return x; }, /** @type {Dict<string>} */ ({})), m.form, function (k) { return T.FORMS[k].d; });
  var head = '<div class="phead">' + forms + '<div><span class="chip">' + (m.mode === 'auto' ? '🤖 Automatica' : '✋ Manuale') + '</span>' +
    (m.mode === 'manual' ? '<button class="ghost small" data-act="mmode" data-v="auto">Torna all’automatica</button> ' : '') + '<span class="chip">Forza XI <b>' + T.str(st).toFixed(1) + '</b></span></div></div>' +
    '<div class="phead"><div class="seg">' + Object.keys(views).map(function (k) { return '<button data-act="pview" data-v="' + k + '" class="' + (view === k ? 'on' : '') + '">' + views[k] + '</button>'; }).join('') + '</div>' +
    '<span class="muted small">Tocca due giocatori per scambiarli</span></div>';
  var fl = G.ui.flash && G.ui.flash.mgr ? '<div class="notice">' + G.ui.flash.mgr + '</div>' : '';
  var bar = sp ? '<div class="selbar">' + G.ui.shirt(club, G.ui.initials(sp.n), sp.r === 'POR') + '<div class="txt"><b>' + sp.n + '</b> · ' + sp.r + ' · ' + Math.round(sp.o) + ' · ' + sp.a + ' anni · condizione ' + T.cond(m, sp.i) + '%<br>' +
    '<span class="muted">Tocca un giocatore in campo: il numero sulla sua carta è quanto renderebbe lì.</span></div><button class="ghost small" data-act="mxcancel">Annulla</button></div>' : '';
  var side = '<div class="card pside"><h3>' + (sp ? 'Giocatore selezionato' : 'Formazione') + '</h3>' + (sp ? G.ui.mgrPlayerSheet(st, sp) : '<p class="muted small">Tocca un giocatore per vedere la sua scheda, poi un altro per scambiarli.</p>') +
    '<h3 style="margin-top:16px">Modulo</h3><div class="muted small">' + m.form + ': ' + T.FORMS[m.form].d + '. ' + (m.mode === 'auto' ? 'In automatico giocano i migliori per il modulo e chi è stanco riposa: scambia due giocatori per passare al manuale.' :
      'In manuale l’undici resta quello che scegli: attento alla condizione, chi gioca sempre si stanca e rende meno.') + ' Fuori ruolo un giocatore perde qualche punto.</div></div>';
  return '<div class="playout"><div class="stack"><div class="card">' + fl + head + P.field + bar + (o.selecting ? G.ui.pitchLegend() : '') + '</div>' +
    '<div class="card"><h3>Panchina · ' + o.bench.length + '</h3>' + P.bench + '</div></div>' + side + '</div>';
};

// ---------- player: the club's most likely XI ----------

/** @param {State} st @returns {{ o: PitchOpts, chance: number, meIn: boolean }} */
G.ui.squadPitchOpts = function (st) {
  var W = st.world, p = st.player, club = W.clubs[p.clubId], S = st.S, slots = G.mgrTeam.slots('4-4-2'), /** @type {number[]} */ at = [], /** @type {number[]} */ rest = [];
  var chance = G.season.startChance(st), meIn = chance >= 0.5, sel = G.ui.sel.px;
  club.xi.forEach(function (id) {
    for (var k = 0; k < 11; k++) if (at[k] === undefined && slots[k] === W.players[id].r) { at[k] = id; return; }
    rest.push(id);
  });
  rest.forEach(function (id) { for (var k = 0; k < 11; k++) if (at[k] === undefined) { at[k] = id; return; } });
  // the user takes the place of the weakest starter of his role when he is more likely to start than not (-1 = the user)
  var wk = -1;
  slots.forEach(function (r, k) { if (r === p.role && at[k] >= 0 && (wk < 0 || W.players[at[k]].o < W.players[at[wk]].o)) wk = k; });
  if (meIn && wk >= 0) at[wk] = -1; else meIn = false;
  var names = G.ui.shortNames(club.sq.map(function (id) { return W.players[id].n; }).concat([p.name]));
  var most = club.sq.reduce(function (x, id) { return Math.max(x, W.players[id].s[5]); }, S.ps.apps) || 1;
  /** @param {number} apps @returns {string} */
  var cls = function (apps) { return apps / most >= 0.6 ? '' : apps / most >= 0.3 ? 'mid' : 'bad'; };
  /** @param {number} id @param {boolean} on @returns {PitchCard} */
  var card = function (id, on) {
    if (id < 0) {
      var fo = G.ui.formOf(S.ps.rN, S.ps.rSum);
      return { club: club, name: names[p.name], ini: G.ui.initials(p.name), r: p.role, val: p.ovr, bar: S.ps.apps / most * 100, barCls: cls(S.ps.apps), me: true, cap: p.captain === club.id,
        form: p.form >= 1 ? 'up2' : p.form >= 0.3 ? 'up' : p.form <= -0.3 ? 'dn' : 'eq', glow: fo.glow, sel: sel === 'me', act: 'pxsel', v: 'me', aria: p.name + ' (tu), ' + p.role + ', overall ' + p.ovr };
    }
    var pl = W.players[id], f = G.ui.formOf(pl.s[5], pl.s[9]);
    return { club: club, name: names[pl.n], ini: G.ui.initials(pl.n), r: pl.r, val: Math.round(pl.o), bar: pl.s[5] / most * 100, barCls: cls(pl.s[5]), form: f.f, glow: f.glow,
      off: on && pl.r !== slots[at.indexOf(id)], sel: sel === String(id), act: 'pxsel', v: String(id), aria: pl.n + ', ' + pl.r + ', overall ' + Math.round(pl.o) + ', ' + pl.s[5] + ' presenze' };
  };
  var bench = club.sq.filter(function (id) { return at.indexOf(id) < 0; }).sort(function (a, b) { var x = W.players[a], y = W.players[b]; return (G.ROLE_KEYS.indexOf(x.r) - G.ROLE_KEYS.indexOf(y.r)) || (y.o - x.o); });
  if (!meIn) bench.unshift(-1);
  return { chance: chance, meIn: meIn, o: { form: '4-4-2', slots: at.map(function (id) { return card(id, true); }), bench: bench.map(function (id) { return card(id, false); }) } };
};

// The 👥 Squad tab of the playing career: the pitch, to look at; a tap shows the player's numbers
/** @param {State} st @returns {string} */
G.ui.squadPitch = function (st) {
  var x = G.ui.squadPitchOpts(st), P = G.ui.pitch(x.o), W = st.world, p = st.player, S = st.S, sel = G.ui.sel.px, club = W.clubs[p.clubId], pl = sel && sel !== 'me' ? W.players[+sel] : null;
  if (pl && pl.c !== club.id) pl = null;
  var me = sel === 'me', avg = S.ps.rN ? (S.ps.rSum / S.ps.rN).toFixed(2) : '-';
  var info = me ? '<div class="phd"><div class="pshirt">' + G.ui.shirt(club, G.ui.initials(p.name), p.role === 'POR') + '</div><div><b class="big">' + p.name + ' (tu)</b><div class="muted small">' + G.ROLES[p.role].name + ' · ' + p.age + ' anni</div></div></div>' +
      G.ui.pRow('Overall', p.ovr) + G.ui.pRow('Titolare', Math.round(x.chance * 100) + '% delle partite') + G.ui.pRow('Stagione', S.ps.apps + ' pres · ' + S.ps.goals + ' gol · ' + S.ps.assists + ' ass · ' + avg) + G.ui.pRow('Contratto', p.contract.years + (p.contract.years === 1 ? ' anno · ' : ' anni · ') + p.contract.role) :
    pl ? '<div class="phd"><div class="pshirt">' + G.ui.shirt(club, G.ui.initials(pl.n), pl.r === 'POR') + '</div><div><b class="big">' + pl.n + '</b><div class="muted small">' + G.ui.flag(pl.nt) + ' ' + G.ROLES[pl.r].name + ' · ' + pl.a + ' anni</div></div></div>' +
      G.ui.pRow('Overall', Math.round(pl.o)) + G.ui.pRow('Stagione', pl.s[5] + ' pres · ' + pl.s[6] + ' gol · ' + pl.s[7] + ' ass' + (pl.s[5] ? ' · ' + (pl.s[9] / pl.s[5]).toFixed(2) : '')) + G.ui.pRow('Contratto', pl.y + (pl.y === 1 ? ' anno' : ' anni')) : '';
  var note = '<p class="muted small">È la formazione più probabile: il mister cambia qualcosa a ogni partita.' + (x.meIn ? '' : ' <b>Sei in panchina: titolare nel ' + Math.round(x.chance * 100) + '% delle partite.</b>') + '</p>';
  var bar = info ? '<div class="selbar"><div class="txt">' + info + '</div><button class="ghost small" data-act="pxsel" data-v="' + sel + '">Chiudi</button></div>' : '';
  return '<div class="playout"><div class="stack"><div class="card"><h3>Formazione tipo · 4-4-2</h3>' + P.field + note + bar + '</div>' +
    '<div class="card"><h3>Panchina · ' + x.o.bench.length + '</h3>' + P.bench + '</div></div>' +
    '<div class="card pside"><h3>' + (info ? 'Giocatore' : 'Formazione tipo') + '</h3>' + (info || '<p class="muted small">Tocca un giocatore per vedere i suoi numeri. La barra in basso sulle carte sono le presenze rispetto al compagno che ne ha di più.</p>') + '</div></div>';
};

// Esc cancels the selection
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && G.ui.sel.mx && G.state) { G.ui.sel.mx = null; G.ui.render(); } });
