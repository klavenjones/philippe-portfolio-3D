import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Artwork } from "./artworks";
import { createSceneCore } from "./scene";
import { buildRoom } from "./room";
import { buildFrames } from "./frames";
import { createScrollCamera } from "./scrollCamera";
import { createInteractions } from "./interactions";

export interface ExperienceCallbacks {
  onArtworkSelected: (artwork: Artwork | null) => void;
  onProgress: (progress: number) => void;
}

export interface GalleryExperience {
  closeDetail: () => void;
  dispose: () => void;
}

/**
 * The only entry point React talks to. Owns the whole Three.js world:
 * scene, scroll-driven camera, and click interactions.
 */
export function createGalleryExperience(
  canvas: HTMLCanvasElement,
  spacer: HTMLElement,
  callbacks: ExperienceCallbacks,
): GalleryExperience {
  const core = createSceneCore(canvas);
  buildRoom(core.scene);
  const frames = buildFrames(core.scene, core.renderer);

  const scroll = createScrollCamera({
    spacer,
    onProgress: callbacks.onProgress,
  });

  const interactions = createInteractions({
    canvas,
    camera: core.camera,
    clickTargets: frames.clickTargets,
    camPos: scroll.camPos,
    target: scroll.target,
    scrollTrigger: scroll.scrollTrigger,
    onArtworkSelected: callbacks.onArtworkSelected,
  });

  let rafId = 0;
  const render = () => {
    core.camera.position.copy(scroll.camPos);
    core.camera.lookAt(scroll.target);
    core.renderer.render(core.scene, core.camera);
    rafId = requestAnimationFrame(render);
  };
  rafId = requestAnimationFrame(render);

  let resizeTimer = 0;
  let lastWidth = window.innerWidth;
  const onResize = () => {
    // Ignore height-only resizes (iOS URL-bar collapse) to avoid scroll jumps.
    const widthChanged = window.innerWidth !== lastWidth;
    core.setSize(window.innerWidth, window.innerHeight);
    if (!widthChanged) return;
    lastWidth = window.innerWidth;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
  };
  window.addEventListener("resize", onResize);

  let disposed = false;
  return {
    closeDetail: () => interactions.close(),
    dispose: () => {
      if (disposed) return; // idempotent — StrictMode double-invokes effects
      disposed = true;
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
      interactions.dispose();
      scroll.dispose();
      core.dispose();
    },
  };
}
