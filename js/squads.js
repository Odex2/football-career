// @ts-check
// NPC players: generation, lineups, value/wages, yearly development, contracts.
// Player: { i id, n name, nt nation, r role, a age, o overall, p potential, c club (-1 free agent),
//           w wage k€/week, y contract years, s season stats, k career [apps, goals, assists] }
// s = [lgApps, lgGoals, lgAssists, lgCleanSheets, lgRatingSum, apps, goals, assists, cleanSheets, ratingSum]

G.squads = {};
G.ROLE_KEYS = ['POR', 'DC', 'TS', 'CC', 'ES', 'ATT'];

G.allNations = function () {
  return G.DATA.nations.map(function (n) { return n.id; }).concat(G.DATA.extraNations.map(function (n) { return n.id; }));
};
/** @param {NationCode} id @returns {NationRef} */
G.nationInfo = function (id) {
  return G.NATIONS[id] || G.DATA.extraNations.filter(function (n) { return n.id === id; })[0] || (G.NT && G.NT[id]) || { id: id, name: id, flag: '🏳️' };
};

/** @param {NationCode} nat @param {Rng} rng */
G.squads.name = function (nat, rng) {
  var pool = G.DATA.names[nat] || G.DATA.names.ENG;
  return rng.pick(pool[0].split(' ')) + ' ' + rng.pick(pool[1].split(' ')).replace(/_/g, ' ');  // de_Jong: a surname of two words
};
/** @param {string} n a full name @returns {string} the surname: all after the first name ("de Jong", "El Khannouss") */
G.squads.sur = function (n) { return n.slice(n.indexOf(' ') + 1); };

/** @param {Club} club @param {Rng} rng @returns {NationCode} */
G.squads.pickNat = function (club, rng) {
  var home = club.nat === 'KSA' ? 0.45 : club.nat === 'USA' ? 0.5 : 0.68;
  if (rng.chance(home)) return club.nat;
  if (rng.chance(0.45)) return G.DATA.extraNations[G.match.pickWeighted(G.DATA.extraNations.map(function (n) { return n.w || 1; }), rng)].id;
  return rng.pick(G.DATA.nations).id;
};

/** @param {number} o @param {number} a @param {number} p */
G.squads.value = function (o, a, p) {
  var C = G.CFG, f = 1;
  if (a <= 21) f = 1 + Math.max(0, p - o) / 25;
  else if (a <= 27) f = 1 + Math.max(0, p - o) / 40;
  else if (a > 30) f = Math.max(0.15, 1 - (a - 30) * 0.15);
  return Math.round(C.VALUE_BASE * Math.exp((o - 60) / C.VALUE_DIV) * f * 10) / 10;
};

/** @param {number} o @param {Club} [club] */
G.squads.wage = function (o, club) {
  var m = club ? G.world.leagueMult(club) : 1;
  return Math.max(1, Math.round(G.CFG.WAGE_K * Math.exp((o - 55) / G.CFG.WAGE_DIV) * Math.sqrt(m)));
};

/** @param {World} W @param {Npc} o */
G.squads.newPlayer = function (W, o) {
  var id = W.free && W.free.length ? /** @type {PlayerId} */ (W.free.pop()) : W.players.length;
  o.i = id; o.s = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; o.k = o.k || [0, 0, 0];
  W.players[id] = o;
  return o;
};

/** @param {World} W @param {Club} club @param {RoleKey} role @param {number} o @param {number} a @param {Rng} rng */
G.squads.make = function (W, club, role, o, a, rng) {
  var p = a < G.CFG.NPC_PEAK ? o + (G.CFG.NPC_PEAK - a) * rng.range(0.4, 1.6) : o;
  var nat = G.squads.pickNat(club, rng);
  var pl = G.squads.newPlayer(W, /** @type {Npc} */ ({ n: G.squads.name(nat, rng), nt: nat, r: role, a: a, o: Math.round(G.clamp(o, 35, 95) * 10) / 10,
    p: Math.round(G.clamp(p, o, 97)), c: club.id, y: rng.int(1, 5) }));
  pl.w = G.squads.wage(pl.o, club);
  club.sq.push(pl.i);
  return pl;
};

/** @param {World} W @param {Rng} rng */
G.squads.generate = function (W, rng) {
  var C = G.CFG;
  W.clubs.forEach(function (club) {
    var B = club.base, youthLeft = rng.int(1, 2);
    G.ROLE_KEYS.forEach(function (r) {
      for (var i = 0; i < C.SQUAD[r]; i++) {
        var o, a;
        if (i < C.FORMATION[r]) { o = B + rng.normal() * 2.2; a = rng.int(22, 31); }
        else if (youthLeft > 0 && rng.chance(0.3)) { youthLeft--; o = B - 12 + rng.normal() * 3; a = rng.int(17, 19); }
        else { o = B - rng.range(3, 8); a = rng.int(19, 33); }
        G.squads.make(W, club, r, o, a, rng);
      }
    });
  });
};

/** @param {World} W @param {Club} club @param {RoleKey} r */
G.squads.roleList = function (W, club, r) {
  return club.sq.filter(function (id) { return W.players[id].r === r; })
    .sort(function (a, b) { return W.players[b].o - W.players[a].o; });
};

