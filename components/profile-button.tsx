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
    const { data } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setNickname(data.nickname ?? "");
      return;
    }

    const initialNickname = currentUser.user_metadata?.nickname ?? "";
    const { data: created } = await supabase
      .from("profiles")
      .upsert({ id: currentUser.id, nickname: initialNickname || null })
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
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .update({ nickname: nickname.trim(), updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("nickname")
      .single();

    if (data) setProfile(data);
    setSaving(false);
  };

  const signOut = async () => {
    await createClient().auth.signOut();
    setOpen(false);
  };

  return (
    <>
      <button
        aria-label="Профиль"
        onClick={() => setOpen(true)}
        className="fixed right-6 top-6 z-50 h-12 w-12 rounded-full border border-white/30 bg-white/20 shadow-lg backdrop-blur-xl"
      />

      {open && (
        <div className="fixed inset-0 z-40 flex items-start justify-end bg-black/10 p-6">
          <div className="mt-14 w-80 rounded-3xl border border-white/30 bg-white/20 p-6 shadow-2xl backdrop-blur-xl">
            {user ? (
              <>
                <p className="text-lg font-medium text-white">Профиль</p>
                <p className="mt-2 text-sm text-white/70">{user.email}</p>

                <div className="mt-6">
                  <label htmlFor="nickname" className="text-sm text-white/80">
                    Псевдоним
                  </label>
                  <input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Твой псевдоним"
                    className="mt-2 w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-white outline-none placeholder:text-white/50"
                  />
                  <button
                    onClick={saveNickname}
                    disabled={saving || !nickname.trim()}
                    className="mt-3 rounded-2xl border border-white/30 bg-white/20 px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {saving ? "Сохранение..." : "Сохранить"}
                  </button>
                </div>

                <button className="mt-6 block text-white/70" onClick={signOut}>
                  Выйти
                </button>
              </>
            ) : (
              <p className="text-white">Вход и регистрация</p>
            )}
            <button className="mt-6 block text-white/70" onClick={() => setOpen(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}
