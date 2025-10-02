document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const feedback = document.getElementById("loginFeedback");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        feedback.textContent = "";
        feedback.className = "";

        const correo = form.correo.value.trim();
        const password = form.password.value.trim();

        if (!correo || !password) {
            feedback.textContent = "Ingresa tu correo y contraseña.";
            feedback.className = "alert alert--error";
            return;
        }

        try {
            const data = await fetchJson(`${API_BASE}/login`, {
                method: "POST",
                body: JSON.stringify({ correo, password })
            });

            saveUser(data);
            window.location.href = "dashboard.html";
        } catch (error) {
            feedback.textContent = error.message;
            feedback.className = "alert alert--error";
        }
    });
});
