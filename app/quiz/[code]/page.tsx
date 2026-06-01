"use client";

import { useRef } from "react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function QuizPage() {
  const params = useParams();
  const code = params?.code as string;

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [blink, setBlink] = useState(false);
  const [locked, setLocked] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // LOAD QUIZ
useEffect(() => {
  const loadQuiz = async () => {
    if (!code) return;

    const { data: userData } = await supabase.auth.getUser();
    setCurrentUser(userData.user);

    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("code", code)
      .single();

    if (error) return;

    setQuiz(data);

    if (userData.user && data.user_id === userData.user.id) {
      setIsOwner(true);
    }

    setLoading(false);
  };

  loadQuiz();
}, [code]);

const toggleLike = async () => {
  if (!currentUser || !quiz) return;

  const newLiked = !liked;

  setLiked(newLiked);
  setLikesCount((c) => c + (newLiked ? 1 : -1));

  if (newLiked) {
    const { error } = await supabase.from("quiz_likes").insert({
      quiz_id: quiz.id,
      user_id: currentUser.id,
    });

    if (error) {
      setLiked(false);
      setLikesCount((c) => c - 1);
    }
  } else {
    const { error } = await supabase
      .from("quiz_likes")
      .delete()
      .eq("quiz_id", quiz.id)
      .eq("user_id", currentUser.id);

    if (error) {
      setLiked(true);
      setLikesCount((c) => c + 1);
    }
  }
};

  
  // ANSWER LOGIC
  const handleAnswer = (i: number) => {
    if (selected !== null || locked) return;

    setLocked(true);
    setSelected(i);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (i === question.correct) {
      setScore((s) => s + 1);
    }

    setTimeout(() => {
      const next = questionIndex + 1;

      if (next < totalQuestions) {
        setQuestionIndex(next);
        setSelected(null);
        setLocked(false); // ✅ ВАЖНО
      } else {
        setFinished(true);
      }
    }, 1500);

    
  };

  // NORMALIZE QUESTIONS (CRITICAL FIX)
  const questions = quiz?.questions || [];

  const totalQuestions = questions.length;
  const question = questions[questionIndex];

    // UPDATE STATS
  useEffect(() => {
    if (!finished || !quiz) return;

    const updateStats = async () => {
      const { error } = await supabase
        .from("quizzes")
        .update({
          timesPlayed: (quiz.timesPlayed || 0) + 1,
        })
        .eq("code", quiz.code);

      if (error) {
        console.log("update error:", error);
      }
    };

    updateStats();
  }, [finished, quiz]);

  useEffect(() => {
    if (!quiz?.hasTime) return;

    setTimeLeft(quiz.timePerQuestion || 15);
  }, [questionIndex, quiz]);

  useEffect(() => {
    if (!quiz?.hasTime) return;
    if (!started || finished) return;
    if (locked) return;

    if (timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    // ⛔ таймер закончился → один раз триггерим авто-ответ
    if (timeLeft === 0) {
      setLocked(true);

      const next = questionIndex + 1;

      setTimeout(() => {
        if (next < totalQuestions) {
          setQuestionIndex(next);
          setSelected(null);
          setLocked(false);
          setTimeLeft(quiz.timePerQuestion || 15); // 🔥 reset таймера
        } else {
          setFinished(true);
        }
      }, 1500);
    }
  }, [timeLeft, started, finished, locked, questionIndex, quiz]);

  const isWarning = quiz?.hasTime && timeLeft <= 5 && timeLeft > 0;
  const isTimeUp = quiz?.hasTime && timeLeft <= 0;

  useEffect(() => {
    if (!quiz?.hasTime) return;
    if (timeLeft > 5 || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setBlink((b) => !b);
    }, 500); // быстрее мигание

    return () => clearInterval(interval);
  }, [timeLeft, quiz]);

useEffect(() => {
  if (!quiz) return;

  const loadLikes = async () => {
    // COUNT
    const { count } = await supabase
      .from("quiz_likes")
      .select("*", { count: "exact", head: true })
      .eq("quiz_id", quiz.id);

    setLikesCount(count || 0);

    // USER LIKE
    if (!currentUser) return;

    const { data } = await supabase
      .from("quiz_likes")
      .select("*")
      .eq("quiz_id", quiz.id)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    setLiked(!!data);
  };

  loadLikes();
}, [quiz, currentUser]);

  // LOADING STATE
if (loading) {
  return <div className="text-white">Loading...</div>;
}

