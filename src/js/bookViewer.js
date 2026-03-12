import { createFlipbookViewer, destroyFlipbookViewer } from "./flipbookViewer.js";

const BOOK_PAGES = Array.from({ length: 16 }, (_, idx) => `/assets/libro/${idx + 1}.jpeg`);

/**
 * Crea el visor de libro dentro de un contenedor
 * @param {HTMLElement} container
 */
export function createBookViewer(container) {
  return createFlipbookViewer(container, { pages: BOOK_PAGES, title: "📖 El Cuento" });
}

/**
 * Limpia listeners del visor
 */
export function destroyBookViewer(wrapper) {
  destroyFlipbookViewer(wrapper);
}
