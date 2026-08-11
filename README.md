# 🐝 Foro Abeja — Exploración 3D en el navegador

> Experiencia web 3D en la que controlas una abeja que vuela por un mundo *low-poly* para
> descubrir el contenido de un foro académico. Three.js puro, sin motor de juego, sin
> framework de UI.

---

## 🎯 La idea

Presentar el material de un foro —biografías, planeaciones, evidencias fotográficas,
juegos didácticos— **como un espacio que se recorre** en lugar de una galería que se
desplaza. El visitante no navega por menús: vuela hasta una zona y el contenido aparece.

---

## ✨ Qué incluye

| Sistema | Detalle |
| --- | --- |
| **Vuelo libre** | Control de la abeja en 3 ejes con inercia y orientación suave de cámara |
| **Zonas interactivas** | El mundo se divide en áreas; al acercarse se activa el panel de interacción correspondiente |
| **Visor de libro** | *Flipbook* con paso de página animado para documentos |
| **Visor de PDF** | Renderizado de documentos con `pdfjs-dist` sobre superficies 3D |
| **Galería de evidencias** | Fotos y vídeos montados como cuadros en el mundo |
| **Pictionary** | Juego didáctico con su propio visor de láminas |
| **Ambientación** | Partículas de polen, mariposas animadas y ciclo de luz |
| **Panel de ajustes** | Calidad gráfica, sonido y sensibilidad, colapsable |

---

## 🎨 Dirección de arte

Estética **pixel art sobre geometría low-poly**: la abeja, los árboles y las flores se
componen de primitivas (esferas, cajas, conos) y el conjunto pasa por un shader pixelado.

| | |
| --- | --- |
| Primario | `#FFD93D` — amarillo abeja |
| Secundario | `#6BCB77` — verde hoja |
| Acento | `#FF6B6B` — rojo flor |
| Fondo | `#87CEEB` — cielo |
| UI | `#1a1a2e` con glassmorphism |

Tipografías: *Press Start 2P* para títulos, *VT323* para el cuerpo.

---

## 🧱 Stack

**Three.js** · **Vite** · **pdfjs-dist** · JavaScript (ESM), sin framework de UI

> La ausencia de framework es intencional: todo el HUD se maneja con DOM directo sobre el
> canvas, evitando el coste de reconciliación en el bucle de render.

---

## 📂 Estructura

```
src/
├── main.js                  bucle principal y arranque
└── js/
    ├── world.js             construcción del escenario
    ├── bee.js               modelo y física de la abeja
    ├── camera.js            seguimiento y amortiguación
    ├── zones.js             detección de proximidad y activación
    ├── ambient.js           partículas, mariposas, iluminación
    ├── intro.js             secuencia de entrada
    ├── ui.js                HUD y panel de ajustes
    ├── bookViewer.js        visor de documentos
    ├── flipbookViewer.js    paso de página animado
    ├── pictionaryViewer.js  juego de láminas
    └── *Media.js            carga de evidencias, planeaciones y juegos
SPEC.md                      especificación técnica y criterios de aceptación
```

---

## 🚀 Ejecutar

```bash
git clone https://github.com/SANTIAGORF24/ForoGame.git
cd ForoGame
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # build de producción
npm run preview    # previsualizar el build
```

---

## 👤 Autor

**Santiago Ramírez Forero** — Desarrollador Full Stack
[LinkedIn](https://www.linkedin.com/in/santiago-ramírez-forero) · [GitHub](https://github.com/SANTIAGORF24)
