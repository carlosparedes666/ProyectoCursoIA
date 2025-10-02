document.addEventListener("DOMContentLoaded", async () => {
    const user = requireUser();
    if (!user) {
        return;
    }

    const logoutButton = document.getElementById("logoutButton");
    logoutButton?.addEventListener("click", () => logout());

    const form = document.getElementById("medicoForm");
    const formTitle = document.getElementById("medicoFormTitle");
    const formFeedback = document.getElementById("medicoFormFeedback");

    const primerNombreInput = document.getElementById("medicoPrimerNombre");
    const segundoNombreInput = document.getElementById("medicoSegundoNombre");
    const apellidoPaternoInput = document.getElementById("medicoApellidoPaterno");
    const apellidoMaternoInput = document.getElementById("medicoApellidoMaterno");
    const cedulaInput = document.getElementById("medicoCedula");
    const telefonoInput = document.getElementById("medicoTelefono");
    const especialidadInput = document.getElementById("medicoEspecialidad");
    const emailInput = document.getElementById("medicoEmail");
    const activoCheckbox = document.getElementById("medicoActivo");

    const submitButton = document.getElementById("medicoSubmitButton");
    const cancelButton = document.getElementById("medicoCancelButton");
    const listFeedback = document.getElementById("medicosListFeedback");
    const reloadButton = document.getElementById("medicosReloadButton");
    const tableBody = document.getElementById("medicosTableBody");

    let medicos = [];
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

    function renderMedicos() {
        if (!medicos.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">No hay médicos registrados.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = medicos
            .map((medico) => {
                const nombre = medico.nombreCompleto || buildNombreCompleto(medico);
                const estado = medico.activo ? "Activo" : "Inactivo";
                return `
                    <tr>
                        <td>#${medico.id}</td>
                        <td>${nombre}</td>
                        <td>${medico.especialidad}</td>
                        <td>${medico.email}</td>
                        <td>${medico.telefono}</td>
                        <td>${estado}</td>
                        <td>
                            <div class="table-actions">
                                <button type="button" class="button button--sm" data-action="edit" data-id="${medico.id}">Editar</button>
                                <button type="button" class="button button--sm button--danger" data-action="delete" data-id="${medico.id}">Eliminar</button>
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
        formTitle.textContent = "Registrar médico";
        submitButton.textContent = "Registrar médico";
        cancelButton.hidden = true;

        if (!options.keepFeedback) {
            showFeedback(formFeedback);
        }
    }

    async function loadMedicos() {
        showFeedback(listFeedback, "Cargando médicos...", "loading");

        try {
            medicos = await fetchJson(`${API_BASE}/medicos`);
            renderMedicos();
            showFeedback(listFeedback);
        } catch (error) {
            medicos = [];
            tableBody.innerHTML = "";
            showFeedback(listFeedback, error.message, "error");
        }
    }

    function startEditing(medico) {
        editingId = medico.id;
        formTitle.textContent = `Editar médico #${medico.id}`;
        submitButton.textContent = "Guardar cambios";
        cancelButton.hidden = false;

        primerNombreInput.value = medico.primerNombre;
        segundoNombreInput.value = medico.segundoNombre ?? "";
        apellidoPaternoInput.value = medico.apellidoPaterno;
        apellidoMaternoInput.value = medico.apellidoMaterno ?? "";
        cedulaInput.value = medico.cedula;
        telefonoInput.value = medico.telefono?.toString() ?? "";
        especialidadInput.value = medico.especialidad;
        emailInput.value = medico.email;
        activoCheckbox.checked = medico.activo;

        showFeedback(formFeedback, "Modificando médico seleccionado.", "muted");
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

        const medico = medicos.find((item) => item.id === id);
        if (!medico) {
            return;
        }

        if (action === "edit") {
            startEditing(medico);
            return;
        }

        if (action === "delete") {
            const confirmed = window.confirm("¿Deseas eliminar este médico?");
            if (!confirmed) {
                return;
            }

            try {
                await fetchJson(`${API_BASE}/medicos/${id}`, { method: "DELETE" });
                await loadMedicos();
                if (editingId === id) {
                    resetForm();
                }
                showFeedback(listFeedback, "El médico se eliminó correctamente.", "success");
            } catch (error) {
                showFeedback(listFeedback, error.message, "error");
            }
        }
    });

    cancelButton.addEventListener("click", () => {
        resetForm();
    });

    reloadButton.addEventListener("click", () => {
        loadMedicos();
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        showFeedback(formFeedback);

        const primerNombre = primerNombreInput.value.trim();
        const segundoNombre = segundoNombreInput.value.trim();
        const apellidoPaterno = apellidoPaternoInput.value.trim();
        const apellidoMaterno = apellidoMaternoInput.value.trim();
        const cedula = cedulaInput.value.trim();
        const telefonoRaw = telefonoInput.value.trim();
        const especialidad = especialidadInput.value.trim();
        const email = emailInput.value.trim();

        if (!primerNombre || !apellidoPaterno || !cedula || !especialidad || !email || !telefonoRaw) {
            showFeedback(formFeedback, "Completa todos los campos obligatorios.", "error");
            return;
        }

        const telefonoDigits = telefonoRaw.replace(/\D+/g, "");
        if (!telefonoDigits) {
            showFeedback(formFeedback, "Captura un número de teléfono válido.", "error");
            return;
        }

        const payload = {
            primerNombre,
            segundoNombre: segundoNombre || null,
            apellidoPaterno,
            apellidoMaterno: apellidoMaterno || null,
            cedula,
            telefono: Number(telefonoDigits),
            especialidad,
            email,
            activo: activoCheckbox.checked
        };

        const wasEditing = Boolean(editingId);
        const url = wasEditing ? `${API_BASE}/medicos/${editingId}` : `${API_BASE}/medicos`;
        const method = wasEditing ? "PUT" : "POST";

        try {
            await fetchJson(url, {
                method,
                body: JSON.stringify(payload)
            });

            await loadMedicos();
            resetForm({ keepFeedback: true });

            const message = wasEditing
                ? "El médico se actualizó correctamente."
                : "El médico se registró correctamente.";

            showFeedback(formFeedback, message, "success");
        } catch (error) {
            showFeedback(formFeedback, error.message, "error");
        }
    });

    await loadMedicos();
});
