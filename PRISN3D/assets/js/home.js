// home.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCqH2BkDUDpHETxVpXF-vONY87Gbpvtm2w",
  authDomain: "prisn3d-int.firebaseapp.com",
  projectId: "prisn3d-int",
  storageBucket: "prisn3d-int.firebasestorage.app",
  messagingSenderId: "427727349767",
  appId: "1:427727349767:web:6a7818c6b385703001e2a2"
};

initializeApp(firebaseConfig);
const auth = getAuth();

// --- Función principal que inicializa toda la UI y simulación ---
function initHomeUI() {
  console.log("Inicializando UI de home...");

  // DOM elements
  const logoutBtn = document.getElementById("logout-btn");
  const adminView = document.getElementById("admin-view");
  const operatorView = document.getElementById("operator-view");

  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const tiempoRestanteEl = document.getElementById("tiempo-restante");
  const estadoImpresora = document.getElementById("estado-impresora");
  const pauseBtn = document.getElementById("pause-btn");
  const resumeBtn = document.getElementById("resume-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const tempCamaEl = document.getElementById("temp-cama");
  const tempBoquillaEl = document.getElementById("temp-boquilla");

  if (!progressBar) return console.error("No se encontró #progress-bar en el DOM");

  // ---- Logout ----
  logoutBtn?.addEventListener("click", async () => {
    try { await signOut(auth); } catch(e){ console.warn(e); }
    window.location.href = "index.html";
  });

  // ---- Tabs ----
  document.querySelectorAll(".tab-button").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab-button").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      const target = document.querySelector(tab.dataset.tab);
      if (target) target.classList.add("active");
    });
  });

  // ---- Simulación de impresión ----
  let progreso = 0;
  const duracionSegs = 15 * 60;
  let segundosRestantes = duracionSegs;
  let intervaloTick = null;
  let enPausa = false;
  let enCurso = false;
  const avancePorSeg = 100 / duracionSegs;

  function actualizarUI() {
    progressBar.style.width = `${Math.min(100, progreso)}%`;
    progressText.textContent = `Progreso: ${progreso.toFixed(1)}%`;
    const m = Math.floor(segundosRestantes / 60);
    const s = segundosRestantes % 60;
    tiempoRestanteEl.textContent = segundosRestantes > 0 ? `Tiempo restante: ${m}:${String(s).padStart(2,"0")}` : "Tiempo restante: 0:00";
  }

  function tick() {
    if (!enCurso || enPausa) return;
    const fluct = 0.8 + Math.random() * 0.8;
    progreso += avancePorSeg * fluct;
    segundosRestantes = Math.max(0, segundosRestantes - 1);

    if (progreso >= 100 || segundosRestantes === 0) {
      progreso = 100; enCurso = false;
      clearInterval(intervaloTick);
      estadoImpresora.innerHTML = "Ender-3: <strong>Impresión completada ✅</strong>";
      tiempoRestanteEl.textContent = "Impresión finalizada";
      progressBar.style.width = "100%";
      progressText.textContent = "Progreso: 100.0%";
      playBeep();
      return;
    }

    actualizarUI();
  }

  function iniciarImpresion() { enCurso = true; enPausa = false; estadoImpresora.innerHTML = "Ender-3: <strong>Imprimiendo...</strong>"; clearInterval(intervaloTick); intervaloTick = setInterval(tick, 1000);}
  function pausarImpresion() { enPausa = true; estadoImpresora.innerHTML = "Ender-3: <strong>Pausada ⏸️</strong>"; pauseBtn.disabled = true; resumeBtn.disabled = false; }
  function reanudarImpresion() { if(!enCurso) iniciarImpresion(); enPausa = false; estadoImpresora.innerHTML = "Ender-3: <strong>Reanudando...</strong>"; setTimeout(()=>{estadoImpresora.innerHTML="Ender-3: <strong>Imprimiendo...</strong>"; pauseBtn.disabled=false; resumeBtn.disabled=true;},600);}
  function cancelarImpresion() { clearInterval(intervaloTick); progreso=0; segundosRestantes=duracionSegs; enPausa=false; enCurso=false; progressBar.style.width="0%"; progressText.textContent="Progreso: 0.0%"; tiempoRestanteEl.textContent=`Tiempo restante: ${Math.floor(duracionSegs/60)}:00`; estadoImpresora.innerHTML="Ender-3: <strong>Cancelada 🛑</strong>"; pauseBtn.disabled=false; resumeBtn.disabled=true;}

  pauseBtn.addEventListener("click", ()=>{
    if(!enCurso){ iniciarImpresion(); pauseBtn.disabled=false; resumeBtn.disabled=true; return; }
    enPausa? reanudarImpresion() : pausarImpresion();
  });

  resumeBtn.addEventListener("click", reanudarImpresion);
  cancelBtn.addEventListener("click", cancelarImpresion);

  // Temperaturas simuladas
  let tempCama = 60.0, tempBoquilla = 200.0;
  setInterval(()=>{
    tempCama += (Math.random()-0.5)*0.8;
    tempBoquilla += (Math.random()-0.5)*1.5;
    if(tempCamaEl) tempCamaEl.textContent = `${tempCama.toFixed(1)}°C`;
    if(tempBoquillaEl) tempBoquillaEl.textContent = `${tempBoquilla.toFixed(1)}°C`;
  },3000);

  function playBeep() { try{ const ctx=new (window.AudioContext||window.webkitAudioContext)(); const o=ctx.createOscillator(); const g=ctx.createGain(); o.type="sine"; o.frequency.value=880; g.gain.value=0.05; o.connect(g); g.connect(ctx.destination); o.start(); setTimeout(()=>{o.stop();ctx.close();},250);}catch(e){console.warn("Beep failed:",e);}}

  // Inicialización visual
  tiempoRestanteEl.textContent = `Tiempo restante: ${Math.floor(duracionSegs / 60)}:00`;
  progressText.textContent = "Progreso: 0.0%";
  estadoImpresora.innerHTML = "Ender-3: <strong>Listo</strong>";
  resumeBtn.disabled = true;
  pauseBtn.disabled = false;

  // Inicia la impresión automáticamente
  iniciarImpresion();
}

// ---- Espera confirmación de usuario antes de inicializar ----
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Usuario autenticado:", user.email);
    initHomeUI();
  } else {
    console.log("No autenticado -> redirigiendo a index.html");
    window.location.href = "index.html";
  }
});
