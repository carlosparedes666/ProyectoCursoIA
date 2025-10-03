document.addEventListener("DOMContentLoaded", async () => {
    const user = requireUser();
    if (!user) {
        return;
    }

    const logoutButton = document.getElementById("logoutButton");
    logoutButton?.addEventListener("click", () => logout());

    const form = document.getElementById("consultaForm");
    const formTitle = document.getElementById("consultaFormTitle");
    const formFeedback = document.getElementById("consultaFormFeedback");

    const medicoSelect = document.getElementById("consultaMedico");
    const pacienteSelect = document.getElementById("consultaPaciente");
    const sintomasInput = document.getElementById("consultaSintomas");
    const recomendacionesInput = document.getElementById("consultaRecomendaciones");
    const diagnosticoInput = document.getElementById("consultaDiagnostico");

    const submitButton = document.getElementById("consultaSubmitButton");
    const cancelButton = document.getElementById("consultaCancelButton");
    const reloadButton = document.getElementById("consultasReloadButton");
    const listFeedback = document.getElementById("consultasListFeedback");
    const tableBody = document.getElementById("consultasTableBody");

    let consultas = [];
    let medicos = [];
    let pacientes = [];
    let editingId = null;

    function showFeedback(element, message = "", tone) {
        if (!element) {
            return;
        }

        element.textContent = message;

        if (!message) {
            element.className = "";
            return;
        }

        switch (tone) {
            case "error":
                element.className = "alert alert--error";
                break;
            case "success":
                element.className = "alert alert--success";
                break;
            case "loading":
                element.className = "loading";
                break;
            case "muted":
                element.className = "text-subtle";
                break;
            default:
                element.className = "alert";
                break;
        }
    }

    function buildDisplayName(persona) {
        return persona.nombreCompleto || buildNombreCompleto(persona) || `#${persona.id}`;
    }

    function renderMedicosSelect(selectedId) {
        const selectedValue = selectedId ? String(selectedId) : "";
        const options = [
            "<option value=\"\">Selecciona un médico</option>",
            ...[...medicos]
                .sort((a, b) => buildDisplayName(a).localeCompare(buildDisplayName(b), "es"))
                .map((medico) => `<option value="${medico.id}">${buildDisplayName(medico)}</option>`)
        ];

        medicoSelect.innerHTML = options.join("");

        if (selectedValue) {
            medicoSelect.value = selectedValue;
            if (medicoSelect.value !== selectedValue) {
                const fallbackOption = document.createElement("option");
                fallbackOption.value = selectedValue;
                fallbackOption.textContent = `#${selectedValue}`;
                medicoSelect.appendChild(fallbackOption);
                medicoSelect.value = selectedValue;
            }
        }
    }

    function renderPacientesSelect(selectedId) {
        const selectedValue = selectedId ? String(selectedId) : "";
        const options = [
            "<option value=\"\">Selecciona un paciente</option>",
            ...[...pacientes]
                .sort((a, b) => buildDisplayName(a).localeCompare(buildDisplayName(b), "es"))
                .map((paciente) => `<option value="${paciente.id}">${buildDisplayName(paciente)}</option>`)
        ];

        pacienteSelect.innerHTML = options.join("");

        if (selectedValue) {
            pacienteSelect.value = selectedValue;
            if (pacienteSelect.value !== selectedValue) {
                const fallbackOption = document.createElement("option");
                fallbackOption.value = selectedValue;
                fallbackOption.textContent = `#${selectedValue}`;
                pacienteSelect.appendChild(fallbackOption);
                pacienteSelect.value = selectedValue;
            }
        }
    }

    function renderConsultas() {
        if (!consultas.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">No hay consultas registradas.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = consultas
            .map((consulta) => `
                <tr>
                    <td>#${consulta.id}</td>
                    <td>${consulta.medicoNombre}</td>
                    <td>${consulta.pacienteNombre}</td>
                    <td>${consulta.sintomas}</td>
                    <td>${consulta.diagnostico || "-"}</td>
                    <td>
                        <div class="table-actions">
                            <button type="button" class="button button--sm" data-action="edit" data-id="${consulta.id}">Editar</button>
                            <button type="button" class="button button--sm button--danger" data-action="delete" data-id="${consulta.id}">Eliminar</button>
                        </div>
                    </td>
                </tr>
            `)
            .join("");
    }

    function resetForm(options = {}) {
        editingId = null;
        form.reset();
        renderMedicosSelect();
        renderPacientesSelect();
        formTitle.textContent = "Registrar consulta";
        submitButton.textContent = "Registrar consulta";
        cancelButton.hidden = true;

        if (!options.keepFeedback) {
            showFeedback(formFeedback);
        }
    }

    function startEditing(consulta) {
        editingId = consulta.id;
        formTitle.textContent = `Editar consulta #${consulta.id}`;
        submitButton.textContent = "Guardar cambios";
        cancelButton.hidden = false;

        if (!medicos.some((medico) => medico.id === consulta.idMedico)) {
            medicos.push({ id: consulta.idMedico, nombreCompleto: consulta.medicoNombre });
        }
        if (!pacientes.some((paciente) => paciente.id === consulta.idPaciente)) {
            pacientes.push({ id: consulta.idPaciente, nombreCompleto: consulta.pacienteNombre });
        }

        renderMedicosSelect(consulta.idMedico);
        renderPacientesSelect(consulta.idPaciente);

        sintomasInput.value = consulta.sintomas || "";
        recomendacionesInput.value = consulta.recomendaciones || "";
        diagnosticoInput.value = consulta.diagnostico || "";

        showFeedback(formFeedback, "Modificando consulta seleccionada.", "muted");
        form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function loadCatalogos() {
        try {
            const [medicosData, pacientesData] = await Promise.all([
                fetchJson(`${API_BASE}/medicos`),
                fetchJson(`${API_BASE}/pacientes`)
            ]);

            medicos = Array.isArray(medicosData) ? medicosData : [];
            pacientes = Array.isArray(pacientesData) ? pacientesData : [];

            renderMedicosSelect(Number(medicoSelect.value) || undefined);
            renderPacientesSelect(Number(pacienteSelect.value) || undefined);
            if (!editingId) {
                showFeedback(formFeedback);
            }
        } catch (error) {
            medicos = [];
            pacientes = [];
            renderMedicosSelect();
            renderPacientesSelect();
            showFeedback(formFeedback, error.message, "error");
        }
    }

    async function loadConsultas() {
        showFeedback(listFeedback, "Cargando consultas...", "loading");

        try {
            consultas = await fetchJson(`${API_BASE}/consultas`);
            renderConsultas();
            showFeedback(listFeedback);
        } catch (error) {
            consultas = [];
            tableBody.innerHTML = "";
            showFeedback(listFeedback, error.message, "error");
        }
    }

    tableBody.addEventListener("click", async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const action = target.dataset.action;
        const id = Number(target.dataset.id);

        if (!action || Number.isNaN(id)) {
            return;
        }

        const consulta = consultas.find((item) => item.id === id);
        if (!consulta) {
            return;
        }

        if (action === "edit") {
            startEditing(consulta);
            return;
        }

        if (action === "delete") {
            const confirmed = window.confirm("¿Deseas eliminar esta consulta?");
            if (!confirmed) {
                return;
            }

            try {
                await fetchJson(`${API_BASE}/consultas/${id}`, { method: "DELETE" });
                await loadConsultas();
                if (editingId === id) {
                    resetForm();
                }
                showFeedback(listFeedback, "La consulta se eliminó correctamente.", "success");
            } catch (error) {
                showFeedback(listFeedback, error.message, "error");
            }
        }
    });

    cancelButton.addEventListener("click", () => {
        resetForm();
    });

    reloadButton.addEventListener("click", () => {
        loadConsultas();
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        showFeedback(formFeedback);

        const medicoId = Number(medicoSelect.value);
        const pacienteId = Number(pacienteSelect.value);
        const sintomas = sintomasInput.value.trim();
        const recomendaciones = recomendacionesInput.value.trim();
        const diagnostico = diagnosticoInput.value.trim();

        if (!medicoId || !pacienteId) {
            showFeedback(formFeedback, "Selecciona un médico y un paciente.", "error");
            return;
        }

        if (!sintomas) {
            showFeedback(formFeedback, "Captura los síntomas de la consulta.", "error");
            return;
        }

        const payload = {
            idMedico: medicoId,
            idPaciente: pacienteId,
            sintomas,
            recomendaciones: recomendaciones || null,
            diagnostico: diagnostico || null
        };

        try {
            if (editingId) {
                await fetchJson(`${API_BASE}/consultas/${editingId}`, {
                    method: "PUT",
                    body: JSON.stringify(payload)
                });
                showFeedback(formFeedback, "La consulta se actualizó correctamente.", "success");
            } else {
                await fetchJson(`${API_BASE}/consultas`, {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
                showFeedback(formFeedback, "La consulta se registró correctamente.", "success");
            }

            await loadConsultas();
            resetForm({ keepFeedback: true });
        } catch (error) {
            showFeedback(formFeedback, error.message, "error");
        }
    });

    await loadCatalogos();
    await loadConsultas();
    resetForm({ keepFeedback: true });
});
