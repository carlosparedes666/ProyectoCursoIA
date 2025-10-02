document.addEventListener("DOMContentLoaded", async () => {
    const user = requireUser();
    if (!user) {
        return;
    }

    const greeting = document.getElementById("greeting");
    const consultasContainer = document.getElementById("consultasContainer");
    const logoutButton = document.getElementById("logoutButton");

    greeting.textContent = `Hola, ${user.nombreCompleto}`;

    logoutButton?.addEventListener("click", () => {
        logout();
    });

    consultasContainer.innerHTML = "<p class=\"loading\">Cargando consultas recientes...</p>";

    try {
        const consultas = await fetchJson(`${API_BASE}/consultas?top=10`);

        if (!consultas.length) {
            consultasContainer.innerHTML = "<p class=\"empty-state\">Aún no se han registrado consultas.</p>";
            return;
        }

        const table = document.createElement("table");
        table.className = "table";
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Médico</th>
                    <th>Paciente</th>
                    <th>Síntomas</th>
                    <th>Diagnóstico</th>
                </tr>
            </thead>
            <tbody>
                ${consultas.map((consulta) => `
                    <tr>
                        <td>#${consulta.id}</td>
                        <td>${consulta.medicoNombre}</td>
                        <td>${consulta.pacienteNombre}</td>
                        <td>${consulta.sintomas}</td>
                        <td>${consulta.diagnostico || "-"}</td>
                    </tr>
                `).join("")}
            </tbody>
        `;

        consultasContainer.innerHTML = "";
        consultasContainer.appendChild(table);
    } catch (error) {
        consultasContainer.innerHTML = `<p class="alert alert--error">${error.message}</p>`;
    }
});
