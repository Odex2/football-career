// @ts-check
// More event cards (same format as js/events-data.js), grouped by career situation.

G.events.cards.push(
  // ---------- young player ----------
  { id: 'gymrat', w: 3, c: function (X) { return X.age <= 21; }, t: 'Palestra extra', d: 'Il preparatore ti propone un programma di forza dopo gli allenamenti.', o: [
      ['Ci sto', { p: 0.8, ok: { at: { for: 1, res: 1 } }, ko: { inj: 2 } }, 'Ti senti più solido nei contrasti.', 'Esageri e ti fermi per un affaticamento.'],
      ['Preferisco riposare', { mo: 1 }, 'Recuperi bene.']] },
  { id: 'nickname', once: 1, w: 3, c: function (X) { return X.fame >= 20 && (X.lgG >= 6 || (X.lastApps >= 4 && X.avg >= 7.2)); }, t: 'Un soprannome', d: 'I tifosi del {club} ti hanno dato un soprannome che gira ovunque.', o: [
      ['Lo adotto sui social', { fa: 2, fn: 3 }, 'Diventa il tuo marchio.'],
      ['Lo ignoro', { mo: 1 }, 'Resta un coro della curva.']] },
  { id: 'youthcup', w: 3, c: function (X) { return X.age <= 19 && X.lastMatches >= 3 && X.minShare < 0.4; }, t: 'Torneo giovanile', d: 'Ti chiedono di giocare con la Primavera un torneo importante.', o: [
      ['Gioco e trascino la squadra', { p: 0.6, ok: { fa: 2, mo: 3, vis: 0.2 }, ko: { mo: -2 } }, 'Miglior giocatore del torneo: ti notano in tanti.', 'Eliminati presto, poca gloria.'],
      ['Resto con la prima squadra', { rel: 2 }, 'Il mister apprezza la voglia di esserci.']] },
  { id: 'loanagain', w: 3, c: function (X) { return X.loan && X.lastMatches >= 3 && X.minShare < 0.35 && X.b === 2; }, t: 'Prestito che non funziona', d: 'Al {club} hai giocato il {minPct}% dei minuti. Il club madre valuta di richiamarti.', o: [
      ['Chiedo di cambiare squadra', { req: 1 }, 'Il club madre cerca una nuova sistemazione.'],
      ['Resto e lotto', { mo: -1, rel: 3 }, 'Vuoi guadagnarti il posto qui.']] },
  { id: 'copycat', w: 2, c: function (X) { return X.age <= 22 && X.att; }, t: 'Il tuo idolo', d: 'Studi i video del tuo attaccante preferito per rubargli un movimento.', o: [
      ['Lavoro sul tiro a giro', { at: { tir: 1 } }, 'Il destro a giro comincia a entrare.'],
      ['Lavoro sugli inserimenti', { at: { pos: 1 } }, 'Arrivi prima sul pallone.']] },
  { id: 'gkdrill', w: 3, c: function (X) { return X.p.role === 'POR'; }, t: 'Allenamento dei portieri', d: 'Il preparatore dei portieri prova un nuovo metodo con te.', o: [
      ['Lavoro sui riflessi', { at: { rif: 1 } }, 'Parate più rapide sul primo palo.'],
      ['Lavoro sulle uscite', { at: { usc: 1 } }, 'Comandi meglio l’area piccola.']] },
  { id: 'defdrill', w: 3, c: function (X) { return X.def && X.p.role !== 'POR'; }, t: 'Lavoro difensivo', d: 'Il vice allenatore ti propone sessioni extra sulla marcatura.', o: [
      ['Marcatura a uomo', { at: { mar: 1 } }, 'Più attento sull’uomo.'],
      ['Gioco aereo', { at: { tes: 1 } }, 'Vinci più duelli in area.']] },
  { id: 'middrill', w: 3, c: function (X) { return X.p.role === 'CC' || X.p.role === 'TS'; }, t: 'Regia', d: 'Il mister vuole che tu prenda più responsabilità nel costruire il gioco.', o: [
      ['Lavoro sui passaggi', { at: { pas: 1 } }, 'Verticalizzi con più precisione.'],
      ['Lavoro sulla visione', { at: { vis: 1 } }, 'Vedi linee che prima non vedevi.']] },

  // ---------- performance and pressure ----------
  { id: 'mvpstreak', w: 3, c: function (X) { return X.recent(3, function (r) { return r.r >= 7.5; }); }, t: 'Sei in un momento magico', d: 'Tre partite di fila con voto da 7.5 in su. Tutti parlano di te.', o: [
      ['Resto concentrato', { fo: 0.2, rel: 2 }, 'Nessuna distrazione.'],
      ['Mi godo il momento', { fa: 3, mo: 3, p: 0.8, ko: { fo: -0.3 } }, 'Copertine e interviste.', 'Ti rilassi troppo e la forma cala.']] },
  { id: 'booed', w: 3, c: function (X) { return X.lastApps >= 4 && X.avg > 0 && X.avg < 6.2; }, t: 'Fischi', d: 'Media voto {avg} nelle ultime partite: alcuni tifosi del {club} ti fischiano all’uscita dal campo.', o: [
      ['Applaudo comunque la curva', { p: 0.6, ok: { fn: 3, mo: 1 }, ko: { fn: -2 } }, 'Gesto apprezzato, i fischi si spengono.', 'Sembra una provocazione.'],
      ['Rispondo sui social', { fn: -4, fa: 1, mo: 1 }, 'Polemica online.'],
      ['Lavoro in silenzio', { fo: 0.1 }, 'Rispondi in allenamento.']] },
  { id: 'missedpen', w: 2, c: function (X) { return X.att && X.lastApps >= 3 && X.recent(1, function (r) { return r.g === 0; }); }, t: 'Rigore sbagliato', d: 'Hai sbagliato un rigore decisivo nell’ultima partita.', o: [
      ['Mi assumo la colpa', { fn: 2, mo: -2 }, 'I tifosi apprezzano la sincerità.'],
      ['Mi alleno sui rigori', { at: { fre: 1 }, mo: -1 }, 'Dal dischetto non sbaglierai più.']] },
  { id: 'cleansheets', w: 3, c: function (X) { return X.def && X.recent(3, function (r) { return r.ga === 0; }); }, t: 'Muro', d: 'Tre partite di fila senza subire gol: la difesa del {club} è un muro e tu ne sei il simbolo.', o: [
      ['Merito di tutta la squadra', { rel: 3, mo: 2 }, 'Lo spogliatoio è compatto.'],
      ['Mi prendo i titoli', { fa: 3, rel: -2 }, 'I giornali ti incoronano.']] },
  { id: 'burnout', w: function (X) { return X.p.morale < 35 ? 5 : 1; }, c: function (X) { return X.morale < 45; }, t: 'Stanchezza mentale', d: 'Ti senti svuotato e il calcio non ti diverte più come prima.', o: [
      ['Chiedo aiuto a un professionista', { mo: 8, $: -20 }, 'Parlarne ti fa bene.'],
      ['Stacco qualche giorno', { mo: 5, rel: -3 }, 'Il mister non è entusiasta, ma ricarichi le pile.'],
      ['Tiro avanti', { mo: -3, fo: -0.2 }, 'Il peso resta.']] },
  { id: 'cupnight', w: 2, c: function (X) { return X.cupAlive && (X.b === 1 || X.b === 2) && X.minShare >= 0.5; }, t: 'Coppa nazionale', d: 'Il mister pensa di farti riposare nella partita di coppa.', o: [
      ['Voglio giocare', { p: 0.6, ok: { fo: 0.2, rel: 2 }, ko: { inj: 2 } }, 'Partita tosta, ma ci sei.', 'Stanchezza e un fastidio muscolare.'],
      ['Riposo', { mo: 1 }, 'Ricarichi per il campionato.']] },

  // ---------- big club life ----------
  { id: 'galactic', w: 3, c: function (X) { return X.big && X.lastMatches >= 3 && X.minShare < 0.4; }, t: 'Troppa concorrenza', d: 'Al {club} c’è troppa concorrenza nel tuo ruolo: hai giocato il {minPct}% dei minuti.', o: [
      ['Me la gioco', { at: { any: 1 }, mo: -1 }, 'Ti alleni il doppio.'],
      ['Chiedo il prestito o la cessione', { req: 1 }, 'Il club ascolta le offerte.']] },
  { id: 'dressing', w: 2, c: function (X) { return X.big && X.atClub >= 1; }, t: 'Spogliatoio diviso', d: 'Due gruppi nello spogliatoio del {club} non si parlano più.', o: [
      ['Faccio da paciere', { p: 0.5, ok: { rel: 5, fa: 1 }, ko: { mo: -3 } }, 'Ricucisci lo strappo: sei un leader.', 'Finisci in mezzo alla lite.'],
      ['Sto fuori dalle polemiche', {}, 'Pensi al campo.']] },
  { id: 'ballboy', w: 2, c: function (X) { return X.fame >= 50; }, t: 'Il raccattapalle', d: 'Un raccattapalle in lacrime ti chiede la maglia a fine partita.', o: [
      ['Gliela regalo', { fn: 3, fa: 1 }, 'Il video fa il giro del mondo.']] },
  { id: 'kitlaunch', once: 1, w: 3, c: function (X) { return X.big && X.fame >= 40; }, t: 'Volto della nuova maglia', d: 'Lo sponsor tecnico del {club} ti vuole come volto della campagna.', o: [
      ['Accetto', { $: 250, fa: 3 }, 'Cartelloni con la tua faccia in tutta la città.'],
      ['Lascio spazio ai compagni', { rel: 2 }, 'Lo spogliatoio apprezza.']] },

  // ---------- small club / underdog ----------
  { id: 'smallclubhero', w: 3, c: function (X) { return !X.big && X.ovr >= X.teamBest + 3 && X.lastApps >= 3; }, t: 'Il migliore della squadra', d: 'Sei di gran lunga il giocatore più forte del {club}. I grandi club osservano.', o: [
      ['Resto concentrato qui', { fn: 4, rel: 2 }, 'I tifosi ti adorano.'],
      ['Lascio parlare il mio agente', { vis: 0.4, fn: -2 }, 'Arrivano telefonate.']] },
  { id: 'unpaid', w: 2, c: function (X) { return X.club.rep < 60; }, t: 'Stipendi in ritardo', d: 'Il {club} ha problemi di cassa: gli stipendi arrivano in ritardo.', o: [
      ['Pazienza, sono con la squadra', { fn: 5, $: -30, mo: -1 }, 'Il presidente ti ringrazia pubblicamente.'],
      ['Pretendo i soldi', { rel: -2, req: 1 }, 'Chiedi di andare via.']] },
  { id: 'scoutvisit', w: 3, c: function (X) { return !X.big && X.ovr >= 66 && X.age <= 26; }, t: 'Osservatori in tribuna', d: 'In tribuna ci sono gli osservatori di un club importante.', o: [
      ['Gioco per stupirli', { p: 0.5, ok: { vis: 0.5, fa: 1 }, ko: { fo: -0.2 } }, 'Ottima partita: hai lasciato il segno.', 'Troppa pressione, giornata storta.'],
      ['Gioco come sempre', { fo: 0.1 }, 'Prestazione solida.']] },

  // ---------- abroad and travel ----------
  { id: 'culture', w: 3, c: function (X) { return X.abroad && X.atClub === 0; }, t: 'Nuova cultura', d: 'Ti stai ambientando in {league}. Cucina, lingua, abitudini: tutto nuovo.', o: [
      ['Mi immergo nella vita locale', { fn: 4, mo: 2 }, 'I tifosi ti sentono uno di loro.'],
      ['Resto nella mia bolla', { mo: -1 }, 'Più comodo, ma ti senti isolato.']] },
  { id: 'jetlag', w: 2, c: function (X) { return X.L.key === 'USA1' || X.L.key === 'KSA1'; }, t: 'Trasferte infinite', d: 'Le trasferte in {league} sono lunghe e il fuso orario si fa sentire.', o: [
      ['Investo in recupero', { $: -25, fo: 0.2 }, 'Massaggi e camera iperbarica.'],
      ['Mi adatto', { fo: -0.1 }, 'Un po’ di stanchezza.']] },
  { id: 'homesickvet', w: 2, c: function (X) { return X.abroad && X.homeLg && X.age >= 28; }, t: 'Il richiamo di casa', d: 'Dopo anni all’estero ti manca la {nation}.', o: [
      ['Faccio sapere che tornerei', { offer: 'HOME' }, 'Un club di casa si fa avanti: guarda il Mercato.'],
      ['Sto bene qui', { fn: 3 }, 'I tifosi apprezzano.']] },

  // ---------- media and fame ----------
  { id: 'fakenews', w: 2, c: function (X) { return X.fame >= 30; }, t: 'Notizia falsa', d: 'Un sito scrive che hai litigato con {coach}. Non è vero.', o: [
      ['Smentisco con un post', { fa: 1, rel: 2 }, 'Chiarimento lampo, tutto rientra.'],
      ['Querelo il sito', { $: -40, fa: 2 }, 'Il sito pubblica le scuse.'],
      ['Ignoro', { p: 0.5, ok: {}, ko: { rel: -4 } }, 'La voce muore da sola.', 'Il mister ci crede un po’.']] },
  { id: 'documentary', once: 1, w: 3, c: function (X) { return X.fame >= 65; }, t: 'Un documentario su di te', d: 'Una piattaforma di streaming vuole girare una serie sulla tua stagione.', o: [
      ['Accetto', { $: 800, fa: 5, p: 0.7, ko: { rel: -5, mo: -2 } }, 'Serie di successo, sei ovunque.', 'Le telecamere nello spogliatoio irritano tutti.'],
      ['Rifiuto', { rel: 2 }, 'Privacy prima di tutto.']] },
  { id: 'magazine', w: 3, c: function (X) { return X.fame >= 35 && X.fame < 75; }, t: 'Copertina', d: 'Una rivista sportiva ti vuole in copertina.', o: [
      ['Servizio fotografico', { fa: 3, $: 20 }, 'Copertina venduta ovunque.'],
      ['Solo intervista tecnica', { fa: 1, rel: 1 }, 'Parli di calcio, apprezzato.']] },
  { id: 'bdoparty', w: 4, c: function (X) { return X.fame >= 70 && X.b === 3; }, t: 'Gala di fine anno', d: 'Sei invitato al gala dei premi del calcio europeo.', o: [
      ['Ci vado in grande stile', { fa: 3, $: -30, mo: 2 }, 'Il tuo smoking fa parlare.'],
      ['Resto ad allenarmi', { fo: 0.1, rel: 2 }, 'Professionalità.']] },
  { id: 'gaffe', w: 2, c: function (X) { return X.fame >= 25; }, t: 'Gaffe in diretta', d: 'In un’intervista dici una frase infelice sui tifosi di {riv}.', o: [
      ['Mi scuso subito', { fa: -1, mo: -1 }, 'Caso chiuso.'],
      ['Ci rido sopra', { fn: 4, fa: 1, p: 0.6, ko: { inj: 1 } }, 'I tuoi tifosi ti adorano ancora di più.', 'La federazione ti squalifica per una giornata.']] },

  // ---------- money ----------
  { id: 'crypto', w: 2, c: function (X) { return X.money >= 500; }, t: 'Investimento rischioso', d: 'Un amico ti propone di investire 300 mila euro in una startup.', o: [
      ['Investo', { p: 0.35, ok: { $: 900 }, ko: { $: -300, mo: -2 } }, 'La startup esplode: triplichi i soldi.', 'Fallisce. Soldi persi.'],
      ['No grazie', {}, 'Meglio dormire tranquilli.']] },
  { id: 'restaurant', once: 1, w: 2, c: function (X) { return X.money >= 800 && X.age >= 26; }, t: 'Il tuo ristorante', d: 'Ti propongono di aprire un ristorante con il tuo nome.', o: [
      ['Apro', { $: -400, fa: 2, fn: 3, p: 0.6, ok: { $: 700 }, ko: {} }, 'Locale sempre pieno: buon affare.', 'Pareggi i conti, ma la città ti conosce.'],
      ['Non è il momento', {}, 'Pensi al campo.']] },
  { id: 'scam', w: 1, c: function (X) { return X.money >= 300 && !G.life.agent(X.p); }, t: 'Il consulente', d: 'Un consulente finanziario sconosciuto promette rendimenti sicuri.', o: [
      ['Mi fido', { p: 0.2, ok: { $: 150 }, ko: { $: -250, mo: -3 } }, 'Ti è andata bene.', 'Era una truffa. Senza un agente ti mancano i consigli giusti.'],
      ['Lascio perdere', { mo: 1 }, 'Istinto giusto.']] },
  { id: 'parents', once: 1, w: 3, c: function (X) { return X.money >= 400 && X.age <= 26; }, t: 'Una casa per i tuoi', d: 'Puoi finalmente comprare una casa ai tuoi genitori.', o: [
      ['La compro', { $: -350, mo: 8 }, 'Il giorno più bello della tua vita.'],
      ['Più avanti', {}, 'Ci sarà tempo.']] },

  // ---------- veteran ----------
  { id: 'lastcontract', w: 3, c: function (X) { return X.age >= 32 && X.p.contract && X.p.contract.years <= 1 && X.b >= 2; }, t: 'Ultimo contratto?', d: 'Il tuo contratto scade e a {age} anni il club riflette.', o: [
      ['Chiedo un altro anno', { renew: 1 }, 'Il club ti risponde nel Mercato.'],
      ['Valuto l’Arabia o l’MLS', { offer: 'USA' }, 'Arriva una proposta: guarda il Mercato.']] },
  { id: 'coachcourse', once: 1, w: 3, c: function (X) { return X.age >= 31; }, t: 'Patentino da allenatore', d: 'La federazione ti propone il corso per il patentino.', o: [
      ['Mi iscrivo', { at: { pos: 1, vis: 1 }, rel: 3, fo: -0.1 }, 'Vedi il calcio con altri occhi.'],
      ['Sono ancora un giocatore', { mo: 1 }, 'Testa al campo.']] },
  { id: 'youngrival', w: 3, c: function (X) { return X.age >= 30 && X.lastMatches >= 3 && X.minShare < 0.5; }, t: 'Il giovane che ti insidia', d: 'Un ragazzo della Primavera del {club} sta giocando al posto tuo.', o: [
      ['Lo aiuto a crescere', { rel: 4, fn: 2, mo: -1 }, 'Diventi il suo mentore.'],
      ['Me lo riprendo in campo', { p: 0.5, ok: { fo: 0.3, mo: 2 }, ko: { mo: -3 } }, 'Grandi prestazioni: il posto è tuo.', 'Il mister non cambia idea.']] },
  { id: 'kneecheck', w: 2, c: function (X) { return X.age >= 31; }, t: 'Le ginocchia', d: 'Il medico consiglia di ridurre i carichi per qualche settimana.', o: [
      ['Lo ascolto', { inj: 2, fo: 0.2 }, 'Torni più fresco.'],
      ['Gioco lo stesso', { p: 0.6, ok: { rel: 2 }, ko: { inj: 6, at: { vel: -1 } } }, 'Tieni duro.', 'Il ginocchio cede: lungo stop e un po’ di velocità in meno.']] },

  // ---------- misc ----------
  { id: 'baby', once: 1, w: 2, c: function (X) { return X.age >= 24; }, t: 'Diventi papà', d: 'È nato tuo figlio. Il {club} ti concede qualche giorno libero.', o: [
      ['Esulto col ciuccio al prossimo gol', { mo: 10, fn: 3, fa: 1 }, 'Il gesto diventa iconico.']] },
  { id: 'pet', w: 1, c: function () { return true; }, t: 'Il cane', d: 'Hai adottato un cane e i tuoi follower impazziscono.', o: [
      ['Gli apro un profilo', { fa: 1, mo: 2 }, 'Ha più like di te.'],
      ['Resta privato', { mo: 2 }, 'Un amico fedele.']] },
  { id: 'referee', w: 2, c: function (X) { return X.att && X.lastApps >= 3; }, t: 'Errore arbitrale', d: 'Un gol regolare ti è stato annullato per un fuorigioco inesistente.', o: [
      ['Protesto in TV', { fn: 3, p: 0.6, ko: { inj: 1 } }, 'I tifosi sono con te.', 'Multa e una giornata di squalifica.'],
      ['Mi mordo la lingua', { rel: 2 }, 'Il club apprezza.']] },
  { id: 'stadium', w: 2, c: function (X) { return X.atClub >= 3; }, t: 'Il nuovo stadio', d: 'Il {club} presenta il progetto del nuovo stadio e vuole te alla cerimonia.', o: [
      ['Ci sono', { fn: 4, fa: 1 }, 'Posi la prima pietra.']] }
);
