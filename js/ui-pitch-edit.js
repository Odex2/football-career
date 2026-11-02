// @ts-check
// The manager's formation tab (M9 S1 M12): a tap selects a player and opens his panel
// (🔁 Sostituisci, ↔️ Sposta, 📄 Scheda, © Capitano, ⏫ Primo cambio); every move shows the Forza XI before and
// after, a move that costs more than BAD points or takes the goalkeeper out of goal asks first, and ↩ Annulla
// brings back the last UNDO formations (G.ui.sel.undo, in memory only). Interface only: the engine is untouched.

G.pe = {};

// ---------- numbers and the formations kept for ↩ Annulla ----------
/** @param {number} x @returns {string} 53,5 */
G.pe.n1 = function (x) { return x.toFixed(1).replace('.', ','); };
/** @param {number} d @returns {string} +0,4 or −2,1 */
G.pe.delta = function (d) { return (d < -0.05 ? '−' : '+') + G.pe.n1(Math.abs(d)); };
/** @param {Npc} pl @returns {string} the surname */
G.pe.sur = function (pl) { return G.squads.sur(pl.n); };
/** @returns {boolean} dragging the cards: on a computer only */
G.pe.fine = function () { return typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches; };

// The XI after a move, as a new list: swap slots a and b, or bench player b into slot a
/** @param {XiSlot[]} xi @param {string} kind @param {number} a @param {number} b @returns {XiSlot[]} */
G.pe.moved = function (xi, kind, a, b) {
  var to = xi.map(function (x) { return { r: x.r, id: x.id }; });
  if (kind === 'swap') { to[a].id = xi[b].id; to[b].id = xi[a].id; } else to[a].id = b;
  return to;
};

/** @param {MgrJob} m @returns {FormSnap} */
G.pe.snap = function (m) {
  var s = /** @type {FormSnap} */ (JSON.parse(JSON.stringify({ xi: m.xi || null, xiForm: m.xiForm, form: m.form, mode: m.mode, bench: m.bench })));
  return s;
};
// The undo list belongs to one career and one club: another one starts it again
/** @param {State} st @returns {FormSnap[]} */
G.pe.undoList = function (st) {
  var sel = G.ui.sel, key = st.seed + ':' + G.mgr.job(st).club;
  if (sel.undoKey !== key) { sel.undoKey = key; sel.undo = []; }
  return sel.undo;
};
/** @param {State} st */
G.pe.push = function (st) {
  var list = G.pe.undoList(st);
  list.push(G.pe.snap(G.mgr.job(st)));
  if (list.length > G.CFG2.PITCH_EDIT.UNDO) list.shift();
};
// ↩ Annulla: the formation before the last change, exactly; false when there is none
/** @param {State} st @returns {boolean} */
G.pe.undo = function (st) {
  var m = G.mgr.job(st), s = G.pe.undoList(st).pop();
  if (!s) return false;
  m.xi = s.xi; m.form = s.form; m.mode = s.mode;
  if (s.xiForm === undefined) delete m.xiForm; else m.xiForm = s.xiForm;
  if (s.bench) m.bench = s.bench; else delete m.bench;
  G.mgrTeam.xi(st);
  return true;
};

