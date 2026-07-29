// ============================================
// API - Serviço de Comunicação com o Backend
// ============================================

const API_BASE_URL = 'http://localhost:3000/api';

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function request(endpoint, method = 'GET', data = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Adiciona o token se existir
  const token = localStorage.getItem('token');
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  // Adiciona ID do usuário para autenticação simulada
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
  if (usuario) {
    options.headers['X-User-Id'] = usuario.id;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      throw new Error(responseData.erro || `Erro ${response.status}: ${response.statusText}`);
    }
    return responseData;
  } catch (error) {
    console.error('Erro na API:', error);
    throw error;
  }
}

// ============================================
// FUNÇÕES DE AUTENTICAÇÃO
// ============================================

export async function login(email, senha) {
  try {
    const resposta = await request('/login', 'POST', { email, senha });
    
    // Salvar token e dados do usuário
    localStorage.setItem('token', resposta.token);
    localStorage.setItem('usuario', JSON.stringify(resposta.usuario));
    
    return resposta;
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/index.html';
}

export function getUsuarioLogado() {
  const usuario = localStorage.getItem('usuario');
  return usuario ? JSON.parse(usuario) : null;
}

export function getToken() {
  return localStorage.getItem('token');
}

export function isLogado() {
  return !!getToken();
}

export function hasRole(role) {
  const usuario = getUsuarioLogado();
  return usuario && usuario.role === role;
}

export function isAdmin() {
  return hasRole('admin');
}

export function isEditor() {
  return hasRole('editor') || isAdmin();
}

export function isAluno() {
  return hasRole('aluno');
}

// ============================================
// ENDPOINTS - USUÁRIOS
// ============================================

export const usuariosAPI = {
  // Listar todos os usuários (apenas admin)
  listar: () => request('/usuarios'),
  
  // Buscar usuário por ID
  buscar: (id) => request(`/usuarios/${id}`),
  
  // Criar novo usuário (apenas admin)
  criar: (dados) => request('/usuarios', 'POST', dados),
  
  // Atualizar usuário (próprio perfil ou admin)
  atualizar: (id, dados) => request(`/usuarios/${id}`, 'PUT', dados),
  
  // Deletar usuário (apenas admin)
  deletar: (id) => request(`/usuarios/${id}`, 'DELETE'),
};

// ============================================
// ENDPOINTS - CATEGORIAS
// ============================================

export const categoriasAPI = {
  // Listar todas as categorias
  listar: () => request('/categorias'),
  
  // Buscar categoria por ID
  buscar: (id) => request(`/categorias/${id}`),
  
  // Criar nova categoria (apenas editor/admin)
  criar: (dados) => request('/categorias', 'POST', dados),
  
  // Atualizar categoria (apenas editor/admin)
  atualizar: (id, dados) => request(`/categorias/${id}`, 'PUT', dados),
  
  // Deletar categoria (apenas editor/admin)
  deletar: (id) => request(`/categorias/${id}`, 'DELETE'),
  
  // Listar cursos por categoria
  listarCursos: (categoriaId) => request(`/categorias/${categoriaId}/cursos`),
};

// ============================================
// ENDPOINTS - CURSOS
// ============================================

export const cursosAPI = {
  // Listar todos os cursos
  listar: () => request('/cursos'),
  
  // Buscar curso por ID
  buscar: (id) => request(`/cursos/${id}`),
  
  // Criar novo curso (apenas editor/admin)
  criar: (dados) => request('/cursos', 'POST', dados),
  
  // Atualizar curso (apenas editor/admin)
  atualizar: (id, dados) => request(`/cursos/${id}`, 'PUT', dados),
  
  // Deletar curso (apenas editor/admin)
  deletar: (id) => request(`/cursos/${id}`, 'DELETE'),
  
  // Listar aulas de um curso
  listarAulas: (cursoId) => request(`/cursos/${cursoId}/aulas`),
  
  // Listar avaliações de um curso
  listarAvaliacoes: (cursoId) => request(`/cursos/${cursoId}/avaliacoes`),
};

// ============================================
// ENDPOINTS - AULAS
// ============================================

export const aulasAPI = {
  // Listar todas as aulas
  listar: () => request('/aulas'),
  
  // Buscar aula por ID
  buscar: (id) => request(`/aulas/${id}`),
  
  // Criar nova aula (apenas editor/admin)
  criar: (dados) => request('/aulas', 'POST', dados),
  
  // Atualizar aula (apenas editor/admin)
  atualizar: (id, dados) => request(`/aulas/${id}`, 'PUT', dados),
  
  // Deletar aula (apenas editor/admin)
  deletar: (id) => request(`/aulas/${id}`, 'DELETE'),
};

// ============================================
// ENDPOINTS - MATRÍCULAS
// ============================================

export const matriculasAPI = {
  // Listar todas as matrículas
  listar: () => request('/matriculas'),
  
  // Buscar matrícula por ID
  buscar: (id) => request(`/matriculas/${id}`),
  
  // Criar nova matrícula (aluno)
  criar: (dados) => request('/matriculas', 'POST', dados),
  
  // Atualizar matrícula (aluno próprio ou admin)
  atualizar: (id, dados) => request(`/matriculas/${id}`, 'PUT', dados),
  
  // Deletar matrícula (apenas admin)
  deletar: (id) => request(`/matriculas/${id}`, 'DELETE'),
  
  // Listar matrículas de um usuário
  listarPorUsuario: (usuarioId) => request(`/usuarios/${usuarioId}/matriculas`),
};

// ============================================
// ENDPOINTS - AVALIAÇÕES
// ============================================

export const avaliacoesAPI = {
  // Listar todas as avaliações
  listar: () => request('/avaliacoes'),
  
  // Buscar avaliação por ID
  buscar: (id) => request(`/avaliacoes/${id}`),
  
  // Criar nova avaliação (aluno com curso concluído)
  criar: (dados) => request('/avaliacoes', 'POST', dados),
  
  // Atualizar avaliação (aluno próprio ou admin)
  atualizar: (id, dados) => request(`/avaliacoes/${id}`, 'PUT', dados),
  
  // Deletar avaliação (apenas admin)
  deletar: (id) => request(`/avaliacoes/${id}`, 'DELETE'),
};

// ============================================
// EXPORTAÇÃO PADRÃO
// ============================================

export default {
  login,
  logout,
  getUsuarioLogado,
  getToken,
  isLogado,
  isAdmin,
  isEditor,
  isAluno,
  usuarios: usuariosAPI,
  categorias: categoriasAPI,
  cursos: cursosAPI,
  aulas: aulasAPI,
  matriculas: matriculasAPI,
  avaliacoes: avaliacoesAPI,
};