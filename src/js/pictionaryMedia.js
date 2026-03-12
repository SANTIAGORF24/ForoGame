const PICTIONARY_BASE =
  (typeof import.meta.env?.BASE_URL === 'string' ? import.meta.env.BASE_URL : '/') +
  'assets/PICTIONARY';

/**
 * Lista de nombres de archivo dentro de `dist/assets/PICTIONARY`.
 * Pon aquí los nombres reales (respetando mayúsculas/minúsculas).
 */
const PICTIONARY_IMAGES = [
  '1.png',
  '2.png',
  '3.png',
  '4.png',
  '5.png',
  '6.png',
  '7.png',
  '8.png',
  '9.png',
  '10.png'
];

function buildUrl(filename) {
  return `${PICTIONARY_BASE}/${encodeURIComponent(filename)}`;
}

function buildTitle(filename) {
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  return withoutExt.replace(/[_\-]/g, ' ');
}

export function getPictionaryItems() {
  return PICTIONARY_IMAGES.map((name) => ({
    type: 'image',
    url: buildUrl(name),
    title: buildTitle(name)
  }));
}