// ---------- moves ----------
// Why a move needs a yes ('' = none): the first manual change of an automatic XI, a goalkeeper in or out of goal,
// more than BAD points of Forza XI lost
/** @param {State} st @param {XiSlot[]} xi @param {XiSlot[]} to @param {boolean} manual @returns {string} */
G.pe.why = function (st, xi, to, manual) {
  var m = G.mgr.job(st), W = st.world, T = G.mgrTeam, now = T.strWith(st, xi, m.form), after = T.strWith(st, to, m.form), out = [];
  if (manual && m.mode === 'auto' && !m.askManual) out.push('Passi al manuale: da ora l’undici non cambia più da solo.');
  var worst = -1, loss = 0;
  to.forEach(function (x, k) {
    var pl = W.players[x.id];
    if (x.id === xi[k].id) return;
    if ((x.r === 'POR') !== (pl.r === 'POR')) out.push(G.pe.sur(pl) + (x.r === 'POR' ? ' va in porta.' : ' esce dalla porta.'));
    var was = xi.filter(function (y) { return y.id === x.id; })[0], d = (was ? T.eff(m, pl, was.r) : pl.o) - T.eff(m, pl, x.r);
    if (d > loss) { loss = d; worst = k; }
  });
  if (after < now - G.CFG2.PITCH_EDIT.BAD) {
    var w = worst >= 0 ? W.players[to[worst].id] : null, r = worst >= 0 ? to[worst].r : '';
    out.push((w ? G.pe.sur(w) + ' da ' + G.ROLES[r].name.toLowerCase() + ' rende ' + Math.round(T.eff(m, w, r)) + ' invece di ' + Math.round(w.o) + '. ' : '') +
      'La Forza XI scende da ' + G.pe.n1(now) + ' a ' + G.pe.n1(after) + '.');
  }
  return out.length ? out.join(' ') + ' Confermi?' : '';
};

// A move from the pitch: swap slots a and b, or bench player b into slot a; ok = already confirmed
/** @param {State} st @param {string} kind @param {number} a @param {number} b @param {boolean} [ok] @returns {string} */
G.pe.move = function (st, kind, a, b, ok) {
  var m = G.mgr.job(st), T = G.mgrTeam, W = st.world, sel = G.ui.sel, xi = T.xi(st), to = G.pe.moved(xi, kind, a, b);
  if (kind === 'in' && G.mgrSq.inj(m, b)) { G.ui.flash = { mgr: '🚑 ' + G.pe.sur(W.players[b]) + ' è infortunato: non può giocare.' }; return 'view'; }
  var why = ok ? '' : G.pe.why(st, xi, to, true);
  if (why) { sel.ask = { kind: /** @type {'swap'|'in'} */ (kind), a: a, b: b, t: why, manual: m.mode === 'auto' && !m.askManual }; return 'view'; }
  var now = T.strWith(st, xi, m.form), x = W.players[xi[a].id], y = W.players[kind === 'swap' ? xi[b].id : b];
  G.pe.push(st);
  if (kind === 'swap') T.setSlot(st, b, x.i); else T.setSlot(st, a, y.i);
  G.pe.done(st, (kind === 'swap' ? '↔️ ' + G.pe.sur(x) + ' e ' + G.pe.sur(y) + ' si scambiano' : '🔁 Dentro ' + G.pe.sur(y) + ', fuori ' + G.pe.sur(x)), now);
  return 'keep';
};

// After a change: the message with the Forza XI before and after and ↩ Annulla; the selection closes
/** @param {State} st @param {string} t @param {number} now */
G.pe.done = function (st, t, now) {
  var sel = G.ui.sel;
  G.ui.flash = { mgr: '<span class="toast">' + t + ' · Forza XI ' + G.pe.n1(now) + ' → ' + G.pe.n1(G.mgrTeam.str(st)) + ' <button class="ghost small" data-act="peundo">↩ Annulla</button></span>' };
  sel.mx = null; sel.pmode = null; sel.ask = null; sel.forms = false;
};

