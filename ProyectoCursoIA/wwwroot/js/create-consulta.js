document.addEventListener("DOMContentLoaded", async () => {
    const user = requireUser();
    if (!user) {
        return;
    }

    const form = document.getElementById("consultaForm");
    const feedback = document.getElementById("consultaFeedback");
    const medicoSelect = document.getElementById("medicoSelect");
    const pacienteSelect = document.getElementById("pacienteSelect");
    const logoutButton = document.getElementById("logoutButton");

    logoutButton?.addEventListener("click", () => logout());

    async function cargarOpciones() {
        try {
            const [medicos, pacientes] = await Promise.all([
                fetchJson(`${API_BASE}/medicos?soloActivos=true`),
                fetchJson(`${API_BASE}/pacientes?soloActivos=true`)
            ]);

            medicoSelect.innerHTML = medicos
                .map((medico) => `<option value="${medico.id}">${medico.nombreCompleto}</option>`)
                .join("");

            pacienteSelect.innerHTML = pacientes
                .map((paciente) => `<option value="${paciente.id}">${paciente.nombreCompleto}</option>`)
                .join("");

            if (!medicos.length || !pacientes.length) {
                feedback.textContent = "Es necesario contar con médicos y pacientes activos para registrar una consulta.";
                feedback.className = "alert alert--error";
            }
        } catch (error) {
            feedback.textContent = error.message;
            feedback.className = "alert alert--error";
        }
    }

    await cargarOpciones();

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        feedback.textContent = "";
        feedback.className = "";

        if (!medicoSelect.value || !pacienteSelect.value) {
            feedback.textContent = "Selecciona un médico y un paciente.";
            feedback.className = "alert alert--error";
            return;
        }

        const payload = {
            idMedico: Number(medicoSelect.value),
            idPaciente: Number(pacienteSelect.value),
            sintomas: form.sintomas.value.trim(),
            recomendaciones: form.recomendaciones.value.trim(),
            diagnostico: form.diagnostico.value.trim()
        };

        if (!payload.sintomas) {
            feedback.textContent = "Captura los síntomas de la consulta.";
            feedback.className = "alert alert--error";
            return;
        }

        try {
            await fetchJson(`${API_BASE}/consultas`, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            feedback.textContent = "La consulta se registró correctamente.";
            feedback.className = "alert alert--success";
            form.reset();
        } catch (error) {
            feedback.textContent = error.message;
            feedback.className = "alert alert--error";
        }
    });
});
