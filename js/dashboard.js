import { showToast } from './ui.js'; 
import { iniciarSimulador } from './simulation.js';
import { initializeAuthUI, getUserRole } from './auth.js';
import * as api from './api.js';
import { showConfirm } from './modal.js'; // Importa o novo modal

const POLLING_INTERVAL = 30000; // 30 segundos
let pollingTimer = null;

// --- Renderização ---
function renderSkeletons() {
    const container = document.getElementById('lista-estacionamentos');
    const skeletonContainer = document.getElementById('dashboard-skeleton');
    container.style.display = 'none';
    skeletonContainer.style.display = 'grid';
}

function renderDashboard(data) {
    const container = document.getElementById('lista-estacionamentos');
    const skeletonContainer = document.getElementById('dashboard-skeleton');
    const emptyState = document.getElementById('empty-state');
    const userRole = getUserRole();

    // Limpa cards antigos
    document.querySelectorAll('.card-estacionamento:not(.card-add)').forEach(c => c.remove());

    if (data.length === 0) {
        // Mostra "Empty State"
        emptyState.style.display = 'block';
        if (userRole === 'gerente') {
            document.getElementById('empty-state-message').textContent = 'Você ainda não foi associado a nenhum estacionamento. Contate o administrador.';
        }
    } else {
        // Esconde "Empty State"
        emptyState.style.display = 'none';
    }

    data.forEach(est => {
        const card = document.createElement('div');
        card.className = 'card-estacionamento';
        card.dataset.nome = est.nome.toLowerCase(); // Para a busca

        const ocupacao = (est.total_vagas > 0) ? (est.vagas_ocupadas / est.total_vagas) * 100 : 0;

        const link = document.createElement('a');
        link.href = `index.html?id=${est.id_estacionamento}&nome=${encodeURIComponent(est.nome)}`;
        link.className = 'card-link';
        link.innerHTML = `
            <h3>${est.nome}</h3>
            <p>${est.endereco || 'Endereço não informado'}</p>
            <div class="card-stats">
                <i class="fas fa-car"></i>
                ${est.vagas_ocupadas || 0} / ${est.total_vagas} vagas
            </div>
            <div class="progress-bar">
                <div class="progress-bar-inner" style="width: ${ocupacao}%"></div>
            </div>
        `;
        card.appendChild(link);
        
        const actions = document.createElement('div');
        actions.className = 'card-actions';
        
        const btnEdit = document.createElement('button');
        btnEdit.className = 'btn-edit';
        btnEdit.innerHTML = '<i class="fas fa-edit"></i> Gerenciar';
        btnEdit.onclick = () => {
            window.location.href = `editar-estacionamento.html?id=${est.id_estacionamento}&nome=${encodeURIComponent(est.nome)}`;
        };
        actions.appendChild(btnEdit);
        
        if (userRole === 'superadmin') {
            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn-delete';
            btnDelete.innerHTML = '<i class="fas fa-trash"></i> Excluir';
            btnDelete.onclick = () => handleDeleteEstacionamento(est.id_estacionamento, est.nome);
            actions.appendChild(btnDelete);
        }
        
        card.appendChild(actions);
        container.prepend(card);
    });
    
    // Esconde o skeleton e mostra o conteúdo
    skeletonContainer.style.display = 'none';
    container.style.display = 'grid';
}

// --- Funções de Ação ---
async function carregarDashboard() {
    try {
        const data = await api.estacionamentos.getAll();
        renderDashboard(data);
    } catch (error) {
        showToast(error.message, 'error');
        // Se falhar, para o skeleton
        document.getElementById('dashboard-skeleton').style.display = 'none';
    }
}

async function handleDeleteEstacionamento(id, nome) {
    const confirmado = await showConfirm({
        title: "Confirmar Exclusão",
        message: `Tem certeza que deseja excluir o estacionamento "${nome}"?\n\nATENÇÃO: Todas as vagas e logs associados serão permanentemente excluídos.`,
        confirmText: "Excluir",
        isDanger: true
    });
    
    if (!confirmado) return;
    
    try {
        await api.estacionamentos.delete(id);
        showToast('Estacionamento excluído com sucesso.', 'success');
        carregarDashboard();
    } catch (error) {
        showToast(`Erro ao excluir: ${error.message}`, 'error');
    }
}

function filtrarDashboard(e) {
    const termo = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.card-estacionamento:not(.card-add)');
    cards.forEach(card => {
        const nome = card.dataset.nome;
        if (nome.includes(termo)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function iniciarSimulacoesDeBackground() {
    console.log("Dashboard: Verificando simulações de background...");
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key.startsWith('sim_active_') && sessionStorage.getItem(key) === 'true') {
            const id_estacionamento = key.split('_')[2];
            iniciarSimulador(id_estacionamento, true, null);
        }
    }
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    initializeAuthUI();
    
    const userRole = getUserRole();
    if (userRole === 'superadmin') {
        document.getElementById('card-add-estacionamento').style.display = 'flex';
    }
    
    renderSkeletons(); // Mostra Skeletons
    carregarDashboard(); // Carga inicial
    iniciarSimulacoesDeBackground();
    
    // Listeners
    document.getElementById('search-bar').addEventListener('keyup', filtrarDashboard);
    
    // Inicia o Polling (Auto-refresh)
    if (pollingTimer) clearInterval(pollingTimer);
    pollingTimer = setInterval(carregarDashboard, POLLING_INTERVAL);
});