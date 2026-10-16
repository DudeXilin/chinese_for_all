import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SentenceRecord = {
  translation?: string;
  translation_en?: string;
  english?: string;
  tags?: unknown[];
  sentence?: string;
  chinese?: string;
  text?: string;
  [key: string]: unknown;
};

type Dataset = Record<string, unknown> | unknown[];

let datasetPromise: Promise<Dataset> | undefined;

function loadDataset() {
  if (!datasetPromise) {
    const filePath = path.join(process.cwd(), "lib", "TEST_SENTENCES", "sentences_with_translation.json");
    datasetPromise = readFile(filePath, "utf8")
      .then((raw) => JSON.parse(raw) as Dataset)
      .catch((error) => {
        datasetPromise = undefined;
        throw error;
      });
  }
  return datasetPromise;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapDataset(dataset: Dataset): { entries: Array<[string, SentenceRecord]>; rootKeys: string[]; shape: string } {
  let source: unknown = dataset;
  let shape = Array.isArray(dataset) ? "array" : "object";
  const rootKeys = isRecord(dataset) ? Object.keys(dataset).slice(0, 30) : [];

  if (isRecord(source)) {
    for (const key of ["sentences", "data", "items", "records", "examples"]) {
      const nested = source[key];
      if (Array.isArray(nested) || isRecord(nested)) {
        source = nested;
        shape += " -> " + key;
        break;
      }
    }
  }

  if (Array.isArray(source)) {
    const entries: Array<[string, SentenceRecord]> = [];
    for (const item of source) {
      if (!isRecord(item)) continue;
      const sentence = typeof item.sentence === "string"
        ? item.sentence
        : typeof item.chinese === "string"
          ? item.chinese
          : typeof item.text === "string"
            ? item.text
            : "";
      if (sentence) entries.push([sentence, item as SentenceRecord]);
    }
    return { entries, rootKeys, shape };
  }

  if (isRecord(source)) {
    return {
      entries: Object.entries(source).flatMap(([key, value]) => {
        if (typeof value === "string") return [[key, { translation: value } as SentenceRecord]];
        if (!isRecord(value)) return [];
        const sentence = typeof value.sentence === "string"
          ? value.sentence
          : typeof value.chinese === "string"
            ? value.chinese
            : typeof value.text === "string"
              ? value.text
              : key;
        return [[sentence, value as SentenceRecord]];
      }),
      rootKeys,
      shape,
    };
  }

  return { entries: [], rootKeys, shape: typeof source };
}

function getTaggedWords(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag: unknown) => {
      if (Array.isArray(tag)) return typeof tag[0] === "string" ? tag[0] : "";
      if (isRecord(tag)) {
        if (typeof tag.word === "string") return tag.word;
        if (typeof tag.text === "string") return tag.text;
      }
      return "";
    })
    .filter((word: string) => word.length > 0);
}