// ⏫ Primo cambio: put a bench player among the first SUBS substitutes, or take him out; by = the bench player who
// takes his place among them (🔁 Sostituisci on a first substitute). A manual choice, asked like the others
/** @param {State} st @param {PlayerId} id @param {boolean} [ok] @param {PlayerId} [by] @returns {string} */
G.pe.first = function (st, id, ok, by) {
  var m = G.mgr.job(st), T = G.mgrTeam, W = st.world, club = W.clubs[m.club], cur = T.side(st, club).cameOn, sel = G.ui.sel, xi = T.xi(st);
  var swap = by !== undefined && by >= 0, out = /** @param {PlayerId} i */ function (i) { return G.mgrSq.inj(m, i) || xi.some(function (x) { return x.id === i; }); };
  if (out(id) || (swap && (out(G.sure(by)) || cur.indexOf(id) < 0 || cur.indexOf(G.sure(by)) >= 0))) return 'view';
  if (!ok && m.mode === 'auto' && !m.askManual) { sel.ask = { kind: 'first', a: swap ? G.sure(by) : -1, b: id, t: 'Passi al manuale: da ora l’undici e i primi cambi non cambiano più da soli. Confermi?', manual: true }; return 'view'; }
  var now = T.str(st), on = cur.indexOf(id) < 0;
  G.pe.push(st);
  m.xi = xi.map(function (x) { return { r: x.r, id: x.id }; }); m.xiForm = m.form; m.mode = 'manual';
  if (swap) m.bench = cur.map(function (x) { return x === id ? G.sure(by) : x; });
  else m.bench = on ? [id].concat(cur).slice(0, G.CFG.SUBS) : cur.filter(function (x) { return x !== id; });
  G.pe.done(st, swap ? '🔁 ' + G.pe.sur(W.players[G.sure(by)]) + ' primo cambio al posto di ' + G.pe.sur(W.players[id]) :
    on ? '⏫ ' + G.pe.sur(W.players[id]) + ' è un primo cambio' : '⏬ ' + G.pe.sur(W.players[id]) + ' non è più un primo cambio', now);
  return 'keep';
};

// A tap on a card: in ↔️ Sposta a slot is the place to go, in 🔁 Sostituisci a bench card comes in; otherwise it selects
/** @param {State} st @param {string} v @returns {string} */
G.pe.tap = function (st, v) {
  var sel = G.ui.sel, x = v.split(':'), k = x[0] === 's' ? 'slot' : 'bench', id = +x[1], cur = sel.mx;
  sel.ask = null;
  if (cur && cur.k === k && cur.id === id) { sel.mx = null; sel.pmode = null; return 'view'; }
  if (cur && sel.pmode === 'move' && k === 'slot') return cur.k === 'slot' ? G.pe.move(st, 'swap', cur.id, id) : G.pe.move(st, 'in', id, cur.id);
  if (cur && sel.pmode === 'sub' && cur.k === 'slot' && k === 'bench') return G.pe.move(st, 'in', cur.id, id);
  // 🔁 on a first substitute: a starter comes off for him, or another bench player takes his place among the first
  if (cur && sel.pmode === 'sub' && cur.k === 'bench') return k === 'slot' ? G.pe.move(st, 'in', id, cur.id) : G.pe.first(st, cur.id, false, id);
  sel.mx = { k: k, id: id }; sel.pmode = null;
  return 'view';
};

// A card dropped on another (computer): the same as the taps
/** @param {State} st @param {string} from @param {string} to @returns {string} */
G.pe.drop = function (st, from, to) {
  var f = from.split(':'), t = to.split(':');
  if (f[0] === 's' && t[0] === 's') return f[1] === t[1] ? 'view' : G.pe.move(st, 'swap', +f[1], +t[1]);
  if (f[0] !== t[0]) return f[0] === 's' ? G.pe.move(st, 'in', +f[1], +t[1]) : G.pe.move(st, 'in', +t[1], +f[1]);
  // bench on bench: a first substitute and another bench player change places among the first
  var m = G.mgr.job(st), cur = G.mgrTeam.side(st, st.world.clubs[m.club]).cameOn, a = +f[1], b = +t[1];
  if (a !== b && (cur.indexOf(a) >= 0) !== (cur.indexOf(b) >= 0)) return cur.indexOf(a) >= 0 ? G.pe.first(st, a, false, b) : G.pe.first(st, b, false, a);
  return 'view';
};

