import * as THREE from 'three';

let spawnUpdate = null;
let PATH_POINTS_XZ = [];
let POND_WATER = null;
const POND_DEF = { x: -32, z: 12, waterRadius: 7.5 };
let ANIMALS = [];

export function createWorld(scene) {
  createGround(scene);
  createPaths(scene);
  createPond(scene);
  createLandmarks(scene);
  createAnimals(scene);
  createTrees(scene);
  createBorderTrees(scene);
  createFlowers(scene);
  createRocks(scene);
  createClouds(scene);
  createSkyBirds(scene);
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
    // Evitar pasto dentro de la laguna (y borde) para que no se vea verde sobre el agua
    let gx, gz;
    let tries = 0;
    do {
      gx = (Math.random() - 0.5) * 80;
      gz = (Math.random() - 0.5) * 80;
      tries++;
    } while (isInsidePond(gx, gz, POND_DEF.waterRadius * 1.28) && tries < 80);
    if (isInsidePond(gx, gz, POND_DEF.waterRadius * 1.28)) continue;

    const color = grassColors[Math.floor(Math.random() * grassColors.length)];
    const grassMat = new THREE.MeshStandardMaterial({ color, flatShading: true });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    
    grass.position.set(
      gx,
      0.15,
      gz
    );
    grass.rotation.y = Math.random() * Math.PI;
    grass.scale.setScalar(0.5 + Math.random() * 0.5);
    scene.add(grass);
  }
}

function createPaths(scene) {
  // Senderos desde el spawn (centro) hacia cada zona principal
  const start = new THREE.Vector3(0, 0.06, 0);
  const targets = [
    { x: 20, z: 20 }, // evidencias
    { x: -15, z: 25 }, // planeaciones
    { x: 0, z: -20 }, // libro
    { x: 15, z: -20 }, // pictionary
    { x: -25, z: -10 }, // biografías
    { x: 30, z: 0 } // video hummingbird
  ].map((t) => new THREE.Vector3(t.x, 0.06, t.z));

  // Reiniciar cache de puntos de camino (para no repetir si se recrea el mundo)
  PATH_POINTS_XZ = [];

  // Sendero sutil: piedritas (instanced) en lugar de "tubos"
  const pebbleGeo = new THREE.DodecahedronGeometry(0.12, 0);
  const pebbleMatA = new THREE.MeshStandardMaterial({
    color: 0xb8b1a6,
    roughness: 0.98,
    metalness: 0,
    flatShading: true
  });
  const pebbleMatB = new THREE.MeshStandardMaterial({
    color: 0x8f8a82,
    roughness: 0.98,
    metalness: 0,
    flatShading: true
  });

  targets.forEach((end) => {
    const mid = start.clone().lerp(end, 0.5);
    // Curva suave hacia un lado para que no sea línea recta perfecta
    const side = new THREE.Vector3(-(end.z - start.z), 0, end.x - start.x)
      .normalize()
      .multiplyScalar(4 + Math.random() * 3);
    const control = mid.clone().add(side);

    const curve = new THREE.CatmullRomCurve3(
      [start, control, end],
      false,
      "catmullrom",
      0.15
    );

    // Guardar puntos (XZ) para evitar árboles encima del camino
    // (muestras uniformes a lo largo de la curva)
    const samples = 90;
    for (let i = 0; i <= samples; i++) {
      const p = curve.getPoint(i / samples);
      PATH_POINTS_XZ.push({ x: p.x, z: p.z });
    }

    // Cantidad de piedritas según longitud aproximada del camino
    const approxLen = start.distanceTo(end);
    const count = Math.floor(approxLen * 5.2); // densidad

    const instA = new THREE.InstancedMesh(pebbleGeo, pebbleMatA, Math.ceil(count * 0.6));
    const instB = new THREE.InstancedMesh(pebbleGeo, pebbleMatB, Math.floor(count * 0.4));
    instA.receiveShadow = true;
    instB.receiveShadow = true;
    instA.castShadow = false;
    instB.castShadow = false;
    instA.userData.isPath = true;
    instB.userData.isPath = true;

    const dummy = new THREE.Object3D();
    let a = 0;
    let b = 0;

    for (let i = 0; i < count; i++) {
      const t = i / Math.max(1, count - 1);
      const p = curve.getPoint(t);

      // ancho del sendero
      const dir = curve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-dir.z, 0, dir.x);
      const lateral = (Math.random() - 0.5) * 1.2; // ±0.6
      const jitter = (Math.random() - 0.5) * 0.25;

      const x = p.x + normal.x * lateral + normal.x * jitter;
      const z = p.z + normal.z * lateral + normal.z * jitter;

      dummy.position.set(x, 0.055 + Math.random() * 0.02, z);
      dummy.rotation.set(
        Math.random() * 0.4,
        Math.random() * Math.PI * 2,
        Math.random() * 0.4
      );
      const s = 0.6 + Math.random() * 1.2;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();

      if (Math.random() < 0.6) {
        if (a < instA.count) instA.setMatrixAt(a++, dummy.matrix);
      } else {
        if (b < instB.count) instB.setMatrixAt(b++, dummy.matrix);
      }
    }

    instA.instanceMatrix.needsUpdate = true;
    instB.instanceMatrix.needsUpdate = true;

    scene.add(instA);
    scene.add(instB);
  });
}

