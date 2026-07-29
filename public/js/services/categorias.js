// ============================================
// CATEGORIAS.JS - Endpoints de categorias
// ============================================

import { request } from './http.js';

export const categoriasAPI = {
  listar: () => request('/categorias'),
  buscar: (id) => request(`/categorias/${id}`),
  criar: (dados) => request('/categorias', 'POST', dados),
  atualizar: (id, dados) => request(`/categorias/${id}`, 'PUT', dados),
  deletar: (id) => request(`/categorias/${id}`, 'DELETE'),
  listarCursos: (categoriaId) => request(`/categorias/${categoriaId}/cursos`),
};
