import Link from "next/link";

export const metadata = {
  title: "Chinese For All",
};

export default function LessonsPage() {
  return (
    <main className="min-h-svh bg-[#111]">
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="/scripts/liquidGL.js" />

      <Link
        href="/"
        className="cfa-lessons-back-link"
        aria-label="Назад"
      >
        <span className="cfa-lessons-back-button" aria-hidden="true">
          &lt;
        </span>
      </Link>
    </main>
  );
}
