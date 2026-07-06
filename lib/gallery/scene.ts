import * as THREE from "three";
import type { GalleryLayout } from "./artworks";
import { CAMERA, COLORS, HALL } from "./constants";

export interface SceneCore {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  setSize: (width: number, height: number) => void;
  dispose: () => void;
}

const maxDPR = () =>
  window.matchMedia("(pointer: coarse)").matches ? 1.5 : 2;

export function createSceneCore(
  canvas: HTMLCanvasElement,
  layout: GalleryLayout,
): SceneCore {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDPR()));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const hallLength = HALL.startZ - layout.hallEndZ;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.fog);
  scene.fog = new THREE.Fog(COLORS.fog, 30, hallLength + 12);

  const camera = new THREE.PerspectiveCamera(
    CAMERA.fov,
    1,
    CAMERA.near,
    hallLength + 40,
  );
  camera.position.set(0, CAMERA.height, CAMERA.startZ);

  const setSize = (width: number, height: number) => {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDPR()));
    renderer.setSize(width, height);
  };
  setSize(window.innerWidth, window.innerHeight);

  const dispose = () => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const materials = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        for (const mat of materials) {
          for (const value of Object.values(mat)) {
            if (value instanceof THREE.Texture) value.dispose();
          }
          mat.dispose();
        }
      }
    });
    scene.clear();
    renderer.dispose();
  };

  return { renderer, scene, camera, setSize, dispose };
}
