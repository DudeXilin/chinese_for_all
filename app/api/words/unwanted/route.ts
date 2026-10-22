import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return Response.json({ error: "Требуется авторизация." }, { status: 401 });
  const { data, error } = await supabase.from("user_unwanted_words").select("word").eq("user_id", userId);
  if (error) return Response.json({ error: "Не удалось загрузить ненужные слова." }, { status: 500 });
  return Response.json({ words: (data ?? []).map((row) => row.word) }, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return Response.json({ error: "Требуется авторизация." }, { status: 401 });
  let body: { word?: string; action?: string };
  try { body = await request.json(); } catch { return Response.json({ error: "Некорректный запрос." }, { status: 400 }); }
  const word = typeof body.word === "string" ? body.word.trim() : "";
  if (!word || Array.from(word).length > 20 || (body.action !== "exclude" && body.action !== "restore")) return Response.json({ error: "Укажите слово и действие." }, { status: 400 });
  if (body.action === "exclude") {
    const { error } = await supabase.from("user_unwanted_words").upsert({ user_id: userId, word }, { onConflict: "user_id,word" });
    if (error) return Response.json({ error: "Не удалось отметить слово ненужным." }, { status: 500 });
  } else {
    const { error } = await supabase.from("user_unwanted_words").delete().eq("user_id", userId).eq("word", word);
    if (error) return Response.json({ error: "Не удалось вернуть слово." }, { status: 500 });
  }
  const { data, error } = await supabase.from("user_unwanted_words").select("word").eq("user_id", userId);
  if (error) return Response.json({ error: "Изменение сохранено, но список не загрузился." }, { status: 500 });
  return Response.json({ words: (data ?? []).map((row) => row.word) }, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
}
