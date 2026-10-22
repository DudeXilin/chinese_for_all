import { createClient } from "@/lib/supabase/server";
import hskDictionary from "@/lib/ru_en_chi_dictionary/hsk.generated";
import { createCard } from "@/lib/FSRS-6/our_system";

type HskEntry = {
  hanzi?: string;
  level?: string | number;
  frequency?: string | number;
};

const entries = hskDictionary as HskEntry[];
const DAY_MS = 24 * 60 * 60 * 1000;
const CALIBRATION_WORDS = new Set(entries.map((entry) => entry.hanzi?.trim()).filter((word): word is string => Boolean(word)));

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  if (!userId) {
    return Response.json({ error: "Войдите в аккаунт, чтобы сохранить калибровку." }, { status: 401 });
  }

  const { count, error: countError } = await supabase
    .from("fsrs_cards")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    console.error("[Calibration] failed to check FSRS cards", countError);
    return Response.json({ error: "Не удалось проверить карточки FSRS." }, { status: 500 });
  }

  if ((count ?? 0) > 0) {
    return Response.json({ alreadyCalibrated: true }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  }

  const url = new URL(request.url);
  const level = Number(url.searchParams.get("level") ?? "1");
  if (!Number.isInteger(level) || level < 1) {
    return Response.json({ error: "Некорректный уровень HSK." }, { status: 400 });
  }

  const words = entries
    .filter((entry) => {
      const word = entry.hanzi?.trim();
      const entryLevel = Number(entry.level);
      const frequency = Number(entry.frequency);
      return Boolean(word) && entryLevel === level && Number.isFinite(frequency) && frequency >= 0;
    })
    .map((entry) => ({ word: entry.hanzi!.trim(), frequency: Number(entry.frequency) }))
    .sort((a, b) => a.frequency - b.frequency || a.word.localeCompare(b.word, "zh-Hans"))
    .filter((entry, index, list) => list.findIndex((candidate) => candidate.word === entry.word) === index);

  const levels = [...new Set(entries.map((entry) => Number(entry.level)).filter((value) => Number.isInteger(value) && value > 0))].sort((a, b) => a - b);

  return Response.json({ alreadyCalibrated: false, level, levels, words }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  if (!userId) {
    return Response.json({ error: "Войдите в аккаунт, чтобы сохранить калибровку." }, { status: 401 });
  }

  let body: { words?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  if (!Array.isArray(body.words) || body.words.some((word) => typeof word !== "string")) {
    return Response.json({ error: "Список выбранных слов некорректен." }, { status: 400 });
  }

  const selectedWords = [...new Set((body.words as string[]).map((word) => word.trim()).filter(Boolean))];
  if (selectedWords.length === 0) {
    return Response.json({ error: "Отметьте хотя бы одно слово, чтобы завершить калибровку." }, { status: 400 });
  }
  if (selectedWords.length > 5000 || selectedWords.some((word) => !CALIBRATION_WORDS.has(word))) {
    return Response.json({ error: "В списке есть неизвестные слова или слишком много слов." }, { status: 400 });
  }

  const { count, error: countError } = await supabase
    .from("fsrs_cards")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    console.error("[Calibration] failed to check FSRS cards before saving", countError);
    return Response.json({ error: "Не удалось проверить карточки FSRS." }, { status: 500 });
  }

  if ((count ?? 0) > 0) {
    return Response.json({ alreadyCalibrated: true }, { status: 409 });
  }

  const now = new Date();
  const due = new Date(now.getTime() + 60 * DAY_MS).toISOString();
  const card = createCard(now);
  const rows = selectedWords.map((word) => ({
    user_id: userId,
    word,
    ...card,
    due,
    scheduled_days: 60,
    updated_at: now.toISOString(),
  }));

  const { error: insertError } = await supabase.from("fsrs_cards").insert(rows);
  if (insertError) {
    console.error("[Calibration] failed to save calibrated cards", insertError);
    return Response.json({ error: "Не удалось сохранить калибровку. Попробуйте ещё раз." }, { status: 500 });
  }

  return Response.json({ success: true, count: rows.length }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
