// @ts-check
// Event cards of the manager career, same idea as js/events-data.js with its own effects:
// conf board confidence, mo squad morale, rep reputation, fn fans of the club, $ your money k€, bud club budget M€,
// young +ovr to the best academy kid, heir brings your heir to your club, p probability with ok/ko.

G.mgrEv = {};

/** @param {State} st @returns {MgrEvCtx} */
G.mgrEv.ctx = function (st) {
  var m = st.mgr, W = st.world, p = st.player, club = W.clubs[m.club], S = st.S, ids = G.season.sortTable(S, club.lg);
  var sq = club.sq.map(function (id) { return W.players[id]; }), star = sq.slice().sort(function (a, b) { return b.o - a.o; })[0];
  var kid = sq.filter(function (x) { return x.a <= 19; }).sort(function (a, b) { return b.p - a.p; })[0];
  var old = W.coaches.filter(function (c) { return !c.me && c.c >= 0 && c.c !== club.id && W.clubs[c.c].lg === club.lg && (p.rel[c.i] || 0) >= 15; })[0];
  var heir = m.heir !== undefined && m.heir !== null && W.players[m.heir] && W.players[m.heir].heir ? W.players[m.heir] : null;
  return { st: st, m: m, W: W, club: club, b: S.block, coach: true, ds: true, pos: ids.indexOf(club.id) + 1, n: ids.length,
    conf: m.conf, morale: m.morale, star: star, kid: kid, old: old, heir: heir, rich: club.bud >= 15 };
};

/** @param {string} txt @param {MgrEvCtx} X */
G.mgrEv.fill = function (txt, X) {
  /** @type {Dict<any>} */
  var v = { club: X.club.name, star: X.star ? X.star.n : 'la stella', kid: X.kid ? X.kid.n : 'un ragazzo', old: X.old ? X.old.n : '', oldClub: X.old ? X.W.clubs[X.old.c].name : '',
    heir: X.heir ? X.heir.n : '', heirClub: X.heir && X.heir.c >= 0 ? X.W.clubs[X.heir.c].name : '', pos: X.pos };
  return txt.replace(/\{(\w+)\}/g, function (m, k) { return v[k] !== undefined ? v[k] : m; });
};

