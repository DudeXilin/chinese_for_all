"use client";

import countingWords from "@/data/counting-words.json";

type CountingWord = {
  pinyin: string;
  safe: boolean;
  description: string;
  examples: Array<{
    word: string;
    pinyin: string;
    translation: string;
  }>;
};

export default function CountingWordsPage() {
  const entries = Object.entries(countingWords) as [string, CountingWord][];

  return (
    <main className="counting-page">
      <a href="/lessons" className="back-btn" aria-label="Назад">&lt;</a>

      <div className="content">
        <header className="header">
          <p className="eyebrow">Грамматика</p>
          <h1>Счётные слова</h1>
          <p className="intro">
            Счётное слово ставится между числом или указателем и существительным:
            <br />
            <strong>三 个 人</strong> — три человека.
          </p>
          <div className="safe-legend">
            <span className="safe-dot" />
            <span>Безопасное универсальное слово</span>
          </div>
        </header>

        <div className="word-list">
          {entries.map(([word, item]) => (
            <article className={"word-card" + (item.safe ? " safe" : "")} key={word}>
              <div className="word-head">
                <div className="hanzi">{word}</div>
                <div>
                  <div className="pinyin">{item.pinyin}</div>
                  {item.safe && <div className="safe-label">БЕЗОПАСНОЕ</div>}
                </div>
              </div>

              <p className="description">{item.description}</p>

              <div className="examples">
                {item.examples.map((example) => (
                  <div className="example" key={word + "-" + example.word}>
                    <div className="example-word">{example.word}</div>
                    <div className="example-pinyin">{example.pinyin}</div>
                    <div className="example-translation">{example.translation}</div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      <style jsx>{`
        .counting-page {
          min-height: 100dvh;
          background: #000;
          color: #fff;
          padding: 72px 20px 48px;
          box-sizing: border-box;
        }

        .back-btn {
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 20;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          text-decoration: none;
          background: rgba(255,255,255,.09);
          border: 1px solid rgba(255,255,255,.12);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          font: 600 22px/1 Arial,sans-serif;
        }

        .content { width: min(900px, 100%); margin: 0 auto; }
        .header { text-align: center; margin: 0 auto 32px; }
        .eyebrow { margin: 0 0 8px; color: rgba(255,255,255,.38); font: 600 11px/1.2 Arial,sans-serif; letter-spacing: .18em; text-transform: uppercase; }
        h1 { margin: 0; font: 700 clamp(34px, 6vw, 54px)/1.05 Arial,sans-serif; }
        .intro { margin: 16px auto 0; max-width: 650px; color: rgba(255,255,255,.58); font: 400 15px/1.55 Arial,sans-serif; }
        .intro strong { color: rgba(255,255,255,.88); font-weight: 600; }

        .safe-legend {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 18px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          color: rgba(255,255,255,.58);
          font: 500 12px/1 Arial,sans-serif;
        }

        .safe-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,.85); box-shadow: 0 0 10px rgba(255,255,255,.35); }
        .word-list { display: grid; gap: 14px; }

        .word-card {
          padding: 22px;
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 26px;
          background: rgba(255,255,255,.055);
          box-shadow: 0 12px 35px rgba(0,0,0,.22);
        }

        .word-card.safe { border-color: rgba(255,255,255,.3); background: rgba(255,255,255,.085); }
        .word-head { display: flex; align-items: center; gap: 15px; }

        .hanzi {
          width: 68px;
          height: 68px;
          flex: 0 0 68px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 19px;
          background: rgba(255,255,255,.09);
          color: #fff;
          font: 400 42px/1 "Noto Sans SC", "PingFang SC", sans-serif;
        }

        .safe .hanzi { background: rgba(255,255,255,.15); }
        .pinyin { color: rgba(255,255,255,.8); font: 600 18px/1.2 Arial,sans-serif; }
        .safe-label { margin-top: 5px; color: rgba(255,255,255,.48); font: 700 9px/1 Arial,sans-serif; letter-spacing: .12em; }
        .description { margin: 17px 0 18px; color: rgba(255,255,255,.68); font: 400 14px/1.5 Arial,sans-serif; }

        .examples { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
        .example { min-width: 0; padding: 11px 10px; border-radius: 15px; background: rgba(0,0,0,.2); border: 1px solid rgba(255,255,255,.07); }
        .example-word { color: rgba(255,255,255,.94); font: 400 21px/1.15 "Noto Sans SC", "PingFang SC", sans-serif; }
        .example-pinyin { margin-top: 5px; color: rgba(255,255,255,.46); font: 500 11px/1.25 Arial,sans-serif; }
        .example-translation { margin-top: 5px; color: rgba(255,255,255,.66); font: 400 11px/1.25 Arial,sans-serif; }

        @media (max-width: 700px) {
          .counting-page { padding-left: 14px; padding-right: 14px; }
          .word-card { padding: 17px; border-radius: 22px; }
          .examples { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .example:last-child:nth-child(odd) { grid-column: 1 / -1; }
        }
      `}</style>
    </main>
  );
}
