import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  if (!userId) {
    return Response.json({ authenticated: false, cards: [] }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("fsrs_cards")
    .select(
      "id, word, due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review",
    )
    .eq("user_id", userId);

  if (error) {
    console.error("[FSRS-6] failed to load cards", error);
    return Response.json({ error: "Failed to load FSRS cards" }, { status: 500 });
  }

  return Response.json({
    authenticated: true,
    serverNow: new Date().toISOString(),
    cards: data ?? [],
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
