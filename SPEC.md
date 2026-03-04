# Bee Explorer - Especificación Técnica

## 1. Project Overview
- **Nombre**: Bee Explorer
- **Tipo**: Videojuego exploratorio 3D en navegador
- **Core**:控制一只蜜蜂在像素风格世界中探索，与环境互动
- **Target**: Usuarios que buscan experiencias web inmersivas

## 2. UI/UX Specification

### Layout Structure
- **Canvas**: Three.js renderizador ocupa toda la pantalla
- **HUD Overlay**: UI sobre el canvas
  - Indicador deControls (esquina inferior izquierda)
  - Panel de interacción (centro cuando hay proximidad)
  - Settings panel (esquina superior derecha, colapsable)

### Visual Design
- **Paleta de colores**:
  - Primary: `#FFD93D` (amarillo abeja)
  - Secondary: `#6BCB77` (verde hojas)
  - Accent: `#FF6B6B` (rojo flores)
  - Background: `#87CEEB` (cielo)
  - UI: `#1a1a2e` con `rgba(255,255,255,0.1)` glassmorphism
  
- **Tipografía**:
  - Headers: "Press Start 2P" (pixel font)
  - Body: "VT323" (monospace retro)
  
- **Efectos visuales**:
  - Pixel art shader en mundo 3D
  - Glow en elementos interactivos
  - Partículas de polen
  - Transiciones suaves (0.3s ease)

### Components
- **Bee**: Modelo 3D compuesto de esferas/cajas pixeladas
- **Árboles**: Combinación de conos y cylinders en estilo low-poly
- **Flores**: Geometría simple con colores vibrantes
- **Mariposas**: Modelos animados flotantes
- **Tarjetas 3D**: Posters flotantes para biografías
- **Cuadros de evidencia**: Marcos 3D con imágenes

## 3. Functionality Specification

### Controles
- **WASD / Flechas**: Movimiento de abeja
- **E**: Interactuar con objetos
- **ESC**: Abrir/cerrar menú de settings
- **Mouse**: Rotar cámara alrededor de la abeja

### Sistema de Movimiento
- Velocidad base: 5 unidades/segundo
- Animación de alas (oscilación)
- Cámara sigue con lerp suave (factor 0.1)
- Colisiones básicas con árboles

### Zonas Interactivas
1. **Zona de Evidencias** (x: 20, z: 20)
   - 3 cuadros flotantes con imágenes
   - Hover: glow + escala 1.1
   - E: abre overlay con imagen ampliada

2. **Zona de Planeaciones** (x: -15, z: 25)
   - Árbol especial más grande
   - Mensaje: "Presiona E para ver planeación"
   - E: abre PDF en iframe flotante

3. **Zona de Libro y Juegos** (x: 0, z: -20)
   - Libro 3D gigante
   - E: abre panel con tabs (Libro/Juegos)

4. **Zona de Biografías** (x: -25, z: -10)
   - 4 tarjetas 3D con faces
   - Aparición con fade + rise animation

### Animaciones Ambientales
- Mariposas: movimiento sinusoidal
- Pajaritos: path curvo aleatorio
- Flores: slight sway
- Partículas de polen flotando
- Luz ambiental oscilante (día/noche sutil)

### Panel de Settings
- Slider: Velocidad abeja (1-10)
- Toggle: Música on/off
- Slider: Cantidad mariposas (0-20)
- Dropdown: Calidad (Low/Medium/High)

## 4. Acceptance Criteria
- [ ] Abeja se mueve con WASD/flechas suavemente
- [ ] Cámara sigue en tercera persona
- [ ] Al menos 20 árboles en el mapa
- [ ] 5+ mariposas animadas
- [ ] Mensaje de controls aparece al inicio
- [ ] Proximidad a zonas muestra mensajes
- [ ] E abre contenido interactivo
- [ ] Panel settings funciona
- [ ] Sin errores en consola
- [ ] 60fps en hardware moderno
