// @ts-check
// Persistence: localStorage autosave in two slots (M8 phase G4) plus JSON export/import.

G.save = {
  // slot 1 keeps the key of the saves made before the slots, so they are still there
  KEYS: ['pc_career_v2', 'pc_career_v2_s2'],
  /** the slot of the career being played: 0 or 1 */
  slot: 0,
  /** @param {number} [i] @returns {string} the key of slot i (the current one when not given) */
  key: function (i) { return G.save.KEYS[i === undefined ? G.save.slot : i]; },
  // NPC players (about 12 500) are saved as rows of values instead of objects with keys: half the size
  ABSENT: '~',
  /** @param {any[]} list @returns {{ K: string[], rows: (any[]|null)[] }} */
  pack: function (list) {
    var /** @type {string[]} */ K = [], /** @type {Dict<number>} */ seen = {}, A = G.save.ABSENT;
    list.forEach(function (x) { for (var k in x) if (!seen[k]) { seen[k] = 1; K.push(k); } });
    return { K: K, rows: list.map(function (x) {
      if (!x) return null; // retired players leave a null slot
      return K.map(function (k) {
        var v = x[k];
        if (v === undefined) return A;
        if (Array.isArray(v) && v.length > 2 && v.every(function (n) { return n === 0; })) return { z: v.length };
        return v;
      });
    }) };
  },
  /** @param {{ K: string[], rows: (any[]|null)[] }} P @returns {any[]} */
  unpack: function (P) {
    var A = G.save.ABSENT;
    return P.rows.map(function (r) {
      if (!r) return null;
      var /** @type {Dict<any>} */ x = {};
      P.K.forEach(function (k, i) {
        var v = r[i];
        if (v === A) return;
        if (v && typeof v === 'object' && !Array.isArray(v) && v.z !== undefined) { v = []; for (var j = 0; j < r[i].z; j++) v.push(0); }
        x[k] = v;
      });
      return x;
    });
  },
  /** @param {State} st @returns {string} */
  json: function (st) {
    st.rngState = G.rng.s;
    return JSON.stringify(st, function (k, v) { return k === 'players' && this === st.world ? G.save.pack(v) : v; });
  },
  /** @param {string} s @returns {State} */
  parse: function (s) {
    var st = JSON.parse(s);
    if (st && st.world && st.world.players && !Array.isArray(st.world.players)) st.world.players = G.save.unpack(st.world.players);
    return st;
  },
  /** @param {State} st @returns {boolean} */
  write: function (st) {
    var ok = true;
    try { localStorage.setItem(G.save.key(), G.save.json(st)); } catch (e) { ok = false; console.warn('Salvataggio non riuscito', e); }
    G.save.warn(ok);
    return ok;
  },
  // A failed save must not go unnoticed: a banner offers to export the career to a file
  /** @param {boolean} ok */
  warn: function (ok) {
    if (typeof document === 'undefined') return;
    var el = document.getElementById('save-warn');
    if (ok) { if (el) el.remove(); return; }
    if (el) return;
    el = document.createElement('div'); el.id = 'save-warn'; el.className = 'notice warn save-warn';
    el.innerHTML = '⚠️ <b>Salvataggio non riuscito</b>: lo spazio del browser è pieno o bloccato. Esporta la carriera in un file per non perderla. ' +
      (G.save.info(1 - G.save.slot) ? '<b>Spazio pieno: esporta e cancella l’altro slot</b> (dalla schermata iniziale, 🆕 Nuova). ' : '') +
      '<button onclick="G.save.exportFile(G.state)">⬇️ Esporta</button>';
    document.body.insertBefore(el, document.body.firstChild);
  },
  /** @param {number} [i] @returns {State|null} the career in slot i (the current one when not given) */
  read: function (i) {
    try { var s = localStorage.getItem(G.save.key(i)); return s ? G.save.parse(s) : null; } catch (e) { return null; }
  },
  // What the start screen shows of slot i, without unpacking the players
  /** @param {number} i @returns {SaveSlot|null} */
  info: function (i) {
    try {
      var s = localStorage.getItem(G.save.key(i)), st = s ? JSON.parse(s) : null;
      if (!G.save.valid(st)) return null;
      var p = st.player, id = st.mgr ? st.mgr.club : p.clubId, c = id === null || id === undefined ? null : st.world.clubs[id];
      return { name: p.name, club: c ? c.name : '', year: st.S ? st.S.year : st.year, mgr: !!st.mgr, over: !!st.over };
    } catch (e) { return null; }
  },
  /** @param {State} st @returns {State} */
  restore: function (st) {
    G.rng = G.makeRng(st.rngState || 1);
    G.fixCache = {};
    G.agents.ensure(st);
    G.national.init(st);
    G.mgr.migrate(st);
    if (!st.player.fam && !st.player.mgrOnly) { var p = st.player; p.pos = G.pos.std(p.role, p.foot); p.main = p.pos; p.fam = {}; p.fam[p.pos] = 100; p.famY = {}; }  // M9 S5
    return st;
  },
  /** @param {number} [i] */
  wipe: function (i) { try { localStorage.removeItem(G.save.key(i)); } catch (e) {} },
  /** @param {any} st @returns {boolean} */
  valid: function (st) { return !!st && st.v === 2 && !!st.player && !!st.world && Array.isArray(st.world.clubs); },
  /** @param {State} st */
  exportFile: function (st) {
    var blob = new Blob([G.save.json(st)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'carriera-' + st.player.name.replace(/\W+/g, '_') + '-' + st.year + '.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  },
  /** @param {File} file @param {(err: any, st?: State) => void} done */
  importFile: function (file, done) {
    var r = new FileReader();
    r.onload = function () {
      try {
        var st = G.save.parse(/** @type {string} */ (r.result));
        if (!G.save.valid(st)) throw new Error('File non valido');
        done(null, st);
      } catch (e) { done(e); }
    };
    r.readAsText(file);
  }
};
