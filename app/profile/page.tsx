"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [quizzesCount, setQuizzesCount] = useState(0);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");

  const [likesCount, setLikesCount] = useState(0);
  const [receivedLikes, setReceivedLikes] = useState(0);

useEffect(() => {
  async function loadReceivedLikes() {
    if (!user) return;

    // 1. берём все квизы пользователя
    const { data: quizzes } = await supabase
      .from("quizzes")
      .select("id")
      .eq("user_id", user.id);

    if (!quizzes) return;

    const quizIds = quizzes.map(q => q.id);

    if (quizIds.length === 0) {
      setReceivedLikes(0);
      return;
    }

    // 2. считаем лайки по этим квизам
    const { count } = await supabase
      .from("quiz_likes")
      .select("*", { count: "exact", head: true })
      .in("quiz_id", quizIds);

    setReceivedLikes(count || 0);
  }

  loadReceivedLikes();
}, [user]);

useEffect(() => {
  async function loadLikes() {
    if (!user) return;

    const { count } = await supabase
      .from("quiz_likes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    setLikesCount(count || 0);
  }

  loadLikes();
}, [user]);


  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      // профиль
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      setProfile(prof);

      // количество квизов
      const { count } = await supabase
        .from("quizzes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setQuizzesCount(count || 0);
    }

    loadData();
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };


const saveUsername = async () => {
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ username })
      .eq("id", user.id);

    setProfile((p: any) => ({ ...p, username }));
    setEditing(false);
  };

  return (
    <main className="min-h-screen w-full bg-black text-white relative overflow-hidden">

      {/* background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4f46e5_0%,transparent_45%),radial-gradient(circle_at_bottom,#7c3aed_0%,transparent_50%)] opacity-50" />

      <div className="relative z-10 w-full px-8 xl:px-20 py-2">

        {/* HEADER */}
        <header className="py-1 border-b border-white/10 text-center">
          <h1 className="text-4xl font-bold">DonQuizzz</h1>
          <p className="py-1 text-xs text-white/60 mt-1">
            Інтерактивна платформа вікторин
          </p>
        </header>

        {/* ACCOUNT MENU */}
        <div className="mt-4 flex justify-end">
          {user && (
            <div className="relative">

              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500 hover:bg-white/10 transition"
              >
                👤 {profile?.username || user.email}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-900 border border-white/10 overflow-hidden">

                  <Link href="/profile" className="block px-4 py-3 hover:bg-white/5">
                    👤 Мій профіль
                  </Link>

                  <Link href="/my-quizzes" className="block px-4 py-3 hover:bg-white/5">
                    📝 Мої квізи
                  </Link>

                  <Link href="/liked" className="block px-4 py-3 hover:bg-white/5">
                    ❤️ Мої лайки
                  </Link>

                  <button
                    onClick={signOut}
                    className="w-full text-left px-4 py-3 text-red-400 hover:bg-white/5"
                  >
                    🚪 Вийти
                  </button>

                </div>
              )}

            </div>
          )}
        </div>

        {/* PROFILE CARD */}
        <div className="mt-12 max-w-3xl mx-auto">

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">

            {/* avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
                {(profile?.username || user?.email || "?")[0].toUpperCase()}
              </div>

              <div>
                {editing ? (
                <>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-black/30 border border-white/10"
                  />

                  <button
                    onClick={saveUsername}
                    className="px-3 py-2 rounded-lg bg-indigo-500 text-white"
                  >
                    Зберегти
                  </button>

                  <button
                    onClick={() => setEditing(false)}
                    className="text-white/50"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <p className="text-lg">
                        {profile?.username || "Без імені"}
                    </p>

                    <button
                        onClick={() => {
                            setEditing(true);
                            setUsername(profile?.username || "");
                        }}
                        className="text-white/50 hover:text-white transition"
                    >
                        ✏️
                    </button>
                  </div>
                </>
              )}
                <p className="text-white/50 text-sm">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">

              <div className="p-4 rounded-xl bg-black/30 border border-white/10">
                <p className="text-white/50 text-xs">Квізи</p>
                <p className="text-2xl font-bold mt-1">{quizzesCount}</p>
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-white/10">
                <p className="text-white/50 text-xs">Лайки</p>
                <p className="text-2xl font-bold mt-1">{receivedLikes}</p>
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-white/10">
                <p className="text-white/50 text-xs">Рейтинг</p>
                <p className="text-2xl font-bold mt-1">Пізніше</p>
              </div>

            </div>

            {/* actions */}
            <div className="flex gap-3 mt-6">
              <Link href="/my-quizzes" className="flex-1">
                <button className="w-full py-3 rounded-xl bg-white/10 border border-white/10 hover:border-indigo-500 hover:bg-white/10 transition">
                  Мої квізи
                </button>
              </Link>

              <Link href="/create" className="flex-1">
                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-bold hover:opacity-90 transition">
                  Створити квіз
                </button>
              </Link>
            </div>

          </div>

        </div>

        {/* CTA */}
        <section className="flex justify-center">
          <Link href={`/`}>
          <button className="my-12 bg-white text-black px-12 py-4 rounded-xl text-xl font-bold hover:opacity-80 transition">
            На головну сторінку
          </button>
          </Link>
        </section>
        
      </div>
    </main>
  );
}