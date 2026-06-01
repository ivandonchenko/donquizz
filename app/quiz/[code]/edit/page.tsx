"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";

type Question = {
  question: string;
  answers: string[];
  correctAnswer: number;
};

export default function EditQuizPage() {
  const MIN_TEXT_LENGTH = 3;
  const { code } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(1);

const [title, setTitle] = useState("");
const [category, setCategory] = useState("Загальні знання");
const [difficulty, setDifficulty] = useState("Середня");

const [timed, setTimed] = useState(false);
const [timeLimit, setTimeLimit] = useState(15);

const [questionCount, setQuestionCount] = useState(10);
const [questions, setQuestions] = useState<Question[]>([]);

const [currentQuestion, setCurrentQuestion] = useState(0);
const [errors, setErrors] = useState<string[]>([]);

  const [titleError, setTitleError] = useState(false);
  const [questionCountError, setQuestionCountError] = useState(false);
  const [timeLimitError, setTimeLimitError] = useState(false);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, profile } = useAuth();

useEffect(() => {
  if (!user) return;

  const loadData = async () => {
    const { count } = await supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
  };

  loadData();
}, [user]);

const signOut = async () => {
    await supabase.auth.signOut();
};  

useEffect(() => {
  const load = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      router.push("/");
      return;
    }

    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("code", code)
      .single();

    if (error || !data) {
      router.push("/");
      return;
    }

    if (data.user_id !== user.id) {
      alert("Нельзя редактировать чужой квиз");
      router.push("/");
      return;
    }

    setTitle(data.title);
    setCategory(data.category);
    setDifficulty(data.difficulty);
    setTimed(data.hasTime);
    setTimeLimit(data.timePerQuestion || 15);

    const mapped = data.questions.map((q: any) => ({
      question: q.q,
      answers: q.answers,
      correctAnswer: q.correct,
    }));

    setQuestions(mapped);
    setQuestionCount(mapped.length);

    setLoading(false);
  };

  load();
}, [code]);

const handleNext = () => {
  let hasError = false;

  setTitleError(false);
  setQuestionCountError(false);
  setTimeLimitError(false);

  if (title.trim().length < MIN_TEXT_LENGTH) {
    setTitleError(true);
    hasError = true;
  }

  if (questionCount < 3 || questionCount > 50) {
    setQuestionCountError(true);
    hasError = true;
  }

  if (timed && timeLimit < 5) {
    setTimeLimitError(true);
    hasError = true;
  }

  if (hasError) return;

  if (questions.length === 0) {
    const generatedQuestions = Array.from(
      { length: questionCount },
      () => ({
        question: "",
        answers: ["", "", "", ""],
        correctAnswer: 0,
      })
    );

    setQuestions(generatedQuestions);
  } else if (questionCount !== questions.length) {
    const updatedQuestions = [...questions];

    if (questionCount > questions.length) {
      const additionalQuestions = Array.from(
        { length: questionCount - questions.length },
        () => ({
          question: "",
          answers: ["", "", "", ""],
          correctAnswer: 0,
        })
      );

      updatedQuestions.push(...additionalQuestions);
    } else {
      updatedQuestions.splice(questionCount);
    }

    setQuestions(updatedQuestions);
  }

  setCurrentQuestion(0);
  setStep(2);
};

const updateQuestion = (
    index: number,
    field: keyof Question,
    value: string | number | string[]
  ) => {
    const updated = [...questions];

    if (field === "question") {
      updated[index].question = value as string;
    }

    if (field === "answers") {
      updated[index].answers = value as string[];
    }

    if (field === "correctAnswer") {
      updated[index].correctAnswer = value as number;
    }

    setQuestions(updated);
  };

const validateQuiz = () => {
  const newErrors: string[] = [];

  questions.forEach((question, questionIndex) => {
    if (question.question.trim().length < 3) {
      newErrors.push(`question-${questionIndex}`);
    }

    const hasAnswerError = question.answers.some(
      (answer) => answer.trim().length < 1
    );

    if (hasAnswerError) {
      newErrors.push(`answers-${questionIndex}`);
    }
  });

  setErrors(newErrors);

  if (newErrors.length > 0) {
    const firstError = newErrors[0];
    const match = firstError.match(/\d+/);

    if (match) {
      setCurrentQuestion(Number(match[0]));
    }

    return false;
  }

  return true;
};

const getQuestionStatus = (index: number) => {
  const question = questions[index];

  const hasError = errors.some(
    (error) =>
      error.startsWith(`question-${index}`) ||
      error.startsWith(`answer-${index}-`)
  );

  const isFilled =
    question.question.trim().length > 0 &&
    question.answers.every(
        (answer) => answer.trim().length > 0
    );

  if (hasError) {
    return "error";
  }

  if (isFilled) {
    return "success";
  }

  return "default";
};


