// ============================================
// MATRICULAS.JS - Endpoints de matrículas
// ============================================

import { request } from './http.js';

export const matriculasAPI = {
  listar: () => request('/matriculas'),
  buscar: (id) => request(`/matriculas/${id}`),
  criar: (dados) => request('/matriculas', 'POST', dados),
  atualizar: (id, dados) => request(`/matriculas/${id}`, 'PUT', dados),
  deletar: (id) => request(`/matriculas/${id}`, 'DELETE'),
  listarPorUsuario: (usuarioId) => request(`/usuarios/${usuarioId}/matriculas`),
};
