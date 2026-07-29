// ============================================
// CURSOS.JS - Endpoints de cursos
// ============================================

import { request } from './http.js';

export const cursosAPI = {
  listar: () => request('/cursos'),
  buscar: (id) => request(`/cursos/${id}`),
  criar: (dados) => request('/cursos', 'POST', dados),
  atualizar: (id, dados) => request(`/cursos/${id}`, 'PUT', dados),
  deletar: (id) => request(`/cursos/${id}`, 'DELETE'),
  listarAulas: (cursoId) => request(`/cursos/${cursoId}/aulas`),
  listarAvaliacoes: (cursoId) => request(`/cursos/${cursoId}/avaliacoes`),
};
