export default function Home() {
  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        {/* Верхняя панель */}
        <header className="flex items-center justify-between">
          <div className="text-sm font-semibold tracking-[0.18em] text-black/70 dark:text-white/75">
            CHINESE FOR ALL ☭
          </div>

          <div className="h-10 w-10 rounded-full border border-black/10 bg-white/45 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5" />
        </header>

        {/* Главный экран */}
        <section className="flex flex-col items-center py-20 text-center sm:py-28">
          <div className="w-full">
            {/* Маленькая надпись */}
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-black/40 dark:text-white/40">
              Open • Free • For Everyone
            </p>

            {/* Главный слоган */}
            <h1 className="mx-auto mt-8 w-full max-w-[1100px] text-center font-extrabold leading-[1.15] tracking-tight">
              <span className="block whitespace-nowrap text-[clamp(1.25rem,4.2vw,4.5rem)]">
                CHINESE FREE FOR EVERYONE ☭
              </span>

              <span className="mt-3 block whitespace-nowrap text-[clamp(1.25rem,4.2vw,4.5rem)]">
                КИТАЙСКИЙ БЕСПЛАТНО ДЛЯ ВСЕХ ☭
              </span>

              <span className="mt-3 block whitespace-nowrap text-[clamp(1.25rem,4.2vw,4.5rem)] tracking-[0.08em]">
                全民免费学习中文 ☭
              </span>
            </h1>

            {/* Будущие возможности */}
            <div className="mx-auto mt-20 grid max-w-5xl gap-5 sm:grid-cols-3">
              {/* Карточка 1 */}
              <div className="group min-h-56 rounded-[2rem] border border-black/[0.08] bg-white/45 p-7 text-left shadow-[0_20px_60px_rgba(80,70,50,0.06)] backdrop-blur-2xl transition-transform duration-500 hover:-translate-y-1 dark:border-white/[0.08] dark:bg-white/[0.045]">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.045] text-xl dark:bg-white/[0.07]">
                    文
                  </div>

                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-black/30 dark:text-white/30">
                    01
                  </span>
                </div>

                <div className="mt-12">
                  <p className="text-xl font-semibold">
                    1000 самых нужных слов
                  </p>

                  <p className="mt-2 text-sm leading-6 text-black/45 dark:text-white/45">
                    Карточки для изучения китайского языка
                  </p>
                </div>
              </div>

              {/* Карточка 2 */}
              <div className="group min-h-56 rounded-[2rem] border border-black/[0.08] bg-white/45 p-7 text-left shadow-[0_20px_60px_rgba(80,70,50,0.06)] backdrop-blur-2xl transition-transform duration-500 hover:-translate-y-1 dark:border-white/[0.08] dark:bg-white/[0.045]">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.045] text-xl dark:bg-white/[0.07]">
                    学
                  </div>

                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-black/30 dark:text-white/30">
                    02
                  </span>
                </div>

                <div className="mt-12">
                  <p className="text-xl font-semibold">
                    Учись в своём ритме
                  </p>

                  <p className="mt-2 text-sm leading-6 text-black/45 dark:text-white/45">
                    Простая среда без рекламы и платных стен
                  </p>
                </div>
              </div>

              {/* Карточка 3 */}
              <div className="group min-h-56 rounded-[2rem] border border-black/[0.08] bg-white/45 p-7 text-left shadow-[0_20px_60px_rgba(80,70,50,0.06)] backdrop-blur-2xl transition-transform duration-500 hover:-translate-y-1 dark:border-white/[0.08] dark:bg-white/[0.045]">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.045] text-xl dark:bg-white/[0.07]">
                    ☯
                  </div>

                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-black/30 dark:text-white/30">
                    03
                  </span>
                </div>

                <div className="mt-12">
                  <p className="text-xl font-semibold">
                    Твой прогресс
                  </p>

                  <p className="mt-2 text-sm leading-6 text-black/45 dark:text-white/45">
                    Сколько уже знаешь и сколько ещё впереди
                  </p>
                </div>
              </div>
            </div>

            {/* Описание проекта */}
            <div className="mx-auto mt-20 max-w-2xl text-base leading-7 text-black/60 dark:text-white/60 sm:text-lg">
              <p>
                Это среда с карточками для изучения китайского.
                Всё бесплатно, код открытый. Есть всё необходимое.
              </p>

              <p className="mt-5 font-semibold text-black/75 dark:text-white/75">
                В помойку мошенников! Знания — бесценны!
              </p>
            </div>

            {/* Будущая зона с мусоркой */}
            <div className="mx-auto mt-20 max-w-3xl rounded-[2.5rem] border border-black/[0.07] bg-white/25 px-8 py-12 shadow-[0_20px_80px_rgba(80,70,50,0.04)] backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.025]">
              <div className="text-5xl opacity-70">🗑️</div>

              <p className="mt-5 text-sm font-medium uppercase tracking-[0.2em] text-black/35 dark:text-white/35">
                Всё лишнее отправляется сюда
              </p>

              <p className="mt-3 text-sm text-black/40 dark:text-white/40">
                Google · Duolingo · App Store · 💵 · ₽
              </p>
            </div>

            {/* GitHub / вклад сообщества */}
            <div className="mx-auto mt-20 max-w-2xl pb-12">
              <p className="text-sm leading-6 text-black/45 dark:text-white/45">
                Проект открыт для всех. Предлагай изменения, улучшения и
                новые идеи через GitHub. Каждый, кто внесёт вклад, будет
                указан среди участников проекта и получит свою красивую
                медаль.
              </p>

              <a
                href="https://github.com/DudeXilin/chinese_for_all"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center rounded-full border border-black/10 bg-white/45 px-6 py-3 text-sm font-medium shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/65 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                GitHub проекта →
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
