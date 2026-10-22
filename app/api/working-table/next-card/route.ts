import { createClient } from "@/lib/supabase/server";
import hskDictionary from "@/lib/ru_en_chi_dictionary/hsk.generated";
import { getCharacterInfo } from "@/lib/Make_Me_a_Hanzi";
import { getPartOfSpeechTranslations } from "@/lib/ru_en_chi_dictionary";

type HskEntry = {
  hanzi?: string;
  pinyin?: string;
  level?: string | number;
  frequency?: string | number;
  translations?: { rus?: string[]; eng?: string[] };
  pos?: string;
};

const entries = hskDictionary as HskEntry[];

export async function GET() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  let reviewedWords = new Set<string>();
  let unwantedWords = new Set<string>();
  if (userId) {
    const { data: unwanted, error: unwantedError } = await supabase
      .from("user_unwanted_words")
      .select("word")
      .eq("user_id", userId);
    if (unwantedError) {
      console.error("[Working table] failed to load unwanted words", unwantedError);
      return Response.json({ error: "Не удалось загрузить список ненужных слов. Проверьте схему user_unwanted_words в Supabase." }, { status: 500 });
    }
    unwantedWords = new Set((unwanted ?? []).map((row) => row.word).filter((word): word is string => typeof word === "string"));
  }
  if (userId) {
    const { data, error } = await supabase
      .from("fsrs_reviews")
      .select("word")
      .eq("user_id", userId);

    if (error) {
      console.error("[Working table] failed to load FSRS review history", error);
      return Response.json({ error: "Не удалось загрузить историю FSRS." }, { status: 500 });
    }
    reviewedWords = new Set((data ?? []).map((row) => row.word).filter((word): word is string => typeof word === "string"));
  }

  if (userId) {
    const { data: cards, error: cardsError } = await supabase
      .from("fsrs_cards")
      .select("word")
      .eq("user_id", userId);

    if (cardsError) {
      console.error("[Working table] failed to load FSRS cards", cardsError);
      return Response.json({ error: "Не удалось загрузить карточки FSRS." }, { status: 500 });
    }

    for (const row of cards ?? []) {
      if (typeof row.word === "string") reviewedWords.add(row.word);
    }
  }

  const validEntries = entries.filter((entry) => {
    const word = entry.hanzi?.trim();
    const level = Number(entry.level);
    const frequency = Number(entry.frequency);
    return Boolean(word) && Number.isFinite(level) && level > 0 && Number.isFinite(frequency) && frequency >= 0;
  });
  const levels = [...new Set(validEntries.map((entry) => Number(entry.level)))].sort((a, b) => a - b);
  const targetLevel = levels.find((level) => validEntries.some((entry) => Number(entry.level) === level && !reviewedWords.has(entry.hanzi!.trim()) && !unwantedWords.has(entry.hanzi!.trim()))) ?? levels[levels.length - 1] ?? 1;
  const targetLevelEntries = validEntries.filter((entry) => Number(entry.level) === targetLevel);
  const targetLevelRemaining = targetLevelEntries.filter((entry) => !reviewedWords.has(entry.hanzi!.trim()) && !unwantedWords.has(entry.hanzi!.trim())).length;
  const progress = {
    level: targetLevel,
    remaining: targetLevelRemaining,
    total: targetLevelEntries.length,
    completed: targetLevelEntries.length - targetLevelRemaining,
  };

  const candidate = entries
    .filter((entry) => {
      const word = entry.hanzi?.trim();
      const level = Number(entry.level);
      const frequency = Number(entry.frequency);
      return Boolean(word) &&
        Number.isFinite(level) && level > 0 &&
        Number.isFinite(frequency) && frequency >= 0 &&
        !reviewedWords.has(word!) && !unwantedWords.has(word!);
    })
    .sort((a, b) => {
      const levelDifference = Number(a.level) - Number(b.level);
      if (levelDifference) return levelDifference;
      const frequencyDifference = Number(a.frequency) - Number(b.frequency);
      if (frequencyDifference) return frequencyDifference;
      return (a.hanzi ?? "").localeCompare(b.hanzi ?? "", "zh-Hans");
    })[0];

  if (!candidate?.hanzi) {
    return Response.json({ exhausted: true, authenticated: Boolean(userId), progress }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  }

  const word = candidate.hanzi.trim();
  const characters = Array.from(word).map((character) => ({
    character,
    info: getCharacterInfo(character),
  }));

  return Response.json({
    authenticated: Boolean(userId),
    exhausted: false,
    progress,
    word: {
      hanzi: word,
      pinyin: candidate.pinyin ?? "",
      russian: candidate.translations?.rus?.join("; ") ?? "",
      english: candidate.translations?.eng?.join("; ") ?? "",
      pos: getPartOfSpeechTranslations([word])[word] ?? candidate.pos ?? "",
      level: Number(candidate.level),
      frequency: Number(candidate.frequency),
      characters,
    },
  }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
