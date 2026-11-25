// Bingo de tareas

const hitos = [
  { puntos: 10, premio: "Pasaje gratis 1 semana" },
  { puntos: 25, premio: "20% de descuento en comidas" },
  { puntos: 50, premio: "Descuento en materiales de arquitectura" },
  { puntos: 75, premio: "Bono de cafetería universitaria" },
  { puntos: 100, premio: "1 crédito extra académico" }
];

let tareas = [
  "Ordenar escritorio", "Tomar 2L de agua", "Organizar mochila", "Dormir 8 horas", "Limpiar laptop",
  "Hacer ejercicio", "Preparar lonchera", "Revisar correos", "Lavar ropa", "Caminar 30 min",
  "Estirar 10 min", "Ahorrar hoy", "Cocinar en casa", "Sin redes 1 hora", "Ordenar archivos",
  "Tender mi cama", "Planificar semana", "Comprar útiles", "Descansar vista", "Hidratar piel",
  "Regar plantas", "Ordenar apuntes", "Desayuno completo", "Hacer compras", "Checklist listo"
];

// las 12 líneas posibles: 5 filas, 5 columnas y 2 diagonales
const lineasPosibles = [[0, 6, 12, 18, 24], [4, 8, 12, 16, 20]];
for (let i = 0; i < 5; i++) {
  lineasPosibles.push([0, 1, 2, 3, 4].map(j => i * 5 + j));
  lineasPosibles.push([0, 1, 2, 3, 4].map(j => j * 5 + i));
}

let hechas = Array(25).fill(false);
let extra = 0;            // puntos de la simulación (+5 / +15)
let desbloqueados = [];   // hitos que ya se mostraron
let cola = [];            // hitos pendientes de mostrar
let editando = false;

const $ = id => document.getElementById(id);

// guardar y cargar en el navegador
function guardar() {
  try { localStorage.setItem("bingo", JSON.stringify({ tareas, hechas, extra, desbloqueados })); } catch (e) {}
}
try {
  const g = JSON.parse(localStorage.getItem("bingo"));
  if (g && g.tareas.length === 25 && g.hechas.length === 25) ({ tareas, hechas, extra, desbloqueados } = g);
} catch (e) {}

function lineasCompletas() {
  return lineasPosibles.filter(l => l.every(i => hechas[i]));
}

function dibujarTablero(lineas) {
  const enLinea = new Set(lineas.flat());
  $("tablero").innerHTML = "";

  tareas.forEach((texto, i) => {
    const celda = document.createElement("div");
    celda.className = "celda" + (enLinea.has(i) ? " linea" : hechas[i] ? " hecha" : "");
    celda.tabIndex = 0;
    celda.onclick = () => marcar(i);
    celda.onkeydown = e => { if (e.key === "Enter" && e.target === celda) marcar(i); };

    const span = document.createElement("span");
    span.textContent = texto;
    if (editando) {
      span.contentEditable = true;
      span.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); span.blur(); } };
      span.onblur = () => { tareas[i] = span.textContent.trim().slice(0, 38) || tareas[i]; guardar(); };
    }
    celda.append(span);
    $("tablero").append(celda);
  });
}

function marcar(i) {
  if (editando) return;
  hechas[i] = !hechas[i];
  actualizar();
}

function actualizar() {
  const lineas = lineasCompletas();
  const puntos = Math.min(100, lineas.length + extra);   // 1 punto por línea

  dibujarTablero(lineas);
  $("score").textContent = puntos;
  $("lineas").textContent = lineas.length + " / 12";
  $("porcentaje").textContent = puntos + "%";
  $("barra-h").style.width = puntos + "%";
  $("barra-v").style.height = puntos + "%";

  const siguiente = hitos.find(h => puntos < h.puntos);
  $("proximo").textContent = siguiente
    ? `Próximo hito: ${siguiente.puntos} pts — ${siguiente.premio} (faltan ${siguiente.puntos - puntos})`
    : "¡Conseguiste todas las recompensas!";

  document.querySelectorAll("#hitos span, #lista-hitos li").forEach(el => {
    el.classList.toggle("logrado", puntos >= el.dataset.puntos);
  });

  hitos.filter(h => puntos >= h.puntos && !desbloqueados.includes(h.puntos)).forEach(h => {
    desbloqueados.push(h.puntos);
    cola.push(h);
  });
  mostrarSiguiente();
  guardar();
}

// ventana de felicitación (si llegas a 100 se muestra solo el premio mayor)
function mostrarSiguiente() {
  if (!$("modal").classList.contains("oculto") || cola.length === 0) return;

  const mayor = hitos[hitos.length - 1];
  const h = cola.some(x => x.puntos === mayor.puntos) ? mayor : cola[0];
  const grande = h === mayor;
  cola = grande ? [] : cola.slice(1);

  $("caja").className = "caja" + (grande ? " grande" : "");
  $("m-titulo").textContent = grande
    ? "¡FELICIDADES, GANASTE EL PREMIO MAYOR!"
    : "¡FELICIDADES! GANASTE: " + h.premio.toUpperCase();
  $("m-texto").textContent = grande
    ? "Completaste los 100 puntos: " + h.premio + "."
    : `Llegaste a ${h.puntos} puntos. Sigue completando líneas para el siguiente hito.`;
  $("modal").classList.remove("oculto");
}

$("m-cerrar").onclick = () => {
  $("modal").classList.add("oculto");
  mostrarSiguiente();
};

// botones
$("btn-editar").onclick = () => {
  editando = !editando;
  document.body.classList.toggle("editando", editando);
  $("btn-editar").textContent = editando ? "Listo" : "Editar tareas";
  actualizar();
};
$("mas5").onclick = () => { extra += 5; actualizar(); };
$("mas15").onclick = () => { extra += 15; actualizar(); };
$("reiniciar").onclick = () => {
  hechas = Array(25).fill(false);
  extra = 0;
  desbloqueados = [];
  cola = [];
  actualizar();
};

// hitos sobre la barra, etiquetas y lista del panel
hitos.forEach(h => {
  const punto = document.createElement("span");
  punto.dataset.puntos = h.puntos;
  punto.style.left = h.puntos + "%";
  $("hitos").append(punto);

  const etiqueta = document.createElement("span");
  etiqueta.style.left = h.puntos + "%";
  if (h.puntos === 100) { etiqueta.style.marginLeft = "-90px"; etiqueta.style.textAlign = "right"; }
  etiqueta.innerHTML = `<b>${h.puntos} pts</b><br>${h.premio}`;
  $("etiquetas").append(etiqueta);
});
[...hitos].reverse().forEach(h => {
  const li = document.createElement("li");
  li.dataset.puntos = h.puntos;
  li.innerHTML = `<b>${h.puntos} PTS</b>${h.premio}`;
  $("lista-hitos").append(li);
});

actualizar();
