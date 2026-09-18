import lessonWords from "@/data/lesson-words.json";

export default async function CardsExerciserPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic: topicParam } = await searchParams;
  const topic = topicParam ?? "places";
  const lesson = lessonWords[topic as keyof typeof lessonWords];

  if (!lesson) {
    return (
      <main className="cards-exerciser-page">
        <a href="/lessons" className="cards-exerciser-back" aria-label="Назад">&lt;</a>
        <div className="cards-exerciser-card">
          <h1>Тема не найдена</h1>
          <p>Выберите тему на странице уроков.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="cards-exerciser-page">
      <a href="/lessons" className="cards-exerciser-back" aria-label="Назад">&lt;</a>
      <section className="cards-exerciser-content">
        <h1>{lesson.title}</h1>
        <p className="cards-exerciser-subtitle">Слова из этой колоды</p>
        <div className="cards-word-list">
          {lesson.words.map((word, index) => (
            <div className="cards-word" key={word}>
              <span className="cards-word-number">{index + 1}</span>
              <span>{word}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
