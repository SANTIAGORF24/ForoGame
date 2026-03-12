const PLANEACIONES_BASE =
  (typeof import.meta.env?.BASE_URL === 'string' ? import.meta.env.BASE_URL : '/') +
  'assets/planeaciones';

const PLANEACIONES_PDFS = [
  'planeacion1.pdf',
  'planeacion2.pdf',
  'planeacion3.pdf',
  'planeacion4.pdf',
  'planeacion5.pdf',
  'planeacion6.pdf'
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

