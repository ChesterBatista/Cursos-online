// ============================================
// USUARIOS.JS - Endpoints de autenticação e usuários
// ============================================

import { request } from './http.js';

export const usuariosAPI = {
  login: (email, senha) => request('/login', 'POST', { email, senha }),
  listar: () => request('/usuarios'),
  buscar: (id) => request(`/usuarios/${id}`),
  criar: (dados) => request('/usuarios', 'POST', dados),
  atualizar: (id, dados) => request(`/usuarios/${id}`, 'PUT', dados),
  deletar: (id) => request(`/usuarios/${id}`, 'DELETE'),
};