/** @type {MgrEventDef[]} */
G.mgrEv.cards = [
  { id: 'm_star', w: 5, c: function (X) { return X.b >= 1 && X.b <= 3 && X.star; }, t: 'La stella contro di te', d: '{star} si lamenta in pubblico delle tue scelte.', o: [
      ['Fuori squadra per una partita', { mo: -5, conf: 2, fn: -1 }, 'Messaggio chiaro: le regole valgono per tutti.'],
      ['Ne parlo a quattr’occhi', { p: 0.6, ok: { mo: 4 }, ko: { mo: -4 } }, 'Chiarimento: {star} torna a correre per te.', 'Niente da fare, il caso si allarga.'],
      ['Gli do ragione', { mo: 2, conf: -3 }, 'Lo spogliatoio è sereno, la società meno.']] },
  { id: 'm_president', w: 4, c: function (X) { return X.b === 0 || X.b === 2; }, t: 'Il presidente vuole un colpo', d: 'Il presidente vuole un grande nome per accendere i tifosi del {club}.', o: [
      ['D’accordo, spendiamo', { bud: -4, fn: 4, conf: 3, mo: 2 }, 'Arriva un nome che fa sognare la piazza.'],
      ['Meglio investire sui giovani', { conf: -2, rep: 1 }, 'Il presidente sbuffa, ma accetta.']] },
  { id: 'm_oldcoach', w: 6, c: function (X) { return X.old && X.b <= 3; }, t: 'Il tuo vecchio maestro', d: '{old}, che ti allenava quando giocavi, ora guida il {oldClub}. Prima della sfida ti chiama.', o: [
      ['«Stavolta vinco io»', { mo: 3, fn: 1 }, 'La sfida tra maestro e allievo riempie i giornali.'],
      ['Lo ringrazio per tutto', { rep: 1, mo: 1 }, 'Un bel gesto che il calcio apprezza.']] },
  { id: 'm_ultras', w: 6, c: function (X) { return X.conf < 40 && X.b >= 1; }, t: 'Contestazione', d: 'Dopo l’ultima sconfitta la curva del {club} contesta squadra e panchina.', o: [
      ['Vado sotto la curva', { p: 0.5, ok: { fn: 5, mo: 2 }, ko: { fn: -3, conf: -2 } }, 'Ti ascoltano: applausi e cori.', 'Fischi e insulti: brutta serata.'],
      ['Ritiro punitivo', { mo: -4, conf: 3 }, 'La società apprezza il pugno duro.'],
      ['Chiedo pazienza in conferenza', { conf: 1, fn: 1 }, 'Parole misurate, il clima si calma un po’.']] },
  { id: 'm_kid', w: 4, c: function (X) { return X.kid && X.b <= 3; }, t: 'Il ragazzo della Primavera', d: '{kid} brilla in allenamento: tutti ti chiedono di farlo esordire.', o: [
      ['Lo faccio esordire', { young: 3, fn: 3, mo: 1 }, 'Esordio da ricordare: il ragazzo cresce a vista d’occhio.'],
      ['È presto, deve aspettare', { mo: 1 }, 'Il ragazzo continua a lavorare.']] },
  { id: 'm_heir', w: 8, c: function (X) { return X.heir && X.heir.c !== X.club.id && X.heir.a <= 22 && X.b === 0; }, t: 'Il tuo erede chiama', d: '{heir} ti chiede un consiglio: resto al {heirClub} o vengo a giocare per te?', o: [
      ['Vieni da me', { heir: 1 }, 'Il ragazzo arriva al {club}: ora tocca a te farlo crescere.'],
      ['Resta lì e gioca', { rep: 1 }, 'Gli fai i complimenti e lo segui da lontano.']] },
  { id: 'm_tv', w: 3, c: function (X) { return X.b <= 3; }, t: 'Ospite in TV', d: 'Un talk show sportivo ti invita a commentare la giornata.', o: [
      ['Analisi tecnica, niente polemiche', { rep: 1 }, 'Tutti parlano della tua competenza.'],
      ['Attacco gli arbitri', { fn: 3, conf: -2, rep: -1 }, 'I tifosi godono, la lega ti multa.']] },
  { id: 'm_injuries', w: 4, c: function (X) { return X.b >= 1 && X.b <= 3; }, t: 'Emergenza infortuni', d: 'Tre titolari fermi nello stesso reparto.', o: [
      ['Adatto un ragazzo in quel ruolo', { mo: 2, young: 1 }, 'Soluzione di casa, il gruppo apprezza.'],
      ['Chiedo un acquisto urgente', { bud: -3, mo: 3, conf: -1 }, 'Arriva un rinforzo, ma la società fa i conti.']] },
  { id: 'm_renew', w: 5, c: function (X) { return X.conf >= 75 && (X.b === 0 || X.b === 3); }, t: 'La società vuole blindarti', d: 'Il {club} ti offre un rinnovo lungo con aumento.', o: [
      ['Firmo', { conf: 8, $: 400 }, 'Sei il punto fermo del progetto.'],
      ['Mi tengo le mani libere', { rep: 1 }, 'Le big ti osservano.']] },
  { id: 'm_split', w: 6, c: function (X) { return X.morale < 40 && X.b >= 1; }, t: 'Spogliatoio spaccato', d: 'Senatori contro giovani: il gruppo si divide.', o: [
      ['Riunione con i senatori', { p: 0.6, ok: { mo: 8 }, ko: { mo: -2 } }, 'Il gruppo si ricompatta.', 'La riunione finisce male.'],
      ['Pugno duro con tutti', { mo: -3, conf: 2 }, 'Silenzio in spogliatoio.']] },
  { id: 'm_sellcap', w: 4, c: function (X) { return X.star && (X.b === 0 || X.b === 2); }, t: 'Il presidente vuole vendere la stella', d: 'Una big offre molto per {star}. Il presidente vuole i soldi.', o: [
      ['Mi oppongo', { conf: -4, fn: 4, mo: 2 }, '{star} resta, i tifosi ti adorano.'],
      ['Vendiamo e reinvestiamo', { bud: 12, fn: -6, mo: -4, conf: 3 }, 'Cassa piena, piazza delusa.']] },
  { id: 'm_shirt', w: 8, once: 1, c: function (X) { return X.m.shirt === X.club.id && X.b <= 1; }, t: 'La serata della tua maglia', d: 'Il {club} organizza una serata per la tua maglia ritirata, prima della partita.', o: [
      ['Saluto la curva', { fn: 5, mo: 3 }, 'Lo stadio canta il tuo nome come ai vecchi tempi.']] }
];

