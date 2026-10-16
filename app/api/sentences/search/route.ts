import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { filterSentences } from "@/app/sentences/sentences_filter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Некорректные данные запроса." }, { status: 400 });
    }

    const target = typeof body.target === "string" ? body.target : "";
    const knownWords: string[] = Array.isArray(body.knownWords)
      ? body.knownWords.filter((word: unknown): word is string => typeof word === "string")
      : [];
    const includeDebug = body.debug === true;
    const minimumKnownRatio = typeof body.minimumKnownRatio === "number"
      ? Math.min(1, Math.max(0, body.minimumKnownRatio))
      : 1;

    if (!target.trim()) {
      return NextResponse.json({ error: "Введите слово или иероглиф для изучения." }, { status: 400 });
    }

    const dataset = await loadDataset();
    const output = filterSentences(dataset, target, knownWords, minimumKnownRatio);
    const response: {
      results: typeof output.results;
      count: number;
      debug?: typeof output.debug;
    } = {
      results: output.results,
      count: output.count,
    };

    if (includeDebug) response.debug = output.debug;

    return NextResponse.json(response);
  } catch (error) {
    console.error("Sentence search failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось обработать словарь предложений." },
      { status: 500 },
    );
  }
}
