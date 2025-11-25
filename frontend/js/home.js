// frontend/js/home.js
import { checkSession, logout } from '/frontend/js/main.js';

// 1. SEGURIDAD
checkSession();

// --- OBTENER ROL DEL USUARIO ---
const userRole = localStorage.getItem('rol_prisn3d') || 'operador';
console.log("Rol actual:", userRole);

// Si NO es admin, ocultamos el botón grande de "Añadir Impresora"
const addPrinterCard = document.getElementById('show-add-modal-btn');
if (userRole !== 'admin' && addPrinterCard) {
    addPrinterCard.style.display = 'none';
}

const logoutButton = document.getElementById('logout-btn');
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        if (confirm("¿Seguro que quieres salir?")) logout();
    });
}

// 2. GRÁFICA
const ctx = document.getElementById('sensor-chart').getContext('2d');
const sensorChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            { label: 'Temp (°C)', data: [], borderColor: 'red', borderWidth: 2, tension: 0.1 },
            { label: 'Hum (%)', data: [], borderColor: 'blue', borderWidth: 2, tension: 0.1 }
        ]
    },
    options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        scales: { x: { display: true }, y: { display: true } }
    }
});

// 3. VARIABLES
const logListElement = document.getElementById('log-list');
let latestTemp = 0;
let latestHum = 0;
let editingId = null;

// 4. FUNCIONES DE INTERFAZ (LOGS Y GRÁFICA)
function actualizarInterfaz(logs) {
    const labels = [], temps = [], hums = [], listHTML = [];
    logs.forEach(log => {
        const timeStr = new Date(log.timestamp).toLocaleTimeString('es-ES');
        labels.push(timeStr);
        temps.push(log.temperatura);
        hums.push(log.humedad);
        listHTML.unshift(`<li>[${timeStr}] T: ${log.temperatura}°C | H: ${log.humedad}%</li>`);
    });
    sensorChart.data.labels = labels;
    sensorChart.data.datasets[0].data = temps;
    sensorChart.data.datasets[1].data = hums;
    sensorChart.update();
    logListElement.innerHTML = listHTML.join('');
    if (logs.length > 0) {
        latestTemp = logs[logs.length - 1].temperatura;
        latestHum = logs[logs.length - 1].humedad;
        actualizarTarjetasImpresoras();
    }
}

// 5. TARJETAS (Lógica Visual de Estado)
const staticPrinterRules = {
    'printer-1': { minT: 20, maxT: 22 },
    'printer-2': { minT: 23, maxT: 25 },
    'printer-3': { minT: 26, maxT: 29 },
    'printer-4': { minT: 29, maxT: 40 }
};
let customPrinterRules = {}; 

function actualizarTarjetasImpresoras() {
    document.querySelectorAll('.printer-card').forEach(card => {
        const toggle = card.querySelector('.printer-toggle');
        const tempEl = card.querySelector('.live-temp');
        const humEl = card.querySelector('.live-hum');
        const statusDot = card.querySelector('.status-dot');
        const statusText = card.querySelector('.status-text');
        const liveDataContainer = card.querySelector('.live-data');

        if (toggle && toggle.checked) {
            if (liveDataContainer) liveDataContainer.style.display = 'block';
            if (tempEl) tempEl.textContent = latestTemp.toFixed(1) + " °C";
            if (humEl) humEl.textContent = latestHum.toFixed(1) + " %";

            const cardId = card.id;
            let rules = staticPrinterRules[cardId] || customPrinterRules[cardId];

            let isWarning = false;
            if (rules) {
                if (latestTemp < rules.minT || latestTemp > rules.maxT) isWarning = true;
            }
            if (statusDot) statusDot.className = isWarning ? 'status-dot status-warning' : 'status-dot status-ok';
            if (statusText) statusText.textContent = isWarning ? 'Alerta' : 'Monitoreando';
        } else if (toggle) {
            if (liveDataContainer) liveDataContainer.style.display = 'none';
            if (statusDot) statusDot.className = 'status-dot status-offline';
            if (statusText) statusText.textContent = 'Desactivado';
        }
    });
}

document.body.addEventListener('change', (e) => {
    if (e.target.classList.contains('printer-toggle')) actualizarTarjetasImpresoras();
});

// 6. CARGAR IMPRESORAS (READ) + FILTRO DE ROL
async function cargarImpresorasGuardadas() {
    try {
        const res = await fetch('/api/impresoras');
        const impresoras = await res.json();
        const container = document.getElementById('firestore-printer-list');
        if(!container) return;
        container.innerHTML = ''; 

        impresoras.forEach(p => {
            customPrinterRules[p.id] = p.rules;
            const div = document.createElement('div');
            div.className = 'printer-card';
            div.id = p.id;
            const datosJson = JSON.stringify(p).replace(/"/g, '&quot;');

            // --- LOGICA PARA OCULTAR BOTONES SI NO ES ADMIN ---
            let botonesHTML = '';
            if (userRole === 'admin') {
                botonesHTML = `
                    <div class="card-actions">
                       <button class="btn-edit" data-printer="${datosJson}">✏️ Editar</button>
                       <button class="btn-delete" data-id="${p.id}">🗑️ Eliminar</button>
                    </div>
                `;
            }
            // --------------------------------------------------

            div.innerHTML = `
                <h3>${p.name}</h3>
                ${botonesHTML}
                <ul>
                    <li><strong>Tipo:</strong> ${p.type}</li>
                    <li><strong>Vol:</strong> ${p.volume}</li>
                    <li><strong>Regla Temp:</strong> ${p.rules.minT} - ${p.rules.maxT} °C</li>
                    <li><strong>Regla Hum:</strong> ${p.rules.minH} - ${p.rules.maxH} %</li>
                </ul>
                <div class="status-monitor">
                    <h4>Estado: 
                        <label class="toggle-switch">
                            <input type="checkbox" class="printer-toggle" data-doc-id="${p.id}">
                            <span class="slider"></span>
                        </label>
                    </h4>
                    <div class="status-dot status-offline"></div>
                    <span class="status-text">Desactivado</span>
                    <div class="live-data" style="display:none;">
                        <p>T: <strong class="live-temp">--</strong></p>
                        <p>H: <strong class="live-hum">--</strong></p>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
        
        // Solo agregamos listeners si los botones existen (si es admin)
        if (userRole === 'admin') {
            agregarListenersBotones();
        }

    } catch (e) { console.error("Error cargando impresoras", e); }
}

// 7. LISTENERS (SOLO ADMIN)
function agregarListenersBotones() {
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.closest('.btn-delete').dataset.id;
            if(confirm("¿Estás seguro de eliminar esta impresora?")) {
                try {
                    const res = await fetch(`/api/impresoras/${id}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (data.success) cargarImpresorasGuardadas();
                    else alert("Error al eliminar");
                } catch (err) { alert("Error de conexión"); }
            }
        });
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnElem = e.target.closest('.btn-edit');
            const printer = JSON.parse(btnElem.dataset.printer);
            abrirModalEditar(printer);
        });
    });
}