function isNearPath(px, pz) {
  // Umbral basado en el ancho del sendero (piedritas dispersas ~ ±0.6)
  const threshold = 1.35;
  const thr2 = threshold * threshold;
  for (let i = 0; i < PATH_POINTS_XZ.length; i++) {
    const p = PATH_POINTS_XZ[i];
    const dx = px - p.x;
    const dz = pz - p.z;
    if (dx * dx + dz * dz <= thr2) return true;
  }
  return false;
}

function createPond(scene) {
  // Ubicación pensada para no chocar con zonas/caminos principales
  const pondX = POND_DEF.x;
  const pondZ = POND_DEF.z;
  const waterRadius = POND_DEF.waterRadius;

  const group = new THREE.Group();
  group.position.set(pondX, 0, pondZ);
  group.userData.isPond = true;

  // Borde / tierra húmeda
  // Ojo: el borde debe quedar FUERA del agua (si queda debajo, se ve verde a través del agua)
  const rimGeo = new THREE.RingGeometry(waterRadius * 1.02, waterRadius * 1.32, 64);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x3a5c2f,
    roughness: 0.95,
    flatShading: true
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.02;
  rim.receiveShadow = true;
  group.add(rim);

  // Fondo (lecho) oscuro bajo el agua para que se vea profundo y uniforme
  const bedGeo = new THREE.CircleGeometry(waterRadius * 0.98, 64);
  const bedMat = new THREE.MeshStandardMaterial({
    color: 0x0b2a2f,
    roughness: 1,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });
  const bed = new THREE.Mesh(bedGeo, bedMat);
  bed.rotation.x = -Math.PI / 2;
  bed.position.y = 0.03;
  bed.renderOrder = 1;
  bed.receiveShadow = true;
  group.add(bed);

  // Agua
  const waterGeo = new THREE.CircleGeometry(waterRadius, 64);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x1b5563,
    transparent: true,
    // Más opaco para que NO se filtre el verde del piso
    opacity: 0.92,
    roughness: 0.18,
    metalness: 0.05,
    emissive: 0x0a2a33,
    emissiveIntensity: 0.45
  });
  waterMat.depthWrite = false;
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.05;
  water.renderOrder = 2;
  water.receiveShadow = false;
  group.add(water);

  // Guardar referencia para animación de olitas
  const base = water.geometry.attributes.position.array.slice();
  water.userData = {
    isPondWater: true,
    basePositions: base,
    radius: waterRadius,
    phase: Math.random() * Math.PI * 2
  };
  POND_WATER = water;

  // Piedras alrededor
  const rockGeo = new THREE.DodecahedronGeometry(0.55, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x808080, flatShading: true, roughness: 0.95 });
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
    const r = waterRadius * (1.15 + Math.random() * 0.18);
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.set(Math.cos(angle) * r, 0.14, Math.sin(angle) * r);
    rock.rotation.set(Math.random() * 1.2, Math.random() * 1.2, Math.random() * 1.2);
    rock.scale.setScalar(0.55 + Math.random() * 0.7);
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  }

  // Juncos simples (cattails)
  const reedMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.9, flatShading: true });
  const reedGeo = new THREE.CylinderGeometry(0.03, 0.04, 1.2, 5);
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Más afuera para que nunca "invadan" el agua visualmente
    const r = waterRadius * (1.38 + Math.random() * 0.22);
    const reed = new THREE.Mesh(reedGeo, reedMat);
    reed.position.set(Math.cos(angle) * r, 0.6, Math.sin(angle) * r);
    reed.rotation.z = (Math.random() - 0.5) * 0.25;
    reed.rotation.x = (Math.random() - 0.5) * 0.15;
    reed.castShadow = true;
    group.add(reed);
  }

  scene.add(group);
}

