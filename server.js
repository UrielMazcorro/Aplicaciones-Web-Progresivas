// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const axios = require('axios');
const http = require('http');                             // <-- NUEVO
const { Server } = require("socket.io");                  // <-- NUEVO

const app = express();
const PORT = process.env.PORT || 3000;

// *****************************************************************************
//                    CONFIGURAR FIREBASE ADMIN (BACKEND)
// *****************************************************************************
const API_KEY = process.env.FIREBASE_API_KEY;
if (!API_KEY) console.error("ERROR: Falta FIREBASE_API_KEY en variables de entorno");

try {
    if (!process.env.SERVICE_ACCOUNT) {
        throw new Error("Falta SERVICE_ACCOUNT en variables de entorno");
    }

    const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://prisn3d-int-default-rtdb.firebaseio.com"
    });

    console.log("Firebase Admin conectado.");
} catch (error) {
    console.error("ERROR al inicializar Firebase Admin:", error.message);
}

const db = admin.database();
const firestore = admin.firestore();

// *****************************************************************************
//                           SOCKET.IO CONFIG (REALTIME)
// *****************************************************************************
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Escuchar cambios en Firebase en TIEMPO REAL
const latestRef = db.ref("sensores/dht11/latest");

latestRef.on("value", snap => {
    const data = snap.val();
    io.emit("sensor_update", data);
});

// *****************************************************************************
//                               EXPRESS
// *****************************************************************************
app.use(express.json());
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

// ---------------------- LOGIN ----------------------
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
        const response = await axios.post(url, {
            email, password, returnSecureToken: true
        });
        res.json({ success: true, email: response.data.email });
    } catch (error) {
        res.status(401).json({ success: false, error: "Credenciales inválidas" });
    }
});

// ---------------------- REGISTRO ----------------------
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        await admin.auth().createUser({ email, password });
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ---------------------- CREATE ----------------------
app.post('/api/impresoras', async (req, res) => {
    try {
        const docRef = await firestore.collection('impresoras_custom').add({
            ...req.body,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await firestore.collection('impresoras_estado').doc(docRef.id).set({
            isActive: false,
            statusText: "Desactivada"
        });

        res.json({ success: true, id: docRef.id });
    } catch (error) {
        res.status(500).json({ success: false, error: "Error al guardar" });
    }
});

// ---------------------- READ ----------------------
app.get('/api/impresoras', async (req, res) => {
    try {
        const snapshot = await firestore.collection('impresoras_custom').get();
        const lista = [];
        snapshot.forEach(doc => lista.push({ id: doc.id, ...doc.data() }));
        res.json(lista);
    } catch (error) {
        res.status(500).json({ error: "Error leyendo impresoras" });
    }
});

// ---------------------- UPDATE ----------------------
app.put('/api/impresoras/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await firestore.collection('impresoras_custom').doc(id).update({
            ...req.body,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: "Error al actualizar" });
    }
});

// ---------------------- DELETE ----------------------
app.delete('/api/impresoras/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await firestore.collection('impresoras_custom').doc(id).delete();
        await firestore.collection('impresoras_estado').doc(id).delete();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: "Error al eliminar" });
    }
});

// ---------------------- SENSORES (logs últimos 15) ----------------------
app.get('/api/sensores', async (req, res) => {
    try {
        const ref = db.ref('sensores/dht11/logs').limitToLast(15);
        ref.once('value', (snap) => {
            res.json(snap.val() || {});
        });
    } catch (error) {
        res.status(500).json({ error: "Error DB" });
    }
});

app.get('/', (req, res) => res.redirect('/frontend/quienes-somos.html'));

// *****************************************************************************
//                  INICIAR SERVIDOR HTTP + WEBSOCKETS
// *****************************************************************************
server.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto: ${PORT}`);
});