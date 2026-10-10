import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";

type FrequencyRow = Record<string, string | number>;
type FrequencyTable = { data: FrequencyRow[] };

let wordIndex: Map<string, FrequencyRow> | null = null;
let characterIndex: Map<string, FrequencyRow> | null = null;

async function loadIndexes() {
  if (wordIndex && characterIndex) return;

  const [wordJson, characterJson] = await Promise.all([
    readFile(join(process.cwd(), "lib/SUBTLEX-CH/SUBTLEX-CH-WF.json"), "utf8"),
    readFile(join(process.cwd(), "lib/SUBTLEX-CH/SUBTLEX-CH-CHR.json"), "utf8"),
  ]);

  const words = JSON.parse(wordJson) as FrequencyTable;
  const characters = JSON.parse(characterJson) as FrequencyTable;

  wordIndex = new Map(words.data.map((row) => [String(row.Word ?? ""), row]));
  characterIndex = new Map(characters.data.map((row) => [String(row.Character ?? ""), row]));
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
      characters: Array.from(new Set(Array.from(word))).map((character) => ({
        character,
        frequency: selectFields(characterIndex?.get(character), characterFields),
      })),
      source: "SUBTLEX-CH",
    }, {
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
    });
  } catch (error) {
    console.error("[frequency] Failed to load SUBTLEX-CH data", error);
    return NextResponse.json({ error: "Не удалось загрузить данные частотности." }, { status: 500 });
  }
}
