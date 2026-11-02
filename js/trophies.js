// @ts-check
// Pixel-art trophies: 16x16 sprites drawn as crisp SVG, with metal palettes and nation ribbons.
// Sprite letters: M main, H highlight, D shade, B/b wooden base, K black, W white (or the club's 2nd colour),
// G green, E red, R/r ribbon. Every sprite gets an automatic 1px dark outline.

G.tro = {};

G.tro.BASE = ['....BBBBBBBB....', '...BBbbbbbbBB...', '...bbbbbbbbbb...'];
G.tro.EASEL = ['................', '.....bBBBBb.....', '....bbbbbbbb....'];

/** @type {Dict<string[]>} */
G.tro.SPR = {
  cup: ['................', '...HHMMMMMMD....', '.DDHMMMMMMMMDDD.', 'D..HMMMMMMMMD..D', 'D..HMMMMMMMMD..D', '.D.HMMMMMMMMD.D.',
    '..DDHMMMMMMDDD..', '....HMMMMMMD....', '.....HMMMMD.....', '......HMMD......', '......HMMD......', '....RRrRRrRR....', '.....HMMMMD.....'],
  ears: ['................', '....HMMMMMMD....', '.DD.HMMMMMMD.DD.', 'D..DHMMMMMMDD..D', 'D...HMMMMMMD...D', 'D...HMMMMMMD...D',
    '.D..HMMMMMMD..D.', '..DDDHMMMMDDDD..', '.....HMMMMD.....', '......HMMD......', '......HMMD......', '.....HMMMMD.....', '....HMMMMMMD....'],
  tall: ['......HMMD......', '.....HMMMMD.....', '....HMMMMMMD....', '....HMMMMMMD....', '...DHMMMMMMDD...', '...D.HMMMMD.D...',
    '...D.HMMMMD.D...', '....DHMMMMDD....', '.....HMMMMD.....', '......HMMD......', '.....RRrrRR.....', '......HMMD......', '.....HMMMMD.....'],
  globe: ['................', '......HMMD......', '.....HMMMMD.....', '....HMHMMMMD....', '....HMMMMMMD....', '.....HMMMMD.....',
    '......HMMD......', '.....HMMMMD.....', '....DHMMMMDD....', '.....HMMMMD.....', '......HMMD......', '.....GGGGGG.....', '.....HMMMMD.....',
    '.....GGGGGG.....', '....HMMMMMMD....', '....DDDDDDDD....'],
  shield: ['................', '................', '...KKKKKKKKKK...', '...KGGGWWEEEK...', '...KGGGWWEEEK...', '...KGGGWWEEEK...',
    '...KGGGWWEEEK...', '...KGGGWWEEEK...', '....KGGWWEEK....', '....KGGWWEEK....', '.....KGWWEK.....', '......KWWK......', '.......KK.......'],
  ball: ['................', '......HMMD......', '....HHMMMMMD....', '...HHMDMMDMMD...', '...HMDDDMMMMD...', '..HMMMDMMMDDMD..',
    '..HMMMMMMDDDMD..', '..HMDMMMMMDMMD..', '...HDDMMMMMMD...', '...HMDMMMDMMD...', '....DMMMMMMD....', '......DDDD......', '......HMMD......'],
  boot: ['................', '................', '....HMMMD.......', '....HMMMD.......', '....HMWMD.......', '....HMMWD.......',
    '....HMWMMD......', '....HMMMMMD.....', '....HMMMMMMMD...', '...HMMMMMMMMMD..', '...HMMMMMMMMMMD.', '...DDDDDDDDDDDD.', '....K.K.K..K....'],
  star: ['................', '.......HD.......', '.......HD.......', '......HMMD......', '......HMMD......', '.HHHHHHMMMDDDDD.',
    '..HMMMMMMMMMMD..', '...HMMMMMMMMD...', '....HMMMMMMD....', '....HMMMMMMD....', '...HMMMDDMMMD...', '...HMMD..HMMD...', '..HMD..MM...HMD.'],
  medal: ['..RRrr....rrRR..', '...RRrr..rrRR...', '....RRrrrrRR....', '.....RRrrRR.....', '......RrrR......', '.....HHMMMD.....',
    '....HHMMMMMD....', '...HHMMDDMMMD...', '...HMMDMMMMMD...', '...HMMDMMMMMD...', '...HMMMDDMMMD...', '....HMMMMMMD....', '.....DDDDDD.....'],
  glove: ['................', '....HD.HD.......', '...HMDHMDHD.....', '...HMDHMDHMD....', '...HMDHMDHMD.HD.', '...HMMMMMMMDHMD.',
    '...HMMMMMMMMMMD.', '...HMMMMMMMMMD..', '...HMMMMMMMMD...', '....HMMMMMMD....', '....WWWWWWWW....', '....DDDDDDDD....', '................'],
  plaque: ['................', '................', '..bbbbbbbbbbbb..', '..bBBBBBBBBBBb..', '..bBHMMMMMMDBb..', '..bBHMDDDDMDBb..',
    '..bBHMMMMMMDBb..', '..bBHMDDDMMDBb..', '..bBHMMMMMMDBb..', '..bBBBBBBBBBBb..', '..bbbbbbbbbbbb..', '................', '................'],
  statue: ['................', '.......HD.......', '......HMMD......', '......HMMD......', '.......HD.......', '....HMMMMMMD....',
    '....HDHMMDHD....', '....HDHMMDHD....', '......HMMD......', '......HMMD......', '......HDHD......', '......HDHD......', '.....HMDHMD.....'],
  band: ['................', '................', '................', '..KKKKKKKKKKKK..', '..KHMMMMMMMMDK..', '..KHMMWWWWMMDK..',
    '..KHMWMMMMMMDK..', '..KHMWMMMMMMDK..', '..KHMMWWWWMMDK..', '..KHMMMMMMMMDK..', '..KKKKKKKKKKKK..', '................', '................'],
  flag: ['.....K..........', '.....KHMM.......', '.....KHMMMMM....', '.....KHMMMMMMMD.', '.....KHWWWWWWWWD', '.....KHMMMMMMMD.',
    '.....KHMMMMM....', '.....KHMM.......', '.....K..........', '.....K..........', '.....K..........', '.....K..........', '....KKK.........']
};
// Base or easel under each shape (globe already has one)
/** @type {Dict<string>} */
G.tro.FOOT = { cup: 'BASE', ears: 'BASE', tall: 'BASE', ball: 'BASE', boot: 'BASE', star: 'BASE', glove: 'BASE', statue: 'BASE',
  shield: 'EASEL', medal: 'EASEL', plaque: 'EASEL', band: 'EASEL', flag: 'BASE' };

