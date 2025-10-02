document.addEventListener("DOMContentLoaded", async () => {
    const user = requireUser();
    if (!user) {
        return;
    }

    const logoutButton = document.getElementById("logoutButton");
    logoutButton?.addEventListener("click", () => logout());

    const form = document.getElementById("pacienteForm");
    const formTitle = document.getElementById("pacienteFormTitle");
    const formFeedback = document.getElementById("pacienteFormFeedback");

    const primerNombreInput = document.getElementById("pacientePrimerNombre");
    const segundoNombreInput = document.getElementById("pacienteSegundoNombre");
    const apellidoPaternoInput = document.getElementById("pacienteApellidoPaterno");
    const apellidoMaternoInput = document.getElementById("pacienteApellidoMaterno");
    const telefonoInput = document.getElementById("pacienteTelefono");
    const activoCheckbox = document.getElementById("pacienteActivo");

    const submitButton = document.getElementById("pacienteSubmitButton");
    const cancelButton = document.getElementById("pacienteCancelButton");
    const listFeedback = document.getElementById("pacientesListFeedback");
    const reloadButton = document.getElementById("pacientesReloadButton");
    const tableBody = document.getElementById("pacientesTableBody");

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

    function renderPacientes() {
        if (!pacientes.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">No hay pacientes registrados.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = pacientes
            .map((paciente) => {
                const nombre = paciente.nombreCompleto || buildNombreCompleto(paciente);
                const estado = paciente.activo ? "Activo" : "Inactivo";
                return `
                    <tr>
                        <td>#${paciente.id}</td>
                        <td>${nombre}</td>
                        <td>${paciente.telefono}</td>
                        <td>${estado}</td>
                        <td>
                            <div class="table-actions">
                                <button type="button" class="button button--sm" data-action="edit" data-id="${paciente.id}">Editar</button>
                                <button type="button" class="button button--sm button--danger" data-action="delete" data-id="${paciente.id}">Eliminar</button>
                            </div>
                        </td>
                    </tr>
                `;
            })
            .join("");
    }

    function resetForm(options = {}) {
        editingId = null;
        form.reset();
        activoCheckbox.checked = true;
        formTitle.textContent = "Registrar paciente";
        submitButton.textContent = "Registrar paciente";
        cancelButton.hidden = true;

        if (!options.keepFeedback) {
            showFeedback(formFeedback);
        }
    }

    async function loadPacientes() {
        showFeedback(listFeedback, "Cargando pacientes...", "loading");

        try {
            pacientes = await fetchJson(`${API_BASE}/pacientes`);
            renderPacientes();
            showFeedback(listFeedback);
        } catch (error) {
            pacientes = [];
            tableBody.innerHTML = "";
            showFeedback(listFeedback, error.message, "error");
        }
    }

    function startEditing(paciente) {
        editingId = paciente.id;
        formTitle.textContent = `Editar paciente #${paciente.id}`;
        submitButton.textContent = "Guardar cambios";
        cancelButton.hidden = false;

        primerNombreInput.value = paciente.primerNombre;
        segundoNombreInput.value = paciente.segundoNombre ?? "";
        apellidoPaternoInput.value = paciente.apellidoPaterno;
        apellidoMaternoInput.value = paciente.apellidoMaterno ?? "";
        telefonoInput.value = paciente.telefono ?? "";
        activoCheckbox.checked = paciente.activo;

        showFeedback(formFeedback, "Modificando paciente seleccionado.", "muted");
        form.scrollIntoView({ behavior: "smooth", block: "start" });
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

        const paciente = pacientes.find((item) => item.id === id);
        if (!paciente) {
            return;
        }

        if (action === "edit") {
            startEditing(paciente);
            return;
        }

        if (action === "delete") {
            const confirmed = window.confirm("¿Deseas eliminar este paciente?");
            if (!confirmed) {
                return;
            }

            try {
                await fetchJson(`${API_BASE}/pacientes/${id}`, { method: "DELETE" });
                await loadPacientes();
                if (editingId === id) {
                    resetForm();
                }
                showFeedback(listFeedback, "El paciente se eliminó correctamente.", "success");
            } catch (error) {
                showFeedback(listFeedback, error.message, "error");
            }
        }
    });

    cancelButton.addEventListener("click", () => {
        resetForm();
    });

    reloadButton.addEventListener("click", () => {
        loadPacientes();
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        showFeedback(formFeedback);

        const primerNombre = primerNombreInput.value.trim();
        const segundoNombre = segundoNombreInput.value.trim();
        const apellidoPaterno = apellidoPaternoInput.value.trim();
        const apellidoMaterno = apellidoMaternoInput.value.trim();
        const telefono = telefonoInput.value.trim();

        if (!primerNombre || !apellidoPaterno || !telefono) {
            showFeedback(formFeedback, "Completa todos los campos obligatorios.", "error");
            return;
        }

        const payload = {
            primerNombre,
            segundoNombre: segundoNombre || null,
            apellidoPaterno,
            apellidoMaterno: apellidoMaterno || null,
            telefono,
            activo: activoCheckbox.checked
        };

        const wasEditing = Boolean(editingId);
        const url = wasEditing ? `${API_BASE}/pacientes/${editingId}` : `${API_BASE}/pacientes`;
        const method = wasEditing ? "PUT" : "POST";

        try {
            await fetchJson(url, {
                method,
                body: JSON.stringify(payload)
            });

            await loadPacientes();
            resetForm({ keepFeedback: true });

            const message = wasEditing
                ? "El paciente se actualizó correctamente."
                : "El paciente se registró correctamente.";

            showFeedback(formFeedback, message, "success");
        } catch (error) {
            showFeedback(formFeedback, error.message, "error");
        }
    });

    await loadPacientes();
});
