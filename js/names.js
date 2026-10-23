// @ts-check
// Static world data: nations, leagues, clubs, derbies, name pools.
// Club format: "Name:strength:color1:color2[:crestStyle]"
// crestStyle: s shield, c circle, v stripes, h halves, x hoops, d sash, q quarters, o oval

/** @type {GameData} */
G.DATA = {
  nations: [
    { id: 'ENG', name: 'Inghilterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', cup: 'FA Cup', eu: 1, leagues: [
      { n: 'Premier League', c: 'Liverpool:87:c11:fff:s;Arsenal:87:e11:fff:c;Manchester City:86:6be:fff:c;Chelsea:84:03a:fff:c;Manchester United:80:d11:000:s;Newcastle United:80:000:fff:v;Tottenham Hotspur:80:fff:135:o;Aston Villa:80:713:9cf:s;Nottingham Forest:77:d22:fff:o;Brighton:77:05b:fff:c;Crystal Palace:77:14a:d22:v;Bournemouth:76:d22:000:v;Brentford:75:e22:fff:c;Fulham:75:fff:000:s;Everton:75:13a:fff:s;West Ham United:75:713:9cf:s;Wolverhampton:74:fa0:000:o;Leeds United:72:fff:13a:c;Sunderland:72:e22:fff:v;Burnley:71:713:9cf:s' },
      { n: 'Championship', c: 'Leicester City:69:03a:fff:c;Southampton:69:e22:fff:v;Ipswich Town:68:03a:fff:s;Middlesbrough:67:d22:fff:s;Birmingham City:65:03a:fff:c;Sheffield United:66:e22:000:v;West Bromwich Albion:66:125:fff:v;Coventry City:66:6be:fff:s;Norwich City:65:fd0:0a3:s;Wrexham:64:d22:fff:s;Hull City:64:f90:000:v;Watford:64:fd0:d22:s;Bristol City:64:d22:fff:c;Stoke City:63:d22:fff:v;Millwall:63:125:fff:s;Swansea City:63:fff:000:s;Blackburn Rovers:63:25a:fff:h;Derby County:63:fff:000:s;Queens Park Rangers:62:25a:fff:x;Preston North End:62:fff:125:s;Portsmouth:62:03a:fd0:s;Charlton Athletic:61:d22:fff:s;Oxford United:60:fd0:125:o;Sheffield Wednesday:59:03a:fff:v' }] },
    { id: 'ESP', name: 'Spagna', flag: '🇪🇸', cup: 'Copa del Rey', eu: 1, leagues: [
      { n: 'LaLiga', c: 'Real Madrid:88:fff:b92:c;Barcelona:87:a05:03a:q;Atlético Madrid:83:c22:fff:v;Athletic Club:79:e22:fff:v;Villarreal:79:fd0:035:s;Real Betis:77:0a5:fff:v;Real Sociedad:76:03a:fff:c;Celta Vigo:74:8cf:fff:s;Sevilla:74:fff:d22:s;Valencia:73:fff:f80:s;Osasuna:73:d22:125:s;Girona:73:d22:fff:v;Rayo Vallecano:72:fff:d22:d;Espanyol:72:03a:fff:v;Mallorca:72:d22:000:s;Getafe:72:03a:fff:s;Alavés:70:03a:fff:v;Elche:69:fff:080:x;Levante:69:a05:03a:v;Real Oviedo:68:03a:fff:s' },
      { n: 'Segunda División', c: 'Real Valladolid:64:70c:fff:v;Las Palmas:64:fd0:03a:c;Leganés:64:03a:fff:v;Almería:63:d22:fff:v;Deportivo La Coruña:63:03a:fff:v;Granada:62:d22:fff:x;Málaga:62:4ad:fff:v;Sporting Gijón:62:d22:fff:v;Real Zaragoza:61:fff:03a:s;Cádiz:61:fd0:03a:s;Racing Santander:61:080:fff:s;Eibar:61:a05:03a:v;Huesca:60:03a:a05:v;Burgos:60:fff:000:s;Albacete:59:fff:d22:s;Córdoba:59:080:fff:v;Castellón:59:000:fff:v;Andorra:59:03a:fd0:s;Mirandés:58:d22:000:s;Cultural Leonesa:57:fff:d22:s;Ceuta:56:fff:000:s;Real Sociedad B:56:03a:fff:c' }] },
    { id: 'ITA', name: 'Italia', flag: '🇮🇹', cup: 'Coppa Italia', eu: 1, leagues: [
      { n: 'Serie A', c: 'Inter:85:03a:000:c;Napoli:85:1ad:fff:c;Milan:82:d00:000:v;Juventus:82:fff:000:v;Atalanta:80:05a:000:v;Roma:80:a12:fb0:s;Como:78:03a:fff:s;Lazio:78:8cf:fff:s;Bologna:78:a12:03a:h;Fiorentina:76:639:fff:o;Torino:73:713:fff:s;Udinese:72:fff:000:v;Genoa:71:a12:03a:h;Parma:71:fd0:03a:s;Sassuolo:71:080:000:v;Cagliari:70:a12:03a:h;Hellas Verona:69:fd0:03a:s;Lecce:69:fd0:d22:v;Cremonese:68:d22:999:v;Pisa:68:03a:000:v' },
      { n: 'Serie B', c: 'Palermo:66:f9c:000:s;Monza:66:d22:fff:c;Venezia:66:000:f60:s;Empoli:64:03a:fff:s;Sampdoria:63:03a:fff:x;Spezia:63:fff:000:s;Frosinone:62:fd0:03a:s;Bari:62:fff:d22:s;Modena:62:fd0:03a:s;Catanzaro:61:fd0:d22:s;Cesena:61:fff:000:s;Padova:60:fff:d22:s;Mantova:59:d22:fff:d;Juve Stabia:59:fd0:03a:s;Reggiana:59:713:fff:s;Südtirol:59:fff:d22:s;Carrarese:58:fd0:03a:s;Avellino:58:080:fff:s;Pescara:58:4ad:fff:v;Virtus Entella:57:4ad:fff:s' }] },
    { id: 'GER', name: 'Germania', flag: '🇩🇪', cup: 'DFB-Pokal', eu: 1, leagues: [
      { n: 'Bundesliga', c: 'Bayern München:88:d00:fff:c;Bayer Leverkusen:82:e22:000:c;Borussia Dortmund:82:fd0:000:c;RB Leipzig:80:fff:d22:o;Eintracht Frankfurt:78:000:e22:c;VfB Stuttgart:78:fff:e22:s;SC Freiburg:76:d22:000:s;TSG Hoffenheim:75:03a:fff:s;VfL Wolfsburg:75:4a0:fff:c;Borussia Mönchengladbach:74:fff:000:o;Werder Bremen:73:080:fff:d;1. FSV Mainz 05:73:d22:fff:c;FC Augsburg:72:d22:080:s;1. FC Union Berlin:72:d22:fd0:c;1. FC Köln:71:fff:d22:s;Hamburger SV:71:fff:03a:q;FC St. Pauli:70:630:fff:s;1. FC Heidenheim:69:d22:03a:s' },
      { n: '2. Bundesliga', c: 'Schalke 04:65:03a:fff:c;Hertha BSC:65:03a:fff:s;VfL Bochum:65:03a:fff:s;Holstein Kiel:64:03a:d22:s;Fortuna Düsseldorf:63:d22:fff:s;Hannover 96:63:d22:000:c;1. FC Kaiserslautern:63:d22:fff:s;1. FC Nürnberg:62:a12:000:c;Karlsruher SC:62:03a:fff:s;SC Paderborn:62:03a:000:s;SV Darmstadt 98:62:03a:fff:s;SV Elversberg:61:000:fff:s;Greuther Fürth:60:080:fff:s;1. FC Magdeburg:60:03a:fff:s;Arminia Bielefeld:60:000:fff:s;Eintracht Braunschweig:59:fd0:03a:s;Preußen Münster:59:080:000:s;Dynamo Dresden:59:fd0:000:s' }] },
    { id: 'FRA', name: 'Francia', flag: '🇫🇷', cup: 'Coupe de France', eu: 1, leagues: [
      { n: 'Ligue 1', c: 'Paris Saint-Germain:87:03a:d22:c;Marseille:79:8cf:fff:s;Monaco:79:d22:fff:d;Lille:77:d22:03a:c;Lyon:77:fff:03a:c;Nice:75:d22:000:v;Lens:75:fd0:d22:s;Strasbourg:75:03a:fff:s;Rennes:74:d22:000:h;Toulouse:72:70c:fff:s;Brest:72:d22:fff:s;Nantes:70:fd0:080:s;Paris FC:70:03a:fff:s;Auxerre:69:fff:03a:s;Angers:68:000:fff:v;Le Havre:68:4ad:03a:h;Lorient:68:f80:000:s;Metz:67:a12:fff:s' },
      { n: 'Ligue 2', c: 'Saint-Étienne:66:080:fff:s;Reims:65:d22:fff:h;Montpellier:64:03a:f80:s;Troyes:61:03a:fff:s;Guingamp:60:d22:000:s;Clermont:60:d22:03a:s;Dunkerque:60:03a:fff:s;Pau:59:fd0:03a:s;Amiens:59:fff:000:s;Annecy:59:d22:fff:s;Bastia:59:03a:fff:s;Le Mans:59:d22:fd0:s;Grenoble:58:03a:fff:s;Laval:58:f80:000:s;Nancy:58:d22:fff:s;Red Star:58:080:fff:c;Rodez:58:d22:fd0:s;Boulogne:57:d22:000:s' }] },
    { id: 'POR', name: 'Portogallo', flag: '🇵🇹', cup: 'Taça de Portugal', eu: 1, leagues: [
      { n: 'Liga Portugal', c: 'Sporting CP:81:080:fff:x;Benfica:81:d22:fff:c;Porto:81:03a:fff:s;Braga:76:d22:fff:s;Vitória Guimarães:71:fff:000:s;Famalicão:70:03a:fff:s;Gil Vicente:69:d22:03a:s;Santa Clara:68:d22:fff:s;Moreirense:67:080:fff:s;Rio Ave:67:080:fff:v;Estoril:67:fd0:03a:v;Casa Pia:66:000:fff:s;Arouca:66:fd0:03a:s;Alverca:65:d22:fff:s;Nacional:65:000:fff:v;Estrela Amadora:65:d22:080:s;Tondela:63:fd0:080:s;AVS:63:d22:fff:s' }] },
    { id: 'NED', name: 'Olanda', flag: '🇳🇱', cup: 'KNVB Beker', eu: 1, leagues: [
      { n: 'Eredivisie', c: 'PSV:79:d22:fff:v;Feyenoord:78:fff:d22:h;Ajax:78:fff:d22:c;AZ:75:d22:fff:s;Twente:73:d22:fff:s;Utrecht:71:d22:fff:s;NEC:69:d22:080:s;Go Ahead Eagles:68:d22:fd0:s;Heerenveen:67:03a:fff:s;Groningen:67:080:fff:s;Sparta Rotterdam:66:d22:fff:v;Fortuna Sittard:65:fd0:080:s;PEC Zwolle:65:03a:fff:s;Heracles:64:000:fff:v;NAC Breda:64:fd0:000:s;Excelsior:63:d22:000:s;Telstar:62:fff:4ad:s;Volendam:62:f80:fff:s' }] },
    { id: 'BEL', name: 'Belgio', flag: '🇧🇪', cup: 'Coppa del Belgio', eu: 1, leagues: [
      { n: 'Pro League', c: 'Club Brugge:76:03a:000:v;Union SG:75:fd0:03a:s;Anderlecht:74:639:fff:s;Genk:73:03a:fff:s;Gent:72:03a:fff:s;Standard Liège:70:d22:fff:s;Antwerp:70:d22:fff:s;Mechelen:68:d22:fd0:v;Charleroi:68:000:fff:v;Westerlo:67:fd0:03a:s;Sint-Truiden:67:fd0:03a:s;OH Leuven:66:d22:fff:s;Cercle Brugge:66:080:000:v;Zulte Waregem:64:d22:fff:s;Dender:63:000:fff:s;La Louvière:62:080:fff:s' }] },
    { id: 'TUR', name: 'Turchia', flag: '🇹🇷', cup: 'Türkiye Kupası', eu: 1, leagues: [
      { n: 'Süper Lig', c: 'Galatasaray:80:a12:fb0:h;Fenerbahçe:80:fd0:03a:v;Beşiktaş:76:000:fff:v;Trabzonspor:75:713:4ad:s;Başakşehir:72:f80:03a:s;Samsunspor:71:d22:fff:s;Göztepe:70:fd0:d22:s;Eyüpspor:67:70c:fd0:s;Kasımpaşa:67:03a:fff:s;Antalyaspor:67:d22:fff:s;Alanyaspor:67:f80:080:s;Konyaspor:67:080:fff:s;Gaziantep:66:d22:000:s;Rizespor:66:080:03a:s;Kayserispor:65:fd0:d22:s;Kocaelispor:65:080:000:v;Gençlerbirliği:64:d22:000:s;Fatih Karagümrük:64:d22:000:s' }] },
    { id: 'SCO', name: 'Scozia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', cup: 'Scottish Cup', eu: 1, leagues: [
      { n: 'Scottish Premiership', c: 'Celtic:75:080:fff:x;Rangers:74:03a:fff:c;Hearts:69:713:fff:s;Hibernian:67:080:fff:s;Aberdeen:66:d22:fff:s;Motherwell:64:fb0:713:s;Dundee United:63:f80:000:s;St Mirren:63:000:fff:v;Dundee:62:03a:fff:s;Kilmarnock:62:03a:fff:s;Falkirk:62:03a:fff:s;Livingston:60:fd0:000:s' }] },
    { id: 'CZE', name: 'Cechia', flag: '🇨🇿', cup: 'Coppa Ceca', eu: 1, leagues: [
      { n: 'Chance Liga', c: 'Slavia Praha:73:d22:fff:h;Sparta Praha:72:a12:fd0:s;Viktoria Plzeň:70:d22:03a:v;Baník Ostrava:65:03a:fff:s;Sigma Olomouc:64:03a:fff:s;Slovan Liberec:64:4ad:fff:s;Mladá Boleslav:63:4ad:fff:s;Hradec Králové:63:000:fff:s;Jablonec:63:080:000:s;Teplice:61:fd0:03a:s;Bohemians 1905:61:080:fff:v;Slovácko:61:d22:fff:s;Karviná:61:080:000:s;Pardubice:60:d22:fff:s;Zlín:60:fd0:000:s;Dukla Praha:59:fd0:d22:s' }] },
    { id: 'GRE', name: 'Grecia', flag: '🇬🇷', cup: 'Coppa di Grecia', eu: 1, leagues: [
      { n: 'Super League', c: 'Olympiacos:74:d22:fff:v;PAOK:72:000:fff:v;AEK Athens:71:fd0:000:c;Panathinaikos:71:080:fff:s;Aris:65:fd0:000:s;OFI:62:000:fff:s;Asteras Tripolis:61:fd0:03a:s;Atromitos:61:4ad:fff:s;Volos:60:d22:fff:s;Panetolikos:60:fd0:03a:s;Levadiakos:60:080:fff:s;Panserraikos:58:d22:fff:s;Kifisia:58:fff:03a:s;AEL Larissa:58:a12:fff:s' }] },
    { id: 'AUT', name: 'Austria', flag: '🇦🇹', cup: 'ÖFB-Cup', eu: 1, leagues: [
      { n: 'Bundesliga austriaca', c: 'RB Salzburg:73:fff:d22:o;Sturm Graz:71:000:fff:s;Rapid Wien:68:080:fff:s;Austria Wien:67:70c:fff:s;LASK:66:000:fff:v;Wolfsberger AC:64:000:f80:s;TSV Hartberg:62:4ad:fff:s;SV Ried:61:000:080:s;Blau-Weiß Linz:61:03a:fff:s;WSG Tirol:61:080:fff:s;Altach:61:fd0:000:s;Grazer AK:60:d22:fff:s' }] },
    { id: 'DEN', name: 'Danimarca', flag: '🇩🇰', cup: 'Coppa di Danimarca', eu: 1, leagues: [
      { n: 'Superliga', c: 'Copenhagen:71:fff:03a:s;Midtjylland:71:000:d22:s;Brøndby:68:fd0:03a:s;Nordsjælland:67:d22:fd0:s;AGF:67:fff:000:s;Randers:63:03a:fff:s;Silkeborg:63:d22:fff:s;Viborg:63:080:fff:s;OB:62:03a:fff:s;Vejle:61:d22:fff:s;Sønderjyske:61:4ad:fff:s;Fredericia:59:d22:fff:s' }] },
    { id: 'SUI', name: 'Svizzera', flag: '🇨🇭', cup: 'Coppa Svizzera', eu: 1, leagues: [
      { n: 'Super League svizzera', c: 'Young Boys:70:fd0:000:c;Basel:69:d22:03a:h;Lugano:67:000:fff:s;Servette:67:a12:fff:s;Lausanne:65:03a:fff:s;Luzern:65:03a:fff:s;St. Gallen:64:080:fff:s;Zürich:64:03a:fff:s;Sion:63:d22:fff:s;Thun:62:d22:fff:s;Grasshoppers:62:03a:fff:h;Winterthur:61:d22:fff:s' }] },
    { id: 'NOR', name: 'Norvegia', flag: '🇳🇴', cup: 'Coppa di Norvegia', eu: 1, leagues: [
      { n: 'Eliteserien', c: 'Bodø/Glimt:73:fd0:000:s;Brann:67:d22:fff:s;Molde:67:03a:fff:s;Rosenborg:66:000:fff:s;Viking:65:03a:fff:s;Tromsø:63:d22:fff:s;Fredrikstad:63:d22:fff:s;Vålerenga:63:03a:d22:s;Sarpsborg 08:62:03a:fff:s;Sandefjord:61:03a:fff:s;Strømsgodset:61:4ad:fff:s;Haugesund:60:000:fff:s;HamKam:60:080:fff:s;KFUM Oslo:60:d22:fff:s;Kristiansund:60:03a:fff:s;Bryne:59:d22:fff:s' }] },
    { id: 'POL', name: 'Polonia', flag: '🇵🇱', cup: 'Puchar Polski', eu: 1, leagues: [
      { n: 'Ekstraklasa', c: 'Lech Poznań:68:03a:fff:s;Legia Warszawa:68:080:d22:s;Raków Częstochowa:68:d22:03a:h;Jagiellonia:66:fd0:d22:s;Pogoń Szczecin:65:03a:a12:v;Górnik Zabrze:64:d22:fff:s;Widzew Łódź:64:d22:fff:s;Cracovia:63:d22:fff:v;Zagłębie Lubin:62:f80:080:s;Radomiak:62:080:fff:s;Korona Kielce:62:fd0:d22:s;Piast Gliwice:62:03a:d22:h;Lechia Gdańsk:61:080:fff:s;Motor Lublin:61:fd0:03a:s;GKS Katowice:61:fd0:080:s;Wisła Płock:61:03a:fff:s;Arka Gdynia:60:fd0:03a:s;Termalica:60:f80:000:s' }] },
    { id: 'CRO', name: 'Croazia', flag: '🇭🇷', cup: 'Coppa di Croazia', eu: 1, leagues: [
      { n: 'HNL', c: 'Dinamo Zagreb:71:03a:fff:c;Hajduk Split:68:fff:03a:s;HNK Rijeka:67:fff:4ad:s;Osijek:64:03a:fff:s;Lokomotiva:61:03a:fff:s;Varaždin:61:03a:fff:s;Slaven Belupo:60:fd0:03a:s;Gorica:60:000:fff:s;Istra 1961:60:fd0:080:s;Vukovar 1991:58:d22:fff:s' }] },
    { id: 'SRB', name: 'Serbia', flag: '🇷🇸', cup: 'Coppa di Serbia', eu: 1, leagues: [
      { n: 'SuperLiga', c: 'Red Star Belgrade:72:d22:fff:v;Partizan:68:000:fff:v;Vojvodina:64:d22:fff:v;TSC Bačka Topola:63:fd0:03a:s;Čukarički:62:000:fd0:s;Radnički Niš:61:03a:fff:s;Novi Pazar:61:d22:fff:s;OFK Beograd:60:03a:fff:s;Spartak Subotica:59:03a:fff:s;Napredak:59:d22:fff:s;Mladost Lučani:59:d22:fff:s;IMT:59:03a:fff:s;Radnik Surdulica:58:d22:000:s;Železničar Pančevo:58:03a:fff:s;Javor:58:d22:fff:s;Radnički 1923:58:d22:fff:s' }] },
    { id: 'UKR', name: 'Ucraina', flag: '🇺🇦', cup: "Coppa d'Ucraina", eu: 1, leagues: [
      { n: 'Premier Liha', c: 'Shakhtar Donetsk:72:f80:000:c;Dynamo Kyiv:71:fff:03a:s;Polissya Zhytomyr:66:fd0:080:s;Kryvbas:64:d22:fff:s;Oleksandriya:63:fd0:080:s;LNZ Cherkasy:63:fd0:03a:s;Zorya Luhansk:62:000:fff:s;Karpaty Lviv:62:080:fff:s;Metalist 1925:61:fd0:03a:s;Kolos Kovalivka:61:fd0:03a:s;Rukh Lviv:61:fd0:000:s;Obolon:60:03a:fff:s;Veres Rivne:60:080:fff:s;Epitsentr:59:d22:fff:s;Kudrivka:59:fd0:080:s;Poltava:58:d22:fff:s' }] },
    { id: 'KSA', name: 'Arabia Saudita', flag: '🇸🇦', cup: "King's Cup", eu: 0, leagues: [
      { n: 'Saudi Pro League', c: 'Al-Hilal:79:03a:fff:c;Al-Nassr:79:fd0:03a:c;Al-Ittihad:78:fd0:000:v;Al-Ahli:78:080:fff:s;Al-Qadsiah:74:d22:fd0:s;Al-Ettifaq:71:080:d22:s;Al-Shabab:71:fff:000:s;Al-Taawoun:70:fd0:03a:s;NEOM:66:000:fd0:s;Al-Fateh:66:080:fff:s;Al-Khaleej:66:fd0:080:s;Al-Kholood:65:d22:fff:s;Al-Feiha:65:f80:03a:s;Damac:65:d22:fd0:s;Al-Riyadh:64:d22:000:s;Al-Okhdood:63:080:fd0:s;Al-Hazem:63:d22:000:s;Al-Najma:62:03a:fff:s' }] },
    { id: 'USA', name: 'Stati Uniti', flag: '🇺🇸', cup: 'US Open Cup', eu: 0, leagues: [
      { n: 'MLS', c: 'Inter Miami:72:f9c:000:c;LAFC:72:000:fb0:s;Columbus Crew:70:fd0:000:c;FC Cincinnati:70:f80:03a:s;Philadelphia Union:70:03a:fb0:c;Seattle Sounders:70:080:4ad:s;Vancouver Whitecaps:70:fff:03a:s;San Diego FC:68:03a:4ad:s;Orlando City:68:70c:fff:s;LA Galaxy:68:fff:03a:d;Minnesota United:68:999:4ad:s;Nashville SC:68:fd0:03a:s;New York City FC:67:6be:fff:c;Charlotte FC:67:4ad:000:c;New York Red Bulls:67:d22:fff:o;Atlanta United:66:d22:000:c;Real Salt Lake:66:a12:03a:s;Portland Timbers:66:080:fd0:s;Austin FC:65:080:000:s;Houston Dynamo:65:f80:000:s;Chicago Fire:65:d22:03a:s;Colorado Rapids:64:a12:4ad:s;FC Dallas:64:d22:03a:s;New England Revolution:64:03a:d22:s;San Jose Earthquakes:64:03a:000:s;Sporting Kansas City:64:4ad:03a:s;St. Louis City:63:d22:03a:s;D.C. United:63:000:d22:s;Toronto FC:63:d22:999:s;CF Montréal:63:000:03a:s' }] }
  ],
  derbies: 'Liverpool|Everton;Manchester United|Manchester City;Arsenal|Tottenham Hotspur;Newcastle United|Sunderland;Aston Villa|Birmingham City;West Ham United|Millwall;Crystal Palace|Brighton;Leeds United|Manchester United;Chelsea|Arsenal;' +
    'Real Madrid|Barcelona;Real Madrid|Atlético Madrid;Barcelona|Espanyol;Sevilla|Real Betis;Athletic Club|Real Sociedad;Valencia|Levante;Celta Vigo|Deportivo La Coruña;' +
    'Inter|Milan;Juventus|Torino;Roma|Lazio;Genoa|Sampdoria;Inter|Juventus;Napoli|Roma;Fiorentina|Juventus;' +
    'Bayern München|Borussia Dortmund;Borussia Dortmund|Schalke 04;Hamburger SV|Werder Bremen;1. FC Köln|Borussia Mönchengladbach;Hamburger SV|FC St. Pauli;' +
    'Paris Saint-Germain|Marseille;Lyon|Saint-Étienne;Lens|Lille;Benfica|Sporting CP;Porto|Benfica;Ajax|Feyenoord;Ajax|PSV;Club Brugge|Anderlecht;Club Brugge|Cercle Brugge;Anderlecht|Standard Liège;' +
    'Galatasaray|Fenerbahçe;Beşiktaş|Galatasaray;Celtic|Rangers;Olympiacos|Panathinaikos;Olympiacos|AEK Athens;PAOK|Aris;Slavia Praha|Sparta Praha;Rapid Wien|Austria Wien;Copenhagen|Brøndby;Basel|Zürich;Young Boys|Basel;Legia Warszawa|Lech Poznań;Dinamo Zagreb|Hajduk Split;Red Star Belgrade|Partizan;Shakhtar Donetsk|Dynamo Kyiv;Rosenborg|Molde;Hearts|Hibernian;Dundee|Dundee United;Al-Hilal|Al-Nassr;Al-Ittihad|Al-Ahli;LA Galaxy|LAFC;New York City FC|New York Red Bulls;Seattle Sounders|Portland Timbers;Inter Miami|Orlando City',
  // Name pools for generated players and coaches, by nationality
  // w = how often foreign players come from there (missing = 1)
  extraNations: [{ id: 'BRA', name: 'Brasile', flag: '🇧🇷', w: 2 }, { id: 'ARG', name: 'Argentina', flag: '🇦🇷', w: 2 }, { id: 'SEN', name: 'Senegal', flag: '🇸🇳' },
    { id: 'NGA', name: 'Nigeria', flag: '🇳🇬' }, { id: 'CRO', name: 'Croazia', flag: '🇭🇷' }, { id: 'JPN', name: 'Giappone', flag: '🇯🇵' },
    { id: 'URU', name: 'Uruguay', flag: '🇺🇾' }, { id: 'COL', name: 'Colombia', flag: '🇨🇴' }, { id: 'MAR', name: 'Marocco', flag: '🇲🇦' },
    { id: 'ECU', name: 'Ecuador', flag: '🇪🇨', w: 0.8 }, { id: 'PAR', name: 'Paraguay', flag: '🇵🇾', w: 0.6 }, { id: 'CHI', name: 'Cile', flag: '🇨🇱', w: 0.5 },
    { id: 'PER', name: 'Perù', flag: '🇵🇪', w: 0.4 }, { id: 'VEN', name: 'Venezuela', flag: '🇻🇪', w: 0.4 }, { id: 'BOL', name: 'Bolivia', flag: '🇧🇴', w: 0.3 }],
  names: {
    ENG: ['Jack Harry Oliver George James Charlie Alfie Mason Callum Kieran Reece Jordan Luke Ben Tom', 'Smith Walker Hughes Clarke Wright Taylor Phillips Cole Barnes Mitchell Turner Evans Green Baker Lewis Hill Hall Ward'],
    ESP: ['Pablo Sergio Álvaro Javier Pedro Marcos Iker Raúl Dani Hugo Adrián Mikel Unai Gonzalo Nico', 'García Martínez López Sánchez Pérez Gómez Ruiz Navarro Torres Moreno Romero Alonso Ortega Merino Herrera'],
    ITA: ['Marco Luca Alessandro Matteo Lorenzo Federico Davide Andrea Simone Riccardo Nicolò Giacomo Tommaso Daniele', 'Rossi Russo Ferrari Esposito Bianchi Romano Colombo Ricci Marino Greco Bruno Gallo Conti Costa Mancini Fontana'],
    GER: ['Lukas Leon Jonas Felix Niklas Maximilian Tim Jan Kai Florian Julian Paul Moritz', 'Müller Schmidt Schneider Fischer Weber Wagner Becker Hoffmann Schulz Koch Richter Wolf Krause Lehmann'],
    FRA: ['Lucas Hugo Théo Louis Antoine Mathis Enzo Rayan Adrien Jules Bastien Nathan Benjamin', 'Martin Bernard Dubois Thomas Robert Petit Durand Leroy Moreau Laurent Lefebvre Girard Fontaine Roux'],
    POR: ['João Diogo Tiago Rúben Bruno Gonçalo Rafael Pedro Nuno André Miguel Francisco', 'Silva Santos Ferreira Pereira Costa Oliveira Rodrigues Martins Sousa Fernandes Gonçalves Neves'],
    NED: ['Daan Sem Luuk Milan Thijs Jesse Bram Stijn Ruben Lars Tom Jurre', 'de Jong Jansen Bakker Visser Smit Meijer de Vries Mulder Bosman van Leeuwen de Boer Dekker'],
    BEL: ['Arthur Noah Louis Jules Victor Lucas Mathis Arne Youri Axel Lander', 'Peeters Janssens Maes Jacobs Mertens Willems Claes Goossens Wouters De Smet Hermans Lambert'],
    TUR: ['Arda Kerem Emre Hakan Burak Mert Can Yusuf Ömer Onur Serkan Kenan', 'Yılmaz Kaya Demir Şahin Çelik Aydın Öztürk Arslan Doğan Kılıç Yıldız Koç'],
    SCO: ['Callum Lewis Ross Scott Ryan Kyle Andrew Craig Jamie Euan Fraser', 'Robertson Thomson Murray Ferguson Christie Henderson Paterson Watson Reid Campbell Stewart'],
    KSA: ['Salem Fahad Abdullah Saud Nawaf Firas Mohammed Hassan Saleh Yasser Ali', 'Al-Harbi Al-Otaibi Al-Qahtani Al-Ghamdi Al-Zahrani Al-Mutairi Al-Malki Al-Amri Al-Shammari'],
    USA: ['Tyler Christian Ethan Noah Brandon Kevin Josh Matt Zack Jordan Ryan', 'Johnson Miller Davis Wilson Anderson Moore Jackson White Harris Clark Morris Robinson'],
    CZE: ['Tomáš Jakub Lukáš Adam Ondřej Patrik Martin Matěj David', 'Novák Svoboda Novotný Dvořák Černý Procházka Kučera Veselý Horák Němec'],
    GRE: ['Giorgos Konstantinos Dimitris Kostas Christos Vangelis Nikos Tasos Fotis', 'Papadopoulos Pappas Nikolaidis Georgiou Oikonomou Vlachos Makris Antoniou Karagiannis'],
    AUT: ['David Marcel Lukas Christoph Stefan Florian Patrick Nicolas Tobias', 'Gruber Huber Bauer Wagner Pichler Steiner Moser Mayer Hofer Leitner'],
    DEN: ['Rasmus Christian Mads Frederik Andreas Mikkel Jonas Victor Morten', 'Jensen Nielsen Hansen Pedersen Larsen Sørensen Rasmussen Jørgensen Kristensen Andersen'],
    SUI: ['Luca Manuel Noah Simon Joel Nico Fabian Dan Remo', 'Müller Meier Schmid Keller Weber Huber Brunner Baumann Frei Gerber'],
    NOR: ['Martin Alexander Sander Kristoffer Fredrik Leo Oscar Jørgen Henrik', 'Hansen Johansen Olsen Larsen Andersen Pedersen Nilsen Berg Haugen Strand'],
    POL: ['Piotr Jakub Kacper Michał Sebastian Tomasz Bartosz Jan Paweł', 'Nowak Kowalski Wiśniewski Wójcik Kowalczyk Kamiński Woźniak Mazur Kaczmarek'],
    SRB: ['Dušan Aleksandar Marko Nemanja Stefan Filip Luka Saša Lazar', 'Jovanović Petrović Nikolić Marković Đorđević Stojanović Ilić Pavlović Popović'],
    UKR: ['Oleksandr Artem Ruslan Illia Dmytro Viktor Andriy Vitaliy Maksym', 'Melnyk Shevchuk Boyko Kovalenko Bondarenko Tkachenko Kravchenko Oliynyk Lysenko'],
    BRA: ['Gabriel Lucas Felipe Rafael Bruno Matheus Gustavo Leonardo Eduardo Thiago Caio', 'Silva Santos Oliveira Souza Lima Pereira Costa Ribeiro Carvalho Almeida Barbosa'],
    ARG: ['Matías Julián Santiago Agustín Nicolás Tomás Joaquín Thiago Facundo Franco', 'González Fernández Rodríguez Martínez Álvarez Pérez Romero Sosa Díaz Benítez'],
    SEN: ['Moussa Ibrahima Mamadou Cheikh Pape Ousmane Abdou Babacar Omar', 'Sarr Gueye Diallo Ndiaye Diop Faye Fall Mbaye Camara Sy'],
    NGA: ['Chinedu Emeka Samuel Tunde Ifeanyi Uche Femi Segun Ibrahim', 'Okafor Adeyemi Okonkwo Eze Bello Nwosu Balogun Afolabi Ogunleye'],
    CRO: ['Luka Mateo Ivan Marko Andrej Filip Lovro Josip Petar', 'Horvat Kovač Babić Marić Jurić Novak Knežević Vuković Matić'],
    JPN: ['Haruto Yuto Sota Daichi Takumi Ren Kenta Riku Hiroki', 'Sato Suzuki Takahashi Tanaka Watanabe Yamamoto Nakamura Kobayashi Kato'],
    URU: ['Federico Santiago Martín Rodrigo Manuel Mathías José Facundo', 'Rodríguez Pereira Silva Fernández Sosa Méndez Acosta Cabrera'],
    COL: ['Luis Andrés Juan Camilo Daniel Sebastián Felipe Carlos', 'Díaz Rodríguez Gómez Sánchez Muñoz Ríos Castro Vargas'],
    MAR: ['Youssef Hamza Mehdi Ayoub Bilal Anas Omar Rachid', 'Benali Alaoui Idrissi Bennani Tazi Chraibi El Amrani Berrada'],
    ECU: ['José Carlos Luis Andrés Ángel Félix Jorge Diego Byron Wilson', 'Vera Valencia Zambrano Mendoza Castillo Mora Plaza Cedeño Delgado Reyes'],
    PAR: ['Miguel Julio Antonio Gustavo Ramón Diego Ángel Omar Matías Junior', 'Benítez Giménez Ortiz Gómez Ayala Duarte Sosa Rojas Acosta Báez Galeano Cáceres'],
    CHI: ['Felipe Ignacio Cristóbal Matías Sebastián Benjamín Joaquín Vicente Tomás Diego', 'Muñoz Rojas Soto Contreras Silva Morales Sepúlveda Fuentes Torres Araya Espinoza Castillo'],
    PER: ['Luis Renato André Jorge Diego Pedro Carlos Christian Jean Bryan', 'Quispe Flores Huamán Mamani Chávez Ramírez Mendoza Rojas Vásquez Torres Castillo Peña'],
    VEN: ['José Luis Carlos Jesús Daniel Eduardo Miguel Andrés Ricardo Javier', 'Rodríguez Hernández Pérez Medina Rivas Bello Herrera Rojas Martínez Romero Blanco Silva'],
    BOL: ['Marcelo Carlos Ramiro Henry Roberto Gabriel Miguel Erwin Leonel Diego', 'Mamani Quispe Vargas Choque Fernández Condori Flores Gutiérrez Rojas Arce Vaca Cruz']
  }
};

// South America: nationalities a career can have, with no league in the game (the national teams are in G.NT)
G.SA_NATS = ['BRA', 'ARG', 'URU', 'COL', 'ECU', 'PAR', 'CHI', 'PER', 'VEN', 'BOL'];
// The "bridge" country of a nation with no league: the parent club of a loan, the debug 'second' start,
// the club that loves an ex international manager. Never an advantage in the random start.
/** @type {Dict<NationCode>} */
G.SA_LINK = { BRA: 'POR', ARG: 'ESP', URU: 'ESP', COL: 'ESP', ECU: 'ESP', PAR: 'ESP', CHI: 'ESP', PER: 'ESP', VEN: 'ESP', BOL: 'ESP' };
