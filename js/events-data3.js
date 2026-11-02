// @ts-check
// Follow-up cards: some answers leave a mark ({ mark: 'key' } in st.flags with the year and club) and, one or more
// seasons later, the story comes back. Same format as js/events-data.js; each card clears its mark when drawn.

// The mark exists and is at least yrs seasons old (same: only at the club where it happened)
/** @param {EvCtx} X @param {string} k @param {number} yrs @param {number} [same] */
G.events.after = function (X, k, yrs, same) {
  var f = X.flags[k];
  return !!f && typeof f === 'object' && X.st.year - f.y >= yrs && (!same || f.club === X.club.id);
};

G.events.cards.push(
  { id: 'f_kid', w: 6, clear: 'kid', c: function (X) { return G.events.after(X, 'kid', 1, 1); }, t: 'Il ragazzo che hai aiutato', d: 'Il giovane della Primavera che avevi preso sotto la tua ala ha esordito in prima squadra e ti dedica il suo primo gol.', o: [
      ['Lo abbraccio davanti a tutti', { mo: 4, fn: 4, fa: 1 }, 'Lo stadio applaude tutti e due.'],
      ['Gli dico di non montarsi la testa', { rel: 3, mo: 2 }, 'Un consiglio da veterano, il mister approva.']] },
  { id: 'f_rumor', w: 5, clear: 'rumor', c: function (X) { return G.events.after(X, 'rumor', 1) && X.b >= 1 && X.b <= 3 && (X.att ? X.dry >= 3 : X.avg && X.avg < 6.5); }, t: 'Il giornalista torna alla carica',
    d: 'Lo stesso giornalista delle voci di mercato ora scrive che pensi solo al contratto e per questo rendi meno.', o: [
      ['Rispondo in campo', { mo: 2, p: 0.5, ok: { fo: 0.3, fa: 1 }, ko: { fa: -1 } }, 'Partita da protagonista: il pezzo sparisce.', 'Altra prova opaca. Lui ha gioco facile.'],
      ['Lo attacco sui social', { fa: 2, fn: -3, rel: -2 }, 'Polemica enorme. Il club ti chiede di calmarti.'],
      ['Lo invito a un allenamento', { fa: 1, rel: 1, fn: 1 }, 'Esce un articolo molto più gentile.']] },
  { id: 'f_hospital', w: 6, clear: 'hospital', c: function (X) { return G.events.after(X, 'hospital', 2) && X.b <= 3; }, t: 'Una visita inattesa',
    d: 'Uno dei bambini che avevi visitato in ospedale è guarito: oggi è in tribuna con la tua maglia.', o: [
      ['Gli regalo gli scarpini a fine partita', { mo: 5, fn: 4, fa: 2 }, 'La foto fa il giro del mondo.'],
      ['Lo invito negli spogliatoi', { mo: 4, rel: 1, fa: 1 }, 'Tutta la squadra firma il suo pallone.']] },
  { id: 'f_letter', w: 5, clear: 'letter', c: function (X) { return G.events.after(X, 'letter', 3); }, t: 'Il bambino della lettera',
    d: 'Il bambino che ti aveva scritto anni fa ora gioca in un settore giovanile. Suo padre ti manda un video di un suo gol.', o: [
      ['Vado a vederlo giocare', { mo: 3, fa: 2, fn: 2 }, 'Dopo la partita ti chiede l’autografo, di nuovo.'],
      ['Gli registro un messaggio', { mo: 2, fa: 1 }, 'Il messaggio diventa virale.']] },
  { id: 'f_feud', w: 6, clear: 'feud', c: function (X) { return G.events.after(X, 'feud', 1, 1) && X.b >= 1; }, t: 'Vecchie ruggini',
    d: 'Il compagno con cui avevi litigato in allenamento ora fa gruppo contro di te nello spogliatoio.', o: [
      ['Lo affronto a quattr’occhi', { p: 0.5, ok: { mo: 3, rel: 2 }, ko: { mo: -3, rel: -3 } }, 'Pace fatta, stavolta per davvero.', 'Volano parole grosse, il clima peggiora.'],
      ['Lascio parlare il campo', { mo: -1, rel: 2 }, 'Il mister apprezza la calma.']] },
  { id: 'f_party', w: 5, clear: 'party', c: function (X) { return G.events.after(X, 'party', 1) && X.b >= 1 && X.fame >= 15; }, t: 'Le foto riemergono',
    d: 'Un sito pubblica le foto della festa di un anno fa, proprio alla vigilia di una partita importante.', o: [
      ['Ci rido sopra', { p: 0.6, ok: { fa: 1 }, ko: { fa: -2, rel: -2 } }, 'Il caso si sgonfia in un giorno.', 'Il club non gradisce la leggerezza.'],
      ['Chiedo scusa', { fa: -1, rel: 1 }, 'Pagina girata.']] },
  { id: 'f_lie', w: 5, clear: 'lie', c: function (X) { return G.events.after(X, 'lie', 1); }, t: 'La verità viene a galla',
    d: 'Il fotografo che avevi smentito pubblica il video completo di quella notte.', o: [
      ['Ammetto tutto', { fa: -1, rel: -1, mo: 1 }, 'Brutta figura, ma la storia si chiude.'],
      ['Querelo il giornale', { $: -200, p: 0.35, ok: { fa: 2 }, ko: { fa: -3, rel: -2 } }, 'Il giudice ti dà ragione.', 'Perdi la causa e la faccia.']] },
  { id: 'f_charity', w: 5, clear: 'charity', c: function (X) { return G.events.after(X, 'charity', 1) && X.b <= 1; }, t: 'Il campo della partita benefica',
    d: 'Con i fondi della partita benefica è nato un campo da calcio per i ragazzi del quartiere: vogliono intitolarlo a te.', o: [
      ['Accetto, è un onore', { fa: 3, fn: 3, mo: 3 }, 'All’inaugurazione ci sono mille bambini.'],
      ['Dedicatelo ai ragazzi', { fa: 2, fn: 5, mo: 2 }, 'Un gesto che i tifosi non dimenticano.']] },
  { id: 'f_president', w: 5, clear: 'president', c: function (X) { return G.events.after(X, 'president', 1, 1) && !X.loan; }, t: 'Il presidente si ricorda di te',
    d: 'Il presidente del {club} ti propone di parlare del rinnovo senza aspettare la scadenza.', o: [
      ['Parliamone subito', { renew: 1, mo: 2 }, 'Il tuo agente è già al telefono.'],
      ['Più avanti, ora penso al campo', { mo: 1, rel: 1 }, 'Il presidente apprezza.']] }
);

// Role change proposed by the coach: a neighbouring position where the player keeps most of his overall and plays more
/** @param {State} st @returns {RoleSwap|null} */
G.events.roleSwap = function (st) { return G.pos.proposal(st); };  // M9 S5: a neighbouring position (G.pos.NEAR)
G.events.cards.push(
  { id: 'rolechange', w: 6, c: function (X) {
      var p = X.p; if (p.roleFrom || X.loan || X.b > 3 || !X.co) return false;
      if (X.age < 20 || X.lastMatches < 3 || (X.minShare >= 0.45 && G.season.startChance(X.st) >= 0.6)) return false;
      X.swap = G.events.roleSwap(X.st); return !!X.swap;
    }, t: 'Il mister ti propone un nuovo ruolo',
    d: '{coach} ti vede come {newRole}: lì saresti {newOvr} di overall e titolare in circa il {newPct}% delle partite (ora il {nowPct}%).', o: [
      ['Accetto, voglio giocare', { role: 1, rel: 4, mo: 2 }, 'Da oggi giochi nel nuovo ruolo.'],
      ['Resto nel mio ruolo e lotto', { rel: -2, mo: 1 }, 'Il mister rispetta la scelta, ma il posto te lo devi guadagnare.']] }
);
