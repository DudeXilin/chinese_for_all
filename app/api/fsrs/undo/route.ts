import { createClient } from "@/lib/supabase/server";
import type { SerializedCard } from "@/lib/FSRS-6/our_system";

type RequestBody = {
  word?: string;
  previousCard?: SerializedCard;
};

function isSerializedCard(value: unknown): value is SerializedCard {
  if (!value || typeof value !== "object") return false;
  const card = value as Record<string, unknown>;
  return (
    typeof card.due === "string" &&
    typeof card.stability === "number" &&
    typeof card.difficulty === "number" &&
    typeof card.elapsed_days === "number" &&
    typeof card.scheduled_days === "number" &&
    typeof card.learning_steps === "number" &&
    typeof card.reps === "number" &&
    typeof card.lapses === "number" &&
    typeof card.state === "number" &&
    (card.last_review === null || typeof card.last_review === "string")
  );
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
  if (!word || word.length > 200 || !isSerializedCard(body.previousCard)) {
    return Response.json({ error: "Invalid FSRS undo payload" }, { status: 400 });
  }

  const { data: card, error: cardError } = await supabase
    .from("fsrs_cards")
    .select("id")
    .eq("user_id", userId)
    .eq("word", word)
    .maybeSingle();

  if (cardError || !card) {
    console.error("[FSRS-6] failed to load card for undo", cardError);
    return Response.json({ error: "FSRS card not found" }, { status: 404 });
  }

  // The UI only exposes undo immediately after the latest review. Remove that
  // latest history row, then restore the exact pre-review card snapshot.
  const { data: latestReview, error: reviewLoadError } = await supabase
    .from("fsrs_reviews")
    .select("id")
    .eq("user_id", userId)
    .eq("card_id", card.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (reviewLoadError || !latestReview) {
    console.error("[FSRS-6] failed to load latest review for undo", reviewLoadError);
    return Response.json({ error: "Latest FSRS review not found" }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("fsrs_reviews")
    .delete()
    .eq("id", latestReview.id)
    .eq("user_id", userId);

  if (deleteError) {
    console.error("[FSRS-6] failed to delete review during undo", deleteError);
    return Response.json({ error: "Failed to undo FSRS review" }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("fsrs_cards")
    .update({
      ...body.previousCard,
      updated_at: new Date().toISOString(),
    })
    .eq("id", card.id)
    .eq("user_id", userId);

  if (updateError) {
    console.error("[FSRS-6] failed to restore card during undo", updateError);
    return Response.json({ error: "Failed to restore FSRS card" }, { status: 500 });
  }

  return Response.json({ ok: true }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
