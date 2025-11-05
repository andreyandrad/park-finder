import { postCheckIn, putCheckOut } from './api.js';
import { showToast } from './ui.js';

let simulationInterval = null; // Armazena o ID do setInterval

/**
 * A função principal do "sensor fantasma".
 * @param {Function} getState - Função que retorna o estado atual das vagas.
 * @param {Function} refreshState - Função para forçar a atualização do mapa.
 * @param {string} id_estacionamento - ID do estacionamento a simular.
 */
async function simularAtividadeSensor(getState, refreshState, id_estacionamento) {
    const estadoAtualVagas = getState();
    if (estadoAtualVagas.length === 0) return;

    // Garante que estamos simulando apenas vagas deste estacionamento
    const vagasDoEstacionamento = estadoAtualVagas.filter(v => v.id_estacionamento_fk == id_estacionamento);
    
    const vagasLivre = vagasDoEstacionamento.filter(v => v.status === 'livre');
    const vagasOcupadas = vagasDoEstacionamento.filter(v => v.status === 'ocupada');
    const acaoCheckIn = Math.random() > 0.5;

    try {
        if (acaoCheckIn && vagasLivre.length > 0) {
            // --- Simular um CHECK-IN ---
            const vagaEscolhida = vagasLivre[Math.floor(Math.random() * vagasLivre.length)];
            
            console.log(`[SIMULADOR] Check-in na vaga ${vagaEscolhida.identificador}`);
            await postCheckIn(vagaEscolhida.id_vaga);
            
            showToast(`Sensor: Vaga ${vagaEscolhida.identificador} foi ocupada.`, 'info');
            refreshState(); // Força a atualização do mapa

        } else if (!acaoCheckIn && vagasOcupadas.length > 0) {
            // --- Simular um CHECK-OUT ---
            const vagaEscolhida = vagasOcupadas[Math.floor(Math.random() * vagasOcupadas.length)];
            
            console.log(`[SIMULADOR] Check-out da vaga ${vagaEscolhida.identificador}`);
            await putCheckOut(vagaEscolhida.id_registro);

            showToast(`Sensor: Vaga ${vagaEscolhida.identificador} foi liberada.`, 'info');
            refreshState(); // Força a atualização do mapa
        }
    } catch (error) {
        console.error('[SIMULADOR] Erro:', error);
        // Não poluir a tela do usuário com toasts de erro da simulação
    }
}

/**
 * Inicia o loop da simulação.
 * @param {Function} getState - Função que retorna o estado atual das vagas.
 * @param {Function} refreshState - Função para forçar a atualização do mapa.
 * @param {string} id_estacionamento - ID do estacionamento a simular.
 */
export function iniciarSimulador(getState, refreshState, id_estacionamento) {
    if (simulationInterval) return; // Já está rodando

    const INTERVALO_SIMULACAO = 15000; // 15 segundos
    simulationInterval = setInterval(
        () => simularAtividadeSensor(getState, refreshState, id_estacionamento), 
        INTERVALO_SIMULACAO
    );
    console.log(`Simulador ATIVO para Estacionamento ${id_estacionamento}.`);
    showToast("Simulação de sensor iniciada!", "success", 5000);
}

/**
 * Para o loop da simulação (não usado ainda, mas é uma boa prática).
 */
export function pararSimulador() {
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
        console.log("Simulador de sensor PARADO.");
        showToast("Simulação de sensor parada.", "info", 5000);
    }
}