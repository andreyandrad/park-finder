import { showToast } from './ui.js';
import { initializeAuthUI } from './auth.js';
import * as api from './api.js';

async function carregarLogs() {
    const tbody = document.getElementById('logs-table-body');
    const emptyState = document.getElementById('empty-state');
    tbody.innerHTML = '<tr><td colspan="4">Carregando logs...</td></tr>';
    emptyState.style.display = 'none';

    try {
        const data = await api.logs.getAll();
        tbody.innerHTML = '';
        
        if(data.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        data.forEach(log => {
            const tr = document.createElement('tr');
            const saida = log.data_hora_saida ? 
                new Date(log.data_hora_saida).toLocaleString('pt-BR') : '---';
            const entrada = new Date(log.data_hora_entrada).toLocaleString('pt-BR');
            
            tr.innerHTML = `
                <td>${log.estacionamento_nome}</td>
                <td>${log.vaga_identificador}</td>
                <td>${entrada}</td>
                <td>${saida}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4">Erro ao carregar logs.</td></tr>`;
        showToast(error.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeAuthUI();
    carregarLogs();
});