import * as THREE from 'three';

let spawnUpdate = null;

export function createWorld(scene) {
  createGround(scene);
  createTrees(scene);
  createBorderTrees(scene);
  createFlowers(scene);
  createRocks(scene);
  createClouds(scene);
  spawnUpdate = createSpawnArea(scene);
}

export function getSpawnUpdate() {
  return spawnUpdate ? spawnUpdate.update : null;
}

function createGround(scene) {
  const groundGeo = new THREE.PlaneGeometry(100, 100, 20, 20);
  const vertices = groundGeo.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    vertices[i + 2] += (Math.random() - 0.5) * 0.5;
  }
  groundGeo.computeVertexNormals();
  
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x4a7c3f,
    roughness: 0.9,
    flatShading: true
  });
  
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grassColors = [0x3d6b35, 0x4a7c3f, 0x5a8c4f, 0x3a5c2f];
  const grassGeo = new THREE.ConeGeometry(0.1, 0.3, 4);
  
  for (let i = 0; i < 500; i++) {
    const color = grassColors[Math.floor(Math.random() * grassColors.length)];
    const grassMat = new THREE.MeshStandardMaterial({ color, flatShading: true });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    
    grass.position.set(
      (Math.random() - 0.5) * 80,
      0.15,
      (Math.random() - 0.5) * 80
    );
    grass.rotation.y = Math.random() * Math.PI;
    grass.scale.setScalar(0.5 + Math.random() * 0.5);
    scene.add(grass);
  }
}

const ZONE_CIRCLES = [
  { x: 0, z: 0, radius: 9 },
  { x: 20, z: 20, radius: 8 },
  { x: -15, z: 25, radius: 8 },
  { x: 0, z: -20, radius: 8 },
  { x: -25, z: -10, radius: 9 }
];

function isInsideZoneCircle(px, pz) {
  return ZONE_CIRCLES.some(({ x, z, radius }) => {
    const dx = px - x;
    const dz = pz - z;
    return dx * dx + dz * dz <= radius * radius;
  });
}

function createTrees(scene) {
  const treePositions = [];
  
  for (let i = 0; i < 42; i++) {
    let x, z;
    let attempts = 0;
    do {
      x = (Math.random() - 0.5) * 70;
      z = (Math.random() - 0.5) * 70;
      attempts++;
    } while (isInsideZoneCircle(x, z) && attempts < 200);
    
    if (isInsideZoneCircle(x, z)) continue;
    treePositions.push({ x, z, scale: 0.8 + Math.random() * 0.6 });
  }
  
  treePositions.forEach(pos => createTree(scene, pos.x, pos.z, pos.scale));
}

const BORDER_FOLIAGE_COLORS = [
  0x228B22, 0x2E8B57, 0x3CB371, 0x2d5a27, 0x1a472a, 0x4a7c3f,
  0x556B2F, 0x006400, 0x458B00, 0x3d6b35, 0x5a8c4f, 0x2E7D32,
  0x1B5E20, 0x388E3C, 0x43A047
];

function createBorderTrees(scene) {
  const edge = 50;
  const spacing = 2.8;
  const rows = [48, 50];
  const pickColor = () => BORDER_FOLIAGE_COLORS[Math.floor(Math.random() * BORDER_FOLIAGE_COLORS.length)];

  for (const r of rows) {
    for (let x = -edge; x <= edge; x += spacing) {
      createTree(scene, x, r, 0.9 + Math.random() * 0.5, pickColor());
      createTree(scene, x, -r, 0.9 + Math.random() * 0.5, pickColor());
    }
    for (let z = -edge; z <= edge; z += spacing) {
      createTree(scene, r, z, 0.9 + Math.random() * 0.5, pickColor());
      createTree(scene, -r, z, 0.9 + Math.random() * 0.5, pickColor());
    }
  }
}

function createTree(scene, x, z, scale = 1, customFoliageColor = null) {
  const tree = new THREE.Group();
  
  const trunkGeo = new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 3 * scale, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513,
    roughness: 0.9,
    flatShading: true
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.5 * scale;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const defaultColors = [0x228B22, 0x2E8B57, 0x3CB371];
  const foliageColor = customFoliageColor !== null && customFoliageColor !== undefined
    ? customFoliageColor
    : defaultColors[Math.floor(Math.random() * defaultColors.length)];
  
  for (let i = 0; i < 3; i++) {
    const size = (2.5 - i * 0.5) * scale;
    const foliageGeo = new THREE.ConeGeometry(size, 2.5 * scale, 6);
    const foliageMat = new THREE.MeshStandardMaterial({ 
      color: foliageColor,
      roughness: 0.8,
      flatShading: true
    });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = (3 + i * 1.5) * scale;
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    tree.add(foliage);
  }
  
  tree.position.set(x, 0, z);
  tree.userData.isTree = true;
  scene.add(tree);
  
  return tree;
}

