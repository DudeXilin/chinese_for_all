import hskDictionary from "./hsk.generated";
import radicalDictionary from "./chinese_214_simplified_radicals_russian.json";
import { PARTS_OF_SPEECH } from "./parts-of-speech";

type DictionaryEntry = {
  hanzi?: string;
  pinyin?: string;
  translations?: {
    rus?: string[];
    eng?: string[];
  };
  pos?: string;
};

const hskEntries = hskDictionary as DictionaryEntry[];
const radicalEntries = radicalDictionary as DictionaryEntry[];

// Radical entries take priority; HSK fills in words and characters not covered there.
const russianTranslations = new Map<string, string>();
const pinyinByWord = new Map<string, string>();
const partOfSpeechByWord = new Map<string, string>();

for (const entry of radicalEntries) {
  const word = entry.hanzi?.trim();
  const translations = entry.translations?.rus?.map((value) => value.trim()).filter(Boolean);
  if (word && entry.pinyin?.trim() && !pinyinByWord.has(word)) pinyinByWord.set(word, entry.pinyin.trim());
  if (word && translations?.length && !russianTranslations.has(word)) {
    russianTranslations.set(word, translations.join("; "));
  }
}

for (const entry of hskEntries) {
  const word = entry.hanzi?.trim();
  const translations = entry.translations?.rus?.map((value) => value.trim()).filter(Boolean);
  if (word && entry.pinyin?.trim() && !pinyinByWord.has(word)) pinyinByWord.set(word, entry.pinyin.trim());
  if (word && translations?.length && !russianTranslations.has(word)) {
    russianTranslations.set(word, translations.join("; "));
  }
  if (word && entry.pos?.trim() && !partOfSpeechByWord.has(word)) {
    const labels = entry.pos.split(/[,;\s]+/).map((code) => PARTS_OF_SPEECH[code.trim().toLowerCase()]?.ru).filter(Boolean);
    if (labels.length) partOfSpeechByWord.set(word, [...new Set(labels)].join(", "));
  }
}

/** Returns a Russian translation from the radical dictionary first, then HSK. */
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

/** Returns Russian translations for single-character entries in either dictionary. */
export function getSingleCharacterRussianTranslations(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [word, translation] of russianTranslations) {
    if (Array.from(word).length === 1) result[word] = translation;
  }
  return result;
}

/** Returns pinyin from the radical dictionary first, then HSK. */
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

/** Returns pinyin for single-character entries in either dictionary. */
export function getSingleCharacterPinyins(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [word, value] of pinyinByWord) {
    if (Array.from(word).length === 1) result[word] = value;
  }
  return result;
}


/** Returns Russian part-of-speech labels for the requested words. */
export function getPartOfSpeechTranslations(words: Iterable<string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const word of words) {
    const value = partOfSpeechByWord.get(word.trim());
    if (value) result[word] = value;
  }
  return result;
}
