import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    return Response.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  // Remove review history first, then the scheduled cards. Both operations are
  // strictly scoped to the authenticated user.
  const { error: reviewsError } = await supabase
    .from("fsrs_reviews")
    .delete()
    .eq("user_id", userId);

  if (reviewsError) {
    console.error("[FSRS reset] failed to delete review history", reviewsError);
    return Response.json({ error: "Не удалось удалить историю повторений." }, { status: 500 });
  }

  const { error: cardsError } = await supabase
    .from("fsrs_cards")
    .delete()
    .eq("user_id", userId);

  if (cardsError) {
    console.error("[FSRS reset] failed to delete cards", cardsError);
    return Response.json({ error: "История повторений удалена, но не удалось удалить карточки. Попробуйте ещё раз." }, { status: 500 });
  }

  return Response.json({ success: true }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
