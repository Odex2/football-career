// @ts-check
// UI of the coaches' market (M9 S2, js/mgr-jobs.js): the 🧭 Panchine tab (contract, open benches, the clubs that
// follow the manager), what each offer says, the screen without a job with "⏩ Aspetta offerte".

// The days left before a day of the career (G.mgrJobs.now)
/** @param {State} st @param {number} until @returns {string} */
G.ui.daysLeft = function (st, until) {
  var d = until - G.mgrJobs.now(st);
  return Math.floor(until / 1000) !== Math.floor(G.mgrJobs.now(st) / 1000) ? 'fino all’Estate' : d <= 0 ? 'ultimo giorno' : d === 1 ? '1 giorno' : d + ' giorni';
};

// How a club follows the manager, in words and on a meter
/** @param {number} i @returns {string} */
G.ui.interestText = function (i) { return i >= 80 ? 'ti vuole' : i >= 70 ? 'ti segue con attenzione' : i >= 60 ? 'ti segue' : i >= 45 ? 'ti tiene d’occhio' : 'non ti segue'; };

// What an offer says, to compare them: interest, wage, years, budget, patience; mid-season the deadline and the release
/** @param {State} st @param {MgrOffer} o @returns {string} */
G.ui.offerFacts = function (st, o) {
  var W = st.world, club = W.clubs[o.club], M = G.CFG.MGR, J = G.CFG2.MGR_JOBS, k = o.perks;
  var wage = Math.round(G.squads.wage(G.mgr.rep(st) + 8, club) * 0.7), years = club.rep >= J.LONG_REP ? J.YEARS + 1 : J.YEARS;
  var rel = o.rel === 'free' ? '✅ il tuo club ti lascia andare' : o.rel === 'fee' ? '💶 il tuo club ti libera se il ' + club.name + ' paga ' + o.fee + ' M€' : o.rel === 'no' ? '⛔ il tuo club non ti libera: per andare devi dimetterti' : '';
  return '<div class="small">Interesse <b>' + (o.int !== undefined ? o.int : G.mgrJobs.interest(st, club)) + '</b> · ' + years + ' anni a ' + wage + ' k€/sett. · budget ' + Math.round(club.bud + (k ? G.mgr.budBonus(club, k) : 0)) + ' M€ · pazienza ' + (M.CONF0 + (k ? k.pat : 0)) + '</div>' +
    G.ui.idtLine(st, club) + G.ui.boardLine(st, club, o) + (o.until !== undefined ? '<div class="small muted">⏳ Risposta entro: ' + G.ui.daysLeft(st, o.until) + (rel ? ' · ' + rel : '') + '</div>' : '');
};

// The club's identity (M9 S3) and how far the manager's style is from it
/** @param {State} st @param {Club} club @returns {string} */
G.ui.idtLine = function (st, club) {
  var f = G.mgrId.fit(st, club);
  return '<div class="small">Identità ' + G.mgrId.chips(st.world, club) + ' <span class="muted">· ' + (f > 0 ? 'in linea con il tuo stile' : f < 0 ? 'lontana dal tuo stile' : 'il tuo stile non dice ancora niente') + '</span></div>';
};

// The board of a club that offers a job (M9 S4): president, expectations, the pact of the first season
/** @param {State} st @param {Club} club @param {MgrOffer} o @returns {string} */
G.ui.boardLine = function (st, club, o) {
  var L = G.CFG2.PACT.LV[o.pact || 'norm'], e = Math.round(club.exp || 0), pk = G.mgrPact.pres(club);
  var bud = Math.round(Math.max(0, club.bud) * (1 + (L.bud > 0 && pk === 'acc' ? L.bud / 2 : L.bud)));
  return '<div class="small">🏛️ Presidente ' + G.mgrPact.PRES[pk][0] + (e ? ' · aspettative ' + (e > 0 ? '+' : '') + e + (e > 0 ? ': chiede ' + e + ' posizioni in più' : '') : '') +
    ' · patto ' + G.mgrPact.LV[o.pact || 'norm'] + (o.pact ? ' (dal colloquio)' : '') + ': ti danno circa ' + bud + ' M€' + (L.sh > 0 ? ' ma vogliono ' + L.sh + (L.sh === 1 ? ' posizione' : ' posizioni') + ' più in alto' : L.sh < 0 ? ', obiettivo più facile' : '') + '</div>';
};

