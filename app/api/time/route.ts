export async function GET() {
  const now = new Date();

  return Response.json({
    now: now.toISOString(),
    unixMs: now.getTime(),
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
