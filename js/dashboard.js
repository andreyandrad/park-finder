// Importa apenas a função de 'ui.js' que ela precisa
import { showToast } from './ui.js'; 

// Função de Logout
document.getElementById('btn-logout').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await fetch('api/logout.php', { credentials: 'include' });
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Erro no logout:', error);
        window.location.href = 'login.html';
    }
});

// Função para buscar estacionamentos
async function carregarDashboard() {
    const container = document.getElementById('lista-estacionamentos');
    
    try {
        const response = await fetch('api/estacionamentos.php', { credentials: 'include' });
        
        if (response.status === 401) { // Não autorizado!
            window.location.href = 'login.html';
            return;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao carregar');
        }

        // Limpa (exceto o card de 'adicionar')
        document.querySelectorAll('.card-estacionamento:not(.card-add)').forEach(c => c.remove());

        // Adiciona os cards
        data.forEach(est => {
            const card = document.createElement('a');
            // Link para o monitor, passando o ID e Nome
            card.href = `index.html?id=${est.id_estacionamento}&nome=${encodeURIComponent(est.nome)}`;
            card.className = 'card-estacionamento';
            
            card.innerHTML = `
                <h3>${est.nome}</h3>
                <p>${est.endereco || 'Endereço não informado'}</p>
                <div class="card-stats">
                    <i class="fas fa-car"></i>
                    ${est.vagas_ocupadas || 0} / ${est.total_vagas} vagas
                </div>
            `;
            // Insere antes do botão de "adicionar"
            container.prepend(card);
        });

    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Carrega ao iniciar
document.addEventListener('DOMContentLoaded', carregarDashboard);