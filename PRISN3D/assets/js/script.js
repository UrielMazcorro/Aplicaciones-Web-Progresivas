window.onload = function() {
    // Agregar eventos a los botones
    document.getElementById("btn_iniciar-sesion").addEventListener("click", iniciarSesion);
    document.getElementById("btn_registrarse").addEventListener("click", register);
    window.addEventListener("resize", anchoPagina);

    // Declaración de variables
    var contenedor_login_register = document.querySelector(".contenedor__login-register");
    var formulario_login = document.querySelector(".formulario__login");
    var formulario_register = document.querySelector(".formulario__register");
    var caja_trasera_login = document.querySelector(".caja__trasera-login");
    var caja_trasera_register = document.querySelector(".caja__trasera-register");

    // Configuración inicial en función del ancho de la página
    anchoPagina();

    function anchoPagina() {
        if (window.innerWidth > 850) {
            caja_trasera_login.style.display = "block";
            caja_trasera_register.style.display = "block";
        } else {
            caja_trasera_register.style.display = "block";
            caja_trasera_register.style.opacity = "1";
            caja_trasera_login.style.display = "block";
            contenedor_login_register.style.left = "0";
        }
    }

    function iniciarSesion() {
        if (window.innerWidth > 850) {
            formulario_register.style.display = "none";
            contenedor_login_register.style.left = "10px";
            formulario_login.style.display = "block";
            caja_trasera_register.style.opacity = "1";
            caja_trasera_login.style.opacity = "0";
        } else {
            formulario_register.style.display = "none";
            contenedor_login_register.style.left = "0px";
            formulario_login.style.display = "block";
            caja_trasera_register.style.opacity = "1";
            caja_trasera_login.style.opacity = "0";
        }
    }

    function register() {
        if (window.innerWidth > 850) {
            formulario_register.style.display = "block";
            contenedor_login_register.style.left = "410px";
            formulario_login.style.display = "none";
            caja_trasera_register.style.opacity = "0";
            caja_trasera_login.style.opacity = "1";
        } else {
            formulario_register.style.display = "block";
            contenedor_login_register.style.left = "0px";
            formulario_login.style.display = "none";
            caja_trasera_register.style.opacity = "0";
            caja_trasera_login.style.opacity = "1";
        }
    }
};