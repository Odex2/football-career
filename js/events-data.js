// @ts-check
// Event cards. Add new ones by appending objects: see the format in js/events.js.
// X fields: p, club, L, co, rel, b (block), age, fame, money, ovr, form, morale, minShare, avg, goalsS, appsS,
// pos, n, tier, big, euro, riv, loan, flags, seasons, atClub, abroad, att, def, last

/** @type {EventDef[]} */
G.events.cards = [
  // ---------- first steps (17-20) ----------
  { id: 'firstday', once: 1, w: 10, c: function (X) { return X.seasons === 0 && X.b === 0; }, t: 'Primo giorno nello spogliatoio',
    d: 'Entri nello spogliatoio del {club}. I senatori ti squadrano.', o: [
      ['Saluto tutti, testa bassa', { rel: 5, mo: 2 }, 'Il gruppo ti accoglie bene.'],
      ['Mi presento con personalità', { p: 0.5, ok: { fa: 2, mo: 4 }, ko: { rel: -4 } }, 'Piaci subito: hai carattere.', 'Qualcuno ti prende per arrogante.']] },
  { id: 'mentor', w: 4, c: function (X) { return X.age <= 20; }, t: 'Il senatore', d: 'Un veterano del {club} si offre di farti da guida.', o: [
      ['Lo ascolto', { at: { pos: 1, fre: 1 }, rel: 2 }, 'Impari a leggere le partite.'],
      ['Preferisco fare da solo', { mo: 2 }, 'Vai per la tua strada.']] },
  { id: 'school', once: 1, w: 3, c: function (X) { return X.age <= 18; }, t: 'Diploma o pallone?', d: 'La maturità si avvicina e gli allenamenti sono tanti.', o: [
      ['Studio la sera', { mo: 3, fo: -0.2 }, 'Diploma preso: la famiglia è orgogliosa.'],
      ['Solo calcio', { at: { res: 1 }, mo: -1 }, 'Più energie per il campo.']] },
  { id: 'party', w: 3, c: function (X) { return X.age <= 22 && X.b > 0; }, t: 'La festa', d: 'I compagni organizzano una festa a due giorni dalla partita.', o: [
      ['Ci vado', { mark: 'party', p: 0.6, ok: { mo: 4, rel: -1 }, ko: { fa: -2, rel: -6, fo: -0.3 } }, 'Serata divertente, nessuno se ne accorge.', 'Le foto finiscono online. Il mister non è contento.'],
      ['Resto a casa', { rel: 2, fo: 0.1 }, 'Ti presenti fresco all’allenamento.']] },
  { id: 'homesick', w: 4, c: function (X) { return X.loan || (X.abroad && X.atClub === 0 && X.age <= 21); }, t: 'Nostalgia', d: 'Sei lontano da casa e ti mancano famiglia e amici.', o: [
      ['Faccio venire la famiglia', { mo: 4, $: -15 }, 'Un weekend in famiglia ti rimette in sesto.'],
      ['Stringo i denti', { mo: -2, fo: 0.1 }, 'Ti butti negli allenamenti.']] },
  { id: 'firstagent', once: 1, w: 6, c: function (X) { return !G.life.agent(X.p) && X.fame >= 12; }, t: 'Un agente ti cerca', d: 'Un procuratore ti ha notato e vuole rappresentarti.', o: [
      ['Firmo con lui', { agent: 1 }, 'Hai un agente: più visibilità e contratti migliori.'],
      ['Per ora no', {}, 'Continui senza procuratore.']] },
  { id: 'bootsponsor', once: 1, w: 4, c: function (X) { return X.fame >= 10 && X.fame < 40; }, t: 'Il primo sponsor', d: 'Un marchio di scarpini ti offre un piccolo contratto.', o: [
      ['Accetto', { $: 60, fa: 1 }, '60 mila euro e scarpini nuovi.'],
      ['Aspetto offerte migliori', { mo: 1 }, 'Ci saranno altre occasioni.']] },
  { id: 'loanchoice', w: 3, c: function (X) { return X.loan && X.b === 1; }, t: 'Occhi dal club madre', d: 'Il club proprietario del tuo cartellino ti segue da vicino.', o: [
      ['Mando video e report', { at: { any: 1 } }, 'Lavori su un dettaglio che ti avevano chiesto.'],
      ['Penso solo al {club}', { fn: 4, rel: 3 }, 'I tifosi apprezzano.']] },

  // ---------- coach ----------
  { id: 'newcoach', force: 1, clear: 'newCoach', c: function (X) { return X.flags.newCoach !== undefined; }, t: 'Nuovo allenatore', d: 'Al {club} arriva {coach}.', o: [
      ['Mi presento subito', { rel: 6 }, '{coach} apprezza l’iniziativa.'],
      ['Aspetto che mi chiami', {}, 'Vedrete sul campo.']] },
  { id: 'praise', w: 4, c: function (X) { return X.co && X.rel >= 10 && X.lastApps >= 3 && X.avg >= 7; }, t: 'Elogi in conferenza', d: '{coach} in conferenza parla di te come di un giocatore chiave: media voto {avg} nelle ultime {lastApps} partite.', o: [
      ['Grazie mister', { mo: 4, fa: 1 }, 'Fiducia alle stelle.']] },
  { id: 'critic', w: 4, c: function (X) { return X.co && (X.rel <= -15 || (X.lastApps >= 3 && X.avg < 6.2)); }, t: 'Critiche pubbliche', d: '{coach} in conferenza: "Da lui mi aspetto di più".', o: [
      ['Rispondo a tono', { rel: -8, fa: 1, fn: 2 }, 'I tifosi stanno con te, il mister meno.'],
      ['Lavoro in silenzio', { rel: 4, mo: -2 }, 'Il mister nota il tuo atteggiamento.']] },
  { id: 'bench', w: 5, c: function (X) { return X.minShare < 0.3 && X.lastMatches >= 3 && X.age >= 20 && X.b > 0; }, t: 'Poco spazio', d: 'Hai giocato solo il {minPct}% dei minuti nelle ultime partite. Che fai?', o: [
      ['Parlo con {coach}', { p: 0.5, ok: { rel: 5, promise: 1 }, ko: { rel: -5 } }, 'Il mister ti promette più spazio.', 'Il confronto va male.'],
      ['Mi alleno il doppio', { at: { any: 1 }, mo: -1 }, 'Ti fai trovare pronto.'],
      ['Chiedo la cessione', { req: 1 }, 'Il tuo agente si muove sul mercato.']] },
  { id: 'youngcoach', w: 5, c: function (X) { return X.co && X.co.sty === 'giovani' && X.age <= 21; }, t: 'Il mister crede in te', d: '{coach} ama lanciare i giovani e ti vuole al centro del progetto.', o: [
      ['Non lo deluderò', { rel: 5, mo: 3 }, 'Ti senti importante.']] },
  { id: 'motivator', w: 4, c: function (X) { return X.co && X.co.sty === 'motivatore' && X.morale < 45; }, t: 'Il discorso', d: '{coach} ti prende da parte e ti scuote.', o: [
      ['Ascolto', { mo: 8, rel: 3 }, 'Torni a sorridere.']] },
  { id: 'defcoach', w: 3, c: function (X) { return X.co && X.co.sty === 'difensivo' && X.att; }, t: 'Calcio prudente', d: '{coach} ti chiede di rientrare e coprire più che attaccare.', o: [
      ['Mi adatto', { at: { res: 1, for: 1 }, rel: 3, mo: -1 }, 'Diventi più completo.'],
      ['Mi lamento', { rel: -5, vis: 0.2 }, 'Qualche club ti nota insoddisfatto.']] },
  { id: 'tactician', w: 3, c: function (X) { return X.co && X.co.sty === 'tattico'; }, t: 'Lavagna tattica', d: '{coach} ti propone ore extra di video e tattica.', o: [
      ['Ci sto', { at: { pos: 1, vis: 1 }, rel: 3 }, 'Capisci il gioco meglio.'],
      ['Preferisco il campo', { at: { any: 1 } }, 'Lavori a modo tuo.']] },
  { id: 'excoach', w: 4, c: function (X) {
      return X.b !== 3 && X.W.coaches.some(function (co) { return co.c >= 0 && co.c !== X.club.id && (X.p.rel[co.i] || 0) >= 35; });
    }, t: 'Una telefonata', d: 'Un tuo ex allenatore ti chiama: ti vorrebbe di nuovo con sé.', o: [
      ['Ascolto la proposta', { offer: 'COACH' }, 'Arriva un’offerta: la trovi nel Mercato.'],
      ['Sto bene qui', { rel: 2 }, 'Lo ringrazi, ma resti.']] },
  { id: 'captain', once: 1, w: 6, c: function (X) { return X.atClub >= 3 && X.age >= 24 && X.rel >= 15 && X.minShare >= 0.6; }, t: 'La fascia', d: '{coach} ti offre la fascia da capitano del {club}.', o: [
      ['Accetto con orgoglio', { mo: 6, fn: 6, rel: 4, fa: 2 }, 'Sei il capitano.'],
      ['Non me la sento', { mo: -1 }, 'La fascia va a un compagno.']] },
  { id: 'penalty', w: 3, c: function (X) { return !X.def && X.rel >= 10 && X.minShare >= 0.5; }, t: 'Il dischetto', d: 'Il rigorista è infortunato: chi tira?', o: [
      ['Lo tiro io', { p: 0.72, ok: { mo: 3, at: { fre: 1 } }, ko: { mo: -4, fa: -1 } }, 'Gol: sei tu il rigorista ora.', 'Parato. Che serata storta.'],
      ['Lascio a un compagno', { rel: 1 }, 'Spirito di squadra.']] },

  // ---------- squad / market ----------
  { id: 'newrival', force: 1, clear: 'newRival', c: function (X) { return !!X.flags.newRival; }, t: 'Concorrenza in arrivo', d: 'Il {club} ha preso {rival}, che gioca nel tuo ruolo.', o: [
      ['Accetto la sfida', { at: { any: 1 }, mo: 1 }, 'Ti alleni con più rabbia.'],
      ['Chiedo garanzie', { p: 0.5, ok: { promise: 1 }, ko: { rel: -5 } }, 'Il club ti rassicura: sei titolare.', 'Nessuna garanzia, solo silenzio.'],
      ['Chiedo la cessione', { req: 1 }, 'Il mercato è avvisato.']] },
  { id: 'agentpush', w: 4, c: function (X) { return G.life.agent(X.p) && X.lastApps >= 3 && X.avg >= 7 && X.club.rep < X.ovr + 2 && (X.b === 0 || X.b === 1); }, t: 'L’agente spinge', d: 'Il tuo agente dice che è il momento di fare il salto.', o: [
      ['Fallo lavorare', { vis: 0.4, rel: -3, fn: -3 }, 'Le voci di mercato si moltiplicano.'],
      ['Resto concentrato', { rel: 2 }, 'Il mercato può aspettare.']] },
  { id: 'agentfee', w: 2, c: function (X) { return G.life.agent(X.p) && X.money > 300; }, t: 'Commissione extra', d: 'Il tuo agente chiede un bonus per il lavoro dell’ultimo anno.', o: [
      ['Pago', { $: -120 }, 'Rapporto solido.'],
      ['Rifiuto', { p: 0.6, ok: {}, ko: { dropAgent: 1 } }, 'Accetta, a malincuore.', 'Se ne va sbattendo la porta.']] },
  { id: 'renewtalk', w: 5, c: function (X) { return X.p.contract && X.p.contract.years <= 1 && !X.loan && X.b < 3; }, t: 'Contratto in scadenza', d: 'Il tuo contratto col {club} scade presto.', o: [
      ['Chiedo il rinnovo', { renew: 1 }, 'Il club ti fa sapere qualcosa: guarda il Mercato.'],
      ['Mi guardo intorno', { vis: 0.3, fn: -2 }, 'Lasci le porte aperte.']] },
  { id: 'saudi', w: 3, c: function (X) { return X.age >= 27 && X.fame >= 35 && X.club.nat !== 'KSA' && X.b === 0; }, t: 'Sirene arabe', d: 'Dall’Arabia Saudita arriva una proposta da capogiro.', o: [
      ['Ascolto', { offer: 'KSA' }, 'L’offerta è nel Mercato.'],
      ['Il calcio europeo prima di tutto', { fn: 3, fa: 1 }, 'I tifosi apprezzano.']] },
  { id: 'mls', w: 3, c: function (X) { return X.age >= 30 && X.fame >= 45 && X.club.nat !== 'USA' && X.b === 0; }, t: 'Il sogno americano', d: 'Un club di MLS ti propone un progetto tra campo e marketing.', o: [
      ['Sentiamo', { offer: 'USA' }, 'L’offerta è nel Mercato.'],
      ['Non è il momento', {}, 'Resti in Europa.']] },
  { id: 'homecall', w: 3, c: function (X) { return X.age >= 29 && X.abroad && X.homeLg && X.b === 0; }, t: 'Ritorno a casa?', d: 'Un club del tuo paese ({nation}) ti vorrebbe riportare a casa.', o: [
      ['Ascolto', { offer: 'HOME' }, 'L’offerta è nel Mercato.'],
      ['Non ancora', {}, 'Ancora qualche anno all’estero.']] },
  { id: 'crisis', w: 3, c: function (X) { return X.club.bud < 2 && X.tier === 1; }, t: 'Stipendi in ritardo', d: 'Il {club} è in difficoltà economica e gli stipendi tardano.', o: [
      ['Pazienza, siamo una squadra', { fn: 5, mo: -3 }, 'I tifosi non lo dimenticheranno.'],
      ['Chiedo garanzie o la cessione', { req: 1 }, 'Inizia una trattativa per l’uscita.']] },

  // ---------- form & performance ----------
  { id: 'hot', w: 4, c: function (X) { return X.lastApps >= 4 && X.avg >= 7.3; }, t: 'Momento d’oro', d: 'Media voto {avg} e {lastG} gol nelle ultime {lastApps} partite: i tifosi cantano il tuo nome.', o: [
      ['Festeggio sotto la curva', { fn: 4, fa: 1 }, 'Un boato.'],
      ['Testa bassa e lavorare', { rel: 3, fo: 0.1 }, 'Il mister apprezza.']] },
  { id: 'drought', w: 4, c: function (X) { return X.att && X.dry >= 5; }, t: 'Digiuno', d: 'Non segni da {dry} partite. La stampa comincia a parlarne.', o: [
      ['Extra tiri dopo l’allenamento', { at: { fin: 1 }, fo: 0.1 }, 'Ritrovi sensazioni.'],
      ['Sessione col mental coach', { $: -20, mo: 4 }, 'Ti senti più leggero.']] },
  { id: 'hattrick', w: 8, c: function (X) { return (X.last.rows || []).some(function (r) { return r.g >= 3; }); }, t: 'Il pallone della tripletta', d: 'Hai segnato una tripletta. Il pallone è tuo.', o: [
      ['Lo regalo a un giovane tifoso', { fn: 5, fa: 2 }, 'Il video fa il giro del web.'],
      ['Lo tengo in bacheca', { mo: 3 }, 'Un ricordo per sempre.']] },
  { id: 'redcard', w: 2, c: function (X) { return X.b > 0 && X.lastApps >= 3; }, t: 'Espulsione discussa', d: 'Un rosso molto dubbio: rischi una squalifica.', o: [
      ['Protesto pubblicamente', { fa: 1, rel: -2, inj: 2, fn: 2 }, 'Due giornate di squalifica.'],
      ['Accetto la decisione', { inj: 1, rel: 2 }, 'Una giornata e via.']] },
  { id: 'knock', w: 3, c: function (X) { return X.b > 0 && X.p.inj === 0; }, t: 'Piccolo fastidio', d: 'Senti tirare il flessore prima di una partita importante.', o: [
      ['Gioco lo stesso', { p: 0.7, ok: { rel: 3, fo: 0.2 }, ko: { inj: 6 } }, 'Stringi i denti e vai alla grande.', 'Stiramento: fuori qualche settimana.'],
      ['Mi fermo', { inj: 1 }, 'Prudenza.']] },
  { id: 'rush', w: 5, c: function (X) { return X.p.inj >= 4; }, t: 'Rientro anticipato?', d: 'Lo staff ti propone di accelerare il recupero.', o: [
      ['Forziamo', { p: 0.5, ok: { inj: -3 }, ko: { inj: 4 } }, 'Torni prima del previsto.', 'Ricaduta: ancora fermo.'],
      ['Rispetto i tempi', { mo: -1 }, 'Pazienza.']] },
  { id: 'fragile', w: 3, c: function (X) { return X.p.traits.indexOf('fragile') >= 0 && X.p.inj > 0; }, t: 'Lo specialista', d: 'Un luminare può aiutarti a prevenire gli infortuni.', o: [
      ['Pago la visita', { $: -150, at: { res: 1, for: 1 } }, 'Un programma su misura.'],
      ['Non serve', {}, 'Speriamo bene.']] },
  { id: 'boots', w: 2, c: function () { return true; }, t: 'Scarpini nuovi', d: 'Lo sponsor ti manda un modello nuovo prima della partita.', o: [
      ['Li provo subito', { p: 0.5, ok: { fo: 0.3 }, ko: { fo: -0.3 } }, 'Sembrano fatti per te.', 'Vesciche e sensazioni pessime.'],
      ['Resto sui vecchi', {}, 'Non si cambia ciò che funziona.']] },
  { id: 'scorerrace', w: 5, c: function (X) { return X.lgG >= 8 && X.scorerRank <= 3 && X.leaderG - X.lgG <= 3 && X.b >= 2; }, t: 'Corsa al titolo di capocannoniere', d: 'Hai {lgG} gol in {league}: sei {rank}º nella classifica marcatori e il primo ne ha {leaderG}.', o: [
      ['Chiedo di tirare tutti i rigori', { p: 0.6, ok: { mo: 2, at: { fin: 1 } }, ko: { rel: -4 } }, 'Il mister acconsente.', 'Il mister ti dice di pensare alla squadra.'],
      ['Penso alla squadra', { rel: 3 }, 'Gol o no, conta vincere.']] },
  { id: 'bdobuzz', w: 5, c: function (X) { return X.bdoRank <= 5; }, t: 'Si parla di Pallone d’Oro', d: 'La stampa internazionale ti mette tra i favoriti per il Pallone d’Oro: sei {bdoRank}º nei pronostici.', o: [
      ['Alimento il sogno', { fa: 3, mo: 2, p: 0.7, ko: { fo: -0.3 } }, 'Sei sulle copertine.', 'La pressione ti pesa.'],
      ['Resto concentrato', { fo: 0.2 }, 'Parli solo di squadra.']] },
  { id: 'videogame', w: 2, c: function (X) { return X.fame >= 35; }, t: 'Rating del videogioco', d: 'Il nuovo videogioco di calcio ti dà un overall che ti sembra basso.', o: [
      ['Lo dico sui social', { fa: 2, mo: -1 }, 'Il post diventa virale.'],
      ['Benzina per motivarmi', { fo: 0.2 }, 'Lo stampi e lo appendi nell’armadietto.']] },

  // ---------- league situation ----------
  { id: 'promo', w: 5, c: function (X) { return X.tier === 2 && X.pos <= 5 && X.b === 3; }, t: 'Volata promozione', d: 'Il {club} è {pos}º e in corsa per salire di categoria.', o: [
      ['Trascino la squadra', { mo: 3, rel: 3, fn: 3 }, 'Tutti dietro di te.']] },
  { id: 'relegation', w: 5, c: function (X) { return X.tier === 1 && X.n && X.pos >= X.n - 3 && X.b >= 2; }, t: 'Lotta salvezza', d: 'Il {club} è {pos}º e rischia la retrocessione.', o: [
      ['Resto e lotto', { fn: 5, mo: -1 }, 'I tifosi ti vedono come uno di loro.'],
      ['Penso al mio futuro', { vis: 0.3, fn: -5 }, 'Gli osservatori ti notano.']] },
  { id: 'titlerace', w: 5, c: function (X) { return X.pos >= 1 && X.pos <= 2 && X.ptsGap <= 6 && X.b === 3; }, t: 'Volata per il titolo', d: 'Il {club} è {pos}º in {league}, con {gap} punti di distanza dall’altra pretendente al titolo.', o: [
      ['Ritiro anticipato con la squadra', { rel: 3, fo: 0.2, mo: -1 }, 'Massima concentrazione.'],
      ['Gestisco la pressione con calma', { mo: 2 }, 'Testa libera.']] },
  { id: 'derbyweek', w: 4, c: function (X) { return X.riv && X.b >= 1 && X.b <= 3; }, t: 'Settimana del derby', d: 'Arriva la sfida con {riv}. La città non parla d’altro.', o: [
      ['Carico i tifosi', { fn: 3, p: 0.5, ok: { mo: 2 }, ko: { fa: -1 } }, 'La curva è con te.', 'Le tue parole diventano benzina per gli avversari.'],
      ['Basso profilo', { rel: 2 }, 'Parlerà il campo.']] },
  { id: 'traitor', w: 6, c: function (X) { return Object.keys(X.p.traitor).length > 0 && X.b > 0; }, t: 'Fischi dagli ex', d: 'I tuoi ex tifosi ti hanno preso di mira. Ti chiamano traditore.', o: [
      ['Rispondo con un gesto', { fn: 3, fa: 2, rel: -2 }, 'Il nuovo pubblico ti adora.'],
      ['Ignoro', { mo: -2 }, 'Fa male lo stesso.']] },
  { id: 'eunight', w: 4, c: function (X) { return X.euAlive && X.b >= 1 && X.b <= 3; }, t: 'Notte europea', d: 'La musica dell’inno europeo. Brividi.', o: [
      ['Me la godo', { mo: 3, fa: 1 }, 'Una notte da ricordare.']] },
  { id: 'eudraw', w: 4, c: function (X) { return X.euro.length && X.b === 0; }, t: 'Il sorteggio', d: 'Il sorteggio della fase campionato mette il {club} contro avversari di peso.', o: [
      ['Sfide da grandi', { mo: 2 }, 'Non vedi l’ora.'],
      ['Testa al campionato', { rel: 1 }, 'Un passo alla volta.']] },
  { id: 'summertour', w: 3, c: function (X) { return X.club.rep >= 74 && X.b === 0; }, t: 'Tournée estiva', d: 'Il {club} va in tournée oltreoceano.', o: [
      ['Mi metto in mostra', { fa: 3, p: 0.85, ko: { inj: 3 } }, 'Folle di tifosi ovunque.', 'Un colpo in amichevole: salti l’inizio.'],
      ['Mi gestisco', { fo: 0.1 }, 'Preparazione perfetta.']] },
  { id: 'cold', w: 3, c: function (X) { return ['NOR', 'SCO', 'POL', 'UKR', 'DEN', 'CZE', 'SRB'].indexOf(X.club.nat) >= 0 && X.b === 2; }, t: 'Inverno rigido', d: 'Campi ghiacciati e temperature sotto zero.', o: [
      ['Palestra extra', { at: { for: 1 } }, 'Più forte fisicamente.'],
      ['Soffro in silenzio', { mo: -2 }, 'Non vedi l’ora della primavera.']] },
  { id: 'heat', w: 3, c: function (X) { return X.club.nat === 'KSA' && X.b <= 1; }, t: 'Caldo torrido', d: 'Si gioca con 40 gradi.', o: [
      ['Allenamenti serali', { fo: 0.1, at: { res: 1 } }, 'Ti adatti.'],
      ['Chiedo rotazioni', { rel: -2, mo: 1 }, 'Il mister annuisce, poco convinto.']] },
  { id: 'travel', w: 3, c: function (X) { return X.club.nat === 'USA'; }, t: 'Viaggi infiniti', d: 'Trasferte da costa a costa: fusi orari e stanchezza.', o: [
      ['Mi organizzo con lo staff', { $: -30, fo: 0.1 }, 'Recuperi bene.'],
      ['Tiro avanti', { at: { res: -1 }, mo: -1 }, 'La stanchezza si fa sentire.']] },
  { id: 'language', once: 1, w: 5, c: function (X) { return X.abroad && X.atClub === 0; }, t: 'Nuova lingua', d: 'Al {club} parlano un’altra lingua.', o: [
      ['Corso intensivo', { $: -15, mo: 2, rel: 4 }, 'In poche settimane ti fai capire.'],
      ['Mi arrangio', { mo: -2 }, 'Qualche incomprensione in campo.']] },

  // ---------- media, fame, fans ----------
  { id: 'interview', w: 4, c: function (X) { return X.fame >= 30; }, t: 'Domanda sul mercato', d: 'Un giornalista ti chiede del tuo futuro.', o: [
      ['Smentisco: sto bene qui', { rel: 3, fn: 2 }, 'Parole che i tifosi apprezzano.'],
      ['Mai dire mai', { vis: 0.3, fn: -4, rel: -3, mark: 'rumor' }, 'Titoloni sul mercato.']] },
  { id: 'social', w: 3, c: function (X) { return X.fame >= 25; }, t: 'Post discusso', d: 'Un tuo post divide i tifosi.', o: [
      ['Chiedo scusa', { fa: -1, mo: -1 }, 'La polemica si spegne.'],
      ['Non arretro', { p: 0.5, ok: { fa: 3 }, ko: { fa: -4, rel: -4 } }, 'Diventi un simbolo per molti.', 'La società ti multa.']] },
  { id: 'tv', w: 3, c: function (X) { return X.fame >= 50; }, t: 'Ospite in TV', d: 'Un programma in prima serata ti invita.', o: [
      ['Vado', { $: 80, fa: 2, fo: -0.1 }, 'Simpatia e ascolti.'],
      ['Declino', { rel: 1 }, 'Prima il campo.']] },
  { id: 'paparazzi', w: 3, c: function (X) { return X.fame >= 30 && X.age <= 28; }, t: 'Paparazzi', d: 'Ti fotografano in discoteca alle 3 di notte.', o: [
      ['Smentisco tutto', { mark: 'lie', p: 0.6, ok: {}, ko: { fa: -2, rel: -4 } }, 'La storia muore lì.', 'Escono altre foto. Pessima figura.'],
      ['Ammetto e chiedo scusa', { fa: -1, rel: -2, mo: 1 }, 'Onestà apprezzata.']] },
  { id: 'hospital', w: 3, c: function (X) { return X.fame >= 20; }, t: 'Ospedale pediatrico', d: 'Ti invitano a visitare i bambini dell’ospedale.', o: [
      ['Ci vado', { fa: 2, mo: 3, fn: 3, mark: 'hospital' }, 'Una giornata che non dimenticherai.'],
      ['Non ho tempo', { fa: -1 }, 'Qualcuno lo fa notare.']] },
  { id: 'fanday', w: 3, c: function (X) { return (X.p.fans[X.club.id] || 0) >= 35; }, t: 'Giornata con i tifosi', d: 'Il club organizza un incontro con i tifosi.', o: [
      ['Partecipo e firmo autografi', { fn: 5 }, 'Ore di selfie e sorrisi.'],
      ['Salto', { fn: -2, mo: 1 }, 'Un po’ di riposo.']] },
  { id: 'tattoo', w: 2, c: function (X) { return (X.p.fans[X.club.id] || 0) >= 50; }, t: 'Il tatuaggio', d: 'Un tifoso si è tatuato la tua faccia.', o: [
      ['Lo invito all’allenamento', { fn: 3, fa: 1 }, 'Il video è virale.'],
      ['Un like e via', {}, 'Tenerezza e imbarazzo.']] },
  { id: 'kidletter', w: 2, c: function (X) { return X.fame >= 15; }, t: 'Lettera di un bambino', d: 'Un bambino ti scrive: "Da grande voglio essere come te".', o: [
      ['Gli rispondo a mano', { mo: 3, fn: 2, mark: 'letter' }, 'Ti senti un esempio.']] },
  { id: 'streamer', w: 2, c: function (X) { return X.fame >= 20 && X.age <= 25; }, t: 'Live su Twitch', d: 'Uno streamer famoso ti invita a giocare in diretta.', o: [
      ['Ci sto', { fa: 2, fo: -0.1 }, 'Milioni di visualizzazioni.'],
      ['Meglio dormire', { fo: 0.1 }, 'Riposo prima di tutto.']] },
  { id: 'podcast', w: 2, c: function (X) { return X.fame >= 35; }, t: 'Il podcast', d: 'Un podcast sportivo ti propone una lunga intervista.', o: [
      ['Parlo a cuore aperto', { p: 0.5, ok: { fa: 3 }, ko: { rel: -5, fa: 1 } }, 'Tutti parlano della tua sincerità.', 'Una frase sul mister fa discutere.'],
      ['Risposte di rito', { fa: 1 }, 'Niente di memorabile.']] },
  { id: 'followers', w: 2, c: function (X) { return X.fame >= 40; }, t: 'Traguardo social', d: 'Hai superato {follow} milioni di follower.', o: [
      ['Video di ringraziamento', { fa: 1, fn: 1 }, 'Una pioggia di cuori.']] },
  { id: 'bigsponsor', w: 3, c: function (X) { return X.fame >= 45; }, t: 'Grande sponsor', d: 'Un marchio globale ti vuole come testimonial.', o: [
      ['Firmo', { $: 400, fa: 3, fo: -0.1 }, 'Il tuo volto è sui cartelloni.'],
      ['Solo calcio', { rel: 2 }, 'Il mister apprezza.']] },
  { id: 'hometv', w: 2, c: function (X) { return X.abroad && X.fame >= 25; }, t: 'Orgoglio nazionale', d: 'In {nation} sei sui giornali ogni settimana.', o: [
      ['Intervista ai media di casa', { fa: 2, mo: 2 }, 'Il paese è con te.']] },

  // ---------- money ----------
  { id: 'tax', w: 2, c: function (X) { return X.money >= 3000; }, t: 'Il fisco', d: 'Un controllo fiscale sui tuoi diritti d’immagine.', o: [
      ['Pago un buon consulente', { $: -200 }, 'Tutto in regola.'],
      ['Rischio', { p: 0.6, ok: {}, ko: { $: -900, fa: -3 } }, 'Nessun problema.', 'Multa salata e titoli imbarazzanti.']] },
  { id: 'tip', w: 2, c: function (X) { return X.money >= 1000; }, t: 'Il consiglio dell’amico', d: 'Un amico ti propone di investire in una startup.', o: [
      ['Investo 500 mila', { $: -500, p: 0.4, ok: { $: 1300 } }, 'Colpo grosso!', 'Soldi persi.'],
      ['No grazie', {}, 'Prudenza.']] },
  { id: 'luxcar', w: 2, c: function (X) { return X.money >= 600 && X.age <= 25 && !X.p.items.car; }, t: 'La supercar', d: 'Il concessionario ti propone un’auto sportiva.', o: [
      ['La compro', { buy: 'car' }, 'Bellissima. Il mister alza un sopracciglio.'],
      ['Non mi serve', { rel: 2 }, 'Testa sulle spalle.']] },
  { id: 'family', w: 2, c: function (X) { return X.b > 0; }, t: 'Problema in famiglia', d: 'Un familiare sta male. Vorresti tornare a casa qualche giorno.', o: [
      ['Torno a casa', { mo: 3, fo: -0.3, rel: -1 }, 'Il club capisce.'],
      ['Resto con la squadra', { mo: -4 }, 'Sei con la testa altrove.']] },
  { id: 'relocate', w: 4, c: function (X) { return X.atClub === 0 && X.b === 0 && X.seasons > 0; }, t: 'Trasloco', d: 'Nuova città, nuova casa. La famiglia ti segue?', o: [
      ['Sì, tutti insieme', { $: -60, mo: 4 }, 'Ti ambienti subito.'],
      ['Per ora vado da solo', { mo: -3 }, 'Serate lunghe in hotel.']] },

  // ---------- veteran ----------
  { id: 'mentorkid', w: 4, c: function (X) { return X.age >= 30; }, t: 'Il giovane del vivaio', d: 'Un ragazzo della Primavera ti chiede consigli.', o: [
      ['Lo prendo sotto la mia ala', { rel: 3, fn: 2, mo: 2, mark: 'kid' }, 'Il club apprezza.'],
      ['Non è compito mio', {}, 'Ognuno per sé.']] },
  { id: 'retirethought', w: 3, c: function (X) { return X.age >= 33; }, t: 'Pensieri sul ritiro', d: 'Il corpo fa più fatica. Quanto andrai avanti?', o: [
      ['Finché mi diverto', { mo: 3 }, 'Ancora fame.'],
      ['Comincio a pensarci', { mo: -2, fa: 1 }, 'Una carriera da celebrare.']] },
  { id: 'badges', once: 1, w: 3, c: function (X) { return X.age >= 31; }, t: 'Patentino da allenatore', d: 'Il federazione organizza un corso per allenatori.', o: [
      ['Mi iscrivo', { $: -30, rel: 4, at: { pos: 1 } }, 'Vedi il calcio con altri occhi.'],
      ['Più avanti', {}, 'Ora c’è il campo.']] },
  { id: 'farewell', w: 3, c: function (X) { return X.age >= 34 && X.fame >= 45; }, t: 'Omaggio degli avversari', d: 'Uno stadio avversario ti applaude in piedi.', o: [
      ['Ringrazio commosso', { fa: 3, mo: 4 }, 'Brividi.']] },
  { id: 'ambassador', w: 3, c: function (X) { return X.p.bandiera[X.club.id]; }, t: 'Ambasciatore', d: 'Il {club} ti propone di diventare ambasciatore del club.', o: [
      ['Accetto', { fn: 5, $: 100, fa: 1 }, 'Un legame per sempre.'],
      ['Solo dopo il ritiro', {}, 'Ne riparlerete.']] },
  { id: 'tribute', once: 1, w: 5, c: function (X) { return X.p.bandiera[X.club.id] && X.atClub >= 8; }, t: 'Tributo', d: 'La curva prepara una coreografia con il tuo volto.', o: [
      ['Mi commuovo', { fn: 5, fa: 3, mo: 5 }, 'Un momento che resterà nella storia del club.']] },
  { id: 'autobio', once: 1, w: 3, c: function (X) { return X.age >= 30 && X.fame >= 60; }, t: 'L’autobiografia', d: 'Un editore ti propone di scrivere la tua storia.', o: [
      ['La scrivo', { $: 300, fa: 2, p: 0.7, ko: { rel: -4 } }, 'Un bestseller.', 'Un capitolo sul mister fa scandalo.'],
      ['È presto', {}, 'La storia non è finita.']] },

  // ---------- misc ----------
  { id: 'fight', w: 2, c: function (X) { return X.b > 0; }, t: 'Lite in allenamento', d: 'Un contrasto duro con un compagno degenera.', o: [
      ['Chiarisco subito', { mo: 1, rel: 1 }, 'Stretta di mano.'],
      ['Tengo il punto', { mark: 'feud', p: 0.5, ok: { rel: 3, fa: 1 }, ko: { rel: -6, mo: -3 } }, 'Il gruppo ti rispetta di più.', 'Multa e panchina.']] },
  { id: 'wedding', w: 2, c: function (X) { return X.b === 0 || X.b === 2; }, t: 'Il matrimonio', d: 'Un compagno ti invita al suo matrimonio, lontano.', o: [
      ['Ci vado', { mo: 2, rel: 1 }, 'Gruppo più unito.'],
      ['Resto ad allenarmi', { at: { any: 1 } }, 'Lavoro extra.']] },
  { id: 'provoke', w: 2, c: function (X) { return X.fame >= 30 && X.b > 0; }, t: 'Provocazione', d: 'Una stella avversaria ti provoca sui social.', o: [
      ['Rispondo in campo', { fo: 0.2 }, 'Concentrazione massima.'],
      ['Rispondo sui social', { fa: 2, rel: -2 }, 'Botta e risposta virale.']] },
  { id: 'charitymatch', w: 2, c: function (X) { return X.fame >= 35 && X.b === 0; }, t: 'Partita benefica', d: 'Ti invitano a una partita benefica estiva.', o: [
      ['Gioco', { fa: 2, fn: 2, mark: 'charity', p: 0.9, ko: { inj: 2 } }, 'Raccolti fondi importanti.', 'Una botta e salti la prima giornata.'],
      ['Mi riposo', {}, 'Vacanze vere.']] },
  { id: 'president', w: 2, c: function (X) { return X.big && X.lastApps >= 3 && X.avg >= 7.2; }, t: 'Il presidente', d: 'Il presidente del {club} ti chiama per complimentarsi.', o: [
      ['Lo ringrazio', { mo: 3, mark: 'president' }, 'Ti senti al centro del progetto.']] }
];
