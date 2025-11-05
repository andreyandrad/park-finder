import * as api from './api.js';
import * as ui from './ui.js';
import * as simulation from './simulation.js';
import { initializeAuthUI } from './auth.js';
import { showConfirm } from './modal.js'; // Importa o novo modal

const urlParams = new URLSearchParams(window.location.search);
const ID_ESTACIONAMENTO = urlParams.get('id');
const NOME_ESTACIONAMENTO = urlParams.get('nome');

let estadoAtualVagas = [];
let kpisAtuais = {};
let filtroAtivo = 'all'; // Filtro atual
const btnSimulador = document.getElementById('btn-simulador');

if (!ID_ESTACIONAMENTO) {
    alert("Estacionamento não especificado.");
    window.location.href = 'dashboard.html';
} else {
    /* ------------------------------------------- */
    /* FUNÇÕES PRINCIPAIS
    /* ------------------------------------------- */
    async function carregarMonitor() {
        if (estadoAtualVagas.length === 0) {
            ui.setLoading(true);
        }
        try {
            const data = await api.vagas.getMonitorVagas(ID_ESTACIONAMENTO); 
            
            // Armazena dados
            estadoAtualVagas = data.vagas;
            kpisAtuais = data.kpis;
            
            // Renderiza
            renderizarKPIs(kpisAtuais);
            renderizarVagasFiltradas();

        } catch (error) {
            console.error('Falha ao carregar monitor:', error); 
            if(error.message.includes('401')) {
                ui.showToast('Sua sessão expirou.', 'error');
                setTimeout(() => window.location.href = 'login.html', 2000);
            } else {
                ui.showToast(`Erro ao carregar dados: ${error.message}`, 'error');
            }
        } finally {
            ui.setLoading(false);
        }
    }
    
    function renderizarKPIs(kpis) {
        document.getElementById('kpi-total').textContent = kpis.total;
        document.getElementById('kpi-livre').textContent = kpis.livre;
        document.getElementById('kpi-ocupada').textContent = kpis.ocupada;
        document.getElementById('kpi-manutencao').textContent = kpis.manutencao;
    }
    
    function renderizarVagasFiltradas() {
        let vagasFiltradas = estadoAtualVagas;
        
        if (filtroAtivo !== 'all') {
            vagasFiltradas = estadoAtualVagas.filter(vaga => {
                // Filtra por status (livre, ocupada) ou tipo (carro, moto, pcd)
                return vaga.status === filtroAtivo || vaga.tipo === filtroAtivo;
            });
        }
        
        ui.renderizarMapaMonitor(vagasFiltradas, onVagaToggleManutencao);
    }

    async function onVagaToggleManutencao(vaga) {
        let title, message, isDanger;

        if (vaga.status === 'manutencao') {
            title = "Reativar Vaga?";
            message = `Deseja reativar a vaga ${vaga.identificador}? Ela voltará a ficar "Livre".`;
            isDanger = false;
        } else {
            if (vaga.status === 'ocupada') {
                 ui.showToast('Vagas ocupadas por sensor não podem ir para manutenção.', 'info');
                 return;
            }
            title = "Colocar em Manutenção?";
            message = `Deseja colocar a vaga ${vaga.identificador} em MANUTENÇÃO? Ela ficará indisponível.`;
            isDanger = true;
        }
        
        const confirmado = await showConfirm({ title, message, isDanger });
        if (!confirmado) return;
        
        try {
            const resultado = await api.vagas.toggleManutencao(vaga.id_vaga);
            ui.showToast(`Vaga ${vaga.identificador} agora está: ${resultado.novo_status}.`, 'success');
            carregarMonitor();
        } catch (error) {
            ui.showToast(error.message, 'error');
        }
    }

    function toggleSimulacao() {
        const estaAtivo = sessionStorage.getItem(`sim_active_${ID_ESTACIONAMENTO}`) === 'true';
        if (estaAtivo) {
            simulation.pararSimulador(ID_ESTACIONAMENTO);
            atualizarBotaoSimulador(false);
        } else {
            simulation.iniciarSimulador(ID_ESTACIONAMENTO, false, carregarMonitor);
            atualizarBotaoSimulador(true);
        }
    }

    function atualizarBotaoSimulador(ativo) {
        if (ativo) {
            btnSimulador.classList.remove('inativo');
            btnSimulador.classList.add('ativo');
            btnSimulador.innerHTML = '<i class="fas fa-sync fa-spin"></i> Simulação Ativa';
            btnSimulador.onmouseenter = () => {
                btnSimulador.classList.add('parando');
                btnSimulador.innerHTML = '<i class="fas fa-stop"></i> Parar Simulação';
            };
            btnSimulador.onmouseleave = () => {
                btnSimulador.classList.remove('parando');
                btnSimulador.innerHTML = '<i class="fas fa-sync fa-spin"></i> Simulação Ativa';
            };
        } else {
            btnSimulador.classList.remove('ativo');
            btnSimulador.classList.remove('parando');
            btnSimulador.classList.add('inativo');
            btnSimulador.innerHTML = '<i class="fas fa-play"></i> Iniciar Simulação';
            btnSimulador.onmouseenter = null;
            btnSimulador.onmouseleave = null;
        }
    }

    /* ------------------------------------------- */
    /* INICIALIZAÇÃO
    /* ------------------------------------------- */
    document.addEventListener('DOMContentLoaded', () => {
        initializeAuthUI();
        
        document.title = `Monitor - ${NOME_ESTACIONAMENTO || 'Monitor'}`;
        document.getElementById('header-nome-estacionamento').textContent = NOME_ESTACIONAMENTO || 'Monitor de Vagas';

        btnSimulador.addEventListener('click', toggleSimulacao);

        // Listeners dos Filtros
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.filter-btn.active').classList.remove('active');
                btn.classList.add('active');
                filtroAtivo = btn.dataset.filter;
                renderizarVagasFiltradas(); // Re-renderiza o mapa com o filtro
            });
        });

        const simulacaoJaAtiva = sessionStorage.getItem(`sim_active_${ID_ESTACIONAMENTO}`) === 'true';
        if (simulacaoJaAtiva) {
            simulation.iniciarSimulador(ID_ESTACIONAMENTO, false, carregarMonitor);
        }
        atualizarBotaoSimulador(simulacaoJaAtiva);

        carregarMonitor();
        // O Polling (setInterval) não é mais necessário aqui,
        // pois o simulador (se ativo) já chama o carregarMonitor
        // E se não estiver ativo, o polling do dashboard já atualiza os totais.
        // Vamos manter um polling mais longo para caso a simulação esteja parada.
        setInterval(carregarMonitor, 60000); // Atualiza a cada 60 segundos
    });
}