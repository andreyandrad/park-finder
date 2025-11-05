/**
 * js/modal.js - Componente de Modal de Confirmação
 */

// Pega o placeholder do modal (precisa estar em todos os HTML)
const modalPlaceholder = document.getElementById('modal-placeholder');

/**
 * Exibe um modal de confirmação customizado.
 * @param {object} options - Opções do modal.
 * @param {string} options.title - O título (ex: "Confirmar Exclusão").
 * @param {string} options.message - A mensagem de corpo (ex: "Tem certeza?").
 * @param {string} [options.confirmText="Confirmar"] - Texto do botão de confirmação.
 * @param {string} [options.cancelText="Cancelar"] - Texto do botão de cancelar.
 * @param {boolean} [options.isDanger=false] - Se true, o botão de confirmação fica vermelho.
 * @returns {Promise<boolean>} - Resolve com 'true' se confirmado, 'false' se cancelado.
 */
export function showConfirm({ 
    title, 
    message, 
    confirmText = "Confirmar", 
    cancelText = "Cancelar", 
    isDanger = false 
}) {
    // Retorna uma Promessa que podemos "await"
    return new Promise((resolve) => {
        // Limpa qualquer modal antigo
        if (modalPlaceholder) modalPlaceholder.innerHTML = '';
        
        const confirmClass = isDanger ? 'btn-danger' : 'btn-primary';

        // Cria o HTML do modal
        const modalHTML = `
            <div classclass="modal-backdrop" id="modal-backdrop">
                <div class="modal-box">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" id="modal-btn-cancel">${cancelText}</button>
                        <button type="button" class="btn-primary ${confirmClass}" id="modal-btn-confirm">${confirmText}</button>
                    </div>
                </div>
            </div>
        `;
        
        if (modalPlaceholder) modalPlaceholder.innerHTML = modalHTML;
        
        const backdrop = document.getElementById('modal-backdrop');
        const btnCancel = document.getElementById('modal-btn-cancel');
        const btnConfirm = document.getElementById('modal-btn-confirm');

        // Função para fechar o modal
        const closeModal = (result) => {
            if (backdrop) backdrop.classList.remove('show');
            // Remove da DOM após a animação
            setTimeout(() => {
                if (modalPlaceholder) modalPlaceholder.innerHTML = '';
                resolve(result); // Resolve a promessa
            }, 300); // 300ms (tempo da animação do CSS)
        };

        // Mostra o modal (adicionando a classe 'show')
        // Usamos um timeout de 10ms para garantir que o CSS aplique a transição
        setTimeout(() => {
            if (backdrop) backdrop.classList.add('show');
        }, 10);

        // Adiciona os listeners
        btnCancel.addEventListener('click', () => closeModal(false));
        btnConfirm.addEventListener('click', () => closeModal(true));
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                closeModal(false); // Fecha se clicar fora
            }
        });
    });
}