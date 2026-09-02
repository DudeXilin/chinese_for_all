export default function Home() {
  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <div className="text-sm font-semibold tracking-[0.18em]">
            CHINESE FOR ALL ☭
          </div>

          <div className="h-9 w-9 rounded-full border border-black/10 bg-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-white/5" />
        </header>

        <section className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
          <div className="max-w-4xl">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-black/45 dark:text-white/45">
              Open • Free • For Everyone
            </p>

            <h1 className="mt-8 w-full text-center text-[clamp(1.35rem,4.5vw,4.5rem)] font-extrabold leading-[1.15] tracking-tight whitespace-nowrap">
              <span className="block">CHINESE FREE FOR EVERYONE ☭</span>
              <span className="mt-3 block">КИТАЙСКИЙ БЕСПЛАТНО ДЛЯ ВСЕХ ☭</span>
              <span className="mt-3 block">全民免费学习中文 ☭</span>
            </h1>

            <div className="mt-16 grid gap-4 sm:grid-cols-3">
              <div className="min-h-48 rounded-3xl border border-black/10 bg-white/45 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5" />
              <div className="min-h-48 rounded-3xl border border-black/10 bg-white/45 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5" />
              <div className="min-h-48 rounded-3xl border border-black/10 bg-white/45 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5" />
            </div>

            <div className="mx-auto mt-16 max-w-2xl text-base leading-7 text-black/60 dark:text-white/60 sm:text-lg">
              <p>
                Это среда с карточками для изучения китайского.
                Всё бесплатно, код открытый. Есть всё необходимое.
              </p>

              <p className="mt-4 font-medium">
                В помойку мошенников! Знания — бесценны!
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
