/**
 * FlipbookViewer — visor genérico con page-flip (dos páginas, lomo al centro).
 * Reutiliza los mismos estilos CSS del libro.
 */

let currentLeaf = 0;
let numLeaves = 0;
let isAnimating = false;

export function createFlipbookViewer(container, options) {
  const pages = Array.isArray(options?.pages) ? options.pages : [];
  const titleText = typeof options?.title === 'string' ? options.title : '';

  currentLeaf = 0;
  isAnimating = false;
  numLeaves = Math.ceil(pages.length / 2);

  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'flipbook-wrapper';

  const title = document.createElement('h2');
  title.className = 'flipbook-title';
  title.textContent = titleText;
  wrapper.appendChild(title);

  if (pages.length === 0) {
    const empty = document.createElement('div');
    empty.style.color = '#aaa';
    empty.style.textAlign = 'center';
    empty.style.padding = '18px 10px';
    empty.innerHTML = 'No hay imágenes para mostrar.';
    wrapper.appendChild(empty);
    container.appendChild(wrapper);
    return wrapper;
  }

  const scene = document.createElement('div');
  scene.className = 'flipbook-scene';

  const bgLeft = document.createElement('div');
  bgLeft.className = 'flipbook-bg flipbook-bg-left';
  const bgRight = document.createElement('div');
  bgRight.className = 'flipbook-bg flipbook-bg-right';
  scene.appendChild(bgLeft);
  scene.appendChild(bgRight);

  const spine = document.createElement('div');
  spine.className = 'flipbook-spine';
  scene.appendChild(spine);

  const book = document.createElement('div');
  book.className = 'flipbook-book';
  scene.appendChild(book);

  for (let i = 0; i < numLeaves; i++) {
    const leaf = document.createElement('div');
    leaf.className = 'flipbook-leaf';
    leaf.dataset.leaf = i;
    leaf.style.zIndex = numLeaves - i;

    const front = document.createElement('div');
    front.className = 'flipbook-face flipbook-front';
    const frontIdx = i * 2;
    if (frontIdx < pages.length) {
      const img = document.createElement('img');
      img.src = pages[frontIdx];
      img.alt = `Página ${frontIdx + 1}`;
      img.draggable = false;
      front.appendChild(img);
      const num = document.createElement('span');
      num.className = 'flipbook-page-num flipbook-page-num-right';
      num.textContent = frontIdx + 1;
      front.appendChild(num);
    } else {
      front.innerHTML = '<div class="flipbook-empty-page"><span>✦</span></div>';
    }
    leaf.appendChild(front);

    const back = document.createElement('div');
    back.className = 'flipbook-face flipbook-back';
    const backIdx = i * 2 + 1;
    if (backIdx < pages.length) {
      const img = document.createElement('img');
      img.src = pages[backIdx];
      img.alt = `Página ${backIdx + 1}`;
      img.draggable = false;
      back.appendChild(img);
      const num = document.createElement('span');
      num.className = 'flipbook-page-num flipbook-page-num-left';
      num.textContent = backIdx + 1;
      back.appendChild(num);
    } else {
      back.innerHTML = '<div class="flipbook-empty-page"><span>✦</span></div>';
    }
    leaf.appendChild(back);

    const shadow = document.createElement('div');
    shadow.className = 'flipbook-shadow';
    leaf.appendChild(shadow);

    book.appendChild(leaf);
  }

  const zoneLeft = document.createElement('div');
  zoneLeft.className = 'flipbook-click-zone flipbook-click-left';
  zoneLeft.addEventListener('click', () => flipPrev(book, pages.length));
  scene.appendChild(zoneLeft);

  const zoneRight = document.createElement('div');
  zoneRight.className = 'flipbook-click-zone flipbook-click-right';
  zoneRight.addEventListener('click', () => flipNext(book, pages.length));
  scene.appendChild(zoneRight);

  wrapper.appendChild(scene);

  const nav = document.createElement('div');
  nav.className = 'flipbook-nav';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'flipbook-btn';
  prevBtn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
  prevBtn.title = 'Página anterior';
  prevBtn.addEventListener('click', () => flipPrev(book, pages.length));

  const nextBtn = document.createElement('button');
  nextBtn.className = 'flipbook-btn';
  nextBtn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"></polyline></svg>';
  nextBtn.title = 'Página siguiente';
  nextBtn.addEventListener('click', () => flipNext(book, pages.length));

  const indicator = document.createElement('div');
  indicator.className = 'flipbook-indicator';
  indicator.id = options?.indicatorId || 'flipbook-indicator';
  updateIndicator(indicator, pages.length);

  nav.appendChild(prevBtn);
  nav.appendChild(indicator);
  nav.appendChild(nextBtn);
  wrapper.appendChild(nav);

  const dots = document.createElement('div');
  dots.className = 'flipbook-dots';
  dots.id = options?.dotsId || 'flipbook-dots';
  for (let i = 0; i < numLeaves; i++) {
    const dot = document.createElement('span');
    dot.className =
      'flipbook-dot' + (i < currentLeaf ? ' done' : i === currentLeaf ? ' active' : '');
    dot.dataset.leaf = i;
    dots.appendChild(dot);
  }
  wrapper.appendChild(dots);

  container.appendChild(wrapper);

  const keyHandler = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.stopPropagation();
      flipNext(book, pages.length);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.stopPropagation();
      flipPrev(book, pages.length);
    }
  };
  document.addEventListener('keydown', keyHandler, true);
  wrapper._keyHandler = keyHandler;

  return wrapper;
}

