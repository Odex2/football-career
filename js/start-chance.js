// @ts-check
// How likely the player is to start a match, and the pieces of it (shown in the Profile tab).

// The pieces, in overall points: the last starter of the role is the bar to clear; form, morale, the coach's
// trust, youth bonuses and the analyst add to the overall; the contract guarantees a floor (cut in bad form)
/** @param {State} st @returns {StartParts} */
G.season.startParts = function (st) {
  var C = G.CFG, p = st.player, W = st.world, club = W.clubs[p.clubId];
  var list = G.squads.roleList(W, club, p.role), n = C.FORMATION[p.role], rival = list[n - 1] !== undefined ? list[n - 1] : null;
  var level = rival !== null ? W.players[rival].o : 45;
  var co = G.coaches.of(W, club), form = p.form * C.FORM_WEIGHT, morale = (p.morale - 50) / 25, coach = co ? (p.rel[co.i] || 0) / C.REL_DIV : 0;
  var young = p.age <= 19 ? C.YOUTH_BONUS : 0, yCoach = co && co.sty === 'giovani' && p.age <= 22 ? 2 : 0, analyst = G.life.staff(p, 'analyst');
  var bonus = form + morale + coach + young + yCoach + analyst;  // the same order of sums as always: same numbers to the last digit
  var floor = (C.ROLE_FLOOR[G.sure(p.contract).role] || 0) * (p.form < C.FLOOR_BAD_FORM ? C.FLOOR_CUT : 1);
  return { chance: Math.max(floor, G.sigmoid((p.ovr + bonus - level) / C.MIN_K)), rival: rival, level: level, form: form, morale: morale, coach: coach,
    young: young + yCoach, analyst: analyst, floor: floor };
};

/** @param {State} st @returns {number} */
G.season.startChance = function (st) { return G.season.startParts(st).chance; };
