// @ts-check
// UI core: boot, tabs, click routing, helpers, creation, career dashboard, end screen.

G.ui = {};
G.ui.tab = 'carriera';
/** @type {{ [key: string]: any }} filters chosen in the tabs: league, cup, year, role */
G.ui.sel = {};
/** @type {{ id?: number, r?: string, clause?: string|null, renew?: string, mgr?: string } | null} the outcome of a market action, shown once */
G.ui.flash;
/** @type {{ club: ClubId, a: Dict<string> } | null | undefined} the interview being answered (M9 S3): only for the day, never saved */
G.ui.iv;
/** @type {number} hidden GOAT switch of the creation screen: 0 off, 1 = 1 in 100, 2 = 1 in 1000 */
G.ui.goat;
/** @type {string} career picked on the creation screen ('mgr' = manager) */
G.ui.ctype;
/** @type {State|null|undefined} the career being played (none on the creation screen) */
G.state;
/** @param {string} s @returns {any} */
var $ = function (s) { return document.querySelector(s); };

G.ui.boot = function () {
  G.ui.renderCreate();  // the start screen: "Continua" for each slot with a career, or a new one (M8 phase G4)
  document.addEventListener('click', G.ui.onClick);
  document.addEventListener('change', G.ui.onChange);
  $('#btn-export').onclick = function () { if (G.state) G.save.exportFile(G.state); };
  $('#btn-new').onclick = function () { window.scrollTo(0, 0); G.ui.renderCreate(); };
  $('#file-import').onchange = /** @param {{ target: any }} e a change in a select or input */ function (e) {
    var f = e.target.files[0]; if (!f) return;
    G.save.importFile(f, function (err, st) {
      if (err) return alert('Import non riuscito: ' + err.message);
      var x = G.save.info(G.save.slot);
      if (x && !confirm('La carriera del file va nello slot ' + (G.save.slot + 1) + ', al posto di quella di ' + x.name + '. Continuare?')) return;
      var s = G.save.restore(G.sure(st)); G.state = s; G.save.write(s); G.ui.render();  // no error: the file was read
    });
    e.target.value = '';
  };
};

