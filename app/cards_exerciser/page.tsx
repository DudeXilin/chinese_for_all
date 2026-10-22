import CardsExerciserClient, { type DeckCard } from "./CardsExerciserClient";
import lessonWords from "@/data/lesson-words.json";
import measureWords from "@/data/measure-words.json";
import lessonTheory from "@/data/theory/measure_words_theory.json";
import uiDecks from "@/data/ui-interface-decks.json";
import adjectivesTopic from "@/data/topics/adjectives/topic.json";
import foodAndDrinksTopic from "@/data/topics/food_and_drinks/topic.json";
import bodyHealthTopic from "@/data/topics/body_health/topic.json";
import verbsTopic from "@/data/topics/verbs/topic.json";
import studyAndWorkTopic from "@/data/topics/study_and_work/topic.json";
import homeTopic from "@/data/topics/home/topic.json";
import peopleTopic from "@/data/topics/people_and_relationships/topic.json";
import testDeck from "@/data/test_deck.json";
import { getPinyins, getRussianTranslations, getSingleCharacterPinyins, getSingleCharacterRussianTranslations, getPartOfSpeechTranslations } from "@/lib/ru_en_chi_dictionary";
import { createClient } from "@/lib/supabase/server";

type Theory = (typeof lessonTheory)[keyof typeof lessonTheory];

export default async function CardsExerciserPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; mode?: string }>;
}) {
  const { topic: topicParam, mode } = await searchParams;

  if (mode === "hard") {
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    const userId = claims?.claims?.sub;

    if (!userId) {
      return (
        <main className="cards-exerciser-page flex min-h-screen items-center justify-center px-4 py-8 text-white">
          <section className="w-full max-w-lg rounded-[28px] border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-2xl">
            <h1 className="text-2xl font-semibold">Сложные слова</h1>
            <p className="mt-3 text-sm leading-6 text-white/55">Войдите в аккаунт, чтобы загрузить карточки из вашей системы FSRS.</p>
            <a href="/profile" className="mt-6 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm text-white/85 transition hover:bg-white/15">Войти в аккаунт</a>
            <a href="/working_table" className="mt-4 block text-sm text-white/45 transition hover:text-white/75">Вернуться на рабочий стол</a>
          </section>
        </main>
      );
    }

    const { data: fsrsCards, error } = await supabase
      .from("fsrs_cards")
      .select("word, scheduled_days")
      .eq("user_id", userId)
      .lt("scheduled_days", 30)
      .order("scheduled_days", { ascending: true });

    if (error) {
      console.error("[FSRS-6] failed to load difficult cards", error);
      return (
        <main className="cards-exerciser-page flex min-h-screen items-center justify-center px-4 py-8 text-white">
          <section className="w-full max-w-lg rounded-[28px] border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-2xl">
            <h1 className="text-2xl font-semibold">Не удалось загрузить карточки</h1>
            <p className="mt-3 text-sm text-white/55">Попробуйте обновить страницу позже.</p>
            <a href="/working_table" className="mt-6 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm text-white/85 transition hover:bg-white/15">Вернуться на рабочий стол</a>
          </section>
        </main>
      );
    }

    const hardWords = (fsrsCards ?? []).map((card) => card.word);
    if (hardWords.length === 0) {
      return (
        <main className="cards-exerciser-page flex min-h-screen items-center justify-center px-4 py-8 text-white">
          <section className="w-full max-w-lg rounded-[28px] border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-2xl">
            <h1 className="text-2xl font-semibold">Сложных карточек пока нет</h1>
            <p className="mt-3 text-sm leading-6 text-white/55">Здесь появятся слова с интервалом FSRS меньше 30 дней.</p>
            <a href="/working_table" className="mt-6 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm text-white/85 transition hover:bg-white/15">Вернуться на рабочий стол</a>
          </section>
        </main>
      );
    }

    const dictionaryTranslations = { ...getSingleCharacterRussianTranslations(), ...getRussianTranslations(hardWords) };
    const dictionaryPinyins = { ...getSingleCharacterPinyins(), ...getPinyins(hardWords) };
    const dictionaryPartsOfSpeech = getPartOfSpeechTranslations(hardWords);

    return (
      <CardsExerciserClient
        title="Сложные слова"
        words={hardWords}
        dictionaryTranslations={dictionaryTranslations}
        dictionaryPinyins={dictionaryPinyins}
        dictionaryPartsOfSpeech={dictionaryPartsOfSpeech}
      />
    );
  }

  const topic = topicParam ?? "places";
  const uiDeck = uiDecks[topic as keyof typeof uiDecks];
  const topicFolders = {
    food_and_drinks: foodAndDrinksTopic,
    body_health: bodyHealthTopic,
    verbs: verbsTopic,
    adjectives: adjectivesTopic,
    study_and_work: studyAndWorkTopic,
    home: homeTopic,
    people_and_relationships: peopleTopic,
  } as const;
  const topicDecks = Object.fromEntries(
    Object.entries(topicFolders).flatMap(([folder, topicData]) =>
      topicData.decks.map((deck) => [
        `${folder}/${deck.id}`,
        { title: deck.title, words: deck.words.map((word) => ({ word })) },
      ]),
    ),
  ) as Record<string, { title: string; words: DeckCard[] }>;
  const topicDeck = topicDecks[topic as keyof typeof topicDecks] as { title: string; words: DeckCard[] } | undefined;
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
  const dictionaryWords = lesson ? lesson.words : [];
  const dictionaryTranslations = { ...getSingleCharacterRussianTranslations(), ...getRussianTranslations(dictionaryWords) };
  const dictionaryPinyins = { ...getSingleCharacterPinyins(), ...getPinyins(dictionaryWords) };
  const dictionaryPartsOfSpeech = getPartOfSpeechTranslations(dictionaryWords);

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
      dictionaryTranslations={dictionaryTranslations}
      dictionaryPinyins={dictionaryPinyins}
      dictionaryPartsOfSpeech={dictionaryPartsOfSpeech}
    />
  );
}
