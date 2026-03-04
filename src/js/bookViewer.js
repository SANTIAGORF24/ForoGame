/**
 * BookViewer — Pure CSS/JS page-flip book viewer (dos páginas, lomo al centro)
 * El giro ocurre de derecha (½ derecha) → izquierda (½ izquierda).
 * Nada sale del modal. Sin librerías externas.
 */

const BOOK_PAGES = [
  "/assets/libro/page-1.png",
  "/assets/libro/page-2.png",
  "/assets/libro/page-3.png",
  "/assets/libro/page-4.png",
];

// currentLeaf = índice de la hoja que está en posición "derecha" (no volteada).
// Hojas numeradas 0..numLeaves-1.
// - hoja[i].front = página i*2
// - hoja[i].back  = página i*2+1
let currentLeaf = 0;
let totalPages = BOOK_PAGES.length;
let numLeaves = 0;
let isAnimating = false;

/**
 * Crea el visor de libro dentro de un contenedor
 * @param {HTMLElement} container
 */
export function createBookViewer(container) {
  currentLeaf = 0;
  isAnimating = false;
  numLeaves = Math.ceil(totalPages / 2);

  container.innerHTML = "";

  // ── Wrapper principal ──
  const wrapper = document.createElement("div");
  wrapper.className = "flipbook-wrapper";

  // ── Título ──
  const title = document.createElement("h2");
  title.className = "flipbook-title";
  title.textContent = "📖 El Cuento";
  wrapper.appendChild(title);

  // ── Escena 3D: doble ancho, lomo al centro ──
  const scene = document.createElement("div");
  scene.className = "flipbook-scene";

  // Fondo de libro abierto (mesa/papel): lado izquierdo y derecho
  const bgLeft = document.createElement("div");
  bgLeft.className = "flipbook-bg flipbook-bg-left";
  const bgRight = document.createElement("div");
  bgRight.className = "flipbook-bg flipbook-bg-right";
  scene.appendChild(bgLeft);
  scene.appendChild(bgRight);

  // Sombra central del lomo
  const spine = document.createElement("div");
  spine.className = "flipbook-spine";
  scene.appendChild(spine);

  // ── Libro ──
  const book = document.createElement("div");
  book.className = "flipbook-book";
  book.id = "flipbook-book";
  scene.appendChild(book);

  /**
   * Estructura de cada hoja (leaf):
   *  - ocupa la MITAD DERECHA del libro (left: 50%, width: 50%)
   *  - transform-origin: left center  → gira alrededor del lomo (centro del libro)
   *  - .flipped  → rotateY(-180deg)   → hoja queda en la mitad IZQUIERDA
   *
   *  .front → cara que mira hacia el lector cuando la hoja está en la derecha (página impar)
   *  .back  → cara que mira hacia el lector cuando la hoja está en la izquierda (página par)
   *           (backface-visibility: hidden + rotateY(180deg) para que se vea hacia afuera)
   */
  for (let i = 0; i < numLeaves; i++) {
    const leaf = document.createElement("div");
    leaf.className = "flipbook-leaf";
    leaf.dataset.leaf = i;
    // Las hojas más cercanas al lector tienen z-index mayor cuando están sin girar
    leaf.style.zIndex = numLeaves - i;

    // ── Frente: página derecha (sin girar) ──
    const front = document.createElement("div");
    front.className = "flipbook-face flipbook-front";
    const frontIdx = i * 2;
    if (frontIdx < totalPages) {
      const img = document.createElement("img");
      img.src = BOOK_PAGES[frontIdx];
      img.alt = `Página ${frontIdx + 1}`;
      img.draggable = false;
      front.appendChild(img);
      const num = document.createElement("span");
      num.className = "flipbook-page-num flipbook-page-num-right";
      num.textContent = frontIdx + 1;
      front.appendChild(num);
    } else {
      front.innerHTML = '<div class="flipbook-empty-page"><span>✦</span></div>';
    }
    leaf.appendChild(front);

    // ── Reverso: página izquierda (después de girar) ──
    const back = document.createElement("div");
    back.className = "flipbook-face flipbook-back";
    const backIdx = i * 2 + 1;
    if (backIdx < totalPages) {
      const img = document.createElement("img");
      img.src = BOOK_PAGES[backIdx];
      img.alt = `Página ${backIdx + 1}`;
      img.draggable = false;
      back.appendChild(img);
      const num = document.createElement("span");
      num.className = "flipbook-page-num flipbook-page-num-left";
      num.textContent = backIdx + 1;
      back.appendChild(num);
    } else {
      back.innerHTML = '<div class="flipbook-empty-page"><span>✦</span></div>';
    }
    leaf.appendChild(back);

    // Sombra de profundidad durante el giro
    const shadow = document.createElement("div");
    shadow.className = "flipbook-shadow";
    leaf.appendChild(shadow);

    book.appendChild(leaf);
  }

  // Zonas clicables
  const zoneLeft = document.createElement("div");
  zoneLeft.className = "flipbook-click-zone flipbook-click-left";
  zoneLeft.addEventListener("click", () => flipPrev(book));
  scene.appendChild(zoneLeft);

  const zoneRight = document.createElement("div");
  zoneRight.className = "flipbook-click-zone flipbook-click-right";
  zoneRight.addEventListener("click", () => flipNext(book));
  scene.appendChild(zoneRight);

  wrapper.appendChild(scene);

  // ── Controles ──
  const nav = document.createElement("div");
  nav.className = "flipbook-nav";

  const prevBtn = document.createElement("button");
  prevBtn.className = "flipbook-btn";
  prevBtn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
  prevBtn.title = "Página anterior";
  prevBtn.addEventListener("click", () => flipPrev(book));

  const nextBtn = document.createElement("button");
  nextBtn.className = "flipbook-btn";
  nextBtn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"></polyline></svg>';
  nextBtn.title = "Página siguiente";
  nextBtn.addEventListener("click", () => flipNext(book));

  const indicator = document.createElement("div");
  indicator.className = "flipbook-indicator";
  indicator.id = "flipbook-indicator";
  updateIndicator(indicator);

  nav.appendChild(prevBtn);
  nav.appendChild(indicator);
  nav.appendChild(nextBtn);
  wrapper.appendChild(nav);

  // Dots de progreso
  const dots = document.createElement("div");
  dots.className = "flipbook-dots";
  dots.id = "flipbook-dots";
  for (let i = 0; i < numLeaves; i++) {
    const dot = document.createElement("span");
    dot.className =
      "flipbook-dot" +
      (i < currentLeaf ? " done" : i === currentLeaf ? " active" : "");
    dot.dataset.leaf = i;
    dots.appendChild(dot);
  }
  wrapper.appendChild(dots);

  container.appendChild(wrapper);

  // Teclado
  const keyHandler = (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.stopPropagation();
      flipNext(book);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.stopPropagation();
      flipPrev(book);
    }
  };
  document.addEventListener("keydown", keyHandler, true);
  wrapper._keyHandler = keyHandler;

  return wrapper;
}

