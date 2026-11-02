// @ts-check
// National teams: id:confederation:base strength. Names and flags come from G.DATA nations,
// extra nations, or the list below for teams without a league or player pool in the game.

/** @type {NtDataHost} */ (G.DATA).ntTeams = (
  'FRA:UEFA:87|ESP:UEFA:87|ENG:UEFA:86|POR:UEFA:85|GER:UEFA:84|ITA:UEFA:83|NED:UEFA:83|BEL:UEFA:82|CRO:UEFA:80|' +
  'TUR:UEFA:78|DEN:UEFA:78|SUI:UEFA:78|AUT:UEFA:78|NOR:UEFA:77|UKR:UEFA:76|POL:UEFA:76|SRB:UEFA:76|CZE:UEFA:75|' +
  'SCO:UEFA:74|GRE:UEFA:74|SWE:UEFA:74|HUN:UEFA:73|ROU:UEFA:72|SVK:UEFA:71|SVN:UEFA:71|GEO:UEFA:70|WAL:UEFA:70|' +
  'IRL:UEFA:70|ALB:UEFA:69|BIH:UEFA:69|FIN:UEFA:68|ISL:UEFA:67|ISR:UEFA:67|NIR:UEFA:66|MKD:UEFA:65|MNE:UEFA:65|' +
  'KOS:UEFA:65|BUL:UEFA:64|' +
  'ARG:CONMEBOL:86|BRA:CONMEBOL:85|URU:CONMEBOL:80|COL:CONMEBOL:80|ECU:CONMEBOL:78|PAR:CONMEBOL:75|CHI:CONMEBOL:72|' +
  'PER:CONMEBOL:70|VEN:CONMEBOL:70|BOL:CONMEBOL:64|' +
  'USA:CONCACAF:77|MEX:CONCACAF:77|CAN:CONCACAF:75|PAN:CONCACAF:70|CRC:CONCACAF:68|JAM:CONCACAF:67|HON:CONCACAF:65|' +
  'CUW:CONCACAF:63|HAI:CONCACAF:62|' +
  'MAR:CAF:81|SEN:CAF:79|CIV:CAF:77|NGA:CAF:76|EGY:CAF:75|ALG:CAF:75|CMR:CAF:73|TUN:CAF:72|GHA:CAF:72|MLI:CAF:72|' +
  'COD:CAF:72|RSA:CAF:70|BFA:CAF:70|CPV:CAF:67|GAB:CAF:66|ZAM:CAF:64|' +
  'JPN:AFC:79|KOR:AFC:77|IRN:AFC:75|AUS:AFC:74|KSA:AFC:70|UZB:AFC:70|QAT:AFC:69|IRQ:AFC:68|JOR:AFC:68|UAE:AFC:67|' +
  'OMA:AFC:65|CHN:AFC:63|BHR:AFC:63|SYR:AFC:62|PLE:AFC:61|THA:AFC:61|' +
  'NZL:OFC:66|NCL:OFC:55'
);

/** @type {NtDataHost} */ (G.DATA).ntNames = (
  'SWE:Svezia:🇸🇪|HUN:Ungheria:🇭🇺|ROU:Romania:🇷🇴|SVK:Slovacchia:🇸🇰|SVN:Slovenia:🇸🇮|GEO:Georgia:🇬🇪|WAL:Galles:🏴󠁧󠁢󠁷󠁬󠁳󠁿|' +
  'IRL:Irlanda:🇮🇪|ALB:Albania:🇦🇱|BIH:Bosnia:🇧🇦|FIN:Finlandia:🇫🇮|ISL:Islanda:🇮🇸|ISR:Israele:🇮🇱|NIR:Irlanda del Nord:🇬🇧|' +
  'MKD:Macedonia del Nord:🇲🇰|MNE:Montenegro:🇲🇪|KOS:Kosovo:🇽🇰|BUL:Bulgaria:🇧🇬|ECU:Ecuador:🇪🇨|PAR:Paraguay:🇵🇾|' +
  'CHI:Cile:🇨🇱|PER:Perù:🇵🇪|VEN:Venezuela:🇻🇪|BOL:Bolivia:🇧🇴|MEX:Messico:🇲🇽|CAN:Canada:🇨🇦|PAN:Panama:🇵🇦|' +
  'CRC:Costa Rica:🇨🇷|JAM:Giamaica:🇯🇲|HON:Honduras:🇭🇳|CUW:Curaçao:🇨🇼|HAI:Haiti:🇭🇹|CIV:Costa d’Avorio:🇨🇮|' +
  'EGY:Egitto:🇪🇬|ALG:Algeria:🇩🇿|CMR:Camerun:🇨🇲|TUN:Tunisia:🇹🇳|GHA:Ghana:🇬🇭|MLI:Mali:🇲🇱|COD:RD Congo:🇨🇩|' +
  'RSA:Sudafrica:🇿🇦|BFA:Burkina Faso:🇧🇫|CPV:Capo Verde:🇨🇻|GAB:Gabon:🇬🇦|ZAM:Zambia:🇿🇲|KOR:Corea del Sud:🇰🇷|' +
  'IRN:Iran:🇮🇷|AUS:Australia:🇦🇺|UZB:Uzbekistan:🇺🇿|QAT:Qatar:🇶🇦|IRQ:Iraq:🇮🇶|JOR:Giordania:🇯🇴|UAE:Emirati Arabi:🇦🇪|' +
  'OMA:Oman:🇴🇲|CHN:Cina:🇨🇳|BHR:Bahrein:🇧🇭|SYR:Siria:🇸🇾|PLE:Palestina:🇵🇸|THA:Thailandia:🇹🇭|NZL:Nuova Zelanda:🇳🇿|' +
  'NCL:Nuova Caledonia:🇳🇨'
);

/** @type {Dict<NtTeam>} */ G.NT = {};
/** @type {NtDataHost} */ (G.DATA).ntNames.split('|').forEach(function (s) { var x = s.split(':'); G.NT[x[0]] = /** @type {NtTeam} */ ({ id: x[0], name: x[1], flag: x[2] }); });  // conf and base just below
/** @type {NtDataHost} */ (G.DATA).ntTeams.split('|').forEach(function (s) {
  var x = s.split(':'), info = G.NT[x[0]] || G.nationInfo(x[0]);
  G.NT[x[0]] = { id: x[0], name: info.name, flag: info.flag, conf: x[1], base: +x[2] };
});
G.NT_IDS = Object.keys(G.NT);
