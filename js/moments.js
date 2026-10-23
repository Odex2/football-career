// @ts-check
// Decisive moments: in the matches that count (derby, title or relegation clash, domestic cup final) the player gets
// one late situation to decide it. Situations change with the role and never repeat back to back; each option shows
// its estimated chance (attributes, form and the opponent's strength). Playing live, a card asks before the match;
// simulating, the best option is taken. The outcome is told with the real score and minute and changes the result.

G.moments = {};

// Option: [label, attributes, chance shift, kind, text if it works, text if not, risk, counter]
// kind: goal / assist = we score when it works; stop = they score when it fails.
// risk = chance they score after a failed attack; counter = chance a successful stop turns into our goal
/** @type {Moment[]} */
G.moments.SCEN = [
  { id: 'uno', r: ['ATT', 'ES'], t: 'Solo davanti al portiere', d: 'Un lancio può metterti a tu per tu con il portiere del {opp}.', o: [
    ['Piatto angolato', ['fin', 'fre'], 0.06, 'goal', 'piatto sul secondo palo, il portiere non ci arriva', 'il portiere si allunga e devia in angolo'],
    ['Tiro potente', ['tir', 'for'], 0, 'goal', 'una fucilata sotto la traversa', 'il tiro gli sbatte addosso'],
    ['Dribbling sul portiere', ['dri', 'vel'], -0.05, 'goal', 'lo salti e la depositi a porta vuota', 'il portiere ti legge e ti toglie il pallone']] },
  { id: 'cross', r: ['ATT', 'DC'], t: 'Cross in area', d: 'Nel finale può arrivare un cross teso dalla fascia, con l’area del {opp} affollata.', o: [
    ['Colpo di testa', ['tes', 'for'], 0, 'goal', 'stacchi più in alto di tutti e la metti all’angolo', 'la palla ti sfiora la testa ed esce'],
    ['Anticipo sul primo palo', ['pos', 'vel'], -0.03, 'goal', 'arrivi prima del difensore e la giri in rete', 'il difensore chiude in tempo'],
    ['Sponda per un compagno', ['tes', 'pas'], 0.06, 'assist', 'la tua sponda è perfetta e il compagno segna', 'la sponda è lunga e la difesa spazza']] },
  { id: 'rig', r: ['ATT', 'ES', 'CC'], t: 'Rigore nel recupero', d: 'Nel recupero l’arbitro potrebbe darvi un rigore, e il pallone lo prendi tu.', o: [
    ['Angolato rasoterra', ['fin', 'fre'], 0.42, 'goal', 'rasoterra all’angolo, portiere spiazzato', 'il portiere indovina l’angolo e para'],
    ['Centrale e potente', ['tir', 'for'], 0.38, 'goal', 'una botta centrale che sfonda la rete', 'il portiere resta in piedi e respinge'],
    ['Cucchiaio', ['fre', 'dri'], 0.3, 'goal', 'cucchiaio a portiere già a terra: freddezza pura', 'il portiere aspetta e la blocca: che figuraccia']] },
  { id: 'contro', r: ['ATT', 'ES', 'CC'], t: 'Contropiede tre contro due', d: 'Nel finale il {opp} può sbilanciarsi e lasciarti partire in contropiede con il pallone.', o: [
    ['Tiro in corsa', ['fin', 'vel'], -0.02, 'goal', 'tiro in corsa sul palo lungo, gol', 'il tiro finisce alto di poco'],
    ['Passaggio al compagno smarcato', ['pas', 'vis'], 0.07, 'assist', 'lo servi al momento giusto e lui la mette dentro', 'il passaggio viene intercettato'],
    ['Punti il difensore', ['dri', 'vel'], -0.04, 'goal', 'salti l’ultimo uomo e segni', 'il difensore ti chiude e il {opp} riparte', 0.25]] },
  { id: 'puni', r: ['ATT', 'CC', 'ES'], t: 'Punizione dal limite', d: 'Nel finale potrebbe arrivare una punizione dal limite, e sul pallone ci sei tu.', o: [
    ['Sopra la barriera', ['tir', 'fre'], -0.08, 'goal', 'pallone sopra la barriera e sotto l’incrocio', 'la palla si stampa sulla barriera'],
    ['Rasoterra sotto la barriera', ['fin', 'fre'], -0.1, 'goal', 'la barriera salta e il rasoterra entra', 'la barriera resta giù e respinge'],
    ['Schema corto', ['pas', 'vis'], 0.03, 'assist', 'lo schema riesce e il compagno segna', 'lo schema non funziona e sfuma tutto']] },
  { id: 'fuori', r: ['CC', 'ES'], t: 'Pallone al limite dell’area', d: 'Una respinta della difesa del {opp} può arrivare proprio dalle tue parti.', o: [
    ['Tiro da fuori', ['tir', 'fre'], -0.04, 'goal', 'un tiro da fuori che si infila all’angolo', 'il tiro finisce in curva'],
    ['Filtrante in area', ['pas', 'vis'], 0.06, 'assist', 'un filtrante che taglia la difesa: assist', 'il filtrante è troppo lungo'],
    ['Inserimento senza palla', ['pos', 'vel'], 0, 'goal', 'scatti in area e la spingi dentro', 'l’arbitro fischia il fuorigioco']] },
  { id: 'fondo', r: ['ES', 'TS'], t: 'Sulla fascia fino al fondo', d: 'Nel finale puoi trovarti la fascia libera, con il terzino del {opp} in ritardo.', o: [
    ['Cross basso arretrato', ['pas', 'vis'], 0.05, 'assist', 'cross arretrato perfetto e il compagno insacca', 'il cross viene deviato in angolo'],
    ['Rientri e tiri', ['dri', 'tir'], -0.04, 'goal', 'rientri sul piede buono e la metti sul secondo palo', 'il tiro è centrale e il portiere blocca'],
    ['Torni a coprire', ['pos', 'res'], 0.2, 'stop', 'tieni la posizione e il {opp} non passa più', 'resti a metà e il {opp} sfonda sul tuo lato']] },
  { id: 'punta', r: ['DC', 'TS'], t: 'L’attaccante ti punta', d: 'Nel finale il loro attaccante può arrivarti addosso in velocità.', o: [
    ['Scivolata', ['con', 'vel'], 0.12, 'stop', 'scivolata pulita e pallone in fallo laterale', 'arrivi in ritardo e lui segna'],
    ['Temporeggi', ['pos', 'mar'], 0.16, 'stop', 'lo accompagni fuori dall’area finché non arrivano i compagni', 'ti salta con una finta e la mette dentro'],
    ['Anticipo e ripartenza', ['con', 'pas'], 0.02, 'stop', 'gli rubi il pallone e fai partire il contropiede', 'manchi l’anticipo e lui va in porta', 0, 0.4]] },
  { id: 'angolo', r: ['DC', 'TS', 'CC'], t: 'Calcio d’angolo contro', d: 'Il {opp} potrebbe avere un calcio d’angolo nel finale, e tocca a te scegliere come difendere.', o: [
    ['Marcatura a uomo sul più alto', ['mar', 'for'], 0.14, 'stop', 'gli stai incollato e non tocca palla', 'si libera di te e colpisce di testa: gol'],
    ['A zona sul primo palo', ['pos', 'tes'], 0.16, 'stop', 'sul primo palo arrivi tu e allontani', 'la palla passa sopra di te e qualcuno la spinge dentro'],
    ['Esci forte sul pallone', ['tes', 'for'], 0.1, 'stop', 'svetti e spazzi lontano', 'manchi il pallone e la difesa resta scoperta']] },
  { id: 'ultimo', r: ['DC'], t: 'Ultimo uomo', d: 'Un lancio lungo può scavalcare la difesa, e dietro ci sei solo tu.', o: [
    ['Corri all’indietro', ['vel', 'pos'], 0.12, 'stop', 'lo bruci in velocità e chiudi in angolo', 'non lo prendi più e lui segna'],
    ['Fallo tattico', ['con', 'fre'], 0.24, 'stop', 'fallo al limite: ammonito, ma l’azione muore lì', 'il fallo è da rosso e la punizione entra'],
    ['Chiama il fuorigioco', ['pos', 'fre'], 0.08, 'stop', 'sali al momento giusto: fuorigioco', 'la linea non sale con te e lui va in porta']] },
  { id: 'sali', r: ['DC'], t: 'Corner a vostro favore', d: 'Nel finale potreste avere un corner, e puoi salire in area.', o: [
    ['Colpo di testa', ['tes', 'for'], -0.04, 'goal', 'incornata imparabile sul secondo palo', 'la colpisci bene ma fuori', 0.25],
    ['Blocco per il compagno', ['for', 'pos'], 0.04, 'assist', 'il tuo blocco libera il compagno che segna', 'l’arbitro fischia il fallo in attacco'],
    ['Resti a coprire', ['pos', 'vel'], 0.24, 'stop', 'resti dietro e fermi la loro ripartenza', 'la ripartenza ti sorprende comunque']] },
  { id: 'rigp', r: ['POR'], t: 'Rigore contro', d: 'Nel finale potrebbe arrivare un rigore contro di te.', gk: 1, o: [
    ['Tuffo a sinistra', ['rif'], 0, 'stop', 'ti butti a sinistra e la togli dall’angolo', 'tiro dall’altra parte, gol'],
    ['Resti al centro', ['rif'], 0, 'stop', 'resti in piedi e la blocchi', 'resti fermo e la palla entra all’angolo'],
    ['Tuffo a destra', ['rif'], 0, 'stop', 'tuffo a destra e respinta', 'ti tuffi bene ma il tiro è dall’altra parte']] },
  { id: 'solo', r: ['POR'], t: 'Attaccante solo davanti a te', d: 'La difesa può farsi bucare nel finale e lasciarti solo contro il loro attaccante.', o: [
    ['Esci basso', ['usc', 'vel'], 0.06, 'stop', 'esci con coraggio e gli rubi il pallone dai piedi', 'esci in ritardo e lui ti scavalca'],
    ['Resti tra i pali', ['rif', 'pos'], 0.04, 'stop', 'aspetti il tiro e lo respingi di riflesso', 'il tiro è troppo angolato'],
    ['Chiudi lo specchio', ['pos', 'fre'], 0.08, 'stop', 'chiudi lo specchio e il tiro ti finisce addosso', 'aspetti troppo e lui la piazza']] },
  { id: 'bolide', r: ['POR'], t: 'Bolide da fuori', d: 'Nel finale il {opp} può provarci da lontano.', o: [
    ['Tuffo in volo', ['rif'], 0.08, 'stop', 'volo plastico e deviazione sul palo', 'la palla ti passa sopra le mani'],
    ['Respinta di pugno', ['rif', 'for'], 0.12, 'stop', 'pugno deciso e pallone lontano', 'la respinta è corta e loro ribattono in rete'],
    ['Presa sicura', ['usc', 'pos'], 0.06, 'stop', 'blocchi il pallone a terra senza rischi', 'la palla ti scivola dalle mani']] }
];

