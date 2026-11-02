// @ts-check
// UI tabs: market (offers, negotiation, agent) and life (money, staff, fame, fans, relationships), event modal.

/** @type {Dict<string>} */
G.ROLE_PROMISE = { titolare: '⭐ Titolare', rotazione: '🔄 Rotazione', riserva: '🪑 Riserva' };

/** @param {State} st @param {Offer} o @returns {string} */
G.ui.offerCard = function (st, o) {
  var W = st.world, c = W.clubs[o.club], L = G.leagueByKey(c.lg), ag = G.life.agent(st.player), left = 2 - o.rounds;
  var type = /** @type {Dict<string>} */ ({ transfer: 'Trasferimento', renew: 'Rinnovo', loan: 'Prestito' })[o.type];
  var flash = G.ui.flash && G.ui.flash.id === o.id ? G.ui.flash.clause === 'ok' ? '💥 Pagano la clausola: ora puoi firmare.' : /** @type {Dict<string>} */ ({ ok: '✅ Il club accetta il rilancio.', firm: '✋ Il club non si muove.', gone: '' })[G.ui.flash.r || ''] || '' : '';
  var own = W.clubs[st.player.clubId], b = G.sure(o.bonus);  // read only with the clause, which comes with it
  var terms = o.clause !== undefined ? '<div class="small muted">Clausola rescissoria ' + o.clause + ' M€ · bonus ' + b.g + ' k€ a gol, ' + b.a + ' k€ a presenza, ' + b.t + ' k€ a trofeo</div>' : '';
  if (o.blocked) return '<div class="offer">' + G.crest(c, 44) + '<div class="grow"><b>' + c.name + '</b> <span class="muted small">' + L.name + ' · forza ' + c.str.toFixed(0) + '</span>' +
    '<div class="small">Offre ' + o.fee + ' M€ e ' + o.wage + ' k€/sett. · ' + G.ROLE_PROMISE[o.role] + '</div>' +
    '<div class="notice warn small">🔒 Il ' + own.name + ' non ti lascia partire: la tua clausola è di ' + G.sure(st.player.contract).clause + ' M€.</div>' +
    '<div class="row small" style="margin-top:6px">' + (o.tried ? '' : '<button data-act="payclause" data-v="' + o.id + '">💥 Chiedi al ' + c.name + ' di pagare la clausola</button>') +
    '<button class="ghost" data-act="rej" data-v="' + o.id + '">Lascia perdere</button></div></div></div>';
  return '<div class="offer">' + G.crest(c, 44) + '<div class="grow"><b>' + c.name + '</b> <span class="muted small">' + L.name + ' · forza ' + c.str.toFixed(0) + '</span>' +
    '<div class="small">' + type + (o.fee ? ' · ' + o.fee + ' M€ al tuo club' : '') + (o.note ? ' · <i>' + o.note + '</i>' : '') + (o.agent ? ' · trattato dal tuo agente' : '') + '</div>' +
    '<div><b>' + o.wage + ' k€/sett.</b> · ' + o.years + (o.years > 1 ? ' anni' : ' anno') + ' · ' + G.ROLE_PROMISE[o.role] + '</div>' +
    terms + (flash ? '<div class="small">' + flash + '</div>' : '') +
    '<div class="row small" style="margin-top:6px"><button data-act="acc" data-v="' + o.id + '">Accetta</button>' +
    (left > 0 ? '<button class="ghost" data-act="raise" data-v="' + o.id + '" data-w="wage">+ Ingaggio</button>' +
      (o.role !== 'titolare' ? '<button class="ghost" data-act="raise" data-v="' + o.id + '" data-w="role">Ruolo migliore</button>' : '') +
      (o.years < 5 ? '<button class="ghost" data-act="raise" data-v="' + o.id + '" data-w="years">+1 anno</button>' : '') +
      (o.clause !== undefined ? '<button class="ghost" data-act="raise" data-v="' + o.id + '" data-w="clause">− Clausola</button><button class="ghost" data-act="raise" data-v="' + o.id + '" data-w="bonus">+ Bonus</button>' : '') +
      (ag ? '<button class="ghost" data-act="agentdeal" data-v="' + o.id + '">🤝 Lascia fare all’agente</button>' : '') : '<span class="muted">Nessun rilancio rimasto</span>') +
    '<button class="ghost" data-act="rej" data-v="' + o.id + '">Rifiuta</button></div></div></div>';
};