// 8. GESTIÓN DEL MODAL (SOLO ADMIN)
const modal = document.getElementById('add-printer-modal');
const showBtn = document.getElementById('show-add-modal-btn');
const closeBtn = document.getElementById('modal-close-btn');
const addForm = document.getElementById('add-printer-form');
const modalTitle = document.getElementById('modal-title');
const submitBtn = document.getElementById('modal-submit-btn');

if (showBtn) showBtn.addEventListener('click', () => {
    editingId = null;
    addForm.reset();
    modalTitle.textContent = "Añadir Nueva Impresora";
    submitBtn.textContent = "Añadir Impresora";
    modal.style.display = 'flex';
});

function abrirModalEditar(printer) {
    editingId = printer.id;
    modalTitle.textContent = "Editar Impresora";
    submitBtn.textContent = "Guardar Cambios";
    document.getElementById('new-printer-name').value = printer.name;
    document.getElementById('new-printer-type').value = printer.type;
    document.getElementById('new-printer-volume').value = printer.volume;
    if(printer.rules) {
        document.getElementById('new-min-temp').value = printer.rules.minT || '';
        document.getElementById('new-max-temp').value = printer.rules.maxT || '';
        document.getElementById('new-min-hum').value = printer.rules.minH || '';
        document.getElementById('new-max-hum').value = printer.rules.maxH || '';
    }
    modal.style.display = 'flex';
}

if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => { if (e.target == modal) modal.style.display = 'none'; });

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const data = e.target.dataset;
        document.getElementById('new-printer-name').value = data.name;
        document.getElementById('new-printer-type').value = data.type;
        document.getElementById('new-printer-volume').value = data.volume;
        if(data.type.includes("Resina")) {
             document.getElementById('new-min-temp').value = 20;
             document.getElementById('new-max-temp').value = 30;
        } else {
             document.getElementById('new-min-temp').value = 15;
             document.getElementById('new-max-temp').value = 40;
        }
    });
});

// 9. ENVÍO FORMULARIO (SOLO ADMIN)
if (addForm) {
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('new-printer-name').value,
            type: document.getElementById('new-printer-type').value,
            volume: document.getElementById('new-printer-volume').value,
            rules: {
                minT: document.getElementById('new-min-temp').value,
                maxT: document.getElementById('new-max-temp').value,
                minH: document.getElementById('new-min-hum').value,
                maxH: document.getElementById('new-max-hum').value
            }
        };
        try {
            let url = '/api/impresoras';
            let method = 'POST';
            if (editingId) { url = `/api/impresoras/${editingId}`; method = 'PUT'; }

            const res = await fetch(url, {
                method, headers: {'Content-Type':'application/json'},
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if(result.success) {
                alert(editingId ? "¡Actualizado!" : "¡Guardado!");
                modal.style.display = 'none';
                addForm.reset();
                cargarImpresorasGuardadas(); 
            } else { alert("Error servidor: " + result.error); }
        } catch (e) { alert("Error conexión"); }
    });
}

// 10. SOCKET.IO & INICIO
const socket = io();
socket.on('sensor_update', data => {
    if (!data) return;
    latestTemp = data.temperatura;
    latestHum = data.humedad;
    const timeStr = new Date().toLocaleTimeString('es-ES');
    sensorChart.data.labels.push(timeStr);
    sensorChart.data.datasets[0].data.push(latestTemp);
    sensorChart.data.datasets[1].data.push(latestHum);
    if(sensorChart.data.labels.length > 15) {
        sensorChart.data.labels.shift();
        sensorChart.data.datasets[0].data.shift();
        sensorChart.data.datasets[1].data.shift();
    }
    sensorChart.update();
    const newLog = document.createElement('li');
    newLog.textContent = `[${timeStr}] T: ${latestTemp}°C | H: ${latestHum}%`;
    logListElement.prepend(newLog);
    actualizarTarjetasImpresoras();
});

(async () => {
    try {
        const response = await fetch('/api/sensores');
        const rawData = await response.json();
        if(rawData) {
            const logsArray = Object.values(rawData).sort((a,b)=>a.timestamp-b.timestamp);
            actualizarInterfaz(logsArray);
        }
    } catch(e){ console.error(e); }
    cargarImpresorasGuardadas();
})();