/** @param {string} id @returns {Moment} */
G.moments.byId = function (id) { return G.moments.SCEN.filter(function (s) { return s.id === id; })[0]; };

// A situation for the player's role, avoiding the last ones he had
/** @param {State} st @returns {Moment} */
G.moments.draw = function (st) {
  var p = st.player, seen = st.momSeen || (st.momSeen = []);
  var pool = G.moments.SCEN.filter(function (s) { return s.r.indexOf(p.role) >= 0; });
  var fresh = pool.filter(function (s) { return seen.indexOf(s.id) < 0; });
  var s = G.rng.pick(fresh.length ? fresh : pool);
  seen.push(s.id); if (seen.length > Math.min(3, pool.length - 1)) seen.shift();
  return s;
};

// Success chance of option i against this opponent (goalkeepers on a penalty: the side the taker prefers is the good guess)
/** @param {Player} p @param {Moment} s @param {number} i @param {number} hint @param {Club} [opp] @returns {number} */
G.moments.chance = function (p, s, i, hint, opp) {
  var M = G.CFG.MOMENTS, o = s.o[i], attr = o[1].reduce(function (t, k) { return t + p.attrs[k]; }, 0) / o[1].length;
  var base = s.gk ? (i === hint ? M.GK_HINT : M.GK_OTHER) : M.BASE + o[2] + (o[3] === 'stop' ? M.STOP : 0);  // stopping is easier than scoring
  return G.clamp(base + (attr - 60) / M.ATTR_DIV + p.form * M.FORM + (opp ? (p.ovr - opp.str) / M.OPP_DIV : 0), M.MIN, M.MAX);
};

