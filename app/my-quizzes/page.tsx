"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";

export default function MyQuizzesPage() {
  const { user, profile } = useAuth();

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const userId = user?.id;

useEffect(() => {
  if (!userId) return;

  let isMounted = true;

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!isMounted) return;

    if (error) {
      console.error(error);
      setQuizzes([]);
    } else {
      setQuizzes(data || []);
    }

    setLoading(false);
  }

  load();

  return () => {
    isMounted = false;
  };
}, [userId]);

const signOut = async () => {
  await supabase.auth.signOut();
};

  return (
    <main className="min-h-screen w-full bg-black text-white relative overflow-hidden">

      {/* background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4f46e5_0%,transparent_45%),radial-gradient(circle_at_bottom,#7c3aed_0%,transparent_50%)] opacity-50" />

      <div className="relative z-10 w-full px-8 xl:px-20 py-2">

        {/* HEADER (как на главной) */}
        <header className="py-1 border-b border-white/10 text-center">
          <h1 className="text-4xl font-bold">DonQuizzz</h1>
          <p className="py-1 text-xs text-white/60 mt-1">
            Інтерактивна платформа вікторин
          </p>
        </header>

        {/* ACCOUNT */}
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

        {/* TITLE */}
        <div className="mt-10 text-center">
          <h2 className="text-2xl font-bold">Мої квізи</h2>
          <p className="text-white/50 text-sm mt-1">
            Тут всі квізи, які ти створив
          </p>
        </div>

        {/* LIST */}
        <div className="mt-10 max-w-3xl mx-auto space-y-4">

          {loading ? (
            <p className="text-white/50 text-center">Завантаження...</p>
          ) : quizzes.length === 0 ? (
            <div className="text-center text-white/50">
              Ти ще не створив жодного квізу
              <div className="mt-4">
                <Link href="/create" className="text-indigo-400 hover:text-indigo-300">
                  ➕ Створити перший квіз
                </Link>
              </div>
            </div>
          ) : (
            quizzes.map((q) => (
              <Link key={q.id} href={`/quiz/${q.code}`}>
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500 hover:bg-white/10 transition flex justify-between items-center">

                  <div>
                    <p className="font-semibold">{q.title}</p>
                    <p className="text-white/50 text-xs mt-1">
                      {q.category} • {q.questions?.length || 0} питань • {q.code}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-indigo-300 text-sm">{q.difficulty}</p>
                    <p className="text-white/40 text-xs mt-1">
                      ▶ {q.timesPlayed || 0}
                    </p>
                  </div>

                </div>
              </Link>
            ))
          )}

        </div>

          {/* CTA */}
        <section className="flex justify-center">
          <Link href={`/create`}>
          <button className="my-12 bg-white text-black px-12 py-4 rounded-xl text-xl font-bold hover:opacity-80 transition">
            Створити квіз
          </button>
          </Link>
        </section>

        {/* BACK BUTTON */}
        <div className="flex justify-center mt-10">
          <Link href="/">
            <button className="bg-white text-black px-10 py-3 rounded-xl font-bold hover:opacity-80 transition">
              Назад
            </button>
          </Link>
        </div>

      </div>

      
    </main>
  );
}