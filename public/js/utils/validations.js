// ============================================
// VALIDATIONS.JS - Validações dos campos descritos no enunciado
// Cada função retorna null quando o valor é válido, ou uma mensagem de
// erro pronta para exibir na tela quando não é. O backend valida tudo de
// novo (é a fonte da verdade); isto só evita round-trips desnecessários
// e dá feedback imediato no formulário.
// ============================================

// ---------- Usuários ----------
export function validarNome(nome) {
  if (!nome || nome.trim().length < 3) {
    return 'Nome deve ter no mínimo 3 caracteres.';
  }
  return null;
}

export function validarEmail(email) {
  const formatoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
  if (!formatoValido) {
    return 'Informe um e-mail válido.';
  }
  return null;
}

export function validarSenha(senha) {
  if (!senha || senha.length < 6) {
    return 'Senha deve ter no mínimo 6 caracteres.';
  }
  return null;
}

export function validarRole(role) {
  if (!['aluno', 'editor', 'admin'].includes(role)) {
    return 'Role deve ser aluno, editor ou admin.';
  }
  return null;
}

// ---------- Categorias ----------
export function validarNomeCategoria(nome) {
  if (!nome || nome.trim().length === 0) {
    return 'Nome da categoria é obrigatório.';
  }
  return null;
}

// ---------- Cursos ----------
export function validarTituloCurso(titulo) {
  if (!titulo || titulo.trim().length < 5) {
    return 'Título deve ter no mínimo 5 caracteres.';
  }
  return null;
}

export function validarStatusCurso(status) {
  if (!['rascunho', 'publicado'].includes(status)) {
    return 'Status deve ser rascunho ou publicado.';
  }
  return null;
}

export function validarCargaHoraria(cargaHoraria) {
  if (!(cargaHoraria > 0)) {
    return 'Carga horária deve ser um número positivo.';
  }
  return null;
}

// ---------- Aulas ----------
export function validarOrdemAula(ordem) {
  if (!Number.isInteger(ordem) || ordem <= 0) {
    return 'Ordem deve ser um número inteiro positivo.';
  }
  return null;
}

export function validarDuracaoAula(duracaoMinutos) {
  if (!(duracaoMinutos > 0)) {
    return 'Duração deve ser um número positivo.';
  }
  return null;
}

// ---------- Matrículas ----------
export function validarProgresso(progresso) {
  if (progresso < 0 || progresso > 100) {
    return 'Progresso deve estar entre 0 e 100.';
  }
  return null;
}

export function validarStatusMatricula(status) {
  if (!['em andamento', 'concluído'].includes(status)) {
    return 'Status deve ser "em andamento" ou "concluído".';
  }
  return null;
}

// ---------- Avaliações ----------
export function validarNota(nota) {
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    return 'Nota deve ser um número inteiro entre 1 e 5.';
  }
  return null;
}

export function validarComentario(comentario) {
  if (comentario && comentario.length > 500) {
    return 'Comentário deve ter no máximo 500 caracteres.';
  }
  return null;
}