function isInsidePond(px, pz, radius) {
  const dx = px - POND_DEF.x;
  const dz = pz - POND_DEF.z;
  return dx * dx + dz * dz <= radius * radius;
}

function isForbiddenForAnimal(px, pz) {
  return (
    isInsideZoneCircle(px, pz) ||
    isNearPath(px, pz) ||
    isInsidePond(px, pz, POND_DEF.waterRadius * 1.4)
  );
}

function pickWanderTarget(cx, cz, radius) {
  for (let i = 0; i < 120; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    const x = cx + Math.cos(a) * r;
    const z = cz + Math.sin(a) * r;
    if (!isForbiddenForAnimal(x, z)) return { x, z };
  }
  return { x: cx, z: cz };
}

function createAnimals(scene) {
  ANIMALS = [];

  const makeAnimal = (type, model, x, z, wanderRadius, speed) => {
    if (isForbiddenForAnimal(x, z)) {
      const t = pickWanderTarget(0, 0, 45);
      x = t.x;
      z = t.z;
    }
    model.position.set(x, 0, z);
    model.rotation.y = Math.random() * Math.PI * 2;
    model.userData = {
      isAnimal: true,
      animalType: type,
      homeX: x,
      homeZ: z,
      wanderRadius,
      speed,
      target: pickWanderTarget(x, z, wanderRadius),
      nextTargetAt: 0,
      phase: Math.random() * Math.PI * 2
    };
    scene.add(model);
    ANIMALS.push(model);
  };

  // Repartidos por el mapa
  makeAnimal('cow', createCow(), -18, -28, 10, 0.55);
  makeAnimal('sheep', createSheep(), 18, 26, 9, 0.7);
  makeAnimal('pig', createPig(), -28, 26, 8, 0.65);
  makeAnimal('wolf', createWolf(), 26, -26, 12, 0.95);
}

function createLeg(color) {
  const legGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.7, 6);
  const legMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true });
  const leg = new THREE.Mesh(legGeo, legMat);
  leg.position.y = 0.35;
  leg.castShadow = true;
  leg.userData.isLeg = true;
  return leg;
}

function createCow() {
  const cow = new THREE.Group();
  cow.userData.isAnimal = true;

  const bodyGeo = new THREE.BoxGeometry(1.8, 0.9, 0.9);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.9;
  body.castShadow = true;
  cow.add(body);

  const spotGeo = new THREE.BoxGeometry(0.55, 0.35, 0.2);
  const spotMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95, flatShading: true });
  const spot1 = new THREE.Mesh(spotGeo, spotMat);
  spot1.position.set(0.4, 1.0, 0.46);
  cow.add(spot1);
  const spot2 = spot1.clone();
  spot2.position.set(-0.35, 0.78, -0.46);
  spot2.rotation.y = Math.PI / 2;
  cow.add(spot2);

  const headGeo = new THREE.BoxGeometry(0.65, 0.55, 0.6);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.set(1.15, 1.05, 0);
  head.castShadow = true;
  head.userData.isHead = true;
  cow.add(head);

  const hornGeo = new THREE.ConeGeometry(0.08, 0.22, 6);
  const hornMat = new THREE.MeshStandardMaterial({ color: 0xf5f5dc, roughness: 0.8, flatShading: true });
  const hornL = new THREE.Mesh(hornGeo, hornMat);
  hornL.position.set(1.35, 1.35, 0.22);
  hornL.rotation.z = -0.4;
  cow.add(hornL);
  const hornR = hornL.clone();
  hornR.position.z = -0.22;
  cow.add(hornR);

  const legColor = 0x5D4037;
  const legFL = createLeg(legColor);
  legFL.position.set(0.6, 0, 0.3);
  const legFR = createLeg(legColor);
  legFR.position.set(0.6, 0, -0.3);
  const legBL = createLeg(legColor);
  legBL.position.set(-0.6, 0, 0.3);
  const legBR = createLeg(legColor);
  legBR.position.set(-0.6, 0, -0.3);
  cow.add(legFL, legFR, legBL, legBR);

  cow.scale.setScalar(1.15);
  return cow;
}

