import * as THREE from 'three';

let butterflies = [];
let birds = [];
let pollenParticles;

export function createAmbientLife(scene) {
  createButterflies(scene, 8);
  createBirds(scene, 4);
  createPollen(scene);
}

function createButterflies(scene, count) {
  const butterflyGeo = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    0, 0, 0,
    -0.3, 0, -0.1,
    -0.1, 0, 0.2,
    0, 0, 0,
    0.3, 0, -0.1,
    0.1, 0, 0.2
  ]);
  butterflyGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  
  const colors = [0xFFB6C1, 0xE6E6FA, 0xFFD93D, 0xFF6B6B, 0x87CEEB];
  
  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const butterflyMat = new THREE.MeshBasicMaterial({ 
      color, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    
    const butterfly = new THREE.Mesh(butterflyGeo, butterflyMat);
    butterfly.position.set(
      (Math.random() - 0.5) * 40,
      2 + Math.random() * 4,
      (Math.random() - 0.5) * 40
    );
    
    butterfly.userData = {
      isButterfly: true,
      baseY: butterfly.position.y,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.5,
      radius: 2 + Math.random() * 3,
      wingPhase: Math.random() * Math.PI * 2
    };
    
    scene.add(butterfly);
    butterflies.push(butterfly);
  }
}

function createBirds(scene, count) {
  const birdGeo = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    0, 0, 0.3,
    -0.15, 0.05, -0.1,
    0.15, 0.05, -0.1
  ]);
  birdGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  
  for (let i = 0; i < count; i++) {
    const birdMat = new THREE.MeshBasicMaterial({ 
      color: 0x2a2a2a,
      side: THREE.DoubleSide
    });
    
    const bird = new THREE.Mesh(birdGeo, birdMat);
    bird.position.set(
      (Math.random() - 0.5) * 60,
      12 + Math.random() * 8,
      (Math.random() - 0.5) * 60
    );
    
    bird.userData = {
      isBird: true,
      baseY: bird.position.y,
      phase: Math.random() * Math.PI * 2,
      speed: 1 + Math.random() * 0.5,
      radiusX: 10 + Math.random() * 10,
      radiusZ: 10 + Math.random() * 10,
      heightVar: 2 + Math.random() * 2
    };
    
    scene.add(bird);
    birds.push(bird);
  }
}

function createPollen(scene) {
  const pollenCount = 200;
  const pollenGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(pollenCount * 3);
  
  for (let i = 0; i < pollenCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 60;
    positions[i + 1] = Math.random() * 8;
    positions[i + 2] = (Math.random() - 0.5) * 60;
  }
  
  pollenGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const pollenMat = new THREE.PointsMaterial({
    color: 0xFFD93D,
    size: 0.1,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true
  });
  
  pollenParticles = new THREE.Points(pollenGeo, pollenMat);
  scene.add(pollenParticles);
}

export function updateAmbientLife(time) {
  butterflies.forEach(b => {
    const d = b.userData;
    b.position.x += Math.sin(time * d.speed + d.phase) * 0.02;
    b.position.z += Math.cos(time * d.speed + d.phase) * 0.02;
    b.position.y = d.baseY + Math.sin(time * 2 + d.phase) * 0.5;
    
    const wingAngle = Math.sin(time * 15 + d.wingPhase) * 0.5;
    b.rotation.z = wingAngle;
    
    if (b.position.x > 30) b.position.x = -30;
    if (b.position.x < -30) b.position.x = 30;
    if (b.position.z > 30) b.position.z = -30;
    if (b.position.z < -30) b.position.z = 30;
  });
  
  birds.forEach(b => {
    const d = b.userData;
    const t = time * d.speed + d.phase;
    b.position.x = Math.sin(t) * d.radiusX;
    b.position.z = Math.cos(t * 0.7) * d.radiusZ;
    b.position.y = d.baseY + Math.sin(t * 2) * d.heightVar;
    
    b.rotation.y = Math.atan2(
      Math.cos(t) * d.radiusX,
      -Math.sin(t * 0.7) * 0.7 * d.radiusZ
    );
  });
  
  if (pollenParticles) {
    const positions = pollenParticles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += Math.sin(time + i) * 0.005;
      positions[i + 1] += Math.sin(time * 0.5 + i * 0.1) * 0.003;
      positions[i + 2] += Math.cos(time + i) * 0.005;
      
      if (positions[i + 1] > 10) positions[i + 1] = 0;
      if (positions[i + 1] < 0) positions[i + 1] = 10;
    }
    pollenParticles.geometry.attributes.position.needsUpdate = true;
  }
}

export function setButterflyCount(count, scene) {
  while (butterflies.length > count) {
    const b = butterflies.pop();
    scene.remove(b);
  }
  
  while (butterflies.length < count) {
    const butterflyGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0, 0, -0.3, 0, -0.1, -0.1, 0, 0.2,
      0, 0, 0, 0.3, 0, -0.1, 0.1, 0, 0.2
    ]);
    butterflyGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    const colors = [0xFFB6C1, 0xE6E6FA, 0xFFD93D, 0xFF6B6B, 0x87CEEB];
    const butterflyMat = new THREE.MeshBasicMaterial({ 
      color: colors[Math.floor(Math.random() * colors.length)],
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    
    const butterfly = new THREE.Mesh(butterflyGeo, butterflyMat);
    butterfly.position.set(
      (Math.random() - 0.5) * 40,
      2 + Math.random() * 4,
      (Math.random() - 0.5) * 40
    );
    
    butterfly.userData = {
      isButterfly: true,
      baseY: butterfly.position.y,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.5,
      radius: 2 + Math.random() * 3,
      wingPhase: Math.random() * Math.PI * 2
    };
    
    scene.add(butterfly);
    butterflies.push(butterfly);
  }
}