const handleSave = async () => {
  const formattedQuestions = questions.map((q) => ({
    q: q.question,
    answers: q.answers,
    correct: q.correctAnswer,
  }));

  const { error } = await supabase
    .from("quizzes")
    .update({
      title,
      category,
      difficulty,
      questions: formattedQuestions,
      hasTime: timed,
      timePerQuestion: timed ? timeLimit : null,
    })
    .eq("code", code);

  if (error) {
    alert("Ошибка при обновлении");
    return;
  }

  alert("Квиз обновлён!");
  router.push(`/quiz/${code}`);
};


  if (loading) return <div className="text-white">Loading...</div>;

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

      {/* ACCOUNT MENU */}
        <div className="mt-4 flex justify-end mx-20">
          {user && (
            <div className="relative z-50">

              <button
                onClick={() => setShowProfileMenu(prev => !prev)}
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

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4f46e5_0%,transparent_45%),radial-gradient(circle_at_bottom,#7c3aed_0%,transparent_50%)] opacity-50" />

      <div className="relative z-10 w-full px-8 xl:px-20 py-2">

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-2">
          Редагування вікторини
        </h2>

        <p className="text-white/50 mb-8">
          Крок {step} із 2
        </p>

        {step === 1 && (
          <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur hover:border-indigo-500 hover:bg-white/10 transition p-6 space-y-5">
            <div>
				<label className="block mb-2 text-sm text-white/70">
					Назва вікторини:
				</label>

				{errors.includes("title") && (
					<p className="text-red-300 bg-white/5 border border-red-500/30 rounded-lg px-3 py-2 text-sm">
						Мінімум 3 символи
					</p>
				)}

				<input
					type="text"
					value={title}
					onChange={(e) => {
						const value = e.target.value;
						setTitle(value);

						setErrors((prev) => {
							const filtered = prev.filter(
								(err) => err !== "title"
							);

							if (value.trim().length < 3) {
								return [...filtered, "title"];
							}

							return filtered;
						});
					}}
					className={`w-full bg-black/30 rounded-lg px-4 py-2 border ${
						errors.includes("title")
							? "border-red-500"
							: "border-white/10"
					}`}
				/>
			</div>

            <div>
              <label className="block mb-2 text-sm text-white/70">
                Категорія
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm outline-none focus:border-indigo-500 transition"
              >
                <option>Спорт</option>
                <option>Уроки</option>
                <option>Географія</option>
                <option>Загальні знання</option>
                <option>Інше</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm text-white/70">
                Складність
              </label>

              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm outline-none focus:border-indigo-500 transition"
              >
                <option>Легкий</option>
                <option>Середній</option>
                <option>Складний</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-white/70">
                Обмеження часу
              </label>

              <input
                type="checkbox"
                checked={timed}
                onChange={(e) => setTimed(e.target.checked)}
              />
            </div>

            	{timed && (
				<div>
					<label className="flex items-center gap-2 text-sm text-white/70">
						Час на відповідь (сек)
					</label>

					{errors.includes("time") && (
						<p className="text-red-300 bg-white/5 border border-red-500/30 rounded-lg px-3 py-2 text-sm">
							Мінімум 5 секунд
						</p>
					)}

					<input
						type="number"
						min={5}
						value={timeLimit}
						onChange={(e) => {
							const value = Number(e.target.value);
							setTimeLimit(value);

							setErrors((prev) => {
								const filtered = prev.filter(
									(err) => err !== "time"
								);

								if (value < 5) {
									return [...filtered, "time"];
								}

								return filtered;
							});
						}}
						className={`w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm outline-none focus:border-indigo-500 transition ${
							errors.includes("time")
								? "border-red-500"
								: "border-white/10"
						}`}
					/>
				</div>
			)}

			<div>
				<label className="block mb-2 text-sm text-white/70">
					Вкажіть кількість питань
				</label>

				{errors.includes("count") && (
					<p className="text-red-300 bg-white/5 border border-red-500/30 rounded-lg px-3 py-2 text-sm">
						Вкажіть від 3 до 50 питань
					</p>
				)}

				<input
					type="number"
					min={3}
					max={50}
					value={questionCount}
					onChange={(e) => {
						const value = Number(e.target.value);
						setQuestionCount(value);

						setErrors((prev) => {
							const filtered = prev.filter(
								(err) => err !== "count"
							);

							if (value < 3 || value > 50) {
								return [...filtered, "count"];
							}

							return filtered;
						});
					}}
					className={`w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm outline-none focus:border-indigo-500 transition ${
						errors.includes("count")
							? "border-red-500"
							: "border-white/10"
					}`}
				/>
			</div>

            <div className="flex gap-3 mt-6">
                <Link href="/">
                <button
                    onClick={handleNext}
                    className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-lg hover:bg-white/10 hover:border-indigo-500 transitionrounded-2xl bg-white/5 border border-white/10 text-lg hover:bg-white/10 hover:border-indigo-500 transition"
                >
                    На головну сторінку
                </button>
                </Link>
                <button
                    onClick={handleNext}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-lg font-bold hover:scale-105 hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] transition duration-300"
                >
                    Далі
                </button>
            </div>
          </div>
        )}

    {step === 2 && (
  <div className="space-y-6">
    <div className="flex flex-wrap gap-2">
      {questions.map((_, index) => {
        const status = getQuestionStatus(index);

        return (
          <button
            key={index}
            onClick={() => setCurrentQuestion(index)}
            className={`w-10 h-10 rounded-lg border transition
            ${
              currentQuestion === index
                ? "border-white bg-white text-black"
                : status === "error"
                ? "border-red-500 text-red-500"
                : status === "success"
                ? "border-green-500 text-green-500"
                : "border-white/20"
            }`}
          >
            {index + 1}
          </button>
        );
      })}
    </div>

    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur hover:border-indigo-500 hover:bg-white/10 transition">
      <h3 className="font-semibold mb-4">
        Питання {currentQuestion + 1}
      </h3>
      <label className="block mb-2 text-sm text-white/70">
        Питання:
      </label>
    {errors.includes(`question-${currentQuestion}`) && (
        <p className="text-red-300 bg-white/5 border border-red-500/30 rounded-lg px-3 py-2 text-sm">
            Мінімум 3 символи
        </p>
)}
      <input
        type="text"
        placeholder="Текст питання"
        value={questions[currentQuestion].question}
        onChange={(e) => {
            const value = e.target.value;

            updateQuestion(currentQuestion, "question", value);

            if (value.trim().length >= 3) {
                setErrors((prev) =>
                    prev.filter((e) => e !== `question-${currentQuestion}`)
                );
            }
        }}
        className={`w-full rounded-lg px-4 py-2 mb-4 bg-black/30 border ${
          errors.includes(
            `question-${currentQuestion}`
          )
            ? "border-red-500"
            : "border-white/10"
        }`}
        
      />

      <label className="block mb-2 text-sm text-white/70">
        Відповіді:
      </label>
      {errors.includes(`answers-${currentQuestion}`) && (
        <p className="text-red-300 bg-white/5 border border-red-500/30 rounded-lg px-3 py-2 text-sm">
            Усі відповіді повинні містити мінімум 1 символ
        </p>
      )}

      {questions[currentQuestion].answers.map(
  (answer, answerIndex) => (
    <input
      key={answerIndex}
      type="text"
      placeholder={`Відповідь ${answerIndex + 1}`}
      value={answer}
      onChange={(e) => {
        const updatedAnswers = [
          ...questions[currentQuestion].answers,
        ];

        updatedAnswers[answerIndex] = e.target.value;

        updateQuestion(
          currentQuestion,
          "answers",
          updatedAnswers
        );

        // 🔥 авто-очистка ошибки если исправили
        const stillHasError = updatedAnswers.some(
          (a) => a.trim().length < 1
        );

        if (!stillHasError) {
          setErrors((prev) =>
            prev.filter(
              (e) =>
                e !== `answers-${currentQuestion}`
            )
          );
        }
      }}
      className={`w-full rounded-lg px-4 py-2 mb-3 bg-black/30 border ${
        errors.includes(`answers-${currentQuestion}`)
          ? "border-red-500"
          : "border-white/10"
      }`}
    />
  )
)}

    <label className="block mb-2 text-sm text-white/70">
        Правильна відповідь:
    </label>
      <select
        value={
          questions[currentQuestion].correctAnswer
        }
        onChange={(e) =>
          updateQuestion(
            currentQuestion,
            "correctAnswer",
            Number(e.target.value)
          )
        }
        className="w-full mb-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm outline-none focus:border-indigo-500 transition"
      >
        <option value={0}>
          Правильна відповідь: 1
        </option>
        <option value={1}>
          Правильна відповідь: 2
        </option>
        <option value={2}>
          Правильна відповідь: 3
        </option>
        <option value={3}>
          Правильна відповідь: 4
        </option>
      </select>


      <div className="flex gap-3 mt-6">
        <button
            onClick={() => setStep(1)}
            className="flex-1 bg-white/10 border border-white/10 hover:border-indigo-500 hover:bg-white/10 rounded-xl py-3 transition"
        >
            Налаштування
        </button>

        <button
          onClick={() =>
            setCurrentQuestion((prev) =>
              Math.max(prev - 1, 0)
            )
          }
          disabled={currentQuestion === 0}
          className="flex-1 bg-white/20 border border-white/10 hover:border-indigo-500 hover:bg-white/10 rounded-xl py-3 transition"
        >
          Назад
        </button>

        <button
          onClick={() =>
            setCurrentQuestion((prev) =>
              Math.min(
                prev + 1,
                questions.length - 1
              )
            )
          }
          disabled={
            currentQuestion ===
            questions.length - 1
          }
          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 border border-white/10 hover:border-indigo-500 hover:bg-white/10 rounded-xl py-3 transition"
        >
          Далі
        </button>
      </div>
    </div>

    <button
      onClick={handleSave}
      className="w-full bg-white text-black font-bold py-3 rounded-xl hover:opacity-80 transition"
    >
      Зберегти зміни
    </button>
    </div>
    )}
    </div>
    </div>
    </main>
  );
}