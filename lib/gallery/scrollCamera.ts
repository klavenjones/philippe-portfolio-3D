import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ARTWORKS } from "./artworks";
import { ART_CENTER_Y, CAMERA, HALL, WALL_X, slotZ } from "./constants";

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

// Timeline time is measured in meters of camera travel: camZ(t) = startZ - t.
const TRAVEL = CAMERA.startZ - CAMERA.endZ; // 78
const timeAtZ = (z: number) => CAMERA.startZ - z;

/** World position of an artwork's center. */
const artworkTarget = (slot: number, wall: "left" | "right") =>
  new THREE.Vector3(wall === "left" ? -WALL_X : WALL_X, ART_CENTER_Y, slotZ(slot));

export function createScrollCamera(opts: {
  spacer: HTMLElement;
  onProgress?: (progress: number) => void;
}): ScrollCamera {
  const camPos = new THREE.Vector3(0, CAMERA.height, CAMERA.startZ);

  // Slot 0 (self-portrait + bio) anchors the opening view; aim between the two.
  const introTarget = new THREE.Vector3(-WALL_X, ART_CENTER_Y, -0.9);
  const target = introTarget.clone();

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
  tl.to(camPos, { z: CAMERA.endZ, duration: TRAVEL }, 0);

  // Look-at choreography: start turning ~4m before each piece, arrive 1.5m out,
  // hold while walking past, then turn toward the next.
  const TURN_LEAD = 4;
  const TURN_ARRIVE = 1.5;

  // Slot 0 is already the initial target; choreograph slots 1+ and the end wall.
  for (const artwork of ARTWORKS.slice(1)) {
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
    { x: 0, y: ART_CENTER_Y + 0.2, z: HALL.endZ, duration: 4 },
    TRAVEL - 10,
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
