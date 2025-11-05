// --- Módulo de API Compartilhado ---

async function handleResponse(response) {
    if (response.status === 401) {
        sessionStorage.clear();
        window.location.href = 'login.html';
        throw new Error('401 Não Autorizado');
    }
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}`);
    }
    return data;
}

async function apiFetch(url, options = {}) {
    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };
    const response = await fetch(url, defaultOptions);
    return handleResponse(response);
}

// --- API DE ESTACIONAMENTOS ---
export const estacionamentos = {
    getAll: () => apiFetch('api/estacionamentos.php'),
    create: (data) => apiFetch('api/estacionamentos.php', {
        method: 'POST', body: JSON.stringify(data),
    }),
    update: (data) => apiFetch('api/estacionamentos.php', {
        method: 'PUT', body: JSON.stringify(data),
    }),
    delete: (id) => apiFetch(`api/estacionamentos.php?id=${id}`, {
        method: 'DELETE',
    }),
};

// --- API DE VAGAS ---
export const vagas = {
    getMonitorVagas: (id_est) => apiFetch(`api/monitor.php?id_est=${id_est}`),
    getVagasGerenciamento: (id_est) => apiFetch(`api/vagas.php?id_est=${id_est}`),
    suggestNext: (id_est, tipo) => apiFetch(`api/vagas.php?id_est=${id_est}&suggest_next=${tipo}`), // NOVO
    create: (data) => apiFetch('api/vagas.php', {
        method: 'POST', body: JSON.stringify(data),
    }),
    update: (data) => apiFetch('api/vagas.php', {
        method: 'PUT', body: JSON.stringify(data),
    }),
    toggleManutencao: (id_vaga) => apiFetch('api/vagas.php', {
        method: 'PUT', body: JSON.stringify({ id_vaga, action: 'toggle_manutencao' }),
    }),
    delete: (id_vaga) => apiFetch(`api/vagas.php?id_vaga=${id_vaga}`, {
        method: 'DELETE',
    }),
};

// --- API DE REGISTROS (Simulação) ---
export const registros = {
    checkIn: (id_vaga) => apiFetch('api/registros.php', {
        method: 'POST', body: JSON.stringify({ id_vaga }),
    }),
    checkOut: (id_registro) => apiFetch('api/registros.php', {
        method: 'PUT', body: JSON.stringify({ id_registro }),
    }),
};

// --- API DE LOGS ---
export const logs = {
    getAll: () => apiFetch('api/logs.php'),
};

// --- API DE USUÁRIOS ---
export const usuarios = {
    getAll: () => apiFetch('api/usuarios.php'),
    create: (data) => apiFetch('api/usuarios.php', {
        method: 'POST', body: JSON.stringify(data),
    }),
    update: (data) => apiFetch('api/usuarios.php', {
        method: 'PUT', body: JSON.stringify(data),
    }),
    delete: (id) => apiFetch(`api/usuarios.php?id=${id}`, {
        method: 'DELETE',
    }),
};