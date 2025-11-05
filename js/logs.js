// Importa apenas a função que precisa
import { showToast } from './ui.js';

async function carregarLogs() {
    const tbody = document.getElementById('logs-table-body');
    tbody.innerHTML = '<tr><td colspan="5">Carregando logs...</td></tr>';

    try {
        // (No futuro, você pode adicionar filtros na URL, ex: api/logs.php?id_est=1)
        const response = await fetch('api/logs.php', { credentials: 'include' });
        
        if (response.status === 401) {
            window.location.href = 'login.html';
            return;
        }
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message);
        }

        tbody.innerHTML = ''; // Limpa o "carregando"
        
        if(data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">Nenhum registro encontrado.</td></tr>';
            return;
        }

        data.forEach(log => {
            const tr = document.createElement('tr');
            
            const saida = log.data_hora_saida ? 
                new Date(log.data_hora_saida).toLocaleString('pt-BR') : '---';
            
            const entrada = new Date(log.data_hora_entrada).toLocaleString('pt-BR');
            
            const valor = log.valor_total ? 
                parseFloat(log.valor_total).toFixed(2) : '---';

            tr.innerHTML = `
                <td>${log.estacionamento_nome}</td>
                <td>${log.vaga_identificador}</td>
                <td>${entrada}</td>
                <td>${saida}</td>
                <td>${valor}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5">Erro ao carregar logs.</td></tr>`;
        showToast(error.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', carregarLogs);