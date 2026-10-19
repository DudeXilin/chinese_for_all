import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const sourcePath = resolve(root, "lib/ru_en_chi_dictionary/HSK30_FULL_DICTIONARY_RU_ENG.tsv");
const outputPath = resolve(root, "lib/ru_en_chi_dictionary/hsk.generated.ts");

let source = await readFile(sourcePath, "utf8");
if (source.charCodeAt(0) === 0xfeff) source = source.slice(1);

const lines = source.split(/\r?\n/);
const headers = lines.shift()?.split("\t").map((value) => value.trim().toLowerCase());

if (!headers || headers.join("\t") !== "chinese\tpinyin\trussian\tenglish") {
  throw new Error("Unexpected HSK TSV header. Expected: chinese, pinyin, russian, english.");
}

const entries = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  const columns = line.split("\t");
  if (columns.length !== 4) {
    throw new Error(`Invalid HSK TSV row at line ${i + 2}: expected 4 tab-separated columns, got ${columns.length}.`);
  }
  const [hanzi, pinyin, russian, english] = columns.map((value) => value.trim());
  if (!hanzi) {
    throw new Error(`Missing Chinese characters in HSK TSV row at line ${i + 2}.`);
  }
  entries.push({
    hanzi,
    pinyin,
    translations: {
      rus: russian ? russian.split(/\s*;\s*/).filter(Boolean) : [],
      eng: english ? english.split(/\s*;\s*/).filter(Boolean) : [],
    },
  });
}

if (!entries.length) throw new Error("HSK TSV dictionary is empty.");

const generated = `// Generated from HSK30_FULL_DICTIONARY_RU_ENG.tsv by scripts/generate-hsk-dictionary.mjs. Do not edit manually.\nconst dictionary = ${JSON.stringify(entries)};\nexport default dictionary;\n`;
await writeFile(outputPath, generated, "utf8");
console.log(`Generated HSK dictionary module with ${entries.length} entries.`);
