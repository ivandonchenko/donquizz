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

  const [user, setUser] = useState<any>(null);  
  const [showAuth, setShowAuth] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profile, setProfile] = useState<any>(null);

useEffect(() => {
  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
    }
  };

  loadUser();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setProfile(profileData);
      } else {
        setProfile(null);
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);

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

const signInWithGoogle = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
  });
};

const signIn = async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  setShowAuth(false);
};

const signUp = async () => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  if (data.user) {
    await supabase.from("profiles").insert({
      id: data.user.id,
      username,
    });
  }

  alert("Акаунт створено");
  setShowAuth(false);
};

const signOut = async () => {
  await supabase.auth.signOut();
  setUser(null);
};

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

        <div className="mt-4 flex justify-end">
          {user ? (
            <div className="relative">

              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500 hover:bg-white/10 transition"
              >
                👤 {profile?.username || user.email}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-900 border border-white/10 overflow-hidden">

                  <Link
                    href="/profile"
                    className="block px-4 py-3 hover:bg-white/5"
                  >
                    👤 Мій профіль
                  </Link>

                  <Link
                    href="/my-quizzes"
                    className="block px-4 py-3 hover:bg-white/5"
                  >
                    📝 Мої квізи
                  </Link>

                  <Link
                    href="/liked"
                    className="block px-4 py-3 hover:bg-white/5"
                  >
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
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500 hover:bg-white/10 transition"
            >
              Увійти / Зареєструватися
            </button>
          )}
        </div>

        

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

      {showAuth && (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6">

      <h2 className="text-2xl font-bold mb-6 text-center">
        {isRegister ? "Реєстрація" : "Вхід"}
      </h2>

      {isRegister && (
        <input
          type="text"
          placeholder="Логін"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
        />
      )}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
      />

      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-4 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
      />

      <button
        onClick={isRegister ? signUp : signIn}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-bold"
      >
        {isRegister ? "Зареєструватися" : "Увійти"}
      </button>

      <div className="my-4 text-center text-white/40">
        або
      </div>

      <button
        onClick={signInWithGoogle}
        className="w-full py-3 rounded-xl bg-white text-black font-semibold"
      >
        Google
      </button>

      <button
        onClick={() => setIsRegister(!isRegister)}
        className="w-full mt-4 text-indigo-400 hover:text-indigo-300"
      >
        {isRegister
          ? "Вже є акаунт?"
          : "Зареєструватися"}
      </button>

      <button
        onClick={() => setShowAuth(false)}
        className="w-full mt-2 text-white/50"
      >
        Закрити
      </button>

    </div>
    </div>
    )}
    </main>
  );
}
