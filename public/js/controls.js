/* DEMO ONLY - lil-gui debug panel for tweaking liquidGL options live.
   Not required for the effect to work; safe to delete this file (and its
   <script> tag in index.html) for a production-only build. */
window.initLiquidGLControls = function (glassEffect) {
          /* DEMO ONLY - GUI CONTROLS, NOT REQUIRED FOR LIBRARY USAGE */
          const lensArr = Array.isArray(glassEffect)
            ? glassEffect
            : [glassEffect];
          const first = lensArr[0];

          if (first) {
            const gui = new lil.GUI();
            const folder = gui.addFolder("liquidGL Effect");

            const sync = (key, value) => {
              lensArr.forEach((ln) => {
                if (!ln) return;
                ln.options[key] = value;
                if (key === "shadow") ln.setShadow(value);
                if (key === "tilt") ln.setTilt(value);
              });
            };

            folder
              .add(first.options, "refraction", 0, 0.1, 0.001)
              .onChange((v) => sync("refraction", v));
            folder
              .add(first.options, "aberration", 0, 1, 0.01)
              .onChange((v) => sync("aberration", v));
            folder
              .add(first.options, "bevelDepth", 0, 0.2, 0.001)
              .onChange((v) => sync("bevelDepth", v));
            folder
              .add(first.options, "bevelWidth", 0, 0.5, 0.001)
              .onChange((v) => sync("bevelWidth", v));
            folder
              .add(first.options, "frost", 0, 10, 0.1)
              .onChange((v) => sync("frost", v));
            folder
              .add(first.options, "magnify", 1, 5, 0.1)
              .onChange((v) => sync("magnify", v));
            folder
              .add(first.options, "shadow")
              .onChange((v) => sync("shadow", v));
            folder
              .add(first.options, "specular")
              .onChange((v) => sync("specular", v));
            folder
              .add(first.options, "tilt")
              .onChange((v) => sync("tilt", v));
            folder
              .add(first.options, "tiltFactor", 0, 25, 0.1)
              .onChange((v) => sync("tiltFactor", v));
            folder
              .add(first.options, "tiltEase", 0, 1000, 10)
              .onChange((v) => sync("tiltEase", v));
            folder
              .add(first.options, "reveal", ["none", "fade"])
              .onChange((v) => sync("reveal", v));
            folder.close();
          }
};