/**
 * Limpia listeners del visor
 */
export function destroyBookViewer(wrapper) {
  if (wrapper && wrapper._keyHandler) {
    document.removeEventListener("keydown", wrapper._keyHandler, true);
  }
}

// ── Navegación ──

function flipNext(book) {
  if (isAnimating || currentLeaf >= numLeaves) return;

  isAnimating = true;
  const leaf = book.querySelector(`.flipbook-leaf[data-leaf="${currentLeaf}"]`);
  if (!leaf) {
    isAnimating = false;
    return;
  }

  // Durante el giro, la hoja debe estar POR ENCIMA del resto
  leaf.style.zIndex = numLeaves + 10;
  leaf.classList.add("flipped");

  currentLeaf++;
  updateUI();

  setTimeout(() => {
    // Una vez terminado el giro, la hoja flipped queda "enterrada" bajo nuevas hojas
    leaf.style.zIndex = currentLeaf;
    isAnimating = false;
  }, 900);
}

function flipPrev(book) {
  if (isAnimating || currentLeaf <= 0) return;

  isAnimating = true;
  currentLeaf--;

  const leaf = book.querySelector(`.flipbook-leaf[data-leaf="${currentLeaf}"]`);
  if (!leaf) {
    isAnimating = false;
    return;
  }

  // Durante el giro inverso, también por encima de todo
  leaf.style.zIndex = numLeaves + 10;
  leaf.classList.remove("flipped");

  updateUI();

  setTimeout(() => {
    leaf.style.zIndex = numLeaves - currentLeaf;
    isAnimating = false;
  }, 900);
}

function updateUI() {
  const indicator = document.getElementById("flipbook-indicator");
  if (indicator) updateIndicator(indicator);

  const dots = document.getElementById("flipbook-dots");
  if (dots) {
    dots.querySelectorAll(".flipbook-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === currentLeaf);
      dot.classList.toggle("done", i < currentLeaf);
    });
  }
}

function updateIndicator(el) {
  // Muestra el rango de páginas visibles
  const leftPage = currentLeaf === 0 ? "—" : currentLeaf * 2;
  const rightPage = currentLeaf >= numLeaves ? "—" : currentLeaf * 2 + 1;
  el.textContent =
    currentLeaf === 0
      ? `1 / ${totalPages}`
      : currentLeaf >= numLeaves
        ? `${totalPages} / ${totalPages}`
        : `${leftPage}-${rightPage} / ${totalPages}`;
}
