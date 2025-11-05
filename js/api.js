// URLs da API
const API_URL_VAGAS = 'api/vagas.php';
const API_URL_REGISTROS = 'api/registros.php';

/**
 * Função genérica para tratar respostas não-OK.
 */
async function handleResponse(response) {
    if (response.status === 401) {
        throw new Error('401 Não Autorizado');
    }
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}`);
    }
    return data;
}

/**
 * Busca a lista completa de vagas de um estacionamento.
 * @param {string} id_estacionamento - O ID do estacionamento.
 */
export async function fetchVagas(id_estacionamento) {
    const response = await fetch(`${API_URL_VAGAS}?id_est=${id_estacionamento}`, {
        credentials: 'include'
    });
    return handleResponse(response);
}

/**
 * Envia uma requisição de Check-In (POST) para a API.
 * @param {number} idVaga - O ID da vaga.
 */
export async function postCheckIn(idVaga) {
    const response = await fetch(API_URL_REGISTROS, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id_vaga: idVaga
        })
    });
    return handleResponse(response);
}

/**
 * Envia uma requisição de Check-Out (PUT) para a API.
 * @param {number} idRegistro - O ID do registro de estacionamento.
 */
export async function putCheckOut(idRegistro) {
    const response = await fetch(API_URL_REGISTROS, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id_registro: idRegistro
        })
    });
    return handleResponse(response);
}