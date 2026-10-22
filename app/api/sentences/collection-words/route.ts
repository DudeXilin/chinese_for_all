import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  if (!userId) {
    return Response.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const [{ data: cards, error: cardsError }, { data: reviews, error: reviewsError }] = await Promise.all([
    supabase.from("fsrs_cards").select("word").eq("user_id", userId),
    supabase.from("fsrs_reviews").select("word").eq("user_id", userId),
  ]);

  if (cardsError || reviewsError) {
    console.error("[Sentences collection words] failed to load FSRS words", { cardsError, reviewsError });
    return Response.json({ error: "Не удалось загрузить слова из вашей коллекции FSRS." }, { status: 500 });
  }

  const words = [...new Set([
    ...(cards ?? []).map((row) => row.word),
    ...(reviews ?? []).map((row) => row.word),
  ].filter((word): word is string => typeof word === "string" && word.trim().length > 0).map((word) => word.trim()))];

  return Response.json({ words }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
