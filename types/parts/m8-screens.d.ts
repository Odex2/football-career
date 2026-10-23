// M8 phases H and I: the pitch view of the formation, the main screen and the Profile tab

/** a point of G.ui.PITCH_POS: x and y in % of the pitch, label */
type PitchPos = [number, number, string];

/** one card of G.ui.pitch: a player on the pitch or on the bench (js/ui-pitch.js) */
interface PitchCard {
  club: Club;
  name: string;
  /** shirt initials */
  ini: string;
  /** natural role */
  r: RoleKey;
  /** the big number: worth in the slot, overall, fitness, morale or form, as the view says */
  val: number | string;
  /** orange number: worth less than the overall in this slot */
  low?: boolean;
  /** bottom bar: 0..100 and its colour class ('' green, 'mid', 'bad') */
  bar: number;
  barCls: string;
  /** form arrow: 'up2', 'up', 'eq', 'dn' */
  form: string;
  glow?: boolean;
  cap?: boolean;
  me?: boolean;
  heir?: boolean;
  /** injured for this many matches */
  inj?: number;
  /** bench: one of the planned substitutes */
  sub?: boolean;
  /** on the pitch out of position: the natural role, shown small */
  off?: boolean;
  sel?: boolean;
  /** while a player is selected: what he would be worth here, and the colour of the fit ('g', 'y', 'o', 'r') */
  hint?: [number, string];
  act: string;
  v: string;
  aria: string;
}
interface PitchOpts { form: string; slots: PitchCard[]; bench: PitchCard[]; selecting?: boolean }

/** G.season.startParts: the pieces of the start chance, in overall points */
interface StartParts { chance: number; rival: PlayerId | null; level: number; form: number; morale: number; coach: number; young: number; analyst: number; floor: number }
/** ck = competition key ('lg', the cup's nation, 'UCL', 'UEL', 'UECL'), rd = round or stage, pen = decided after a draw */
interface MatchRow { ck?: string; rd?: string; pen?: number }
interface MatchComp { ck?: string; rd?: string }
/** the attributes at the start of the season (Profile tab) */
interface State { attrs0?: Attrs }
/** every match of the user's club this season (S.blockRows of the blocks played) */
interface Season { rows?: MatchRow[] }
