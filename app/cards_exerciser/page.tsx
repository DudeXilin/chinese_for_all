import CardsExerciserClient from "./CardsExerciserClient";
import lessonWords from "@/data/lesson-words.json";
import measureWords from "@/data/measure-words.json";
import lessonTheory from "@/data/theory/measure_words_theory.json";

type Theory = (typeof lessonTheory)[keyof typeof lessonTheory];

export default async function CardsExerciserPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic: topicParam } = await searchParams;
  const topic = topicParam ?? "places";
  const lesson = topic === "measure_words"
    ? { title: "Счётные слова", words: Object.keys(measureWords) }
    : lessonWords[topic as keyof typeof lessonWords];
  const theory = lessonTheory[topic as keyof typeof lessonTheory] as unknown as Theory | undefined;

  if (!lesson) {
    return (
      <main className="cards-exerciser-page min-h-screen px-4 py-6 text-white">
        <a href="/lessons" className="fixed left-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/50 text-2xl text-white/80 backdrop-blur-xl" aria-label="Назад">&lt;</a>
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-[32px] border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-2xl">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">Cards exerciser</p>
            <h1 className="text-2xl font-semibold">Тема не найдена</h1>
            <p className="mt-3 text-sm text-white/50">Выберите тему на странице уроков.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <CardsExerciserClient
      title={lesson.title}
      words={lesson.words}
      theory={theory}
    />
  );
}
