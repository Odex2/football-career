// @ts-check
// The bench before and after a match (M8 phase C): the pre-match card (opponent, form, key player, our XI, the advice,
// the next European match) and the report of the last match (ratings of the XI, the man of the match, half time).

/** @param {string} [fm] @returns {string} the last results, oldest first, coloured */
G.ui.formLetters = function (fm) {
  if (!fm) return '<span class="muted">–</span>';
  return '<span class="fml">' + fm.split('').map(function (x) { return '<b class="fm' + x + '">' + x + '</b>'; }).join('') + '</span>';
};

/** @param {State} st @returns {string} */
G.ui.mgrPreMatch = function (st) {
  var S = G.sure(st.S), W = st.world, m = G.mgr.job(st), T = G.mgrTeam, club = W.clubs[m.club], nx = G.ui.mgrNextMatch(st);
  if (!nx || S.block > 4) return '';
  var opp = W.clubs[nx.opp], my = T.str(st), neutral = !!(nx.e && nx.e.rd === 'Finale'), d = my - opp.str + (neutral ? 0 : nx.home ? G.CFG.HOME_ADV : -G.CFG.HOME_ADV);
  var tip = d > 3 ? 'Siete favoriti: una tattica offensiva sfrutta il divario.' : d < -3 ? 'Il ' + opp.name + ' è più forte: chiudersi limita i danni.' : 'Partita equilibrata: la condizione dei titolari può fare la differenza.';
  var key = opp.sq.map(function (id) { return W.players[id]; }).sort(function (a, b) { return b.o - a.o; })[0];
  var tired = T.xi(st).filter(function (x) { return T.cond(m, x.id) < G.CFG.MGR_TEAM.REST_AT; }).length, inj = club.sq.filter(function (id) { return G.mgrSq.inj(m, id); }).length;
  var when = nx.e ? 'Prossima: ' + G.cal.label(G.sure(S.cal), nx.e.d) + ' · ' + G.ui.calComp(nx.e) + ' · ' + (neutral ? 'campo neutro' : nx.home ? 'in casa' : 'in trasferta') : 'Prossima di campionato · ' + (nx.home ? 'in casa' : 'in trasferta');
  // the next European match too, when the next one is not
  var eu = nx.e && !G.CFG.UEFA[nx.e.ck] ? G.cal.upcoming(st, club.id).filter(function (e) { return G.CFG.UEFA[e.ck] && typeof e.opp === 'number'; })[0] : null;
  return '<div class="nextmatch prem">' + G.crest(opp, 34) + '<div class="grow"><div class="muted small">' + when + '</div><b>' + opp.name + '</b> <span class="muted small">forza ' + opp.str.toFixed(1) + ' contro il tuo undici ' + my.toFixed(1) + '</span>' +
    '<div class="small">Forma: ' + G.ui.formLetters(opp.fm) + ' <span class="muted">· la tua</span> ' + G.ui.formLetters(club.fm) + '</div>' +
    (G.mgrRot.on(st) ? '<div class="small">' + G.mgrRot.line(st, nx.opp, G.ui.mgrNextComp(nx)) + '</div>' : '') +
    (key ? '<div class="small">⚠️ Giocatore chiave: ' + key.n + ' (' + key.r + ', ' + Math.round(key.o) + ')</div>' : '') +
    (tired || inj ? '<div class="small">' + (tired ? '⚠️ ' + tired + (tired === 1 ? ' titolare' : ' titolari') + ' sotto ' + G.CFG.MGR_TEAM.REST_AT + ' di condizione' : '') + (tired && inj ? ' · ' : '') + (inj ? '🚑 ' + inj + (inj === 1 ? ' infortunato' : ' infortunati') : '') + '</div>' : '') +
    '<div class="small">🧠 Stile: ' + G.mgrTac.generic(W, opp) + '</div>' +  // the generic style (M9 S6)
    '<div class="small">' + tip + '</div>' +
    (eu ? '<div class="small muted">Prossima in ' + eu.name + ': ' + W.clubs[/** @type {ClubId} */ (eu.opp)].name + ' · ' + G.cal.label(G.sure(S.cal), eu.d) + '</div>' : '') + '</div></div>';
};

// The last match of the managed club, with the ratings of the XI
/** @param {State} st @returns {string} */
G.ui.mgrLastMatch = function (st) {
  var S = G.sure(st.S), W = st.world, club = W.clubs[G.mgr.job(st).club], mine = /** @param {MatchRow} r */ function (r) { return !!r.mgr; };
  var r = S.blockRows.filter(mine).slice(-1)[0] || (S.rows || []).filter(mine).slice(-1)[0];
  if (!r || !r.rt || !r.xi) return '';
  var opp = W.clubs[/** @type {ClubId} */ (r.opp)], cls = r.gf > r.ga ? 'r-good' : r.gf < r.ga ? 'r-bad' : 'r-mid';
  var score = r.home ? club.name + ' <b class="' + cls + '">' + r.gf + '-' + r.ga + '</b> ' + opp.name : opp.name + ' <b class="' + cls + '">' + r.ga + '-' + r.gf + '</b> ' + club.name;
  var rt = r.rt, list = r.xi.map(function (id, k) { return { n: W.players[id].n, r: rt[k] }; }).sort(function (a, b) { return b.r - a.r; });
  var chips = list.map(function (x) {
    var mom = r.mom && r.mom.n === x.n;
    return '<span class="rtc' + (x.r >= 7 ? ' r-good' : x.r < 6 ? ' r-bad' : '') + '">' + (mom ? '⭐ ' : '') + G.squads.sur(x.n) + ' <b>' + x.r.toFixed(1) + '</b></span>';
  }).join('');
  return '<div class="lastm"><div class="small"><span class="muted">Ultima partita · ' + r.comp + (r.rd ? ' · ' + r.rd : '') + ':</span> ' + score + '</div>' +
    (r.sc && r.sc.length ? '<div class="small muted">⚽ ' + r.sc.join(', ') + '</div>' : '') +
    (r.live ? '<div class="small muted">⏱️ In diretta: ' + G.sure(r.ht)[0] + '-' + G.sure(r.ht)[1] + ' all’intervallo, poi ' + r.lv + '</div>' : '') + '<div class="rtl">' + chips + '</div></div>';
};

// The competition of the next match, as the engine will play it (for the turnover's line)
/** @param {{ opp: ClubId, home: boolean, e?: CalEntry }} nx @returns {MatchComp} */
G.ui.mgrNextComp = function (nx) {
  return nx.e ? G.mgrRot.comp(nx.e) : { name: '', lg: true, ck: 'lg' };
};
