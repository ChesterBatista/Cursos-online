// ============================================
// PERMISSIONS.JS - Regras de permissão por role
// Espelha, no frontend, as regras de negócio de aluno/editor/admin
// descritas no enunciado (o backend é a fonte da verdade; isto só
// evita mostrar/habilitar ações que o servidor recusaria).
// ============================================

export function isAluno(usuario) {
  return !!usuario && usuario.role === 'aluno';
}

export function isEditor(usuario) {
  return !!usuario && (usuario.role === 'editor' || usuario.role === 'admin');
}

export function isAdmin(usuario) {
  return !!usuario && usuario.role === 'admin';
}

// CRUD de cursos, aulas e categorias: restrito a editor/admin
export function podeGerenciarConteudo(usuario) {
  return isEditor(usuario);
}

// CRUD de usuários e troca de role/status: restrito ao admin
export function podeGerenciarUsuarios(usuario) {
  return isAdmin(usuario);
}

// Só aluno se matricula (editor/admin gerenciam, não consomem como aluno)
export function podeMatricular(usuario) {
  return isAluno(usuario);
}

// Só pode avaliar quem é aluno e tem a matrícula concluída no curso
export function podeAvaliar(usuario, matricula) {
  return isAluno(usuario) && !!matricula && matricula.status === 'concluído';
}

// Cada usuário edita o próprio perfil; admin edita qualquer perfil
export function podeEditarPerfil(usuario, usuarioAlvoId) {
  return !!usuario && (usuario.id === usuarioAlvoId || isAdmin(usuario));
}

// Aluno não pode alterar o próprio role nem o de terceiros
export function podeAlterarRoleOuStatus(usuario) {
  return isAdmin(usuario);
}

// Aluno só enxerga cursos publicados; editor/admin também veem rascunhos
export function podeVerRascunhos(usuario) {
  return isEditor(usuario);
}

// Usada na proteção de rotas: quem pode abrir cada página protegida
export function podeAcessarPagina(usuario, pagina) {
  if (pagina === 'admin.html') {
    return isAdmin(usuario);
  }
  if (pagina === 'editor.html') {
    return isEditor(usuario);
  }
  return true;
}
