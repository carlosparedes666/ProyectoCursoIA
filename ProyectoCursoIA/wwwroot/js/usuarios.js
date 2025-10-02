document.addEventListener("DOMContentLoaded", async () => {
    const user = requireUser();
    if (!user) {
        return;
    }

    const logoutButton = document.getElementById("logoutButton");
    logoutButton?.addEventListener("click", () => logout());

    const form = document.getElementById("usuarioForm");
    const formTitle = document.getElementById("usuarioFormTitle");
    const formFeedback = document.getElementById("usuarioFormFeedback");
    const correoInput = document.getElementById("usuarioCorreo");
    const passwordInput = document.getElementById("usuarioPassword");
    const nombreInput = document.getElementById("usuarioNombreCompleto");
    const medicoSelect = document.getElementById("usuarioMedico");
    const activoCheckbox = document.getElementById("usuarioActivo");
    const submitButton = document.getElementById("usuarioSubmitButton");
    const cancelButton = document.getElementById("usuarioCancelButton");

    const listFeedback = document.getElementById("usuariosListFeedback");
    const reloadButton = document.getElementById("usuariosReloadButton");
    const tableBody = document.getElementById("usuariosTableBody");

    let usuarios = [];
    let medicos = [];
    let medicosMap = new Map();
    let editingId = null;
    let editingUsuario = null;

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

    function renderMedicoOptions() {
        const selectedValue = medicoSelect.value;
        const options = ["<option value=\"\">Sin asignar</option>"];

        medicos.forEach((medico) => {
            const nombre = medico.nombreCompleto || buildNombreCompleto(medico);
            options.push(`<option value="${medico.id}">${nombre}</option>`);
        });

        medicoSelect.innerHTML = options.join("");

        if (selectedValue && medicoSelect.querySelector(`option[value="${selectedValue}"]`)) {
            medicoSelect.value = selectedValue;
        }
    }

    function renderUsuarios() {
        if (!usuarios.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">No hay usuarios registrados.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = usuarios
            .map((usuario) => {
                const medicoNombre = usuario.idMedico
                    ? medicosMap.get(usuario.idMedico) || `ID ${usuario.idMedico}`
                    : "Sin asignar";

                const estado = usuario.activo ? "Activo" : "Inactivo";

                return `
                    <tr>
                        <td>#${usuario.id}</td>
                        <td>${usuario.correo}</td>
                        <td>${usuario.nombreCompleto}</td>
                        <td>${medicoNombre}</td>
                        <td>${estado}</td>
                        <td>
                            <div class="table-actions">
                                <button type="button" class="button button--sm" data-action="edit" data-id="${usuario.id}">Editar</button>
                                <button type="button" class="button button--sm button--danger" data-action="delete" data-id="${usuario.id}">Eliminar</button>
                            </div>
                        </td>
                    </tr>
                `;
            })
            .join("");
    }

    function resetForm(options = {}) {
        editingId = null;
        editingUsuario = null;
        form.reset();
        activoCheckbox.checked = true;
        formTitle.textContent = "Registrar usuario";
        submitButton.textContent = "Registrar usuario";
        cancelButton.hidden = true;

        if (!options.keepFeedback) {
            showFeedback(formFeedback);
        }
    }

    async function loadMedicos() {
        try {
            medicos = await fetchJson(`${API_BASE}/medicos`);
            medicosMap = new Map(
                medicos.map((medico) => [medico.id, medico.nombreCompleto || buildNombreCompleto(medico)])
            );
            renderMedicoOptions();
        } catch (error) {
            showFeedback(formFeedback, `No se pudieron cargar los médicos: ${error.message}`, "error");
        }
    }

    async function loadUsuarios() {
        showFeedback(listFeedback, "Cargando usuarios...", "loading");

        try {
            usuarios = await fetchJson(`${API_BASE}/usuarios`);
            renderUsuarios();
            showFeedback(listFeedback);
        } catch (error) {
            usuarios = [];
            tableBody.innerHTML = "";
            showFeedback(listFeedback, error.message, "error");
        }
    }

    function startEditing(usuario) {
        editingId = usuario.id;
        editingUsuario = usuario;

        formTitle.textContent = `Editar usuario #${usuario.id}`;
        submitButton.textContent = "Guardar cambios";
        cancelButton.hidden = false;

        correoInput.value = usuario.correo;
        passwordInput.value = usuario.password;
        nombreInput.value = usuario.nombreCompleto;
        medicoSelect.value = usuario.idMedico?.toString() ?? "";
        activoCheckbox.checked = usuario.activo;

        showFeedback(formFeedback, "Modificando usuario seleccionado.", "muted");
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

        const usuario = usuarios.find((item) => item.id === id);
        if (!usuario) {
            return;
        }

        if (action === "edit") {
            startEditing(usuario);
            return;
        }

        if (action === "delete") {
            const confirmed = window.confirm("¿Deseas eliminar este usuario?");
            if (!confirmed) {
                return;
            }

            try {
                await fetchJson(`${API_BASE}/usuarios/${id}`, { method: "DELETE" });
                await loadUsuarios();
                if (editingId === id) {
                    resetForm();
                }
                showFeedback(listFeedback, "El usuario se eliminó correctamente.", "success");
            } catch (error) {
                showFeedback(listFeedback, error.message, "error");
            }
        }
    });

    cancelButton.addEventListener("click", () => {
        resetForm();
    });

    reloadButton.addEventListener("click", () => {
        loadUsuarios();
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        showFeedback(formFeedback);

        const correo = correoInput.value.trim();
        const nombreCompleto = nombreInput.value.trim();
        const passwordValue = passwordInput.value;
        const finalPassword = passwordValue || editingUsuario?.password || "";

        if (!correo || !nombreCompleto || !finalPassword) {
            showFeedback(formFeedback, "Completa todos los campos obligatorios.", "error");
            return;
        }

        const medicoValue = medicoSelect.value;

        const payload = {
            correo,
            password: finalPassword,
            nombreCompleto,
            idMedico: medicoValue ? Number(medicoValue) : null,
            activo: activoCheckbox.checked
        };

        const wasEditing = Boolean(editingId);
        const url = wasEditing ? `${API_BASE}/usuarios/${editingId}` : `${API_BASE}/usuarios`;
        const method = wasEditing ? "PUT" : "POST";

        try {
            await fetchJson(url, {
                method,
                body: JSON.stringify(payload)
            });

            await loadUsuarios();
            resetForm({ keepFeedback: true });

            const message = wasEditing
                ? "El usuario se actualizó correctamente."
                : "El usuario se registró correctamente.";

            showFeedback(formFeedback, message, "success");
        } catch (error) {
            showFeedback(formFeedback, error.message, "error");
        }
    });

    await loadMedicos();
    await loadUsuarios();
});
