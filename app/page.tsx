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
  }



  return (

    
    <main className="min-h-screen w-full bg-black text-white relative overflow-hidden">

      {/* Background glow (как в квизе) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4f46e5_0%,transparent_45%),radial-gradient(circle_at_bottom,#7c3aed_0%,transparent_50%)] opacity-50" />

      <div className="relative z-10 w-full px-8 xl:px-20 py-2">

        {/* HEADER */}
        <header className="py-1 border-b border-white/10 text-center">
          <h1 className="text-4xl font-bold">
            DonQuizzz
          </h1>

          <p className="py-1 text-xs text-white/60 mt-1">
            Інтерактивна платформа вікторин
          </p>
        </header>

        {/* SEARCH */}
        <section className="mt-10 text-center">
          <h2 className="text-lg font-semibold mb-2">
            Знайти квіз
          </h2>

          <p className="text-white/50 text-xs mb-2">
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
            className="w-full max-w-[650px] px-12 py-2 rounded-lg bg-white/5 border border-white/10 text-sm outline-none focus:border-indigo-500 transition"
          />
          {search.length > 0 && (
            <div className="mt-3 max-w-[600px] mx-auto space-y-3">

              {filteredQuizzes.length > 0 ? (

                filteredQuizzes.slice(0, 5).map((q) => (
                  <Link
							        key={q.code}
							        href={`/quiz/${q.code}`}
							        className="block w-full"
						      >
                    <div className="flex text-left items-center justify-between rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500 hover:bg-white/10 transition">

                    
								      <div className="px-4 py-2">

									      <p className="text-sm font-semibold">
										      {q.title}
									      </p>

									      <p className="text-white/50 text-[10px] mt-1">
										      {q.category} • {q.questions.length} питань • Код: {q.code}
									      </p>

								    </div>

								    <div className="text-right px-4 py-2">

									    <p className="text-4sm text-indigo-300">
										    {q.difficulty}
									    </p>

									    {q.hasTime && (
										    <p className="text-4sm text-indigo-300">
											    ⏱ {q.timePerQuestion}с
										    </p>
									    )}  
								    </div>              
							    </div>
                </Link>

                ))

              ) : (

                <div className="px-4 py-2 rounded-lg bg-white/5 border border-red-500/30 text-red-300 text-2xl">
                  Квізів не знайдено
                </div>

              )}

            </div>
          )}
        </section>

    {/* CATEGORIES */}
    <section className="mt-12 max-w-[700px] mx-auto">
        <h2 className="text-lg font-semibold mb-3">
            Категорії
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
                "Спорт",
                "Уроки",
                "Географія",
                "Загальні знання",
                "Інше"
            ].map((cat) => (
                <Link
                    key={cat}
                    href={`/categories/${encodeURIComponent(cat)}`}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-center hover:border-indigo-500 hover:bg-white/10 transition"
                >
                    <p className="text-sm font-semibold">{cat}</p>
                </Link>
            ))}
        </div>
    </section>

        {/* NEW QUIZZES */}
        <section className="mt-12 max-w-[700px] mx-auto">
          <h2 className="text-lg font-semibold mb-3">
            Нові квізи
          </h2>

				<div className="grid md:grid-cols-2 gap-4">

					{newQuizzes.map((q) => (

						<Link
							key={q.code}
							href={`/quiz/${q.code}`}
							className="block"
						>

							<div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500 hover:bg-white/10 transition">

								<div>

									<p className="text-base font-semibold">
										{q.title}
									</p>

									<p className="text-white/50 text-xs mt-4">
										{q.category} • {q.questions.length} питань • Код: {q.code}
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
								</div>
							</div>
						</Link>
					))}
				</div>
        </section>

        {/* POPULAR QUIZZES */}
        <section className="mt-12 max-w-[700px] mx-auto pb-5">
          <h2 className="text-lg font-semibold mb-3">
            Популярні квізи
          </h2>

				<div className="space-y-4">

					{popularQuizzes.map((q) => (

						<Link
							key={q.code}
							href={`/quiz/${q.code}`}
							className="block"
						>

							<div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500 hover:bg-white/10 transition">

								<div>

									<p className="text-base font-semibold">
										{q.title}
									</p>

									<p className="text-white/50 text-xs mt-2">
										{q.category} • Код: {q.code}
									</p>

							</div>

						  <div className="text-right">

							  <p className="text-sm text-indigo-300">
								  {q.difficulty}
							  </p>

							  {q.hasTime && (
								  <p className="text-white/40 text-xs mt-2">
									  ⏱ {q.timePerQuestion}с / питання
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
        </section>

        {/* CTA */}
        <section className="flex justify-center">
          <Link href={`/create`}>
          <button className="my-12 bg-white text-black px-12 py-4 rounded-xl text-xl font-bold hover:opacity-80 transition">
            Створити квіз
          </button>
          </Link>
        </section>

      </div>
    </main>
  );
}
