import { getJuegosItems } from "./juegosMedia.js";
import { getPlaneacionesItems } from "./planeacionesMedia.js";
import { createBookViewer, destroyBookViewer } from "./bookViewer.js";
import { createPictionaryViewer, destroyPictionaryViewer } from "./pictionaryViewer.js";

let currentZone = null;
let activeBookViewer = null;
let activePictionaryViewer = null;
let isMobile = false;

export function initUI(callbacks) {
  isMobile =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia?.('(pointer: coarse)')?.matches;

  const settingsBtn = document.getElementById("settings-btn");
  const closeSettings = document.getElementById("close-settings");
  const speedSlider = document.getElementById("speed-slider");
  const speedValue = document.getElementById("speed-value");
  const musicToggle = document.getElementById("music-toggle");
  const butterflySlider = document.getElementById("butterfly-slider");
  const butterflyValue = document.getElementById("butterfly-value");
  const qualitySelect = document.getElementById("quality-select");
  const overlayClose = document.querySelector(".overlay-close");
  const overlayBackdrop = document.querySelector(".overlay-backdrop");
  const mobileControls = document.getElementById("mobile-controls");
  const mobileInteract = document.getElementById("mobile-interact");

  if (isMobile && mobileControls) {
    mobileControls.classList.remove("hidden");
  }

  if (mobileInteract) {
    mobileInteract.addEventListener("click", () => {
      callbacks("interact");
    });
  }

  setupJoystick(callbacks);

  settingsBtn.addEventListener("click", () => {
    callbacks("settings");
  });

  closeSettings.addEventListener("click", () => {
    document.getElementById("settings-panel").classList.add("hidden");
  });

  speedSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    speedValue.textContent = val;
    callbacks("speed", val);
  });

  musicToggle.addEventListener("click", () => {
    musicToggle.classList.toggle("on");
    musicToggle.classList.toggle("off");
    musicToggle.textContent = musicToggle.classList.contains("on")
      ? "ON"
      : "OFF";
    callbacks("music", musicToggle.classList.contains("on"));
  });

  butterflySlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    butterflyValue.textContent = val;
    callbacks("butterflies", val);
  });

  qualitySelect.addEventListener("change", (e) => {
    callbacks("quality", e.target.value);
  });

  overlayClose.addEventListener("click", () => {
    callbacks("closeOverlay");
  });

  overlayBackdrop.addEventListener("click", () => {
    callbacks("closeOverlay");
  });

  setTimeout(() => {
    const hint = document.getElementById("controls-hint");
    hint.style.opacity = "1";
    hint.style.transform = "translateY(0)";
  }, 3000);

  setTimeout(() => {
    const hint = document.getElementById("controls-hint");
    hint.style.transition = "all 0.5s ease";
    hint.style.opacity = "0";
    hint.style.transform = "translateY(20px)";
  }, 10000);
}

export function updateInteractionPrompt(zone) {
  const prompt = document.getElementById("interaction-prompt");
  const promptText = prompt.querySelector(".prompt-text");
  const mobileInteract = document.getElementById("mobile-interact");

  if (zone && zone.message) {
    currentZone = zone;
    if (isMobile) {
      // En móvil usamos botón grande centrado
      if (prompt) prompt.classList.add("hidden");
      if (mobileInteract) {
        mobileInteract.classList.remove("hidden");
        mobileInteract.textContent = "Interactuar";
      }
    } else {
      promptText.textContent = zone.message;
      prompt.classList.remove("hidden");
      if (mobileInteract) mobileInteract.classList.add("hidden");
    }
  } else {
    currentZone = null;
    if (prompt) prompt.classList.add("hidden");
    if (mobileInteract) mobileInteract.classList.add("hidden");
  }
}