// Simulating: the option worth the most (a goal of ours counts a bit more than one we avoid)
/** @param {Player} p @param {Moment} s @param {number} hint @param {Club} [opp] @returns {number} */
G.moments.best = function (p, s, hint, opp) {
  var best = 0, ev = -1;
  s.o.forEach(function (o, i) { var c = G.moments.chance(p, s, i, hint, opp) * (o[3] === 'stop' ? 0.9 : 1); if (c > ev) { ev = c; best = i; } });
  return best;
};

// Is this a match that counts? Returns the reason, or ''
/** @param {State} st @param {Club} club @param {Club} opp @param {string} [cupFinal] @returns {string} */
G.moments.why = function (st, club, opp, cupFinal) {
  var S = st.S, b = S.cur ? S.cur.b : S.block, L = G.leagueByKey(club.lg);
  if (cupFinal) return 'la finale di ' + cupFinal;
  if (club.riv.indexOf(opp.id) >= 0) return 'il derby con il ' + opp.name;
  if (b < 2 || opp.lg !== club.lg) return '';
  var t = G.season.sortTable(S, club.lg), pc = t.indexOf(club.id) + 1, po = t.indexOf(opp.id) + 1, n = t.length;
  if (pc <= 3 && po <= 3) return 'lo scontro diretto per il titolo con il ' + opp.name;
  if (L.tier === 1 && pc > n - 4 && po > n - 4) return 'lo scontro salvezza con il ' + opp.name;
  return '';
};

