import { createClient } from "@/lib/supabase/server";
import {
  createCard,
  preview,
  review,
  Rating,
  type SerializedCard,
} from "@/lib/FSRS-6/our_system";

type RequestBody = {
  word?: string;
  answer?: string | null;
  rating?: number;
};

const validRatings = new Set<number>([
  Rating.Again,
  Rating.Hard,
  Rating.Good,
  Rating.Easy,
]);

function dbCardToSerialized(card: {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
}): SerializedCard {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as SerializedCard["state"],
    last_review: card.last_review,
  };
}

function serializedCardToDb(card: SerializedCard) {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review,
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  if (!userId) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const word = typeof body.word === "string" ? body.word.trim() : "";
  const rating = body.rating;
  const answer = typeof body.answer === "string" ? body.answer : null;

  if (!word || word.length > 200 || typeof rating !== "number" || !validRatings.has(rating)) {
    return Response.json({ error: "Invalid FSRS review payload" }, { status: 400 });
  }

  // The device clock is deliberately ignored. FSRS receives an authoritative
  // server timestamp so a wrong clock on a phone/computer cannot move a card
  // forward or backward by hours/days.
  const now = new Date();

  let { data: existing, error: loadError } = await supabase
    .from("fsrs_cards")
    .select(
      "id, word, due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review",
    )
    .eq("user_id", userId)
    .eq("word", word)
    .maybeSingle();

  if (loadError) {
    console.error("[FSRS-6] failed to load card", loadError);
    return Response.json({ error: "Failed to load FSRS card" }, { status: 500 });
  }

  if (!existing) {
    const initial = createCard(now);

    const { data: inserted, error: insertError } = await supabase
      .from("fsrs_cards")
      .insert({
        user_id: userId,
        word,
        ...serializedCardToDb(initial),
      })
      .select(
        "id, word, due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review",
      )
      .single();

    if (insertError && insertError.code !== "23505") {
      console.error("[FSRS-6] failed to create card", insertError);
      return Response.json({ error: "Failed to create FSRS card" }, { status: 500 });
    }

    if (inserted) {
      existing = inserted;
    } else {
      const retry = await supabase
        .from("fsrs_cards")
        .select(
          "id, word, due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review",
        )
        .eq("user_id", userId)
        .eq("word", word)
        .single();

      if (retry.error || !retry.data) {
        console.error("[FSRS-6] failed to recover concurrently created card", retry.error);
        return Response.json({ error: "Failed to load FSRS card" }, { status: 500 });
      }

      existing = retry.data;
    }
  }

  const card = dbCardToSerialized(existing);
  const before = preview(card, now);
  const result = review(card, now, rating as Rating.Again | Rating.Hard | Rating.Good | Rating.Easy);

  const { error: updateError } = await supabase
    .from("fsrs_cards")
    .update({
      ...serializedCardToDb(result.card),
      updated_at: now.toISOString(),
    })
    .eq("id", existing.id)
    .eq("user_id", userId);

  if (updateError) {
    console.error("[FSRS-6] failed to update card", updateError);
    return Response.json({ error: "Failed to save FSRS card" }, { status: 500 });
  }

  const { error: reviewError } = await supabase
    .from("fsrs_reviews")
    .insert({
      user_id: userId,
      card_id: existing.id,
      word,
      answer,
      rating,
      state: result.log.state,
      due: result.log.due,
      stability: result.log.stability,
      difficulty: result.log.difficulty,
      elapsed_days: result.log.elapsed_days,
      last_elapsed_days: result.log.last_elapsed_days,
      scheduled_days: result.log.scheduled_days,
      learning_steps: result.log.learning_steps,
      review: result.log.review,
    });

  if (reviewError) {
    console.error("[FSRS-6] failed to save review history", reviewError);
    return Response.json({ error: "Failed to save FSRS review history" }, { status: 500 });
  }

  return Response.json({
    serverNow: now.toISOString(),
    card: result.card,
    log: result.log,
    before,
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
