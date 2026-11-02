// @ts-check
// UI of the manager career: job offers, bench (next match, tactic), formation and XI, market, season recap.

/** @param {MgrOffer} o @returns {string} */
G.ui.perksText = function (o) {
  var k = o.perks;
  if (!k) return '';
  return '<div class="small perk">❤️ Tifosi ' + o.fans + '/100' + (o.bandiera ? ' · sei la loro bandiera' : '') + ': società più paziente (+' + k.pat + ' di fiducia), budget +' + G.mgr.budBonus(G.sure(G.state).world.clubs[o.club], k) + ' M€, morale della squadra +' + k.mor + '</div>';
};

/** @param {State} st @returns {string} */
G.ui.jobList = function (st) {
  var W = st.world, list = st.mgrOffers ? st.mgrOffers.list || [] : [];
  if (!list.length) return '<p class="muted">Nessuna proposta.</p>';
  return list.map(function (o, i) {
    var c = W.clubs[o.club], L = G.leagueByKey(c.lg);
    var go = o.rel === 'no' && G.mgr.active(st) ? '<button class="warn" data-act="mjforce" data-v="' + i + '">Dimettiti e accetta</button>' : '<button data-act="mgrjob" data-v="' + i + '">Accetta</button>';
    return '<div class="offer' + (o.perks ? ' loved' : '') + '">' + G.crest(c, 44) + '<div class="grow"><b>' + c.name + '</b> <span class="muted small">' + L.name + ' · forza ' + c.str.toFixed(0) + ' · reputazione ' + c.rep + '</span>' +
      '<div class="small">Rosa di ' + c.sq.length + ' giocatori</div>' + G.ui.offerFacts(st, o) + G.ui.perksText(o) +
      '<div class="row small" style="margin-top:6px">' + go + '</div></div></div>';
  }).join('');
};

/** @param {State} st @returns {string} */
G.ui.jobPicker = function (st) {
  var why = st.mgrOffers ? st.mgrOffers.why : 'start';
  var intro = /** @type {Dict<string>} */ ({ start: st.player.mgrOnly ? 'Ecco i club che cercano un manager del tuo livello. Scegli da dove partire.' :
      'Appesi gli scarpini, il calcio ti cerca ancora. I club i cui tifosi ti amano chiamano per primi e ti danno più tempo, più soldi e una squadra più motivata.',
    sacked: 'Sei stato esonerato. Ecco chi ti vuole adesso.', calls: 'Il tuo lavoro è stato notato: questi club ti offrono un posto più importante. Se rifiuti resti dove sei.',
    free: 'Sei libero. Ecco chi ti vuole adesso; puoi anche aspettare altre offerte o candidarti a una panchina aperta.',
    mid: 'Un club ha esonerato l’allenatore e vuole te, subito. L’offerta scade presto: se non rispondi, resti dove sei.',
    vacancy: 'Il club a cui ti sei candidato ha scelto te. Rispondi prima che scada.' })[why] || '';
  return '<p>' + intro + '</p><p class="muted small">Da manager scegli modulo, formazione e tattica, e fai il mercato con il budget della società. Reputazione attuale: <b>' + G.mgr.rep(st) + '</b>.</p>' + G.ui.jobList(st);
};

// Card on the end screen of the playing career
/** @param {State} st @returns {string} */
G.ui.secondCareerCard = function (st) {
  var m = st.mgr;
  if (m && m.done) return G.ui.card('📋 La carriera da manager', G.ui.mgrSummary(st), 'span3');
  if (st.player.age >= G.CFG.MGR.MAX_AGE - 5) return '';
  if (!st.mgrOffers) return G.ui.card('📋 La carriera da manager', '<p>Il calcio non è finito: puoi ricominciare da manager, in panchina e sul mercato.</p>' +
    '<div class="row"><button class="big" data-act="mgrgo">Diventa manager</button></div>', 'span3');
  return G.ui.card('📋 La carriera da manager', G.ui.jobPicker(st), 'span3');
};

