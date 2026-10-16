import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const REPO = "DudeXilin/chinese_for_all";
const BRANCH = "main";
const FILE_PATH = "app/sentences/debug_list_of_known_words";
const DEFAULT_KNOWN_WORDS =
  "我,喜欢,你,朋友,那,个,他,它,她,喝,和,儿,子,了,是,的,一,生,老师,吗,水,酒,杯,茶,桌子,今天,什么,为什么";

async function getAuthContext() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    return { userId: null as string | null, isAdmin: false };
  }

  return {
    userId: claims.sub,
    isAdmin: claims.sub === process.env.ADMIN_USER_ID,
  };
}

function githubHeaders() {
  return {
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function readKnownWords() {
  const response = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
    { headers: githubHeaders(), cache: "no-store" },
  );

  if (!response.ok) {
    if (response.status === 404) return DEFAULT_KNOWN_WORDS;
    throw new Error("Не удалось прочитать список знакомых слов из GitHub.");
  }

  const existing = await response.json();
  const encoded = typeof existing.content === "string" ? existing.content.replace(/\n/g, "") : "";
  if (!encoded) return DEFAULT_KNOWN_WORDS;

  return Buffer.from(encoded, "base64").toString("utf8").trim() || DEFAULT_KNOWN_WORDS;
}

function normalizeKnownWords(value: unknown) {
  if (typeof value !== "string") return null;
  const words = value
    .split(/[,，、;；\n]+/)
    .map((word) => word.trim())
    .filter(Boolean);
  if (words.length > 1000 || words.some((word) => Array.from(word).length > 100)) return null;
  return [...new Set(words)].join(",");
}

export async function GET() {
  const [{ userId, isAdmin }, knownWordsResult] = await Promise.all([
    getAuthContext(),
    readKnownWords().then((value) => ({ value })).catch((error) => ({ error })),
  ]);

  if ("error" in knownWordsResult) {
    return NextResponse.json(
      { error: knownWordsResult.error instanceof Error ? knownWordsResult.error.message : "Не удалось прочитать список.", knownWords: DEFAULT_KNOWN_WORDS, isAdmin },
      { status: 200 },
    );
  }

  return NextResponse.json({
    knownWords: knownWordsResult.value,
    authenticated: Boolean(userId),
    isAdmin,
  });
}

export async function POST(request: Request) {
  const { userId, isAdmin } = await getAuthContext();
  if (!userId || !isAdmin) {
    return NextResponse.json({ error: "Сохранять список может только администратор." }, { status: 403 });
  }

  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json({ error: "На сервере не настроен GITHUB_TOKEN." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const knownWords = normalizeKnownWords(body?.knownWords);
  if (knownWords === null) {
    return NextResponse.json({ error: "Проверьте список: слишком длинное слово или слишком много слов." }, { status: 400 });
  }

  const headers = {
    ...githubHeaders(),
    "Content-Type": "application/json",
  };
  const getUrl = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const existingResponse = await fetch(getUrl, { headers, cache: "no-store" });

  let sha: string | undefined;
  if (existingResponse.ok) {
    const existing = await existingResponse.json();
    sha = existing.sha;
  } else if (existingResponse.status !== 404) {
    return NextResponse.json({ error: "Не удалось получить текущую версию файла из GitHub." }, { status: 502 });
  }

  const encoded = Buffer.from(knownWords + "\n", "utf8").toString("base64");
  const updateResponse = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: "Update known words for sentence search",
      content: encoded,
      sha,
      branch: BRANCH,
    }),
  });

  if (!updateResponse.ok) {
    const detail = await updateResponse.text();
    console.error("[sentences/known-words] GitHub write failed", detail);
    return NextResponse.json({ error: "GitHub не смог сохранить список. Проверьте GITHUB_TOKEN и права доступа." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, knownWords });
}
