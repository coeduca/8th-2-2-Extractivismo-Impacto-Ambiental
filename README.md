# Extractivismo e Impacto Ambiental — 8° Grado

WebApp educativa para la asignatura **Ciudadanía y Valores** de COEDUCA, diseñada por el Prof. **José Eliseo Martínez**.

## 📚 Contenido

La aplicación cubre el tema de **extractivismo e impacto ambiental** con las siguientes actividades:

1. **Datos generales del estudiante**
2. **Ejercicio inicial** — análisis de 4 tipos de desechos (electrónicos, textiles, transporte, orgánicos)
3. **Video educativo** — historia de Pedro y Emerson sobre obsolescencia programada
4. **5 preguntas sobre el video** — comprensión lectora y análisis crítico
5. **Consolidación** — cuadro resumen de tipos de contaminación, causas y consecuencias
6. **Desafío XO** — juego de tres en raya con puntos extra (una sola oportunidad)
7. **Descarga de PDF** — exporta todas las respuestas para subir a Classroom

## ✨ Características técnicas

- **Diseño pop art** responsivo (móvil y PC)
- **Autoguardado** en localStorage (no se pierden respuestas si se recarga la página o se cae el internet)
- **Bloqueo de copiar/pegar** para fomentar respuestas originales
- **Generación de PDF** con `jsPDF` (sanitización de caracteres Unicode)
- **Juego XO inteligente** con estrategia de bloqueo y aleatoriedad balanceada
- **Funciona offline** tras la primera carga (jsPDF con fallback local)

## 🎮 Sistema de puntos XO

| Resultado | Puntos extra | Emoji |
|-----------|--------------|-------|
| Gana el estudiante | +1.0 | 😈 |
| Empate            | +0.5 | 😐 |
| Gana el profe     | +0.0 | 😢 |

Los puntos extra aparecen en la esquina superior derecha del PDF descargado.

## 📂 Estructura del proyecto

```
/
├── index.html              Página principal
├── styles.css              Estilos pop art
├── app.js                  Lógica (persistencia, XO, PDF)
├── jspdf.umd.min.js        jsPDF (fallback local)
└── files/
    ├── Captura_de_pantalla_2026-04-22_084713.png
    ├── energiascontaminantes.jpg
    ├── contaminaciondelagua.jpg
    ├── desechosplasticos.jpg
    ├── desechostextiles.jpg
    ├── desechoselectronicos.jpg
    └── video.mp4
```

## 🚀 Publicación en GitHub Pages

1. Sube todos los archivos al repositorio `8th-2-2-Extractivismo-Impacto-Ambiental`.
2. En **Settings → Pages**, selecciona la rama `main` (o la que uses) y carpeta `/ (root)`.
3. Accede a `https://<tu-usuario>.github.io/8th-2-2-Extractivismo-Impacto-Ambiental/`.

## 🏫 Créditos

- **Escuela:** COEDUCA
- **Materia:** Ciudadanía y Valores
- **Grado:** Octavo
- **Maestro:** José Eliseo Martínez

---

© 2026 COEDUCA. Uso educativo.