function createFlowers(scene) {
  const flowerColors = [0xFF6B6B, 0xFFB6C1, 0xFFD93D, 0xE6E6FA, 0xFFA07A];
  
  for (let i = 0; i < 60; i++) {
    const flower = createFlower(
      flowerColors[Math.floor(Math.random() * flowerColors.length)]
    );
    
    flower.position.set(
      (Math.random() - 0.5) * 60,
      0,
      (Math.random() - 0.5) * 60
    );
    flower.rotation.y = Math.random() * Math.PI * 2;
    scene.add(flower);
  }
}

function createFlower(color) {
  const flower = new THREE.Group();
  
  const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 4);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 0.25;
  flower.add(stem);

  const petalGeo = new THREE.SphereGeometry(0.1, 6, 4);
  const petalMat = new THREE.MeshStandardMaterial({ 
    color,
    flatShading: true
  });
  
  for (let i = 0; i < 5; i++) {
    const petal = new THREE.Mesh(petalGeo, petalMat);
    const angle = (i / 5) * Math.PI * 2;
    petal.position.set(
      Math.cos(angle) * 0.1,
      0.5,
      Math.sin(angle) * 0.1
    );
    flower.add(petal);
  }
  
  const centerGeo = new THREE.SphereGeometry(0.08, 6, 4);
  const centerMat = new THREE.MeshStandardMaterial({ color: 0xFFD93D });
  const center = new THREE.Mesh(centerGeo, centerMat);
  center.position.y = 0.5;
  flower.add(center);
  
  flower.userData.swayOffset = Math.random() * Math.PI * 2;
  
  return flower;
}

function createRocks(scene) {
  for (let i = 0; i < 20; i++) {
    const rockGeo = new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.4, 0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x808080,
      flatShading: true,
      roughness: 0.9
    });
    const rock = new THREE.Mesh(rockGeo, rockMat);
    
    rock.position.set(
      (Math.random() - 0.5) * 50,
      0.2,
      (Math.random() - 0.5) * 50
    );
    rock.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    rock.scale.y = 0.6;
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }
}

function createClouds(scene) {
  for (let i = 0; i < 8; i++) {
    const cloud = createCloud();
    cloud.position.set(
      (Math.random() - 0.5) * 80,
      15 + Math.random() * 10,
      (Math.random() - 0.5) * 80
    );
    cloud.userData.speed = 0.5 + Math.random() * 0.5;
    scene.add(cloud);
  }
}

function createCloud() {
  const cloud = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    flatShading: true,
    transparent: true,
    opacity: 0.8
  });
  
  for (let i = 0; i < 5; i++) {
    const puffGeo = new THREE.SphereGeometry(1 + Math.random() * 1.5, 6, 4);
    const puff = new THREE.Mesh(puffGeo, cloudMat);
    puff.position.set(
      (i - 2) * 1.2,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.8
    );
    cloud.add(puff);
  }
  
  return cloud;
}

