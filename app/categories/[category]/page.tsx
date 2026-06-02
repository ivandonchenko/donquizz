"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";

export default function CategoryPage() {
    const { category } = useParams<{ category: string }>();
    const router = useRouter();

    const decodedCategory = decodeURIComponent(category);

    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [sortBy, setSortBy] = useState<"popular" | "date" | "name">("popular");

    const [filterTime, setFilterTime] = useState<boolean | null>(null);
    const [minPopularity, setMinPopularity] = useState(0);
    const [minQuestions, setMinQuestions] = useState(0);
    const [difficultyFilter, setDifficultyFilter] = useState<string[]>([]);

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const { user, profile } = useAuth();

useEffect(() => {
  if (!user) return;

  const loadData = async () => {
    const { count } = await supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user?.id);
  };

  loadData();
}, [user]);

const signOut = async () => {
    await supabase.auth.signOut();
};  

    const categories = [
        "Всі категорії",
        "Спорт",
        "Уроки",
        "Географія",
        "Загальні знання",
        "Інше"
    ];

    useEffect(() => {
        async function load() {
            let query = supabase.from("quizzes").select("*");

            if (decodedCategory !== "Всі категорії") {
                query = query.eq("category", decodedCategory);
            }

            const { data } = await query;

            if (data) setQuizzes(data);
        }

        load();
    }, [decodedCategory]);

    const filteredQuizzes = useMemo(() => {
        return quizzes
            .filter((q) => {
                const matchesTime =
                    filterTime === null || q.hasTime === filterTime;

                const matchesPopularity =
                    (q.timesPlayed || 0) >= minPopularity;

                const matchesQuestions =
                    (q.questions?.length || 0) >= minQuestions;

                const matchesDifficulty =
                    difficultyFilter.length === 0 ||
                    difficultyFilter.includes(q.difficulty);

                return (
                    matchesTime &&
                    matchesPopularity &&
                    matchesQuestions &&
                    matchesDifficulty
                );
            })
            .sort((a, b) => {
                if (sortBy === "name") {
                    return a.title.localeCompare(b.title);
                }

                if (sortBy === "date") {
                    return new Date(b.created_at).getTime() -
                           new Date(a.created_at).getTime();
                }

                return (b.timesPlayed || 0) - (a.timesPlayed || 0);
            });
    }, [quizzes, sortBy, filterTime, minPopularity, minQuestions, difficultyFilter]);

    return (
        <main className="min-h-screen w-full bg-black text-white relative overflow-hidden">

            {/* BACKGROUND */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4f46e5_0%,transparent_45%),radial-gradient(circle_at_bottom,#7c3aed_0%,transparent_50%)] opacity-50" />
            

        {/* HEADER */}
        <header className="py-1 border-b border-white/10 text-center">
          <h1 className="text-4xl font-bold">
            DonQuizzz
          </h1>

          <p className="py-1 text-xs text-white/60 mt-1">
            Інтерактивна платформа вікторин
          </p>
        </header>

        {/* ACCOUNT */}
        <div className="mt-4 flex justify-end mx-20">
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

            <div className="relative z-10 max-w-4xl mx-auto px-8 py-10">

                <h1 className="text-3xl font-bold mb-3">
                    {decodedCategory}
                </h1>

                <p className="text-white/60 mb-6">
                    Квізи в категорії
                </p>

                {/* CATEGORY SWITCH */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => router.push(`/categories/${cat}`)}
                            className={`px-3 py-1 rounded-lg border transition text-sm ${
                                decodedCategory === cat
                                    ? "bg-white text-black"
                                    : "bg-white/5 border-white/10 hover:border-indigo-500"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* FILTERS */}
                <div className="flex flex-wrap gap-2 mb-6">

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                    >
                        <option value="popular">Популярність</option>
                        <option value="date">Дата</option>
                        <option value="name">Ім'я</option>
                    </select>

                    <div className="flex gap-2">
                        {["Легкий", "Середній", "Складний"].map((level) => (
                            <button
                                key={level}
                                onClick={() => {
                                setDifficultyFilter((prev) =>
                                    prev.includes(level)
                                        ? prev.filter((d) => d !== level)
                                        : [...prev, level]
                                    );
                                }}
                                className={`px-3 py-2 rounded-lg border transition text-sm ${
                                difficultyFilter.includes(level)
                                    ? "bg-indigo-500 text-black"
                                    : "bg-white/5 border-white/10 hover:border-indigo-500"
                                }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() =>
                            setFilterTime(filterTime === true ? null : true)
                        }
                        className={`px-3 py-2 rounded-lg border ${
                            filterTime === true
                                ? "bg-indigo-500 text-black"
                                : "bg-white/5 border-white/10"
                        }`}
                    >
                        ⏱ З часом
                    </button>

                    <button
                        onClick={() =>
                            setFilterTime(filterTime === false ? null : false)
                        }
                        className={`px-3 py-2 rounded-lg border ${
                            filterTime === false
                                ? "bg-indigo-500 text-black"
                                : "bg-white/5 border-white/10"
                        }`}
                    >
                        Без часу
                    </button>

                    <button
                        onClick={() =>
                            setMinPopularity(minPopularity === 10 ? 0 : 10)
                        }
                        className={`px-3 py-2 rounded-lg border ${
                            minPopularity === 10
                                ? "bg-indigo-500 text-black"
                                : "bg-white/5 border-white/10"
                        }`}
                    >
                        🔥 10+ проходів
                    </button>

                    <button
                        onClick={() => {
                            setSortBy("popular");
                            setFilterTime(null);
                            setMinPopularity(0);
                            setDifficultyFilter([]);
                            setMinQuestions(0);
                        }}
                        className="px-3 py-2 rounded-lg bg-red-500 text-black font-semibold"
                    >
                        Скинути
                    </button>
                </div>

                {/* QUIZZES */}
                <div className="space-y-4">
                    {filteredQuizzes.map((q) => (
                        <Link key={q.code} href={`/quiz/${q.code}`}>
                            <div className="mb-5 flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500 hover:bg-white/10 transition">

                                <div>
                                    <p className="text-base font-semibold">
                                        {q.title}
                                    </p>
                                    <p className="text-white/50 text-xs mt-2">
                                        {q.category} • {q.questions.length} питань • {q.code}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="text-sm text-indigo-300">
                                        {q.difficulty}
                                    </p>

                                    {q.hasTime && (
                                        <p className="text-white/40 text-xs mt-2">
                                            ⏱ {q.timePerQuestion}с
                                        </p>
                                    )}

                                    <p className="text-white/40 text-xs mt-1">
                                        ▶ {q.timesPlayed ?? 0}
                                    </p>
                                </div>

                            </div>
                        </Link>
                    ))}
                </div>

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