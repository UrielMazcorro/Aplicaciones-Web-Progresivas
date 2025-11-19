// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const axios = require('axios');
const app = express();

const PORT = 3000;

// 1. CLAVE API PARA LOGIN (Desde .env)
const API_KEY = process.env.FIREBASE_API_KEY;
if (!API_KEY) console.error("ERROR: Falta FIREBASE_API_KEY en .env");

// 2. CONFIGURAR FIREBASE ADMIN
try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://prisn3d-int-default-rtdb.firebaseio.com"
    });
    console.log("Firebase Admin conectado.");
} catch (error) {
    console.error("ERROR: Falta 'serviceAccountKey.json'");
}

const db = admin.database(); // Realtime Database
const firestore = admin.firestore(); // Firestore

app.use(express.json());
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

// --- RUTA: LOGIN ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
        const response = await axios.post(url, {
            email, password, returnSecureToken: true
        });
        console.log(`Login exitoso: ${email}`);
        res.json({ success: true, email: response.data.email });
    } catch (error) {
        res.status(401).json({ success: false, error: "Credenciales inválidas" });
    }
});

// --- RUTA: REGISTRO DE USUARIOS ---
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password
        });
        console.log(`Usuario creado: ${email}`);
        res.json({ success: true });
    } catch (error) {
        console.error("Error registro:", error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// --- RUTA: GUARDAR IMPRESORA (CREATE) ---
app.post('/api/impresoras', async (req, res) => {
    try {
        const docRef = await firestore.collection('impresoras_custom').add({
            ...req.body,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Crear estado inicial en la colección paralela
        await firestore.collection('impresoras_estado').doc(docRef.id).set({
            isActive: false, statusText: "Desactivada"
        });
        res.json({ success: true, id: docRef.id });
    } catch (error) {
        res.status(500).json({ success: false, error: "Error al guardar" });
    }
});

// --- RUTA: OBTENER IMPRESORAS (READ) ---
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

// --- RUTA: EDITAR IMPRESORA (UPDATE) --- 
// (Esta faltaba en tu código anterior)
app.put('/api/impresoras/:id', async (req, res) => {
    const { id } = req.params;
    const datos = req.body;
    try {
        await firestore.collection('impresoras_custom').doc(id).update({
            ...datos,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Impresora actualizada: ${id}`);
        res.json({ success: true });
    } catch (error) {
        console.error("Error al editar:", error);
        res.status(500).json({ success: false, error: "Error al actualizar" });
    }
});

// --- RUTA: ELIMINAR IMPRESORA (DELETE) --- 
// (Esta también faltaba)
app.delete('/api/impresoras/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Borramos la info de la impresora
        await firestore.collection('impresoras_custom').doc(id).delete();
        // Borramos su estado de monitoreo (limpieza)
        await firestore.collection('impresoras_estado').doc(id).delete();
        
        console.log(`Impresora eliminada: ${id}`);
        res.json({ success: true });
    } catch (error) {
        console.error("Error al eliminar:", error);
        res.status(500).json({ success: false, error: "Error al eliminar" });
    }
});

// --- RUTA: SENSORES ---
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

app.listen(PORT, () => {
    console.log(`------------------------------------------------`);
    console.log(`Servidor Proxy Full corriendo en: http://localhost:${PORT}`);
    console.log(`   - CRUD de Impresoras: ACTIVO`);
    console.log(`   - Registro y Login: ACTIVO`);
    console.log(`------------------------------------------------`);
});