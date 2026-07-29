// ============================================
// HEADER.JS - Header dinâmico conforme o role do usuário
// ============================================

import * as auth from '../store/authStore.js';

// Retorna a string HTML completa do <header>, com os links de navegação
// e o badge do usuário logado ajustados conforme o role.
export function criarHeader(usuario) {
  const paginaAtual = window.location.pathname.split('/').pop() || 'index.html';

  return `
    <header class="site-header" id="site-header">
      <div class="container">
        <a href="catalogo.html" class="logo">MC Cursos</a>

        <button type="button" class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="main-nav">
          <span class="visually-hidden">Abrir menu</span>
          ☰
        </button>

        <nav class="main-nav" id="main-nav" aria-label="Navegação principal">
          <ul id="main-nav-list">
            ${criarLinks(usuario, paginaAtual)}
            ${criarUserBadge(usuario)}
          </ul>
        </nav>
      </div>
    </header>
  `;
}

// Monta os links de navegação de acordo com o role do usuário
function criarLinks(usuario, paginaAtual) {
  const itens = [
    { href: 'catalogo.html', label: 'Catálogo' },
    { href: 'perfil.html', label: 'Perfil' },
  ];

  if (auth.isEditor()) {
    itens.push({ href: 'editor.html', label: 'Dashboard' });
  }

  if (auth.isAdmin()) {
    itens.push({ href: 'admin.html', label: 'Admin' });
  }

  let html = '';
  for (const item of itens) {
    const classeAtiva = item.href === paginaAtual ? ' class="active"' : '';
    html += `<li><a href="${item.href}"${classeAtiva}>${item.label}</a></li>`;
  }

  return html;
}

function criarUserBadge(usuario) {
  return `
    <li class="user-badge">
      <span>${usuario.nome}</span>
      <span class="user-role">${usuario.role}</span>
      <button type="button" id="logout-btn" class="btn btn-secondary btn-sm">Sair</button>
    </li>
  `;
}
