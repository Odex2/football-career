// Types for js/config.js, js/rng.js, js/names.js, js/world.js, js/squads.js, js/coaches.js, js/agents.js
// (checker only, see types/game.d.ts). Interfaces declared here merge with the ones in game.d.ts.

interface Rng {
  /** mulberry32 state, saved with the career as st.rngState */
  s: number;
  /** n random items without shuffling the whole array (the array is not modified) */
  sample<T>(list: T[], n: number): T[];
}

interface Coach {
  /** 1 for a retired NPC footballer who became a coach (G.coaches.fromPlayer) */
  exp?: number;
}

/** A coach handed to G.coaches.add, which gives it its id and no club */
interface CoachDraft extends Omit<Coach, 'i' | 'c'> { i?: CoachId; c?: ClubId }

/** Id, name and flag of any nation: league nation, extra nation or national team (G.nationInfo) */
interface NationRef { id: NationCode; name: string; flag: string }

/** G.DATA (js/names.js); js/national-data.js adds ntTeams and ntNames after load */
interface GameData {
  nations: NationInfo[];
  /** "Club A|Club B;Club C|Club D;..." */
  derbies: string;
  /** nations with a name pool but no league */
  extraNations: NationRef[];
  /** per nation: [first names, surnames], space separated */
  names: Dict<string[]>;
  /** "id:confederation:base|..." */
  ntTeams?: string;
  /** "id:name:flag|..." */
  ntNames?: string;
}

/** G.TRAITS: player traits; the numbers multiply (peak: adds to) the matching growth factor */
interface TraitInfo { name: string; desc: string; peak?: number; young?: number; mid?: number; inj?: number; decl?: number; key?: number }

/** G.SHOP.staff: lv = [yearly cost k€, effect] per level */
interface StaffInfo { n: string; d: string; lv: number[][] }

/** G.SHOP.items: cost c k€, morale mo, fame fa; st permanent staff bonus, inc income k€/year, req fame needed, fans affection */
interface ShopItem { n: string; c: number; mo: number; fa: number; once?: number; season?: number; fans?: number; st?: Dict<number>; inc?: number; req?: number }

/** G.CFG.UEFA: a European competition (md = league-phase matchdays, prize = key in G.CFG.PRIZE) */
interface UefaInfo { name: string; md: number; prize: string }

/** G.CFG.NT.TOURS: a national-team tournament (q = places per confederation, bdo = Ballon d'Or bonus) */
interface TourInfo { n: string; size: number; q: Dict<number>; bdo: number }
