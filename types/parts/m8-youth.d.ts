// M8 phase E: the academy, a new role, the training (js/mgr-youth.js, js/ui-mgr-youth.js)

/** a youth scout: the nation he watches, his level 1..3 and the roles he looks for */
interface YouthScout { nat: NationCode; lvl: 1 | 2 | 3; focus: 'all' | 'POR' | 'DEF' | 'CEN' | 'ATT' }
/** a boy of the youth squad, not a player of the world until promoted: f = the fog on his potential */
interface YouthProspect { n: string; nt: NationCode; r: RoleKey; a: number; o: number; p: number; f: number }
/** a player learning role `to`: pr from 0 to 100 */
interface RoleRetrain { to: RoleKey; pr: number }
type Training = 'leggero' | 'normale' | 'intenso';
interface Mgr { ys?: YouthScout[]; yth?: YouthProspect[]; dev?: { [id: number]: RoleRetrain }; train?: Training }
