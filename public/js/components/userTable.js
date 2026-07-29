// ============================================
// USERTABLE.JS - Linhas da tabela de usuários (admin.html)
// ============================================

// Recebe um array de usuários e retorna o HTML de todas as <tr>
export function criarLinhasUsuarios(usuarios) {
  let html = '';

  for (const usuario of usuarios) {
    html += criarLinhaUsuario(usuario);
  }

  return html;
}

function criarLinhaUsuario(usuario) {
  const statusBadge = usuario.ativo
    ? '<span class="badge badge-success">Ativo</span>'
    : '<span class="badge badge-danger">Inativo</span>';

  const acaoLabel = usuario.ativo ? 'Desativar' : 'Ativar';

  return `
    <tr data-id="${usuario.id}">
      <td>${usuario.nome}</td>
      <td>${usuario.email}</td>
      <td>
        <select class="role-select" data-id="${usuario.id}">
          <option value="aluno" ${usuario.role === 'aluno' ? 'selected' : ''}>Aluno</option>
          <option value="editor" ${usuario.role === 'editor' ? 'selected' : ''}>Editor</option>
          <option value="admin" ${usuario.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </td>
      <td>${statusBadge}</td>
      <td class="actions-cell">
        <button type="button" class="btn btn-secondary btn-sm toggle-status-btn" data-id="${usuario.id}">
          ${acaoLabel}
        </button>
      </td>
    </tr>
  `;
}
