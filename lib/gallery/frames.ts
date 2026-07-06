import * as THREE from "three";
import { ARTWORKS, BIO_TEXT, ARTIST_NAME, CONTACT_EMAIL, SECTIONS, type Artwork } from "./artworks";
import { ART_CENTER_Y, COLORS, FRAME, HALL, LABEL_Y, WALL_X, slotZ } from "./constants";

export interface GalleryFrames {
  /** Art-plane meshes for raycasting; userData.artworkId set on each. */
  clickTargets: THREE.Mesh[];
  /** Frame group per artwork id (for hover scaling / focus targets). */
  groups: Map<string, THREE.Group>;
}

/** Draws multi-line text onto a canvas at 4x resolution and returns a texture. */
function makeTextTexture(opts: {
  widthM: number;
  heightM: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}): THREE.CanvasTexture {
  const PX_PER_M = 512; // 4x-ish resolution for crisp text
  const w = Math.round(opts.widthM * PX_PER_M);
  const h = Math.round(opts.heightM * PX_PER_M);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  opts.draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Group local +z faces into the room; rotate/position by wall side. */
function placeOnWall(group: THREE.Group, wall: "left" | "right", z: number, y = ART_CENTER_Y) {
  if (wall === "left") {
    group.position.set(-WALL_X, y, z);
    group.rotation.y = Math.PI / 2;
  } else {
    group.position.set(WALL_X, y, z);
    group.rotation.y = -Math.PI / 2;
  }
}

function buildFramedArtwork(
  artwork: Artwork,
  loader: THREE.TextureLoader,
  frameMat: THREE.MeshStandardMaterial,
  matMat: THREE.MeshStandardMaterial,
  maxAnisotropy: number,
): { group: THREE.Group; artPlane: THREE.Mesh } {
  const [w, h] = artwork.size;
  const group = new THREE.Group();

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(w + FRAME.border * 2, h + FRAME.border * 2, FRAME.depth),
    frameMat,
  );
  frame.position.z = FRAME.wallGap;
  group.add(frame);

  let artZ = FRAME.wallGap + FRAME.depth / 2 + 0.001;

  if (artwork.category === "drawings") {
    const mat = new THREE.Mesh(
      new THREE.PlaneGeometry(w + FRAME.matBorder * 2, h + FRAME.matBorder * 2),
      matMat,
    );
    mat.position.z = artZ;
    group.add(mat);
    artZ += 0.002;
  }

  const texture = loader.load(artwork.src);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, maxAnisotropy);
  const artPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    // Unlit: guarantees color fidelity and makes the art pop against the lit room.
    new THREE.MeshBasicMaterial({ map: texture }),
  );
  artPlane.position.z = artZ;
  artPlane.userData.artworkId = artwork.id;
  group.add(artPlane);

  placeOnWall(group, artwork.wall, slotZ(artwork.slot));
  return { group, artPlane };
}

function buildBioPanel(): THREE.Group {
  const widthM = 1.4;
  const heightM = 1.0;
  const tex = makeTextTexture({
    widthM,
    heightM,
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#fafaf7";
      ctx.fillRect(0, 0, w, h);
      const pad = w * 0.07;
      ctx.fillStyle = "#1a1a1a";
      ctx.font = `600 ${w * 0.05}px Georgia, serif`;
      ctx.fillText(ARTIST_NAME.toUpperCase(), pad, pad + w * 0.05);
      ctx.font = `${w * 0.031}px Georgia, serif`;
      ctx.fillStyle = "#333333";
      const lines = wrapText(ctx, BIO_TEXT, w - pad * 2);
      const lineHeight = w * 0.047;
      lines.forEach((line, i) => {
        ctx.fillText(line, pad, pad + w * 0.12 + i * lineHeight);
      });
    },
  });
  const group = new THREE.Group();
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(widthM, heightM),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  panel.position.z = 0.02;
  group.add(panel);
  return group;
}

function buildSectionLabel(text: string): THREE.Group {
  const widthM = 0.5;
  const heightM = 0.25;
  const tex = makeTextTexture({
    widthM,
    heightM,
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#1a1a1a";
      ctx.font = `600 ${w * 0.09}px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, w / 2, h / 2);
    },
  });
  const group = new THREE.Group();
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(widthM, heightM),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  label.position.z = 0.01;
  group.add(label);
  return group;
}

function buildContactWall(scene: THREE.Scene): void {
  const widthM = 3.2;
  const heightM = 1.6;
  const tex = makeTextTexture({
    widthM,
    heightM,
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#f4f2ee";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#1a1a1a";
      ctx.textAlign = "center";
      ctx.font = `600 ${w * 0.045}px Georgia, serif`;
      ctx.fillText("GET IN TOUCH", w / 2, h * 0.38);
      ctx.font = `${w * 0.032}px Georgia, serif`;
      ctx.fillStyle = "#444444";
      ctx.fillText(ARTIST_NAME, w / 2, h * 0.55);
      ctx.fillText(CONTACT_EMAIL, w / 2, h * 0.68);
    },
  });
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(widthM, heightM),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  panel.position.set(0, ART_CENTER_Y + 0.2, HALL.endZ + 0.02);
  scene.add(panel);
}

/** Hangs all artworks, the bio panel, section labels, and the contact end wall. */
export function buildFrames(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
): GalleryFrames {
  const loader = new THREE.TextureLoader();
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  const frameMat = new THREE.MeshStandardMaterial({
    color: COLORS.frame,
    roughness: 0.6,
  });
  const matMat = new THREE.MeshStandardMaterial({
    color: COLORS.mat,
    roughness: 0.9,
  });

  const clickTargets: THREE.Mesh[] = [];
  const groups = new Map<string, THREE.Group>();

  for (const artwork of ARTWORKS) {
    const { group, artPlane } = buildFramedArtwork(
      artwork,
      loader,
      frameMat,
      matMat,
      maxAnisotropy,
    );
    scene.add(group);
    clickTargets.push(artPlane);
    groups.set(artwork.id, group);
  }

  // Bio panel: same wall as the self-portrait, 1.8m further down the hall.
  const bio = buildBioPanel();
  placeOnWall(bio, "left", slotZ(0) - 1.8);
  scene.add(bio);

  // for (const section of SECTIONS) {
  //   const artwork = ARTWORKS.find((a) => a.slot === section.firstSlot)!;
  //   const label = buildSectionLabel(section.label);
  //   placeOnWall(label, artwork.wall, slotZ(section.firstSlot), LABEL_Y);
  //   scene.add(label);
  // }

  buildContactWall(scene);

  return { clickTargets, groups };
}
