// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const axios = require('axios');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 3000;

// *****************************************************************************
//                    CONFIGURAR FIREBASE ADMIN
// *****************************************************************************
const API_KEY = process.env.FIREBASE_API_KEY;
if (!API_KEY) console.error("ERROR: Falta FIREBASE_API_KEY en variables de entorno");

try {
    let serviceAccount;
    // Soporte para Render (variable de entorno) o Local (archivo)
    if (process.env.SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT);
    } else {
        serviceAccount = require('./serviceAccountKey.json');
    }

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
//                          SOCKET.IO (REALTIME)
// *****************************************************************************
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const latestRef = db.ref("sensores/dht11/latest");
latestRef.on("value", snap => {
    io.emit("sensor_update", snap.val());
});

// *****************************************************************************
//                              RUTAS API
// *****************************************************************************
app.use(express.json());
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

// ---------------------- LOGIN (Consulta Rol en Firestore) ----------------------
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Verificar credenciales con Google Auth
        const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
        const response = await axios.post(url, {
            email, password, returnSecureToken: true
        });

        const userEmail = response.data.email;
        
        // 2. Consultar el ROL en Firestore (Colección 'usuarios')
        // Buscamos el documento que tenga el ID igual al correo
        const userDoc = await firestore.collection('usuarios').doc(userEmail).get();
        
        let role = 'operador'; // Rol por defecto si no existe en BD
        
        if (userDoc.exists) {
            role = userDoc.data().rol; // Obtenemos el campo 'rol'
        } else {
            // Si el usuario existe en Auth pero no en Firestore (casos raros),
            // lo creamos ahora mismo como operador para arreglarlo.
            await firestore.collection('usuarios').doc(userEmail).set({
                rol: 'operador',
                creadoEn: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        console.log(`Login: ${userEmail} | Rol desde BD: ${role}`);
        
        res.json({ success: true, email: userEmail, role: role });

    } catch (error) {
        console.error("Login error:", error.response ? error.response.data : error.message);
        res.status(401).json({ success: false, error: "Credenciales inválidas" });
    }
});

// ---------------------- REGISTRO (Guarda usuario en Firestore) ----------------------
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        // 1. Crear usuario en Authentication
        await admin.auth().createUser({ email, password });

        // 2. Crear documento en Firestore con rol por defecto 'operador'
        await firestore.collection('usuarios').doc(email).set({
            email: email,
            rol: 'operador', // <--- AQUÍ SE DEFINE EL ROL INICIAL
            creadoEn: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Usuario registrado y guardado en DB: ${email}`);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ---------------------- CREATE (Impresora) ----------------------
app.post('/api/impresoras', async (req, res) => {
    try {
        const docRef = await firestore.collection('impresoras_custom').add({
            ...req.body,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await firestore.collection('impresoras_estado').doc(docRef.id).set({
            isActive: false, statusText: "Desactivada"
        });
        res.json({ success: true, id: docRef.id });
    } catch (error) {
        res.status(500).json({ success: false, error: "Error al guardar" });
    }
});

// ---------------------- READ (Impresoras) ----------------------
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

// ---------------------- UPDATE (Impresora) ----------------------
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

// ---------------------- DELETE (Impresora) ----------------------
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

// ---------------------- SENSORES ----------------------
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

server.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto: ${PORT}`);
});