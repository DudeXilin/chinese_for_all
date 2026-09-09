"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  nickname: string | null;
};

export default function ProfileButton() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProfile = async (currentUser: any) => {
    setUser(currentUser);
    if (!currentUser) {
      setProfile(null);
      setNickname("");
      return;
    }

    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("nickname").eq("id", currentUser.id).maybeSingle();

    if (data) {
      setProfile(data);
      setNickname(data.nickname ?? "");
      return;
    }

    const { data: created } = await supabase
      .from("profiles")
      .upsert({ id: currentUser.id, nickname: null })
      .select("nickname")
      .single();

    if (created) {
      setProfile(created);
      setNickname(created.nickname ?? "");
    }
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => loadProfile(data.session?.user ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const saveNickname = async () => {
    if (!user || !nickname.trim()) return;
    setSaving(true);
    await createClient().from("profiles").update({ nickname: nickname.trim() }).eq("id", user.id);
    setSaving(false);
  };

  return (
    <>
      <button
        aria-label="Профиль"
        onClick={() => setOpen(true)}
        className="fixed right-6 top-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-white/20 text-2xl shadow-xl backdrop-blur-xl"
      >
        👤
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-start justify-end bg-black/10 p-6">
          <div className="mt-16 w-80 rounded-3xl border border-white/30 bg-white/20 p-6 shadow-2xl backdrop-blur-xl">
            {user ? (
              <>
                <p className="text-lg text-white">Профиль</p>
                <p className="mt-2 text-white/70">{user.email}</p>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Псевдоним"
                  className="mt-5 w-full rounded-2xl bg-white/20 p-3 text-white"
                />
                <button onClick={saveNickname} className="mt-3 text-white">
                  {saving ? "Сохранение..." : "Сохранить"}
                </button>
              </>
            ) : (
              <p className="text-white">Вход и регистрация</p>
            )}
            <button className="mt-6 text-white/70" onClick={() => setOpen(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}
