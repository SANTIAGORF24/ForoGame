import * as THREE from 'three';
import { getEvidenciasPreviewImages, getEvidenciasGallery } from './evidenciasMedia.js';

let zones = [];

export function createZones(scene) {
  zones = [
    createSpawnVideoZone(scene),
    createEvidenceZone(scene),
    createPlanningZone(scene),
    createBookZone(scene),
    createBioZone(scene)
  ];
  
  return zones;
}

function createSpawnVideoZone(scene) {
  const zoneGroup = new THREE.Group();
  zoneGroup.position.set(0, 0, 0);
  scene.add(zoneGroup);

  return {
    type: 'introVideo',
    name: 'Video introductorio',
    message: 'Presiona E para ver video introductorio',
    position: zoneGroup.position.clone(),
    mesh: zoneGroup,
    data: { videoUrl: '/assets/video.mp4' },
    update: () => {}
  };
}

function createEvidenceZone(scene) {
  const zoneGroup = new THREE.Group();
  zoneGroup.position.set(20, 0, 20);
  
  const zoneMat = new THREE.MeshStandardMaterial({
    color: 0x6BCB77,
    transparent: true,
    opacity: 0.15
  });
  const zoneGround = new THREE.Mesh(
    new THREE.CircleGeometry(7, 24),
    zoneMat
  );
  zoneGround.rotation.x = -Math.PI / 2;
  zoneGroup.add(zoneGround);

  const signPost = createSignPost('EVIDENCIAS', 0xFF6B6B);
  signPost.position.set(0, 0, -4);
  zoneGroup.add(signPost);

  const previewItems = getEvidenciasPreviewImages();
  const evidencePositions = [
    { x: -2.4, z: 0, img: previewItems[0].url, title: previewItems[0].title },
    { x: -1.2, z: 0, img: previewItems[1].url, title: previewItems[1].title },
    { x: 0, z: 0, img: previewItems[2].url, title: previewItems[2].title },
    { x: 1.2, z: 0, img: previewItems[3].url, title: previewItems[3].title },
    { x: 2.4, z: 0, img: previewItems[4].url, title: previewItems[4].title }
  ];

  const textureLoader = new THREE.TextureLoader();
  evidencePositions.forEach((pos, i) => {
    const frame = createPolaroidFrame(pos.img, pos.title, i, textureLoader);
    frame.position.set(pos.x, 3, pos.z);
    zoneGroup.add(frame);
  });

  scene.add(zoneGroup);

  return {
    type: 'evidence',
    name: 'Zona de Evidencias',
    message: 'Presiona E para ver galería de evidencias',
    position: zoneGroup.position,
    mesh: zoneGroup,
    data: { frames: evidencePositions, gallery: getEvidenciasGallery() },
    update: (mesh, time) => {
      mesh.children.forEach(child => {
        if (child.userData.isPolaroid) {
          child.position.y = 3 + Math.sin(time * 1.5 + child.userData.index * Math.PI) * 0.2;
          child.rotation.y = Math.sin(time * 0.5 + child.userData.index) * 0.1;
        }
      });
    }
  };
}

function createSignPost(text, color) {
  const group = new THREE.Group();
  group.userData.isSignPost = true;
  
  const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 3, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.9 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.set(-0.8, 1.5, 0);
  pole.castShadow = true;
  group.add(pole);
  
  const boardGeo = new THREE.BoxGeometry(2.2, 0.8, 0.1);
  const boardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.set(0.3, 2.8, 0);
  board.castShadow = true;
  group.add(board);

  const borderGeo = new THREE.BoxGeometry(2.3, 0.9, 0.06);
  const borderMat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.3 });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.set(0.3, 2.8, -0.04);
  group.add(border);
  
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 180);
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 42px "Press Start 2P", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 90);
  
  const texture = new THREE.CanvasTexture(canvas);
  const labelGeo = new THREE.PlaneGeometry(2, 0.7);
  const labelMat = new THREE.MeshStandardMaterial({ map: texture });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.set(0.3, 2.8, 0.06);
  group.add(label);

  return group;
}