function createSpawnArea(scene) {
  const spawnGroup = new THREE.Group();
  spawnGroup.position.set(0, 0, 0);

  const platformGeo = new THREE.CylinderGeometry(3, 3.5, 0.3, 16);
  const platformMat = new THREE.MeshStandardMaterial({
    color: 0x8B4513,
    roughness: 0.8,
    flatShading: true
  });
  const platform = new THREE.Mesh(platformGeo, platformMat);
  platform.position.y = 0.15;
  platform.castShadow = true;
  platform.receiveShadow = true;
  spawnGroup.add(platform);

  const titleFrame = createMainTitleFrame();
  titleFrame.position.set(0, 6, 5);
  spawnGroup.add(titleFrame);

  const subtitleFrame = createSubtitleFrame();
  subtitleFrame.position.set(0, 4.5, 5);
  spawnGroup.add(subtitleFrame);

  const directionsFrame = createDirectionsFrame();
  directionsFrame.position.set(0, 2.2, 5);
  spawnGroup.add(directionsFrame);

  const flowerRing = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const flower = createFlower([0xFF6B6B, 0xFFB6C1, 0xFFD93D, 0xE6E6FA, 0xFFA07A][Math.floor(Math.random() * 5)]);
    flower.position.set(
      Math.cos(angle) * 4,
      0.3,
      Math.sin(angle) * 4
    );
    flower.scale.setScalar(1.5);
    spawnGroup.add(flower);
  }

  const smallBees = [];
  for (let i = 0; i < 5; i++) {
    const bee = createSmallBee();
    const angle = (i / 5) * Math.PI * 2;
    bee.position.set(
      Math.cos(angle) * 2,
      3 + Math.random() * 2,
      Math.sin(angle) * 2
    );
    bee.userData = {
      baseY: bee.position.y,
      angle: angle,
      speed: 0.5 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2
    };
    spawnGroup.add(bee);
    smallBees.push(bee);
  }

  scene.add(spawnGroup);

  return {
    update: (time) => {
      smallBees.forEach(bee => {
        const d = bee.userData;
        bee.position.x = Math.cos(d.angle + time * d.speed) * (2 + Math.sin(time + d.phase) * 0.5);
        bee.position.z = Math.sin(d.angle + time * d.speed) * (2 + Math.sin(time + d.phase) * 0.5);
        bee.position.y = d.baseY + Math.sin(time * 2 + d.phase) * 0.3;
        bee.rotation.y = d.angle + time * d.speed + Math.PI / 2;
        
        bee.children.forEach(child => {
          if (child.geometry?.type === 'CircleGeometry') {
            child.rotation.z = Math.sin(time * 20) * 0.5;
          }
        });
      });
    }
  };
}

