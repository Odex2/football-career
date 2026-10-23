// @ts-check
// Captain's armband: earned at the club with seniority, fans and weight in the squad; national team armband from caps.

G.captain = {};

/** @param {State} st */
G.captain.score = function (st) {
  var C = G.CFG.CAPTAIN, p = st.player, W = st.world, club = W.clubs[p.clubId], co = G.coaches.of(W, club);
  return (p.seasonsAt[club.id] || 0) * 8 + Math.min(12, Math.max(0, p.age - 18)) * 2 + (p.fans[club.id] || 0) * 0.3 +
    (p.ovr - club.str) * 1.5 + (co ? (p.rel[co.i] || 0) * 0.1 : 0) + (p.bandiera[club.id] ? 20 : 0);
};

// At the start of each season: win, keep or lose the armband
/** @param {State} st */
G.captain.check = function (st) {
  var C = G.CFG.CAPTAIN, p = st.player, W = st.world, club = W.clubs[p.clubId], co = G.coaches.of(W, club);
  if (p.loanFrom !== null) { p.captain = null; return; }
  var sc = G.captain.score(st), rel = co ? p.rel[co.i] || 0 : 0;
  if (p.captain === club.id) {
    if (rel <= C.STRIP_REL || sc < C.DROP) { p.captain = null; p.morale = Math.max(0, p.morale - 6); G.news(st, '😞 Al ' + club.name + ' la fascia passa a un compagno'); }
    return;
  }
  p.captain = null;
  if (p.age >= C.AGE && ((p.seasonsAt[club.id] || 0) >= C.SEASONS || p.bandiera[club.id]) && sc >= C.NEED && rel > C.STRIP_REL) {
    p.captain = club.id; p.capClubs = p.capClubs || {}; p.capClubs[club.id] = 1;
    p.morale = Math.min(100, p.morale + 5); G.life.fame(st, 2);
    G.news(st, '©️ Sei il nuovo capitano del ' + club.name);
  }
};

// National armband: given by the ct to the most capped leader once you are called up regularly
/** @param {State} st @param {boolean|number} called */
G.captain.national = function (st, called) {
  var C = G.CFG.CAPTAIN, p = st.player;
  if (!called || !p.nt || p.nt.cap || p.nt.caps < C.NT_CAPS || p.age < C.NT_AGE) return;
  p.nt.cap = st.S ? st.S.year : st.year;
  G.life.fame(st, 3);
  G.news(st, '©️ Il ct ti consegna la fascia di capitano di ' + G.national.name(p.nat));
};

/** @param {State} st @param {SeasonRecord} rec */
G.captain.seasonEnd = function (st, rec) {
  var C = G.CFG.CAPTAIN, p = st.player;
  if (p.captain === rec.clubId) { rec.captain = 1; p.capSeasons = (p.capSeasons || 0) + 1; G.life.fame(st, C.FAME); }
};