/** @param {State} st @returns {string} */
G.ui.marketTab = function (st) {
  var p = st.player, W = st.world, club = W.clubs[p.clubId], b = G.sure(st.S).block, ag = G.life.agent(p);
  var open = b === 0 || b === 2, offers = st.offers || [], h = '';
  if (G.ui.flash && G.ui.flash.r === 'gone') h += '<div class="notice warn">Il club si è ritirato dalla trattativa.</div>';
  if (G.ui.flash && G.ui.flash.renew) h += '<div class="notice">' + /** @type {Dict<string>} */ ({ ok: 'Il club ti ha proposto un rinnovo.', no: 'Il club non vuole rinnovare ora.', 'già': 'Hai già chiesto il rinnovo in questa finestra.' })[G.ui.flash.renew] + '</div>';
  if (st.clubSell) {
    var so = G.transfers.find(st, st.clubSell);
    if (so) h += '<div class="notice warn">💼 Il ' + club.name + ' ha accettato l’offerta del <b>' + W.clubs[so.club].name + '</b> per te (' + so.fee + ' M€). Accetti il trasferimento?' +
      '<div class="row" style="margin-top:6px"><button data-act="acc" data-v="' + so.id + '">Vado</button><button class="ghost" data-act="rej" data-v="' + so.id + '">Resto (morale e rapporto col mister calano)</button></div></div>';
  }
  var list = offers.length ? offers.map(function (o) { return G.ui.offerCard(st, o); }).join('') :
    '<p class="muted">' + (open ? 'Nessuna proposta in questa finestra.' : 'Il mercato è chiuso: riapre in Estate e in Inverno (gennaio).') + '</p>';
  G.ui.flash = null;
  var contract = '<div>' + G.ui.club(club.id, 20) + (p.loanFrom !== null ? ' <span class="chip">prestito dal ' + W.clubs[p.loanFrom].name + '</span>' : '') + '</div>' +
    '<div><b>' + G.sure(p.contract).wage + ' k€/sett.</b> · ' + Math.max(0, G.sure(p.contract).years) + ' anni rimasti · ' + G.ROLE_PROMISE[G.sure(p.contract).role || 'rotazione'] + '</div>' +
    (G.contracts.ensure(st) && G.sure(p.contract).clause !== undefined ? '<div class="small">' + G.contracts.text(p.contract) + '</div>' : '') +
    (p.captain === club.id ? '<div class="chip cap">©️ Capitano' + (p.capSeasons ? ' · ' + p.capSeasons + (p.capSeasons > 1 ? ' stagioni' : ' stagione') + ' con la fascia in carriera' : '') + '</div>' : '') +
    '<div class="muted">Valore di mercato stimato: ' + G.transfers.value(p) + ' M€</div>' +
    '<p class="muted small">La clausola rescissoria è il prezzo per liberarti: più è bassa, più è facile andare via quando il club non vuole venderti. I bonus si pagano a fine stagione.</p>' +
    (p.transferReq ? '<div class="chip bad">Hai chiesto la cessione</div>' : '') +
    '<div class="row" style="margin-top:8px">' + (open && p.loanFrom === null ? '<button class="ghost" data-act="reqrenew">✍️ Chiedi il rinnovo</button>' : '') +
    (!p.transferReq && p.loanFrom === null ? '<button class="ghost" data-act="reqmove">📢 Chiedi la cessione</button>' : '') + '</div>';
  var agents = G.agents.active(st).map(function (a) {
    var act = p.fame < a.fame ? '<span class="muted small">non ti segue</span>' : !a.open ? '<span class="muted small">niente nuovi clienti</span>' :
      '<button class="small" data-act="hire" data-v="' + a.i + '">' + (ag ? 'Cambia agente' : 'Ingaggia') + '</button>';
    return '<tr><td>' + G.ui.flag(a.nt) + ' ' + a.n + '</td><td>' + '★'.repeat(a.s) + '</td><td class="num">' + a.fee + '%</td><td class="num muted">fama ' + a.fame + '</td><td>' + act + '</td></tr>';
  }).join('');
  var news = (st.news || []).filter(function (n) { return /💰|🔥|🤝|🔁|✍️|📨|📢|🆕|📈|📉|👋|💥|✋|😠|💶|©️/.test(n.t); }).slice(0, 25).map(function (n) { return '<div class="small">' + n.t + '</div>'; }).join('');
  return '<div class="grid two">' + G.ui.card('Proposte ' + (open ? '· mercato aperto' : '· mercato chiuso'), h + list) +
    '<div class="stack">' + G.ui.card('Il tuo contratto', contract) +
    G.ui.card('Il tuo agente', ag ? '<div class="row"><div class="grow"><b>' + G.ui.flag(ag.nt) + ' ' + ag.n + '</b> <span>' + '★'.repeat(ag.s) + '</span>' +
      '<div class="small">Commissione ' + ag.fee + '% dello stipendio · più visibilità, contratti migliori e trattative delegabili</div></div>' +
      '<button class="ghost small" data-act="fire">Licenzia</button></div><p class="muted small">Il tuo agente resta con te finché non lo licenzi o non cambi agente; il suo livello può salire o scendere con il mercato.</p>' :
      '<p class="muted">Nessun agente: ricevi meno offerte e tratti da solo. Gli agenti migliori seguono solo giocatori famosi.</p>') +
    G.ui.card('Mercato degli agenti', '<table>' + agents + '</table><p class="muted small">Il mercato degli agenti cambia ogni estate (livelli, commissioni, ritiri, nuovi arrivi) e a gennaio qualcuno apre o chiude a nuovi clienti.</p>') + '</div>' +
    G.ui.card('Notizie di mercato', news || '<p class="muted">Ancora nulla.</p>', 'span3') + '</div>';
};

