const JUEGOS_BASE =
  (typeof import.meta.env?.BASE_URL === 'string' ? import.meta.env.BASE_URL : '/') +
  'assets/juegos';

const JUEGOS_IMAGENES = [
  '0bc886be-14bc-473a-9853-a244699b82c6.jpg',
  '2ead9a1b-5404-4aa8-83eb-5b05a1d902f7-resized.jpg',
  '5ecc6804-fef2-4e0f-bc61-508c52e30c98-resized.jpg',
  '5f8a189a-4687-4878-90e6-dd5d50fa782f.jpg',
  'Cute Little Bee Cartoon Element, Bee Clipart, Cute Clipart, Cartoon Clipart PNG Transparent Image and Clipart for Free Download-resized.jpg',
  'Our Wedding-resized.jpg',
  'Pintado A Mano Pintura Al óleo Nubes Blancas Pintadas A Mano Cielo Azul de Pantalla Imagen para Descarga Gratuita - Pngtree-resized.jpg',
  'Poça d\'água de lagoa com grama e pedras no estilo cartoon _ Vetor Premium (1).jpg',
  '_Sunflower Aesthetic-resized1.jpg',
  'butterfly-resized.jpg',
  'everyone-resized.jpg',
  'f40bd456-9a32-4929-84b6-7f7cac482ab3-resized.jpg',
  'poor bird-resized.jpg',
  '🩷🌷.jpg'
];

const JUEGOS_AUDIOS = [
  'BEE.mp3',
  'BUTERFLY.mp3',
  'COMPLETE.mp3',
  'FLOWER.mp3',
  'HUMIN.mp3',
  'KID.mp3',
  'SUN.mp3',
  'UNBELIEVABLE.mp3',
  'all to well nectar.mp3',
  'good job.mp3',
  'hummingibird .mp3',
  'make-the-puzzle.mp3',
  'matching.mp3',
  'search-partners.mp3',
  'sky.mp3',
  'some bees.mp3',
  'very good.mp3',
  'water.mp3',
  'discover-.mp3'
];

const JUEGOS_ARCHIVOS = [
  'TheLittleHummingbirdPARTE1.jclic',
  'TheLittleHummingbirds.jclic.zip'
];

function buildUrl(filename) {
  return `${JUEGOS_BASE}/${encodeURIComponent(filename)}`;
}

function buildTitle(filename) {
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  return withoutExt.replace(/[_\-]/g, ' ');
}

export function getJuegosItems() {
  const images = JUEGOS_IMAGENES.map((name) => ({
    type: 'image',
    url: buildUrl(name),
    title: buildTitle(name)
  }));

  const audios = JUEGOS_AUDIOS.map((name) => ({
    type: 'audio',
    url: buildUrl(name),
    title: buildTitle(name)
  }));

  const files = JUEGOS_ARCHIVOS.map((name) => ({
    type: 'file',
    url: buildUrl(name),
    title: buildTitle(name)
  }));

  return [...images, ...audios, ...files];
}

