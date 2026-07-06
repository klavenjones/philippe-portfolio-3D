import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Artwork } from "./artworks";
import { ART_CENTER_Y, DETAIL_VIEW, WALL_X, slotZ } from "./constants";

type ViewState = "idle" | "focusing" | "detail" | "returning";

export interface Interactions {
  /** Close the detail view (no-op unless in detail state). */
  close: () => void;
  dispose: () => void;
}

export function createInteractions(opts: {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  artworks: Artwork[];
  clickTargets: THREE.Mesh[];
  camPos: THREE.Vector3;
  target: THREE.Vector3;
  scrollTrigger: ScrollTrigger;
  onArtworkSelected: (artwork: Artwork | null) => void;
}): Interactions {
  const { canvas, camera, clickTargets, camPos, target, scrollTrigger } = opts;
  const artworkById = new Map(opts.artworks.map((a) => [a.id, a]));

  let state: ViewState = "idle";
  let savedScrollY = 0;
  const savedCamPos = new THREE.Vector3();
  const savedTarget = new THREE.Vector3();
  let activeTween: gsap.core.Tween[] = [];

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downX = 0;
  let downY = 0;

  const pick = (clientX: number, clientY: number): Artwork | null => {
    pointer.set(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(clickTargets, false)[0];
    if (!hit) return null;
    return artworkById.get(hit.object.userData.artworkId as string) ?? null;
  };

  const killTweens = () => {
    activeTween.forEach((t) => t.kill());
    activeTween = [];
  };

  const focus = (artwork: Artwork) => {
    state = "focusing";
    savedScrollY = window.scrollY;
    savedCamPos.copy(camPos);
    savedTarget.copy(target);

    scrollTrigger.disable(false);
    document.body.style.overflow = "hidden";

    const wallSign = artwork.wall === "left" ? -1 : 1;
    const artX = wallSign * WALL_X;
    const artCenter = new THREE.Vector3(artX, ART_CENTER_Y, slotZ(artwork.slot));
    // Step back along the wall normal, far enough that the small source
    // textures stay acceptably sharp.
    const distance = Math.max(DETAIL_VIEW.distance, DETAIL_VIEW.minDistance);
    const viewPos = artCenter.clone();
    viewPos.x -= wallSign * distance;

    killTweens();
    activeTween = [
      gsap.to(camPos, {
        x: viewPos.x,
        y: viewPos.y,
        z: viewPos.z,
        duration: DETAIL_VIEW.focusDuration,
        ease: "power2.inOut",
      }),
      gsap.to(target, {
        x: artCenter.x,
        y: artCenter.y,
        z: artCenter.z,
        duration: DETAIL_VIEW.focusDuration,
        ease: "power2.inOut",
        onComplete: () => {
          state = "detail";
          opts.onArtworkSelected(artwork);
        },
      }),
    ];
  };

  const close = () => {
    if (state !== "detail") return;
    state = "returning";
    opts.onArtworkSelected(null);

    killTweens();
    activeTween = [
      gsap.to(camPos, {
        x: savedCamPos.x,
        y: savedCamPos.y,
        z: savedCamPos.z,
        duration: DETAIL_VIEW.returnDuration,
        ease: "power2.inOut",
      }),
      gsap.to(target, {
        x: savedTarget.x,
        y: savedTarget.y,
        z: savedTarget.z,
        duration: DETAIL_VIEW.returnDuration,
        ease: "power2.inOut",
        onComplete: () => {
          // Restore scroll before re-enabling so the trigger picks up the
          // exact position without a visual jump.
          document.body.style.overflow = "";
          window.scrollTo(0, savedScrollY);
          scrollTrigger.enable(false, false);
          ScrollTrigger.update();
          state = "idle";
        },
      }),
    ];
  };

  const onPointerDown = (e: PointerEvent) => {
    downX = e.clientX;
    downY = e.clientY;
  };

  const onPointerUp = (e: PointerEvent) => {
    // Drags/scroll gestures never count as clicks.
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) return;
    if (state !== "idle") return;
    const artwork = pick(e.clientX, e.clientY);
    if (artwork) focus(artwork);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (state !== "idle") {
      canvas.style.cursor = "";
      return;
    }
    canvas.style.cursor = pick(e.clientX, e.clientY) ? "pointer" : "";
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointermove", onPointerMove);
  window.addEventListener("keydown", onKeyDown);

  return {
    close,
    dispose: () => {
      killTweens();
      document.body.style.overflow = "";
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("keydown", onKeyDown);
    },
  };
}
