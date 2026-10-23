// @ts-check
// Second career extras: every tactic has a price off the pitch, a club where you played long retires your shirt
// (squad morale bonus while you work there), and an heir in your old role appears in the academy of your first club.

G.mgrLife = {};

// Each block: offensive football tires the squad but pleases the fans, defensive football the other way round
/** @param {State} st */
G.mgrLife.block = function (st) {
  var L = G.CFG.MGR_LIFE, m = st.mgr, c = L.TACTIC[m.tactic || 'bal'];
  m.morale = Math.round(G.clamp(m.morale + c[0] + (m.shirt === m.club ? L.SHIRT_MO : 0), 0, 100));
  if (c[1]) G.life.fans(st, m.club, c[1]);
};

// Text for the tactic buttons
/** @param {Mgr} m @returns {string} */
G.mgrLife.tacticHint = function (m) {
  var c = G.CFG.MGR_LIFE.TACTIC[m.tactic], f = /** @param {number} x */ function (x) { return (x > 0 ? '+' : '') + x; };
  return { att: 'Offensiva: rende di più contro chi è più debole; la squadra si stanca (morale ' + f(c[0]) + ' a blocco) ma i tifosi si divertono (' + f(c[1]) + ').',
    bal: 'Equilibrata: nessun vantaggio e nessun costo.',
    def: 'Difensiva: rende di più contro chi è più forte; spogliatoio sereno (morale ' + f(c[0]) + ' a blocco) ma i tifosi si annoiano (' + f(c[1]) + ').' }[m.tactic];
};

// Taking a job: the retired shirt and, once per career, the heir
/** @param {State} st */
G.mgrLife.start = function (st) {
  var L = G.CFG.MGR_LIFE, p = st.player, m = st.mgr, W = st.world, club = W.clubs[m.club];
  m.shirts = m.shirts || {};
  if (!m.shirts[club.id] && (p.seasonsAt[club.id] || 0) >= L.SHIRT_SEASONS) {
    m.shirts[club.id] = 1; m.morale = Math.min(100, m.morale + L.SHIRT_START);
    G.news(st, '👕 Il ' + club.name + ' ritira la tua maglia: lo spogliatoio ti accoglie da leggenda');
  }
  m.shirt = m.shirts[club.id] ? club.id : null;
  if (m.heir === undefined) G.mgrLife.heir(st);
};

/** @param {State} st */
G.mgrLife.heir = function (st) {
  var L = G.CFG.MGR_LIFE, p = st.player, W = st.world, rng = G.rng, m = st.mgr;
  var home = p.history.length ? W.clubs[p.history[0].clubId] : W.clubs[m.club], sur = p.name.split(' ').slice(-1)[0];
  var pl = G.squads.make(W, home, p.role, L.HEIR_OVR, 17, rng);
  pl.p = rng.int(L.HEIR_POT[0], L.HEIR_POT[1]); pl.nt = p.nat; pl.heir = 1; pl.n = p.name;
  for (var t = 0; t < 9 && pl.n.split(' ')[0] === p.name.split(' ')[0]; t++) pl.n = G.squads.name(p.nat, rng).split(' ')[0] + ' ' + sur;
  m.heir = pl.i;
  G.news(st, '🌱 Nelle giovanili del ' + home.name + (p.mgrOnly ? ' c’è un ragazzo con il tuo cognome: ' + pl.n + ', 17 anni, tuo nipote. Lo chiamano già il tuo erede.' :
    ' c’è un ragazzo che gioca come te: ' + pl.n + ', 17 anni. Lo chiamano già il tuo erede.'));
};

// One line for the dashboard: where the heir is and how he grows
/** @param {State} st @returns {string} */
G.mgrLife.heirLine = function (st) {
  var m = st.mgr, W = st.world, pl = m.heir !== undefined && m.heir !== null ? W.players[m.heir] : null;
  if (!pl || !pl.heir) return '';
  var c = pl.c >= 0 ? W.clubs[pl.c] : null;
  return '<div class="small">🌱 Il tuo erede: <b>' + pl.n + '</b> · ' + pl.a + ' anni · ' + Math.round(pl.o) + ' di overall · ' + (c ? c.name + (c.id === m.club ? ' (è tuo!)' : '') : 'svincolato') + '</div>';
};
