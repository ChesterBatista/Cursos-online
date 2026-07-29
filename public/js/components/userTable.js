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
  const iniciais = usuario.nome
    .split(' ')
    .slice(0, 2)
    .map(parte => parte.charAt(0))
    .join('')
    .toUpperCase();
  const statusBadge = usuario.ativo
    ? '<span class="badge badge-success">Ativo</span>'
    : '<span class="badge badge-danger">Inativo</span>';

  const acaoLabel = usuario.ativo ? 'Desativar' : 'Ativar';
  const acaoClasse = usuario.ativo ? 'admin-action--deactivate' : 'admin-action--activate';

  return `
    <tr data-id="${usuario.id}">
      <td>
        <div class="user-identity">
          <span class="user-avatar" aria-hidden="true">${iniciais}</span>
          <strong>${usuario.nome}</strong>
        </div>
      </td>
      <td><a class="user-email" href="mailto:${usuario.email}">${usuario.email}</a></td>
      <td>
        <select class="role-select" data-id="${usuario.id}">
          <option value="aluno" ${usuario.role === 'aluno' ? 'selected' : ''}>Aluno</option>
          <option value="editor" ${usuario.role === 'editor' ? 'selected' : ''}>Editor</option>
          <option value="admin" ${usuario.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </td>
      <td>${statusBadge}</td>
      <td class="actions-cell">
        <button type="button" class="btn btn-sm toggle-status-btn admin-action ${acaoClasse}" data-id="${usuario.id}">
          ${acaoLabel}
        </button>
        <button type="button" class="btn btn-sm edit-user-btn admin-row-edit" data-id="${usuario.id}">
          Editar
        </button>
        <button type="button" class="btn btn-sm delete-user-btn admin-row-delete" data-id="${usuario.id}">
          Excluir
        </button>
      </td>
    </tr>
  `;
}