// Clicks of the formation tab: 'view' = show only, 'keep' = the XI changed (saved), false = not one of them
/** @param {State} st @param {string} act @param {string} v @returns {string|boolean} */
G.pe.act = function (st, act, v) {
  var sel = G.ui.sel;
  if (act === 'mxcancel') { sel.mx = null; sel.pmode = null; sel.ask = null; return 'view'; }
  if (act.indexOf('pe') !== 0 && act !== 'mxsel' || !G.mgr.active(st)) return false;
  var m = G.mgr.job(st), T = G.mgrTeam, now = T.str(st), a = sel.ask;
  if (act === 'mxsel') return G.pe.tap(st, v);
  if (act === 'pemode') { sel.pmode = sel.pmode === v ? null : v; return 'view'; }
  if (act === 'peforms') { sel.forms = !sel.forms; return 'view'; }
  if (act === 'peaskno') { sel.askNo = !sel.askNo; return 'view'; }
  if (act === 'peno') { sel.ask = null; return 'view'; }
  if (act === 'peok' && a) {
    if (a.manual && sel.askNo) m.askManual = 1;
    sel.ask = null; sel.askNo = false;
    return a.kind === 'first' ? G.pe.first(st, a.b, true, a.a) : G.pe.move(st, a.kind, a.a, a.b, true);
  }
  if (act === 'pesub') return sel.mx && sel.mx.k === 'slot' ? G.pe.move(st, 'in', sel.mx.id, +v) : 'view';
  if (act === 'pefirst') return G.pe.first(st, +v);
  if (act === 'pefsw') return sel.mx && sel.mx.k === 'bench' ? G.pe.first(st, sel.mx.id, false, +v) : 'view';
  if (act === 'peundo') { G.ui.flash = { mgr: G.pe.undo(st) ? '↩ Formazione di prima · Forza XI ' + G.pe.n1(now) + ' → ' + G.pe.n1(T.str(st)) : 'Niente da annullare.' }; sel.mx = null; sel.pmode = null; return 'keep'; }
  if (act === 'peform' && T.FORMS[v] && v !== m.form) { G.pe.push(st); T.setForm(st, v); G.pe.done(st, '📐 Modulo ' + v, now); return 'keep'; }
  if (act === 'peauto' && v !== m.mode) {
    G.pe.push(st);
    if (v === 'auto') { m.mode = 'auto'; delete m.bench; } else { m.xi = T.xi(st).map(function (x) { return { r: x.r, id: x.id }; }); m.xiForm = m.form; m.mode = 'manual'; }
    T.xi(st); G.pe.done(st, v === 'auto' ? '🤖 Formazione automatica' : '✋ Formazione manuale', now);
    return 'keep';
  }
  // ✨ the vice's XI, still manual; 💤 the tired starters rest, the others stay
  if (act === 'pevice' || act === 'perest') {
    var low = G.CFG2.PITCH_EDIT.LOW_COND, keep = act === 'perest' ? T.xi(st).map(function (x) { return T.cond(m, x.id) < low ? /** @type {XiSlot} */ (/** @type {unknown} */ (null)) : x; }) : null;
    G.pe.push(st);
    m.xi = T.auto(st, keep); m.xiForm = m.form; m.mode = 'manual';
    G.pe.done(st, act === 'pevice' ? '✨ L’undici del vice' : '💤 Riposano i titolari stanchi', now);
    return 'keep';
  }
  return false;
};

// ---------- the tab ----------
// The bar on top: formation, Auto / Manuale, the Forza XI and the vice's, ↩ Annulla
/** @param {State} st @returns {string} */
G.pe.bar = function (st) {
  var m = G.mgr.job(st), T = G.mgrTeam, now = T.str(st), vice = T.strWith(st, T.autoFor(st, m.form), m.form), n = G.pe.undoList(st).length, auto = m.mode === 'auto';
  return '<div class="pebar"><button class="ghost small peform" data-act="peforms" aria-expanded="' + !!G.ui.sel.forms + '">📐 ' + m.form + ' ▾</button>' +
    '<div class="pswitch" role="group" aria-label="Formazione automatica o manuale"><button data-act="peauto" data-v="auto" class="' + (auto ? 'on' : '') + '" aria-pressed="' + auto + '">🤖 Auto</button>' +
    '<button data-act="peauto" data-v="manual" class="' + (auto ? '' : 'on') + '" aria-pressed="' + !auto + '">✋ Manuale</button></div>' +
    '<span class="pstr">Forza XI <b>' + G.pe.n1(now) + '</b>' + (!auto && Math.abs(vice - now) >= 0.05 ? ' <span class="muted">· il vice farebbe ' + G.pe.n1(vice) + '</span>' : '') + '</span>' +
    '<button class="ghost small" data-act="peundo"' + (n ? '' : ' disabled') + '>↩ Annulla' + (n ? ' (' + n + ')' : '') + '</button></div>' +
    '<div class="muted small pmodeline">' + (auto ? 'Il vice sceglie i migliori per il modulo e fa riposare chi è stanco, prima di ogni partita.' : 'L’undici resta questo finché non lo cambi.') + '</div>';
};

