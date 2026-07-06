import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Artwork, GalleryLayout } from "./artworks";
import { ART_CENTER_Y, CAMERA, WALL_X, slotZ } from "./constants";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ScrollCamera {
  /** Camera position proxy — the render loop copies this every frame. */
  camPos: THREE.Vector3;
  /** Look-at target proxy — the render loop applies this every frame. */
  target: THREE.Vector3;
  scrollTrigger: ScrollTrigger;
  dispose: () => void;
}

/** World position of an artwork's center. */
const artworkTarget = (slot: number, wall: "left" | "right") =>
  new THREE.Vector3(wall === "left" ? -WALL_X : WALL_X, ART_CENTER_Y, slotZ(slot));

export function createScrollCamera(opts: {
  spacer: HTMLElement;
  artworks: Artwork[];
  layout: GalleryLayout;
  onProgress?: (progress: number) => void;
}): ScrollCamera {
  const { artworks, layout } = opts;

  // Timeline time is measured in meters of camera travel: camZ(t) = startZ - t.
  const travel = CAMERA.startZ - layout.cameraEndZ;
  const timeAtZ = (z: number) => CAMERA.startZ - z;

  const camPos = new THREE.Vector3(0, CAMERA.height, CAMERA.startZ);

  // The first artwork (self-portrait + bio) anchors the opening view; aim
  // between the piece and the bio panel hung 1.8m further down.
  const first = artworks[0];
  const target = first
    ? new THREE.Vector3(
        first.wall === "left" ? -WALL_X : WALL_X,
        ART_CENTER_Y,
        slotZ(first.slot) - 0.9,
      )
    : new THREE.Vector3(0, ART_CENTER_Y, layout.hallEndZ);

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: opts.spacer,
      start: "top top",
      end: "bottom bottom",
      scrub: reducedMotion ? true : 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => opts.onProgress?.(self.progress),
    },
  });

  // Constant walking speed down the centerline; scrub smoothing supplies the glide.
  tl.to(camPos, { z: layout.cameraEndZ, duration: travel }, 0);

  // Look-at choreography: start turning ~4m before each piece, arrive 1.5m out,
  // hold while walking past, then turn toward the next.
  const TURN_LEAD = 4;
  const TURN_ARRIVE = 1.5;

  // The first artwork is already the initial target; choreograph the rest.
  for (const artwork of artworks.slice(1)) {
    const t = timeAtZ(slotZ(artwork.slot));
    const to = artworkTarget(artwork.slot, artwork.wall);
    tl.to(
      target,
      { x: to.x, y: to.y, z: to.z, duration: TURN_LEAD - TURN_ARRIVE },
      t - TURN_LEAD,
    );
  }

  // Final stretch: face the "Get in touch" end wall.
  tl.to(
    target,
    { x: 0, y: ART_CENTER_Y + 0.2, z: layout.hallEndZ, duration: 4 },
    travel - 10,
  );

  return {
    camPos,
    target,
    scrollTrigger: tl.scrollTrigger!,
    dispose: () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    },
  };
}