/** @param {State} st @returns {string} */
G.ui.mgrSummary = function (st) {
  var m = G.mgr.job(st);
  var rows = m.hist.map(function (h) {
    return '<tr><td>' + G.season.label(h.year) + '</td><td>' + G.ui.club(h.clubId, 16) + '</td><td class="muted small">' + (G.mgr.ROLE[h.role] || 'Manager') + '</td><td class="muted small">' + h.lg + '</td>' +
      '<td class="num">' + (h.pos ? h.pos + 'º' : '-') + '</td><td class="num muted">' + (h.tgt ? h.tgt + 'º' : '-') + '</td><td class="small">' + h.won.map(function (t) { return G.ui.troTag(t); }).join(' ') + '</td><td class="small muted">' + h.note + '</td></tr>';
  }).join('');
  return '<div class="kpis">' + G.ui.kpi(m.seasons, 'Stagioni') + G.ui.kpi(m.trophies.length, 'Trofei') + G.ui.kpi(m.jobs, 'Club') + G.ui.kpi(m.sacked, 'Esoneri') + G.ui.kpi(m.rep, 'Reputazione') + '</div>' +
    (m.trophies.length ? '<div>' + G.ui.grouped(m.trophies, '🏆') + '</div>' : '') +
    '<div class="scroll"><table><tr><th>Stagione</th><th>Club</th><th>Ruolo</th><th>Lega</th><th class="num">Pos</th><th class="num">Obiettivo</th><th>Trofei</th><th></th></tr>' +
    (rows || '<tr><td colspan="8" class="muted">Ancora nessuna stagione.</td></tr>') + '</table></div>';
};

/** @param {State} st @returns {string} */
G.ui.mgrHero = function (st) {
  var p = st.player, m = G.mgr.job(st), S = G.sure(st.S), C = G.CFG, club = st.world.clubs[m.club], L = G.leagueByKey(club.lg);
  var blocks = C.BLOCKS.map(function (b, i) { return i < 5 || S.tours ? '<span class="' + (i < S.block ? 'done' : i === S.block ? 'cur' : '') + '">' + C.BLOCK_ICONS[i] + ' ' + b + '</span>' : ''; }).join('');
  var confCol = m.conf >= 50 ? 'var(--good)' : m.conf >= 25 ? 'var(--mid)' : 'var(--bad)';
  // on a phone the other tabs get a compact header, so the formation's pitch starts on the first screen (M9 S1)
  return '<div class="card hero' + (G.ui.tab !== 'panchina' ? ' compact' : '') + '">' + G.crest(club, 56) + '<div class="ovr">' + m.rep + '<small>REPUTAZIONE</small></div>' +
    '<div><h2>' + p.name + ' <span class="muted">' + G.ui.flag(p.nat) + '</span></h2><div class="muted">Manager · ' + p.age + ' anni</div>' +
    '<div>' + club.name + ' · ' + L.name + ' <span class="idtc">' + G.mgrId.chips(st.world, club) + '</span>' + (m.perks && m.perks.pat ? ' <span class="chip cap">❤️ i tifosi ti amano</span>' : '') + (m.shirt === m.club ? ' <span class="chip cap">👕 maglia ritirata</span>' : '') + '</div>' +
    '<div class="muted">Obiettivo: <b>' + m.obj.txt + '</b>' + (m.pos ? ' · ora ' + m.pos + 'º' : '') + '</div></div>' +
    '<div class="mini"><div>Sicurezza del posto ' + Math.max(0, m.conf) + G.ui.meter(Math.max(0, m.conf), 100, confCol) + '</div><div>Morale della squadra ' + m.morale + G.ui.meter(m.morale) + '</div>' +
    '<div class="muted">💶 ' + G.ui.money(p.money) + ' · stipendio ' + G.mgr.wage(st) + ' k€/sett.</div></div>' +
    '<div class="blocks"><span class="muted" style="background:none">Stagione ' + G.season.label(S.year) + ' · ' + (m.seasons + 1) + 'ª da manager</span>' + blocks + '</div></div>';
};

// Next match of the managed club: { opp, home, e } (e: the calendar entry, with its date) or null
/** @param {State} st @returns {{ opp: ClubId, home: boolean, e?: CalEntry }|null} */
G.ui.mgrNextMatch = function (st) {
  var S = G.sure(st.S), club = st.world.clubs[G.mgr.job(st).club], lg = S.lg[club.lg], fx = G.season.fixtures(S, club.lg);
  if (S.cal) {
    var e = G.cal.upcoming(st, club.id).filter(function (x) { return typeof x.opp === 'number'; })[0];
    return e ? { opp: /** @type {ClubId} */ (e.opp), home: !!e.home, e: e } : null;
  }
  for (var md = lg.md; md < fx.length; md++) for (var i = 0; i < fx[md].length; i++) {
    var m = fx[md][i];
    if (m[0] === club.id || m[1] === club.id) return { opp: m[0] === club.id ? m[1] : m[0], home: m[0] === club.id };
  }
  return null;
};

