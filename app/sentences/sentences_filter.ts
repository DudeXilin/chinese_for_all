import { cut } from "jieba-wasm";

export type SentenceRecord = {
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

export type SentenceResult = { sentence: string; translation: string };

type RejectedSample = {
  reason: string;
  sentence: string;
  tags?: string[];
  unknownWords?: string[];
  tokens?: string[];
  knownRatio?: number;
};

type TargetSample = {
  sentence: string;
  translationFound: boolean;
  tags: string[];
  tokens: string[];
  knownRatio: number;
  targetFoundAsToken: boolean;
};

export type SentenceFilterDebug = {
  datasetShape: string;
  rootKeys: string[];
  totalEntries: number;
  targetMatches: number;
  rejectedUnknownTags: number;
  rejectedUnknownWords: number;
  missingTags: number;
  missingTranslation: number;
  accepted: number;
  knownWordsReceived: number;
  knownWordsUnique: number;
  target: string;
  minimumKnownRatio: number;
  targetSamples: TargetSample[];
  rejectedSamples: RejectedSample[];
};

export type SentenceFilterOutput = {
  results: SentenceResult[];
  count: number;
  debug: SentenceFilterDebug;
};

const DEFAULT_MINIMUM_KNOWN_RATIO = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapDataset(dataset: Dataset): {
  entries: Array<[string, SentenceRecord]>;
  rootKeys: string[];
  shape: string;
} {
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

function normalizeWord(word: string): string {
  return word.trim().replace(/[\p{P}\p{S}\s]/gu, "");
}

function isNonLexicalToken(token: string): boolean {
  // Jieba returns punctuation as tokens. Like the original miner, these do not
  // contribute to the known-word ratio. Numeric tokens are excluded as well.
  return /^[\p{P}\p{S}\s\d]+$/u.test(token);
}

function tokenizeSentence(sentence: string): string[] {
  // jieba-wasm uses Jieba's dictionary + HMM segmentation, the core approach
  // used by Destaq's Chinese Sentence Miner. Do not add per-user words to its
  // global dictionary: the server may process multiple learners concurrently.
  return cut(sentence, true)
    .map((token: string) => token.trim())
    .filter(Boolean);
}

function getLexicalTokens(tokens: string[]): string[] {
  return tokens.filter((token) => !isNonLexicalToken(token));
}

function roundRatio(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Filters and sorts sentences using the custom-understanding ratio from
 * chinese-sentence-miner: known lexical tokens / all lexical tokens.
 *
 * For this app the default threshold is 1.0 (all words must be known), because
 * examples are meant to be understandable practice, not merely mostly-known
 * reading. The target must occur as an exact Jieba token, never as a substring
 * inside a different word (e.g. 喝 does not match 喝彩).
 */
export function filterSentences(
  dataset: Dataset,
  targetInput: string,
  knownWordsInput: string[],
  minimumKnownRatio = DEFAULT_MINIMUM_KNOWN_RATIO,
): SentenceFilterOutput {
  const target = normalizeWord(targetInput);
  const known = new Set(knownWordsInput.map(normalizeWord).filter(Boolean));
  // The target is the item being practised, so it is allowed even if omitted
  // from the learner's known-word list.
  if (target) known.add(target);

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
    knownWordsReceived: knownWordsInput.length,
    knownWordsUnique: known.size,
    target,
    minimumKnownRatio,
  };

  const rejectedSamples: RejectedSample[] = [];
  const targetSamples: TargetSample[] = [];
  const matches: Array<SentenceResult & { knownRatio: number; tokenCount: number }> = [];

  for (const [sentence, record] of entries) {
    if (!sentence || (target && !sentence.includes(target))) continue;
    stats.targetMatches += 1;

    const taggedWords = getTaggedWords(record.tags);
    if (!Array.isArray(record.tags) || taggedWords.length === 0) stats.missingTags += 1;

    const translation = getTranslation(record);
    const tokens = tokenizeSentence(sentence);
    const lexicalTokens = getLexicalTokens(tokens);
    const knownCount = lexicalTokens.filter((token) => known.has(token)).length;
    const knownRatio = lexicalTokens.length ? roundRatio(knownCount / lexicalTokens.length) : 0;
    const targetFoundAsToken = !target || lexicalTokens.some((token) => token === target);

    if (targetSamples.length < 8) {
      targetSamples.push({
        sentence,
        translationFound: Boolean(translation),
        tags: taggedWords.slice(0, 30),
        tokens: tokens.slice(0, 60),
        knownRatio,
        targetFoundAsToken,
      });
    }

    if (!targetFoundAsToken) {
      stats.rejectedUnknownWords += 1;
      stats.rejectedUnknownTags += 1;
      if (rejectedSamples.length < 12) {
        rejectedSamples.push({
          reason: "Изучаемое слово не выделено Jieba как отдельное слово",
          sentence,
          tags: taggedWords.slice(0, 30),
          tokens: tokens.slice(0, 60),
          knownRatio,
        });
      }
      continue;
    }

    if (knownRatio < minimumKnownRatio) {
      stats.rejectedUnknownWords += 1;
      stats.rejectedUnknownTags += 1;
      if (rejectedSamples.length < 12) {
        rejectedSamples.push({
          reason: `Недостаточная доля знакомой лексики: ${knownRatio} < ${minimumKnownRatio}`,
          sentence,
          tags: taggedWords.slice(0, 30),
          unknownWords: [...new Set(lexicalTokens.filter((token) => !known.has(token)))].slice(0, 30),
          tokens: tokens.slice(0, 60),
          knownRatio,
        });
      }
      continue;
    }

    if (!translation) {
      stats.missingTranslation += 1;
      if (rejectedSamples.length < 12) {
        rejectedSamples.push({ reason: "Не найден перевод", sentence, tags: taggedWords.slice(0, 30), tokens: tokens.slice(0, 60), knownRatio });
      }
      continue;
    }

    stats.accepted += 1;
    matches.push({ sentence, translation, knownRatio, tokenCount: lexicalTokens.length });
  }

  // Original miner ranks by custom ratio (highest first). If ratios tie,
  // prefer shorter lexical sequences and then shorter sentence strings.
  matches.sort((a, b) =>
    b.knownRatio - a.knownRatio ||
    a.tokenCount - b.tokenCount ||
    a.sentence.length - b.sentence.length
  );

  const results = matches.map(({ sentence, translation }) => ({ sentence, translation }));

  return {
    results,
    count: results.length,
    debug: { ...stats, targetSamples, rejectedSamples },
  };
}
