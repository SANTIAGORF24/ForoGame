const EVIDENCIAS_BASE = (typeof import.meta.env?.BASE_URL === 'string' ? import.meta.env.BASE_URL : '/') + 'assets/evidencias';

const EVIDENCIAS_IMAGES = [
  'WhatsApp Image 2026-03-03 at 7.59.24 PM.jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.25 PM (1).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.25 PM.jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.27 PM (1).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.27 PM.jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.28 PM (1).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.28 PM (2).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.28 PM (3).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.28 PM.jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.29 PM (1).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.29 PM (2).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.29 PM (3).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.29 PM.jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.30 PM (1).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.30 PM (2).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.30 PM (3).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.30 PM (4).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.30 PM.jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.31 PM (1).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.31 PM (2).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.31 PM.jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.32 PM (1).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.32 PM (2).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.32 PM (3).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.32 PM.jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.33 PM (1).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.33 PM (2).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.33 PM.jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.34 PM (1).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.34 PM (2).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.34 PM (3).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.34 PM (4).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.34 PM.jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.35 PM (1).jpeg',
  'WhatsApp Image 2026-03-03 at 7.59.35 PM.jpeg'
];

const EVIDENCIAS_VIDEOS = [
  'WhatsApp Video 2026-03-03 at 7.59.24 PM.mp4',
  'WhatsApp Video 2026-03-03 at 7.59.25 PM (1).mp4',
  'WhatsApp Video 2026-03-03 at 7.59.25 PM (2).mp4',
  'WhatsApp Video 2026-03-03 at 7.59.25 PM.mp4',
  'WhatsApp Video 2026-03-03 at 7.59.26 PM (1).mp4',
  'WhatsApp Video 2026-03-03 at 7.59.26 PM (2).mp4',
  'WhatsApp Video 2026-03-03 at 7.59.26 PM (3).mp4',
  'WhatsApp Video 2026-03-03 at 7.59.26 PM.mp4',
  'WhatsApp Video 2026-03-03 at 7.59.27 PM (1).mp4',
  'WhatsApp Video 2026-03-03 at 7.59.27 PM (2).mp4',
  'WhatsApp Video 2026-03-03 at 7.59.27 PM.mp4',
  'WhatsApp Video 2026-03-03 at 7.59.28 PM.mp4',
  'WhatsApp Video 2026-03-03 at 7.59.32 PM.mp4',
  'WhatsApp Video 2026-03-03 at 7.59.33 PM.mp4'
];

export function getEvidenciasImageUrl(filename) {
  return `${EVIDENCIAS_BASE}/${encodeURIComponent(filename)}`;
}

export function getEvidenciasPreviewImages() {
  return EVIDENCIAS_IMAGES.slice(0, 5).map((name, i) => ({
    url: getEvidenciasImageUrl(name),
    title: `Evidencia ${i + 1}`
  }));
}

export function getEvidenciasGallery() {
  const imageItems = EVIDENCIAS_IMAGES.map(name => ({ type: 'image', url: getEvidenciasImageUrl(name) }));
  const videoItems = EVIDENCIAS_VIDEOS.map(name => ({ type: 'video', url: getEvidenciasImageUrl(name) }));
  return [...imageItems, ...videoItems];
}