/** @param {string} key @param {Dict<string>} map @param {string} cur @param {(k: string) => string} [title] @returns {string} */
G.ui.mgrOpts = function (key, map, cur, title) {
  return '<div class="opts">' + Object.keys(map).map(function (k) { return '<button data-act="' + key + '" data-v="' + k + '" class="' + (cur === k ? 'on' : 'ghost') + '"' + (title ? ' title="' + title(k) + '"' : '') + '>' + map[k] + '</button>'; }).join('') + '</div>';
};

/** @param {State} st @returns {string} */
G.ui.mgrPlan = function (st) {
  var m = G.mgr.job(st), S = G.sure(st.S), W = st.world, h = '', b = S.block, T = G.mgrTeam;
  if (G.ui.flash && G.ui.flash.mgr) h += '<div class="notice">' + G.ui.flash.mgr + '</div>';
  if (st.eventResult) h += '<div class="notice">🗒️ <b>' + st.eventResult.t + '</b>: ' + st.eventResult.r + '</div>';
  if (m.conf < 25) h += '<div class="notice warn">⚠️ La società sta perdendo la pazienza: senza risultati arriva l’esonero.</div>';
  h += G.ui.mgrNtNote(st) + G.ui.mgrReqNotes(st) + G.ui.mgrDealNotes(st) + G.ui.mgrYouthNotes(st);
  if (st.mgrOffers && st.mgrOffers.why === 'calls') h += '<div class="notice clickable" data-act="tab" data-v="offerte">📨 Altri club ti cercano: guarda le offerte.</div>';
  if (m.renew) h += '<div class="notice clickable" data-act="tab" data-v="panchine">✍️ La società ti offre il rinnovo: ' + m.renew.years + ' anni a ' + m.renew.wage + ' k€/sett. Rispondi in 🧭 Panchine.</div>';
  if (st.mgrOffers && (st.mgrOffers.why === 'mid' || st.mgrOffers.why === 'vacancy')) h += '<div class="notice clickable" data-act="tab" data-v="offerte">📨 Un club ti vuole adesso: guarda l’offerta prima che scada.</div>';
  if (G.mgr.open(st)) h += '<div class="notice clickable" data-act="tab" data-v="mercato">💼 Il mercato è aperto: hai ' + Math.round(W.clubs[m.club].bud) + ' M€ da spendere.</div>';
  h += G.ui.societyLine(st);  // the board in one line (M9 S4: the goals are in 🏛️ Società)
  var pre = G.ui.mgrPreMatch(st);  // the pre-match card (js/ui-mgr-live.js)
  h += pre;
  // modulo and tactic are changed on the formation tab (M9 S1)
  h += '<div class="notice clickable" data-act="tab" data-v="rosa">📐 Modulo <b>' + m.form + '</b> · tattica <b>' + G.mgr.TACTIC[m.tactic || 'bal'] + '</b> · formazione ' + (m.mode === 'manual' ? 'scelta da te' : 'automatica') +
    ' <span class="muted small">· cambiali in 👥 Formazione</span></div>';
  h += G.mgrLife.heirLine(st);
  var rows = S.blockRows.filter(function (r) { return r.mgr; }).slice(-6).reverse().map(function (r) {
    var res = r.gf > r.ga ? 'r-good' : r.gf < r.ga ? 'r-bad' : 'r-mid';
    return '<tr' + (r.derby ? ' class="derby"' : '') + '><td class="muted">' + (r.home ? 'C' : 'T') + '</td><td>' + G.ui.club(/** @type {ClubId} */ (r.opp), 16) + (r.derby ? ' 🔥' : '') + '</td><td class="muted small">' + r.comp + '</td><td class="num ' + res + '"><b>' + r.gf + '-' + r.ga + '</b></td><td class="small muted">' + (G.sure(r.sc).length ? '⚽ ' + G.sure(r.sc).join(', ') : '') + '</td></tr>';
  }).join('');
  var news = (st.news || []).slice(0, 5).map(function (n) { return '<div>' + n.t + '</div>'; }).join('');
  return G.ui.card(G.CFG.BLOCK_ICONS[b] + ' ' + G.CFG.BLOCKS[b] + ' · ' + G.season.label(S.year), h +
    '<div class="row" style="margin-top:8px">' + (pre ? '<button class="big" data-act="mlive">▶ Gioca in diretta</button><button class="ghost" data-act="match">⏩ Simula partita</button>' : '<button class="big" data-act="match">⚽ Prossima partita</button>') + G.ui.skipBtn(st) + '<button class="ghost" data-act="next">' + (S.cur ? '▶ Fine blocco' : '▶ Gioca il blocco') + '</button>' +
    '<button class="ghost" data-act="season">⏩ Simula stagione</button><button class="' + (G.ui.sel.assist ? 'on' : 'ghost') + '" data-act="massist">🤖 Assistente</button>' + '<button class="ghost" data-act="mjresign">🚪 Dimettiti</button>' + (b === 0 && !S.cur ? '<button class="warn" data-act="mretire">Lascia il calcio</button>' : '') + '</div>' +
    G.ui.mgrAssist(st) + G.ui.mgrLastMatch(st) + (rows ? '<div class="matches"><table>' + rows + '</table></div>' : '') + '<div class="log">' + news + '</div>', 'plan');
};

