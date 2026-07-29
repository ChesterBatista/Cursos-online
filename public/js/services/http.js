// ============================================
// HTTP.JS - Cliente HTTP compartilhado por todos os services
// Centraliza a base URL, os headers de autenticação (Bearer token +
// X-User-Id, exigidos pelo middleware verificarAutenticacao do server.js)
// e o tratamento de erro padrão da API.
// ============================================

const API_BASE_URL = 'http://localhost:3000/api';

export async function request(endpoint, method = 'GET', dados = null) {
  const opcoes = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const token = localStorage.getItem('token');
  if (token) {
    opcoes.headers['Authorization'] = `Bearer ${token}`;
  }

  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
  if (usuario) {
    opcoes.headers['X-User-Id'] = usuario.id;
  }

  if (dados) {
    opcoes.body = JSON.stringify(dados);
  }

  const resposta = await fetch(`${API_BASE_URL}${endpoint}`, opcoes);

  // DELETE bem-sucedido retorna 204 sem corpo
  if (resposta.status === 204) {
    return null;
  }

  const corpo = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(corpo.erro || `Erro ${resposta.status}: ${resposta.statusText}`);
  }

  return corpo;
}
