const API_BASE = "/api";

function normalizeUser(user) {
    if (!user || typeof user !== "object") {
        return null;
    }

    const token = (user.token ?? user.Token ?? user.accessToken ?? user.AccessToken ?? "").trim();
    const expiresAtValue = user.expiresAt ?? user.ExpiresAt ?? user.expiration ?? user.Expiration;
    const expiresAt = expiresAtValue instanceof Date
        ? expiresAtValue.toISOString()
        : typeof expiresAtValue === "string"
            ? expiresAtValue.trim()
            : expiresAtValue;

    if (!token || !expiresAt) {
        return null;
    }

    return {
        id: user.id ?? user.Id ?? null,
        nombreCompleto: user.nombreCompleto ?? user.NombreCompleto ?? "",
        correo: user.correo ?? user.Correo ?? "",
        token,
        expiresAt
    };
}

function saveUser(user) {
    const normalized = normalizeUser(user);
    if (!normalized) {
        throw new Error("No se recibió un token de autenticación válido.");
    }

    sessionStorage.setItem("usuario", JSON.stringify(normalized));
}

function getStoredUser() {
    const raw = sessionStorage.getItem("usuario");
    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw);
        const normalized = normalizeUser(parsed);

        if (!normalized || isTokenExpired(normalized.expiresAt)) {
            sessionStorage.removeItem("usuario");
            return null;
        }

        const normalizedRaw = JSON.stringify(normalized);
        if (raw !== normalizedRaw) {
            sessionStorage.setItem("usuario", normalizedRaw);
        }

        return normalized;
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
