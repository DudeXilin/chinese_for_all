import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SentenceRecord = {
  translation?: string;
  tags?: unknown[];
  sentence?: string;
  chinese?: string;
  text?: string;
  [key: string]: unknown;
};

let datasetPromise: Promise<Record<string, SentenceRecord> | SentenceRecord[]> | undefined;

function loadDataset() {
  if (!datasetPromise) {
    const filePath = path.join(process.cwd(), "lib", "TEST_SENTENCES", "sentences_with_translation.json");
    datasetPromise = readFile(filePath, "utf8")
      .then((raw) => JSON.parse(raw) as Record<string, SentenceRecord> | SentenceRecord[])
      .catch((error) => {
        datasetPromise = undefined;
        throw error;
      });
  }
  return datasetPromise;
}

function getTaggedWords(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => {
      if (Array.isArray(tag)) return typeof tag[0] === "string" ? tag[0] : "";
      if (tag && typeof tag === "object" && "word" in tag) {
        return typeof tag.word === "string" ? tag.word : "";
      }
      return "";
    })
    .filter(Boolean);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const target = typeof body.target === "string" ? body.target.trim() : "";
    const knownWords = Array.isArray(body.knownWords)
      ? body.knownWords.filter((word: unknown): word is string => typeof word === "string")
      : [];

    if (!target) {
      return NextResponse.json({ error: "Введите слово или иероглиф для изучения." }, { status: 400 });
    }

    const known = new Set(knownWords.map((word) => word.trim()).filter(Boolean));
    known.add(target);

    const parsed = await loadDataset();
    const entries: Array<[string, SentenceRecord]> = Array.isArray(parsed)
      ? parsed.map((record) => [
          typeof record.sentence === "string" ? record.sentence : String(record.chinese ?? record.text ?? ""),
          record,
        ])
      : Object.entries(parsed);

    const matches: Array<{ sentence: string; translation: string }> = [];
    for (const [sentence, record] of entries) {
      if (!sentence || !sentence.includes(target)) continue;
      const taggedWords = getTaggedWords(record.tags);
      if (taggedWords.some((word) => !known.has(word))) continue;

      const translation = typeof record.translation === "string" ? record.translation.trim() : "";
      if (!translation) continue;
      matches.push({ sentence, translation });
    }

    return NextResponse.json({ results: matches, count: matches.length });
  } catch (error) {
    console.error("Sentence search failed:", error);
    return NextResponse.json(
      { error: "Не удалось обработать словарь предложений. Проверьте формат JSON и повторите попытку." },
      { status: 500 },
    );
  }
}