function createSheep() {
  const sheep = new THREE.Group();
  sheep.userData.isAnimal = true;

  const woolGeo = new THREE.DodecahedronGeometry(0.85, 0);
  const woolMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.95, flatShading: true });
  const wool = new THREE.Mesh(woolGeo, woolMat);
  wool.position.y = 0.95;
  wool.castShadow = true;
  sheep.add(wool);

  const headGeo = new THREE.BoxGeometry(0.45, 0.38, 0.5);
  const headMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9, flatShading: true });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0.75, 0.95, 0);
  head.castShadow = true;
  head.userData.isHead = true;
  sheep.add(head);

  const legColor = 0x2a2a2a;
  const legFL = createLeg(legColor);
  legFL.position.set(0.35, 0, 0.25);
  const legFR = createLeg(legColor);
  legFR.position.set(0.35, 0, -0.25);
  const legBL = createLeg(legColor);
  legBL.position.set(-0.35, 0, 0.25);
  const legBR = createLeg(legColor);
  legBR.position.set(-0.35, 0, -0.25);
  sheep.add(legFL, legFR, legBL, legBR);

  sheep.scale.setScalar(1.05);
  return sheep;
}

function createPig() {
  const pig = new THREE.Group();
  pig.userData.isAnimal = true;

  const bodyGeo = new THREE.BoxGeometry(1.25, 0.75, 0.8);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffb6c1, roughness: 0.9, flatShading: true });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.8;
  body.castShadow = true;
  pig.add(body);

  const headGeo = new THREE.BoxGeometry(0.55, 0.5, 0.55);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.set(0.82, 0.9, 0);
  head.castShadow = true;
  head.userData.isHead = true;
  pig.add(head);

  const snoutGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.18, 10);
  const snoutMat = new THREE.MeshStandardMaterial({ color: 0xff8aa5, roughness: 0.85, flatShading: true });
  const snout = new THREE.Mesh(snoutGeo, snoutMat);
  snout.rotation.z = Math.PI / 2;
  snout.position.set(1.1, 0.86, 0);
  pig.add(snout);

  const legColor = 0x5D4037;
  const legFL = createLeg(legColor);
  legFL.position.set(0.35, 0, 0.25);
  const legFR = createLeg(legColor);
  legFR.position.set(0.35, 0, -0.25);
  const legBL = createLeg(legColor);
  legBL.position.set(-0.35, 0, 0.25);
  const legBR = createLeg(legColor);
  legBR.position.set(-0.35, 0, -0.25);
  pig.add(legFL, legFR, legBL, legBR);

  pig.scale.setScalar(1.1);
  return pig;
}

function createWolf() {
  const wolf = new THREE.Group();
  wolf.userData.isAnimal = true;

  const bodyGeo = new THREE.BoxGeometry(1.55, 0.7, 0.65);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x6d6d6d, roughness: 0.92, flatShading: true });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.8;
  body.castShadow = true;
  wolf.add(body);

  const headGeo = new THREE.BoxGeometry(0.55, 0.48, 0.5);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.set(0.95, 0.95, 0);
  head.castShadow = true;
  head.userData.isHead = true;
  wolf.add(head);

  const snoutGeo = new THREE.BoxGeometry(0.35, 0.22, 0.28);
  const snout = new THREE.Mesh(snoutGeo, bodyMat);
  snout.position.set(1.25, 0.88, 0);
  wolf.add(snout);

  const earGeo = new THREE.ConeGeometry(0.12, 0.28, 6);
  const earMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.95, flatShading: true });
  const earL = new THREE.Mesh(earGeo, earMat);
  earL.position.set(0.88, 1.25, 0.18);
  earL.rotation.x = 0.15;
  wolf.add(earL);
  const earR = earL.clone();
  earR.position.z = -0.18;
  wolf.add(earR);

  const legColor = 0x3a3a3a;
  const legFL = createLeg(legColor);
  legFL.position.set(0.45, 0, 0.22);
  const legFR = createLeg(legColor);
  legFR.position.set(0.45, 0, -0.22);
  const legBL = createLeg(legColor);
  legBL.position.set(-0.55, 0, 0.22);
  const legBR = createLeg(legColor);
  legBR.position.set(-0.55, 0, -0.22);
  wolf.add(legFL, legFR, legBL, legBR);

  wolf.scale.setScalar(1.15);
  return wolf;
}

function createLandmarks(scene) {
  // Distribuir landmarks hacia las "esquinas" del mapa
  // 1) Colmena gigante — esquina noreste
  const beehive = createGiantBeehive();
  beehive.position.set(30, 0, -30);
  scene.add(beehive);

  // 2) Arco de piedra — esquina noroeste
  const arch = createStoneArch();
  arch.position.set(-30, 0, -30);
  arch.rotation.y = Math.PI / 4;
  scene.add(arch);

  // 3) Casita pequeña — esquina sureste
  const house = createTinyHouse();
  house.position.set(30, 0, 30);
  house.rotation.y = -Math.PI / 4;
  scene.add(house);

  // 4) Farol — esquina suroeste
  const lamp = createLampPost();
  lamp.position.set(-30, 0, 30);
  scene.add(lamp);
}

