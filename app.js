/* ================================================================
   APP — Extractivismo e Impacto Ambiental
   COEDUCA · 8° Grado · Ciudadanía y Valores
   ================================================================ */

(() => {
  'use strict';

  const STORAGE_KEY = 'coeduca_8_extractivismo_v1';
  const STORAGE_XO_KEY = 'coeduca_8_xo_jugado_v1';

  // ================= PERSISTENCIA =================
  const getState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  };

  const saveState = (state) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  };

  const restoreFields = () => {
    const state = getState();
    // Nombre
    const nombreInput = document.getElementById('nombreEstudiante');
    if (nombreInput && state.nombre) nombreInput.value = state.nombre;
    // Textareas con data-key
    document.querySelectorAll('textarea[data-key]').forEach(ta => {
      const k = ta.dataset.key;
      if (state[k]) ta.value = state[k];
    });
  };

  const bindAutoSave = () => {
    const nombreInput = document.getElementById('nombreEstudiante');
    if (nombreInput) {
      nombreInput.addEventListener('input', () => {
        const state = getState();
        state.nombre = nombreInput.value;
        saveState(state);
      });
    }
    document.querySelectorAll('textarea[data-key]').forEach(ta => {
      ta.addEventListener('input', () => {
        const state = getState();
        state[ta.dataset.key] = ta.value;
        saveState(state);
      });
    });
  };

  // ================= BLOQUEO COPIAR/PEGAR =================
  const mostrarAvisoCopyPaste = () => {
    const modal = document.getElementById('modalAviso');
    modal.classList.remove('oculto');
  };

  const bindAntiCheat = () => {
    // Bloquear en inputs y textareas
    document.querySelectorAll('textarea, input[type="text"]').forEach(el => {
      el.addEventListener('paste', (e) => {
        e.preventDefault();
        mostrarAvisoCopyPaste();
      });
      el.addEventListener('copy', (e) => {
        e.preventDefault();
        mostrarAvisoCopyPaste();
      });
      el.addEventListener('cut', (e) => {
        e.preventDefault();
        mostrarAvisoCopyPaste();
      });
      // Bloquear drag-drop de texto
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        mostrarAvisoCopyPaste();
      });
      el.addEventListener('dragover', (e) => e.preventDefault());
    });

    // Bloquear menú contextual (click derecho)
    document.addEventListener('contextmenu', (e) => {
      // Solo bloquear en zonas de texto o body general
      const tag = e.target.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') {
        e.preventDefault();
        mostrarAvisoCopyPaste();
      }
    });

    // Bloquear atajos Ctrl+C, Ctrl+V, Ctrl+X en todo el documento
    document.addEventListener('keydown', (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && ['c', 'v', 'x', 'C', 'V', 'X'].includes(e.key)) {
        const tag = document.activeElement?.tagName;
        if (tag === 'TEXTAREA' || tag === 'INPUT') {
          e.preventDefault();
          mostrarAvisoCopyPaste();
        }
      }
    });

    // Cerrar modal
    const btnCerrar = document.getElementById('cerrarModal');
    const modal = document.getElementById('modalAviso');
    btnCerrar.addEventListener('click', () => modal.classList.add('oculto'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('oculto');
    });
  };

  // ================= JUEGO XO =================
  let tablero = ['', '', '', '', '', '', '', '', ''];
  let juegoActivo = false;
  let turno = 'X'; // estudiante
  let resultadoXO = null; // 'win' | 'lose' | 'tie'

  const EMOJI = {
    pensando: '🤔',
    feliz: '😊',
    neutro: '😐',
    triste: '😢',
    diablo: '😈',
    serio: '😑'
  };

  const actualizarEmoji = (tipo) => {
    const e = document.getElementById('emojiEstado');
    e.textContent = EMOJI[tipo] || EMOJI.pensando;
  };

  const ciclarEmoji = () => {
    const secuencia = ['pensando', 'feliz', 'neutro', 'serio'];
    let i = 0;
    setInterval(() => {
      if (!juegoActivo && !resultadoXO) {
        actualizarEmoji(secuencia[i % secuencia.length]);
        i++;
      }
    }, 1600);
  };

  const haJugadoXO = () => localStorage.getItem(STORAGE_XO_KEY) !== null;
  const guardarResultadoXO = (res) => {
    localStorage.setItem(STORAGE_XO_KEY, res);
    const state = getState();
    state.xoResultado = res;
    saveState(state);
  };

  const COMBINACIONES_GANADORAS = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  const verificarGanador = (tab) => {
    for (const [a,b,c] of COMBINACIONES_GANADORAS) {
      if (tab[a] && tab[a] === tab[b] && tab[a] === tab[c]) {
        return { ganador: tab[a], linea: [a,b,c] };
      }
    }
    if (tab.every(c => c !== '')) return { ganador: 'empate', linea: [] };
    return null;
  };

  // ===== IA del XO =====
  // Estrategia: ganar si puede -> bloquear si debe -> 50% aleatorio -> 50% centro/esquina/borde
  // Esto hace al juego desafiante pero ganable, apropiado para un aula.

  const obtenerMovimientoCPU = () => {
    const vacias = tablero.map((v, i) => v === '' ? i : null).filter(v => v !== null);

    // 1) Si puede ganar, gana
    for (const i of vacias) {
      tablero[i] = 'O';
      const res = verificarGanador(tablero);
      tablero[i] = '';
      if (res && res.ganador === 'O') return i;
    }

    // 2) Si debe bloquear, bloquea
    for (const i of vacias) {
      tablero[i] = 'X';
      const res = verificarGanador(tablero);
      tablero[i] = '';
      if (res && res.ganador === 'X') return i;
    }

    // 3) 50% de probabilidad de jugar aleatorio (para dar chance real al estudiante)
    //    y 50% de jugar estratégicamente (centro > esquinas > bordes)
    if (Math.random() < 0.5) {
      return vacias[Math.floor(Math.random() * vacias.length)];
    }

    // Estrategia: preferir centro, luego esquinas, luego bordes
    const centro = [4];
    const esquinas = [0, 2, 6, 8];
    const bordes = [1, 3, 5, 7];
    for (const grupo of [centro, esquinas, bordes]) {
      const disponibles = grupo.filter(i => vacias.includes(i));
      if (disponibles.length > 0) {
        return disponibles[Math.floor(Math.random() * disponibles.length)];
      }
    }
    return vacias[0];
  };

  const pintarTablero = () => {
    document.querySelectorAll('.celda-xo').forEach((c, i) => {
      c.textContent = tablero[i];
      c.classList.toggle('x', tablero[i] === 'X');
      c.classList.toggle('o', tablero[i] === 'O');
      c.classList.toggle('ocupada', tablero[i] !== '');
    });
  };

  const mostrarResultado = (tipo) => {
    const contenedor = document.getElementById('xoResultado');
    contenedor.classList.remove('oculto');
    document.getElementById('xoTurno').classList.add('oculto');

    let mensaje = '';
    if (tipo === 'win') {
      mensaje = '😈 <strong>¡Sos un pro del XO, me has vencido!</strong><br>Ten 1 punto extra para tu nota final.';
      actualizarEmoji('diablo');
    } else if (tipo === 'tie') {
      mensaje = '😐 <strong>¡Es un empate, sos bueno en esto!</strong><br>Ten 0.5 extra para tu nota.';
      actualizarEmoji('serio');
    } else {
      mensaje = '😢 <strong>Oops, más suerte para la próxima.</strong><br>El prof. Eliseo se quedará con el punto que tenía escondido.';
      actualizarEmoji('triste');
    }
    contenedor.innerHTML = mensaje;
    resultadoXO = tipo;
    guardarResultadoXO(tipo);
    juegoActivo = false;
  };

  const marcarLineaGanadora = (linea) => {
    linea.forEach(i => {
      document.querySelector(`.celda-xo[data-i="${i}"]`)?.classList.add('ganadora');
    });
  };

  const jugarCelda = (i) => {
    if (!juegoActivo || tablero[i] !== '' || turno !== 'X') return;
    tablero[i] = 'X';
    pintarTablero();

    let res = verificarGanador(tablero);
    if (res) return finalizarJuego(res);

    turno = 'O';
    document.getElementById('xoTurno').textContent = 'Turno del Prof. Eliseo (O)';

    // CPU juega después de breve delay
    setTimeout(() => {
      const mov = obtenerMovimientoCPU();
      tablero[mov] = 'O';
      pintarTablero();
      res = verificarGanador(tablero);
      if (res) return finalizarJuego(res);
      turno = 'X';
      document.getElementById('xoTurno').textContent = 'Tu turno (X)';
    }, 600);
  };

  const finalizarJuego = (res) => {
    juegoActivo = false;
    if (res.ganador === 'X') {
      marcarLineaGanadora(res.linea);
      setTimeout(() => mostrarResultado('win'), 800);
    } else if (res.ganador === 'O') {
      marcarLineaGanadora(res.linea);
      setTimeout(() => mostrarResultado('lose'), 800);
    } else {
      setTimeout(() => mostrarResultado('tie'), 400);
    }
  };

  const iniciarXO = () => {
    if (haJugadoXO()) {
      // ya jugó — mostrar resultado guardado
      const prev = localStorage.getItem(STORAGE_XO_KEY);
      document.getElementById('btnAceptarXO').classList.add('oculto');
      document.getElementById('xoJuego').classList.remove('oculto');
      document.getElementById('xoTurno').classList.add('oculto');
      resultadoXO = prev;
      mostrarResultado(prev);
      return;
    }
    tablero = ['', '', '', '', '', '', '', '', ''];
    juegoActivo = true;
    turno = 'X';
    document.getElementById('btnAceptarXO').classList.add('oculto');
    document.getElementById('xoJuego').classList.remove('oculto');
    document.getElementById('xoTurno').classList.remove('oculto');
    document.getElementById('xoTurno').textContent = 'Tu turno (X)';
    actualizarEmoji('feliz');
    pintarTablero();
  };

  const bindXO = () => {
    document.getElementById('btnAceptarXO').addEventListener('click', iniciarXO);
    document.querySelectorAll('.celda-xo').forEach(c => {
      c.addEventListener('click', () => {
        const i = parseInt(c.dataset.i, 10);
        jugarCelda(i);
      });
    });
    // si ya jugó, restaurar al cargar
    if (haJugadoXO()) {
      const prev = localStorage.getItem(STORAGE_XO_KEY);
      document.getElementById('btnAceptarXO').classList.add('oculto');
      document.getElementById('xoJuego').classList.remove('oculto');
      document.getElementById('xoTurno').classList.add('oculto');
      resultadoXO = prev;
      // pintar mensaje sin re-guardar
      const contenedor = document.getElementById('xoResultado');
      contenedor.classList.remove('oculto');
      let mensaje = '';
      if (prev === 'win') {
        mensaje = '😈 <strong>¡Sos un pro del XO, me has vencido!</strong><br>Ten 1 punto extra para tu nota final.';
        actualizarEmoji('diablo');
      } else if (prev === 'tie') {
        mensaje = '😐 <strong>¡Es un empate, sos bueno en esto!</strong><br>Ten 0.5 extra para tu nota.';
        actualizarEmoji('serio');
      } else {
        mensaje = '😢 <strong>Oops, más suerte para la próxima.</strong><br>El prof. Eliseo se quedará con el punto que tenía escondido.';
        actualizarEmoji('triste');
      }
      contenedor.innerHTML = mensaje;
    } else {
      ciclarEmoji();
    }
  };

  // ================= GENERACIÓN DE PDF =================

  // Sanitizador — convierte texto a ASCII/latin-1 seguro para jsPDF default
  const sanitizar = (texto) => {
    if (texto === null || texto === undefined) return '';
    let t = String(texto);

    // 1) eliminar HTML preservando texto
    t = t.replace(/<[^>]*>/g, '');

    // 2) decodificar entidades HTML básicas
    const entidades = {
      '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>',
      '&quot;': '"', '&#39;': "'", '&apos;': "'"
    };
    Object.keys(entidades).forEach(k => {
      t = t.replace(new RegExp(k, 'g'), entidades[k]);
    });

    // 3) reemplazar caracteres problemáticos por equivalentes ASCII/latin-1
    const reemplazos = {
      '→': '->', '←': '<-', '↑': '^', '↓': 'v',
      '⇒': '=>', '⇐': '<=',
      '—': '-', '–': '-', '‐': '-', '‑': '-',
      '“': '"', '”': '"', '„': '"', '«': '"', '»': '"',
      '‘': "'", '’': "'", '‚': "'",
      '…': '...',
      '•': '-', '·': '-', '◦': '-', '▪': '-', '■': '-',
      '★': '*', '☆': '*', '✓': 'v', '✔': 'v', '✗': 'x', '✘': 'x',
      '©': '(c)', '®': '(R)', '™': '(TM)',
      '°': ' grados',
      '±': '+/-', '×': 'x', '÷': '/',
      '≈': '~', '≠': '!=', '≤': '<=', '≥': '>=',
      '¢': 'c', '€': 'EUR', '£': 'GBP', '¥': 'YEN',
      '¶': '', '§': '',
      '\u00a0': ' ', // nbsp
      '\u200b': '', '\u200c': '', '\u200d': '', '\ufeff': '',
    };
    Object.keys(reemplazos).forEach(k => {
      t = t.split(k).join(reemplazos[k]);
    });

    // 4) eliminar emojis y símbolos unicode no soportados
    // jsPDF default (Helvetica) soporta latin-1 (0-255). Eliminamos lo que está fuera.
    t = t.replace(/[\u{1F300}-\u{1FAFF}]/gu, ''); // emojis pictográficos
    t = t.replace(/[\u{2600}-\u{27BF}]/gu, ''); // misc symbols & dingbats
    t = t.replace(/[\u{1F000}-\u{1F2FF}]/gu, ''); // más emojis
    t = t.replace(/[\u{FE00}-\u{FE0F}]/gu, ''); // variation selectors
    t = t.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, ''); // flags

    // 5) filtrar a latin-1 — cualquier char > 255 se descarta
    t = t.split('').filter(ch => ch.charCodeAt(0) <= 255).join('');

    // 6) normalizar espacios
    t = t.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

    return t;
  };

  const obtenerPuntoExtra = () => {
    const r = localStorage.getItem(STORAGE_XO_KEY);
    if (r === 'win') return { puntos: '1.0', etiqueta: 'EXTRA' };
    if (r === 'tie') return { puntos: '0.5', etiqueta: 'EXTRA' };
    if (r === 'lose') return { puntos: '0.0', etiqueta: 'EXTRA' };
    return { puntos: '--', etiqueta: 'EXTRA' };
  };

  const generarPDF = () => {
    const state = getState();
    const nombreEst = sanitizar(document.getElementById('nombreEstudiante').value || 'Sin nombre');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });

    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 40; // margen
    let y = M;

    // ===== FUNCIÓN: dibujar esquina con puntaje extra =====
    const dibujarEsquinaPuntos = () => {
      const pExtra = obtenerPuntoExtra();
      const x = W - 130;
      const yy = 20;
      // Fondo amarillo con borde negro
      doc.setFillColor(255, 214, 10);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1.5);
      doc.roundedRect(x, yy, 110, 36, 4, 4, 'FD');
      // Texto
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text('NOTA EXTRA (XO)', x + 55, yy + 13, { align: 'center' });
      doc.setFontSize(16);
      doc.setTextColor(198, 16, 36);
      doc.text('+' + pExtra.puntos + ' pts', x + 55, yy + 30, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    };

    // ===== ENCABEZADO =====
    const dibujarEncabezado = () => {
      // Banda roja
      doc.setFillColor(255, 45, 63);
      doc.rect(0, 0, W, 70, 'F');
      // Título
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text(sanitizar('EXTRACTIVISMO E IMPACTO AMBIENTAL'), M, 32);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(sanitizar('Ciudadania y Valores - 8 Grado - COEDUCA'), M, 50);
      // Esquina de puntos
      dibujarEsquinaPuntos();
      doc.setTextColor(0, 0, 0);
      y = 90;
    };

    // ===== SALTO DE PÁGINA =====
    const checkPage = (alto = 60) => {
      if (y + alto > H - 40) {
        doc.addPage();
        dibujarEncabezado();
      }
    };

    // ===== TÍTULO DE SECCIÓN =====
    const titulo = (texto, color = [255, 45, 63]) => {
      checkPage(40);
      doc.setFillColor(...color);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1);
      doc.roundedRect(M, y, W - 2 * M, 26, 4, 4, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(sanitizar(texto), M + 10, y + 17);
      doc.setTextColor(0, 0, 0);
      y += 36;
    };

    // ===== BLOQUE PREGUNTA + RESPUESTA =====
    const bloquePreguntaRespuesta = (numero, pregunta, respuesta) => {
      const p = sanitizar(pregunta);
      const r = sanitizar(respuesta) || '(Sin respuesta)';

      // Pregunta
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(198, 16, 36);
      const preguntaTxt = `${numero}. ${p}`;
      const lineasP = doc.splitTextToSize(preguntaTxt, W - 2 * M - 10);
      checkPage(lineasP.length * 12 + 20);
      lineasP.forEach(ln => {
        doc.text(ln, M, y);
        y += 12;
      });
      y += 4;

      // Respuesta
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const lineasR = doc.splitTextToSize(r, W - 2 * M - 20);
      const alto = lineasR.length * 12 + 14;
      checkPage(alto);

      doc.setFillColor(255, 247, 230);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      doc.roundedRect(M, y - 8, W - 2 * M, alto, 3, 3, 'FD');
      let yR = y + 4;
      lineasR.forEach(ln => {
        doc.text(ln, M + 8, yR);
        yR += 12;
      });
      y += alto + 8;
    };

    // ===== TABLA GENÉRICA (encabezados + filas) =====
    const dibujarTabla = (encabezados, filas, anchos) => {
      const totalAncho = W - 2 * M;
      const factores = anchos || encabezados.map(() => 1 / encabezados.length);
      const colsW = factores.map(f => f * totalAncho);

      // Encabezados
      checkPage(30);
      const headerH = 26;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1);

      // Paso 1: pintar todos los rectángulos de fondo PRIMERO
      let xx = M;
      encabezados.forEach((h, i) => {
        doc.setFillColor(255, 140, 26);
        doc.rect(xx, y, colsW[i], headerH, 'FD');
        xx += colsW[i];
      });

      // Paso 2: escribir los textos encima
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      xx = M;
      encabezados.forEach((h, i) => {
        const txt = sanitizar(h);
        const lineas = doc.splitTextToSize(txt, colsW[i] - 6);
        let yh = lineas.length === 1 ? y + 17 : y + 11;
        lineas.forEach(ln => {
          doc.text(ln, xx + colsW[i] / 2, yh, { align: 'center' });
          yh += 10;
        });
        xx += colsW[i];
      });
      y += headerH;
      doc.setTextColor(0, 0, 0);

      // Filas
      filas.forEach(fila => {
        const celdas = fila.map(c => sanitizar(c) || '-');
        const lineasCeldas = celdas.map((c, i) => doc.splitTextToSize(c, colsW[i] - 10));
        const altoFila = Math.max(30, ...lineasCeldas.map(l => l.length * 11 + 10));
        checkPage(altoFila + 5);

        // Paso 1: rectángulos de fondo
        xx = M;
        celdas.forEach((c, i) => {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(0, 0, 0);
          doc.rect(xx, y, colsW[i], altoFila, 'FD');
          xx += colsW[i];
        });

        // Paso 2: textos
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        xx = M;
        celdas.forEach((c, i) => {
          let yc = y + 14;
          lineasCeldas[i].forEach(ln => {
            doc.text(ln, xx + 5, yc);
            yc += 11;
          });
          xx += colsW[i];
        });
        y += altoFila;
      });
      y += 10;
    };

    // ===== CONTENIDO =====
    dibujarEncabezado();

    // --- Datos generales ---
    titulo('DATOS GENERALES', [255, 45, 63]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const datos = [
      ['Escuela:', 'COEDUCA'],
      ['Materia:', 'Ciudadania y Valores'],
      ['Maestro:', 'Jose Eliseo Martinez'],
      ['Grado:', 'Octavo'],
      ['Estudiante:', nombreEst]
    ];
    datos.forEach(([k, v]) => {
      checkPage(16);
      doc.setFont('helvetica', 'bold');
      doc.text(sanitizar(k), M, y);
      doc.setFont('helvetica', 'normal');
      doc.text(sanitizar(v), M + 90, y);
      y += 16;
    });
    y += 8;

    // --- Ejercicio Inicial ---
    titulo('EJERCICIO INICIAL: Como afectan al medio ambiente', [30, 136, 255]);
    dibujarTabla(
      ['Desechos Electronicos', 'Desechos Textiles', 'Transporte', 'Desechos Organicos'],
      [[
        state['basura-electronicos'] || '',
        state['basura-textiles'] || '',
        state['basura-transporte'] || '',
        state['basura-organicos'] || ''
      ]]
    );

    // --- Preguntas del video ---
    titulo('PREGUNTAS SOBRE EL VIDEO', [50, 215, 75]);
    const preguntas = [
      { q: 'En la historia, Pedro y Emerson compran un celular nuevo sin necesitarlo realmente. Segun lo aprendido, que es la obsolescencia programada y de que manera esta estrategia nos motiva a comprar cosas nuevas antes de lo necesario?', a: state['video-q1'] },
      { q: 'Los celulares que Pedro y Emerson dejaron de usar se convertiran en basura electronica. En el ano 2019, cuantos millones de toneladas de residuos electronicos (residuos-E) se generaron en el mundo y por que esta cifra esta creciendo tan rapido?', a: state['video-q2'] },
      { q: 'Por que es un peligro grave para el medio ambiente y para la salud humana tirar a la basura aparatos electricos y electronicos (AEE) sin ningun protocolo de seguridad?', a: state['video-q3'] },
      { q: 'Gran parte de la basura electronica contaminante no se queda en los paises que mas consumen. A que tipo de paises se suele trasladar esta basura y bajo que "excusas" (como donaciones) llega a sus destinos?', a: state['video-q4'] },
      { q: 'Si estuvieras en el lugar de Pedro o Emerson, y sintieras el impulso de comprar un producto que no es de primera necesidad, que posibles efectos sobre el ambiente considerarias antes de tomar la decision?', a: state['video-q5'] }
    ];
    preguntas.forEach((p, i) => bloquePreguntaRespuesta(i + 1, p.q, p.a));

    // --- Consolidación ---
    titulo('CONSOLIDACION - Actividad Individual', [255, 45, 63]);
    dibujarTabla(
      ['Tipo de contaminacion', 'Causa', 'Consecuencia'],
      [
        ['Energias contaminantes', state['con-energia-causa'] || '', state['con-energia-cons'] || ''],
        ['Contaminacion del agua', state['con-agua-causa'] || '', state['con-agua-cons'] || ''],
        ['Desechos plasticos', state['con-plastico-causa'] || '', state['con-plastico-cons'] || ''],
        ['Residuos textiles', state['con-textil-causa'] || '', state['con-textil-cons'] || ''],
        ['Residuos electronicos (residuos-E)', state['con-electro-causa'] || '', state['con-electro-cons'] || '']
      ],
      [0.32, 0.34, 0.34]
    );

    // --- Pie en cada página: numeración ---
    const paginas = doc.internal.getNumberOfPages();
    for (let i = 1; i <= paginas; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Pagina ${i} de ${paginas} - COEDUCA`, W / 2, H - 20, { align: 'center' });
    }

    // --- Guardar ---
    // Preservamos acentos y ñ; sólo quitamos caracteres peligrosos en nombres de archivo
    const nombreLimpio = nombreEst
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
      .replace(/\s+/g, '_')
      .trim() || 'Estudiante';
    const nombreArchivo = `Extractivismo_${nombreLimpio}.pdf`;
    doc.save(nombreArchivo);
  };

  const bindPDF = () => {
    document.getElementById('btnDescargarPDF').addEventListener('click', generarPDF);
  };

  // ================= INIT =================
  document.addEventListener('DOMContentLoaded', () => {
    restoreFields();
    bindAutoSave();
    bindAntiCheat();
    bindXO();
    bindPDF();
  });

})();