// Formation tab: the pitch and its editing (js/ui-pitch.js, js/ui-pitch-edit.js); the whole squad is in 🗂️ Rosa
/** @param {State} st @returns {string} */
G.ui.mgrSquad = function (st) { return G.ui.mgrFormation(st); };

/** @param {State} st @returns {string} */
G.ui.mgrRecap = function (st) {
  var R = /** @type {MgrRecap} */ (st.recap), W = st.world, club = W.clubs[R.club], ok = R.pos <= R.tgt;
  var badges = R.won.map(function (t) { return '<div class="rc-badge">' + G.tro.icon(t, 24) + ' ' + t + '</div>'; }).join('') +
    (G.sure(st.mgr).awards || []).filter(function (a) { return a.year === R.year; }).map(function (a) { return '<div class="rc-badge gold">' + G.tro.icon(a.name, 24, a.w) + ' ' + a.name + '</div>'; }).join('');
  var verdict = R.sacked ? '<div class="notice warn">🔥 La società ti esonera.</div>' : R.last ? '<div class="notice">👋 È il momento di dire basta: ultima stagione della tua carriera.</div>' :
    '<div class="notice ' + (ok ? 'ach' : 'warn') + '">' + (ok ? '✅ Obiettivo raggiunto' : '❌ Obiettivo mancato') + ': ' + R.obj.toLowerCase() + '. Sicurezza del posto ' + Math.max(0, R.conf) + '/100.</div>';
  return '<div class="recap"><button class="rc-skip" data-act="recap">Continua ▶</button><div class="recap-in">' +
    '<section class="rc-sec"><div class="rc-head">' + G.crest(club, 84) + '<div><div class="muted">Fine stagione ' + G.season.label(R.year) + ' · Manager</div>' +
    '<h1>' + R.pos + 'º in ' + R.lg + '</h1><div class="rc-club">' + club.name + ' · campione ' + W.clubs[R.champion].name + '</div></div></div></section>' +
    '<section class="rc-sec">' + verdict + '<div class="rc-kpis">' + '<div class="rc-kpi"><b>' + R.pos + 'º</b><span>Posizione</span><i>obiettivo ' + R.tgt + 'º</i></div>' +
    '<div class="rc-kpi"><b>' + R.rep[1] + '</b><span>Reputazione</span><i>' + G.recap.delta(R.rep[0], R.rep[1]) + '</i></div>' +
    '<div class="rc-kpi"><b>' + R.won.length + '</b><span>Trofei</span></div></div></section>' +
    (R.goals && R.goals.length ? '<section class="rc-sec"><h4>Gli obiettivi della società · voto ' + Math.round((R.score || 0) * 100) + '/100</h4>' + R.goals.map(function (g) { return '<div class="small">' + G.mgrBoard.ICON[g.st] + ' ' + g.txt + ' <span class="muted">· ' + g.imp + '</span></div>'; }).join('') + '</section>' : '') +
    (badges ? '<section class="rc-sec"><h4>Trofei e premi</h4><div class="rc-badges">' + badges + '</div></section>' : '') +
    '<section class="rc-sec"><h4>Il resto del calcio</h4>' + R.bdo.map(function (e, i) { return '<div class="small">' + ['🥇', '🥈', '🥉'][i] + ' ' + e.n + ' <span class="muted">' + e.club + '</span></div>'; }).join('') + '</section>' +
    '<section class="rc-sec rc-end"><button class="big" data-act="recap">Continua ▶</button></section></div></div>';
};