// Best XI (4-4-2). Missing roles are filled with the best remaining players.
/** @param {World} W @param {Club} club */
G.squads.xi = function (W, club) {
  var F = G.CFG.FORMATION, /** @type {PlayerId[]} */ xi = [], /** @type {Dict<number>} */ used = {};
  G.ROLE_KEYS.forEach(function (r) {
    G.squads.roleList(W, club, r).slice(0, F[r]).forEach(function (id) { xi.push(id); used[id] = 1; });
  });
  if (xi.length < 11) {
    club.sq.filter(function (id) { return !used[id]; }).sort(function (a, b) { return W.players[b].o - W.players[a].o; })
      .slice(0, 11 - xi.length).forEach(function (id) { xi.push(id); });
  }
  return xi;
};

/** @param {World} W @param {Npc} pl */
G.squads.release = function (W, pl) {
  var club = W.clubs[pl.c];
  if (club) club.sq.splice(club.sq.indexOf(pl.i), 1);
  pl.c = -1; pl.y = 0; pl.fa = 0;
};

/** @param {World} W @param {Npc} pl @param {Rng} rng */
G.squads.retire = function (W, pl, rng) {
  if (pl.c >= 0) { var club = W.clubs[pl.c]; club.sq.splice(club.sq.indexOf(pl.i), 1); }
  if (pl.o >= 76 && rng.chance(0.35)) G.coaches.fromPlayer(W, pl, rng);
  W.players[pl.i] = /** @type {Npc} */ (/** @type {unknown} */ (null));  // a free slot, see World.players
  (W.free || (W.free = [])).push(pl.i);
};

// End of season: growth/decline, retirements, contracts, youth intake. mgrClub: the managed club when the manager
// keeps its contracts himself (M8 D4): who was not renewed leaves on a free
/** @param {World} W @param {Rng} rng @param {(txt: string) => void} [say] tells the career's news (famous players retiring) @param {ClubId} [mgrClub] */
G.squads.yearEnd = function (W, rng, say, mgrClub) {
  var C = G.CFG;
  W.players.forEach(function (pl) {
    if (!pl) return;
    var minF = 0.6 + 0.6 * Math.min(1, pl.s[5] / 35);
    if (pl.a < C.NPC_PEAK) pl.o += Math.max(0, pl.p - pl.o) * C.NPC_GROW * minF + rng.normal() * C.NPC_NOISE;
    else if (pl.a >= C.NPC_DECL_AGE) pl.o -= (pl.a - C.NPC_DECL_AGE + 1) * C.NPC_DECL * rng.range(0.5, 1.5);
    else pl.o += rng.normal() * 0.8;
    // Potential is a ceiling: noise can't push a player past it (otherwise top ratings creep up every year)
    pl.o = Math.round(G.clamp(pl.o, 30, Math.min(96, pl.p + 1)) * 10) / 10;
    pl.a++;
    pl.k[0] += pl.s[5]; pl.k[1] += pl.s[6]; pl.k[2] += pl.s[7];
    for (var j = 0; j < 10; j++) pl.s[j] = 0;
    if (pl.a >= C.NPC_MAX_AGE || (pl.a >= C.NPC_RETIRE_AGE && rng.chance(0.4)) || pl.o < 40 || (pl.c < 0 && (pl.fa || 0) >= 2)) {
      if (pl.o >= 85 && say) say('👋 ' + pl.n + ' si ritira dal calcio giocato');
      return G.squads.retire(W, pl, rng);
    }
    if (pl.c < 0) { pl.fa = (pl.fa || 0) + 1; return; }
    pl.y--;
    if (pl.y <= 0 && mgrClub !== undefined && pl.c === mgrClub) {
      if (say) say('👋 ' + pl.n + ' lascia a parametro zero');
      return G.squads.release(W, pl);
    }
    if (pl.y <= 0) {
      var club = W.clubs[pl.c], list = G.squads.roleList(W, club, pl.r);
      var keep = list.indexOf(pl.i) < C.FORMATION[pl.r] + 1 || (pl.a < 24 && pl.p > club.str);
      if (keep && pl.a < 34 && rng.chance(0.85)) { pl.y = rng.int(1, 4); pl.w = Math.max(pl.w, G.squads.wage(pl.o, club)); }
      else G.squads.release(W, pl);
    }
  });
  W.clubs.forEach(function (club) {
    var n = rng.int(C.YOUTH_PER_YEAR[0], C.YOUTH_PER_YEAR[1]);
    for (var i = 0; i < n; i++) {
      var pl = G.squads.make(W, club, rng.pick(G.ROLE_KEYS), club.str - 14 + rng.normal() * 3, rng.int(16, 18), rng);
      pl.p = Math.round(G.clamp(pl.o + (rng.chance(C.WONDERKID) ? rng.range(C.WONDERKID_POT[0], C.WONDERKID_POT[1]) : rng.range(C.YOUTH_POT[0], C.YOUTH_POT[1])) + (club.rep - 75) * 0.1, pl.o, 94));
      pl.nt = rng.chance(0.75) ? club.nat : pl.nt;
      pl.y = 3; pl.w = Math.max(1, Math.round(pl.w * 0.5));
    }
    G.squads.trim(W, club);
  });
};

// Keep squad size within limits: release the least useful players (never one on loan, M8 D5)
/** @param {World} W @param {Club} club */
G.squads.trim = function (W, club) {
  while (club.sq.length > G.CFG.SQUAD_MAX) {
    var worst = club.sq.filter(function (id) { return W.players[id].ln === undefined; }).sort(function (a, b) {
      var x = W.players[a], y = W.players[b];
      return (x.o + (x.p - x.o) * 0.5) - (y.o + (y.p - y.o) * 0.5);
    })[0];
    if (worst === undefined) break;
    G.squads.release(W, W.players[worst]);
  }
};

/** @param {World} W */
G.squads.freeAgents = function (W) {
  return W.players.filter(function (pl) { return pl && pl.c < 0; });
};