// The interview (M10.4): 2 or 3 questions, the answers only in G.ui.iv until the application is sent
/** @param {State} st @param {Club} club @returns {string} */
G.ui.interview = function (st, club) {
  var iv = G.sure(G.ui.iv), qs = G.mgrId.questions(st.world, club), all = qs.every(function (q) { return iv.a[q.k]; });
  return '<div class="notice" style="margin-top:6px">🗣️ Il ' + club.name + ' è interessato e ti chiama per un colloquio. Le risposte in linea con la sua identità alzano la probabilità.' +
    qs.map(function (q) {
      return '<div style="margin-top:6px"><b>' + q.q + '</b><div class="row small">' + q.o.map(function (o) { return G.ui.btn('mjans', q.k + ':' + o[0], o[1], iv.a[q.k] === o[0] ? '' : 'ghost'); }).join('') + '</div></div>';
    }).join('') + '<div class="row" style="margin-top:8px">' + (all ? G.ui.btn('mjsend', club.id, '✉️ Invia la candidatura') : '<span class="muted small">Rispondi a tutte le domande</span>') + '</div></div>';
};

// The contract: years, wage, the renewal on the table, the resignation
/** @param {State} st @returns {string} */
G.ui.mgrContract = function (st) {
  var m = G.mgr.job(st), c = m.contract, J = G.CFG2.MGR_JOBS, r = m.renew;
  var h = c ? '<p>Contratto: <b>' + c.years + (c.years === 1 ? ' anno' : ' anni') + '</b> a <b>' + c.wage + ' k€/sett.</b>' + (c.free ? ' · a scadenza sei libero' : '') + '</p>' : '<p class="muted">Nessun contratto scritto (carriera iniziata prima delle panchine): stipendio ' + G.mgr.wage(st) + ' k€/sett.</p>';
  if (r) h += '<div class="notice">✍️ La società ti offre il rinnovo: <b>' + r.years + ' anni a ' + r.wage + ' k€/sett.</b><div class="row" style="margin-top:6px">' +
    G.ui.btn('mrenew', 'yes', 'Accetta') + G.ui.btn('mrenew', 'more', 'Chiedi di più (' + Math.round(J.ASK_P * 100) + '%: +' + Math.round(J.ASK_UP * 100) + '%)', 'ghost') + G.ui.btn('mrenew', 'no', 'Lascia correre', 'ghost') + '</div></div>';
  return h + '<p class="muted small">Esonerato, ricevi metà dei soldi che restano del contratto. Dimettendoti non ricevi niente e perdi ' + J.RESIGN_REP + ' di reputazione (' + J.RESIGN_REP_OK + ' se la stagione va bene).</p>' +
    G.ui.btn('mjresign', '', '🚪 Dimettiti', 'warn');
};

// The open benches: the coach the club picked, the days left, the chance; ✉️ Candidati
/** @param {State} st @returns {string} */
G.ui.mgrBenches = function (st) {
  var W = st.world, m = st.mgr, list = (st.vac || []).filter(function (v) { return !v.held && (!m || v.club !== m.club); });
  if (!list.length) return '<p class="muted">Nessuna panchina aperta. Quando un club esonera l’allenatore o lo perde, la panchina resta aperta qualche giorno.</p>';
  return list.map(function (v) {
    var club = W.clubs[v.club], co = W.coaches[v.co], I = G.mgrJobs.interest(st, club), p = v.app !== undefined ? v.app : G.mgrJobs.chance(st, club);
    return '<div class="offer">' + G.crest(club, 36) + '<div class="grow"><b>' + club.name + '</b> <span class="muted small">' + G.leagueByKey(club.lg).name + ' · forza ' + club.str.toFixed(0) + ' · reputazione ' + club.rep + '</span>' +
      G.ui.idtLine(st, club) + '<div class="small">Tratta con ' + (co ? co.n + ' (' + co.rep + ')' : 'un altro allenatore') + ' · chiude tra ' + G.ui.daysLeft(st, v.until) + ' · interesse per te ' + I + '</div>' +
      '<div class="row small" style="margin-top:6px">' + (v.app !== undefined ? '<span class="chip">✉️ Candidatura inviata · ' + Math.round(p * 100) + '%</span>' :
        G.ui.iv && G.ui.iv.club === v.club ? '' : G.ui.btn('mjapply', v.club, '✉️ Candidati · ' + Math.round(p * 100) + '% di essere scelto')) + '</div>' +
      (G.ui.iv && G.ui.iv.club === v.club && v.app === undefined ? G.ui.interview(st, club) : '') + '</div></div>';
  }).join('') + (G.mgr.active(st) ? '<p class="muted small">Se ti candidi e non ti scelgono, il tuo club lo viene a sapere: −' + G.CFG2.MGR_JOBS.APPLY_CONF + ' di fiducia.</p>' : '');
};

