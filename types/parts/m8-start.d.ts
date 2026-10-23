// M8 phase A: South American nationalities and the random first club

/** what G.game.startClub draws: the club and the odds it had */
interface StartDraw { club: Club; odds: number }
/** extra nations are drawn by weight (missing = 1) */
interface NationRef { w?: number }
/** the player's nation has a league in the game (cards that offer a move home) */
interface EvCtx { homeLg: boolean }
