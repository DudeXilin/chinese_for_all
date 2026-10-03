/**
 * Neat Pinyin Converter
 *
 * Dependency-free conversion from keyboard-friendly numbered Pinyin to
 * standard tone-marked Pinyin.
 */

export type PinyinTone = 1 | 2 | 3 | 4 | 5;

const TONE_MARKS: Record<Exclude<PinyinTone, 5>, Record<string, string>> = {
  1: { a: "ā", e: "ē", i: "ī", o: "ō", u: "ū", ü: "ǖ" },
  2: { a: "á", e: "é", i: "í", o: "ó", u: "ú", ü: "ǘ" },
  3: { a: "ǎ", e: "ě", i: "ǐ", o: "ǒ", u: "ǔ", ü: "ǚ" },
  4: { a: "à", e: "è", i: "ì", o: "ò", u: "ù", ü: "ǜ" },
};

const VOWELS = "aeiouü";

function normalizeUmlaut(input: string): string {
  return input
    .replace(/u:/gi, (match) => (match === "U:" ? "Ü" : "ü"))
    .replace(/v/gi, (match) => (match === "V" ? "Ü" : "ü"));
}

function toneVowelIndex(syllable: string): number {
  const lower = syllable.toLowerCase();

  const a = lower.indexOf("a");
  if (a !== -1) return a;

  const e = lower.indexOf("e");
  if (e !== -1) return e;

  const ou = lower.indexOf("ou");
  if (ou !== -1) return ou;

  for (let i = lower.length - 1; i >= 0; i -= 1) {
    if (VOWELS.includes(lower[i])) return i;
  }

  return -1;
}

export function applyPinyinTone(syllable: string, tone: PinyinTone): string {
  const normalized = normalizeUmlaut(syllable);
  if (tone === 5) return normalized;

  const index = toneVowelIndex(normalized);
  if (index === -1) return normalized;

  const vowel = normalized[index];
  const mark = TONE_MARKS[tone][vowel.toLowerCase()];
  if (!mark) return normalized;

  return normalized.slice(0, index) + (vowel === vowel.toLowerCase() ? mark : mark.toUpperCase()) + normalized.slice(index + 1);
}

export function convertPinyin(input: string): string {
  if (!input) return input;

  const normalized = normalizeUmlaut(input);

  return normalized.replace(/([A-Za-züÜ]+)([1-5])/g, (_match, syllable: string, toneText: string) => {
    return applyPinyinTone(syllable, Number(toneText) as PinyinTone);
  });
}

export function convertLatestPinyin(input: string): string {
  const match = input.match(/([A-Za-züÜ]+)([1-5])$/);
  if (!match || match.index === undefined) return normalizeUmlaut(input);

  return input.slice(0, match.index) + applyPinyinTone(match[1], Number(match[2]) as PinyinTone);
}