/** @param {State} st */
G.mgrEv.roll = function (st) {
  if (st.event || !G.mgr.active(st) || st.S.block > 4 || !G.rng.chance(G.CFG.MGR_EV_CHANCE)) return;
  var X = G.mgrEv.ctx(st), used = st.evUsed || (st.evUsed = {});
  var pool = G.mgrEv.cards.filter(function (c) {
    if (used[c.id] && (c.once || used[c.id] === st.S.year)) return false;
    try { return c.c(X); } catch (e) { return false; }
  });
  if (!pool.length) return;
  var card = pool[G.match.pickWeighted(pool.map(function (c) { return c.w; }), G.rng)];
  used[card.id] = card.once ? 1 : st.S.year;
  st.event = { id: card.id, mgr: 1, t: G.mgrEv.fill(card.t, X), d: G.mgrEv.fill(card.d, X), o: card.o.map(function (o) { return G.mgrEv.fill(o[0], X); }) };
};

/** @param {State} st @param {number} idx */
G.mgrEv.apply = function (st, idx) {
  var ev = st.event, card = G.mgrEv.cards.filter(function (c) { return c.id === ev.id; })[0];
  st.event = null;
  if (!card || !G.mgr.active(st)) return;
  var X = G.mgrEv.ctx(st), opt = card.o[idx] || card.o[0], fx = opt[1], txt = opt[2];
  G.mgrEv.effects(st, fx, X);
  if (fx.p !== undefined) { var ok = G.rng.chance(fx.p); G.mgrEv.effects(st, ok ? fx.ok : fx.ko, X); txt = ok ? opt[2] : opt[3] || opt[2]; }
  st.eventResult = { t: ev.t, r: G.mgrEv.fill(txt, X) };
  G.news(st, '🗒️ ' + ev.t + ': ' + st.eventResult.r);
};

/** @param {State} st @param {MgrFx} fx @param {MgrEvCtx} X */
G.mgrEv.effects = function (st, fx, X) {
  var m = st.mgr, W = st.world, club = X.club;
  if (fx.conf) m.conf = Math.round(G.clamp(m.conf + fx.conf, -10, 100));
  if (fx.mo) m.morale = Math.round(G.clamp(m.morale + fx.mo, 0, 100));
  if (fx.rep) { m.rep = G.clamp(m.rep + fx.rep, 40, 97); if (m.co >= 0) W.coaches[m.co].rep = m.rep; }
  if (fx.fn) G.life.fans(st, club.id, fx.fn);
  if (fx.$) st.player.money += fx.$;
  if (fx.bud) club.bud = Math.round((club.bud + fx.bud) * 10) / 10;
  if (fx.young && X.kid) X.kid.o = Math.min(X.kid.p, X.kid.o + fx.young);
  if (fx.heir && X.heir) {
    var from = W.clubs[X.heir.c];
    if (from) from.sq = from.sq.filter(function (id) { return id !== X.heir.i; });
    X.heir.c = club.id; club.sq.push(X.heir.i); X.heir.y = 4;
    G.season.refresh(st);
  }
};
