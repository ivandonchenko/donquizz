"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";


export default function Home() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [plays, setPlays] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadQuizzes() {
      const { data, error } = await supabase.from("quizzes").select("*");

      if (!error && data) {
        setQuizzes(data);
      }

      setLoading(false);
    }

    loadQuizzes();
  }, []);

  const router = useRouter();

  const filteredQuizzes = quizzes.filter((q) => {

  const value = search.toLowerCase();

  return (
    q.title.toLowerCase().includes(value) ||
    q.code.toLowerCase().includes(value)
  );
  });

  useEffect(() => {
	  const stored = localStorage.getItem("quiz_plays");

	  if (stored) {
		  setPlays(JSON.parse(stored));
	  }
  }, []);

  const enrichedQuizzes = quizzes.map((q) => ({
    ...q,
    timesPlayed: q.timesPlayed || 0,
  }));

  const popularQuizzes = [...enrichedQuizzes]
    .sort((a, b) => b.timesPlayed - a.timesPlayed)
    .slice(0, 3);

  const newQuizzes = [...enrichedQuizzes]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(0, 2);

  const handleSearch = () => {

    const found = enrichedQuizzes.find((q) => {

      const value = search.toLowerCase();

      return (
        q.title.toLowerCase().includes(value) ||
        q.code.toLowerCase() === value
      );
    });

    if (found) {
      router.push(`/quiz/${found.code}`);
    } else {
      router.push(`/quiz/notfound`);
    }
  };

  return (

    
    <main className="min-h-screen w-6xl bg-black text-white relative overflow-hidden">

      {/* Background glow (как в квизе) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4f46e5_0%,transparent_45%),radial-gradient(circle_at_bottom,#7c3aed_0%,transparent_50%)] opacity-50" />

      <div className="relative z-10 w-full px-8 xl:px-20 py-16">

        {/* HEADER */}
        <header className="py-6 border-b border-white/10 text-center">
          <h1 className="text-8xl font-bold">
            DonQuizzz
          </h1>

          <p className="py-6 text-white/60 text-2xl mt-2">
            Інтерактивна платформа вікторин
          </p>
        </header>

        {/* SEARCH */}
        <section className="mt-20 text-center">
          <h2 className="text-5xl font-semibold mb-6">
            Знайти квіз
          </h2>

          <p className="text-white/50 text-xl mb-6">
            Пошук за назвою або кодом квізу
          </p>

          <input
            type="text"
            placeholder="Наприклад: Geography або GEO101"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            className="w-full max-w-[1800px] px-12 py-8 rounded-2xl bg-white/5 border border-white/10 text-3xl outline-none focus:border-indigo-500 transition"
          />
          {search.length > 0 && (
            <div className="mt-4 max-w-[1800px] mx-auto space-y-3">

              {filteredQuizzes.length > 0 ? (

                filteredQuizzes.slice(0, 5).map((q) => (

                  <div
                    key={q.code}
                    onClick={() => router.push(`/quiz/${q.code}`)}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500 hover:bg-white/10 transition cursor-pointer text-left"
                  >
                    <p className="text-2xl font-semibold">
                      {q.title}
                    </p>

                    <p className="text-white/50 text-lg mt-1">
                      Код: {q.code}
                    </p>
                  </div>

                ))

              ) : (

                <div className="p-6 rounded-2xl bg-white/5 border border-red-500/30 text-red-300 text-2xl">
                  Квізів не знайдено
                </div>

              )}

            </div>
          )}
        </section>

        {/* CATEGORIES */}
        <section className="mt-24 max-w-[1800px] mx-auto">
          <h2 className="text-5xl font-semibold mb-12">
            Категорії
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">

            {[
              "Спорт",
              "Уроки",
              "Географія",
              "Загальні знання",  
              "Інше"
            ].map((cat) => (
              <div
                key={cat}
                className="p-10 rounded-3xl bg-white/5 border border-white/10 text-center hover:border-indigo-500 hover:bg-white/10 transition cursor-pointer"
              >
                <p className="text-3xl font-semibold">{cat}</p>
              </div>
            ))}

          </div>
        </section>

        {/* NEW QUIZZES */}
        <section className="mt-28 max-w-[1800px] mx-auto">
          <h2 className="text-5xl font-semibold mb-14">
            Нові квізи
          </h2>

				<div className="grid md:grid-cols-2 gap-8">

					{newQuizzes.map((q) => (

						<Link
							key={q.code}
							href={`/quiz/${q.code}`}
							className="block"
						>

							<div className="flex items-center justify-between p-12 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500 hover:bg-white/10 transition">

								<div>

									<p className="text-4xl font-semibold">
										{q.title}
									</p>

									<p className="text-white/50 text-2xl mt-4">
										{q.category} • {q.questions.length} питань • Код: {q.code}
									</p>

								</div>

								<div className="text-right">

									<p className="text-4xl text-indigo-300">
										{q.difficulty}
									</p>

									{q.hasTime && (
										<p className="text-white/40 text-3xl mt-2">
											⏱ {q.timePerQuestion}с
										</p>
									)}  
								</div>
							</div>
						</Link>
					))}
				</div>
        </section>

        {/* POPULAR QUIZZES */}
        <section className="mt-28 max-w-[1800px] mx-auto pb-40">
          <h2 className="text-5xl font-semibold mb-14">
            Популярні квізи
          </h2>

				<div className="space-y-10">

					{popularQuizzes.map((q) => (

						<Link
							key={q.code}
							href={`/quiz/${q.code}`}
							className="block"
						>

							<div className="flex items-center justify-between p-14 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500 hover:bg-white/10 transition">

								<div>

									<p className="text-5xl font-semibold">
										{q.title}
									</p>

									<p className="text-white/50 text-2xl mt-4">
										{q.category} • Код: {q.code}
									</p>

							</div>

						  <div className="text-right">

							  <p className="text-4xl text-indigo-300">
								  {q.difficulty}
							  </p>

							  {q.hasTime && (
								  <p className="text-white/40 text-3xl mt-2">
									  ⏱ {q.timePerQuestion}с / питання
								  </p>
							  )}

							  <p className="text-white/40 text-3xl mt-1">
								  ▶ {q.timesPlayed ?? 0}
							  </p>

						  </div>
						</div>
						</Link>
					))}
				</div>
        </section>

        {/* CTA */}
        <section className="pb-28 flex justify-center">
          <button className="bg-white text-black px-24 py-8 rounded-3xl text-4xl font-bold hover:opacity-80 transition">
            Створити квіз
          </button>
        </section>

      </div>
    </main>
  );
}