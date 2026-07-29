// ============================================
// AUTH STORE - Gerenciamento de Autenticação
// ============================================

let usuarioLogado = null;
let listeners = [];

export function setUsuario(usuario, token) {
  usuarioLogado = usuario;
  localStorage.setItem('usuario', JSON.stringify(usuario));

  // O server.js exige Authorization + X-User-Id em toda rota /api (exceto /login).
  // Sem persistir o token aqui, getToken() nunca encontra nada e isLogado() fica
  // sempre falso, derrubando o usuário de volta pro login mesmo após autenticar.
  if (token) {
    localStorage.setItem('token', token);
  }

  notifyListeners();
}

export function getUsuario() {
  if (!usuarioLogado) {
    const stored = localStorage.getItem('usuario');
    if (stored) {
      usuarioLogado = JSON.parse(stored);
    }
  }
  return usuarioLogado;
}

export function getToken() {
  return localStorage.getItem('token');
}

export function isLogado() {
  return !!getToken() && !!getUsuario();
}

export function hasRole(role) {
  const usuario = getUsuario();
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

export function isAtivo() {
  const usuario = getUsuario();
  return usuario && usuario.ativo === true;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  usuarioLogado = null;
  notifyListeners();
  window.location.href = 'index.html';
}

// Sistema de listeners para atualizar UI
export function subscribe(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

function notifyListeners() {
  listeners.forEach(listener => listener(getUsuario()));
}

// Inicializar
getUsuario();