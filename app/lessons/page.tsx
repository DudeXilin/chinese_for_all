import Link from "next/link";
import { GlassInit } from "@/components/glass-init";
import { LESSON_CATEGORIES } from "@/lib/lesson-categories";

export const metadata = {
  title: "Выбор урока — Chinese For All",
};

export default function LessonsPage() {
  return (
    <main className="min-h-svh bg-[#111] px-6 py-16">
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="/scripts/liquidGL.js" />
      <GlassInit target=".cfa-glass" />

      <Link
        href="/"
        className="cfa-lessons-back-link"
        aria-label="Назад"
        data-liquid-ignore
      >
        <span className="cfa-lessons-back-button cfa-glass">&lt;</span>
      </Link>

      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-center text-2xl font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
          Что будем учить?
        </h1>
        <p className="mb-10 text-center text-sm text-white/70 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
          Выберите категорию, чтобы начать
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {LESSON_CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/lessons/${category.slug}`}
              className="relative block overflow-hidden rounded-[1.75rem]"
            >
              <div className="cfa-glass absolute inset-0 rounded-[1.75rem]" />
              <div className="relative z-10 flex flex-col gap-2 p-6">
                <h2 className="text-lg font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
                  {category.title}
                </h2>
                <p className="text-sm text-white/70 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/"
          className="mt-10 block text-center text-sm text-white/60 underline underline-offset-4 hover:text-white"
        >
          На главную
        </Link>
      </div>
    </main>
  );
}
