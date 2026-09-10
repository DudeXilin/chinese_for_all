import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Tells the static homepage (public/js/auth.js) whether the visitor is
 * logged in, and their nickname if so.
 *
 * Why this exists: the login/sign-up pages use the SSR Supabase client
 * (@supabase/ssr), which stores the session in cookies. A plain
 * supabase-js client created in the browser (as public/index.html
 * previously did) uses its own separate storage and never sees those
 * cookies, so it always looked logged-out. Reading the session here,
 * server-side, from the same cookies the login page set, fixes that.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const user = data?.claims;

    if (!user) {
      return NextResponse.json({ loggedIn: false });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", user.sub)
      .maybeSingle();

    return NextResponse.json({
      loggedIn: true,
      nickname: profile?.nickname || null,
      email: user.email || null,
    });
  } catch {
    return NextResponse.json({ loggedIn: false });
  }
}
