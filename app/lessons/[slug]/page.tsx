import Link from "next/link";
import { notFound } from "next/navigation";
import { GlassInit } from "@/components/glass-init";
import { getLessonCategory, LESSON_CATEGORIES } from "@/lib/lesson-categories";

export function generateStaticParams() {
  return LESSON_CATEGORIES.map((category) => ({ slug: category.slug }));
}

export default async function LessonCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getLessonCategory(slug);

  if (!category) {
    notFound();
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#111] p-6">
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="/scripts/liquidGL.js" />
      <GlassInit target=".cfa-glass" />

      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem]">
        <div className="cfa-glass absolute inset-0 rounded-[2rem]" />
        <div className="relative z-10 flex flex-col items-center gap-3 p-8 text-center">
          <h1 className="text-xl font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
            {category.title}
          </h1>
          <p className="text-sm text-white/70 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
            Этот урок скоро появится здесь.
          </p>
          <Link
            href="/lessons"
            className="mt-4 text-sm text-white/70 underline underline-offset-4 hover:text-white"
          >
            Назад к выбору урока
          </Link>
        </div>
      </div>
    </main>
  );
}
