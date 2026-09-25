import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-static";

const HANZI_ROOT = path.join(process.cwd(), "lib", "HanziWriter");

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;

  if (!segments?.length) return new Response("Not found", { status: 404 });

  const requestedPath = segments.join("/");
  let filePath: string;
  let contentType: string;

  if (requestedPath === "library.js") {
    filePath = path.join(HANZI_ROOT, "hanzi-writer.min.js");
    contentType = "application/javascript; charset=utf-8";
  } else if (segments.length === 2 && segments[0] === "data" && segments[1].endsWith(".json")) {
    const character = segments[1].slice(0, -".json".length);
    if (Array.from(character).length !== 1) return new Response("Not found", { status: 404 });
    filePath = path.join(HANZI_ROOT, "data", character + ".json");
    contentType = "application/json; charset=utf-8";
  } else {
    return new Response("Not found", { status: 404 });
  }

  try {
    const content = await readFile(filePath);
    return new Response(content, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
