// script.js

// Ejecutar al cargar y al redimensionar
window.addEventListener("resize", anchoPagina);
window.addEventListener("load", anchoPagina);

// Variables
var contenedor_login_register = document.querySelector(".contenedor__login-register");
var formulario_login = document.querySelector(".formulario__login");
var formulario_register = document.querySelector(".formulario__register");
var caja_trasera_login = document.querySelector(".caja__trasera-login");
var caja_trasera_register = document.querySelector(".caja__trasera-register");

// Eventos Click
document.getElementById("btn_iniciar-sesion").addEventListener("click", iniciarSesion);
document.getElementById("btn_registrarse").addEventListener("click", register);

function anchoPagina() {
    if (window.innerWidth > 850) {
        // Escritorio: Todo visible, posición inicial
        caja_trasera_login.style.display = "block";
        caja_trasera_register.style.display = "block";
    } else {
        // Móvil: Preparamos el estado inicial
        caja_trasera_register.style.display = "block";
        caja_trasera_register.style.opacity = "1";
        caja_trasera_login.style.display = "none"; // Ocultamos uno para ahorrar espacio
        formulario_login.style.display = "block";
        formulario_register.style.display = "none";
        contenedor_login_register.style.left = "0px";
    }
}

function iniciarSesion() {
    if (window.innerWidth > 850) {
        // Lógica Escritorio
        formulario_register.style.display = "none";
        contenedor_login_register.style.left = "10px";
        formulario_login.style.display = "block";
        caja_trasera_register.style.opacity = "1";
        caja_trasera_login.style.opacity = "0";
    } else {
        // Lógica Móvil
        formulario_register.style.display = "none";
        contenedor_login_register.style.left = "0px";
        formulario_login.style.display = "block";
        caja_trasera_register.style.display = "block"; // Mostramos la opción de registrarse
        caja_trasera_login.style.display = "none";     // Ocultamos la opción de login (porque ya estamos ahí)
    }
}

function register() {
    if (window.innerWidth > 850) {
        // Lógica Escritorio
        formulario_register.style.display = "block";
        contenedor_login_register.style.left = "410px";
        formulario_login.style.display = "none";
        caja_trasera_register.style.opacity = "0";
        caja_trasera_login.style.opacity = "1";
    } else {
        // Lógica Móvil
        formulario_register.style.display = "block";
        contenedor_login_register.style.left = "0px";
        formulario_login.style.display = "none";
        caja_trasera_register.style.display = "none";  // Ocultamos la opción de registrarse
        caja_trasera_login.style.display = "block";    // Mostramos la opción de login
        caja_trasera_login.style.opacity = "1";
    }
}