// The 5 formations with a small pitch, the Forza XI with today's players and the vice's pick
/** @param {State} st @returns {string} */
G.pe.forms = function (st) {
  var m = G.mgr.job(st), T = G.mgrTeam, keys = Object.keys(T.FORMS), str = keys.map(function (f) { return T.strWith(st, T.autoFor(st, f), f); }), best = str.indexOf(Math.max.apply(null, str));
  return '<div class="pforms">' + keys.map(function (f, i) {
    var dots = G.ui.PITCH_POS[f].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="6"/>'; }).join('');
    return '<button class="pfm' + (f === m.form ? ' on' : '') + '" data-act="peform" data-v="' + f + '"><svg viewBox="0 0 100 100" aria-hidden="true">' + dots + '</svg>' +
      '<span><b>' + f + ' · ' + G.pe.n1(str[i]) + '</b>' + (i === best ? ' <span class="chip">⭐ consigliato dal vice</span>' : '') + '<br><span class="muted small">' + T.FORMS[f].d + '</span></span></button>';
  }).join('') + '</div>';
};

// In a manual XI: tired starters, with a button that rests them
/** @param {State} st @returns {string} */
G.pe.warns = function (st) {
  var m = G.mgr.job(st), T = G.mgrTeam, low = G.CFG2.PITCH_EDIT.LOW_COND;
  if (m.mode !== 'manual') return '';
  var tired = T.xi(st).filter(function (x) { return T.cond(m, x.id) < low; }).length, vice = T.strWith(st, T.autoFor(st, m.form), m.form) - T.str(st);
  return (tired ? '<div class="notice warn small">💤 ' + tired + (tired > 1 ? ' titolari sono' : ' titolare è') + ' sotto il ' + low + '% di condizione <button class="small" data-act="perest">Fai riposare</button></div>' : '') +
    (vice >= 0.05 ? '<div class="notice small">✨ Il vice farebbe ' + G.pe.delta(vice) + ' di Forza XI <button class="ghost small" data-act="pevice">Consiglio del vice</button></div>' : '');
};

