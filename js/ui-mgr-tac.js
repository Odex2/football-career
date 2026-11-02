// @ts-check
// The tactic on the 👥 Formazione tab (M9 S6, js/mgr-tactics.js): the tactic of before, the three levers with what each
// value does in % before choosing, the "Intesa tattica" bar, the next opponent's generic style; and their clicks.

/** @param {number} x @returns {string} '+4%' */
G.ui.tacPct = function (x) { return (x > 0 ? '+' : '−') + Math.round(Math.abs(x) * 100) + '%'; };
// What a value of a lever does, from the tables of G.CFG2.TAC: goals scored and conceded against each kind of opponent
/** @param {string} k @param {number} v @returns {string} */
G.ui.tacWhat = function (k, v) {
  var T = G.CFG2.TAC, p = G.ui.tacPct;
  /** @param {number[]} e @param {string} vs */
  var say = function (e, vs) {
    var out = [];
    if (e[0]) out.push(p(e[0]) + ' gol fatti');
    if (e[1]) out.push(p(-e[1]) + ' subiti');
    return out.length ? out.join(', ') + ' ' + vs : '';
  };
  /** @param {string[]} l */
  var join = function (l) { return l.filter(Boolean).join('; ') + '.'; };
  if (v === 1) return 'Medio: nessun effetto, è la scelta del vice.';
  if (k === 'press') { var P = T.PRESS[v]; return join([say(P[0], 'contro chi costruisce corto'), say(P[2], 'contro chi lancia lungo')]) + (v === 2 ? ' Condizione persa a partita +' + Math.round((T.TIRE - 1) * 100) + '%.' : ''); }
  if (k === 'build') { var B = T.BUILD[v]; return join([say(B[2], 'contro il pressing alto'), say(B[0], 'contro il pressing basso'), v === 2 ? p(T.LONG_LOW) + ' gol fatti contro una linea bassa' : '']); }
  var L = T.LINE[v];
  return join([say(L[0], 'contro attaccanti lenti'), say(L[1], 'contro attaccanti veloci')]);
};

/** @param {State} st @returns {string} the "Tattica" section of the formation tab */
G.ui.mgrTactics = function (st) {
  var m = G.mgr.job(st), l = G.mgrTac.lev(m), F = G.CFG2.TAC.FAM, f = Math.round(G.mgrTac.fam(m)), mal = G.mgrTac.malus(m), nx = G.ui.mgrNextMatch(st);
  var levers = Object.keys(G.mgrTac.LEV).map(function (k) {
    var L = G.mgrTac.LEV[k];
    return '<div class="tlev"><div class="small"><b>' + L.n + '</b> · <span class="muted">cambiarla costa ' + F.LEVER + ' di intesa</span></div><div class="seg">' +
      L.v.map(function (n, v) { return '<button data-act="mlev" data-v="' + k + ':' + v + '" class="' + (l[k] === v ? 'on' : '') + '">' + n + '</button>'; }).join('') + '</div>' +
      '<div class="muted small">' + G.ui.tacWhat(k, l[k]) + '</div></div>';
  }).join('');
  var opp = nx ? st.world.clubs[nx.opp] : null;
  return '<h3>Tattica</h3>' + G.ui.mgrOpts('mtactic', G.mgr.TACTIC, m.tactic) + '<div class="muted small">' + G.mgrLife.tacticHint(m) + '</div>' + levers +
    '<div class="small" style="margin-top:8px"><b>Intesa tattica</b> ' + f + '/100' + G.ui.meter(f, 100, f >= F.LOW ? 'var(--good)' : 'var(--bad)') + '</div>' +
    '<div class="muted small">+' + F.GROW + ' a partita con lo stesso modulo e le stesse leve; cambiare una leva −' + F.LEVER + ', il modulo −' + F.FORM + '. Sotto ' + F.LOW + ' la squadra perde fino a ' + String(F.MAL).replace('.', ',') + ' di forza' +
    (mal < 0 ? ' (oggi ' + mal.toFixed(2).replace('.', ',') + ')' : '') + '. I cambi contano alla prossima partita.</div>' +
    (opp ? '<div class="notice small">🧠 ' + opp.name + ': ' + G.mgrTac.generic(st.world, opp) + '</div>' : '');
};

/** @param {State} st @param {string} act @param {string} v @returns {boolean} */
G.ui.mgrTacAct = function (st, act, v) {
  if (act !== 'mlev' || !G.mgr.active(st)) return false;
  var kv = v.split(':');
  G.mgrTac.set(st, kv[0], +kv[1]);
  return true;
};