if (!quiz) {
  return (
    <main className="min-h-screen w-full bg-black text-white relative overflow-hidden">

      {/* HEADER */}
        <header className="py-1 border-b border-white/10 text-center">
          <h1 className="text-4xl font-bold">
            DonQuizzz
          </h1>

          <p className="py-1 text-xs text-white/60 mt-1">
            Інтерактивна платформа вікторин
          </p>
        </header>

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4f46e5_0%,transparent_45%),radial-gradient(circle_at_bottom,#7c3aed_0%,transparent_50%)] opacity-50" />

      <div className="relative z-10 min-h-screen flex items-center justify-center">

        <div className="w-full max-w-[600px] bg-white/5 border border-white/10 rounded-xl p-15 backdrop-blur-md text-center">

          <h1 className="text-3xl font-bold mb-3">
            Квіз не знайдено 😢
          </h1>

          <p className="text-xl text-white/60 mb-10">
            Можливо, код неправильний або такого квізу не існує
          </p>

          <Link href="/">
            <button className="px-7 py-3 rounded-xl bg-white text-black text-2xl font-bold hover:opacity-80 transition">
              На головну
            </button>
          </Link>

        </div>

      </div>

    </main>
  );
}

if (!question || !Array.isArray(question.answers)) {
  return (
    <div className="text-white p-5">
      Loading quiz data...
    </div>
  );
}

if (!started) {
  return (
    <main className="min-h-screen w-full bg-black text-white relative overflow-hidden">

      {/* HEADER */}
        <header className="py-1 border-b border-white/10 text-center">
          <h1 className="text-4xl font-bold">
            DonQuizzz
          </h1>

          <p className="py-1 text-xs text-white/60 mt-1">
            Інтерактивна платформа вікторин
          </p>
        </header>

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#4f46e5_0%,transparent_40%),radial-gradient(circle_at_bottom_right,#7c3aed_0%,transparent_45%)] opacity-60" />

      <div className="relative z-10 min-h-screen flex items-center justify-center">

        <div className="w-full max-w-[600px] bg-white/5 border border-white/10 rounded-[20px] p-8 backdrop-blur-xl text-center shadow-2xl">

          {/* QUIZ CODE */}
          <div className="mb-3">
            <span className="px-5 py-2 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs">
              Код: {quiz.code}
            </span>
          </div>

          {/* TITLE */}
          <h1 className="text-2xl font-bold leading-tight mb-10">
            {quiz.title}
          </h1>

          {/* INFO */}
          <div className="flex justify-center gap-4 mb-10 flex-wrap">

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-white/50 text-xs mb-2">
                Питання
              </p>

              <p className="text-sm font-bold">
                {totalQuestions}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-white/50 text-xs mb-2">
                Категорія
              </p>

              <p className="text-sm font-bold">
                {quiz.category}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-white/50 text-xs mb-2">
                Рівень
              </p>

              <p className="text-sm font-bold">
                {quiz.difficulty}
              </p>
            </div>

            {quiz.hasTime && (
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-white/50 text-xs mb-2">
                  Час на питання
                </p>                     
                <p className="text-sm font-bold">
                  {quiz.timePerQuestion}
                </p>
              </div>
            )}

          </div>

          {/* ACTIONS */}
          {currentUser && !isOwner && (
            <button
              onClick={toggleLike}
              className={`
                mb-7 px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500 transition
                ${liked
                  ? "bg-red-500/20 border-red-400 text-red-300"
                  : "bg-white/5 border-white/10 hover:border-red-400"
                }`}
            >
              <span className="text-lg">
                {liked ? "❤️" : "🤍"}
              </span>
              <span>{likesCount}</span>
            </button>
          )}
          <div className="mb-10 flex justify-center gap-6 flex-wrap">

            {/* BACK */}
            <Link href="/">
              <button className="px-7 py-3 rounded-2xl bg-white/5 border border-white/10 text-lg hover:bg-white/10 hover:border-indigo-500 transition">
                На головну сторінку
              </button>
            </Link>

            {/* START */}
            <button
              onClick={() => setStarted(true)}
              className="px-10 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-lg font-bold hover:scale-105 hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] transition duration-300"
              >
              Почати квіз
            </button>

          </div>

          {isOwner && (
            <div className="flex gap-3 justify-center mb-4">

              <Link href={`/quiz/${quiz.code}/edit`}>
                <button className="px-4 py-2 rounded-xl bg-indigo-500">
                  ✏️ Редагувати
                </button>
              </Link>

              <button
                onClick={async () => {
                  await supabase
                    .from("quizzes")
                    .delete()
                    .eq("code", quiz.code);

                  window.location.href = "/";
                }}
                className="px-4 py-2 rounded-xl bg-red-500"
              >
                🗑 Видалити
              </button>

            </div>
          )}
        </div>
      </div>

    </main>
  );
}

