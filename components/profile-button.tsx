"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfileButton() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed right-6 top-6 z-50 h-12 w-12 rounded-full border border-white/30 bg-white/20 backdrop-blur-xl shadow-lg"
      />

      {open && (
        <div className="fixed inset-0 z-40 flex items-start justify-end p-6">
          <div className="mt-14 w-80 rounded-3xl border border-white/30 bg-white/20 p-6 backdrop-blur-xl">
            {user ? (
              <>
                <p className="text-white">Профиль</p>
                <p className="mt-4 text-white/80">{user.email}</p>
                <button className="mt-6 text-white/70" onClick={() => createClient().auth.signOut()}>
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