// The player's next match on the coming day, if it counts: { opp, why, key }
/** @param {State} st @returns {{ opp: ClubId, why: string, key: string }|null} */
G.moments.ahead = function (st) {
  var S = st.S, cur = S.cur, club = st.world.clubs[st.player.clubId], f = (cur.d + 1) / cur.D, /** @type {{ opp: ClubId, cup?: string }} */ found = null;
  if (cur.b > 4 || st.player.inj > 0) return null;
  if (cur.days) {
    // with a calendar: the club's match on the next date, a league match or the cup final (the rule of the moments is the same)
    var x = cur.days[cur.d], e = x === undefined ? null : G.cal.matchOn(st, club.id, x);
    if (e && typeof e.opp === 'number' && (e.ck === 'lg' || (e.ck === club.nat && e.rd === 'Finale'))) found = e.ck === 'lg' ? { opp: e.opp } : { opp: e.opp, cup: e.name };
    var w = found ? G.moments.why(st, club, st.world.clubs[found.opp], found.cup) : '';
    return w ? { opp: found.opp, why: w, key: S.year + ':' + cur.b + ':' + cur.d } : null;
  }
  var lg = S.lg[club.lg], fx = G.season.fixtures(S, club.lg), r = cur.lg[club.lg], target = Math.round(r[0] + (r[1] - r[0]) * f);
  for (var md = lg.md; md < target && !found; md++) fx[md].forEach(function (m) { if (m[0] === club.id || m[1] === club.id) found = { opp: m[0] === club.id ? m[1] : m[0] }; });
  if (!found) Object.keys(cur.cup).forEach(function (k) {
    var c = cur.cup[k], cup = S.cups[k], tg = Math.min(c[0], Math.floor(c[0] * f + 0.5));
    if (c[1] < tg && cup.winner === null && cup.alive.length === 2 && cup.alive.indexOf(club.id) >= 0) found = { opp: cup.alive[0] === club.id ? cup.alive[1] : cup.alive[0], cup: cup.name };
  });
  if (!found) return null;
  var why = G.moments.why(st, club, st.world.clubs[found.opp], found.cup);
  return why ? { opp: found.opp, why: why, key: S.year + ':' + cur.b + ':' + cur.d } : null;
};

/** @param {string} txt @param {Dict<string>} v @returns {string} */
G.moments.fill = function (txt, v) { return txt.replace(/\{(\w+)\}/g, function (m, k) { return v[k] !== undefined ? v[k] : m; }); };

// Playing live: stop before the day of a match that counts and ask; true = stop here
/** @param {State} st @returns {boolean} */
G.moments.stop = function (st) {
  var S = st.S, cur = S.cur;
  if (!st.live || st.mgr || st.event || (cur.mom || 0) >= G.CFG.MOMENTS.PER_BLOCK) return false;
  var A = G.moments.ahead(st);
  if (!A || (st.momentPick && st.momentPick.key === A.key)) return false;
  var p = st.player, opp = st.world.clubs[A.opp], s = G.moments.draw(st), hint = G.rng.int(0, 2);
  // the scouts' tip on the penalty taker is right most of the time, not always
  var tip = G.rng.chance(G.CFG.MOMENTS.GK_TIP) ? hint : G.rng.int(0, 2);
  var lab = s.o.map(function (o, i) {
    var pct = Math.round(G.moments.chance(p, s, i, hint, opp) * 100);
    return o[0] + ' · ' + o[1].map(function (k) { return G.ATTR_NAMES[k] + ' ' + Math.round(p.attrs[k]); }).join(', ') +
      (s.gk ? (i === tip ? ' · gli osservatori dicono che il rigorista calcia spesso qui' : '') : ' · riuscita ~' + pct + '%');
  });
  st.event = { id: 'moment', moment: 1, key: A.key, sc: s.id, hint: hint, t: '⚡ ' + s.t + ': ' + A.why,
    d: G.moments.fill(s.d, { opp: opp.name }) + ' Le probabilità tengono conto dei tuoi attributi, della forma e della forza del ' + opp.name + '. Se va bene cambia il risultato, se va male può costare caro.', o: lab };
  return true;
};

