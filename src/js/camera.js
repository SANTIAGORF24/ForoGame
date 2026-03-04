import * as THREE from 'three';

let camera;
let currentRotation = 0;

export function createCamera() {
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 3, 6);
  return camera;
}

export function updateCamera(camera, targetPos, beeRotation = 0) {
  currentRotation = beeRotation;
  
  const offsetX = Math.sin(currentRotation + Math.PI) * 6;
  const offsetZ = Math.cos(currentRotation + Math.PI) * 6;
  
  const desiredPosition = new THREE.Vector3(
    targetPos.x + offsetX,
    targetPos.y + 3,
    targetPos.z + offsetZ
  );

  camera.position.lerp(desiredPosition, 0.1);

  const lookAtPos = targetPos.clone();
  lookAtPos.y += 0.5;
  
  camera.lookAt(lookAtPos);
}

export function getCamera() {
  return camera;
}
