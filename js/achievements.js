// @ts-check
// Career goals to unlock. Each: [id, icon, name, description, check(A)] where A holds live career totals.

G.ach = {};

// Live totals: closed seasons plus the season in progress
/** @param {State} st @returns {AchTotals} */
G.ach.totals = function (st) {
  var p = st.player, ps = st.S ? st.S.ps : G.season.emptyStats(), W = st.world;
  var hist = p.history, tro = p.trophies.map(function (t) { return t.name; }), aw = p.awards.map(function (a) { return a.name; });
  var /** @type {Dict<number>} */ lgs = {}, natsAbroad = 0;
  hist.forEach(function (h) { lgs[h.lg] = 1; var c = W.clubs[h.clubId]; if (c && c.nat !== p.nat) natsAbroad++; });
  var cur = W.clubs[p.clubId];
  lgs[G.leagueByKey(cur.lg).name] = 1;
  var rows = st.S ? st.S.blockRows || [] : [];
  var seasons = /** @type {AchSeason[]} */ (hist).concat(st.S && ps.apps ? [{ goals: ps.goals, assists: ps.assists, cs: ps.cs, apps: ps.apps, avg: ps.rN ? ps.rSum / ps.rN : 0, age: p.age }] : []);
  var has = /** @param {string[]} list @param {RegExp} re */ function (list, re) { return list.some(function (n) { return re.test(n); }); };
  return { p: p, apps: p.tot.apps + ps.apps, goals: p.tot.goals + ps.goals, assists: p.tot.assists + ps.assists, tro: tro, aw: aw,
    lgs: Object.keys(lgs).length, abroad: natsAbroad > 0 || cur.nat !== p.nat, rows: rows, seasons: seasons, has: has,
    peak: Math.max(p.ovr, p.peak || 0), nat: cur.nat, hist: hist,
    leagueTitles: tro.filter(function (n) { return G.LEAGUES.some(function (L) { return L.tier === 1 && L.name === n; }); }).length,
    teenGoals: hist.filter(function (h) { return h.age < 20; }).reduce(function (s, h) { return s + h.goals; }, 0) + (p.age < 20 ? ps.goals : 0) };
};

