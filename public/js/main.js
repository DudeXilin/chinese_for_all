/* liquidGL core initialisation.
   This is the "REQUIRED" part of the effect: preloader, GSAP SplitText
   setup, the liquidGL() call itself, and the responsive/scroll wiring.
   Do not edit liquidGL's own code in /scripts/liquidGL.js - configure
   it only through the options object below. The debug GUI is the
   official one from NaughtyDuk (scripts/liquidGL-helper.js), enabled
   via the `helper: true` option below - no custom code needed for it. */

/* OPTIONAL - Register GSAP SplitText */
gsap.registerPlugin(SplitText);

/* OPTIONAL - glassEffect variable declared globally for debugging */
let glassEffect;

/* RECOMMENDED - DOMContentLoaded Event */
document.addEventListener("DOMContentLoaded", () => {
  /* OPTIONAL - Preloader */
  const preloader = document.querySelector(".preloader");
  const preloaderProgress = document.querySelector(".preloader-progress");

  let progress = { value: 0 };
  const loadingTl = gsap.timeline();
  loadingTl.to(progress, {
    value: 100,
    duration: 1.5,
    ease: "power1.inOut",
    onUpdate: () => {
      gsap.set(preloaderProgress, { width: `${progress.value}%` });
    },
  });

  /* RECOMMENDED - Wait for fonts to be loaded */
  const fontsReady =
    document.fonts && document.fonts.ready
      ? document.fonts.ready
      : Promise.resolve();

  fontsReady.then(() => {
    /* 1. OPTIONAL - PREPARE ANIMATIONS BEFORE INITIALISING LIQUIDGL */
    gsap.set(".split", { visibility: "visible" });
    const allSplitLines = [];

    gsap.utils.toArray(".split").forEach((splitEl) => {
      const split = SplitText.create(splitEl, {
        type: "lines",
        linesClass: "line",
        mask: "lines",
      });

      gsap.from(split.lines, {
        scrollTrigger: {
          trigger: splitEl,
          start: "top 50%",
          toggleActions: "play none none reverse",
        },
        duration: 1.2,
        yPercent: 180,
        stagger: 0.1,
        ease: "expo.out",
      });

      allSplitLines.push(...split.lines);
    });

    /* 2. REQUIRED - INITIALISE LIQUIDGL */
    /* Target is now the floating "Начать обучение" button (the old
       full-viewport hero shape was removed - no longer needed now
       that the page has real UI). Same visual style/options as
       before, just a different, smaller target element. */
    /* Responsive refraction value */
    const getRefractionValue = () => {
      return window.innerWidth <= 767 ? 0.011 : 0.026;
    };

    glassEffect = liquidGL({
      target: ".liquidGL",
      snapshot: "body",
      resolution: 2,
      refraction: getRefractionValue(),
      bevelDepth: 0.119,
      bevelWidth: 0.057,
      frost: 0,
      specular: true,
      shadow: true,
      reveal: "fade",
      tilt: false,
      tiltFactor: 10,
      magnify: 1,
      helper: false,
      on: {
        init: function (intro) {
          /* OPTIONAL - GSAP ANIMATION OF TARGET ELEMENT */
          loadingTl.then(() => {
            gsap.to(preloader, {
              yPercent: -100,
              duration: 1,
              ease: "expo.inOut",
              onComplete: () => {
                preloader.style.display = "none";
              },
            });
            /* Target Animation */
            gsap.to(intro.el, {
              scaleX: 1,
              duration: 1.2,
              ease: "expo.out",
              delay: 0.5,
            });
          });
        },
      },
    });

    /* Handle responsive refraction on window resize */
    window.addEventListener("resize", () => {
      const newRefraction = getRefractionValue();
      if (glassEffect && glassEffect.options) {
        glassEffect.options.refraction = newRefraction;
      }
    });

    /* 3. REQUIRED FOR DYNAMIC ELEMENTS - REGISTER DYNAMIC ELEMENTS */
    liquidGL.registerDynamic(allSplitLines);
    liquidGL.registerDynamic(".banner-text-container");

    console.log("liquidGL ready!", glassEffect);

    /* 4. OPTIONAL - UNIVERSAL SCROLL/ANIMATION SYNC */
    liquidGL.syncWith();
  });
});
