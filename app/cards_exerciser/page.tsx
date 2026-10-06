import CardsExerciserClient from "./CardsExerciserClient";
import lessonWords from "@/data/lesson-words.json";
import measureWords from "@/data/measure-words.json";
import lessonTheory from "@/data/theory/measure_words_theory.json";
import uiDecks from "@/data/ui-interface-decks.json";
import drinksDeck from "@/data/topics/food_and_drinks/decks/drinks.json";
import popularFoodDeck from "@/data/topics/food_and_drinks/decks/popular_food.json";
import bodyPartsDeck from "@/data/topics/body_health/decks/body_parts.json";
import medicineDeck from "@/data/topics/body_health/decks/medicine.json";
import verbsTopic from "@/data/topics/verbs/topic.json";
import adjectivesTopic from "@/data/topics/adjectives/topic.json";
import studyAndWorkTopic from "@/data/topics/study_and_work/topic.json";
import pronounsDeck from "@/data/topics/people_and_relationships/decks/pronouns.json";
import closePeopleDeck from "@/data/topics/people_and_relationships/decks/close_people.json";
import introductionsDeck from "@/data/topics/people_and_relationships/decks/introductions.json";
import communicationDeck from "@/data/topics/people_and_relationships/decks/communication.json";
import politenessDeck from "@/data/topics/people_and_relationships/decks/politeness.json";

type Theory = (typeof lessonTheory)[keyof typeof lessonTheory];
type DeckCard = { word: string; pinyin: string; translation: string };

export default async function CardsExerciserPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic: topicParam } = await searchParams;
  const topic = topicParam ?? "places";
  const uiDeck = uiDecks[topic as keyof typeof uiDecks];
  const topicDecks = {
    "food_and_drinks/drinks": drinksDeck,
    "food_and_drinks/popular_food": popularFoodDeck,
    "body_health/body_parts": bodyPartsDeck,
    "body_health/medicine": medicineDeck,
    "verbs/feelings_verbs": verbsTopic.decks[0],
    "verbs/perception_verbs": verbsTopic.decks[1],
    "adjectives/form": adjectivesTopic.decks[0],
    "adjectives/color": adjectivesTopic.decks[1],
    "study_and_work/study": studyAndWorkTopic.decks[0],
    "study_and_work/work": studyAndWorkTopic.decks[1],
    "people_and_relationships/pronouns": pronounsDeck,
    "people_and_relationships/close_people": closePeopleDeck,
    "people_and_relationships/introductions": introductionsDeck,
    "people_and_relationships/communication": communicationDeck,
    "people_and_relationships/politeness": politenessDeck,
  } as const;
  const topicDeck = topicDecks[topic as keyof typeof topicDecks];
  const lesson = topicDeck
    ? {
        title: topicDeck.title,
        words: topicDeck.words.map((card) => card.word),
        cards: topicDeck.words as DeckCard[],
      }
    : topic === "measure_words"
      ? { title: "Счётные слова", words: Object.keys(measureWords) }
      : uiDeck && "words" in uiDeck
        ? { title: uiDeck.title, words: uiDeck.words }
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
      cards={"cards" in lesson ? lesson.cards : undefined}
      theory={theory}
    />
  );
}