G.ui.render = function () {
  var st = G.state;
  if (!st) return G.ui.renderCreate();
  if (st.over) return G.ui.renderEnd();
  if (st.mgr) return G.ui.renderMgr(st);
  if (G.sure(st.S).block === 5 && !st.recap) { $('#app').innerHTML = G.ui.tourScreen(st) + (st.event ? G.ui.eventModal(st) : ''); return; }
  var tabs = [['carriera', '⚽ Carriera'], ['profilo', '🧬 Profilo'], ['squadra', '👥 Squadra'], ['campionati', '📊 Campionati'], ['calendario', '📅 Calendario'], ['europa', '🌍 Europa'], ['nazionale', G.ui.flag(st.player.nat) + ' Nazionale'],
    ['mercato', '💼 Mercato' + ((st.offers || []).length ? ' (' + st.offers.length + ')' : '')], ['vita', '💶 Vita'], ['premi', '🏅 Premi'], ['bacheca', '🏆 Bacheca'], ['stats', '📈 Statistiche']];
  var bar = '<nav class="tabs">' + tabs.map(function (t) { return '<button data-act="tab" data-v="' + t[0] + '" class="' + (G.ui.tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</nav>';
  var body = { carriera: G.ui.career, profilo: G.ui.profileTab, squadra: G.ui.squadTab, campionati: G.ui.leagueTab, calendario: G.ui.calendarTab, europa: G.ui.euroTab, nazionale: G.ui.nationalTab, mercato: G.ui.marketTab, vita: G.ui.lifeTab, premi: G.ui.awardsTab, bacheca: G.ui.cabinetTab, stats: G.ui.statsTab }[G.ui.tab] || G.ui.career;
  $('#app').innerHTML = G.ui.hero(st) + bar + body(st) + (st.recap ? G.recap.render(st) : st.event ? G.ui.eventModal(st) : '');
};

/** @param {{ target: any }} e a click anywhere in the page */
G.ui.onClick = function (e) {
  var el = e.target.closest('[data-act]'); if (!el) return;
  var st = G.state, act = el.dataset.act, v = el.dataset.v, w = el.dataset.w, T = G.transfers, L = G.life;
  // Hidden GOAT switch: the final dot of the creation text (1 press = 1 in 100, 2 = 1 in 1000, 3 = off)
  if (act === 'goat') { G.ui.goat = ((G.ui.goat || 0) + 1) % 3; el.className = 'goat-dot g' + G.ui.goat; return; }
  if (act === 'create') return G.ui.create();
  if (act === 'ctype') { G.ui.ctype = v; return G.ui.renderCreate(); }
  if (act === 'createmgr') return G.ui.createMgr();
  if (act === 'slotgo' || act === 'slotdel') return G.ui.slotAct(act, +v);
  if (act === 'hoft') return G.ui.hofTab(v);
  if (act === 'cab' || act === 'cabsel') return G.ui.cabAct(el, act, v, w);
  var mr = st && (G.ui.pitchAct(st, act, v) || G.ui.homeAct(st, act, v) || G.ui.calAct(st, act, v) || G.ui.mgrSqAct(st, act, v) || G.ui.mgrDealAct(st, act, v) || G.ui.mgrYouthAct(st, act, v) || G.ui.mgrBoardAct(st, act, v) || G.ui.posAct(st, act, v) || G.ui.mgrTacAct(st, act, v) || G.ui.societyAct(st, act, v) || G.ui.mgrAct(st, act, v, w));
  if (mr === 'stop') return;
  if (mr) { if (mr !== 'view') G.save.write(G.sure(st)); if (mr === true) window.scrollTo(0, 0); return G.ui.render(); }
  if (act === 'tab') { G.ui.tab = v; return G.ui.render(); }
  if (!st) return;  // every action below belongs to a career
  if (act === 'goal') G.goals.pick(st, +v);
  if (act === 'focus') st.player.plan.focus = v;
  if (act === 'intensity') st.player.plan.intensity = +v;
  if (act === 'next') G.game.next(st);
  if (act === 'match') G.game.next(st, false, true);
  if (act === 'tday') G.game.next(st, false, 'day');
  if (act === 'tsel') G.ui.sel.tour = v;
  if (act === 'recap') { st.recap = null; window.scrollTo(0, 0); }
  if (act === 'season') G.game.simSeason(st, true);
  if (act === 'retire') { if (!confirm('Sicuro di volerti ritirare?')) return; G.game.retire(st); }
  if (act === 'ev') { var wasMoment = st.event && (st.event.moment || st.event.mgrht); G.events.apply(st, +v); if (wasMoment) G.game.next(st, false, true); }
  if (act === 'acc') T.accept(st, +v);
  if (act === 'raise') G.ui.flash = { id: +v, r: T.raise(st, +v, w) };
  if (act === 'agentdeal') T.agentDeal(st, +v);
  if (act === 'payclause') { var pc = G.contracts.payClause(st, +v); G.ui.flash = { id: +v, clause: pc, r: pc === 'no' ? 'gone' : '' }; }
  if (act === 'rej') T.reject(st, +v);
  if (act === 'reqmove') { if (!confirm('Chiedere la cessione? Allenatore e tifosi non la prenderanno bene.')) return; T.requestMove(st); }
  if (act === 'reqrenew') G.ui.flash = { renew: T.requestRenewal(st) };
  if (act === 'hire') L.hireAgent(st, +v);
  if (act === 'fire') st.player.agent = null;
  if (act === 'staff') L.setStaff(st, v, +w);
  if (act === 'buy') L.buy(st, v);
  if (act === 'inv') L.investMove(st, +v);
  if (act === 'year') G.ui.sel.year = +v;
  if (act !== 'year' && act !== 'tsel') G.save.write(st);
  G.ui.render();
};

/** @param {{ target: any }} e a change in a select or input */
G.ui.onChange = function (e) {
  var el = e.target;
  if (el.dataset.mxi !== undefined && G.state && G.state.mgr) { G.mgrTeam.setSlot(G.state, +el.dataset.mxi, +el.value); G.save.write(G.state); return G.ui.render(); }
  if (el.dataset.msr !== undefined && G.state && G.state.mgr) { G.mgrSq.setRole(G.state, +el.dataset.msr, el.value); G.save.write(G.state); return G.ui.render(); }
  if (el.dataset.mys !== undefined && G.state && G.state.mgr) { var ys = el.dataset.mys.split(':'); G.ui.flash = { mgr: G.mgrYouth.setScout(G.state, +ys[0], ys[1], el.value) }; G.save.write(G.state); return G.ui.render(); }
  if (el.id === 'c-nat') return G.ui.showNatNote(el.value);
  if (el.dataset.sel) { G.ui.sel[el.dataset.sel] = el.value; G.ui.render(); }
};

// ---------- helpers ----------
/** @param {ClubId} id @param {number} [size] @returns {string} */
G.ui.club = function (id, size) {
  var c = G.sure(G.state).world.clubs[id];
  return '<span class="club">' + G.crest(c, size || 20) + c.name + '</span>';
};
/** @param {number} n @returns {string} */
G.ui.stars = function (n) {
  return '<span class="stars" title="Potenziale stimato dagli osservatori">' + '★'.repeat(Math.floor(n)) + (n % 1 ? '½' : '') +
    '<span class="muted">' + '☆'.repeat(5 - Math.ceil(n)) + '</span></span>';
};
/** @param {number} r @returns {string} */
G.ui.rcls = function (r) { return r >= 7 ? 'r-good' : r >= 6 ? 'r-mid' : 'r-bad'; };
/** @param {number} v @returns {string} */
G.ui.colorFor = function (v) { return v >= 80 ? '#2ee6a6' : v >= 70 ? '#9be15d' : v >= 60 ? '#ffcc4d' : v >= 50 ? '#ff9f43' : '#ff6b6b'; };
/** @param {string|number} v @param {string} l @returns {string} */
G.ui.kpi = function (v, l) { return '<div class="kpi"><b>' + v + '</b><span>' + l + '</span></div>'; };
/** @param {number} v @param {number} [max] @param {string} [col] @returns {string} */
G.ui.meter = function (v, max, col) { return '<div class="meter"><i style="width:' + G.clamp(v / (max || 100) * 100, 0, 100) + '%' + (col ? ';background:' + col : '') + '"></i></div>'; };
/** @param {number} k @returns {string} */
G.ui.money = function (k) { return Math.abs(k) >= 1000 ? (k / 1000).toFixed(1) + ' M€' : Math.round(k) + ' k€'; };
/** @param {NationCode} nat @returns {string} */
G.ui.flag = function (nat) { return G.nationInfo(nat).flag; };
/** @param {string} title @param {string} body @param {string} [cls] @returns {string} */
G.ui.card = function (title, body, cls) { return '<div class="card ' + (cls || '') + '"><h3>' + title + '</h3>' + body + '</div>'; };

// ---------- creation ----------
G.ui.renderCreate = function () {
  if (G.ui.ctype === 'mgr') { $('#app').innerHTML = G.ui.mgrCreateForm(); return; }
  var roles = G.ui.posOptions();  // the 11 positions (M9 S5)
  $('#app').innerHTML = '<div class="card create"><h3>Nuova carriera</h3>' + G.ui.careerSwitch() +
    '<label>Nome</label><input id="c-name" value="Marco Rossi" maxlength="30">' +
    '<label>Nazione</label><select id="c-nat">' + G.ui.natOptions('ITA') + '</select><p class="muted small" id="c-natnote"></p>' +
    '<label>Posizione</label><select id="c-role">' + roles + '</select>' +
    '<label>Piede</label><select id="c-foot"><option value="D">Destro</option><option value="S">Sinistro</option><option value="A">Ambidestro</option></select>' +
    '<label>Inizio</label><select id="c-start"><option value="random" selected>Club casuale (di solito una squadra piccola, rarissimo un top club)</option><option value="loan">In prestito da un grande club</option></select>' +
    '<p class="muted small">Circa 1 volta su 2 si parte da una seconda divisione; un top club è questione di fortuna.</p>' +
    '<p class="muted">Parti a 17 anni. Attributi e potenziale sono generati a caso in base al ruolo; gli osservatori mostrano il potenziale solo come stelle. La creazione del mondo richiede un attimo<span class="goat-dot g' + (G.ui.goat || 0) + '" data-act="goat">.</span></p>' +
    G.ui.slotPick() + '<button class="big" data-act="create">Inizia la carriera ▶</button></div>';
};

G.ui.create = function () {
  var slot = G.ui.pickSlot(), name = $('#c-name').value.trim() || 'Giocatore';
  if (slot < 0) return;
  G.state = G.game.newCareer({ name: name, nat: $('#c-nat').value, pos: $('#c-role').value, role: G.POS[$('#c-role').value].r, foot: $('#c-foot').value, start: $('#c-start').value, goat: G.ui.goat || 0 });
  G.ui.goat = 0;
  G.ui.tab = 'carriera';
  G.save.slot = slot; G.save.write(G.state); G.ui.render();
};

// ---------- header ----------
/** @param {State} st @returns {string} */
G.ui.hero = function (st) {
  var p = st.player, S = G.sure(st.S), club = st.world.clubs[p.clubId], C = G.CFG, L = G.leagueByKey(club.lg);
  var co = G.coaches.of(st.world, club), ag = G.life.agent(p);
  var blocks = C.BLOCKS.map(function (b, i) { return i < 5 || S.tours ? '<span class="' + (i < S.block ? 'done' : i === S.block ? 'cur' : '') + '">' + C.BLOCK_ICONS[i] + ' ' + b + '</span>' : ''; }).join('');
  return '<div class="card hero">' + G.crest(club, 56) +
    '<div class="ovr">' + p.ovr + '<small>OVERALL</small></div>' +
    '<div><h2>' + p.name + ' <span class="muted">' + G.ui.flag(p.nat) + '</span></h2>' +
    '<div class="muted">' + G.pos.label(p) + ' · ' + p.age + ' anni · ' + G.ui.stars(p.stars) + '</div>' +
    '<div>' + club.name + ' · ' + L.name + (p.loanFrom !== null ? ' <span class="chip">prestito</span>' : '') + (p.bandiera[club.id] ? ' <span class="chip">🚩 bandiera</span>' : '') + (p.captain === club.id ? ' <span class="chip cap">©️ capitano</span>' : '') + '</div>' +
    '<div class="muted">' + (co ? 'All. ' + co.n + ' · rapporto ' + (p.rel[co.i] || 0) : 'Senza allenatore') + '</div></div>' +
    '<div class="mini"><div>Morale ' + p.morale + G.ui.meter(p.morale) + '</div><div>Fama ' + Math.round(p.fame) + G.ui.meter(p.fame, 100, 'var(--accent2)') + '</div>' +
    '<div class="muted">💶 ' + G.ui.money(p.money) + ' · ' + (ag ? '🤝 ' + ag.n : 'senza agente') + '</div></div>' +
    '<div class="blocks"><span class="muted" style="background:none">Stagione ' + G.season.label(S.year) + ' · ' + (p.seasons + 1) + '/' + C.MAX_SEASONS + '</span>' + blocks + '</div></div>';
};

// ---------- career tab ----------
// Computer: block card and summary | cups | table. Phone: one column, the cards in the order set in home.css
/** @param {State} st @returns {string} */
G.ui.career = function (st) {
  var id = st.player.clubId, mid = G.ui.nextCard(st) + G.ui.cupCard(st, id) + G.ui.euroCard(st, id);
  return '<div class="grid home' + (mid ? '' : ' nomid') + '"><div class="stack c1">' + G.ui.planCard(st) + G.ui.summaryCard(st) + '</div>' +
    (mid ? '<div class="stack c2">' + mid + '</div>' : '') + G.ui.tableCard(st) + '</div>';
};

/** @param {State} st @returns {string} */
G.ui.planCard = function (st) {
  var p = st.player, S = G.sure(st.S), C = G.CFG, b = S.block;
  var isFinal = b === 4, h = '', tours = S.tours ? Object.keys(S.tours).map(function (k) { return G.sure(S.tours)[k].n; }).join(', ') : '';
  (st.achNew || []).forEach(function (id) { var a = G.ach.get(id); h += '<div class="notice ach">' + a[1] + ' <b>Obiettivo sbloccato: ' + a[2] + '</b> <span class="muted small">' + a[3] + '</span></div>'; });
  if (st.eventResult) h += '<div class="notice">🗒️ <b>' + st.eventResult.t + '</b>: ' + st.eventResult.r + '</div>';
  h += G.ui.goalBox(st);
  if (st.momentResult) h += '<div class="notice ' + (st.momentResult.ok ? 'ach' : 'warn') + '"><b>' + st.momentResult.t + '</b></div>';
  if (st.pressResult) h += '<div class="notice ' + (st.pressResult.ok ? 'ach' : 'warn') + '">🎙️ <b>' + st.pressResult.t + '</b></div>';
  if (st.bet) h += '<div class="notice">🎙️ Promessa da mantenere in questo blocco: <b>' + st.bet.t + '</b></div>';
  if ((st.offers || []).length) h += '<div class="notice clickable" data-act="tab" data-v="mercato">📨 Hai ' + st.offers.length + ' proposte sul mercato: aprile nella scheda Mercato.</div>';
  if (p.contract && p.contract.years <= 0 && b === 0) h += '<div class="notice warn">⚠️ Contratto scaduto: scegli una proposta nel Mercato (altrimenti ne verrà scelta una per te).</div>';
  if (p.inj > 0) h += '<div class="chip bad">🚑 Infortunato: ' + p.inj + ' partite</div>';
  h += G.ui.trainLine(st);
  var news = (st.news || []).slice(0, 5).map(function (n) { return '<div>' + n.t + '</div>'; }).join('');
  return G.ui.card(C.BLOCK_ICONS[b] + ' ' + C.BLOCKS[b] + ' · ' + G.season.label(S.year), h +
    (isFinal ? '<p class="muted">Finali delle coppe' + (tours ? ', poi si gioca: ' + tours + '.' : ', premi e bilancio della stagione.') + '</p>' : '') +
    '<div class="row"><button class="big" data-act="match">⚽ Prossima partita</button>' + G.ui.skipBtn(st) +
    '<button class="ghost" data-act="next">' + (isFinal ? (tours ? '🌍 Vai al torneo' : '🏆 Chiudi la stagione') : S.cur ? '▶ Fine blocco' : '▶ Gioca il blocco') + '</button>' +
    '<button class="ghost" data-act="season">⏩ Simula stagione</button>' +
    (G.game.canRetire(st) ? '<button class="warn" data-act="retire">Ritirati</button>' : '') + '</div>' +
    '<div class="log">' + news + '</div>', 'plan');
};

// Season goal: three to choose from at the start, then its progress
/** @param {State} st @returns {string} */
G.ui.goalBox = function (st) {
  if (st.goal) { var pr = G.goals.progress(st, st.goal); return '<div class="notice' + (pr.ok ? ' ach' : '') + '">🎯 <b>' + st.goal.t + '</b> <span class="muted">· ' + G.goals.label(st.goal, pr) + (pr.ok ? ' ✓' : '') + '</span></div>'; }
  if (!st.goalOffer) return '';
  return '<div class="notice goal-pick">🎯 <b>Scegli l’obiettivo della stagione</b> <span class="muted small">(più è difficile, più vale: fama, tifosi e a volte potenziale)</span><div class="stack">' +
    st.goalOffer.map(function (g, i) { return '<button class="ghost" data-act="goal" data-v="' + i + '">' + (g.lvl > 1 ? '★★ ' : '★ ') + g.t + '</button>'; }).join('') + '</div></div>';
};

/** @param {State} st @returns {string} */
G.ui.summaryCard = function (st) {
  var s = st.S && st.S.cur ? G.season.summary(st) : st.lastBlock;
  if (!s) return G.ui.card('Riepilogo', '<p class="muted">Gioca il primo blocco per vedere le tue partite.</p>', 'sumc');
  var C = G.CFG, d = s.ovrAfter - s.ovrBefore, h = '';
  if (s.season) {
    var r = s.season;
    h += '<div class="trophy">📅 Stagione ' + G.season.label(r.year) + ' chiusa: ' + r.club + ' ' + r.pos + 'º in ' + r.lg + '</div>' +
      '<div class="kpis">' + G.ui.kpi(r.apps + (r.matches ? '/' + r.matches : ''), 'Presenze') + G.ui.kpi(r.goals, 'Gol') + G.ui.kpi(r.assists, 'Assist') + G.ui.kpi(r.avg.toFixed(2), 'Voto medio') + '</div>' +
      r.trophies.map(function (t) { return '<div class="trophy">' + G.ui.troTag(t) + '</div>'; }).join('') +
      r.awards.map(function (t) { return '<div class="trophy">' + G.ui.troTag(t) + '</div>'; }).join('') +
      (r.bdo ? '<div class="trophy">⚽ Pallone d’Oro: ' + r.bdo + 'º posto</div>' : '');
  }
  var kp = !s.matches ? '' : '<div class="kpis">' + G.ui.kpi(s.apps + '/' + s.matches, 'Presenze') + G.ui.kpi(s.goals, 'Gol') + G.ui.kpi(s.assists, 'Assist') +
    G.ui.kpi(s.avg ? s.avg.toFixed(2) : '-', 'Voto') + G.ui.kpi((d > 0 ? '+' : '') + d, 'Overall') + '</div>';
  var rows = s.rows.map(function (m) {
    return '<tr' + (m.derby ? ' class="derby"' : '') + '><td class="muted">' + (m.home ? 'C' : 'T') + '</td><td>' + (m.nt ? G.ui.nat(/** @type {NationCode} */ (m.opp)) : G.ui.club(/** @type {ClubId} */ (m.opp), 16)) + (m.derby ? ' 🔥' : '') + '</td><td class="muted small">' + m.comp + '</td>' +
      '<td class="num">' + m.gf + '-' + m.ga + '</td><td class="num">' + (m.mins ? m.mins + "'" : '—') + '</td>' +
      '<td>' + (m.g ? '⚽'.repeat(Math.min(m.g, 4)) : '') + (m.a ? '🅰️'.repeat(Math.min(m.a, 3)) : '') + '</td>' +
      '<td class="num ' + (m.r ? G.ui.rcls(m.r) : '') + '">' + (m.r || '') + '</td></tr>';
  }).join('');
  var inj = s.injury ? '<div class="chip bad">🚑 Infortunio: fuori ' + s.injury + ' partite</div>' : '';
  return G.ui.card('Riepilogo · ' + C.BLOCK_ICONS[s.block] + ' ' + C.BLOCKS[s.block] + (s.partial ? ' (in corso)' : ''), h + inj + kp +
    (rows ? '<div class="matches"><table>' + rows + '</table></div>' : ''), 'sumc');
};

/** @param {State} st @param {LeagueKey} key @param {boolean} [compact] @returns {string} */
G.ui.leagueTable = function (st, key, compact) {
  var p = st.player, L = G.leagueByKey(key), S = G.sure(st.S);
  var ids = G.season.sortTable(S, key), tab = S.lg[key].tab, n = ids.length, promo = G.CFG.PROMO_SLOTS, hasLow = !!S.lg[L.nat + '2'];
  var acc = G.CFG.UEFA_ACCESS[L.nat], eu = L.tier === 1 && acc ? acc[0] + acc[1] + acc[2] : 0, less = G.cal.behind(st, key);
  var rows = ids.map(function (id, i) {
    var t = tab[id], zone = (L.tier === 2 && i < promo) ? 'zone-up' : (L.tier === 1 && i < eu) ? (i < acc[0] ? 'zone-ucl' : 'zone-up') :
      (L.tier === 1 && hasLow && i >= n - promo) ? 'zone-down' : '';
    return '<tr class="' + (id === p.clubId ? 'me ' : '') + zone + '"><td>' + (i + 1) + '</td><td>' + G.ui.club(id, 16) + '</td><td class="num">' + t[0] + (less[id] ? '<span class="behind" title="' + less[id] + (less[id] === 1 ? ' partita' : ' partite') + ' in meno">⟳</span>' : '') + '</td>' +
      (compact ? '' : '<td class="num">' + t[1] + '</td><td class="num">' + t[2] + '</td><td class="num">' + t[3] + '</td>') +
      '<td class="num">' + (t[4] - t[5]) + '</td><td class="num"><b>' + t[6] + '</b></td></tr>';
  }).join('');
  return '<table><tr><th>#</th><th>Club</th><th class="num">G</th>' + (compact ? '' : '<th class="num">V</th><th class="num">N</th><th class="num">P</th>') +
    '<th class="num">DR</th><th class="num">Pt</th></tr>' + rows + '</table>' + (Object.keys(less).length ? '<p class="muted small">⟳ una partita in meno, rinviata per una coppa.</p>' : '');
};

/** @param {State} st @returns {string} */
G.ui.tableCard = function (st) {
  var key = st.world.clubs[st.player.clubId].lg;
  return G.ui.card(G.leagueByKey(key).name, '<div class="scroll" style="max-height:640px">' + G.ui.leagueTable(st, key, true) + '</div>');
};

/** @param {Player} p @returns {string} */
G.ui.historyTable = function (p) {
  var rows = p.history.map(function (h) {
    return '<tr><td>' + G.season.label(h.year) + '</td><td>' + h.age + '</td><td>' + G.ui.club(h.clubId, 16) + (h.loan ? ' <span class="chip">prestito</span>' : '') + (h.posK ? ' <span class="muted small">' + h.posK + '</span>' : '') + '</td>' +
      '<td class="muted">' + h.lg + '</td><td class="num">' + h.pos + 'º</td><td class="num">' + h.apps + (h.matches ? '<span class="muted">/' + h.matches + '</span>' : '') + '</td><td class="num">' + h.goals + '</td>' +
      '<td class="num">' + h.assists + '</td><td class="num ' + G.ui.rcls(h.avg) + '">' + (h.avg ? h.avg.toFixed(2) : '-') + '</td><td class="num">' + h.ovr + '</td>' +
      '<td class="small">' + h.trophies.concat(h.awards || []).map(function (t) { return G.ui.troTag(t); }).join(' ') +
      (h.bdo && h.bdo <= 10 ? ' ⚽ BdO ' + h.bdo + 'º' : '') + '</td></tr>';
  }).join('');
  return '<table><tr><th>Stagione</th><th>Età</th><th>Club</th><th>Lega</th><th class="num">Pos</th><th class="num">Pres</th><th class="num">Gol</th><th class="num">Ass</th><th class="num">Voto</th><th class="num">OVR</th><th>Trofei e premi</th></tr>' +
    (rows || '<tr><td colspan="11" class="muted">Nessuna stagione conclusa.</td></tr>') +
    '<tr><td colspan="5"><b>Totale</b></td><td class="num"><b>' + p.tot.apps + '</b></td><td class="num"><b>' + p.tot.goals + '</b></td><td class="num"><b>' + p.tot.assists + '</b></td><td colspan="3"></td></tr></table>';
};

