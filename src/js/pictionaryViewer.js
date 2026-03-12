import { getPictionaryItems } from "./pictionaryMedia.js";
import { createFlipbookViewer, destroyFlipbookViewer } from "./flipbookViewer.js";

export function createPictionaryViewer(container) {
  const items = getPictionaryItems();
  const pages = items.map((i) => i.url);
  return createFlipbookViewer(container, {
    pages,
    title: "🖼️ Pictionary",
    indicatorId: "pictionary-indicator",
    dotsId: "pictionary-dots"
  });
}

export function destroyPictionaryViewer(wrapper) {
  destroyFlipbookViewer(wrapper);
}

