// --- Módulo de UI Compartilhado ---

const toastContainer = document.getElementById('toast-container');

/**
 * Renderiza o mapa de vagas para o MONITOR (index.html).
 * @param {Array} vagas - A lista de vagas vinda da API.
 * @param {Function} onVagaClickCallback - Função para o clique (toggle manutenção).
 */
export function renderizarMapaMonitor(vagas, onVagaClickCallback) {
    const mapaContainer = document.getElementById('mapa-container');
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
            case 'livre': statusTexto = 'Liberada'; break;
            case 'ocupada': statusTexto = 'Ocupada'; break;
            case 'manutencao': statusTexto = 'Manutenção'; break;
        }

        vagaDiv.innerHTML = `
            <strong>${vaga.identificador}</strong>
            <span class="vaga-status">${statusTexto}</span>
        `;

        // --- INÍCIO DA MUDANÇA ---
        // Agora, TODAS as vagas (incluindo manutenção) recebem o listener
        // A lógica de o que fazer (ativar/desativar) será tratada no main.js
        vagaDiv.addEventListener('click', () => onVagaClickCallback(vaga));
        // --- FIM DA MUDANÇA ---

        mapaContainer.appendChild(vagaDiv);
    });
}

/**
 * Exibe uma notificação "toast".
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
    const loadingMessage = document.getElementById('loading-message');
    const mapaContainer = document.getElementById('mapa-container');
    if (!loadingMessage || !mapaContainer) return; 

    if (isLoading) {
        loadingMessage.style.display = 'block';
        mapaContainer.style.opacity = '0.5';
    } else {
        loadingMessage.style.display = 'none';
        mapaContainer.style.opacity = '1';
    }
}