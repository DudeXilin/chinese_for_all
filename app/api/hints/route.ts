import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCharacterInfo } from "@/lib/Make_Me_a_Hanzi";
import { hintShardKey } from "@/lib/hints/sharding";

const REPO = "DudeXilin/chinese_for_all";
const BRANCH = "main";
const MAX_ITEM_KEY_LENGTH = 100;
const MAX_HINT_LENGTH = 1000;

type Source = "user" | "developer" | "make_me_a_hanzi" | "none";

function normalizeItemKey(value: unknown) {
  if (typeof value !== "string") return null;
  const itemKey = value.trim();
  if (!itemKey || Array.from(itemKey).length > MAX_ITEM_KEY_LENGTH) return null;
  return itemKey;
}

function normalizeHint(value: unknown) {
  if (typeof value !== "string") return null;
  const hint = value.trim();
  if (!hint || Array.from(hint).length > MAX_HINT_LENGTH) return null;
  return hint;
}

async function readDeveloperHint(itemKey: string): Promise<string | nullasync function readDeveloperHint(itemKey: string): Promise<string | null> {
  const shard = hintShardKey(itemKey);
  const filePath = `data/developer_hints/${shard}.json`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${filePath}?ref=${BRANCH}`,
      { headers, cache: "no-store" },
    );

    if (!response.ok) return null;

    const existing = await response.json();
    const encoded = typeof existing.content === "string" ? existing.content.replace(/\\n/g, "") : "";
    if (!encoded) return null;

    const data = JSON.parse(Buffer.from(encoded, "base64").toString("utf8")) as Record<string, unknown>;
    return typeof data[itemKey] === "string" && data[itemKey].trim() ? data[itemKey].trim() : null;
  } catch {
    return null;
  }
}

function makeMeAHanziHint(itemKey: string) {
  if (Array.from(itemKey).length !== 1) return null;
  return getCharacterInfo(itemKey)?.etymology?.hint?.trim() || null;
}

async function getAuthContext() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    return { supabase, userId: null as string | null, isAdmin: false };
  }

  return {
    supabase,
    userId: claims.sub,
    isAdmin: claims.sub === process.env.ADMIN_USER_ID,
  };
}

async function getUserHint(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | null,
  itemKey: string,
) {
  if (!userId) return null;

  const { data } = await supabase
    .from("user_hints")
    .select("hint")
    .eq("user_id", userId)
    .eq("item_key", itemKey)
    .maybeSingle();

  return data?.hint?.trim() || null;
}

export async function GET(request: Request) {
  const itemKey = normalizeItemKey(new URL(request.url).searchParams.get("itemKey"));
  if (!itemKey) {
    return NextResponse.json({ error: "Invalid itemKey" }, { status: 400 });
  }

  const { supabase, userId, isAdmin } = await getAuthContext();
  const userHint = await getUserHint(supabase, userId, itemKey);
  const developerHint = await readDeveloperHint(itemKey);
  const makeMeAHanzi = makeMeAHanziHint(itemKey);

  let hint: string | null = null;
  let source: Source = "none";

  if (userHint) {
    hint = userHint;
    source = "user";
  } else if (developerHint) {
    hint = developerHint;
    source = "developer";
  } else if (makeMeAHanzi) {
    hint = makeMeAHanzi;
    source = "make_me_a_hanzi";
  }

  return NextResponse.json({
    itemKey,
    hint,
    source,
    userHint,
    developerHint: isAdmin ? developerHint : null,
    authenticated: Boolean(userId),
    isAdmin,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const itemKey = normalizeItemKey(body?.itemKey);
  if (!itemKey) {
    return NextResponse.json({ error: "Invalid itemKey" }, { status: 400 });
  }

  const mode = body?.mode === "developer" ? "developer" : "user";
  const hint = normalizeHint(body?.hint);

  if (mode === "user") {
    const { supabase, userId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!hint) {
      const { error } = await supabase
        .from("user_hints")
        .delete()
        .eq("user_id", userId)
        .eq("item_key", itemKey);

      if (error) {
        return NextResponse.json({ error: "Failed to delete user hint" }, { status: 500 });
      }

      return NextResponse.json({ ok: true, hint: null });
    }

    const { error } = await supabase.from("user_hints").upsert(
      { user_id: userId, item_key: itemKey, hint, updated_at: new Date().toISOString() },
      { onConflict: "user_id,item_key" },
    );

    if (error) {
      return NextResponse.json({ error: "Failed to save user hint" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, hint, source: "user" as Source });
  }

  const { userId, isAdmin } = await getAuthContext();
  if (!userId || !isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN is not configured" }, { status: 500 });
  }

  const shard = hintShardKey(itemKey);
  const filePath = `data/developer_hints/${shard}.json`;
  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  const getUrl = `https://api.github.com/repos/${REPO}/contents/${filePath}?ref=${BRANCH}`;
  const existingResponse = await fetch(getUrl, { headers, cache: "no-store" });

  let data: Record<string, string> = {};
  let sha: string | undefined;

  if (existingResponse.ok) {
    const existing = await existingResponse.json();
    sha = existing.sha;
    try {
      data = JSON.parse(Buffer.from(existing.content.replace(/\n/g, ""), "base64").toString("utf8"));
    } catch {
      return NextResponse.json({ error: "Developer hint shard is invalid JSON" }, { status: 500 });
    }
  } else if (existingResponse.status !== 404) {
    return NextResponse.json({ error: "Failed to read developer hint shard" }, { status: 502 });
  }

  if (hint) {
    data[itemKey] = hint;
  } else {
    delete data[itemKey];
  }

  const encoded = Buffer.from(JSON.stringify(data, null, 2) + "\n", "utf8").toString("base64");
  const updateResponse = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: hint ? `Add developer hint for ${itemKey}` : `Remove developer hint for ${itemKey}`,
      content: encoded,
      sha,
      branch: BRANCH,
    }),
  });

  if (!updateResponse.ok) {
    const detail = await updateResponse.text();
    console.error("[hints] GitHub write failed", detail);
    return NextResponse.json({ error: "Failed to save developer hint" }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    hint: hint || null,
    source: hint ? "developer" : "none",
    shard,
  });
}
