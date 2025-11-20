// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

// 1. CLAVE API PARA LOGIN (Desde Render ENV)
const API_KEY = process.env.FIREBASE_API_KEY;
if (!API_KEY) console.error("ERROR: Falta FIREBASE_API_KEY en variables de entorno");

// 2. CONFIGURAR FIREBASE ADMIN (SIN ARCHIVO)
try {
    if (!process.env.SERVICE_ACCOUNT) {
        throw new Error("Falta SERVICE_ACCOUNT en variables de entorno");
    }

    // Parseamos la variable con el JSON real
    const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://prisn3d-int-default-rtdb.firebaseio.com"
    });

    console.log("Firebase Admin conectado usando Render ENV.");
} catch (error) {
    console.error("ERROR al inicializar Firebase Admin:", error.message);
}

const db = admin.database();
const firestore = admin.firestore();

app.use(express.json());
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

// --- LOGIN ---
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

// --- REGISTRO ---
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        await admin.auth().createUser({ email, password });
        console.log(`Usuario creado: ${email}`);
        res.json({ success: true });
    } catch (error) {
        console.error("Error registro:", error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// --- CREATE ---
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

// --- READ ---
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

// --- UPDATE ---
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

// --- DELETE ---
app.delete('/api/impresoras/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await firestore.collection('impresoras_custom').doc(id).delete();
        await firestore.collection('impresoras_estado').doc(id).delete();

        console.log(`Impresora eliminada: ${id}`);
        res.json({ success: true });
    } catch (error) {
        console.error("Error al eliminar:", error);
        res.status(500).json({ success: false, error: "Error al eliminar" });
    }
});

// --- SENSORES ---
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
    console.log(`Servidor corriendo en puerto: ${PORT}`);
    console.log(`------------------------------------------------`);
});
