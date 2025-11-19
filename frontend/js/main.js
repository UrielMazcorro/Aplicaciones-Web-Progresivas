// frontend/js/main.js

// --- GESTIÓN DE SESIÓN LOCAL ---
// Ya no importamos Firebase aquí para máxima seguridad.

// 1. Verificar si el usuario tiene permiso para ver la página
export function checkSession() {
    const usuario = localStorage.getItem('usuario_prisn3d');
    const path = window.location.pathname;

    // Si NO hay usuario guardado y NO estamos en el login o landing page
    // Lo redirigimos al inicio de sesión
    if (!usuario && !path.includes('index.html') && !path.includes('quienes-somos.html')) {
        window.location.href = '/frontend/index.html';
    }
}

// 2. Cerrar Sesión
export function logout() {
    // Borramos la credencial del navegador
    localStorage.removeItem('usuario_prisn3d');
    alert("Has cerrado sesión.");
    window.location.href = '/frontend/quienes-somos.html';
}