import {
  createEmptyCard,
  fsrs,
  Rating,
  type Card,
  type CardInput,
  type DateInput,
  type FSRSParameters,
} from '../ts-fsrs-5.4.2/packages/fsrs/src/index'
import type {
  FSRSSystemParameters,
  SerializedCard,
  SerializedReviewLog,
  SRSPreview,
  SRSReviewResult,
} from './types'

const toSerializedCard = (card: Card): SerializedCard => ({
  ...card,
  due: card.due.toISOString(),
  last_review: card.last_review?.toISOString() ?? null,
})

const toSerializedReviewLog = (log: {
  rating: Rating
  state: number
  due: Date
  stability: number
  difficulty: number
  elapsed_days: number
  last_elapsed_days: number
  scheduled_days: number
  learning_steps: number
  review: Date
}): SerializedReviewLog => ({
  ...log,
  rating: log.rating,
  state: log.state as SerializedReviewLog['state'],
  due: log.due.toISOString(),
  review: log.review.toISOString(),
})

const toCardInput = (card: SerializedCard): CardInput => ({
  ...card,
  due: card.due,
  last_review: card.last_review,
})

export function createCard(now: DateInput = new Date()): SerializedCard {
  return toSerializedCard(createEmptyCard(now))
}

export function preview(
  card: SerializedCard,
  now: DateInput = new Date(),
  parameters?: FSRSSystemParameters,
): SRSPreview {
  const scheduler = fsrs(parameters)
  const record = scheduler.repeat(toCardInput(card), now)

  return {
    again: {
      card: toSerializedCard(record[Rating.Again].card),
      log: toSerializedReviewLog(record[Rating.Again].log),
    },
    hard: {
      card: toSerializedCard(record[Rating.Hard].card),
      log: toSerializedReviewLog(record[Rating.Hard].log),
    },
    good: {
      card: toSerializedCard(record[Rating.Good].card),
      log: toSerializedReviewLog(record[Rating.Good].log),
    },
    easy: {
      card: toSerializedCard(record[Rating.Easy].card),
      log: toSerializedReviewLog(record[Rating.Easy].log),
    },
  }
}

export function review(
  card: SerializedCard,
  now: DateInput,
  rating: Rating.Again | Rating.Hard | Rating.Good | Rating.Easy,
  parameters?: FSRSSystemParameters,
): SRSReviewResult {
  const scheduler = fsrs(parameters)
  const result = scheduler.next(toCardInput(card), now, rating)

  return {
    card: toSerializedCard(result.card),
    log: toSerializedReviewLog(result.log),
  }
}

export function getParameters(
  parameters?: FSRSSystemParameters,
): FSRSParameters {
  return fsrs(parameters).parameters
}

export { Rating }
