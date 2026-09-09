import { NextResponse } from "next/server";

/**
 * Public, read-only config for client-side code that lives outside the
 * Next.js React tree (public/index.html + public/js/auth.js).
 *
 * NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are the
 * "publishable" Supabase keys - they are meant to be exposed to the
 * browser (this is exactly what already happens inside the compiled
 * Next.js bundle via lib/supabase/client.ts). This route just lets a
 * plain <script> on a static HTML page read the same two values without
 * hardcoding them anywhere in the repo.
 *
 * No secret keys (service_role, DB passwords, etc.) are ever read or
 * returned here.
 */
export async function GET() {
  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? null,
  });
}