function createPolaroidFrame(imgUrl, title, index, textureLoader) {
  const group = new THREE.Group();
  group.userData.isPolaroid = true;
  group.userData.index = index;
  group.userData.type = 'evidence';
  
  const frameWidth = 1.4;
  const frameHeight = 1.8;
  const frameDepth = 0.08;
  const borderSize = 0.12;
  
  const baseGeo = new THREE.BoxGeometry(frameWidth + borderSize * 2, frameHeight + borderSize * 2, frameDepth);
  const baseMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.1
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.castShadow = true;
  group.add(base);

  const photoGeo = new THREE.PlaneGeometry(frameWidth - 0.05, frameHeight - 0.3);
  const photoMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0,
    side: THREE.DoubleSide
  });
  const photo = new THREE.Mesh(photoGeo, photoMat);
  photo.position.z = frameDepth / 2 + 0.01;
  photo.position.y = 0.15;
  photo.userData.imgUrl = imgUrl;
  group.add(photo);

  const photoBackMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0,
    side: THREE.DoubleSide
  });
  const photoBack = new THREE.Mesh(photoGeo.clone(), photoBackMat);
  photoBack.position.z = -frameDepth / 2 - 0.01;
  photoBack.position.y = 0.15;
  photoBack.rotation.y = Math.PI;
  group.add(photoBack);

  if (textureLoader && imgUrl) {
    const applyTex = (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
    };
    textureLoader.load(imgUrl, (tex) => {
      applyTex(tex);
      photoMat.map = tex;
      photoMat.needsUpdate = true;
    });
    textureLoader.load(imgUrl, (tex) => {
      applyTex(tex);
      photoBackMat.map = tex;
      photoBackMat.needsUpdate = true;
    });
  }

  const bottomGeo = new THREE.PlaneGeometry(frameWidth - 0.1, 0.25);
  const bottomCanvas = document.createElement('canvas');
  bottomCanvas.width = 128;
  bottomCanvas.height = 32;
  const bottomCtx = bottomCanvas.getContext('2d');
  bottomCtx.fillStyle = '#ffffff';
  bottomCtx.fillRect(0, 0, 128, 32);
  bottomCtx.fillStyle = '#1a1a2e';
  bottomCtx.font = 'bold 14px "Press Start 2P", cursive';
  bottomCtx.textAlign = 'center';
  bottomCtx.fillText(title.length > 10 ? title.substring(0, 10) : title, 64, 22);
  const bottomTex = new THREE.CanvasTexture(bottomCanvas);
  const bottomMat = new THREE.MeshStandardMaterial({ map: bottomTex });
  const bottom = new THREE.Mesh(bottomGeo, bottomMat);
  bottom.position.z = frameDepth / 2 + 0.01;
  bottom.position.y = -frameHeight / 2 + 0.35;
  group.add(bottom);

  const glowGeo = new THREE.BoxGeometry(frameWidth + borderSize * 2 + 0.2, frameHeight + borderSize * 2 + 0.2, 0.05);
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xFFD93D,
    transparent: true,
    opacity: 0,
    emissive: 0xFFD93D,
    emissiveIntensity: 0.8
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.z = -frameDepth / 2 - 0.03;
  glow.userData.isGlow = true;
  group.add(glow);

  return group;
}

function createPlanningZone(scene) {
  const zoneGroup = new THREE.Group();
  zoneGroup.position.set(-15, 0, 25);
  
  const zoneMat = new THREE.MeshStandardMaterial({
    color: 0x4ECDC4,
    transparent: true,
    opacity: 0.15
  });
  const zoneGround = new THREE.Mesh(
    new THREE.CircleGeometry(7, 24),
    zoneMat
  );
  zoneGround.rotation.x = -Math.PI / 2;
  zoneGroup.add(zoneGround);

  const signPost = createSignPost('PLANEACIONES', 0x4ECDC4);
  signPost.position.set(-4, 0, -3);
  zoneGroup.add(signPost);

  const specialTree = createSpecialTree();
  specialTree.position.set(0, 0, 0);
  zoneGroup.add(specialTree);

  const markerGeo = new THREE.ConeGeometry(0.3, 0.6, 4);
  const markerMat = new THREE.MeshStandardMaterial({ 
    color: 0xFFD93D,
    emissive: 0xFFD93D,
    emissiveIntensity: 0.3
  });
  const marker = new THREE.Mesh(markerGeo, markerMat);
  marker.position.set(3, 4, 0);
  marker.rotation.z = Math.PI;
  zoneGroup.add(marker);

  scene.add(zoneGroup);

  return {
    type: 'planning',
    name: 'Zona de Planeaciones',
    message: 'Presiona E para ver planeación',
    position: zoneGroup.position,
    mesh: zoneGroup,
    data: { pdf: 'sample.pdf' },
    update: (mesh, time) => {
      marker.position.y = 2 + Math.sin(time * 3) * 0.3;
      marker.rotation.y = time;
    }
  };
}

