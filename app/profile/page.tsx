import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { GlassInit } from "@/components/glass-init";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) {
    redirect("/auth/login");
  }

  const [{ data: profile }, { data: progress }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nickname, avatar_url")
      .eq("id", claims.sub)
      .maybeSingle(),
    supabase
      .from("learning_progress")
      .select("hsk_level, words_learned, lessons_completed")
      .eq("user_id", claims.sub)
      .maybeSingle(),
  ]);

  const nickname = profile?.nickname || claims.email || "Без никнейма";
  const initial = nickname.trim().charAt(0).toUpperCase() || "?";

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#111] p-6">
      {/* Real liquidGL WebGL glass (same library as the homepage),
          not a CSS backdrop-filter approximation. The glass layer is a
          separate decorative div behind the actual content: liquidGL
          makes its target invisible + unclickable by design so it can
          draw its own canvas in its place, so the interactive content
          (logout button, links) lives in a normal layer on top. */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="/scripts/liquidGL.js" />
      <GlassInit target=".cfa-glass" />

      <div className="relative w-full max-w-md rounded-[2rem]">
        <div className="cfa-glass absolute inset-0 rounded-[2rem]" />
        <div className="relative z-10 flex flex-col gap-5 p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/50 bg-white/20 text-3xl font-bold text-white">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={nickname}
                  className="h-full w-full object-cover"
                />
              ) : (
                initial
              )}
            </div>
            <h1 className="text-xl font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
              {nickname}
            </h1>
            <p className="text-sm text-white/70 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
              {claims.email}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="HSK" value={progress?.hsk_level ?? 0} />
            <Stat label="Слов" value={progress?.words_learned ?? 0} />
            <Stat label="Уроков" value={progress?.lessons_completed ?? 0} />
          </div>

          <LogoutButton />

          <a
            href="/"
            className="text-center text-sm text-white/70 underline underline-offset-4 hover:text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]"
          >
            На главную
          </a>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/30 bg-white/10 p-3">
      <div className="text-lg font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
        {value}
      </div>
      <div className="text-xs text-white/70 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
        {label}
      </div>
    </div>
  );
}
