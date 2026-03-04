const PLANEACIONES_BASE =
  (typeof import.meta.env?.BASE_URL === 'string' ? import.meta.env.BASE_URL : '/') +
  'assets/planeaciones';

const PLANEACIONES_PDFS = [
  'Bee comic (1).pdf',
  'Cañon Alejandra_Garzon Laura_ Lesson planning 2  (1) (2).pdf',
  'Cañon Alejandra_Garzon Laura_ Lesson planning 2  (2) (1).pdf',
  'Cañon Alejandra_Garzon Laura_ Lesson planning 2  (4).pdf',
  'Cañon Alejandra_Garzon Laura_ Lesson planning 3 the magic drink_removed.pdf',
  'Cañon Alejandra_Garzon Laura_ Lesson planning THE GARDEN HELPERS (1).pdf'
];
const PLANEACIONES_IMAGENES = [];
const PLANEACIONES_OTROS = [];

function buildPlaneacionUrl(filename) {
  return `${PLANEACIONES_BASE}/${encodeURIComponent(filename)}`;
}

function buildPlaneacionTitle(filename) {
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  return withoutExt.replace(/[_\-]/g, ' ');
}

export function getPlaneacionesItems() {
  const pdfs = PLANEACIONES_PDFS.map((name) => ({
    type: 'pdf',
    url: buildPlaneacionUrl(name),
    title: buildPlaneacionTitle(name)
  }));

  const images = PLANEACIONES_IMAGENES.map((name) => ({
    type: 'image',
    url: buildPlaneacionUrl(name),
    title: buildPlaneacionTitle(name)
  }));

  const others = PLANEACIONES_OTROS.map((name) => ({
    type: 'file',
    url: buildPlaneacionUrl(name),
    title: buildPlaneacionTitle(name)
  }));

  return [...pdfs, ...images, ...others];
}