function createSpecialTree() {
  const tree = new THREE.Group();
  
  const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 4, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ 
    color: 0x5D4037,
    roughness: 0.9,
    flatShading: true
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 2;
  trunk.castShadow = true;
  tree.add(trunk);

  const foliageColors = [0xFFD93D, 0xFFA500, 0xFF8C00];
  const foliageColor = foliageColors[Math.floor(Math.random() * foliageColors.length)];
  
  for (let i = 0; i < 4; i++) {
    const size = (3 - i * 0.5);
    const foliageGeo = new THREE.ConeGeometry(size, 3, 6);
    const foliageMat = new THREE.MeshStandardMaterial({ 
      color: foliageColor,
      roughness: 0.7,
      flatShading: true
    });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = (4 + i * 1.8);
    foliage.castShadow = true;
    tree.add(foliage);
  }
  
  tree.userData.isSpecial = true;
  
  return tree;
}

function createBookZone(scene) {
  const zoneGroup = new THREE.Group();
  zoneGroup.position.set(0, 0, -20);
  
  const zoneMat = new THREE.MeshStandardMaterial({
    color: 0xFF6B6B,
    transparent: true,
    opacity: 0.15
  });
  const zoneGround = new THREE.Mesh(
    new THREE.CircleGeometry(7, 24),
    zoneMat
  );
  zoneGround.rotation.x = -Math.PI / 2;
  zoneGroup.add(zoneGround);

  const signPost = createSignPost('LIBRO', 0x6BCB77);
  signPost.position.set(3, 0, -3);
  zoneGroup.add(signPost);

  const book = createStandingBook();
  book.position.set(0, 2.8, 0);
  zoneGroup.add(book);

  scene.add(zoneGroup);

  return {
    type: 'book',
    name: 'Zona de Libro y Juegos',
    message: 'Presiona E para ver contenido',
    position: zoneGroup.position,
    mesh: zoneGroup,
    update: (mesh, time) => {
      if (book) {
        book.rotation.y = Math.sin(time * 0.8) * 0.05;
      }
    }
  };
}

function createStandingBook() {
  const group = new THREE.Group();
  group.userData.isStandingBook = true;
  
  const bookWidth = 2;
  const bookHeight = 2.8;
  const bookDepth = 0.3;
  const coverColor = 0x8B4513;
  const pageColor = 0xF5F5DC;
  
  const coverBackGeo = new THREE.BoxGeometry(bookWidth, bookHeight, bookDepth);
  const coverBackMat = new THREE.MeshStandardMaterial({ color: coverColor, roughness: 0.8 });
  const coverBack = new THREE.Mesh(coverBackGeo, coverBackMat);
  coverBack.position.z = -bookDepth / 2;
  coverBack.castShadow = true;
  group.add(coverBack);
  
  const pagesGeo = new THREE.BoxGeometry(bookWidth - 0.15, bookHeight - 0.1, bookDepth - 0.05);
  const pagesMat = new THREE.MeshStandardMaterial({ color: pageColor, roughness: 0.9 });
  const pages = new THREE.Mesh(pagesGeo, pagesMat);
  group.add(pages);
  
  const coverFrontGeo = new THREE.BoxGeometry(bookWidth, bookHeight, bookDepth * 0.3);
  const coverFrontMat = new THREE.MeshStandardMaterial({ color: coverColor, roughness: 0.7 });
  const coverFront = new THREE.Mesh(coverFrontGeo, coverFrontMat);
  coverFront.position.z = bookDepth / 2 + bookDepth * 0.15;
  coverFront.castShadow = true;
  group.add(coverFront);
  
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, '#FFD93D');
  gradient.addColorStop(0.5, '#FFA500');
  gradient.addColorStop(1, '#FFD93D');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 48px "Press Start 2P", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📚', 256, 180);
  ctx.font = 'bold 36px "Press Start 2P", cursive';
  ctx.fillText('LIBRO', 256, 300);
  ctx.font = '20px "VT323", monospace';
  ctx.fillStyle = '#333';
  ctx.fillText('Conocimiento', 256, 380);
  
  const texture = new THREE.CanvasTexture(canvas);
  const labelGeo = new THREE.PlaneGeometry(bookWidth - 0.3, bookHeight - 0.3);
  const labelMat = new THREE.MeshStandardMaterial({ 
    map: texture,
    roughness: 0.5
  });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.z = bookDepth / 2 + bookDepth * 0.3 + 0.01;
  group.add(label);

  const glowGeo = new THREE.BoxGeometry(bookWidth + 0.3, bookHeight + 0.3, 0.1);
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xFFD93D,
    transparent: true,
    opacity: 0,
    emissive: 0xFFD93D,
    emissiveIntensity: 0.8
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.z = -bookDepth / 2 - 0.05;
  glow.userData.isGlow = true;
  group.add(glow);

  return group;
}