if (finished) {

  const percent = Math.round((score / totalQuestions) * 100);

  let message = "Непогано 👍";

  if (percent >= 90) {
    message = "Ідеально 🔥";
  } else if (percent >= 70) {
    message = "Дуже добре 👏";
  } else if (percent >= 50) {
    message = "Нормальний результат 👍";
  } else {
    message = "Спробуй ще раз 💪";
  }

  return (
    <main className="min-h-screen w-full bg-black text-white relative overflow-hidden">

      {/* HEADER */}
        <header className="py-1 border-b border-white/10 text-center">
          <h1 className="text-4xl font-bold">
            DonQuizzz
          </h1>

          <p className="py-1 text-xs text-white/60 mt-1">
            Інтерактивна платформа вікторин
          </p>
        </header>

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4f46e5_0%,transparent_45%),radial-gradient(circle_at_bottom,#7c3aed_0%,transparent_50%)] opacity-50" />

      <div className="relative z-10 min-h-screen flex items-center justify-center">

        <div className="w-full max-w-[650px] bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-md text-center">

          {/* TITLE */}
          <h1 className="text-2xl font-bold mb-4">
            Квіз завершено 🎉
          </h1>

          {/* SCORE */}
          <p className="text-base text-white/80 mb-3 ">
            {score} / {totalQuestions}
          </p>

          {/* PERCENT */}
          <p className="text-2xl font-bold text-indigo-300 mb-3">
            {percent}%
          </p>

          {/* MESSAGE */}
          <p className="text-lg text-white/60 mb-8">
            {message}
          </p>

          {/* BUTTONS */}

          {currentUser && !isOwner && (
            <button
              onClick={toggleLike}
              className={`
                mb-7 px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500 transition
                ${liked
                  ? "bg-red-500/20 border-red-400 text-red-300"
                  : "bg-white/5 border-white/10 hover:border-red-400"
                }`}
            >
              <span className="text-lg">
                {liked ? "❤️" : "🤍"}
              </span>
              <span>{likesCount}</span>
            </button>
          )}
          <div className="flex justify-center gap-5">

            <button
              onClick={() => {
                setQuestionIndex(0);
                setSelected(null);
                setScore(0);
                setFinished(false);
              }}
              className="px-6 py-2 rounded-xl bg-white text-black text-xl font-bold hover:opacity-80 transition"
            >
              Спробувати ще раз
            </button>

            <Link href="/">
              <button className="px-6 py-2 rounded-xl bg-white/10 border border-white/10 text-xl hover:bg-white/20 transition">
                На головну
              </button>
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}

  return (
    <main className="min-h-screen w-full bg-black text-white relative overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4f46e5_0%,transparent_45%),radial-gradient(circle_at_bottom,#7c3aed_0%,transparent_50%)] opacity-50" />

      <div className="relative z-10 w-full px-6 xl:px-16 py-8 min-h-screen flex flex-col">

        {/* HEADER */}
        <header className="py-1 border-b border-white/10 text-center">
          <h1 className="text-4xl font-bold">
            DonQuizzz
          </h1>

          <p className="py-1 text-xs text-white/60 mt-1">
            Інтерактивна платформа вікторин
          </p>
        </header>

        {/* MAIN */}
        <div className="flex-1 flex items-center justify-center">

          <div className="w-full max-w-[700px]">

            <div className="bg-white/5 border border-white/10 rounded-xl p-7 xl:p-10 backdrop-blur-md">

              {/* SCORE */}
              <div className="flex justify-between mb-3 text-xs text-white/60">
                <p>Бал: {score}</p>
                <p>
                  {questionIndex + 1} / {totalQuestions}
                </p>
              </div>

              {quiz?.hasTime && (
                <div
                  className={`
                    text-center mb-2 transition-all duration-200
                      ${timeLeft <= 0 ? "text-red-600" : ""}
                      ${timeLeft <= 5 ? (blink ? "text-red-500" : "text-red-300") : "text-indigo-300"}
                  `}
                >
                  <p className="text-base font-bold">
                    ⏱ {timeLeft}s
                  </p>
                </div>
              )}

              {/* QUESTION */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-center leading-tight">
                  {question.q}
                </h1>
              </div>

              {/* ANSWERS */}
							<div className="space-y-4">
								{Array.isArray(question?.answers) &&
									question.answers.map((a: string, i: number) => {
										const isCorrect = i === question.correct;
										const isSelected = i === selected;

										let style =
											"w-full px-7 py-4 rounded-xl bg-black/30 border border-white/10 text-xl text-left transition";

										if (selected !== null || isTimeUp) {
											if (isCorrect) {
												style += " bg-green-500/30 border-green-400";
											} else if (isSelected || isTimeUp) {
												style += " bg-red-500/30 border-red-400";
											} else {
												style += " opacity-40";
											}
										} else {
											style += " hover:border-indigo-500 hover:bg-white/10";
										}

										return (
											<button
												key={i}
												onClick={() => handleAnswer(i)}
												className={style}
											>
												{a}
											</button>
										);
									})}
							</div>

            </div>

          </div>

        </div>

        {/* PROGRESS */}
        <div className="mt-3">

          <div className="flex justify-end mb-2">
            <p className="text-white/60 text-sm">
              Питання {questionIndex + 1} / {totalQuestions}
            </p>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              style={{
                width: `${((questionIndex + 1) / totalQuestions) * 100}%`,
              }}
            />
          </div>

        </div>

      </div>
    </main>
  );
}

