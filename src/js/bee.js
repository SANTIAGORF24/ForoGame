import * as THREE from 'three';

let beeGroup;
let beeWings;
let beeDirection = new THREE.Vector3();

export function createBee(scene) {
  beeGroup = new THREE.Group();
  
  const bodyGeo = new THREE.SphereGeometry(0.4, 8, 6);
  const bodyMat = new THREE.MeshStandardMaterial({ 
    color: 0xFFD93D,
    roughness: 0.8,
    metalness: 0.1
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.scale.set(1, 0.7, 1.3);
  body.castShadow = true;
  beeGroup.add(body);

  const stripeGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 8);
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
  
  const stripe1 = new THREE.Mesh(stripeGeo, stripeMat);
  stripe1.rotation.x = Math.PI / 2;
  stripe1.position.z = 0.1;
  beeGroup.add(stripe1);
  
  const stripe2 = new THREE.Mesh(stripeGeo, stripeMat);
  stripe2.rotation.x = Math.PI / 2;
  stripe2.position.z = -0.2;
  beeGroup.add(stripe2);

  const headGeo = new THREE.SphereGeometry(0.25, 8, 6);
  const headMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.z = 0.55;
  head.position.y = 0.1;
  beeGroup.add(head);

  const eyeGeo = new THREE.SphereGeometry(0.06, 6, 4);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.3 });
  
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(0.12, 0.18, 0.7);
  beeGroup.add(eyeL);
  
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(-0.12, 0.18, 0.7);
  beeGroup.add(eyeR);

  const pupilGeo = new THREE.SphereGeometry(0.03, 4, 4);
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  
  const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
  pupilL.position.set(0.12, 0.18, 0.75);
  beeGroup.add(pupilL);
  
  const pupilR = new THREE.Mesh(pupilGeo, pupilMat);
  pupilR.position.set(-0.12, 0.18, 0.75);
  beeGroup.add(pupilR);

  beeWings = new THREE.Group();
  
  const wingGeo = new THREE.CircleGeometry(0.5, 8, 0, Math.PI);
  const wingMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  
  const wingL = new THREE.Mesh(wingGeo, wingMat);
  wingL.rotation.x = -Math.PI / 2;
  wingL.rotation.z = 0.2;
  wingL.position.set(0.4, 0.15, 0);
  beeWings.add(wingL);
  
  const wingR = new THREE.Mesh(wingGeo, wingMat);
  wingR.rotation.x = -Math.PI / 2;
  wingR.rotation.z = -0.2;
  wingR.position.set(-0.4, 0.15, 0);
  wingR.scale.x = -1;
  beeWings.add(wingR);

  beeGroup.add(beeWings);

  const stingerGeo = new THREE.ConeGeometry(0.08, 0.2, 4);
  const stingerMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
  const stinger = new THREE.Mesh(stingerGeo, stingerMat);
  stinger.rotation.x = Math.PI / 2;
  stinger.position.z = -0.55;
  beeGroup.add(stinger);

  beeGroup.position.set(0, 2, 0);
  scene.add(beeGroup);

  return beeGroup;
}

export function updateBee(bee, keys, speed, delta, time) {
  const moveDir = new THREE.Vector3();
  let isMoving = false;
  
  if (keys['KeyW'] || keys['ArrowUp']) {
    moveDir.z += 1;
    isMoving = true;
  }
  if (keys['KeyS'] || keys['ArrowDown']) {
    moveDir.z -= 1;
    isMoving = true;
  }
  if (keys['KeyA'] || keys['ArrowLeft']) {
    bee.rotation.y += 2.5 * delta;
    isMoving = true;
  }
  if (keys['KeyD'] || keys['ArrowRight']) {
    bee.rotation.y -= 2.5 * delta;
    isMoving = true;
  }

  if (moveDir.length() > 0) {
    moveDir.normalize();
    
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), bee.rotation.y);
    
    bee.position.x += forward.x * moveDir.z * speed * delta;
    bee.position.z += forward.z * moveDir.z * speed * delta;
  }

  bee.position.y = 2 + Math.sin(time * 3) * 0.1;

  if (beeWings) {
    const wingSpeed = isMoving ? 25 : 10;
    beeWings.rotation.z = Math.sin(time * wingSpeed) * 0.5;
  }

  const bounds = 40;
  bee.position.x = THREE.MathUtils.clamp(bee.position.x, -bounds, bounds);
  bee.position.z = THREE.MathUtils.clamp(bee.position.z, -bounds, bounds);
}

export function getBeePosition() {
  return beeGroup ? beeGroup.position.clone() : new THREE.Vector3();
}

export function getBeeRotation() {
  return beeGroup ? beeGroup.rotation.y : 0;
}
