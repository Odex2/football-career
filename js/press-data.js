// @ts-check
// Press conference cards (format in js/press.js). Answers go humble, confident, provocative.

// Goals expected scale with the length of the coming block (league matchdays in it)
/** @param {EvCtx} X @param {number} perQuarter */
G.press.blk = function (X, perQuarter) { return Math.max(1, Math.round(perQuarter * G.CFG.BLOCK_SHARE[X.b] / 0.25)); };

/** @type {EventDef[]} */
G.press.cards = [
  { id: 'pc_derby', w: 8, c: function (X) { return X.derbyClub && X.b <= 4 && !X.loan; }, t: '🎙️ Conferenza stampa: verso il derby',
    d: 'Si avvicina la sfida con il {derby}. «Che partita sarà?»', o: [
      ['«Massimo rispetto per il {derby}»', { rel: 2, mo: 1 }, 'Risposta da professionista.'],
      ['«Lo vinciamo, ne sono sicuro»', { fa: 1, bet: { k: 'derby', ok: { fn: 6, fa: 2, mo: 3 }, ko: { fn: -4, mo: -2 } } }, 'I tifosi si aspettano la vittoria.'],
      ['«Il {derby} ha paura di noi»', { fa: 3, fn: 2, bet: { k: 'derby', ok: { fn: 10, fa: 4, mo: 4 }, ko: { fn: -8, fa: -2, mo: -4 } } }, 'Titoloni sui giornali: adesso devi vincerlo.']] },
  { id: 'pc_dry', w: 6, n: function (X) { return G.press.blk(X, 2); }, c: function (X) { return X.att && X.dry >= 4 && X.b >= 1 && X.b <= 3; }, t: '🎙️ Conferenza stampa: il digiuno',
    d: 'Non segni da {dry} partite. «Cosa succede?»', o: [
      ['«Lavoro, i gol arriveranno»', { mo: 2, rel: 1 }, 'Il mister apprezza la calma.'],
      ['«Nel prossimo periodo ne segno almeno {betN}»', { bet: { k: 'goals', ok: { fa: 3, mo: 4, fn: 3 }, ko: { fa: -2, mo: -3 } } }, 'Una promessa pesante.'],
      ['«Datemi palloni giocabili»', { rel: -4, fa: 2, p: 0.5, ok: { fo: 0.3 }, ko: { mo: -2 } }, 'I compagni si svegliano.', 'Lo spogliatoio non gradisce.']] },
  { id: 'pc_hot', w: 5, n: function (X) { return G.press.blk(X, 4); }, c: function (X) { return X.lastG >= 4 && X.lastApps >= 3 && X.b <= 3; }, t: '🎙️ Conferenza stampa: momento d’oro',
    d: '{lastG} gol nelle ultime {lastApps} partite. «Dove puoi arrivare?»', o: [
      ['«Il merito è della squadra»', { rel: 3, fn: 2 }, 'Il gruppo è con te.'],
      ['«Continuo così: almeno altri {betN} gol»', { fa: 1, bet: { k: 'goals', ok: { fa: 3, fn: 3 }, ko: { fa: -2 } } }, 'Ora tutti contano i tuoi gol.'],
      ['«Sono il migliore del campionato»', { fa: 4, rel: -2, bet: { k: 'avg', n: 7, ok: { fa: 3 }, ko: { fa: -4, mo: -3 } } }, 'Te lo rinfacceranno alla prima partita storta.']] },
  { id: 'pc_title', w: 7, n: function () { return 1; }, c: function (X) { return X.tier === 1 && X.pos <= 2 && X.ptsGap <= 4 && X.b >= 2 && X.b <= 3; }, t: '🎙️ Conferenza stampa: corsa al titolo',
    d: 'Il {club} è {pos}º con {gap} punti di distacco. «È l’anno buono?»', o: [
      ['«Pensiamo partita per partita»', { rel: 2, mo: 1 }, 'Nessuna pressione in più.'],
      ['«Chiudiamo questo periodo in testa»', { bet: { k: 'pos', ok: { fn: 6, fa: 3, mo: 3 }, ko: { fn: -3, mo: -2 } } }, 'Hai alzato l’asticella.'],
      ['«Il campionato è nostro»', { fa: 3, fn: 3, bet: { k: 'pos', ok: { fn: 10, fa: 4 }, ko: { fn: -7, fa: -3, mo: -4 } } }, 'La città sogna, i rivali si caricano.']] },
  { id: 'pc_low', w: 6, n: function (X) { return X.n - 3; }, c: function (X) { return X.n > 0 && X.pos > X.n - 3 && X.b >= 1 && X.b <= 3; }, t: '🎙️ Conferenza stampa: zona retrocessione',
    d: 'Il {club} è {pos}º. «Avete paura?»', o: [
      ['«Ne usciamo tutti insieme»', { fn: 3, mo: 1 }, 'I tifosi apprezzano.'],
      ['«Usciamo dalla zona rossa»', { bet: { k: 'pos', ok: { fn: 6, fa: 2, mo: 3 }, ko: { fn: -4, mo: -3 } } }, 'Promessa impegnativa.'],
      ['«Qualcuno qui non suda la maglia»', { rel: -5, fa: 2, p: 0.5, ok: { mo: 3, fo: 0.3, fn: 4 }, ko: { mo: -3, fn: -3 } }, 'La scossa funziona.', 'Lo spogliatoio si spacca.']] },
  { id: 'pc_bench', w: 6, n: function () { return 6.8; }, c: function (X) { return !X.loan && X.lastMatches >= 4 && X.minShare < 0.35 && X.age >= 19 && X.b <= 3; }, t: '🎙️ Conferenza stampa: poco spazio',
    d: 'Hai giocato il {minPct}% dei minuti. «Sei deluso?»', o: [
      ['«Rispetto le scelte del mister»', { rel: 4, mo: -1 }, '{coach} prende nota.'],
      ['«Mi riprendo il posto con le prestazioni»', { mo: 1, bet: { k: 'avg', ok: { rel: 5, mo: 3, fa: 1 }, ko: { mo: -2 } } }, 'Ora devi dimostrarlo.'],
      ['«Merito di giocare, altrimenti vado via»', { fa: 2, rel: -8, fn: -3, vis: 0.3 }, 'Il mercato ti ha sentito.']] },
  { id: 'pc_rumor', w: 4, c: function (X) { return X.fame >= 40 && !X.loan && (X.b === 0 || X.b === 2 || X.b === 4); }, t: '🎙️ Conferenza stampa: voci di mercato',
    d: 'Si parla di un top club che ti vuole. «Resti al {club}?»', o: [
      ['«Sono felice qui»', { fn: 5, rel: 1 }, 'I tifosi cantano il tuo nome.'],
      ['«Penso solo a giocare»', { mo: 1 }, 'Risposta che non sposta nulla.'],
      ['«Non chiudo nessuna porta»', { vis: 0.4, fn: -6, fa: 2 }, 'Le voci aumentano.']] },
  { id: 'pc_bdo', w: 6, n: function () { return 7.1; }, c: function (X) { return X.bdoRank <= 5 && X.b <= 3; }, t: '🎙️ Conferenza stampa: Pallone d’Oro',
    d: 'Sei {bdoRank}º nella corsa al Pallone d’Oro. «Lo meriti?»', o: [
      ['«Conta la squadra, non i premi»', { rel: 3, fn: 2 }, 'Umiltà da campione.'],
      ['«Sì, e lo dimostrerò in campo»', { fa: 2, bet: { k: 'avg', ok: { fa: 3, mo: 2 }, ko: { fa: -2 } } }, 'Ogni partita ora è un esame.'],
      ['«Se non lo vinco è uno scandalo»', { fa: 5, rel: -1, bet: { k: 'avg', ok: { fa: 4 }, ko: { fa: -5, mo: -3 } } }, 'Ti sei messo nel mirino di tutti.']] },
  { id: 'pc_rival', w: 2, n: function (X) { return G.press.blk(X, 5); }, c: function (X) { return X.st.records && X.st.records.rival && !X.st.records.rival.ret && X.age >= 20 && X.b <= 3; }, t: '🎙️ Conferenza stampa: il rivale',
    d: '«Chi è più forte tra te e {rivalName}?»', o: [
      ['«{rivalName} è un grande giocatore»', { fa: 1, mo: 1 }, 'Un bel gesto di sportività.'],
      ['«Parleranno i numeri: {betN} tra gol e assist»', { bet: { k: 'ga', ok: { fa: 3, mo: 3 }, ko: { fa: -2, mo: -2 } } }, 'La sfida è lanciata.'],
      ['«Non c’è paragone»', { fa: 4, bet: { k: 'goals', n: function (X) { return G.press.blk(X, 3); }, ok: { fa: 3 }, ko: { fa: -4, mo: -3 } } }, 'Ora tutti vi confrontano.']] },
  { id: 'pc_captain', w: 5, c: function (X) { return X.p.captain === X.club.id && X.b >= 1 && X.b <= 3; }, t: '🎙️ Conferenza stampa: parla il capitano',
    d: '«Da capitano, cosa chiedi al gruppo?»', o: [
      ['«Restiamo uniti, ci rialziamo insieme»', { rel: 3, fn: 2, mo: 2 }, 'Lo spogliatoio ti segue.'],
      ['«Vinciamo almeno metà delle prossime partite»', { bet: { k: 'wins', ok: { fn: 5, mo: 3, rel: 2 }, ko: { fn: -3, mo: -2 } } }, 'Obiettivo chiaro per tutti.'],
      ['«Chi non ci crede può andare»', { p: 0.5, ok: { mo: 4, fo: 0.3, fn: 4 }, ko: { rel: -5, mo: -3 } }, 'La squadra risponde.', 'Qualcuno se la lega al dito.']] },
  { id: 'pc_new', w: 9, c: function (X) { return X.atClub === 0 && X.b === 0 && X.seasons > 0 && !X.loan; }, t: '🎙️ Conferenza stampa: la presentazione',
    d: 'Prima conferenza da giocatore del {club}. «Perché hai scelto noi?»', o: [
      ['«Sono qui per imparare e crescere»', { rel: 3, fn: 2 }, 'Ottima prima impressione.'],
      ['«Vengo per vincere»', { fa: 2, fn: 3 }, 'I tifosi si aspettano molto.'],
      ['«Ho scelto il club più forte del paese»', { fa: 3, fn: 5, p: 0.5, ok: {}, ko: { rel: -2 } }, 'La piazza impazzisce.', 'I senatori storcono il naso.']] }
];
