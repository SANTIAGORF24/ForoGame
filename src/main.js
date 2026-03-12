import * as THREE from 'three';
import { createWorld, updateWorld, getSpawnUpdate } from './js/world.js';
import { createBee, updateBee, getBeePosition, getBeeRotation } from './js/bee.js';
import { createCamera, updateCamera } from './js/camera.js';
import { createZones, checkProximity } from './js/zones.js';
import { createAmbientLife, updateAmbientLife } from './js/ambient.js';
import { initUI, updateInteractionPrompt, showOverlay, hideOverlay, updateMinimap } from './js/ui.js';

let scene, camera, renderer, clock;
let bee;
let zones;
let spawnUpdate;
let keys = {};
let beeSpeed = 5;
let isPaused = false;
let nearbyZone = null;
let lights = null;

function resolveBeeTreeCollisions(bee, scene) {
  if (!bee || !scene) return;

  const rBee = 0.7;

  scene.children.forEach((child) => {
    if (!child.userData?.isTree) return;

    const rTree = child.userData.collisionRadius || 1.6;

    const dx = bee.position.x - child.position.x;
    const dz = bee.position.z - child.position.z;
    const dist2 = dx * dx + dz * dz;
    const minDist = rBee + rTree;
    if (dist2 < minDist * minDist) {
      const dist = Math.max(Math.sqrt(dist2), 0.001);
      const nx = dx / dist;
      const nz = dz / dist;
      const targetDist = minDist + 0.05;
      bee.position.x = child.position.x + nx * targetDist;
      bee.position.z = child.position.z + nz * targetDist;
    }
  });
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.Fog(0x87CEEB, 30, 80);

  camera = createCamera();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('app').appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xfff5e6, 1);
  dirLight.position.set(30, 50, 30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 150;
  dirLight.shadow.camera.left = -50;
  dirLight.shadow.camera.right = 50;
  dirLight.shadow.camera.top = 50;
  dirLight.shadow.camera.bottom = -50;
  scene.add(dirLight);

  const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x2d5a27, 0.4);
  scene.add(hemiLight);

  lights = { ambientLight, dirLight, hemiLight };

  createWorld(scene);
  spawnUpdate = getSpawnUpdate();
  bee = createBee(scene);
  zones = createZones(scene);
  createAmbientLife(scene);
  initUI(onUISelect);

  clock = new THREE.Clock();

  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  document.getElementById('loading-screen').classList.add('loaded');
  
  setTimeout(() => {
    const loading = document.getElementById('loading-screen');
    if (loading) loading.style.display = 'none';
  }, 2000);

  animate();
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(e) {
  keys[e.code] = true;
  
  if (e.code === 'KeyE' && nearbyZone) {
    e.preventDefault();
    showOverlay(nearbyZone);
  }
  
  if (e.code === 'Escape') {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('hidden');
  }
}

function onKeyUp(e) {
  keys[e.code] = false;
}

function onUISelect(action, value) {
  switch(action) {
    case 'speed':
      beeSpeed = value;
      break;
    case 'settings':
      document.getElementById('settings-panel').classList.toggle('hidden');
      break;
    case 'closeOverlay':
      hideOverlay();
      nearbyZone = null;
      updateInteractionPrompt(null);
      break;
    case 'music':
      break;
    case 'butterflies':
      break;
    case 'quality':
      break;
  }
}

function animate() {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  if (!isPaused) {
    if (lights) {
      applyDayCycle(scene, lights, time);
    }
    updateBee(bee, keys, beeSpeed, delta, time);
    resolveBeeTreeCollisions(bee, scene);
    updateCamera(camera, getBeePosition(), getBeeRotation());
    updateWorld(scene, time);
    updateAmbientLife(time);
    if (spawnUpdate) spawnUpdate(time);
    
    const beePos = getBeePosition();
    updateMinimap(beePos);
    
    nearbyZone = checkProximity(beePos, zones);
    updateInteractionPrompt(nearbyZone);
    
    zones.forEach(zone => {
      if (zone.mesh) {
        zone.mesh.userData.time = time;
        zone.update?.(zone.mesh, time);
      }
    });
  }

  renderer.render(scene, camera);
}

