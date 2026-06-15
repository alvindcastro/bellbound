export type RecommendationKind =
  | 'reduce'
  | 'repeat'
  | 'hold_pressing'
  | 'hold_conditioning'
  | 'hold_carry'
  | 'hold_squat'
  | 'progress'
  | 'maintain';

export interface Recommendation {
  kind: RecommendationKind;
  explanation: string;
}