/** @param {State} st @param {number|string} i */
G.moments.pick = function (st, i) {
  var ev = st.event;
  st.momentPick = { key: ev.key, i: +i || 0, hint: ev.hint, sc: ev.sc };
  st.event = null;
};

// Inside the match, after the scorers are drawn: returns the moment or null; may change res
/** @param {State} st @param {string} mine @param {ClubId} h @param {ClubId} a @param {number[]} res @param {MatchComp} comp @param {MatchPart} mp @returns {MomentOutcome|null} */
G.moments.resolve = function (st, mine, h, a, res, comp, mp) {
  var cupFinal = comp.final;
  var M = G.CFG.MOMENTS, S = st.S, cur = S.cur, p = st.player, W = st.world;
  if (!cur || cur.b > 4 || (!comp.lg && !cupFinal) || (cur.mom || 0) >= M.PER_BLOCK) return null;
  var club = W.clubs[p.clubId], opp = W.clubs[mine === 'h' ? a : h], why = G.moments.why(st, club, opp, cupFinal ? comp.name : '');
  if (!why) return null;
  var key = S.year + ':' + cur.b + ':' + cur.d, pick = st.momentPick && st.momentPick.key === key ? st.momentPick : null;
  if (st.live && !pick) return null;
  st.momentPick = null;
  if (!mp || mp.mins < M.MIN_MINS) { if (pick) G.news(st, '⚡ Non eri in campo nel finale: il momento decisivo di ' + why + ' l’hanno vissuto gli altri'); return null; }
  if (Math.abs(res[0] - res[1]) > 1) { if (pick) G.news(st, '⚡ ' + why.charAt(0).toUpperCase() + why.slice(1) + ' non è mai stata in bilico: nessun momento decisivo (' + res[0] + '-' + res[1] + ')'); return null; }
  cur.mom = (cur.mom || 0) + 1;
  var s = (pick && G.moments.byId(pick.sc)) || G.moments.draw(st), hint = pick ? pick.hint : G.rng.int(0, 2);
  var i = pick ? pick.i : G.moments.best(p, s, hint, opp), o = s.o[i], ok = G.rng.chance(G.moments.chance(p, s, i, hint, opp));
  var us = mine === 'h' ? 0 : 1, before = [res[us], res[1 - us]];
  var /** @type {MomentOutcome} */ M2 = { ok: ok, why: why, opt: o[0], g: 0, a: 0, bonus: ok ? M.RATING_OK : M.RATING_KO, min: G.rng.int(82, 94), before: before, opp: opp.name };
  M2.txt = G.moments.fill(ok ? o[4] : o[5], { opp: opp.name });
  if (o[3] === 'stop') { if (!ok) res[1 - us]++; else if (o[7] && G.rng.chance(o[7])) { res[us]++; M2.a = 1; M2.txt += ', e dall’azione nasce il gol'; } }
  else if (ok) { res[us]++; if (o[3] === 'goal') M2.g = 1; else M2.a = 1; }
  else if (o[6] && G.rng.chance(o[6])) { res[1 - us]++; M2.txt += '; il ' + opp.name + ' riparte e segna'; }
  mp.mom = M2;
  return M2;
};

// After the match: the line shown to the player, with minute and score
/** @param {State} st @param {MomentOutcome} M2 @param {number} gf @param {number} gc */
G.moments.report = function (st, M2, gf, gc) {
  var b = M2.before, sc = b[0] === b[1] ? 'sul ' + b[0] + '-' + b[1] : b[0] > b[1] ? 'avanti ' + b[0] + '-' + b[1] : 'sotto ' + b[0] + '-' + b[1];
  var t = '⚡ ' + (M2.min > 90 ? '90+' + (M2.min - 90) : M2.min) + '’, ' + sc + ' contro il ' + M2.opp + ': ' + M2.opt.toLowerCase() + ', ' + M2.txt + '. Finisce ' + gf + '-' + gc + '.';
  st.momentResult = { ok: M2.ok, t: t };
  G.news(st, t);
};
