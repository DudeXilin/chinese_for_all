import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  if (!userId) {
    return Response.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const { data: unwantedRows, error: unwantedError } = await supabase
    .from("user_unwanted_words")
    .select("word")
    .eq("user_id", userId);
  if (unwantedError) {
    console.error("[Sentences collection words] failed to load unwanted words", unwantedError);
    return Response.json({ error: "Не удалось загрузить список ненужных слов." }, { status: 500 });
  }
  const unwantedWords = new Set((unwantedRows ?? []).map((row) => row.word));

  // Only include words whose current FSRS scheduled interval is greater than
  // 30 days. These are the "easy words" shown in the collection.
  const { data: cards, error } = await supabase
    .from("fsrs_cards")
    .select("word, scheduled_days")
    .eq("user_id", userId)
    .gt("scheduled_days", 30);

  if (error) {
    console.error("[Sentences collection words] failed to load easy FSRS words", error);
    return Response.json({ error: "Не удалось загрузить лёгкие слова из вашей коллекции FSRS." }, { status: 500 });
  }

  const words = [...new Set(
    (cards ?? [])
      .filter((row) => typeof row.scheduled_days === "number" && row.scheduled_days > 30 && !unwantedWords.has(row.word))
      .map((row) => row.word)
      .filter((word): word is string => typeof word === "string" && word.trim().length > 0)
      .map((word) => word.trim()),
  )];

  return Response.json({ words }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
