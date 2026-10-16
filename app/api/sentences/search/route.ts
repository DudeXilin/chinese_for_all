import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { filterSentences } from "@/app/sentences/sentences_filter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Dataset = Record<string, unknown> | unknown[];
type DatasetId = "sentences_with_translation.json" | "cmn_sentences_russian_translation.tsv" | "AMC_conversations_100K.txt" | "20k_russian_simplified.tsv";

const DATASET_PATHS: Record<DatasetId, string> = {
  "sentences_with_translation.json": path.join(process.cwd(), "lib", "TEST_SENTENCES", "sentences_with_translation.json"),
  "cmn_sentences_russian_translation.tsv": path.join(process.cwd(), "lib", "TEST_SENTENCES", "cmn_sentences_russian_translation.tsv"),
  "AMC_conversations_100K.txt": path.join(process.cwd(), "lib", "TEST_SENTENCES", "AMC_conversations_100K.txt"),
  "20k_russian_simplified.tsv": path.join(process.cwd(), "lib", "TEST_SENTENCES", "20k_russian_simplified.tsv"),
};

const datasetPromises = new Map<DatasetId, Promise<Dataset>>();

function isDatasetId(value: unknown): value is DatasetId {
  return value === "sentences_with_translation.json" || value === "cmn_sentences_russian_translation.tsv" || value === "AMC_conversations_100K.txt" || value === "20k_russian_simplified.tsv";
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
    const requestedUnknownRatio = typeof body.unknownRatio === "number"
      ? Math.min(1, Math.max(0, body.unknownRatio))
      : typeof body.minimumKnownRatio === "number"
        ? 1 - Math.min(1, Math.max(0, body.minimumKnownRatio))
        : 0;
    const autoRelaxUnknownRatio = body.autoRelaxUnknownRatio === true;

    const dataset = await loadDataset(datasetId);
    const allowMissingTranslation = datasetId.endsWith(".txt");
    let effectiveUnknownRatio = requestedUnknownRatio;
    let output = filterSentences(dataset, target, knownWords, 1 - effectiveUnknownRatio, allowMissingTranslation);
    let relaxationSteps = 0;

    // If fewer than ten examples match, relax the allowed unknown-vocabulary
    // share in 0.1 increments, stopping at ten results or the 1.0 ceiling.
    while (autoRelaxUnknownRatio && output.count < 10 && effectiveUnknownRatio < 1) {
      effectiveUnknownRatio = Math.min(1, Math.round((effectiveUnknownRatio + 0.1) * 100) / 100);
      relaxationSteps += 1;
      output = filterSentences(dataset, target, knownWords, 1 - effectiveUnknownRatio, allowMissingTranslation);
    }
    const response: {
      results: typeof output.results;
      count: number;
      datasetId: DatasetId;
      requestedUnknownRatio: number;
      effectiveUnknownRatio: number;
      autoRelaxed: boolean;
      relaxationSteps: number;
      debug?: typeof output.debug;
    } = {
      results: output.results,
      count: output.count,
      datasetId,
      requestedUnknownRatio,
      effectiveUnknownRatio,
      autoRelaxed: relaxationSteps > 0,
      relaxationSteps,
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