// The clubs that follow the manager most
/** @param {State} st @returns {string} */
G.ui.mgrFollowers = function (st) {
  var W = st.world, m = st.mgr, list = W.clubs.filter(function (c) { return !m || c.id !== m.club; }).map(function (c) { return { c: c, i: G.mgrJobs.interest(st, c) }; })
    .filter(function (x) { return x.i >= 45; }).sort(function (a, b) { return b.i - a.i || b.c.rep - a.c.rep; }).slice(0, 8);
  if (!list.length) return '<p class="muted">Per ora nessun club ti segue: servono risultati o una reputazione più alta.</p>';
  return list.map(function (x) {
    return '<div class="jfol small"><span>' + G.ui.club(x.c.id, 16) + ' <span class="muted">' + G.ui.interestText(x.i) + '</span></span>' + G.ui.meter(x.i, 100) + '<b>' + x.i + '</b></div>';
  }).join('') + '<p class="muted small">A fine stagione ti chiamano i club più grandi, o con più soldi, che arrivano a ' + G.CFG2.MGR_JOBS.CALL + '.</p>';
};

// The 🧭 Panchine tab
/** @param {State} st @returns {string} */
G.ui.mgrJobsTab = function (st) {
  var fl = G.ui.flash && G.ui.flash.mgr ? '<div class="notice">' + G.ui.flash.mgr + '</div>' : '';
  return '<div class="grid">' + G.ui.card('🧭 Panchine aperte', fl + G.ui.mgrBenches(st), 'span3') + G.ui.card('📄 Il tuo contratto', G.ui.mgrContract(st)) +
    G.ui.card('👀 Chi ti segue', G.ui.mgrFollowers(st), 'span2') + '</div>';
};

// Without a job: the offers, the open benches, ⏩ Aspetta offerte
/** @param {State} st @returns {string} */
G.ui.mgrIdle = function (st) {
  var m = G.mgr.job(st), fl = G.ui.flash && G.ui.flash.mgr ? '<div class="notice">' + G.ui.flash.mgr + '</div>' : '';
  return '<div class="card create" style="max-width:900px"><h3>📋 Manager senza squadra</h3>' + fl + G.ui.jobPicker(st) +
    '<div class="row" style="margin-top:10px">' + G.ui.btn('mjwait', '', '⏩ Aspetta offerte (una settimana)') + '</div>' +
    '<p class="muted small">Reputazione ' + m.rep + ' · senza squadra da ' + (m.idle || 0) + ' giorni: ogni tre mesi perdi 1 di reputazione.</p>' +
    '<h3 style="margin-top:16px">🪑 Panchine aperte</h3>' + G.ui.mgrBenches(st) + '<h3 style="margin-top:16px">👀 Chi ti segue</h3>' + G.ui.mgrFollowers(st) + '</div>';
};

// Clicks of the coaches' market; true when handled
/** @param {State} st @param {string} act @param {string} v @returns {boolean|string} */
G.ui.mgrJobsAct = function (st, act, v) {
  if (act === 'mgrjob') { var t = G.mgrJobs.take(st, +v); if (t) G.ui.flash = { mgr: t }; else G.ui.tab = 'panchina'; return true; }
  if (!st.mgr) return false;
  if (act === 'mjapply') {  // an interested club calls for an interview first (M9 S3)
    if (G.mgrId.interview(st, st.world.clubs[+v])) { G.ui.iv = { club: +v, a: {} }; G.ui.flash = null; } else G.ui.flash = { mgr: G.mgrJobs.apply(st, +v) };
    return true;
  }
  if (act === 'mjans' && G.ui.iv) { G.ui.iv.a[v.split(':')[0]] = v.split(':')[1]; return true; }
  if (act === 'mjsend' && G.ui.iv) { G.ui.flash = { mgr: G.mgrJobs.apply(st, +v, G.ui.iv.a) }; G.ui.iv = null; return true; }
  if (act === 'mjwait') { G.mgrJobs.wait(st); return true; }
  if (act === 'mrenew' && G.mgr.active(st)) { G.ui.flash = { mgr: G.mgrJobs.renewAnswer(st, v) }; return true; }
  if (act === 'mjresign' && G.mgr.active(st)) { if (!confirm('Dimettersi? Perdi reputazione e i tifosi la prendono male.')) return 'stop'; G.mgrJobs.resign(st); G.ui.tab = 'panchina'; return true; }
  if (act === 'mjforce') { if (!confirm('Dimettersi per accettare? Perdi reputazione.')) return 'stop'; G.mgrJobs.take(st, +v, true); G.ui.tab = 'panchina'; return true; }
  return false;
};
