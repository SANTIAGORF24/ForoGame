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

  const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x6BCB77, 0.4);
  scene.add(hemiLight);

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
    updateBee(bee, keys, beeSpeed, delta, time);
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
