// frontend/js/auth.js

const formLogin = document.querySelector(".formulario__login");
const formRegister = document.querySelector(".formulario__register");

// --- LOGIN ---
if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = formLogin.querySelector('input[placeholder="Correo Electrónico"]').value;
        const password = formLogin.querySelector('input[placeholder="Contraseña"]').value;
        const btn = formLogin.querySelector('button');
        const originalText = btn.textContent;

        try {
            btn.textContent = "Verificando...";
            btn.disabled = true;

            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('usuario_prisn3d', data.email);
                window.location.href = "/frontend/home.html";
            } else {
                alert("Error: " + (data.error || "Datos incorrectos"));
                btn.textContent = originalText;
                btn.disabled = false;
            }
        } catch (error) {
            alert("Error de conexión con el servidor.");
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}

// --- REGISTRO (ACTIVADO) ---
if (formRegister) {
    formRegister.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = formRegister.querySelector('input[placeholder="Correo Electrónico"]').value;
        const password = formRegister.querySelector('input[placeholder="Contraseña"]').value; // Asegúrate que el HTML tenga este input si pides nombre, etc.
        const btn = formRegister.querySelector('button');
        const originalText = btn.textContent;

        try {
            btn.textContent = "Registrando...";
            btn.disabled = true;

            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                alert("¡Registro exitoso! Ahora inicia sesión.");
                // Opcional: recargar o mover al login form visualmente
                location.reload(); 
            } else {
                alert("Error al registrar: " + (data.error || "Intenta de nuevo"));
                btn.textContent = originalText;
                btn.disabled = false;
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión.");
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}