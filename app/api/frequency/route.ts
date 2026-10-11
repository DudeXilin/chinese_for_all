import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";

type FrequencyRow = Record<string, string | number>;
type FrequencyTable = { data: FrequencyRow[] };

let wordIndex: Map<string, FrequencyRow> | null = null;
let characterIndex: Map<string, FrequencyRow> | null = null;
let wordMetadataIndex: Map<string, { pinyin?: string; translation?: string }> | null = null;

async function indexWordMetadata(value: unknown, index: Map<string, { pinyin?: string; translation?: string }>): Promise<void> {
  if (Array.isArray(value)) {
    for (const item of value) await indexWordMetadata(item, index);
    return;
  }
  if (!value || typeof value !== "object") return;

  const row = value as Record<string, unknown>;
  if (typeof row.word === "string" && row.word.trim()) {
    const word = row.word.trim();
    const pinyin = typeof row.pinyin === "string" && row.pinyin.trim() ? row.pinyin.trim() : undefined;
    const translation = typeof row.translation === "string" && row.translation.trim() ? row.translation.trim() : undefined;
    if ((pinyin || translation) && !index.has(word)) index.set(word, { pinyin, translation });
  }
  for (const child of Object.values(row)) {
    if (child && typeof child === "object") await indexWordMetadata(child, index);
  }
}

async function loadMetadataFromDirectory(directory: string, index: Map<string, { pinyin?: string; translation?: string }>): Promise<void> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await loadMetadataFromDirectory(path, index);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      try {
        await indexWordMetadata(JSON.parse(await readFile(path, "utf8")), index);
      } catch {
        // Ignore unrelated or malformed data files.
      }
    }
  }
}

async function loadIndexes() {
  if (wordIndex && characterIndex && wordMetadataIndex) return;

  const [wordJson, characterJson] = await Promise.all([
    readFile(join(process.cwd(), "lib/SUBTLEX-CH/SUBTLEX-CH-WF.json"), "utf8"),
    readFile(join(process.cwd(), "lib/SUBTLEX-CH/SUBTLEX-CH-CHR.json"), "utf8"),
  ]);

  const words = JSON.parse(wordJson) as FrequencyTable;
  const characters = JSON.parse(characterJson) as FrequencyTable;

  wordIndex = new Map(words.data.map((row) => [String(row.Word ?? ""), row]));
  characterIndex = new Map(characters.data.map((row) => [String(row.Character ?? ""), row]));

  const metadata = new Map<string, { pinyin?: string; translation?: string }>();
  await loadMetadataFromDirectory(join(process.cwd(), "data"), metadata);
  wordMetadataIndex = metadata;
}

function selectFields(row: FrequencyRow | undefined, fields: string[]) {
  if (!row) return null;
  return Object.fromEntries(fields.map((field) => [field, row[field] ?? null]));
}

export async function GET(request: NextRequest) {
  const word = request.nextUrl.searchParams.get("word")?.trim();

  if (!word || Array.from(word).length > 20) {
    return NextResponse.json({ error: "Укажите китайское слово или иероглиф." }, { status: 400 });
  }

  try {
    await loadIndexes();

    const wordRow = wordIndex?.get(word);
    const characterFields = ["CHRCount", "CHR/million", "logCHR", "CHR-CD", "CHR-CD%", "logCHR-CD"];
    const wordFields = ["WCount", "W/million", "logW", "W-CD", "W-CD%", "logW-CD"];

    return NextResponse.json({
      word,
      wordFrequency: selectFields(wordRow, wordFields),
      characters: Array.from(new Set(Array.from(word))).map((character) => {
        const commonWords = (wordIndex ? Array.from(wordIndex.values()) : [])
          .filter((row) => {
            const candidate = String(row.Word ?? "");
            return candidate.length > 1 && Array.from(candidate).includes(character);
          })
          .sort((a, b) => Number(b.WCount ?? 0) - Number(a.WCount ?? 0))
          .slice(0, 10)
          .map((row) => {
            const candidate = String(row.Word ?? "");
            const metadata = wordMetadataIndex?.get(candidate);
            return {
              word: candidate,
              pinyin: metadata?.pinyin ?? null,
              translation: metadata?.translation ?? null,
              frequency: selectFields(row, wordFields),
            };
          });

        return {
          character,
          frequency: selectFields(characterIndex?.get(character), characterFields),
          commonWords,
        };
      }),
      source: "SUBTLEX-CH",
    }, {
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
    });
  } catch (error) {
    console.error("[frequency] Failed to load SUBTLEX-CH data", error);
    return NextResponse.json({ error: "Не удалось загрузить данные частотности." }, { status: 500 });
  }
}
