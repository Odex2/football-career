// M8 phase C: the pre-match card and the live match with half time (js/mgr-live.js)

/** the half-time choice: second-half modifiers for our side, strength added, the substitution [on, off], the talk */
interface LivePick { mods: [number, number]; dstr: number; sub: [PlayerId, PlayerId] | null; talk: boolean | null; txt?: string }
/** a live match stopped at half time: key = year:block:day, ht = [ours, theirs], the strengths of both sides */
interface HalfTime { key: string; opp: ClubId; home: boolean; neutral?: boolean; ht: [number, number]; my: number; op: number; pick: LivePick | null }
interface State { mgrLiveReq?: number; mgrHT?: HalfTime | null }
interface EventCard { mgrht?: number }
/** the last 5 results of a club: V, N, P */
interface Club { fm?: string }
/** the half-time substitution of the managed side: [on, off] */
interface MatchSide { sub?: [PlayerId, PlayerId] }
/** a match of the managed club: its XI (for the ratings), and when played live the half-time score and the choice */
interface MatchRow { xi?: PlayerId[]; live?: number; ht?: number[]; lv?: string }
