import * as api from './api.js';
import { showToast } from './ui.js';

let simulationIntervals = new Map();

/**
 * Lógica central da simulação.
 * @param {string} id_estacionamento - O ID do estacionamento a simular.
 * @param {boolean} silent - Se true, não mostrará notificações toast.
 * @returns {Promise<boolean>} - Retorna true se a simulação executou.
 */
async function executarSimulacao(id_estacionamento, silent = false) {
    try {
        // --- INÍCIO DA CORREÇÃO ---
        
        // 1. A API retorna um objeto {kpis, vagas}. Nós queremos o 'data.vagas'.
        const data = await api.vagas.getMonitorVagas(id_estacionamento);
        const estadoAtualVagas = data.vagas; // Agora 'estadoAtualVagas' É o array.

        if (estadoAtualVagas.length === 0) return true;

        // 2. A linha 32 original (vagasDoEstacionamento = estadoAtualVagas.filter(...)) foi REMOVIDA.
        // Ela era redundante (a API já filtra) e era a fonte do erro.
        
        // 3. Usamos 'estadoAtualVagas' diretamente para os filtros.
        const vagasLivre = estadoAtualVagas.filter(v => v.status === 'livre');
        const vagasOcupadas = estadoAtualVagas.filter(v => v.status === 'ocupada');
        
        // --- FIM DA CORREÇÃO ---

        const acaoCheckIn = Math.random() > 0.5;

        if (acaoCheckIn && vagasLivre.length > 0) {
            const vagaEscolhida = vagasLivre[Math.floor(Math.random() * vagasLivre.length)];
            console.log(`[SIM ${id_estacionamento}] Check-in na vaga ${vagaEscolhida.identificador}`);
            await api.registros.checkIn(vagaEscolhida.id_vaga);
            if (!silent) {
                showToast(`Sensor: Vaga ${vagaEscolhida.identificador} foi ocupada.`, 'info');
            }
        } else if (!acaoCheckIn && vagasOcupadas.length > 0) {
            const vagaEscolhida = vagasOcupadas[Math.floor(Math.random() * vagasOcupadas.length)];
            console.log(`[SIM ${id_estacionamento}] Check-out da vaga ${vagaEscolhida.identificador}`);
            await api.registros.checkOut(vagaEscolhida.id_registro);
            if (!silent) {
                showToast(`Sensor: Vaga ${vagaEscolhida.identificador} foi liberada.`, 'info');
            }
        }
        return true;
    } catch (error) {
        console.error(`[SIMULADOR ${id_estacionamento}] Erro:`, error.message);
        if (error.message.includes('401')) {
            pararSimulador(id_estacionamento); // Para se a sessão cair
        }
        return false;
    }
}

/**
 * Inicia o loop da simulação para um estacionamento.
 * @param {string} id_estacionamento - ID do estacionamento a simular.
 * @param {boolean} silent - Se true, não mostra toasts.
 * @param {Function} [refreshCallback] - (Opcional) Função chamada após a simulação.
 */
export function iniciarSimulador(id_estacionamento, silent = false, refreshCallback = null) {
    if (simulationIntervals.has(id_estacionamento)) return; // Já está rodando

    const INTERVALO_SIMULACAO = 15000; // 15 segundos

    // Roda uma vez imediatamente
    executarSimulacao(id_estacionamento, silent).then(success => {
        if (success && refreshCallback) refreshCallback();
    });

    // Inicia o loop
    const intervalId = setInterval(async () => {
        const success = await executarSimulacao(id_estacionamento, silent);
        if (success && refreshCallback) refreshCallback();
    }, INTERVALO_SIMULACAO);

    simulationIntervals.set(id_estacionamento, intervalId);
    sessionStorage.setItem(`sim_active_${id_estacionamento}`, 'true');

    if (!silent) {
        console.log(`Simulador ATIVO (com UI) para Estacionamento ${id_estacionamento}.`);
        showToast("Simulação de sensor iniciada!", "success", 5000);
    } else {
        console.log(`Simulador ATIVO (silencioso) para Estacionamento ${id_estacionamento}.`);
    }
}

/**
 * Para o loop da simulação para um estacionamento.
 * @param {string} id_estacionamento - ID do estacionamento a parar.
 */
export function pararSimulador(id_estacionamento) {
    if (simulationIntervals.has(id_estacionamento)) {
        clearInterval(simulationIntervals.get(id_estacionamento));
        simulationIntervals.delete(id_estacionamento);
    }
    sessionStorage.removeItem(`sim_active_${id_estacionamento}`);
    console.log(`Simulador PARADO para Estacionamento ${id_estacionamento}.`);
    showToast("Simulação de sensor parada.", "info", 5000);
}