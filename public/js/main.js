/* liquidGL core initialisation.
   This is the "REQUIRED" part of the effect: preloader, GSAP SplitText
   setup, the liquidGL() call itself, and the scroll wiring.
   Do not edit liquidGL's own code in /scripts/liquidGL.js - configure
   it only through the options object below. */

gsap.registerPlugin(SplitText);

let glassEffect;

document.addEventListener("DOMContentLoaded", () => {
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

  const fontsReady =
    document.fonts && document.fonts.ready
      ? document.fonts.ready
      : Promise.resolve();

  fontsReady.then(() => {
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

    /* Requested default liquidGL settings for the Start Learning button. */
    glassEffect = liquidGL({
      target: ".liquidGL",
      snapshot: "body",
      resolution: 1.5,
      refraction: 0.002,
      aberration: 0.1,
      bevelDepth: 0.04,
      bevelWidth: 0.264,
      frost: 0,
      shadow: true,
      specular: true,
      reveal: "fade",
      tilt: false,
      tiltFactor: 10,
      tiltEase: 400,
      magnify: 1.2,
      helper: false,
      on: {
        init: function (intro) {
          loadingTl.then(() => {
            gsap.to(preloader, {
              yPercent: -100,
              duration: 1,
              ease: "expo.inOut",
              onComplete: () => {
                preloader.style.display = "none";
              },
            });

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

    liquidGL.registerDynamic(allSplitLines);
    liquidGL.registerDynamic(".banner-text-container");

    console.log("liquidGL ready!", glassEffect);
    liquidGL.syncWith();
  });
});
