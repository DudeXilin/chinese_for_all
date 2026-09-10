import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Nothing to sign out of if Supabase isn't configured - fall through.
  }
  return NextResponse.json({ ok: true });
}
