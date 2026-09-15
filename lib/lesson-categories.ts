export type LessonCategory = {
  slug: string;
  title: string;
  description: string;
};

// Add new categories here - the /lessons grid and /lessons/[slug]
// pages both read from this single list.
export const LESSON_CATEGORIES: LessonCategory[] = [
  {
    slug: "grammar_cards",
    title: "Грамматика",
    description: "Карточки по грамматике китайского языка",
  },
  {
    slug: "reading",
    title: "Чтение",
    description: "Упражнения на чтение",
  },
];

export function getLessonCategory(slug: string): LessonCategory | undefined {
  return LESSON_CATEGORIES.find((category) => category.slug === slug);
}
