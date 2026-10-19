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

const requiredColumns = ["chinese", "pinyin", "russian", "english"];
if (!headers || requiredColumns.some((header) => !headers.includes(header))) {
  throw new Error(
    `Unexpected HSK TSV header. Required columns: ${requiredColumns.join(", ")}. Received: ${headers?.join(", ") ?? "(empty)"}.`,
  );
}
if (new Set(headers).size !== headers.length) {
  throw new Error("HSK TSV header contains duplicate column names.");
}

const columnIndex = new Map(headers.map((header, index) => [header, index]));
const getColumn = (columns, name) => {
  const index = columnIndex.get(name);
  return index === undefined ? "" : (columns[index] ?? "").trim();
};

const entries = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;

  const columns = line.split("\t");
  if (columns.length !== headers.length) {
    throw new Error(
      `Invalid HSK TSV row at line ${i + 2}: expected ${headers.length} tab-separated columns based on the header, got ${columns.length}.`,
    );
  }

  const hanzi = getColumn(columns, "chinese");
  const pinyin = getColumn(columns, "pinyin");
  const russian = getColumn(columns, "russian");
  const english = getColumn(columns, "english");

  if (!hanzi) {
    throw new Error(`Missing Chinese characters in HSK TSV row at line ${i + 2}.`);
  }

  const entry = {
    hanzi,
    pinyin,
    translations: {
      rus: russian ? russian.split(/\s*;\s*/).filter(Boolean) : [],
      eng: english ? english.split(/\s*;\s*/).filter(Boolean) : [],
    },
  };

  // Keep the newer TSV metadata available without changing existing dictionary consumers.
  for (const name of ["level", "frequency", "pos", "classifiers"]) {
    const value = getColumn(columns, name);
    if (!value) continue;
    entry[name] = name === "frequency" && /^\d+(?:\.\d+)?$/.test(value) ? Number(value) : value;
  }

  entries.push(entry);
}

if (!entries.length) throw new Error("HSK TSV dictionary is empty.");

const generated = `// Generated from HSK30_FULL_DICTIONARY_RU_ENG.tsv by scripts/generate-hsk-dictionary.mjs. Do not edit manually.\nconst dictionary = ${JSON.stringify(entries)};\nexport default dictionary;\n`;
await writeFile(outputPath, generated, "utf8");
console.log(`Generated HSK dictionary module with ${entries.length} entries and columns: ${headers.join(", ")}.`);