/** @param {State} st @returns {string} */
G.ui.lifeTab = function (st) {
  var p = st.player, W = st.world, C = G.CFG, ag = G.life.agent(p), SH = G.SHOP;
  var net = Math.round(G.sure(p.contract).wage * C.WEEKS_PER_BLOCK * (1 - C.TAX) * (1 - (ag ? ag.fee / 100 : 0)));
  var money = '<div class="kpis">' + G.ui.kpi(G.ui.money(p.money), 'Conto') + G.ui.kpi(G.ui.money(net), 'Netto a blocco') + G.ui.kpi(G.ui.money(G.life.staffCost(p) / 4), 'Staff a blocco') + (G.life.income(p) ? G.ui.kpi(G.ui.money(G.life.income(p) / 4), 'Rendite a blocco') : '') + G.ui.kpi(G.ui.money(p.invest), 'Investiti') + '</div>' +
    '<div class="row"><button class="ghost" data-act="inv" data-v="1">Investi 1 M€</button><button class="ghost" data-act="inv" data-v="-1">Disinvesti 1 M€</button><span class="muted small">Rendimento medio 5% annuo, con rischio.</span></div>';
  var staff = '<table>' + Object.keys(SH.staff).map(function (k) {
    var s = SH.staff[k], lv = p.staff[k] || 0;
    var btns = s.lv.map(function (l, i) { return '<button class="' + (lv === i + 1 ? '' : 'ghost') + ' small" data-act="staff" data-v="' + k + '" data-w="' + (lv === i + 1 ? 0 : i + 1) + '">Liv. ' + (i + 1) + ' · ' + l[0] + ' k€/anno</button>'; }).join(' ');
    return '<tr><td><b>' + s.n + '</b><div class="muted small">' + s.d + '</div></td><td>' + btns + '</td></tr>';
  }).join('') + '</table><p class="muted small">Clicca sul livello attivo per disdire. Se il conto va in rosso lo staff viene licenziato.</p>';
  var items = Object.keys(SH.items).map(function (k) {
    var it = SH.items[k], owned = it.once && p.items[k], done = it.season && p.items.charityYear, lock = p.fame < (it.req || 0);
    var perks = Object.keys(it.st || {}).map(function (s) { return SH.ITEM_PERK[s] + ' ' + (s === 'trainer' ? '+' : '−') + Math.round(G.sure(it.st)[s] * 100) + '%'; });
    var fx = ['Morale +' + it.mo].concat(it.fa ? ['fama +' + it.fa] : [], it.fans ? ['affetto di tutti i tuoi tifosi +' + it.fans] : [], perks,
      it.inc ? ['rendita ' + G.ui.money(it.inc) + '/anno'] : [], it.season ? ['una volta a stagione'] : []).join(' · ');
    return '<div class="shop"><b>' + it.n + '</b><div class="small muted">' + fx + '</div>' +
      (owned ? '<span class="chip">✔ tuo</span>' : done ? '<span class="chip">fatto quest’anno</span>' : lock ? '<span class="chip">serve fama ' + it.req + '</span>' :
        '<button class="small" data-act="buy" data-v="' + k + '"' + (p.money < it.c ? ' disabled' : '') + '>' + G.ui.money(it.c) + '</button>') + '</div>';
  }).join('');
  var fans = Object.keys(p.fans).map(/** @param {any} id a club id (an object key, so a string) */ function (id) {
    var v = p.fans[id];
    return '<tr><td>' + G.ui.club(+id, 16) + (p.bandiera[id] ? ' 🚩' : '') + (p.traitor[id] ? ' 🐍' : '') + '</td><td style="width:45%">' + G.ui.meter(v, 100, p.traitor[id] ? 'var(--bad)' : 'var(--accent2)') + '</td><td class="num">' + Math.round(v) + '</td><td class="num muted small">' + (p.seasonsAt[id] || 0) + ' st. · ' + (p.goalsAt[id] || 0) + ' gol</td></tr>';
  }).join('');
  var rels = Object.keys(p.rel).filter(/** @param {any} id */ function (id) { return p.rel[id] !== 0; }).sort(/** @param {any} a @param {any} b */ function (a, b) { return p.rel[b] - p.rel[a]; }).map(/** @param {any} id a coach id */ function (id) {
    var co = W.coaches[id], v = p.rel[id];
    return '<tr><td>' + G.ui.flag(co.nt) + ' ' + co.n + '</td><td class="muted small">' + (co.ret ? 'ritirato' : co.c >= 0 ? W.clubs[co.c].name : co.c === -2 ? 'ct ' + G.nationInfo(st.player.nat).name : 'svincolato') + '</td><td style="width:35%">' + G.ui.meter(v + 100, 200, v >= 0 ? 'var(--good)' : 'var(--bad)') + '</td><td class="num">' + v + '</td></tr>';
  }).join('');
  return '<div class="grid two">' + G.ui.card('Soldi', money) +
    G.ui.card('Fama e media', '<div class="kpis">' + G.ui.kpi(Math.round(p.fame), 'Fama') + G.ui.kpi(G.life.followers(p) + ' M', 'Follower') + G.ui.kpi(p.derbyWins, 'Derby vinti') + '</div>' +
      '<p class="muted small">La fama porta offerte, sponsor, agenti migliori e voti al Pallone d’Oro. Cresce con prestazioni, gol, premi, club importanti e ufficio stampa.</p>') +
    G.ui.card('Staff personale', staff, 'span3') + G.ui.card('Acquisti', '<div class="shopgrid">' + items + '</div>', 'span3') +
    G.ui.card('Tifosi dei tuoi club', fans ? '<table>' + fans + '</table><p class="muted small">🚩 bandiera · 🐍 traditore (sei passato a un club rivale)</p>' : '<p class="muted">Ancora nessun legame.</p>') +
    G.ui.card('Rapporti con gli allenatori', rels ? '<table>' + rels + '</table><p class="muted small">I buoni rapporti ti seguono: un ex allenatore che ti stima può chiamarti nel suo nuovo club.</p>' : '<p class="muted">Ancora nessun rapporto.</p>') + '</div>';
};

/** @param {State} st @returns {string} */
G.ui.eventModal = function (st) {
  var ev = G.sure(st.event);
  return '<div class="modal"><div class="card modal-card' + (ev.press ? ' press' : ev.moment || ev.mgrht ? ' moment' : '') + '"><h3>' + (ev.press ? 'Sala stampa' : ev.mgrht ? 'Intervallo' : ev.moment ? 'Momento decisivo' : 'Evento') + '</h3><h2>' + ev.t + '</h2><p>' + ev.d + '</p><div class="stack">' +
    ev.o.map(function (o, i) { return '<button class="' + (i ? 'ghost' : '') + '" data-act="ev" data-v="' + i + '">' + o + '</button>'; }).join('') + '</div></div></div>';
};