function createGiantBeehive() {
  const hive = new THREE.Group();
  hive.userData.isLandmark = true;

  const layers = 5;
  const baseRadius = 1.4;
  const heightStep = 0.7;
  const hiveColor = 0xF4B400;

  const mat = new THREE.MeshStandardMaterial({
    color: hiveColor,
    roughness: 0.6,
    metalness: 0.05,
    emissive: 0xB8860B,
    emissiveIntensity: 0.2,
    flatShading: true
  });

  for (let i = 0; i < layers; i++) {
    const r = baseRadius - i * 0.22;
    const h = 0.5 + i * 0.05;
    const geo = new THREE.CylinderGeometry(r, r * 0.95, h, 16);
    const ring = new THREE.Mesh(geo, mat);
    ring.position.y = 0.3 + i * heightStep;
    ring.castShadow = true;
    ring.receiveShadow = true;
    hive.add(ring);
  }

  // Entrada
  const doorGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.18, 12);
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.8
  });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.rotation.x = Math.PI / 2;
  door.position.set(0, 0.65, baseRadius - 0.1);
  hive.add(door);

  // Base de madera
  const baseGeo = new THREE.CylinderGeometry(1.8, 1.9, 0.25, 16);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x5D4037,
    roughness: 0.9,
    flatShading: true
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.1;
  base.castShadow = true;
  hive.add(base);

  return hive;
}

function createStoneArch() {
  const arch = new THREE.Group();
  arch.userData.isLandmark = true;

  const pillarGeo = new THREE.BoxGeometry(0.6, 3.2, 0.8);
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x9e9e9e,
    roughness: 0.95,
    metalness: 0,
    flatShading: true
  });

  const left = new THREE.Mesh(pillarGeo, stoneMat);
  left.position.set(-1.4, 1.6, 0);
  left.castShadow = true;
  left.receiveShadow = true;
  arch.add(left);

  const right = new THREE.Mesh(pillarGeo, stoneMat);
  right.position.set(1.4, 1.6, 0);
  right.castShadow = true;
  right.receiveShadow = true;
  arch.add(right);

  const topGeo = new THREE.BoxGeometry(3.4, 0.7, 0.9);
  const top = new THREE.Mesh(topGeo, stoneMat);
  top.position.set(0, 3.4, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  arch.add(top);

  // Detalle de piedras irregulares arriba
  const capGeo = new THREE.DodecahedronGeometry(0.45, 0);
  for (let i = 0; i < 4; i++) {
    const cap = new THREE.Mesh(capGeo, stoneMat);
    cap.position.set(
      -1.2 + i * 0.8 + (Math.random() - 0.5) * 0.2,
      3.9 + Math.random() * 0.2,
      (Math.random() - 0.5) * 0.25
    );
    cap.castShadow = true;
    cap.receiveShadow = true;
    arch.add(cap);
  }

  arch.rotation.y = 0; // mirando hacia el spawn
  return arch;
}

function createTinyHouse() {
  const house = new THREE.Group();
  house.userData.isLandmark = true;

  const bodyGeo = new THREE.BoxGeometry(2.6, 2, 2.4);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xFFE0B2,
    roughness: 0.8
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1;
  body.castShadow = true;
  body.receiveShadow = true;
  house.add(body);

  const roofGeo = new THREE.ConeGeometry(2.5, 1.6, 4);
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xD84315,
    roughness: 0.7,
    flatShading: true
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 2.4;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  roof.receiveShadow = true;
  house.add(roof);

  // Puerta
  const doorGeo = new THREE.BoxGeometry(0.8, 1.2, 0.1);
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x3E2723,
    roughness: 0.9
  });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 0.6, 1.25);
  door.castShadow = true;
  house.add(door);

  // Ventanas
  const winGeo = new THREE.BoxGeometry(0.5, 0.5, 0.08);
  const winMat = new THREE.MeshStandardMaterial({
    color: 0xBBDEFB,
    emissive: 0x90CAF9,
    emissiveIntensity: 0.25
  });
  const w1 = new THREE.Mesh(winGeo, winMat);
  w1.position.set(-0.8, 1.2, -1.2);
  const w2 = w1.clone();
  w2.position.x = 0.8;
  house.add(w1, w2);

  return house;
}

