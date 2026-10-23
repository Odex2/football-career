// @ts-check
// Coaches: generation, sackings, hiring chain, reputation. The player cannot influence them,
// but relationships (player.rel[coachId]) follow coaches wherever they go.

G.coaches = {};

/** @param {World} W @param {CoachDraft} o @returns {Coach} */
G.coaches.add = function (W, o) {
  o.i = W.coaches.length; o.c = -1;
  var c = /** @type {Coach} */ (o);
  W.coaches.push(c);
  return c;
};

/** @param {World} W @param {number} rep @param {NationCode} nat @param {Rng} rng */
G.coaches.newCoach = function (W, rep, nat, rng) {
  return G.coaches.add(W, /** @type {Coach} */ ({ n: G.squads.name(nat, rng), nt: nat, a: rng.int(38, 62), rep: Math.round(G.clamp(rep, 40, 95)),
    sty: rng.pick(Object.keys(G.CFG.COACH_STYLES)) }));
};

/** @param {World} W @param {Rng} rng */
G.coaches.generate = function (W, rng) {
  W.clubs.forEach(function (club) {
    var co = G.coaches.newCoach(W, club.rep + rng.normal() * 4, rng.chance(0.75) ? club.nat : rng.pick(G.allNations()), rng);
    co.c = club.id; club.coach = co.i;
  });
  for (var i = 0; i < 70; i++) G.coaches.newCoach(W, rng.range(52, 80), rng.pick(G.allNations()), rng);
};

/** @param {World} W @param {Npc} pl @param {Rng} rng */
G.coaches.fromPlayer = function (W, pl, rng) {
  var co = G.coaches.add(W, /** @type {Coach} */ ({ n: pl.n, nt: pl.nt, a: pl.a + 2, rep: Math.round(G.clamp(pl.o - 14 + rng.normal() * 4, 45, 85)),
    sty: rng.pick(Object.keys(G.CFG.COACH_STYLES)), exp: 1 }));
  return co;
};

/** @param {World} W @param {Club} club @returns {Coach} */
G.coaches.of = function (W, club) { return club && club.coach >= 0 ? W.coaches[club.coach] : null; };

/** @param {World} W @param {Club} club */
G.coaches.bonus = function (W, club) {
  var co = G.coaches.of(W, club), C = G.CFG;
  if (!co) return -1;
  return G.clamp((co.rep - 70) / C.COACH_BONUS_DIV, -C.COACH_BONUS_MAX, C.COACH_BONUS_MAX) + (co.sty === 'tattico' ? 0.5 : 0);
};

// Fill a vacancy; may poach from a smaller club (which then hires in turn)
/** @param {State} st @param {Club} club @param {Rng} rng @param {number} [depth] @returns {Coach} */
G.coaches.hire = function (st, club, rng, depth) {
  var W = st.world;
  depth = depth || 0;
  var free = W.coaches.filter(function (co) { return co.c === -1 && !co.ret && !co.me && co.rep <= club.rep + 6; });
  var poach = depth < 1 ? W.coaches.filter(function (co) {
    return co.c >= 0 && co.c !== club.id && !co.ret && !co.me && W.clubs[co.c].rep <= club.rep - 8 && co.rep <= club.rep + 4 && co.rep >= club.rep - 6;
  }) : [];
  var cand = free.concat(rng.chance(0.4) ? poach : []).sort(function (a, b) { return b.rep - a.rep; }).slice(0, 3);
  var co = cand.length ? rng.pick(cand) : G.coaches.newCoach(W, club.rep - 8, club.nat, rng);
  var old = co.c >= 0 ? W.clubs[co.c] : null;
  if (old) { old.coach = -1; }
  co.c = club.id; club.coach = co.i;
  G.coaches.onMove(st, co, club, old);
  if (old) G.coaches.hire(st, old, rng, depth + 1);
  return co;
};

/** @param {State} st @param {Club} club @param {Rng} rng @param {string} [why] */
G.coaches.sack = function (st, club, rng, why) {
  var W = st.world, co = G.coaches.of(W, club);
  if (!co) return;
  co.c = -1; co.rep = Math.max(40, co.rep - 3); club.coach = -1;
  if (club.rep >= 74 || club.id === st.player.clubId) G.news(st, '🔥 ' + club.name + ' esonera ' + co.n + (why ? ' (' + why + ')' : ''));
  if (club.id === st.player.clubId && !st.mgr) G.life.coachLeft(st, co);
  G.coaches.hire(st, club, rng);
};

/** @param {State} st @param {Coach} co @param {Club} club @param {Club|null} old */
G.coaches.onMove = function (st, co, club, old) {
  var p = st.player;
  if (club.rep >= 76 || club.id === p.clubId || (old && old.id === p.clubId))
    G.news(st, '🤝 ' + club.name + ' sceglie ' + co.n + (old ? ' (dal ' + old.name + ')' : ''));
  if (st.mgr) return;
  if (club.id === p.clubId) G.life.coachArrived(st, co);
  else if ((p.rel[co.i] || 0) >= 35 && club.id !== p.clubId) (st.coachCalls || (st.coachCalls = [])).push({ coach: co.i, club: club.id });
};

// Mid-season (phase 'mid') and end-of-season ('end') sackings based on table vs expectations
/** @param {State} st @param {string} phase @param {Rng} rng */
G.coaches.review = function (st, phase, rng) {
  var W = st.world, S = st.S, C = G.CFG;
  G.LEAGUES.forEach(function (L) {
    var lg = S.lg[L.key];
    if (!lg || lg.md < 6) return;
    var table = G.season.sortTable(S, L.key);
    var byStr = lg.ids.slice().sort(function (a, b) { return W.clubs[b].str - W.clubs[a].str; });
    table.forEach(function (id, pos) {
      if (st.mgr && id === st.mgr.club) return;
      var club = W.clubs[id], gap = pos - byStr.indexOf(id);
      var big = club.rep >= 80 ? 1.4 : 1;
      if (phase === 'end') {
        var co = G.coaches.of(W, club);
        if (co) co.rep = Math.round(G.clamp(co.rep - G.clamp(gap * 0.4, -3, 3) + (pos === 0 ? 2 : 0), 40, 95));
      }
      var lim = phase === 'mid' ? C.SACK_GAP_MID : C.SACK_GAP_END, pr = (phase === 'mid' ? C.SACK_P_MID : C.SACK_P_END) * big;
      if (gap >= lim && rng.chance(pr)) G.coaches.sack(st, club, rng, (pos + 1) + 'º posto');
    });
  });
};

/** @param {State} st @param {Rng} rng */
G.coaches.yearEnd = function (st, rng) {
  var W = st.world;
  W.coaches.forEach(function (co) {
    if (co.ret || co.me) return;
    co.a++;
    if (co.a >= 71 || (co.a >= 64 && rng.chance(0.25))) {
      co.ret = 1;
      if (co.c >= 0) { var club = W.clubs[co.c]; club.coach = -1; co.c = -1; G.coaches.hire(st, club, rng); }
    }
  });
  // Ambitious big clubs sometimes upgrade a merely decent coach
  W.clubs.forEach(function (club) {
    var co = G.coaches.of(W, club);
    if (co && !(st.mgr && club.id === st.mgr.club) && club.rep >= 82 && co.rep < club.rep - 8 && rng.chance(0.3)) G.coaches.sack(st, club, rng, 'cambio di progetto');
  });
  var free = W.coaches.filter(function (co) { return co.c === -1 && !co.ret; }).length;
  for (var i = free; i < 50; i++) G.coaches.newCoach(W, rng.range(50, 74), rng.pick(G.allNations()), rng);
};