/** @type {Dict<string[]>} */
G.tro.METAL = { gold: ['#f2c230', '#fff2a8', '#b07d12'], silver: ['#c9d3de', '#ffffff', '#7d8b9b'], bronze: ['#d08a4a', '#f4c08e', '#8a4f22'] };
/** @type {Dict<string>} */
G.tro.FIX = { B: '#7a4a22', b: '#4a2a12', K: '#1b1b1b', W: '#ffffff', G: '#2f9e57', E: '#d8323c' };
/** @type {Dict<string[]>} */
G.tro.RIB = { ENG: ['#d8323c', '#ffffff'], ESP: ['#d8323c', '#ffcc4d'], ITA: ['#2f9e57', '#d8323c'], GER: ['#1b1b1b', '#d8323c'], FRA: ['#1f4bb8', '#d8323c'],
  POR: ['#2f9e57', '#d8323c'], NED: ['#ff7a1a', '#ffffff'], BEL: ['#1b1b1b', '#ffcc4d'], TUR: ['#d8323c', '#ffffff'], KSA: ['#2f9e57', '#ffffff'], USA: ['#1f4bb8', '#d8323c'],
  x: ['#1f4bb8', '#ffffff'] };
G.tro.WORLD = ['Mondiale', 'Europeo', 'Copa América', 'Coppa d’Asia', 'Coppa d’Africa'];
G.tro.EU = ['Champions League', 'Europa League', 'Conference League'];

/** @param {string} s @returns {string[]} */
G.tro.rows = function (s) {
  var r = G.tro.SPR[s].slice(), f = G.tro.FOOT[s];
  while (r.length < (f ? 13 : 16)) r.push('................');
  return f ? r.concat(G.tro[/** @type {'BASE'|'EASEL'} */ (f)]) : r;
};

/** @param {string} hex @param {number} to @param {number} k @returns {string} */
G.tro.mix = function (hex, to, k) {
  var h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
  var a = [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }), t = to ? 255 : 0;
  return '#' + a.map(function (v) { return ('0' + Math.round(v + (t - v) * k).toString(16)).slice(-2); }).join('');
};

// Colour of every sprite letter for one trophy definition
/** @param {TroDef} d @returns {Dict<string>} */
G.tro.pal = function (d) {
  var /** @type {Dict<string>} */ P = {}, k;
  for (k in G.tro.FIX) P[k] = G.tro.FIX[k];
  if (d.c) {
    var a = G.tro.mix(d.c[0], 0, 0), lum = parseInt(a.substr(1, 2), 16) + parseInt(a.substr(3, 2), 16) + parseInt(a.substr(5, 2), 16);
    P.M = a; P.H = G.tro.mix(a, 1, 0.4); P.D = G.tro.mix(a, 0, 0.35);
    P.W = G.tro.mix(d.c[1], 0, 0) === a ? (lum > 380 ? '#1b1b1b' : '#ffffff') : G.tro.mix(d.c[1], 0, 0);
  } else { var m = G.tro.METAL[d.m || 'gold']; P.M = m[0]; P.H = m[1]; P.D = m[2]; }
  var r = d.r || G.tro.RIB.x; P.R = r[0]; P.r = r[1];
  return P;
};

