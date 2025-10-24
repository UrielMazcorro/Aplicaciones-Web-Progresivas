// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// Configuración de Firebase 
const firebaseConfig = {
  apiKey: "AIzaSyCqH2BkDUDpHETxVpXF-vONY87Gbpvtm2w",
  authDomain: "prisn3d-int.firebaseapp.com",
  projectId: "prisn3d-int",
  storageBucket: "prisn3d-int.firebasestorage.app",
  messagingSenderId: "427727349767",
  appId: "1:427727349767:web:6a7818c6b385703001e2a2"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Formularios
const formLogin = document.querySelector(".formulario__login");
const formRegister = document.querySelector(".formulario__register");

// Registro
formRegister.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = formRegister.querySelector('input[placeholder="Correo Electrónico"]').value;
  const password = formRegister.querySelector('input[placeholder="Contraseña"]').value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Registro exitoso. Ahora puedes iniciar sesión.");
  } catch (error) {
    alert("Error en el registro: " + error.message);
  }
});

// Inicio de sesión
formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = formLogin.querySelector('input[placeholder="Correo Electrónico"]').value;
  const password = formLogin.querySelector('input[placeholder="Contraseña"]').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // Redirigir a home.html
    window.location.href = "home.html";
  } catch (error) {
    alert("Error al iniciar sesión: " + error.message);
  }
});

// Verifica si hay usuario autenticado
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Usuario autenticado:", user.email);
  } else {
    console.log("No hay usuario autenticado");
  }
});