function createBioZone(scene) {
  const zoneGroup = new THREE.Group();
  zoneGroup.position.set(-25, 0, -10);
  
  const zoneMat = new THREE.MeshStandardMaterial({
    color: 0xE6E6FA,
    transparent: true,
    opacity: 0.15
  });
  const zoneGround = new THREE.Mesh(
    new THREE.CircleGeometry(8, 24),
    zoneMat
  );
  zoneGround.rotation.x = -Math.PI / 2;
  zoneGroup.add(zoneGround);

  const signPost = createSignPost('BIOGRAFÍAS', 0x9B59B6);
  signPost.position.set(4, 0, 2);
  zoneGroup.add(signPost);

  const bioPositions = [
    { x: -2.4, z: 0, name: 'Laura Garzón', title: 'Biografía 1', emoji: '👑', imageUrl: '/assets/Biografia1.png' },
    { x: 2.4, z: 0, name: 'Biografía 2', title: 'Biografía 2', emoji: '🐝', imageUrl: '/assets/Biografia2.png' }
  ];

  const loader = new THREE.TextureLoader();
  bioPositions.forEach((pos, i) => {
    const card = createStandingBioCard(pos.name, pos.title, pos.emoji, i, pos.imageUrl, loader);
    card.position.set(pos.x, 3.2, pos.z);
    zoneGroup.add(card);
  });

  scene.add(zoneGroup);

  return {
    type: 'bio',
    name: 'Zona de Biografías',
    message: 'Presiona E para ver biografías',
    position: zoneGroup.position,
    mesh: zoneGroup,
    data: { cards: bioPositions },
    update: (mesh, time) => {
      mesh.children.forEach(child => {
        if (child.userData.isStandingBioCard) {
          child.position.y = 3.2 + Math.sin(time * 2 + child.userData.index * 0.5) * 0.12;
          child.rotation.y = Math.sin(time * 0.3 + child.userData.index) * 0.06;
        }
      });
    }
  };
}

function createStandingBioCard(name, title, emoji, index, imageUrl, textureLoader) {
  const group = new THREE.Group();
  group.userData.isStandingBioCard = true;
  group.userData.index = index;
  group.userData.type = 'bio';
  
  const cardWidth = 2;
  const cardHeight = 2.6;
  const borderSize = 0.12;
  
  const baseGeo = new THREE.BoxGeometry(cardWidth + borderSize * 2, cardHeight + borderSize * 2, 0.06);
  const baseMat = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a2e,
    roughness: 0.95,
    metalness: 0
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.castShadow = true;
  group.add(base);
  
  const cardGeo = new THREE.PlaneGeometry(cardWidth, cardHeight);
  const cardMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0,
    side: THREE.DoubleSide
  });

  if (imageUrl && textureLoader) {
    textureLoader.load(imageUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      cardMat.map = tex;
      cardMat.needsUpdate = true;
    });
  } else {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 341;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 341);
    gradient.addColorStop(0, '#2a2a4e');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 341);
    ctx.fillStyle = '#FFD93D';
    ctx.beginPath();
    ctx.arc(128, 90, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(emoji, 128, 108);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px "Press Start 2P", cursive';
    ctx.fillText(title, 128, 180);
    ctx.fillStyle = '#aaa';
    ctx.font = '14px "VT323", monospace';
    ctx.fillText(name, 128, 220);
    ctx.fillStyle = '#FF6B6B';
    ctx.font = '12px "VT323", monospace';
    ctx.fillText('Presiona E', 128, 300);
    cardMat.map = new THREE.CanvasTexture(canvas);
  }

  const card = new THREE.Mesh(cardGeo, cardMat);
  card.position.z = 0.045;
  group.add(card);

  const cardBackMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0,
    side: THREE.DoubleSide
  });
  if (imageUrl && textureLoader) {
    textureLoader.load(imageUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      cardBackMat.map = tex;
      cardBackMat.needsUpdate = true;
    });
  } else if (cardMat.map) {
    cardBackMat.map = cardMat.map;
  }
  const cardBack = new THREE.Mesh(cardGeo.clone(), cardBackMat);
  cardBack.position.z = -0.035;
  cardBack.rotation.y = Math.PI;
  group.add(cardBack);

  return group;
}

export function checkProximity(playerPos, zones) {
  const threshold = 6;
  
  for (const zone of zones) {
    const dist = playerPos.distanceTo(zone.position);
    if (dist < threshold) {
      return zone;
    }
  }
  
  return null;
}

export function getZones() {
  return zones;
}
