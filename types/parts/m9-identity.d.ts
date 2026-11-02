// M9 snapshot S3 (phase M6 and the interview of M10.4): the club's identity (js/mgr-identity.js)

interface Mgr {
  /** the manager's record per trait of identity: +1 a season respected, −1 betrayed, −3..+3 */
  style?: Dict<number>;
  /** signings above the squad's level and home-grown players sold, this season */
  big?: number; soldOwn?: number;
}
/** the club that promoted him from its academy */
interface Npc { hg?: ClubId }
/** the goal of identity: the wage bill that keeps Conti in ordine (M€) */
interface BoardGoal { cap?: number }
