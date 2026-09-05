"use client";

import { useEffect } from "react";

const GLASS_OPTIONS = {
  refraction: 0,
  bevelDepth: 0.052,
  bevelWidth: 0.18,
  frost: 2,
  shadow: true,
  specular: true,
  tilt: false,
  tiltFactor: 5,
  reveal: "fade" as const,
  magnify: 1.05,
};

export default function Home() {
  useEffect(() => {
    let destroyed = false;
    let effect: any = null;
    let gui: any = null;

    const init = async () => {
      try {
        const [{ default: liquidGL }, { GUI }] = await Promise.all([
          import("liquid-gl"),
          import("lil-gui"),
        ]);

        if (destroyed) return;

        effect = liquidGL({
          target: ".marquee-card",
          ...GLASS_OPTIONS,
        });

        const lenses = Array.isArray(effect) ? effect : [effect];
        const first = lenses[0];
        if (!first) return;

        gui = new GUI({ title: "Liquid Glass", width: 230 });
        const folder = gui.addFolder("liquidGL Effect");
        const proxy: Record<string, any> = {};

        const updateAll = (key: string, value: any) => {
          lenses.forEach((lens: any) => {
            if (!lens) return;
            lens.options[key] = value;
            if (key === "shadow") lens.setShadow?.(value);
            if (key === "tilt") lens.setTilt?.(value);
          });
        };

        for (const [key, min, max, step] of [
          ["refraction", 0, 0.1, 0.001],
          ["aberration", 0, 1, 0.001],
          ["bevelDepth", 0, 0.2, 0.001],
          ["bevelWidth", 0, 0.5, 0.001],
          ["frost", 0, 10, 0.1],
          ["tiltFactor", 0, 25, 0.1],
          ["magnify", 0.8, 2, 0.01],
        ] as const) {
          proxy[key] = first.options[key] ?? (GLASS_OPTIONS as any)[key] ?? 0;
          folder.add(proxy, key, min, max, step).onChange((v: number) => updateAll(key, v));
        }

        proxy.shadow = first.options.shadow;
        proxy.specular = first.options.specular;
        proxy.tilt = first.options.tilt;
        proxy.reveal = first.options.reveal;

        folder.add(proxy, "shadow").onChange((v: boolean) => updateAll("shadow", v));
        folder.add(proxy, "specular").onChange((v: boolean) => updateAll("specular", v));
        folder.add(proxy, "tilt").onChange((v: boolean) => updateAll("tilt", v));
        folder.add(proxy, "reveal", ["none", "fade"]).onChange((v: string) => updateAll("reveal", v));
        folder.close();
      } catch (error) {
        console.error("LiquidGL demo initialization failed", error);
      }
    };

    void init();

    return () => {
      destroyed = true;
      gui?.destroy?.();
      gui = null;
      effect?.destroy?.();
      effect = null;
    };
  }, []);

  return (
    <main className="liquid-demo-page">
      <nav className="global-nav">
        <div className="nav-container">
          <span>Demos</span>
        </div>
      </nav>

      <div className="main-content">
        {[0, 1, 2, 3, 4].map((index) => (
          <div className="image-container" key={index}>
            <img src="/liquid-glass-bg.webp" alt="" draggable={false} />
          </div>
        ))}
      </div>

      <div className="marquee-anchor">
        <div className="cards-wrapper">
          {["01", "02", "03"].map((number) => (
            <div className="marquee-card" key={number}>
              <div className="card-content">
                <div className="marquee">
                  <div className="marquee-content">
                    <span>Glassify the web with liquidGL by NaughtyDuk©</span>
                    <span>Glassify the web with liquidGL by NaughtyDuk©</span>
                  </div>
                </div>
                <span className="demo-number">{number}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