// The panel of the selected player: what he is, the buttons, and the list of 🔁 Sostituisci; or the question
/** @param {State} st @returns {string} */
G.pe.panel = function (st) {
  var sel = G.ui.sel, a = sel.ask;
  if (a) return '<div class="pask"><p>' + a.t + '</p>' + (a.manual ? '<label class="small"><input type="checkbox" data-act="peaskno"' + (sel.askNo ? ' checked' : '') + '> non chiederlo più</label>' : '') +
    '<div class="row"><button data-act="peok">Ok</button><button class="ghost" data-act="peno">Annulla</button></div></div>';
  var sp = G.ui.mxPlayer(st), mx = sel.mx;
  if (!sp) return '<p class="muted small">Tocca un giocatore per sostituirlo, spostarlo o vedere la sua scheda.</p>';
  var m = G.mgr.job(st), T = G.mgrTeam, W = st.world, club = W.clubs[m.club], xi = T.xi(st), slot = mx.k === 'slot', inj = G.mgrSq.inj(m, sp.i), fo = G.ui.formOf(sp.s[5], sp.s[9]);
  var r = slot ? xi[mx.id].r : sp.r, first = T.side(st, club).cameOn.indexOf(sp.i) >= 0;
  var head = '<div class="phd"><div class="pshirt">' + G.ui.shirt(club, G.ui.initials(sp.n), sp.r === 'POR') + '</div><div><b class="big">' + sp.n + (m.cap === sp.i ? ' ©' : '') + '</b>' +
    '<div class="muted small">' + G.ROLES[sp.r].name + ' · overall ' + Math.round(sp.o) + (slot && sp.r !== r ? ' · da ' + G.ROLES[r].name.toLowerCase() + ' rende ' + Math.round(T.eff(m, sp, r)) : '') +
    ' · condizione ' + T.cond(m, sp.i) + '% · forma ' + G.ui.ARROW[fo.f] + (inj ? ' · 🚑 fuori ' + inj + ' partite' : '') + '</div></div></div>';
  var btn = /** @param {string} act @param {string|number} v @param {string} t @param {boolean} [on] */ function (act, v, t, on) { return '<button class="' + (on ? 'on' : 'ghost') + ' small" data-act="' + act + '" data-v="' + v + '">' + t + '</button>'; };
  var opts = (slot || first ? btn('pemode', 'sub', '🔁 Sostituisci', sel.pmode === 'sub') : '') + (inj || first ? '' : btn('pemode', 'move', slot ? '↔️ Sposta' : '↔️ Metti in campo', sel.pmode === 'move')) +
    (!slot && !inj ? btn('pefirst', sp.i, first ? '⏬ Togli dai primi cambi' : '⏫ Metti tra i primi cambi') : '') + btn('tab', 'squadra', '📄 Scheda') +
    (m.cap === sp.i || !m.sr[sp.i] ? '' : btn('mcap', sp.i, '© Capitano')) +
    // the quick sale of the old squad table (M8): to the best club that can take him, at 90% of his value
    (G.mgr.open(st) && sp.ln === undefined ? btn('msell', sp.i, '💰 Vendi subito (−10%)') : '') + btn('mxcancel', '', '✖');
  var body = '';
  if (sel.pmode === 'move') body = '<p class="muted small">Tocca un posto in campo' + (G.pe.fine() ? ' (o trascina la carta)' : '') + ': su ogni carta la Forza XI dopo lo spostamento, il bordo dice quanto è adatto il ruolo.</p>';
  if (sel.pmode === 'sub' && slot) {
    var now = T.strWith(st, xi, m.form), names = G.ui.shortNames(club.sq.map(function (id) { return W.players[id].n; }));
    var list = club.sq.filter(function (id) { return !xi.some(function (x) { return x.id === id; }) && !G.mgrSq.inj(m, id); }).map(function (id) { return W.players[id]; })
      .sort(function (p, q) { return T.eff(m, q, r) - T.eff(m, p, r); });
    body = '<div class="psubs">' + list.map(function (pl) {
      return '<button class="ghost small" data-act="pesub" data-v="' + pl.i + '"><b>' + names[pl.n] + '</b> · ' + pl.r + ' · ' + Math.round(T.eff(m, pl, r)) + ' · Forza XI ' + G.pe.delta(T.strWith(st, G.pe.moved(xi, 'in', mx.id, pl.i), m.form) - now) + '</button>';
    }).join('') + '</div>';
  }
  if (sel.pmode === 'sub' && first) {
    var nm = G.ui.shortNames(club.sq.map(function (id) { return W.players[id].n; })), cs = T.side(st, club).cameOn, me = sp.i;
    body = '<p class="muted small">Tocca un titolare in campo per farlo entrare al suo posto, o scegli chi lo sostituisce tra i primi cambi:</p><div class="psubs">' +
      club.sq.filter(function (id) { return id !== me && cs.indexOf(id) < 0 && !xi.some(function (x) { return x.id === id; }) && !G.mgrSq.inj(m, id); }).map(function (id) {
        var pl = W.players[id];
        return '<button class="ghost small" data-act="pefsw" data-v="' + id + '"><b>' + nm[pl.n] + '</b> · ' + pl.r + ' · ' + Math.round(pl.o) + '</button>';
      }).join('') + '</div>';
  }
  return head + '<div class="opts">' + opts + '</div>' + body;
};

