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
                // 💾 GUARDAMOS EL ROL QUE VIENE DE LA BASE DE DATOS
                localStorage.setItem('usuario_prisn3d', data.email);
                localStorage.setItem('rol_prisn3d', data.role); // 'admin' u 'operador'
                
                window.location.href = "/frontend/home.html";
            } else {
                alert("Error: " + (data.error || "Datos incorrectos"));
                btn.textContent = originalText;
                btn.disabled = false;
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión con el servidor.");
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}

// --- REGISTRO ---
if (formRegister) {
    formRegister.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = formRegister.querySelector('input[placeholder="Correo Electrónico"]').value;
        const password = formRegister.querySelector('input[placeholder="Contraseña"]').value;
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
                alert("Registro exitoso. Tu cuenta se creó como 'Operador'. Inicia sesión.");
                location.reload(); 
            } else {
                alert("Error: " + (data.error || "Intenta de nuevo"));
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