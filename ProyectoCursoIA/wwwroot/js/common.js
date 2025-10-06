const API_BASE = "/api";

function saveUser(user) {
    if (!user || !user.token) {
        throw new Error("No se recibió un token de autenticación válido.");
    }

    sessionStorage.setItem("usuario", JSON.stringify(user));
}

function getStoredUser() {
    const raw = sessionStorage.getItem("usuario");
    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw);

        if (!parsed || !parsed.token || isTokenExpired(parsed.expiresAt)) {
            sessionStorage.removeItem("usuario");
            return null;
        }

        return parsed;
    } catch (error) {
        console.error("No se pudo leer la información del usuario", error);
        sessionStorage.removeItem("usuario");
        return null;
    }
}

function isTokenExpired(expiresAt) {
    if (!expiresAt) {
        return true;
    }

    const expiration = new Date(expiresAt).getTime();
    if (Number.isNaN(expiration)) {
        return true;
    }

    return expiration <= Date.now();
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
    const user = getStoredUser();
    const defaultHeaders = {
        "Content-Type": "application/json"
    };

    if (user?.token) {
        defaultHeaders.Authorization = `Bearer ${user.token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...(options.headers || {})
        }
    });

    let data = null;
    try {
        data = await response.json();
    } catch (error) {
        // Ignoramos si no hay cuerpo JSON
    }

    if (response.status === 401) {
        if (user) {
            logout();
        }

        const message = data?.message || "Tu sesión ha expirado. Inicia sesión nuevamente.";
        throw new Error(message);
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
