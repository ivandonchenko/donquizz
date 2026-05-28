import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";
import { quizzes } from "../data/quizzes";

console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function seed() {
  console.log("START");

  for (const q of quizzes) {
    const { error } = await supabase.from("quizzes").insert([
      {
        code: q.code,
        title: q.title,
        category: q.category,
        difficulty: q.difficulty,
        questions: q.questions,
        timesPlayed: 0,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.log("ERROR:", q.code, error.message);
    } else {
      console.log("Inserted:", q.code);
    }
  }

  console.log("DONE");
}

seed();