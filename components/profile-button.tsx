"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  nickname: string | null;
};

export default function ProfileButton() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState("");

  const loadProfile = async (currentUser: any) => {
    setUser(currentUser);
    if (!currentUser) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", currentUser.id)
      .maybeSingle();

    setNickname(data?.nickname ?? "");
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => loadProfile(data.session?.user ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <>
      <button
        aria-label="Profile"
        onClick={() => setOpen(true)}
        className="fixed right-5 top-5 z-[9999] flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/70 bg-white/40 text-3xl shadow-2xl backdrop-blur-xl"
      >
        👤
      </button>

      {open && (
        <div className="fixed inset-0 z-[9998] flex justify-end bg-black/20 p-6">
          <div className="mt-20 w-80 rounded-3xl border border-white/40 bg-white/30 p-6 shadow-2xl backdrop-blur-xl">
            {user ? (
              <>
                <h2 className="text-xl text-white">Profile</h2>
                <p className="mt-3 text-white/80">{nickname || "No nickname"}</p>
              </>
            ) : (
              <p className="text-white">Login / Registration</p>
            )}
            <button className="mt-6 text-white" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
