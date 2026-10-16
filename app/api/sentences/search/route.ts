import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { filterSentences } from "@/app/sentences/sentences_filter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Dataset = Record<string, unknown> | unknown[];
type DatasetId = "sentences_with_translation.json" | "cmn_sentences_russian_translation.tsv" | "AMC_conversations_100K.txt";

const DATASET_PATHS: Record<DatasetId, string> = {
  "sentences_with_translation.json": path.join(process.cwd(), "lib", "TEST_SENTENCES", "sentences_with_translation.json"),
  "cmn_sentences_russian_translation.tsv": path.join(process.cwd(), "lib", "TEST_SENTENCES", "cmn_sentences_russian_translation.tsv"),
  "AMC_conversations_100K.txt": path.join(process.cwd(), "lib", "TEST_SENTENCES", "AMC_conversations_100K.txt"),
};

const datasetPromises = new Map<DatasetId, Promise<Dataset>>();

function isDatasetId(value: unknown): value is DatasetId {
  return value === "sentences_with_translation.json" || value === "cmn_sentences_russian_translation.tsv" || value === "AMC_conversations_100K.txt";
}

function parsePlainText(raw: string): Dataset {
  return raw.replace(/^\uFEFF/, "").split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((sentence, index) => ({ id: String(index + 1), sentence, translation: "" }));
}

function parseTsv(raw: string): Dataset {
  const rows = raw.replace(/^\uFEFF/, "").split(/\r?\n/);
  const sentences: Array<{ id: string; language: string; sentence: string; translation: string }> = [];

  for (const row of rows) {
    if (!row.trim()) continue;
    const columns = row.split("\t");
    if (columns.length < 4) continue;

    const [id, language, sentence, ...translationParts] = columns;
    const translation = translationParts.join("\t").trim();
    if (!sentence?.trim() || !translation) continue;

    sentences.push({
      id: id.trim(),
      language: language.trim(),
      sentence: sentence.trim(),
      translation,
    });
  }

  return sentences;
}

function loadDataset(datasetId: DatasetId): Promise<Dataset> {
  const cached = datasetPromises.get(datasetId);
  if (cached) return cached;

  const promise = readFile(DATASET_PATHS[datasetId], "utf8")
    .then((raw) => datasetId.endsWith(".tsv") ? parseTsv(raw) : datasetId.endsWith(".txt") ? parsePlainText(raw) : JSON.parse(raw) as Dataset)
    .catch((error) => {
      datasetPromises.delete(datasetId);
      throw error;
    });

  datasetPromises.set(datasetId, promise);
  return promise;
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
    const datasetId: DatasetId = isDatasetId(body.datasetId)
      ? body.datasetId
      : "sentences_with_translation.json";
    const knownWords: string[] = Array.isArray(body.knownWords)
      ? body.knownWords.filter((word: unknown): word is string => typeof word === "string")
      : [];
    const includeDebug = body.debug === true;
    const minimumKnownRatio = typeof body.minimumKnownRatio === "number"
      ? Math.min(1, Math.max(0, body.minimumKnownRatio))
      : 1;

    const dataset = await loadDataset(datasetId);
    const output = filterSentences(dataset, target, knownWords, minimumKnownRatio, datasetId.endsWith(".txt"));
    const response: {
      results: typeof output.results;
      count: number;
      datasetId: DatasetId;
      debug?: typeof output.debug;
    } = {
      results: output.results,
      count: output.count,
      datasetId,
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