function createLampPost() {
  const group = new THREE.Group();
  group.userData.isLandmark = true;

  const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 12);
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.6,
    metalness: 0.4
  });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 1.6;
  pole.castShadow = true;
  group.add(pole);

  const armGeo = new THREE.BoxGeometry(1.1, 0.08, 0.08);
  const arm = new THREE.Mesh(armGeo, poleMat);
  arm.position.set(0.5, 2.8, 0);
  arm.castShadow = true;
  group.add(arm);

  const lampGeo = new THREE.SphereGeometry(0.25, 8, 6);
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xFFF8E1,
    emissive: 0xFFE082,
    emissiveIntensity: 0.9,
    roughness: 0.2
  });
  const lamp = new THREE.Mesh(lampGeo, lampMat);
  lamp.position.set(1.1, 2.55, 0);
  lamp.castShadow = false;
  group.add(lamp);

  return group;
}

const ZONE_CIRCLES = [
  { x: 0, z: 0, radius: 9 },
  { x: 30, z: 0, radius: 8 },
  { x: 20, z: 20, radius: 8 },
  { x: -15, z: 25, radius: 8 },
  { x: 0, z: -20, radius: 8 },
  { x: 15, z: -20, radius: 8 },
  { x: -25, z: -10, radius: 9 },
  // Laguna (sin árboles encima)
  { x: POND_DEF.x, z: POND_DEF.z, radius: 11 }
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
  // Un poco más despejado pero con buen ambiente
  const targetCount = 75;
  const minDist = 2.4; // evita amontonamiento excesivo
  
  for (let i = 0; i < targetCount; i++) {
    let x, z;
    let attempts = 0;
    do {
      x = (Math.random() - 0.5) * 70;
      z = (Math.random() - 0.5) * 70;
      attempts++;
    } while (
      (isInsideZoneCircle(x, z) ||
        isNearPath(x, z) ||
        treePositions.some((p) => {
          const dx = x - p.x;
          const dz = z - p.z;
          return dx * dx + dz * dz < minDist * minDist;
        })) &&
      attempts < 350
    );
    
    if (isInsideZoneCircle(x, z) || isNearPath(x, z)) continue;
    treePositions.push({ x, z, scale: 0.65 + Math.random() * 0.9 });
  }
  
  treePositions.forEach((pos) => createTree(scene, pos.x, pos.z, pos.scale));
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
  
  const typeRoll = Math.random();
  const type =
    typeRoll < 0.45 ? 'pine' : typeRoll < 0.75 ? 'round' : typeRoll < 0.92 ? 'double' : 'bushy';

  const trunkHeight = (2.2 + Math.random() * 2.2) * scale;
  const trunkGeo = new THREE.CylinderGeometry(0.26 * scale, 0.46 * scale, trunkHeight, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513,
    roughness: 0.9,
    flatShading: true
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = trunkHeight / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const defaultColors = [
    0x228B22, 0x2E8B57, 0x3CB371, 0x1B5E20, 0x388E3C, 0x43A047, 0x556B2F, 0x2d5a27
  ];
  const foliageColor = customFoliageColor !== null && customFoliageColor !== undefined
    ? customFoliageColor
    : defaultColors[Math.floor(Math.random() * defaultColors.length)];

  const foliageMat = new THREE.MeshStandardMaterial({
    color: foliageColor,
    roughness: 0.82,
    flatShading: true
  });

  const crownBaseY = trunkHeight + 0.2 * scale;

  if (type === 'pine') {
    const layers = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < layers; i++) {
      const size = (2.6 - i * 0.55) * scale;
      const h = (2.6 - i * 0.35) * scale;
      const foliageGeo = new THREE.ConeGeometry(size, h, 6);
      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.y = crownBaseY + i * (1.15 * scale);
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      tree.add(foliage);
    }
  } else if (type === 'round') {
    const crownGeo = new THREE.SphereGeometry(1.65 * scale, 8, 6);
    const crown = new THREE.Mesh(crownGeo, foliageMat);
    crown.position.y = crownBaseY + 1.2 * scale;
    crown.castShadow = true;
    crown.receiveShadow = true;
    tree.add(crown);
  } else if (type === 'double') {
    const crownGeo1 = new THREE.SphereGeometry(1.35 * scale, 8, 6);
    const crown1 = new THREE.Mesh(crownGeo1, foliageMat);
    crown1.position.y = crownBaseY + 1.1 * scale;
    crown1.position.x = 0.35 * scale;
    crown1.castShadow = true;
    tree.add(crown1);

    const crownGeo2 = new THREE.SphereGeometry(1.15 * scale, 8, 6);
    const crown2 = new THREE.Mesh(crownGeo2, foliageMat);
    crown2.position.y = crownBaseY + 2.0 * scale;
    crown2.position.x = -0.35 * scale;
    crown2.castShadow = true;
    tree.add(crown2);
  } else {
    // bushy
    const crownGeo = new THREE.DodecahedronGeometry(1.35 * scale, 0);
    for (let i = 0; i < 4; i++) {
      const puff = new THREE.Mesh(crownGeo, foliageMat);
      const angle = (i / 4) * Math.PI * 2;
      puff.position.set(Math.cos(angle) * 0.55 * scale, crownBaseY + 1.35 * scale, Math.sin(angle) * 0.55 * scale);
      puff.scale.setScalar(0.95 + Math.random() * 0.25);
      puff.castShadow = true;
      tree.add(puff);
    }
    const top = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1 * scale, 0), foliageMat);
    top.position.y = crownBaseY + 2.15 * scale;
    top.castShadow = true;
    tree.add(top);
  }
  
  tree.position.set(x, 0, z);
  tree.userData.isTree = true;
  tree.userData.collisionRadius = 1.4 * scale;
  scene.add(tree);
  
  return tree;
}

