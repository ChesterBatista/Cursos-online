// ============================================
// AVALIACOES.JS - Endpoints de avaliações
// ============================================

import { request } from './http.js';

export const avaliacoesAPI = {
  listar: () => request('/avaliacoes'),
  buscar: (id) => request(`/avaliacoes/${id}`),
  criar: (dados) => request('/avaliacoes', 'POST', dados),
  atualizar: (id, dados) => request(`/avaliacoes/${id}`, 'PUT', dados),
  deletar: (id) => request(`/avaliacoes/${id}`, 'DELETE'),
};