function createFloatingFrame(title, subtitle, color, x, y, z) {
  const group = new THREE.Group();
  
  const bgGeo = new THREE.BoxGeometry(2.2, 1.2, 0.1);
  const bgMat = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a2e,
    roughness: 0.5,
    metalness: 0.2
  });
  const bg = new THREE.Mesh(bgGeo, bgMat);
  group.add(bg);

  const borderGeo = new THREE.BoxGeometry(2.3, 1.3, 0.08);
  const borderMat = new THREE.MeshStandardMaterial({ 
    color: color,
    emissive: color,
    emissiveIntensity: 0.3,
    roughness: 0.4
  });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.z = -0.02;
  group.add(border);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 512, 256);
  
  const gradient = ctx.createLinearGradient(0, 0, 512, 0);
  const colorHex = '#' + color.toString(16).padStart(6, '0');
  gradient.addColorStop(0, colorHex);
  gradient.addColorStop(0.5, '#' + (color === 0xFFD93D ? 'FFA500' : color === 0x6BCB77 ? '8BC34A' : 'FFD93D').toString(16).padStart(6, '0'));
  gradient.addColorStop(1, colorHex);
  
  ctx.fillStyle = gradient;
  ctx.font = 'bold 56px "Press Start 2P", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = colorHex;
  ctx.shadowBlur = 20;
  ctx.fillText(title, 256, 100);
  
  ctx.font = 'bold 36px "Press Start 2P", cursive';
  ctx.fillText(subtitle, 256, 170);

  const texture = new THREE.CanvasTexture(canvas);
  const screenGeo = new THREE.PlaneGeometry(2, 1);
  const screenMat = new THREE.MeshStandardMaterial({ 
    map: texture,
    emissive: 0x222222,
    emissiveIntensity: 0.3
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.z = 0.06;
  group.add(screen);

  group.position.set(x, y, z);
  group.rotation.y = x > 0 ? 0.3 : -0.3;
  
  return group;
}

function createMainTitleFrame() {
  const group = new THREE.Group();
  
  const bgGeo = new THREE.BoxGeometry(5, 1.4, 0.15);
  const bgMat = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a2e,
    roughness: 0.4,
    metalness: 0.3
  });
  const bg = new THREE.Mesh(bgGeo, bgMat);
  bg.position.z = 0.06;
  group.add(bg);

  const bgBack = new THREE.Mesh(bgGeo.clone(), bgMat.clone());
  bgBack.position.z = -0.06;
  group.add(bgBack);

  const borderGeo = new THREE.BoxGeometry(5.2, 1.6, 0.1);
  const borderMat = new THREE.MeshStandardMaterial({ 
    color: 0xFFD93D,
    emissive: 0xFFD93D,
    emissiveIntensity: 0.5,
    roughness: 0.3
  });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.z = -0.14;
  group.add(border);

  const borderBack = new THREE.Mesh(borderGeo.clone(), borderMat.clone());
  borderBack.position.z = 0.14;
  group.add(borderBack);

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 1024, 256);
  
  const gradient = ctx.createLinearGradient(0, 0, 1024, 0);
  gradient.addColorStop(0, '#FFD93D');
  gradient.addColorStop(0.5, '#FFA500');
  gradient.addColorStop(1, '#FFD93D');
  
  ctx.fillStyle = gradient;
  ctx.font = 'bold 64px "Press Start 2P", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#FFD93D';
  ctx.shadowBlur = 30;
  ctx.fillText('THE LITTLE', 512, 90);
  ctx.fillText('HUMMINGBIRD', 512, 170);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const screenGeo = new THREE.PlaneGeometry(4.8, 1.2);
  const screenMat = new THREE.MeshStandardMaterial({ 
    map: texture,
    emissive: 0x333333,
    emissiveIntensity: 0.4,
    side: THREE.DoubleSide
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.z = 0.22;
  screen.renderOrder = 1;
  group.add(screen);

  const screenBackMat = new THREE.MeshStandardMaterial({ 
    map: texture,
    emissive: 0x333333,
    emissiveIntensity: 0.4,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetUnits: 1,
    polygonOffsetFactor: 1
  });
  const screenBack = new THREE.Mesh(screenGeo.clone(), screenBackMat);
  screenBack.position.z = -0.22;
  screenBack.rotation.y = Math.PI;
  screenBack.renderOrder = 1;
  group.add(screenBack);

  return group;
}

function createSubtitleFrame() {
  const group = new THREE.Group();
  
  const bgGeo = new THREE.BoxGeometry(3, 0.6, 0.1);
  const bgMat = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a2e,
    roughness: 0.5,
    transparent: true,
    opacity: 0.9
  });
  const bg = new THREE.Mesh(bgGeo, bgMat);
  bg.position.z = 0.04;
  group.add(bg);

  const bgBack = new THREE.Mesh(bgGeo.clone(), bgMat.clone());
  bgBack.position.z = -0.04;
  group.add(bgBack);

  const borderGeo = new THREE.BoxGeometry(3.2, 0.8, 0.06);
  const borderMat = new THREE.MeshStandardMaterial({ 
    color: 0x6BCB77,
    emissive: 0x6BCB77,
    emissiveIntensity: 0.3
  });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.z = -0.07;
  group.add(border);

  const borderBack = new THREE.Mesh(borderGeo.clone(), borderMat.clone());
  borderBack.position.z = 0.07;
  group.add(borderBack);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 512, 100);
  
  ctx.fillStyle = '#6BCB77';
  ctx.font = 'bold 28px "Press Start 2P", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🐝 FORO ABEJA 🐝', 256, 50);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const screenGeo = new THREE.PlaneGeometry(2.8, 0.45);
  const screenMat = new THREE.MeshStandardMaterial({ 
    map: texture,
    transparent: true,
    emissive: 0x222222,
    emissiveIntensity: 0.3,
    side: THREE.DoubleSide
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.z = 0.12;
  screen.renderOrder = 1;
  group.add(screen);

  const screenBackMat = new THREE.MeshStandardMaterial({ 
    map: texture,
    transparent: true,
    emissive: 0x222222,
    emissiveIntensity: 0.3,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetUnits: 1,
    polygonOffsetFactor: 1
  });
  const screenBack = new THREE.Mesh(screenGeo.clone(), screenBackMat);
  screenBack.position.z = -0.12;
  screenBack.rotation.y = Math.PI;
  screenBack.renderOrder = 1;
  group.add(screenBack);

  return group;
}

function createDirectionsFrame() {
  const group = new THREE.Group();
  
  const bgGeo = new THREE.BoxGeometry(6, 2.5, 0.1);
  const bgMat = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a2e,
    roughness: 0.5,
    transparent: true,
    opacity: 0.9
  });
  const bg = new THREE.Mesh(bgGeo, bgMat);
  bg.position.z = 0.05;
  group.add(bg);

  const bgBack = new THREE.Mesh(bgGeo.clone(), bgMat.clone());
  bgBack.position.z = -0.05;
  group.add(bgBack);

  const borderGeo = new THREE.BoxGeometry(6.2, 2.7, 0.08);
  const borderMat = new THREE.MeshStandardMaterial({ 
    color: 0xFFD93D,
    emissive: 0xFFD93D,
    emissiveIntensity: 0.2
  });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.z = -0.08;
  group.add(border);

  const borderBack = new THREE.Mesh(borderGeo.clone(), borderMat.clone());
  borderBack.position.z = 0.08;
  group.add(borderBack);

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 340;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 800, 340);
  
  ctx.fillStyle = '#FFD93D';
  ctx.font = 'bold 28px "Press Start 2P", cursive';
  ctx.textAlign = 'center';
  ctx.fillText('¿DÓNDE IR?', 400, 40);
  
  ctx.fillStyle = '#fff';
  ctx.font = '20px "VT323", monospace';
  
  ctx.fillStyle = '#FF6B6B';
  ctx.fillText('📸 EVIDENCIAS', 200, 100);
  ctx.fillStyle = '#aaa';
  ctx.fillText('→derecha→', 200, 130);
  
  ctx.fillStyle = '#4ECDC4';
  ctx.fillText('🌳 PLANEACIONES', 600, 100);
  ctx.fillStyle = '#aaa';
  ctx.fillText('↑frente-izq↑', 600, 130);
  
  ctx.fillStyle = '#6BCB77';
  ctx.fillText('📚 LIBRO', 200, 200);
  ctx.fillStyle = '#aaa';
  ctx.fillText('←atrás←', 200, 230);
  
  ctx.fillStyle = '#9B59B6';
  ctx.fillText('👤 BIOGRAFÍAS', 600, 200);
  ctx.fillStyle = '#aaa';
  ctx.fillText('←atrás-izq←', 600, 230);
  
  ctx.fillStyle = '#FFD93D';
  ctx.font = '18px "VT323", monospace';
  ctx.fillText('Usa WASD o flechas para moverte', 400, 300);
  ctx.fillText('Presiona E para interactuar', 400, 320);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const screenGeo = new THREE.PlaneGeometry(5.8, 2.3);
  const screenMat = new THREE.MeshStandardMaterial({ 
    map: texture,
    emissive: 0x222222,
    emissiveIntensity: 0.3,
    side: THREE.DoubleSide
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.z = 0.15;
  screen.renderOrder = 1;
  group.add(screen);

  const screenBackMat = new THREE.MeshStandardMaterial({ 
    map: texture,
    emissive: 0x222222,
    emissiveIntensity: 0.3,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetUnits: 1,
    polygonOffsetFactor: 1
  });
  const screenBack = new THREE.Mesh(screenGeo.clone(), screenBackMat);
  screenBack.position.z = -0.15;
  screenBack.rotation.y = Math.PI;
  screenBack.renderOrder = 1;
  group.add(screenBack);
   
  return group;
}

function createSmallBee() {
  const group = new THREE.Group();
  
  const bodyGeo = new THREE.SphereGeometry(0.08, 6, 4);
  const bodyMat = new THREE.MeshStandardMaterial({ 
    color: 0xFFD93D,
    emissive: 0xFFD93D,
    emissiveIntensity: 0.2
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.scale.set(1, 0.7, 1.3);
  group.add(body);

  const stripeGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.03, 6);
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.rotation.x = Math.PI / 2;
  stripe.position.z = -0.02;
  group.add(stripe);

  const wingGeo = new THREE.CircleGeometry(0.1, 6, 0, Math.PI);
  const wingMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.5,
    side: THREE.DoubleSide
  });
  
  const wingL = new THREE.Mesh(wingGeo, wingMat);
  wingL.rotation.x = -Math.PI / 2;
  wingL.rotation.z = 0.2;
  wingL.position.set(0.08, 0.03, 0);
  group.add(wingL);
  
  const wingR = new THREE.Mesh(wingGeo, wingMat);
  wingR.rotation.x = -Math.PI / 2;
  wingR.rotation.z = -0.2;
  wingR.position.set(-0.08, 0.03, 0);
  wingR.scale.x = -1;
  group.add(wingR);

  return group;
}

export function updateWorld(scene, time) {
  scene.children.forEach(child => {
    if (child.userData.swayOffset !== undefined) {
      child.rotation.z = Math.sin(time * 2 + child.userData.swayOffset) * 0.1;
    }
    
    if (child.userData.speed && child.position) {
      child.position.x += child.userData.speed * 0.01;
      if (child.position.x > 50) child.position.x = -50;
    }
  });
}
