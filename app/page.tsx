"use client";

import LiquidGlassWebGL from "@/components/liquid-glass-webgl";

const GITHUB_URL = "https://github.com/archisvaze/liquid-glass";

export default function Home() {
  return (
    <main className="liquid-demo-page">
      <LiquidGlassWebGL backgroundUrl="/liquid-glass-bg.webp" />

      <nav className="global-nav">
        <div className="nav-container">
          <span>Demos</span>
        </div>
      </nav>

      <div className="main-content">
        {[0, 1, 2, 3, 4].map((index) => (
          <div className="image-container" key={index}>
            <img
              src="/liquid-glass-bg.webp"
              alt="Background"
              draggable={false}
            />
          </div>
        ))}
      </div>

      <div className="marquee-anchor">
        <div className="cards-wrapper">
          {["01", "02", "03"].map((number) => (
            <a
              className="marquee-card glass-test-button"
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              data-glass-pane
              key={number}
            >
              <div className="marquee">
                <div className="marquee-content">
                  <span>Liquid Glass WebGL</span>
                  <span>Liquid Glass WebGL</span>
                </div>
              </div>
              <span className="demo-number">{number}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