export function destroyFlipbookViewer(wrapper) {
  if (wrapper && wrapper._keyHandler) {
    document.removeEventListener('keydown', wrapper._keyHandler, true);
  }
}

function flipNext(book, totalPages) {
  if (isAnimating || currentLeaf >= numLeaves) return;

  isAnimating = true;
  const leaf = book.querySelector(`.flipbook-leaf[data-leaf="${currentLeaf}"]`);
  if (!leaf) {
    isAnimating = false;
    return;
  }

  leaf.style.zIndex = numLeaves + 10;
  leaf.classList.add('flipped');

  currentLeaf++;
  updateUI(totalPages);

  setTimeout(() => {
    leaf.style.zIndex = currentLeaf;
    isAnimating = false;
  }, 900);
}

function flipPrev(book, totalPages) {
  if (isAnimating || currentLeaf <= 0) return;

  isAnimating = true;
  currentLeaf--;

  const leaf = book.querySelector(`.flipbook-leaf[data-leaf="${currentLeaf}"]`);
  if (!leaf) {
    isAnimating = false;
    return;
  }

  leaf.style.zIndex = numLeaves + 10;
  leaf.classList.remove('flipped');

  updateUI(totalPages);

  setTimeout(() => {
    leaf.style.zIndex = numLeaves - currentLeaf;
    isAnimating = false;
  }, 900);
}

function updateUI(totalPages) {
  const indicator = document.getElementById('flipbook-indicator') || document.getElementById('pictionary-indicator');
  if (indicator) updateIndicator(indicator, totalPages);

  const dots = document.getElementById('flipbook-dots') || document.getElementById('pictionary-dots');
  if (dots) {
    dots.querySelectorAll('.flipbook-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentLeaf);
      dot.classList.toggle('done', i < currentLeaf);
    });
  }
}

function updateIndicator(el, totalPages) {
  const leftPage = currentLeaf === 0 ? '—' : currentLeaf * 2;
  const rightPage = currentLeaf >= numLeaves ? '—' : currentLeaf * 2 + 1;
  el.textContent =
    currentLeaf === 0
      ? `1 / ${totalPages}`
      : currentLeaf >= numLeaves
        ? `${totalPages} / ${totalPages}`
        : `${leftPage}-${rightPage} / ${totalPages}`;
}