function createFlowers(scene) {
  const flowerColors = [0xFF6B6B, 0xFFB6C1, 0xFFD93D, 0xE6E6FA, 0xFFA07A];
  
  for (let i = 0; i < 60; i++) {
    const flower = createFlower(
      flowerColors[Math.floor(Math.random() * flowerColors.length)]
    );

    // Evitar que flores caigan dentro de la laguna
    let fx, fz;
    let tries = 0;
    do {
      fx = (Math.random() - 0.5) * 60;
      fz = (Math.random() - 0.5) * 60;
      tries++;
    } while (isInsidePond(fx, fz, POND_DEF.waterRadius * 1.15) && tries < 120);
    if (isInsidePond(fx, fz, POND_DEF.waterRadius * 1.15)) continue;

    flower.position.set(fx, 0, fz);
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

    // Evitar rocas dentro de la laguna
    let rx, rz;
    let tries = 0;
    do {
      rx = (Math.random() - 0.5) * 50;
      rz = (Math.random() - 0.5) * 50;
      tries++;
    } while (isInsidePond(rx, rz, POND_DEF.waterRadius * 1.1) && tries < 120);
    if (isInsidePond(rx, rz, POND_DEF.waterRadius * 1.1)) continue;

    rock.position.set(rx, 0.2, rz);
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

function createSkyBirds(scene) {
  // Más visibles: más cantidad + alturas más bajas
  const birdCount = 28;
  for (let i = 0; i < birdCount; i++) {
    const bird = createBird();
    bird.position.set(
      (Math.random() - 0.5) * 90,
      12 + Math.random() * 14,
      (Math.random() - 0.5) * 90
    );
    bird.rotation.y = Math.random() * Math.PI * 2;
    bird.scale.setScalar(1.6 + Math.random() * 1.1);
    bird.userData = {
      isSkyBird: true,
      baseY: bird.position.y,
      speed: 0.9 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
      flapSpeed: 6.5 + Math.random() * 5,
      // dirección en XZ
      dirX: Math.cos(bird.rotation.y),
      dirZ: Math.sin(bird.rotation.y)
    };
    scene.add(bird);
  }
}

function createBird() {
  const bird = new THREE.Group();

  const bodyGeo = new THREE.SphereGeometry(0.18, 6, 4);
  const birdColors = [0xf5f5f5, 0xe6e6fa, 0xfff4c2, 0xd7f0ff];
  const bodyColor = birdColors[Math.floor(Math.random() * birdColors.length)];
  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    emissive: 0x222222,
    emissiveIntensity: 0.22,
    roughness: 0.9,
    flatShading: true
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.scale.set(1.2, 0.7, 1.6);
  bird.add(body);

  const wingGeo = new THREE.BoxGeometry(0.45, 0.04, 0.18);
  const wingMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    emissive: 0x222222,
    emissiveIntensity: 0.22,
    roughness: 0.95,
    flatShading: true
  });

  const wingL = new THREE.Mesh(wingGeo, wingMat);
  wingL.position.set(0.28, 0.02, 0);
  wingL.rotation.z = 0.25;
  wingL.userData.isWing = true;
  bird.add(wingL);

  const wingR = new THREE.Mesh(wingGeo, wingMat);
  wingR.position.set(-0.28, 0.02, 0);
  wingR.rotation.z = -0.25;
  wingR.userData.isWing = true;
  bird.add(wingR);

  bird.userData.isSkyBird = true;
  return bird;
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
    
    // Solo para nubes/objetos con speed (evitar duplicar movimiento de aves)
    if (child.userData.speed && child.position && !child.userData.isSkyBird) {
      child.position.x += child.userData.speed * 0.01;
      if (child.position.x > 50) child.position.x = -50;
    }

    if (child.userData.isSkyBird) {
      const d = child.userData;
      // avance
      child.position.x += d.dirX * d.speed * 0.05;
      child.position.z += d.dirZ * d.speed * 0.05;
      // altura con “oleaje”
      child.position.y = d.baseY + Math.sin(time * 1.2 + d.phase) * 0.35;
      // aleteo
      const flap = Math.sin(time * d.flapSpeed + d.phase) * 0.9;
      child.children.forEach((part) => {
        if (part.userData.isWing) {
          part.rotation.y = flap;
        }
      });
      // leve inclinación (banking)
      child.rotation.z = -flap * 0.08;
      // wrap
      const bound = 55;
      if (child.position.x > bound) child.position.x = -bound;
      if (child.position.x < -bound) child.position.x = bound;
      if (child.position.z > bound) child.position.z = -bound;
      if (child.position.z < -bound) child.position.z = bound;
    }

    if (child.userData.isAnimal) {
      const d = child.userData;

      // Elegir nuevo objetivo cada cierto tiempo
      if (time >= (d.nextTargetAt || 0)) {
        d.target = pickWanderTarget(d.homeX, d.homeZ, d.wanderRadius);
        d.nextTargetAt = time + 3.5 + Math.random() * 4.5;
      }

      const tx = d.target?.x ?? d.homeX;
      const tz = d.target?.z ?? d.homeZ;

      const dx = tx - child.position.x;
      const dz = tz - child.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.35) {
        // Llegó → escoger otro pronto
        d.nextTargetAt = Math.min(d.nextTargetAt, time + 0.2);
      } else {
        const vx = (dx / dist) * d.speed * 0.06;
        const vz = (dz / dist) * d.speed * 0.06;

        const nx = child.position.x + vx;
        const nz = child.position.z + vz;

        // Evitar entrar en zonas prohibidas
        if (!isForbiddenForAnimal(nx, nz)) {
          child.position.x = nx;
          child.position.z = nz;
          // Orientar el cuerpo hacia la dirección de avance.
          // Los modelos están construidos mirando hacia +X, así que usamos atan2(-dz, dx).
          child.rotation.y = Math.atan2(-dz, dx);
        } else {
          d.target = pickWanderTarget(d.homeX, d.homeZ, d.wanderRadius);
          d.nextTargetAt = time + 0.8 + Math.random() * 0.8;
        }
      }

      // Animación simple: patas + cabeza
      const walkPhase = time * (3.2 + d.speed * 2.2) + (d.phase || 0);
      const walk = Math.sin(walkPhase) * 0.55;

      child.children.forEach((part) => {
        if (part.userData.isLeg) {
          // alternar pares
          const sign = part.position.x > 0 ? 1 : -1;
          part.rotation.x = walk * 0.45 * sign;
        }
        if (part.userData.isHead) {
          part.rotation.x = Math.sin(time * 1.4 + (d.phase || 0)) * 0.08;
        }
      });
    }
  });

  // Animación de olitas en la laguna
  if (POND_WATER && POND_WATER.userData?.isPondWater) {
    const attr = POND_WATER.geometry.attributes.position;
    const base = POND_WATER.userData.basePositions;
    const phase = POND_WATER.userData.phase || 0;
    for (let i = 0; i < attr.count; i++) {
      const ix = i * 3;
      const x = base[ix];
      const z = base[ix + 2];
      const r = Math.sqrt(x * x + z * z);
      // menos onda cerca al borde para que se vea estable
      const edgeFade = Math.max(0, 1 - r / (POND_WATER.userData.radius || 1));
      const wave =
        Math.sin(time * 1.6 + x * 0.7 + phase) * 0.03 +
        Math.cos(time * 1.2 + z * 0.6 + phase) * 0.02;
      attr.array[ix + 1] = base[ix + 1] + wave * edgeFade;
    }
    attr.needsUpdate = true;
    POND_WATER.geometry.computeVertexNormals();
  }
}