/** @param {State} st */
G.ui.renderMgr = function (st) {
  var m = G.mgr.job(st);
  if (!G.mgr.active(st)) { $('#app').innerHTML = G.ui.mgrIdle(st); G.ui.flash = null; return; }
  var tabs = [['panchina', '📋 Panchina'], ['rosa', '👥 Formazione'], ['squadra', '🗂️ Rosa'], ['vivaio', '🌱 Vivaio'], ['campionati', '📊 Campionati'], ['calendario', '📅 Calendario'], ['europa', '🌍 Europa'], ['mercato', '💼 Mercato' + (G.mgr.open(st) ? ' •' : '')], ['societa', '🏛️ Società' + (G.mgrPact.open(st) || (G.mgr.job(st).breq && !G.sure(G.mgr.job(st).breq).acc) ? ' •' : '')]]
    .concat(st.mgrOffers ? [['offerte', '📨 Offerte']] : []).concat([['panchine', '🧭 Panchine'], ['bacheca', '🏆 Bacheca'], ['carriera2', '📜 Carriera']]);
  if (!tabs.some(function (t) { return t[0] === G.ui.tab; })) G.ui.tab = 'panchina';
  var bar = '<nav class="tabs">' + tabs.map(function (t) { return '<button data-act="tab" data-v="' + t[0] + '" class="' + (G.ui.tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</nav>';
  var body = /** @type {Dict<() => string>} */ ({
    panchina: function () { return '<div class="grid two"><div class="stack">' + G.ui.mgrPlan(st) + (G.ui.mgrPreview(st) || '') + G.ui.nextCard(st) + G.ui.cupCard(st, m.club) + G.ui.euroCard(st, m.club) + '</div>' + G.ui.tableCard(st) + '</div>'; },
    rosa: function () { return G.ui.mgrSquad(st); }, squadra: function () { return G.ui.mgrRosa(st); }, vivaio: function () { return G.ui.mgrYouth(st); },
    campionati: function () { return G.ui.leagueTab(st); }, calendario: function () { return G.ui.calendarTab(st); }, europa: function () { return G.ui.euroTab(st); },
    mercato: function () { return G.ui.mgrMarket(st); }, societa: function () { return G.ui.societyTab(st); }, bacheca: function () { return G.ui.cabinetTab(st); }, panchine: function () { return G.ui.mgrJobsTab(st); },
    offerte: function () { return '<div class="grid">' + G.ui.card('Offerte', G.ui.jobPicker(st) + '<button class="ghost" data-act="mstay">Resto qui</button>', 'span3') + '</div>'; },
    carriera2: function () { return '<div class="grid">' + G.ui.card('Da manager', G.ui.mgrNtLine(st) + G.ui.mgrSummary(st), 'span3') + (st.player.mgrOnly ? '' : G.ui.card('Da giocatore', '<div class="scroll">' + G.ui.historyTable(st.player) + '</div>', 'span3')) + '</div>'; }
  })[G.ui.tab];
  $('#app').innerHTML = G.ui.mgrHero(st) + bar + body() + (st.recap ? G.ui.mgrRecap(st) : st.event ? G.ui.eventModal(st) : '');
  G.ui.flash = null;
};

// Click actions of the manager career; returns true when handled
/** @param {State} st @param {string} act @param {string} v @param {string} w @returns {boolean|string} */
G.ui.mgrAct = function (st, act, v, w) {
  if (act === 'mgrgo') { if (!st.mgrOffers) G.mgr.offerSet(st, 'start'); return true; }
  var jobs = G.ui.mgrJobsAct(st, act, v);  // the coaches' market (js/ui-mgr-jobs.js), offers included
  if (jobs) return jobs;
  if (!st.mgr) return false;
  if (act === 'mtactic') { st.mgr.tactic = v; return true; }
  if (act === 'mform') { G.mgrTeam.setForm(st, v); return true; }
  if (act === 'mmode') { st.mgr.mode = v; G.mgrTeam.xi(st); return true; }
  if (act === 'match' && G.mgr.active(st)) { G.game.next(st, false, true); return true; }
  if (act === 'mlive' && G.mgr.active(st)) { st.mgrLiveReq = 1; G.game.next(st, false, true); return true; }  // stops at half time (js/mgr-live.js)
  if (act === 'msell') { var s = G.mgr.sell(st, +v); G.ui.flash = { mgr: /** @type {Dict<string>} */ ({ ok: '💰 Giocatore venduto.', rosa: 'La rosa è già al minimo.', nessuno: 'Nessun club può permetterselo.', chiuso: 'Mercato chiuso.', prestito: 'È qui in prestito: non si può vendere.' })[s] }; return true; }
  if (act === 'mstay') { st.mgrOffers = null; G.ui.tab = 'panchina'; return true; }
  if (act === 'mretire') { if (!confirm('Chiudere per sempre la carriera?')) return 'stop'; G.mgr.retire(st); return true; }
  if (act === 'recap' && st.recap && /** @type {MgrRecap} */ (st.recap).last) { st.recap = null; G.mgr.retire(st); return true; }
  return false;
};