export function showOverlay(zone) {
  const overlay = document.getElementById("overlay");
  const overlayBody = document.getElementById("overlay-body");

  overlayBody.innerHTML = "";

  switch (zone.type) {
    case "introVideo": {
      const videoUrl = zone.data?.videoUrl || "/assets/video.mp4";
      overlayBody.innerHTML = `
        <h2>🎬 Video introductorio</h2>
        <div class="video-intro-wrap">
          <video class="video-intro-player" controls autoplay src="${videoUrl}" title="Video introductorio"></video>
          <p style="color: #aaa; margin-top: 12px; text-align: center; font-size: 14px;">Cierra con × cuando termines</p>
        </div>
      `;
      const video = overlayBody.querySelector(".video-intro-player");
      if (video) {
        video.play().catch(() => {});
      }
      break;
    }
    case "evidence": {
      const gallery = zone.data?.gallery || [];
      const galleryHtml = gallery
        .map((item, i) => {
          if (item.type === "video") {
            return `
            <div class="evidence-gallery-item evidence-gallery-video">
              <video src="${item.url}" controls preload="metadata" class="evidence-media"></video>
            </div>
          `;
          }
          return `
          <div class="evidence-gallery-item">
            <img src="${item.url}" alt="Evidencia ${i + 1}" class="evidence-media" loading="lazy">
          </div>
        `;
        })
        .join("");
      overlayBody.innerHTML = `
        <h2>📸 Evidencias</h2>
        <p style="color: #aaa; margin-bottom: 20px; text-align: center;">Galería de evidencias</p>
        <div class="evidence-gallery">
          ${galleryHtml}
        </div>
      `;
      break;
    }

    case "planning": {
      const items = getPlaneacionesItems();
      if (items.length === 0) {
        overlayBody.innerHTML = `
          <h2>🌳 Planeaciones</h2>
          <p style="color: #aaa; margin-bottom: 20px; text-align: center;">
            Aún no hay planeaciones cargadas. Agrega archivos en <code>assets/planeaciones</code>.
          </p>
        `;
        break;
      }

      const initial =
        items.find((i) => i.type === "pdf") || items[0];

      const gridHtml = items
        .map(
          (item, index) => `
          <div class="game-card planeacion-item" data-index="${index}">
            <div class="game-meta">
              <span class="game-title">${item.title}</span>
            </div>
          </div>
        `
        )
        .join("");

      overlayBody.innerHTML = `
        <h2>🌳 Planeaciones</h2>
        <div class="planeaciones-layout">
          <div class="planeaciones-main"></div>
          <div class="planeaciones-sidebar">
            <p style="color: #aaa; margin-bottom: 10px;">Recursos de planeación</p>
            <div class="games-gallery">
              ${gridHtml}
            </div>
          </div>
        </div>
      `;

      const main = overlayBody.querySelector(".planeaciones-main");

      const renderMain = (item) => {
        if (!main) return;
        if (item.type === "image") {
          main.innerHTML = `
            <img src="${item.url}" alt="${item.title}" class="planeaciones-image-main" />
          `;
        } else if (item.type === "pdf") {
          main.innerHTML = `
            <iframe 
              src="${item.url}" 
              class="pdf-viewer"
              title="${item.title}"
            ></iframe>
          `;
        } else {
          main.innerHTML = `
            <p style="color: #aaa; margin-bottom: 10px;">
              Recurso: ${item.title}
            </p>
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="game-link">
              Abrir recurso en nueva pestaña
            </a>
          `;
        }
      };

      const planeacionEls = overlayBody.querySelectorAll(".planeacion-item");

      const setActiveByIndex = (idx) => {
        planeacionEls.forEach((node) =>
          node.classList.remove("planeacion-item-active")
        );
        const activeEl = Array.from(planeacionEls).find(
          (node) => parseInt(node.dataset.index || "0", 10) === idx
        );
        if (activeEl) {
          activeEl.classList.add("planeacion-item-active");
        }
      };

      // Render inicial
      const initialIndex = items.indexOf(initial);
      renderMain(initial);
      setActiveByIndex(initialIndex === -1 ? 0 : initialIndex);

      // Click en la lista para cambiar el recurso mostrado
      planeacionEls.forEach((el) => {
        el.addEventListener("click", () => {
          const idx = parseInt(el.dataset.index || "0", 10);
          const item = items[idx];
          if (item) {
            renderMain(item);
            setActiveByIndex(idx);
          }
        });
      });

      break;
    }

    case "book":
      overlayBody.innerHTML = `
        <h2>📚 Libro y Juegos</h2>
        <div class="book-tabs">
          <button class="book-tab active" data-tab="libro">📖 Libro</button>
          <button class="book-tab" data-tab="juegos">🎮 Juegos</button>
        </div>
        <div id="book-content"></div>
      `;

      // Mostrar libro con page-flip por defecto
      const bookContent = overlayBody.querySelector("#book-content");
      activeBookViewer = createBookViewer(bookContent);

      const juegosItems = getJuegosItems();

      overlayBody.querySelectorAll(".book-tab").forEach((tab) => {
        tab.addEventListener("click", (e) => {
          overlayBody
            .querySelectorAll(".book-tab")
            .forEach((t) => t.classList.remove("active"));
          e.target.classList.add("active");

          const content = document.getElementById("book-content");
          if (e.target.dataset.tab === "juegos") {
            // Destruir visor de libro si estaba activo
            if (activeBookViewer) {
              destroyBookViewer(activeBookViewer);
              activeBookViewer = null;
            }
            const galleryHtml = juegosItems
              .map((item) => {
                if (item.type === "image") {
                  return `
                  <div class="game-card">
                    <img src="${item.url}" alt="${item.title}" class="game-thumb" loading="lazy">
                    <div class="game-meta">
                      <span class="game-title">${item.title}</span>
                    </div>
                  </div>
                `;
                }
                if (item.type === "audio") {
                  return `
                  <div class="game-card">
                    <div class="game-meta">
                      <span class="game-title">${item.title}</span>
                    </div>
                    <audio controls class="game-audio">
                      <source src="${item.url}" type="audio/mpeg" />
                    </audio>
                  </div>
                `;
                }
                return `
                <div class="game-card">
                  <div class="game-meta">
                    <span class="game-title">${item.title}</span>
                  </div>
                  <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="game-link">
                    Descargar recurso
                  </a>
                </div>
              `;
              })
              .join("");
            content.innerHTML = `
              <div class="games-gallery">
                ${galleryHtml}
              </div>
            `;
          } else {
            // Volver al libro con page-flip
            content.innerHTML = "";
            activeBookViewer = createBookViewer(content);
          }
        });
      });
      break;

    case "pictionary": {
      overlayBody.innerHTML = `
        <h2>🖼️ Pictionary</h2>
        <div id="pictionary-content"></div>
      `;
      const content = overlayBody.querySelector("#pictionary-content");
      activePictionaryViewer = createPictionaryViewer(content);
      break;
    }

    case "bio":
      overlayBody.innerHTML = `
        <h2>👤 Biografías</h2>
        <p style="color: #aaa; margin-bottom: 20px; text-align: center;">Presiona E en la zona para ver cada biografía de cerca</p>
        <div class="bio-cards bio-cards-close">
          <div class="bio-card bio-card-image">
            <img src="/assets/Biografia1.png" alt="Biografía 1" class="bio-image-large">
            <p style="margin-top: 12px; color: rgba(255,255,255,0.8); font-size: 14px;">Laura Garzón — Estudiante ENSDMM</p>
          </div>
          <div class="bio-card bio-card-image">
            <img src="/assets/Biografia2.png" alt="Biografía 2" class="bio-image-large">
            <p style="margin-top: 12px; color: rgba(255,255,255,0.8); font-size: 14px;">Biografía 2</p>
          </div>
        </div>
      `;
      break;
  }

  overlay.classList.remove("hidden");
}