/** @type {AchDef[]} */
G.ach.list = [
  ['debut', '🎬', 'Esordio', 'Gioca la prima partita da professionista', function (A) { return A.apps >= 1; }],
  ['goal1', '⚽', 'Il primo gol', 'Segna il primo gol in carriera', function (A) { return A.goals >= 1; }],
  ['goals50', '⚽', 'Cinquanta', 'Segna 50 gol in carriera', function (A) { return A.goals >= 50; }],
  ['goals100', '💯', 'Cento gol', 'Segna 100 gol in carriera', function (A) { return A.goals >= 100; }],
  ['goals200', '🔥', 'Bomber', 'Segna 200 gol in carriera', function (A) { return A.goals >= 200; }],
  ['goals300', '👑', 'Re del gol', 'Segna 300 gol in carriera', function (A) { return A.goals >= 300; }],
  ['goals500', '🐐', 'Fuori categoria', 'Segna 500 gol in carriera', function (A) { return A.goals >= 500; }],
  ['assists100', '🎯', 'Uomo assist', 'Fornisci 100 assist in carriera', function (A) { return A.assists >= 100; }],
  ['apps100', '👟', 'Cento presenze', 'Gioca 100 partite', function (A) { return A.apps >= 100; }],
  ['apps300', '👟', 'Trecento presenze', 'Gioca 300 partite', function (A) { return A.apps >= 300; }],
  ['apps500', '🏟️', 'Cinquecento presenze', 'Gioca 500 partite', function (A) { return A.apps >= 500; }],
  ['apps700', '🏛️', 'Monumento', 'Gioca 700 partite', function (A) { return A.apps >= 700; }],
  ['hattrick', '🎩', 'Tripletta', 'Segna 3 gol in una partita', function (A) { return A.rows.some(function (r) { return r.g >= 3; }); }],
  ['poker', '🃏', 'Poker', 'Segna 4 gol in una partita', function (A) { return A.rows.some(function (r) { return r.g >= 4; }); }],
  ['season30', '🚀', 'Stagione da 30', 'Segna 30 gol in una stagione', function (A) { return A.seasons.some(function (s) { return s.goals >= 30; }); }],
  ['season20a', '🪄', 'Stagione da 20 assist', 'Fornisci 20 assist in una stagione', function (A) { return A.seasons.some(function (s) { return s.assists >= 20; }); }],
  ['cs20', '🧤', 'Saracinesca', 'Tieni la porta inviolata 20 volte in una stagione', function (A) { return A.seasons.some(function (s) { return s.cs >= 20; }); }],
  ['rating8', '⭐', 'Stagione perfetta', 'Chiudi una stagione con media voto 8 (almeno 20 presenze)', function (A) { return A.seasons.some(function (s) { return s.apps >= 20 && s.avg >= 8; }); }],
  ['teen', '🌱', 'Enfant prodige', 'Segna 10 gol prima dei 20 anni', function (A) { return A.teenGoals >= 10; }],
  ['trophy1', '🏆', 'Primo trofeo', 'Vinci il primo trofeo', function (A) { return A.tro.length >= 1; }],
  ['promo', '⬆️', 'Promozione', 'Sali di categoria', function (A) { return A.hist.some(function (h) { return h.trophies.indexOf('Promozione') >= 0; }); }],
  ['league', '🥇', 'Campione nazionale', 'Vinci un campionato di prima divisione', function (A) { return A.leagueTitles >= 1; }],
  ['league5', '🏅', 'Dinastia', 'Vinci 5 campionati di prima divisione', function (A) { return A.leagueTitles >= 5; }],
  ['ucl', '🏆', 'Campione d’Europa', 'Vinci la Champions League', function (A) { return A.has(A.tro, /Champions League/); }],
  ['uel', '🟠', 'Europa League', 'Vinci l’Europa League', function (A) { return A.has(A.tro, /Europa League/); }],
  ['uecl', '🟢', 'Conference League', 'Vinci la Conference League', function (A) { return A.has(A.tro, /Conference League/); }],
  ['scorer', '🥾', 'Capocannoniere', 'Vinci la classifica marcatori di un campionato', function (A) { return A.has(A.aw, /^Capocannoniere (?!Mondiale|Europeo|Copa|Coppa)/); }],
  ['pots', '🌟', 'Il migliore', 'Vinci un Player of the Season', function (A) { return A.has(A.aw, /Player of the Season/); }],
  ['boot', '👢', 'Scarpa d’Oro', 'Vinci la Scarpa d’Oro', function (A) { return A.has(A.aw, /Scarpa d’Oro/); }],
  ['bdo3', '🥉', 'Sul podio', 'Arriva tra i primi 3 del Pallone d’Oro', function (A) { return A.hist.some(function (h) { return h.bdo && h.bdo <= 3; }); }],
  ['bdo', '⚽', 'Pallone d’Oro', 'Vinci il Pallone d’Oro', function (A) { return A.has(A.aw, /Pallone d’Oro/); }],
  ['bdo3x', '🐐', 'Leggenda del Pallone', 'Vinci 3 Palloni d’Oro', function (A) { return A.aw.filter(function (n) { return n === 'Pallone d’Oro'; }).length >= 3; }],
  ['ntdebut', '🎽', 'In nazionale', 'Esordisci con la tua nazionale', function (A) { return A.p.nt && A.p.nt.caps >= 1; }],
  ['ntgoal', '🥅', 'Gol per la patria', 'Segna con la tua nazionale', function (A) { return A.p.nt && A.p.nt.goals >= 1; }],
  ['caps50', '🧢', 'Cinquanta caps', 'Gioca 50 partite in nazionale', function (A) { return A.p.nt && A.p.nt.caps >= 50; }],
  ['caps100', '🎖️', 'Centurione', 'Gioca 100 partite in nazionale', function (A) { return A.p.nt && A.p.nt.caps >= 100; }],
  ['wcplay', '🌍', 'Al Mondiale', 'Gioca una partita del Mondiale', function (A) { return A.p.nt && A.p.nt.tours.some(function (t) { return t.key === 'WC' && t.apps > 0; }); }],
  ['cont', '🏆', 'Campione continentale', 'Vinci Europeo, Copa América, Coppa d’Asia o d’Africa', function (A) { return A.has(A.tro, /^(Europeo|Copa América|Coppa d’Asia|Coppa d’Africa)$/); }],
  ['wc', '🌎', 'Campione del mondo', 'Vinci il Mondiale', function (A) { return A.tro.indexOf('Mondiale') >= 0; }],
  ['abroad', '✈️', 'Emigrante', 'Gioca in un club straniero', function (A) { return A.abroad; }],
  ['leagues3', '🗺️', 'Giramondo', 'Gioca in 3 campionati diversi', function (A) { return A.lgs >= 3; }],
  ['exotic', '🌴', 'Esotico', 'Gioca in Saudi Pro League o in MLS', function (A) { return A.nat === 'KSA' || A.nat === 'USA' || A.hist.some(function (h) { return /Saudi|MLS/.test(h.lg); }); }],
  ['bandiera', '🚩', 'Bandiera', 'Diventa la bandiera di un club', function (A) { return Object.keys(A.p.bandiera).length > 0; }],
  ['captain', '©️', 'Capitano', 'Indossa la fascia di capitano del tuo club', function (A) { return !!A.p.capClubs; }],
  ['captain5', '🎗️', 'Capitano storico', 'Gioca 5 stagioni da capitano', function (A) { return (A.p.capSeasons || 0) >= 5; }],
  ['ntcaptain', '🌟', 'Capitano della nazionale', 'Ricevi la fascia di capitano della tua nazionale', function (A) { return A.p.nt && !!A.p.nt.cap; }],
  ['press10', '🎙️', 'Di parola', 'Mantieni 10 promesse fatte in conferenza stampa', function (A) { return A.p.press && A.p.press.kept >= 10; }],
  ['oneclub', '❤️', 'Una vita', 'Gioca 10 stagioni nello stesso club', function (A) { return Object.keys(A.p.seasonsAt).some(function (k) { return A.p.seasonsAt[/** @type {any} */ (k)] >= 10; }); }],
  ['derby10', '🔥', 'Re dei derby', 'Vinci 10 derby', function (A) { return A.p.derbyWins >= 10; }],
  ['ovr80', '📈', 'Titolare vero', 'Raggiungi 80 di overall', function (A) { return A.peak >= 80; }],
  ['ovr85', '💎', 'Top player', 'Raggiungi 85 di overall', function (A) { return A.peak >= 85; }],
  ['ovr90', '👽', 'Alieno', 'Raggiungi 90 di overall', function (A) { return A.peak >= 90; }],
  ['million', '💶', 'Milionario', 'Metti da parte 1 milione', function (A) { return A.p.money + A.p.invest >= 1000; }],
  ['rich', '💰', 'Paperone', 'Metti da parte 50 milioni', function (A) { return A.p.money + A.p.invest >= 50000; }],
  ['fame90', '📸', 'Icona', 'Raggiungi 90 di fama', function (A) { return A.p.fame >= 90; }],
  ['agent5', '🤝', 'Super agente', 'Fatti rappresentare da un agente a 5 stelle', function (A) { var a = G.life.agent(A.p); return !!a && a.s >= 5; }],
  ['veteran', '👴', 'Senza età', 'Gioca almeno una partita a 38 anni', function (A) { return A.p.age >= 38 && A.rows.some(function (r) { return r.mins > 0; }); }]
];

// Called after each step: unlocks new achievements and queues them for the UI
/** @param {State} st */
G.ach.check = function (st) {
  var p = st.player, A = G.ach.totals(st), got = p.ach || (p.ach = {}), year = st.S ? st.S.year : st.year - 1;
  p.peak = Math.max(p.peak || 0, p.ovr);
  G.ach.list.forEach(function (a) {
    if (got[a[0]] || !a[4](A)) return;
    got[a[0]] = year;
    (st.achNew || (st.achNew = [])).push(a[0]);
    G.news(st, '🎖️ Obiettivo sbloccato: ' + a[2]);
  });
};

/** @param {string} id @returns {AchDef} */
G.ach.get = function (id) { return G.ach.list.filter(function (a) { return a[0] === id; })[0]; };