// The sprite as inline SVG; sil = not won yet (dark silhouette)
/** @param {TroDef} d @param {number} px @param {number|boolean} [sil] @returns {string} */
G.tro.svg = function (d, px, sil) {
  var rows = G.tro.rows(d.s), P = G.tro.pal(d), out = '', ol = '', filled = /** @param {number} x @param {number} y */ function (x, y) { return y >= 0 && y < 16 && x >= 0 && x < 16 && rows[y][x] !== '.'; };
  rows.forEach(function (row, y) {
    for (var x = 0; x < 16;) {
      var ch = row[x], n = 1;
      while (x + n < 16 && row[x + n] === ch) n++;
      if (ch !== '.') out += '<rect x="' + x + '" y="' + y + '" width="' + n + '" height="1" fill="' + (sil ? '#121826' : P[ch] || P.M) + '"/>';
      x += n;
    }
    for (var i = -1; i <= 16; i++) if (!filled(i, y) && (filled(i - 1, y) || filled(i + 1, y) || filled(i, y - 1) || filled(i, y + 1))) ol += '<rect x="' + i + '" y="' + y + '" width="1" height="1"/>';
  });
  for (var x2 = 0; x2 < 16; x2++) if (filled(x2, 15)) ol += '<rect x="' + x2 + '" y="16" width="1" height="1"/>';
  return '<svg class="px" width="' + px + '" height="' + px + '" viewBox="-1 -1 18 18" shape-rendering="crispEdges" aria-hidden="true">' +
    '<g fill="' + (sil ? '#4a5670' : '#140c06') + '" opacity="' + (sil ? 0.7 : 0.85) + '">' + ol + '</g>' + out + '</svg>';
};

/** @type {Dict<string>} */
G.tro.down = { gold: 'silver', silver: 'bronze', bronze: 'bronze' };

// Shape, metal and ribbon from the trophy or award name (w = 1 for second-division awards)
/** @param {string} name @param {number} [w] @returns {TroDef} */
G.tro.def = function (name, w) {
  var L = G.LEAGUES.filter(function (x) { return x.name === name; })[0], R = G.tro.RIB, /** @type {TroDef} */ d;
  var cupNat = G.DATA.nations.filter(function (n) { return n.cup === name; })[0];
  var /** @type {Dict<TroDef>} */ fixed = { 'Champions League': { s: 'ears', m: 'silver' }, 'Europa League': { s: 'tall', m: 'silver', r: ['#ff7a1a', '#1b1b1b'] },
    'Conference League': { s: 'tall', m: 'silver', r: ['#2ee6a6', '#0d4d36'] }, 'Mondiale': { s: 'globe', m: 'gold' },
    'Europeo': { s: 'cup', m: 'silver', r: ['#1f4bb8', '#ffffff'] }, 'Copa América': { s: 'tall', m: 'gold', r: ['#1f6fd8', '#ffcc4d'] },
    'Coppa d’Asia': { s: 'cup', m: 'gold', r: ['#d8323c', '#ffffff'] }, 'Coppa d’Africa': { s: 'tall', m: 'gold', r: ['#2f9e57', '#ffcc4d'] },
    'Pallone d’Oro': { s: 'ball', m: 'gold' }, 'Pallone d’Argento': { s: 'ball', m: 'silver' }, 'Pallone di Bronzo': { s: 'ball', m: 'bronze' },
    'Scarpa d’Oro': { s: 'boot', m: 'gold' }, 'Allenatore dell’anno': { s: 'statue', m: 'gold' }, 'Dirigente dell’anno': { s: 'statue', m: 'gold' } };
  if (fixed[name]) return fixed[name];
  if (L) return L.key === 'ITA1' ? { s: 'shield' } : { s: 'cup', m: L.tier === 1 ? 'gold' : 'bronze', r: R[L.nat] || R.x };
  if (cupNat) return { s: 'cup', m: 'silver', r: R[cupNat.id] || R.x };
  if (/^Promozione/.test(name)) d = { s: 'cup', m: 'bronze' };
  else if (/^Capocannoniere (Mondiale|Europeo|Copa|Coppa)/.test(name)) d = { s: 'boot', m: 'gold' };
  else if (/^Capocannoniere/.test(name)) d = { s: 'boot', m: 'silver' };
  else if (/^Re degli assist/.test(name)) d = { s: 'medal', m: 'silver', r: ['#1f4bb8', '#ffffff'] };
  else if (/^Guanto/.test(name)) d = { s: 'glove', m: 'gold' };
  else if (/^Player of the Season/.test(name)) d = { s: 'star', m: 'gold' };
  else if (/^Manager del mese/.test(name)) d = { s: 'plaque', m: 'gold' };
  else if (/dell’anno/.test(name)) d = { s: 'statue', m: 'silver' };
  else if (/^Record/.test(name)) d = { s: 'plaque', m: 'silver' };
  else d = { s: 'cup', m: 'silver' };
  if (w === 1) d.m = G.tro.down[G.sure(d.m)];  // every branch above gives a metal
  return d;
};

/** @param {string} name @param {number} [px] @param {number} [w] @returns {string} */
G.tro.icon = function (name, px, w) { return G.tro.svg(G.tro.def(name, w), px || 20); };
