import hskDictionary from "./hsk.json";

type HskEntry = {
  hanzi?: string;
  pinyin?: string;
  translations?: {
    rus?: string[];
  };
};

const entries = hskDictionary as HskEntry[];

const russianTranslations = new Map<string, string>();
const pinyinByWord = new Map<string, string>();
for (const entry of entries) {
  const word = entry.hanzi?.trim();
  const translations = entry.translations?.rus?.map((value) => value.trim()).filter(Boolean);
  if (word && entry.pinyin?.trim() && !pinyinByWord.has(word)) pinyinByWord.set(word, entry.pinyin.trim());
  if (word && translations?.length && !russianTranslations.has(word)) {
    russianTranslations.set(word, translations.join("; "));
  }
}

/** Returns a Russian translation from the local HSK dictionary, if available. */
export function getRussianTranslation(word: string): string | undefined {
  return russianTranslations.get(word.trim());
}

/** Returns translations for the requested words, preserving the input order. */
export function getRussianTranslations(words: Iterable<string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const word of words) {
    const translation = getRussianTranslation(word);
    if (translation) result[word] = translation;
  }
  return result;
}

/** Returns Russian translations for HSK entries that are single characters. */
export function getSingleCharacterRussianTranslations(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [word, translation] of russianTranslations) {
    if (Array.from(word).length === 1) result[word] = translation;
  }
  return result;
}

/** Returns pinyin from the local HSK dictionary, if available. */
export function getPinyin(word: string): string | undefined {
  return pinyinByWord.get(word.trim());
}

/** Returns pinyin for the requested words, preserving the input keys. */
export function getPinyins(words: Iterable<string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const word of words) {
    const value = getPinyin(word);
    if (value) result[word] = value;
  }
  return result;
}
