import * as THREE from 'three';

let scene, camera, renderer, clock;
let titleMesh, subtitleMesh;
let bees = [];
let particles;
let isReady = false;
let onCompleteCallback;

export function createIntro(onComplete) {
  onCompleteCallback = onComplete;
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.z = 5;
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.getElementById('app').appendChild(renderer.domElement);
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const spotLight = new THREE.SpotLight(0xFFD93D, 2);
  spotLight.position.set(0, 5, 5);
  spotLight.angle = Math.PI / 4;
  spotLight.penumbra = 0.5;
  scene.add(spotLight);

  createTitle();
  createSubtitle();
  createIntroBees();
  createParticles();
  
  clock = new THREE.Clock();
  
  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeyDown);
  
  animate();
}

function createTitle() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createLinearGradient(0, 0, 1024, 0);
  gradient.addColorStop(0, '#FFD93D');
  gradient.addColorStop(0.5, '#FFA500');
  gradient.addColorStop(1, '#FFD93D');
  
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 1024, 256);
  
  ctx.fillStyle = gradient;
  ctx.font = 'bold 120px "Press Start 2P", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#FFD93D';
  ctx.shadowBlur = 30;
  ctx.fillText('FORO ABEJA', 512, 120);
  
  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({ 
    map: texture, 
    transparent: true,
    side: THREE.DoubleSide
  });
  
  const geo = new THREE.PlaneGeometry(5, 1.25);
  titleMesh = new THREE.Mesh(geo, mat);
  titleMesh.position.y = 0.8;
  scene.add(titleMesh);
}

function createSubtitle() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, 512, 64);
  
  ctx.fillStyle = '#6BCB77';
  ctx.font = '24px "VT323", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Hecho por Alejandra Cañon', 256, 32);
  
  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({ 
    map: texture, 
    transparent: true,
    side: THREE.DoubleSide
  });
  
  const geo = new THREE.PlaneGeometry(2.5, 0.3);
  subtitleMesh = new THREE.Mesh(geo, mat);
  subtitleMesh.position.y = -0.3;
  subtitleMesh.material.opacity = 0;
  scene.add(subtitleMesh);
}

function createIntroBees() {
  const beeGeo = new THREE.SphereGeometry(0.08, 8, 6);
  const beeMat = new THREE.MeshStandardMaterial({ 
    color: 0xFFD93D,
    emissive: 0xFFD93D,
    emissiveIntensity: 0.3
  });
  
  for (let i = 0; i < 12; i++) {
    const bee = new THREE.Mesh(beeGeo, beeMat);
    const angle = (i / 12) * Math.PI * 2;
    const radius = 2 + Math.random() * 2;
    bee.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 2,
      Math.sin(angle) * radius - 2
    );
    bee.userData = {
      angle,
      radius,
      speed: 0.3 + Math.random() * 0.4,
      yOffset: Math.random() * Math.PI * 2
    };
    scene.add(bee);
    bees.push(bee);
    
    const wingGeo = new THREE.CircleGeometry(0.1, 6, 0, Math.PI);
    const wingMat = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(0.08, 0.03, 0);
    bee.add(wingL);
    const wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.position.set(-0.08, 0.03, 0);
    wingR.scale.x = -1;
    bee.add(wingR);
  }
}

function createParticles() {
  const count = 100;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 10;
    positions[i + 1] = (Math.random() - 0.5) * 6;
    positions[i + 2] = (Math.random() - 0.5) * 6 - 2;
  }
  
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const mat = new THREE.PointsMaterial({
    color: 0xFFD93D,
    size: 0.05,
    transparent: true,
    opacity: 0.6
  });
  
  particles = new THREE.Points(geo, mat);
  scene.add(particles);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(e) {
  if (!isReady && (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE')) {
    startGame();
  }
}

function startGame() {
  if (isReady) return;
  isReady = true;
  
  const fadeOut = () => {
    renderer.domElement.style.transition = 'opacity 0.8s ease';
    renderer.domElement.style.opacity = '0';
    setTimeout(() => {
      renderer.domElement.remove();
      if (onCompleteCallback) onCompleteCallback();
    }, 800);
  };
  
  fadeOut();
}

function animate() {
  if (isReady) return;
  
  requestAnimationFrame(animate);
  
  const time = clock.getElapsedTime();
  const delta = clock.getDelta();
  
  if (titleMesh) {
    titleMesh.position.y = 0.8 + Math.sin(time * 2) * 0.05;
    titleMesh.material.rotation = Math.sin(time * 0.5) * 0.02;
  }
  
  if (subtitleMesh && time > 1.5) {
    subtitleMesh.material.opacity = Math.min((time - 1.5) * 0.5, 1);
  }
  
  if (time > 3) {
    const pulse = Math.sin(time * 3) * 0.5 + 0.5;
    subtitleMesh.material.opacity = 0.5 + pulse * 0.5;
  }
  
  bees.forEach((bee, i) => {
    const d = bee.userData;
    bee.position.x = Math.cos(d.angle + time * d.speed) * d.radius;
    bee.position.z = Math.sin(d.angle + time * d.speed) * d.radius - 2;
    bee.position.y = Math.sin(time * 3 + d.yOffset) * 0.3;
    
    bee.rotation.y = d.angle + time * d.speed + Math.PI / 2;
    
    bee.children.forEach(child => {
      if (child.geometry?.type === 'CircleGeometry') {
        child.rotation.z = Math.sin(time * 20 + i) * 0.5;
      }
    });
  });
  
  if (particles) {
    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += Math.sin(time + i) * 0.002;
      positions[i + 1] += 0.005;
      if (positions[i + 1] > 3) positions[i + 1] = -3;
    }
    particles.geometry.attributes.position.needsUpdate = true;
  }
  
  renderer.render(scene, camera);
}

export function destroyIntro() {
  if (renderer) {
    renderer.domElement.remove();
  }
  window.removeEventListener('resize', onResize);
  window.removeEventListener('keydown', onKeyDown);
}
