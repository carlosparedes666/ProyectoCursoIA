const API_BASE = "/api";

function saveUser(user) {
    sessionStorage.setItem("usuario", JSON.stringify(user));
}

function getStoredUser() {
    const raw = sessionStorage.getItem("usuario");
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        console.error("No se pudo leer la información del usuario", error);
        sessionStorage.removeItem("usuario");
        return null;
    }
}

function requireUser() {
    const user = getStoredUser();
    if (!user) {
        window.location.href = "index.html";
        return null;
    }

    return user;
}

function logout() {
    sessionStorage.removeItem("usuario");
    window.location.href = "index.html";
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    let data = null;
    try {
        data = await response.json();
    } catch (error) {
        // Ignoramos si no hay cuerpo JSON
    }

    if (!response.ok) {
        const message = data?.message || "Ocurrió un error inesperado.";
        throw new Error(message);
    }

    return data;
}

function buildNombreCompleto({ primerNombre = "", segundoNombre = "", apellidoPaterno = "", apellidoMaterno = "" }) {
    return [primerNombre, segundoNombre, apellidoPaterno, apellidoMaterno]
        .map((parte) => parte?.trim())
        .filter((parte) => parte)
        .join(" ");
}