export function hideOverlay() {
  const overlay = document.getElementById("overlay");
  const video = overlay?.querySelector(".video-intro-player");
  if (video) {
    video.pause();
  }
  // Limpiar visor de libro si existe
  if (activeBookViewer) {
    destroyBookViewer(activeBookViewer);
    activeBookViewer = null;
  }
  // Limpiar visor de pictionary si existe
  if (activePictionaryViewer) {
    destroyPictionaryViewer(activePictionaryViewer);
    activePictionaryViewer = null;
  }
  overlay.classList.add("hidden");
}

function setupJoystick(callbacks) {
  const joystick = document.getElementById("joystick");
  if (!joystick) return;

  const base = joystick.querySelector(".joystick-base");
  const stick = joystick.querySelector(".joystick-stick");
  if (!base || !stick) return;

  let active = false;
  let pointerId = null;
  let origin = { x: 0, y: 0 };
  const maxDist = 42;

  const setStick = (dx, dy) => {
    stick.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const emit = (x, y) => {
    callbacks("joystick", { x, y });
  };

  const onDown = (e) => {
    active = true;
    pointerId = e.pointerId;
    joystick.setPointerCapture(pointerId);
    const rect = base.getBoundingClientRect();
    origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    emit(0, 0);
  };

  const onMove = (e) => {
    if (!active || e.pointerId !== pointerId) return;
    const dx = e.clientX - origin.x;
    const dy = e.clientY - origin.y;
    const dist = Math.min(maxDist, Math.sqrt(dx * dx + dy * dy));
    const ang = Math.atan2(dy, dx);
    const cx = Math.cos(ang) * dist;
    const cy = Math.sin(ang) * dist;
    setStick(cx, cy);
    // Normalizado -1..1. Y invertida (arriba = +1)
    emit(cx / maxDist, -cy / maxDist);
  };

  const onUp = (e) => {
    if (e.pointerId !== pointerId) return;
    active = false;
    pointerId = null;
    joystick.releasePointerCapture(e.pointerId);
    setStick(0, 0);
    emit(0, 0);
  };

  joystick.addEventListener("pointerdown", onDown);
  joystick.addEventListener("pointermove", onMove);
  joystick.addEventListener("pointerup", onUp);
  joystick.addEventListener("pointercancel", onUp);
}

export function getCurrentZone() {
  return currentZone;
}

export function updateMinimap(beePos) {
  const playerDot = document.getElementById("player-dot");
  if (!playerDot) return;

  const mapBounds = 40;
  const x = ((beePos.x + mapBounds) / (mapBounds * 2)) * 100;
  const y = ((beePos.z + mapBounds) / (mapBounds * 2)) * 100;

  playerDot.style.left = `${Math.max(5, Math.min(95, x))}%`;
  playerDot.style.top = `${Math.max(5, Math.min(95, 100 - y))}%`;
}