init();

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(out, c1, c2, t) {
  out.r = lerp(c1.r, c2.r, t);
  out.g = lerp(c1.g, c2.g, t);
  out.b = lerp(c1.b, c2.b, t);
  return out;
}

function applyDayCycle(scene, lights, time) {
  // Un ciclo completo (amanecer→día→tarde→noche) cada 140s
  const cycleSeconds = 140;
  const p = (time % cycleSeconds) / cycleSeconds; // 0..1

  const dawn = new THREE.Color(0xffb27a);
  const day = new THREE.Color(0x87ceeb);
  const dusk = new THREE.Color(0xff7a59);
  const night = new THREE.Color(0x061a2a);

  // Segmentos: 0-0.18 amanecer, 0.18-0.52 día, 0.52-0.72 tarde, 0.72-1 noche→amanecer
  const bg = new THREE.Color();
  let sunColor = new THREE.Color();
  let hemiSky = new THREE.Color();
  let hemiGround = new THREE.Color();
  let dirI = 1;
  let ambI = 0.6;
  let hemiI = 0.4;

  if (p < 0.18) {
    const t = smoothstep(0, 0.18, p);
    lerpColor(bg, night, dawn, t);
    sunColor = lerpColor(new THREE.Color(), new THREE.Color(0x8bb7ff), new THREE.Color(0xfff1cf), t);
    dirI = lerp(0.15, 1.05, t);
    ambI = lerp(0.18, 0.55, t);
    hemiI = lerp(0.15, 0.42, t);
    hemiSky = lerpColor(new THREE.Color(), night, day, t);
    hemiGround = lerpColor(new THREE.Color(), new THREE.Color(0x0b1f12), new THREE.Color(0x2d5a27), t);
  } else if (p < 0.52) {
    const t = smoothstep(0.18, 0.52, p);
    lerpColor(bg, dawn, day, t);
    sunColor = lerpColor(new THREE.Color(), new THREE.Color(0xfff1cf), new THREE.Color(0xfff5e6), t);
    dirI = lerp(1.05, 1.15, t);
    ambI = lerp(0.55, 0.7, t);
    hemiI = lerp(0.42, 0.48, t);
    hemiSky = day.clone();
    hemiGround = new THREE.Color(0x2d5a27);
  } else if (p < 0.72) {
    const t = smoothstep(0.52, 0.72, p);
    lerpColor(bg, day, dusk, t);
    sunColor = lerpColor(new THREE.Color(), new THREE.Color(0xfff5e6), new THREE.Color(0xffc48a), t);
    dirI = lerp(1.15, 0.55, t);
    ambI = lerp(0.7, 0.38, t);
    hemiI = lerp(0.48, 0.3, t);
    hemiSky = lerpColor(new THREE.Color(), day, dusk, t);
    hemiGround = lerpColor(new THREE.Color(), new THREE.Color(0x2d5a27), new THREE.Color(0x1a2a1a), t);
  } else {
    const t = smoothstep(0.72, 1.0, p);
    lerpColor(bg, dusk, night, t);
    sunColor = lerpColor(new THREE.Color(), new THREE.Color(0xffc48a), new THREE.Color(0x8bb7ff), t);
    dirI = lerp(0.55, 0.12, t);
    ambI = lerp(0.38, 0.14, t);
    hemiI = lerp(0.3, 0.12, t);
    hemiSky = lerpColor(new THREE.Color(), dusk, night, t);
    hemiGround = lerpColor(new THREE.Color(), new THREE.Color(0x1a2a1a), new THREE.Color(0x07160d), t);
  }

  // Movimiento del sol (dirLight) en arco
  const angle = p * Math.PI * 2;
  const sunRadius = 65;
  const y = 18 + Math.sin(angle) * 45;
  lights.dirLight.position.set(
    Math.cos(angle) * sunRadius,
    y,
    Math.sin(angle) * sunRadius
  );

  scene.background.copy(bg);
  if (scene.fog) {
    scene.fog.color.copy(bg);
  }

  lights.dirLight.color.copy(sunColor);
  lights.dirLight.intensity = dirI;

  lights.ambientLight.intensity = ambI;

  lights.hemiLight.color.copy(hemiSky);
  lights.hemiLight.groundColor.copy(hemiGround);
  lights.hemiLight.intensity = hemiI;
}
