"use client";

import { PointerEvent, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { GlassInit } from "@/components/glass-init";
import foodAndDrinksTopic from "@/data/topics/food_and_drinks/topic.json";
import drinksDeck from "@/data/topics/food_and_drinks/decks/drinks.json";
import peopleTopic from "@/data/topics/people_and_relationships/topic.json";
import pronounsDeck from "@/data/topics/people_and_relationships/decks/pronouns.json";
import closePeopleDeck from "@/data/topics/people_and_relationships/decks/close_people.json";
import introductionsDeck from "@/data/topics/people_and_relationships/decks/introductions.json";
import communicationDeck from "@/data/topics/people_and_relationships/decks/communication.json";
import politenessDeck from "@/data/topics/people_and_relationships/decks/politeness.json";

// See docs/LIQUIDGL.md for the six ground rules this page is built around
// (Rules #1-#6). Summary, since this page leans on all of them at once:
//
// #1 content that must stay readable goes INSIDE a .cfa-glass target as a
//    real DOM child, never beside it - N/A here, our lens carries no text.
// #2 every .cfa-glass target's nearest positioned ancestor must share one
//    z-index across the whole page (the shared canvas sits at that max
//    value minus 1).
// #3 no position:fixed anywhere on the path from <body> down to content
//    that needs to be captured - liquidGL's snapshot walk skips the
//    entire subtree of any fixed element, full stop. This applies at
//    every level, not just the page root.
// #4 real-time refraction of something that's moving only works for
//    JS/GSAP-driven movement, not CSS transitions/animations - and the
//    moving element must be registered with liquidGL.registerDynamic().
// #5 a .cfa-glass target must not be nested inside a DOM parent with its
//    own opaque background - the shared canvas is z-index:0 in <body>,
//    so an opaque ancestor immediately behind the target paints over it.
// #6 never position a .cfa-glass target with `transform` - liquidGL owns
//    the target's own el.style.transform for its mouse-tilt effect and
//    will silently overwrite anything a CSS class put there. Center with
//    left/top + negative margin instead.

const sections = [
  "Слова по тематикам",
  "Грамматика",
  "3 тип упражнений",
  "4 тип упражнений",
];

const topics = ["Места", "Тема 2", "Еда и напитки", "Люди и отношения", "Тема 3", "Тема 4", "Тема 5", "Тема 6", "Тема 7", "Тема 8", "Тема 9", "Тема 10"];
const grammarExercises = ["Вопросительные слова", "Счётные слова", "Упражнение 3", "Упражнение 4", "Упражнение 5"];

const NAVIGATOR_STEP_DESKTOP = 74;
const NAVIGATOR_STEP_MOBILE = 68;
const currentStep = () => (typeof window !== "undefined" && window.innerWidth <= 600 ? NAVIGATOR_STEP_MOBILE : NAVIGATOR_STEP_DESKTOP);

// Stable module-level reference - GlassInit's effect depends on this object
// by identity, and this page re-renders on every pointermove while
// dragging the navigator. An inline `options={{ ... }}` literal would be a
// "new" object each of those renders and would re-run liquidGL() init
// dozens of times a second.
//
// on.init (Rule #4) registers the ribbon strip as "dynamic" the moment the
// navigator's own lens is ready, so liquidGL keeps re-sampling it as it
// moves. Wrapped in try/catch: the library calls this from inside a
// forEach over all lenses with no error handling of its own, so a thrown
// error here could silently stop lenses after this one from finishing
// their own setup.
const GLASS_OPTIONS = {
  helper: true,
  on: {
    init(instance: { el?: Element }) {
      try {
        if (!instance.el || !instance.el.classList.contains("lessons-navigator-lens")) return;
        const strip = document.querySelector(".lessons-navigator-strip");
        const w = window as unknown as { liquidGL?: { registerDynamic?: (el: Element) => void } };
        if (strip && w.liquidGL?.registerDynamic) w.liquidGL.registerDynamic(strip);
      } catch (err) {
        console.error("liquidGL registerDynamic failed:", err);
      }
    },
  },
};

export default function LessonsPage() {
  const [active, setActive] = useState(0);
  const [openTopic, setOpenTopic] = useState<string | null>(null);
  const [showUiWords, setShowUiWords] = useState(false);
  const [showTopicStructure, setShowTopicStructure] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragRatio, setDragRatio] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<number | null>(null);
  const dragDelta = useRef(0);
  const moved = useRef(false);

  const goTo = (index: number) => {
    setActive(Math.max(0, Math.min(sections.length - 1, index)));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    dragStart.current = event.clientX;
    dragDelta.current = 0;
    moved.current = false;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;

    const rawDelta = event.clientX - dragStart.current;
    const atFirst = active === 0 && rawDelta > 0;
    const atLast = active === sections.length - 1 && rawDelta < 0;
    const delta = atFirst || atLast ? rawDelta * 0.32 : rawDelta;

    dragDelta.current = delta;
    if (Math.abs(rawDelta) > 6) moved.current = true;

    const viewportWidth = window.innerWidth || 1;
    setDragRatio(delta / viewportWidth);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;

    const delta = dragDelta.current;
    const viewportWidth = window.innerWidth || 1;
    const threshold = Math.max(45, viewportWidth * 0.18);
    const shouldChange = Math.abs(delta) >= threshold;
    const direction = delta < 0 ? 1 : -1;
    const next = Math.max(0, Math.min(sections.length - 1, active + direction));

    dragStart.current = null;
    dragDelta.current = 0;
    setDragging(false);
    setDragRatio(0);

    if (shouldChange && next !== active) goTo(next);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onNavigatorClick = (event: PointerEvent<HTMLDivElement>) => {
    if (moved.current) {
      moved.current = false;
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left + rect.width / 2) goTo(active - 1);
    if (event.clientX > rect.left + rect.width / 2) goTo(active + 1);
  };

  // Drives the ribbon with GSAP instead of a CSS transition (Rule #4).
  // useLayoutEffect (not useEffect) so this runs - and sets the initial
  // transform - before GlassInit's own effect calls liquidGL(), per the
  // library's "set the initial state before calling liquidGL()" rule.
  useLayoutEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const apply = (animate: boolean) => {
      const x = -active * currentStep() + dragRatio * currentStep();
      if (animate) gsap.to(el, { x, duration: 0.52, ease: "expo.out" });
      else gsap.set(el, { x });
    };
    apply(!dragging);
    if (dragging) return undefined;
    const onResize = () => apply(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, dragRatio, dragging]);

  return (
    <main className="lessons-page">
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="/scripts/liquidGL.js" />
      {/* liquidGL's own dev/debug GUI (lil-gui panel). Must load before
          liquidGL() runs (see GlassInit below) since it registers
          window.__liquidGLHelper__. */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="/scripts/liquidGL-helper.js" />
      <GlassInit target=".cfa-glass" options={GLASS_OPTIONS} />

      {/* Decorative only - doesn't need to refract anything specific, so
          position:fixed here is fine (Rule #3 only bites when something
          that MUST be captured, like the ribbon below, lives inside a
          fixed ancestor). */}
      <a href="/" className="lessons-back-btn" aria-label="На главную">
        <div className="lessons-back-btn-glass cfa-glass">
          <span className="lessons-back-btn-label">&lt;</span>
        </div>
      </a>

      <div
        className={`lessons-viewport${dragging ? " is-dragging" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="lessons-track"
          style={{
            transform: `translate3d(calc(${-active * 100}vw + ${dragRatio * 100}vw), 0, 0)`,
            transition: dragging ? "none" : undefined,
          }}
        >
          <section className="lesson-panel">
            <div className="lesson-list">
              {topics.map((topic) => {
                const isFolder = topic === "Еда и напитки" || topic === "Люди и отношения" || topic === "Тема 2";
                const isOpen = openTopic === topic;

                if (isFolder) {
                  return (
                    <div className={"lesson-folder" + (isOpen ? " is-open" : "")} key={topic}>
                      <button
                        className="lesson-island lesson-folder-button"
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpenTopic(isOpen ? null : topic)}
                      >
                        <span>{topic === "Еда и напитки" ? foodAndDrinksTopic.title : topic === "Люди и отношения" ? peopleTopic.title : "Переключи весь интерфейс на китайский!"}</span>
                        <span className="lesson-folder-chevron" aria-hidden="true">⌄</span>
                      </button>
                      <div className="lesson-folder-children" aria-hidden={!isOpen}>
                                                  {topic === "Люди и отношения" ? (
                          <>
                            {[pronounsDeck, closePeopleDeck, introductionsDeck, communicationDeck, politenessDeck].map((deck) => (
                              <a className="lesson-island lesson-deck" key={deck.id} href={"/cards_exerciser?topic=people_and_relationships/" + deck.id}>
                                {deck.title}
                              </a>
                            ))}
                            <button
                              className="lesson-island lesson-deck lesson-structure-button"
                              type="button"
                              onClick={() => setShowTopicStructure(true)}
                            >
                              Структура папки
                            </button>
                          </>
                        ) : {topic === "Еда и напитки" ? (
                          <>
                            <a className="lesson-island lesson-deck" href={"/cards_exerciser?topic=food_and_drinks/drinks"}>
                              {drinksDeck.title}
                            </a>
                            <button
                              className="lesson-island lesson-deck lesson-structure-button"
                              type="button"
                              onClick={() => setShowTopicStructure(true)}
                            >
                              Структура папки
                            </button>
                          </>
                        ) : (
                          <>
                        <a className="lesson-island lesson-deck" key="ui-basics" href={"/cards_exerciser?topic=ui-basics"}>
                            Основные действия интерфейса
                          </a>
                          <a className="lesson-island lesson-deck" key="ui-social" href={"/cards_exerciser?topic=ui-social"}>
                            Общение и социальные функции
                          </a>
                          <a className="lesson-island lesson-deck" key="ui-account" href={"/cards_exerciser?topic=ui-account"}>
                            Аккаунт и безопасность
                          </a>
                          <a className="lesson-island lesson-deck" key="ui-language" href={"/cards_exerciser?topic=ui-language"}>
                            Язык и оформление
                          </a>
                          <a className="lesson-island lesson-deck" key="ui-network" href={"/cards_exerciser?topic=ui-network"}>
                            Интернет и состояния
                          </a>
                          <a className="lesson-island lesson-deck" key="ui-files-folders" href={"/cards_exerciser?topic=ui-files-folders"}>
                            Файлы и папки
                          </a>
                          <a className="lesson-island lesson-deck" key="ui-search" href={"/cards_exerciser?topic=ui-search"}>
                            Поиск и навигация
                          </a>
                          <a className="lesson-island lesson-deck" key="ui-shopping" href={"/cards_exerciser?topic=ui-shopping"}>
                            Покупки, товары и деньги
                          </a>
                          <a className="lesson-island lesson-deck" key="ui-apps" href={"/cards_exerciser?topic=ui-apps"}>
                            Приложения и управление системой
                          </a>
                          <button className="lesson-island lesson-deck lesson-all-words-button" type="button" onClick={() => setShowUiWords(true)}>
                            Все слова из папки
                          </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    className="lesson-island"
                    key={topic}
                    type="button"
                    onClick={() => {
                      if (topic === "Места") window.location.href = "/cards_exerciser?topic=places";
                    }}
                  >
                    {topic}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="lesson-panel">
            <div className="lesson-list grammar-list">
              {grammarExercises.map((exercise) => (
                <button
                  className="lesson-island"
                  key={exercise}
                  type="button"
                  onClick={() => {
                    if (exercise === "Вопросительные слова") window.location.href = "/cards_exerciser?topic=question-words";
                    if (exercise === "Счётные слова") window.location.href = "/cards_exerciser?topic=measure_words";
                  }}
                >
                  {exercise}
                </button>
              ))}
            </div>
          </section>

          <section className="lesson-panel">
            <div className="lesson-placeholder"><span>Здесь будет 3 тип упражнений</span></div>
          </section>

          <section className="lesson-panel">
            <div className="lesson-placeholder"><span>Здесь будет 4 тип упражнений</span></div>
          </section>
        </div>
      </div>

      {showTopicStructure && (
        <div className="ui-words-modal" role="dialog" aria-modal="true" aria-label="Структура папки Еда и напитки">
          <div className="ui-words-backdrop" onClick={() => setShowTopicStructure(false)} />
          <div className="ui-words-panel">
            <button className="ui-words-close" type="button" aria-label="Закрыть" onClick={() => setShowTopicStructure(false)}>×</button>
            <div className="ui-words-title">{peopleTopic.title}</div>
            <div className="ui-words-tree">
              {[pronounsDeck, closePeopleDeck, introductionsDeck, communicationDeck, politenessDeck].map((deck) => (
                <details className="ui-words-branch" key={deck.id} open>
                  <summary>{deck.title}</summary>
                  <div className="ui-words-leaves">
                    {deck.words.map((card) => (
                      <div className="ui-words-leaf" key={card.word}>{card.translation}</div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      )}

      {showUiWords && (
        <div className="ui-words-modal" role="dialog" aria-modal="true" aria-label="Все слова из папки">
          <div className="ui-words-backdrop" onClick={() => setShowUiWords(false)} />
          <div className="ui-words-panel">
            <button className="ui-words-close" type="button" aria-label="Закрыть" onClick={() => setShowUiWords(false)}>×</button>
            <div className="ui-words-title">Все слова</div>
            <div className="ui-words-tree">
              {[
                ["Основные действия интерфейса", ["настройки; настроить / settings","поиск; искать / search","войти; вход в аккаунт / log in","зарегистрироваться / sign up","пароль / password","аккаунт; учётная запись / account","имя пользователя / username","номер телефона / phone number","код подтверждения / verification code","скачать; скачать файл / download","загрузить на сервер / upload","загрузка; загружать / loading, load","обновить; обновление / update","удалить / delete","сохранить / save","отменить; отмена / cancel","подтвердить; ОК / confirm, OK","назад; вернуться / back, return","следующий шаг / next step","готово; завершить / complete, done","закрыть; выключить / close, turn off","открыть; включить / open, turn on","выбрать; выбор / select","подтвердить / confirm","добавить / add","изменить / modify","изменить / change","включить; активировать / enable","отправить / send","получить; принять / receive"]],
                ["Общение и социальные функции", ["сообщение; сообщения / message","чат; общаться / chat","личное сообщение / direct message, DM","комментарий; комментировать / comment","ответ; ответить / reply","поставить лайк / like","подписаться; следить / follow","подписчики / followers","поделиться / share","репост; переслать / repost, forward","добавить в избранное; сохранить / favorite, bookmark","уведомление / notification","друг / friend","аватарка; фото профиля / profile picture","профиль; личные данные / profile","главная страница; страница профиля / home page","история / history"]],
                ["Аккаунт и безопасность", ["аккаунт; учётная запись / account","аккаунт; учётная запись / account","пароль / password","изменить пароль / change password","изменить пароль / change password","проверка; верификация / verify","код подтверждения / verification code","безопасность / security","конфиденциальность; приватность / privacy","настройки приватности / privacy settings","разрешения / permissions","согласиться / agree","отклонить; отказаться / reject","предоставить разрешение / authorize","выйти из аккаунта / log out","сменить аккаунт / switch account","забыли пароль / forgot password"]],
                ["Язык и оформление", ["язык / language","китайский язык / Chinese","английский язык / English","упрощённый китайский / Simplified Chinese","традиционный китайский / Traditional Chinese","сменить язык / switch language","регион / region","страна / country","шрифт / font","тёмная тема / dark mode","светлая тема / light mode","тема; оформление / theme","по умолчанию / default","автоматически / automatic","вручную / manual"]],
                ["Интернет и состояния", ["сеть; интернет / network","сетевое соединение / network connection","подключение; соединение / connect, connection","отключиться; разорвать соединение / disconnect","подключено / connected","не подключено / not connected","не удалось подключиться / connection failed","невозможно подключиться / unable to connect","загрузка... / loading...","скачивание... / downloading...","загрузка на сервер... / uploading...","обновление... / updating...","неудача; не удалось / failed","успешно / successful","ошибка / error","повторить попытку / retry","обновить страницу / refresh"]],
                ["Файлы и папки", ["файл / file","папка / folder","изображение; картинка / image","фотография / photo","видео / video","аудио / audio","фотоальбом / album","сфотографировать / take a photo","записать звук / record audio","видеозапись; записывать видео / video recording","редактировать / edit","переименовать / rename","копировать / copy","вставить / paste","переместить / move"]],
                ["Поиск и навигация", ["найти; поиск / find, search","искать; проверять / search, check","ключевое слово / keyword","результат / result","результаты поиска / search results","главная страница / home page","ещё; больше / more","всё; все / all","рекомендации; рекомендовать / recommended","популярное / trending, popular","самое новое / latest","история просмотров / browsing history"]],
                ["Покупки, товары и деньги", ["купить; покупка / purchase","товар / product, item","цена / price","оплатить / make a payment","оплата; платить / pay, payment","заказ / order","корзина / shopping cart","скидка; льгота / discount, special offer","бесплатно / free","платный; оплачивать / paid","баланс / balance","возврат денег / refund","подтвердить заказ / confirm order"]],
                ["Приложения и управление системой", ["синхронизировать / sync","перезапустить / restart","установить / install","удалить приложение / uninstall"]]
              ].map(([title, words]) => (
                <details className="ui-words-branch" key={title as string}>
                  <summary>{title as string}</summary>
                  <div className="ui-words-leaves">
                    {(words as string[]).map((word, index) => <div className="ui-words-leaf" key={title + "-" + index}>{word}</div>)}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Compass-needle glass: a static lens sitting over a sliding ribbon
          of lesson-type names, like a loupe over a ruler - whichever name
          is centered under it is the selection, shown by genuinely
          refracting/magnifying that word live (no text is ever drawn on
          the lens itself, and no separate label exists anywhere).
          position:absolute (Rule #3), not nested inside the pill's opaque
          background (Rule #5), no transform on the lens (Rule #6), ribbon
          moved by GSAP + registered dynamic (Rule #4). */}
      <div
        className={`lessons-navigator-dock${dragging ? " is-dragging" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onNavigatorClick}
        role="tablist"
        aria-label="Тип упражнений"
      >
        <div className="lessons-navigator">
          <div className="lessons-navigator-window">
            <div className="lessons-navigator-strip" ref={stripRef}>
              {sections.map((section) => (
                <span className="lessons-navigator-item" key={section}>{section}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="lessons-navigator-lens cfa-glass" aria-hidden="true" />
      </div>

      <style jsx>{`
        /* Rule #3: not position:fixed. The whole page needs to fill the
           screen without scrolling (this is an app-like, not a scrolling,
           page), so that lock is applied to html/body instead - see the
           :global rule below - leaving this element itself a normal,
           capturable box. */
        .lessons-page { position: relative; width: 100%; height: 100vh; height: 100dvh; background: #000; color: #fff; overflow: hidden; touch-action: none; }
        :global(html), :global(body) { height: 100%; overflow: hidden; overscroll-behavior: none; }

        .lessons-viewport { position: absolute; inset: 0; overflow: hidden; touch-action: pan-y; cursor: grab; }
        .lessons-viewport.is-dragging { cursor: grabbing; }

        .lessons-back-btn { position: fixed; top: 1rem; left: 1rem; z-index: 120; text-decoration: none; transform: translateZ(0); will-change: transform; backface-visibility: hidden; }
        .lessons-back-btn-glass { width: 38px; height: 38px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .lessons-back-btn-label { color: #f5f5f5; font-weight: 600; font-size: 1.1rem; letter-spacing: 0.01em; text-shadow: 0 1px 4px rgba(0, 0, 0, 0.55); line-height: 1; }

        /* liquidGL's debug GUI ships pinned top-right (and re-asserts that
           with !important via its own injected stylesheet), so we
           out-specify it here (repeating the class is a standard
           zero-cost specificity bump) to relocate it top-left, under the
           back button, on this page only. */
        :global(.lil-gui.root.liquidgl-helper.liquidgl-helper) {
          top: calc(1rem + 38px + 12px) !important;
          left: 1rem !important;
          right: auto !important;
          bottom: auto !important;
          z-index: 119 !important;
        }
        @media (max-width: 768px) {
          :global(.lil-gui.root.liquidgl-helper.liquidgl-helper) {
            top: calc(1rem + 38px + 10px) !important;
            left: 0.75rem !important;
            right: auto !important;
          }
        }

        .lessons-track { display: flex; width: 400vw; height: 100%; transition: transform 520ms cubic-bezier(.22,1,.36,1); will-change: transform; }
        .lesson-panel { width: 100vw; height: 100%; flex: 0 0 100vw; display: flex; align-items: center; justify-content: center; padding: 70px 24px 150px; box-sizing: border-box; }

        .lesson-list { width: min(760px, 90vw); height: 100%; max-height: calc(100vh - 220px); overflow-y: auto; display: flex; flex-direction: column; align-items: stretch; gap: 16px; padding: 12px 8px 24px; box-sizing: border-box; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.28) transparent; touch-action: pan-y; }
        .lesson-list::-webkit-scrollbar { width: 7px; }
        .lesson-list::-webkit-scrollbar-track { background: transparent; }
        .lesson-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.28); border-radius: 10px; }
        .lesson-island { flex: 0 0 92px; width: 100%; border: 1px solid rgba(255,255,255,.14); border-radius: 28px; background: rgba(255,255,255,.07); color: rgba(255,255,255,.9); box-shadow: 0 8px 28px rgba(0,0,0,.25); display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; font: 600 24px/1.2 Arial,sans-serif; cursor: pointer; transition: background 160ms ease, transform 160ms ease, border-color 160ms ease; }
        .lesson-island:hover { background: rgba(255,255,255,.11); border-color: rgba(255,255,255,.22); transform: translateY(-1px); }
        .lesson-island:active { transform: scale(.985); }

        .lesson-folder { display: flex; flex-direction: column; gap: 10px; width: 100%; }
        .lesson-folder-button { position: relative; flex-basis: 92px; padding-left: 54px; padding-right: 54px; }
        .lesson-folder-button > span:first-child { max-width: 90%; }
        .lesson-folder-chevron { position: absolute; right: 24px; top: 50%; transform: translateY(-50%); font-size: 26px; line-height: 1; color: rgba(255,255,255,.58); transition: transform 180ms ease; }
        .lesson-folder.is-open .lesson-folder-chevron { transform: translateY(-50%) rotate(180deg); }
        .lesson-folder-children { display: flex; flex-direction: column; gap: 10px; overflow: hidden; max-height: 0; opacity: 0; transform: translateY(-6px); pointer-events: none; transition: max-height 260ms ease, opacity 180ms ease, transform 260ms ease; padding-left: 28px; position: relative; }
        .lesson-folder-children::before { content: ""; position: absolute; left: 10px; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,.16); }
        .lesson-folder.is-open .lesson-folder-children { max-height: 1000px; opacity: 1; transform: translateY(0); pointer-events: auto; }
        .lesson-deck { position: relative; flex-basis: 66px; border-radius: 20px; font-size: 19px; background: rgba(255,255,255,.045); }
        .lesson-deck::before { content: ""; position: absolute; left: -19px; top: 50%; width: 19px; height: 1px; background: rgba(255,255,255,.16); }
        .lesson-deck:hover { background: rgba(255,255,255,.085); }

        .lesson-structure-button { background: rgba(255,255,255,.065); border-style: dashed; }
        .lesson-structure-button:hover { background: rgba(255,255,255,.11); }
        .lesson-all-words-button { background: rgba(255,255,255,.08); border-style: dashed; }
        .lesson-all-words-button:hover { background: rgba(255,255,255,.12); }
        .ui-words-modal { position: absolute; inset: 0; z-index: 300; display: flex; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; }
        .ui-words-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.68); backdrop-filter: blur(10px); }
        .ui-words-panel { position: relative; z-index: 1; width: min(760px, 94vw); max-height: min(82vh, 820px); overflow: hidden; border: 1px solid rgba(255,255,255,.16); border-radius: 30px; background: rgba(28,28,28,.92); box-shadow: 0 24px 80px rgba(0,0,0,.55); color: #fff; }
        .ui-words-title { padding: 24px 62px 18px 26px; font: 700 26px/1.15 Arial,sans-serif; }
        .ui-words-close { position: absolute; top: 12px; right: 14px; width: 42px; height: 42px; border: 0; border-radius: 50%; background: rgba(255,255,255,.08); color: rgba(255,255,255,.8); font: 300 30px/1 Arial,sans-serif; cursor: pointer; }
        .ui-words-tree { max-height: calc(min(82vh, 820px) - 76px); overflow-y: auto; padding: 0 18px 22px 26px; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.25) transparent; }
        .ui-words-branch { border-bottom: 1px solid rgba(255,255,255,.09); }
        .ui-words-branch summary { position: relative; padding: 16px 34px 16px 20px; color: rgba(255,255,255,.92); font: 650 18px/1.25 Arial,sans-serif; cursor: pointer; list-style: none; }
        .ui-words-branch summary::-webkit-details-marker { display: none; }
        .ui-words-branch summary::before { content: "›"; position: absolute; left: 0; top: 14px; color: rgba(255,255,255,.45); font-size: 25px; line-height: 1; transition: transform 160ms ease; }
        .ui-words-branch[open] summary::before { transform: rotate(90deg); }
        .ui-words-leaves { margin: 0 0 12px 20px; padding-left: 16px; border-left: 1px solid rgba(255,255,255,.13); }
        .ui-words-leaf { padding: 8px 10px; color: rgba(255,255,255,.7); font: 500 16px/1.35 Arial,sans-serif; }
        @media (max-width:600px) { .ui-words-modal { padding: 12px; } .ui-words-panel { width: 96vw; max-height: 88vh; border-radius: 24px; } .ui-words-title { padding: 20px 58px 14px 20px; font-size: 23px; } .ui-words-tree { max-height: calc(88vh - 68px); padding-left: 20px; } .ui-words-branch summary { font-size: 16px; padding-left: 18px; } .ui-words-leaves { margin-left: 18px; } .ui-words-leaf { font-size: 15px; } }

        .grammar-list { max-width: 760px; }
        .lesson-placeholder { width: min(760px,90vw); min-height: 180px; border: 1px solid rgba(255,255,255,.15); border-radius: 28px; display: flex; align-items: center; justify-content: center; padding: 30px; box-sizing: border-box; text-align: center; color: rgba(255,255,255,.65); font: 500 clamp(18px,2vw,26px)/1.3 Arial,sans-serif; background: rgba(255,255,255,.04); }

        /* Rule #3: position:absolute, not fixed - .lessons-page never
           scrolls, so anchoring to its bottom edge looks identical to
           fixed without excluding the ribbon inside from liquidGL's
           snapshot. Rule #2: z-index:120 matches .lessons-back-btn - this
           is the nearest positioned ancestor of .lessons-navigator-lens. */
        .lessons-navigator-dock {
          --navigator-width: min(27vw,350px);
          --step: 74px;
          position: absolute; z-index: 120; left: 0; right: 0; width: var(--navigator-width); margin-inline: auto;
          bottom: max(22px,env(safe-area-inset-bottom));
          user-select: none; cursor: grab; touch-action: pan-x;
        }
        .lessons-navigator-dock.is-dragging { cursor: grabbing; }

        .lessons-navigator {
          position: relative; width: 100%; height: 57px; border-radius: 29px; background: #303030;
          box-shadow: 0 8px 30px rgba(0,0,0,.45); overflow: hidden;
        }
        .lessons-navigator-window { position: absolute; inset: 0; overflow: hidden; }
        /* No CSS transition here - GSAP owns this element's transform
           (Rule #4), driven by the useLayoutEffect above. */
        .lessons-navigator-strip { position: absolute; left: 50%; top: 0; height: 57px; display: flex; align-items: center; will-change: transform; }
        .lessons-navigator-item {
          flex: 0 0 var(--step); width: var(--step); min-width: 0; text-align: center;
          color: rgba(255,255,255,.55); font: 600 12px/1.1 Arial,sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .lessons-navigator-item:first-child { margin-left: calc(var(--step) * -.5); }
        .lessons-navigator::after { content: ""; position: absolute; z-index: 1; inset: 0; pointer-events: none; border-radius: inherit; box-shadow: inset 20px 0 18px -22px rgba(0,0,0,.9), inset -20px 0 18px -22px rgba(0,0,0,.9); }

        /* The lens: empty, no background, no text (Rule #1 N/A - nothing
           to keep readable). A SIBLING of .lessons-navigator, not nested
           inside its opaque background (Rule #5). Centered with left/top
           + negative margin, never transform (Rule #6). */
        .lessons-navigator-lens {
          position: absolute; z-index: 2; left: 50%; top: 50%;
          width: min(62%, 220px); height: 43px;
          margin-left: calc(min(62%, 220px) / -2); margin-top: -21.5px;
          border-radius: 22px; overflow: hidden; pointer-events: none;
        }

        @media (max-width:600px) {
          .lessons-navigator-dock { --navigator-width: min(78vw,350px); --step: 68px; }
          .lessons-navigator-item { font-size: 11px; }
          .lesson-panel { padding-left: 18px; padding-right: 18px; }
          .lesson-list { width: 94vw; max-height: calc(100vh - 200px); gap: 12px; padding-left: 4px; padding-right: 4px; }
          .lesson-island { flex-basis: 82px; border-radius: 24px; font-size: 20px; }
          .lesson-folder-button { flex-basis: 82px; padding-left: 38px; padding-right: 38px; }
          .lesson-folder-button > span:first-child { max-width: 88%; }
          .lesson-folder-children { padding-left: 22px; }
          .lesson-folder-children::before { left: 8px; }
          .lesson-deck { flex-basis: 60px; border-radius: 19px; font-size: 17px; }
          .lesson-deck::before { left: -15px; width: 15px; }
        }
      `}</style>
    </main>
  );
}
