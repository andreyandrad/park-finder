// Importações dos módulos
import * as api from './api.js';
import * as ui from './ui.js';
import * as simulation from './simulation.js';

// --- Ler parâmetros da URL ---
const urlParams = new URLSearchParams(window.location.search);
const ID_ESTACIONAMENTO = urlParams.get('id');
const NOME_ESTACIONAMENTO = urlParams.get('nome');

// Se não tiver ID, volta ao dashboard
if (!ID_ESTACIONAMENTO) {
    alert("Estacionamento não especificado. Redirecionando para o dashboard.");
    window.location.href = 'dashboard.html';
}

// --- Estado Global da Aplicação ---
let estadoAtualVagas = [];

// --- Seletores de Elementos ---
const btnIniciarSimulador = document.getElementById('btn-iniciar-simulador');

/* ------------------------------------------- */
/* FUNÇÕES PRINCIPAIS (Controladores)
/* ------------------------------------------- */

/**
 * Controlador principal: Busca vagas na API e manda a UI renderizar.
 */
async function carregarVagas() {
    if (estadoAtualVagas.length === 0) {
        ui.setLoading(true);
    }

    try {
        estadoAtualVagas = await api.fetchVagas(ID_ESTACIONAMENTO); 
        ui.renderizarMapa(estadoAtualVagas);
    } catch (error) {
        console.error('Falha ao carregar vagas:', error);
        if(error.message.includes('401')) { // Se a sessão expirou
            ui.showToast('Sua sessão expirou. Redirecionando para o login...', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
        } else {
            ui.showToast('Erro ao carregar vagas.', 'error');
        }
        estadoAtualVagas = [];
    } finally {
        ui.setLoading(false);
    }
}

/**
 * Controlador: Inicia a simulação e atualiza o botão.
 */
function handleIniciarSimulacao() {
    simulation.iniciarSimulador(
        () => estadoAtualVagas, // Função que retorna o estado
        carregarVagas,          // Função que atualiza o estado
        ID_ESTACIONAMENTO       // ID do estacionamento a simular
    );

    btnIniciarSimulador.disabled = true;
    btnIniciarSimulador.classList.add('ativo');
    btnIniciarSimulador.innerHTML = '<i class="fas fa-sync fa-spin"></i> Simulação Ativa';
}

/* ------------------------------------------- */
/* INICIALIZAÇÃO E LISTENERS GLOBAIS
/* ------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    // Atualiza o título da página e adiciona link "Voltar"
    document.title = `Monitor - ${NOME_ESTACIONAMENTO}`;
    document.querySelector('header h1').innerHTML = `<span class="fas fa-car"></span> ${NOME_ESTACIONAMENTO}`;
    document.querySelector('header p').innerHTML = `Visão geral do pátio (via sensores)`;
    const linkVoltar = document.createElement('a');
    linkVoltar.href = 'dashboard.html';
    linkVoltar.text = 'Voltar ao Dashboard';
    document.querySelector('header').appendChild(linkVoltar);

    // Listener do Botão de Simulação
    btnIniciarSimulador.addEventListener('click', handleIniciarSimulacao);

    // Carga inicial dos dados
    carregarVagas();

    // Inicia o "Polling" (atualização automática) do mapa a cada 10 segundos
    setInterval(carregarVagas, 10000); 
});