function getTranslation(record: SentenceRecord): string {
  for (const key of ["translation", "translation_en", "english", "en", "translated", "translate"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

// Remove punctuation and whitespace, but keep letters, digits and Han characters.
// Anything that is not in the learner's vocabulary will therefore fail segmentation.
function normalizeSentence(sentence: string): string {
  return sentence.replace(/[\p{P}\p{S}\s]/gu, "");
}

function normalizeWord(word: string): string {
  return word.trim().replace(/[\p{P}\p{S}\s]/gu, "");
}

/**
 * Finds an exact segmentation using only known vocabulary entries.
 * The target must be a complete token, not merely a substring (e.g. 喝 must
 * not qualify inside an unknown word such as 喝彩). Returns null if any
 * character cannot be covered by known words or if the target token is absent.
 */
function segmentWithKnownWords(
  sentence: string,
  knownWordsByLength: string[],
  target: string,
): string[] | null {
  const normalized = normalizeSentence(sentence);
  if (!normalized) return null;

  const memo = new Map<string, string[] | null>();

  function visit(index: number, targetUsed: boolean): string[] | null {
    if (index === normalized.length) return targetUsed ? [] : null;

    const memoKey = `${index}:${targetUsed ? 1 : 0}`;
    if (memo.has(memoKey)) return memo.get(memoKey) ?? null;

    for (const word of knownWordsByLength) {
      if (!word || !normalized.startsWith(word, index)) continue;
      const nextTargetUsed = targetUsed || word === target;
      const suffix = visit(index + word.length, nextTargetUsed);
      if (suffix !== null) {
        const result = [word, ...suffix];
        memo.set(memoKey, result);
        return result;
      }
    }

    memo.set(memoKey, null);
    return null;
  }

  return visit(0, false);
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Некорректные данные запроса." }, { status: 400 });
    }

    const target = typeof body.target === "string" ? normalizeWord(body.target) : "";
    const knownWords: string[] = Array.isArray(body.knownWords)
      ? body.knownWords.filter((word: unknown): word is string => typeof word === "string")
      : [];
    const includeDebug = body.debug === true;

    if (!target) {
      return NextResponse.json({ error: "Введите слово или иероглиф для изучения." }, { status: 400 });
    }

    const known = new Set<string>(knownWords.map(normalizeWord).filter(Boolean));
    known.add(target);
    const knownWordsByLength = [...known].sort((a, b) => b.length - a.length);

    const dataset = await loadDataset();
    const { entries, rootKeys, shape } = unwrapDataset(dataset);
    const stats = {
      datasetShape: shape,
      rootKeys,
      totalEntries: entries.length,
      targetMatches: 0,
      rejectedUnknownTags: 0,
      rejectedUnknownWords: 0,
      missingTags: 0,
      missingTranslation: 0,
      accepted: 0,
      knownWordsReceived: knownWords.length,
      knownWordsUnique: known.size,
      target,
    };
    const rejectedSamples: Array<{
      reason: string;
      sentence: string;
      tags?: string[];
      unknownWords?: string[];
    }> = [];
    const targetSamples: Array<{
      sentence: string;
      translationFound: boolean;
      tags: string[];
      segmentation?: string[] | null;
    }> = [];
    const matches: Array<{ sentence: string; translation: string }> = [];

    for (const [sentence, record] of entries) {
      if (!sentence || !sentence.includes(target)) continue;
      stats.targetMatches += 1;

      const taggedWords = getTaggedWords(record.tags);
      if (!Array.isArray(record.tags) || taggedWords.length === 0) stats.missingTags += 1;
      const translation = getTranslation(record);
      const segmentation = segmentWithKnownWords(sentence, knownWordsByLength, target);

      if (targetSamples.length < 8) {
        targetSamples.push({
          sentence,
          translationFound: Boolean(translation),
          tags: taggedWords.slice(0, 30),
          segmentation,
        });
      }

      if (!segmentation) {
        stats.rejectedUnknownWords += 1;
        // Keep the legacy counter populated for the existing debug UI.
        stats.rejectedUnknownTags += 1;
        if (rejectedSamples.length < 12) {
          rejectedSamples.push({
            reason: "Нельзя составить предложение только из known words (или target не является отдельным словом)",
            sentence,
            tags: taggedWords.slice(0, 30),
          });
        }
        continue;
      }

      if (!translation) {
        stats.missingTranslation += 1;
        if (rejectedSamples.length < 12) {
          rejectedSamples.push({ reason: "Не найден перевод", sentence, tags: taggedWords.slice(0, 30) });
        }
        continue;
      }

      stats.accepted += 1;
      matches.push({ sentence, translation });
    }

    const response: {
      results: Array<{ sentence: string; translation: string }>;
      count: number;
      debug?: typeof stats & { targetSamples: typeof targetSamples; rejectedSamples: typeof rejectedSamples };
    } = { results: matches, count: matches.length };

    if (includeDebug) {
      response.debug = { ...stats, targetSamples, rejectedSamples };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Sentence search failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось обработать словарь предложений." },
      { status: 500 },
    );
  }
}
