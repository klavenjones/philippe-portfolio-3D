import * as THREE from "three";
import { COLORS, HALL } from "./constants";

/** Builds the gallery hall: floor, walls, ceiling, and lighting. */
export function buildRoom(scene: THREE.Scene): void {
  const length = HALL.startZ - HALL.endZ; // 82
  const centerZ = (HALL.startZ + HALL.endZ) / 2; // -37

  const wallMat = new THREE.MeshStandardMaterial({
    color: COLORS.wall,
    roughness: 0.95,
  });
  const floorMat = new THREE.MeshStandardMaterial({
    color: COLORS.floor,
    roughness: 0.8,
  });
  const ceilingMat = new THREE.MeshStandardMaterial({
    color: COLORS.ceiling,
    roughness: 1,
  });

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(HALL.width, length),
    floorMat,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, centerZ);
  scene.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(HALL.width, length),
    ceilingMat,
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, HALL.height, centerZ);
  scene.add(ceiling);

  const sideWallGeo = new THREE.PlaneGeometry(length, HALL.height);

  const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-HALL.width / 2, HALL.height / 2, centerZ);
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(HALL.width / 2, HALL.height / 2, centerZ);
  scene.add(rightWall);

  const endWallGeo = new THREE.PlaneGeometry(HALL.width, HALL.height);

  const endWall = new THREE.Mesh(endWallGeo, wallMat);
  endWall.position.set(0, HALL.height / 2, HALL.endZ);
  scene.add(endWall);

  const backWall = new THREE.Mesh(endWallGeo, wallMat);
  backWall.rotation.y = Math.PI;
  backWall.position.set(0, HALL.height / 2, HALL.startZ);
  scene.add(backWall);

  // Museum daylight: soft hemisphere fill + one directional for frame modeling.
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb0aca4, 0.9);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(2, 6, 2);
  scene.add(dir);
}
