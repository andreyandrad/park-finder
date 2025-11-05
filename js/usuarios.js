import { showToast } from './ui.js';
import { initializeAuthUI, getUserRole } from './auth.js';
import * as api from './api.js';
import { showConfirm } from './modal.js';

async function carregarUsuarios() {
    const tbody = document.getElementById('usuarios-table-body');
    const emptyState = document.getElementById('empty-state');
    tbody.innerHTML = '<tr><td colspan="4">Carregando usuários...</td></tr>';
    emptyState.style.display = 'none';

    try {
        const data = await api.usuarios.getAll();
        tbody.innerHTML = '';
        
        const meuUsername = sessionStorage.getItem('username');

        if(data.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        data.forEach(user => {
            const tr = document.createElement('tr');
            
            const estacionamentos = user.estacionamentos.length > 0
                ? user.estacionamentos.map(e => e.nome).join(', ')
                : (user.role === 'superadmin' ? 'Todos' : 'Nenhum');
            
            tr.innerHTML = `
                <td>${user.username} ${user.username === meuUsername ? '(Você)' : ''}</td>
                <td>${user.role}</td>
                <td>${estacionamentos}</td>
                <td class="actions-cell">
                    <button class="btn-table-edit" data-id="${user.id_usuario}">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${user.username === meuUsername ? '' : `
                    <button class="btn-table-delete" data-id="${user.id_usuario}" data-username="${user.username}">
                        <i class="fas fa-trash"></i>
                    </button>
                    `}
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        tbody.querySelectorAll('.btn-table-edit').forEach(btn => 
            btn.addEventListener('click', e => {
                const id = e.currentTarget.dataset.id;
                window.location.href = `criar-usuario.html?id=${id}`;
            })
        );
        tbody.querySelectorAll('.btn-table-delete').forEach(btn => 
            btn.addEventListener('click', e => {
                handleExcluirUsuario(e.currentTarget.dataset.id, e.currentTarget.dataset.username);
            })
        );

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4">Erro ao carregar usuários.</td></tr>`;
        showToast(error.message, 'error');
    }
}

async function handleExcluirUsuario(id, username) {
    const confirmado = await showConfirm({
        title: "Confirmar Exclusão",
        message: `Tem certeza que deseja excluir o usuário "${username}"?`,
        isDanger: true
    });
    if (!confirmado) return;
    
    try {
        await api.usuarios.delete(id);
        showToast('Usuário excluído!', 'success');
        carregarUsuarios(); // Recarrega
    } catch (error) {
        showToast(error.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeAuthUI();
    if (getUserRole() !== 'superadmin') {
        alert('Acesso negado.');
        window.location.href = 'dashboard.html';
        return;
    }
    carregarUsuarios();
});