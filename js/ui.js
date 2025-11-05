// Seletores de elementos do DOM
const mapaContainer = document.getElementById('mapa-container');
const loadingMessage = document.getElementById('loading-message');
const toastContainer = document.getElementById('toast-container');

/**
 * Limpa e desenha o mapa de vagas na tela.
 * @param {Array} vagas - A lista de vagas vinda da API.
 */
export function renderizarMapa(vagas) {
    if (!mapaContainer) return; // Não executa se não estiver na página do monitor
    
    mapaContainer.innerHTML = '';

    if (!vagas || vagas.length === 0) {
        mapaContainer.innerHTML = '<p>Nenhuma vaga encontrada para este estacionamento.</p>';
        return;
    }

    vagas.forEach(vaga => {
        const vagaDiv = document.createElement('div');
        vagaDiv.className = 'vaga';
        vagaDiv.classList.add(vaga.status, vaga.tipo);
        
        let statusTexto = '';
        switch(vaga.status) {
            case 'livre':
                statusTexto = 'Liberada';
                break;
            case 'ocupada':
                statusTexto = 'Ocupada';
                break;
            case 'manutencao':
                statusTexto = 'Manutenção';
                break;
        }

        vagaDiv.innerHTML = `
            <strong>${vaga.identificador}</strong>
            <span class="vaga-status">${statusTexto}</span>
        `;

        if (vaga.status === 'manutencao') {
            vagaDiv.style.cursor = 'not-allowed';
        }
        mapaContainer.appendChild(vagaDiv);
    });
}

/**
 * Exibe uma notificação "toast".
 * @param {string} message - A mensagem.
 * @param {'success' | 'error' | 'info'} type - O tipo.
 * @param {number} duration - A duração em ms.
 */
export function showToast(message, type = 'info', duration = 3000) {
    if (!toastContainer) return; // Não executa se o container não existir

    const toast = document.createElement('div');
    toast.classList.add('toast', `toast-${type}`);
    toast.style.setProperty('--toast-delay', `${duration / 1000}s`);

    let iconClass = '';
    if (type === 'success') iconClass = 'fas fa-check-circle';
    else if (type === 'error') iconClass = 'fas fa-times-circle';
    else if (type === 'info') iconClass = 'fas fa-info-circle';

    toast.innerHTML = `
        <i class="${iconClass} toast-icon ${type}"></i>
        <span>${message}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-out');
        toast.addEventListener('animationend', () => toast.remove());
    }, duration);
}

/** Controla a mensagem de "Carregando..." */
export function setLoading(isLoading) {
    if (!loadingMessage || !mapaContainer) return; // Não executa se não estiver na página

    if (isLoading) {
        loadingMessage.style.display = 'block';
        mapaContainer.style.opacity = '0.5';
    } else {
        loadingMessage.style.display = 'none';
        mapaContainer.style.opacity = '1';
    }
}