import { showToast } from './ui.js';
import { initializeAuthUI, getUserRole } from './auth.js';
import * as api from './api.js';
import { showConfirm } from './modal.js';

const urlParams = new URLSearchParams(window.location.search);
const ID_USUARIO = urlParams.get('id'); 
const isEditing = !!ID_USUARIO;

const form = document.getElementById('form-usuario');
const feedback = document.getElementById('form-feedback');
const selectRole = document.getElementById('role');
const containerEstacionamentos = document.getElementById('estacionamentos-container');
const chkListEstacionamentos = document.getElementById('estacionamentos-checkbox-list');
const passwordInput = document.getElementById('password');
const toggleButton = document.getElementById('password-toggle');

async function carregarEstacionamentos() {
    try {
        const data = await api.estacionamentos.getAll();
        chkListEstacionamentos.innerHTML = '';
        if (data.length === 0) {
            chkListEstacionamentos.innerHTML = '<p>Nenhum estacionamento criado.</p>';
            return;
        }
        data.forEach(est => {
            chkListEstacionamentos.innerHTML += `
                <label>
                    <input type="checkbox" value="${est.id_estacionamento}">
                    ${est.nome}
                </label>
            `;
        });
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function carregarDadosUsuario() {
    document.getElementById('main-title').textContent = 'Editar Usuário';
    passwordInput.placeholder = 'Deixe em branco para não alterar';
    
    try {
        const usuarios = await api.usuarios.getAll();
        const usuario = usuarios.find(u => u.id_usuario == ID_USUARIO);
        
        if (!usuario) throw new Error('Usuário não encontrado.');
        
        document.getElementById('id_usuario').value = usuario.id_usuario;
        document.getElementById('username').value = usuario.username;
        document.getElementById('role').value = usuario.role;
        
        if (usuario.role === 'gerente') {
            containerEstacionamentos.style.display = 'block';
            const idsAssociados = usuario.estacionamentos.map(e => e.id_estacionamento.toString());
            chkListEstacionamentos.querySelectorAll('input[type="checkbox"]').forEach(chk => {
                if (idsAssociados.includes(chk.value)) {
                    chk.checked = true;
                }
            });
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    feedback.textContent = '';
    
    const estacionamentosSelecionados = Array.from(chkListEstacionamentos.querySelectorAll('input:checked'))
                                             .map(chk => chk.value);
    
    const payload = {
        id_usuario: document.getElementById('id_usuario').value,
        username: document.getElementById('username').value,
        password: passwordInput.value,
        role: document.getElementById('role').value,
        estacionamentos: estacionamentosSelecionados
    };
    
    // Validação
    if (!isEditing && !payload.password) {
        feedback.textContent = "Senha é obrigatória para criar novo usuário.";
        return;
    }
    
    try {
        let message = '';
        if (isEditing) {
            await api.usuarios.update(payload);
            message = 'Usuário atualizado com sucesso!';
        } else {
            await api.usuarios.create(payload);
            message = 'Usuário criado com sucesso!';
        }
        showToast(message, 'success');
        setTimeout(() => window.location.href = 'usuarios.html', 1000);
        
    } catch (error) {
        feedback.textContent = error.message;
        showToast(error.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    initializeAuthUI();
    if (getUserRole() !== 'superadmin') {
        alert('Acesso negado.');
        window.location.href = 'dashboard.html';
        return;
    }
    
    await carregarEstacionamentos();
    
    if (isEditing) {
        await carregarDadosUsuario();
    } else {
        if (selectRole.value === 'gerente') {
            containerEstacionamentos.style.display = 'block';
        }
    }

    selectRole.addEventListener('change', (e) => {
        containerEstacionamentos.style.display = (e.target.value === 'gerente') ? 'block' : 'none';
    });
    
    form.addEventListener('submit', handleSubmit);
    
    toggleButton.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        toggleButton.classList.toggle('fa-eye');
        toggleButton.classList.toggle('fa-eye-slash');
    });
});