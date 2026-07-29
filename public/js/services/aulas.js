// ============================================
// AULAS.JS - Endpoints de aulas
// ============================================

import { request } from './http.js';

export const aulasAPI = {
  listar: () => request('/aulas'),
  listarGerenciadas: () => request('/editor/aulas'),
  buscar: (id) => request(`/aulas/${id}`),
  criar: (dados) => request('/aulas', 'POST', dados),
  atualizar: (id, dados) => request(`/aulas/${id}`, 'PUT', dados),
  deletar: (id) => request(`/aulas/${id}`, 'DELETE'),
};
