import type {
  Card,
  FSRSParameters,
  ReviewLog,
  Rating,
  State,
} from '../ts-fsrs-5.4.2/packages/fsrs/src/index'

export type FSRSSystemParameters = Partial<FSRSParameters>

export interface SerializedCard {
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  learning_steps: number
  reps: number
  lapses: number
  state: State
  last_review: string | null
}

export interface SerializedReviewLog {
  rating: Rating
  state: State
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  last_elapsed_days: number
  scheduled_days: number
  learning_steps: number
  review: string
}

export interface SRSReviewResult {
  card: SerializedCard
  log: SerializedReviewLog
}

export interface SRSPreview {
  again: SRSReviewResult
  hard: SRSReviewResult
  good: SRSReviewResult
  easy: SRSReviewResult
}

export type { Card, FSRSParameters, ReviewLog, Rating, State }