// The 👥 Formazione tab: the bar, the pitch with its label and legend, the bench in rows, the tactic, the training,
// a link to the whole squad; the panel aside (fixed at the bottom on a phone)
/** @param {State} st @returns {string} */
G.ui.mgrFormation = function (st) {
  var m = G.mgr.job(st), o = G.ui.mgrPitchOpts(st), P = G.ui.pitch(o), view = G.ui.sel.pview || 'val', sel = G.ui.sel, open = !!(sel.ask || G.ui.mxPlayer(st));
  /** @type {Dict<string>} */ var views = { val: 'Valore', cond: 'Condizione', form: 'Forma' };
  /** @type {Dict<string>} */ var what = { val: 'quanto rende in quel posto', cond: 'la condizione in %', form: 'il voto medio della stagione' };
  var fl = G.ui.flash && G.ui.flash.mgr ? '<div class="notice pflash">' + G.ui.flash.mgr + '</div>' : '';
  var tactic = G.ui.mgrTactics(st);  // the tactic and its levers (M9 S6, js/ui-mgr-tac.js)
  var nx = G.mgrRot.on(st) ? G.ui.mgrNextMatch(st) : null, rot = nx ? '<div class="notice small">' + G.mgrRot.line(st, nx.opp, G.ui.mgrNextComp(nx)) + '</div>' : '';
  var main = '<div class="card">' + G.pe.bar(st) + (sel.forms ? G.pe.forms(st) : '') + fl + G.pe.warns(st) + rot +
    '<div class="phead"><span class="plabel">Il numero è: ' + what[view] + '</span><div class="seg">' + Object.keys(views).map(function (k) { return '<button data-act="pview" data-v="' + k + '" class="' + (view === k ? 'on' : '') + '">' + views[k] + '</button>'; }).join('') + '</div></div>' +
    P.field + G.ui.pitchLegend('la condizione, con il numero sotto il ' + G.CFG.MGR_TEAM.REST_AT + '%') + '</div>' +
    '<div class="card"><h3>Panchina · ' + o.bench.length + '</h3>' + P.bench + '</div>' +
    '<div class="card phone">' + tactic + '</div>' +
    '<details class="card ptrain"><summary>🏋️ Allenamento</summary>' + G.ui.mgrTrain(st) + '</details>' +
    '<button class="ghost" data-act="tab" data-v="squadra">🗂️ Vedi tutta la rosa</button>';
  var side = '<div class="card pside' + (open ? ' open' : '') + '"><div class="pepanel">' + G.pe.panel(st) + '</div>' +
    '<div class="desk"><h3 style="margin-top:14px">Modulo</h3><div class="muted small">' + m.form + ': ' + G.mgrTeam.FORMS[m.form].d + '. Fuori ruolo un giocatore perde qualche punto.</div>' + tactic + '</div></div>';
  return '<div class="playout"><div class="stack">' + main + '</div>' + side + '</div>';
};

// Dragging a card onto another (computer only, G.pe.fine): the same move as the taps
if (typeof document !== 'undefined' && document.addEventListener) {
  /** @type {string|null} */
  G.pe.dragged = null;
  /** @param {Event} e @returns {HTMLElement|null} */
  G.pe.cardOf = function (e) { var t = /** @type {HTMLElement|null} */ (e.target); return t && t.closest ? /** @type {HTMLElement|null} */ (t.closest('.pc[data-act="mxsel"], .pb[data-act="mxsel"]')) : null; };
  document.addEventListener('dragstart', function (e) { var el = G.pe.cardOf(e); G.pe.dragged = el ? el.dataset.v || null : null; });
  document.addEventListener('dragover', function (e) { if (G.pe.dragged && G.pe.cardOf(e)) e.preventDefault(); });
  document.addEventListener('drop', function (e) {
    var el = G.pe.cardOf(e), from = G.pe.dragged, st = G.state;
    G.pe.dragged = null;
    if (!el || !from || !st || !G.mgr.active(st)) return;
    e.preventDefault();
    if (G.pe.drop(st, from, el.dataset.v || '') === 'keep') G.save.write(st);
    G.ui.render();
  });
}
