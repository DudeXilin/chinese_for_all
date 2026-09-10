import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center gap-3 text-center">
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
          <CardTitle className="text-xl text-white">{nickname}</CardTitle>
          <p className="text-sm text-white/60">{claims.email}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="HSK" value={progress?.hsk_level ?? 0} />
            <Stat label="Слов" value={progress?.words_learned ?? 0} />
            <Stat label="Уроков" value={progress?.lessons_completed ?? 0} />
          </div>
          <LogoutButton />
          <a
            href="/"
            className="text-center text-sm text-white/60 underline underline-offset-4 hover:text-white"
          >
            На главную
          </a>
        </CardContent>
      </Card>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/30 bg-white/10 p-3">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  );
}
