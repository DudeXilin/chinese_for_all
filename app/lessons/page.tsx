import Link from "next/link";

export const metadata = {
  title: "Chinese For All",
};

export default function LessonsPage() {
  return (
    <main className="min-h-svh bg-[#111]">
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="/scripts/liquidGL.js" />
      <style>{`
        html body .lil-gui.root.liquidgl-helper {
          top: auto !important;
          bottom: 1rem !important;
          left: 1rem !important;
          right: auto !important;
        }
        @media (max-width: 768px) {
          html body .lil-gui.root.liquidgl-helper {
            top: auto !important;
            bottom: 0.5rem !important;
            left: 0.5rem !important;
            right: auto !important;
          }
        }
      `}</style>

      <Link href="/" className="cfa-lessons-back-link" aria-label="Назад">
        <span className="cfa-lessons-back-button" aria-hidden="true">
          &lt;
        </span>
      </Link>
    </main>
  );
}
