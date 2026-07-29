// ============================================
// MAIN.JS - Ponto de entrada compartilhado por todas as páginas
// Login, proteção de rotas, header dinâmico, catálogo, detalhes do curso,
// perfil (dados + matrículas), admin (usuários) e editor (cursos/aulas/categorias)
// ============================================

import * as auth from './store/authStore.js';
import { usuariosAPI } from './services/usuarios.js';
import { categoriasAPI } from './services/categorias.js';
import { cursosAPI } from './services/cursos.js';
import { aulasAPI } from './services/aulas.js';
import { matriculasAPI } from './services/matriculas.js';
import { avaliacoesAPI } from './services/avaliacoes.js';
import { criarHeader } from './components/header.js';
import { criarCourseCard } from './components/courseCard.js';
import { criarLinhasUsuarios } from './components/userTable.js';
import * as permissoes from './utils/permissions.js';
import {
  confirmarAcao,
  mostrarErro,
  mostrarSucesso,
  mostrarAviso,
  mostrarToast,
} from './utils/alerts.js';
import {
  validarNome,
  validarEmail,
  validarSenha,
  validarTituloCurso,
  validarStatusCurso,
  validarCargaHoraria,
  validarOrdemAula,
  validarDuracaoAula,
  validarNomeCategoria,
  validarNota,
  validarComentario,
} from './utils/validations.js';

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  if (protegerRota()) {
    return;
  }

  renderizarHeader();
  configurarFormularioLogin();
  configurarCatalogo();
  configurarPaginaCurso();
  configurarPerfil();
  configurarAdmin();
  configurarEditor();
});

function paginaAtual() {
  return window.location.pathname.split('/').pop() || 'index.html';
}

// Mostra/some um alerta reaproveitando as classes .alert-success/.alert-error já no CSS
function exibirAlerta(elemento, mensagem, erro) {
  elemento.textContent = mensagem;
  elemento.classList.toggle('alert-error', erro);
  elemento.classList.toggle('alert-success', !erro);
  elemento.hidden = false;
}

function buscarPorId(lista, id) {
  for (const item of lista) {
    if (item.id === id) {
      return item;
    }
  }
  return null;
}

// ============================================
// PROTEÇÃO DE ROTAS
// - Não logado só acessa a index.html
// - editor.html exige role editor/admin
// - admin.html exige role admin
// Retorna true quando um redirecionamento foi disparado, para o chamador
// interromper o resto da inicialização (evita chamadas de API fadadas a 401/403).
// ============================================
function protegerRota() {
  const pagina = paginaAtual();

  if (!auth.isLogado()) {
    if (pagina !== 'index.html') {
      window.location.href = 'index.html';
      return true;
    }
    return false;
  }

  if (!permissoes.podeAcessarPagina(auth.getUsuario(), pagina)) {
    window.location.href = 'catalogo.html';
    return true;
  }

  return false;
}

// ============================================
// HEADER DINÂMICO
// ============================================
function renderizarHeader() {
  const headerAtual = document.getElementById('site-header');
  const usuario = auth.getUsuario();

  if (!headerAtual || !usuario) {
    return;
  }

  headerAtual.outerHTML = criarHeader(usuario);

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', auth.logout);
  }
}

// ============================================
// LOGIN
// ============================================
function configurarFormularioLogin() {
  const loginForm = document.getElementById('login-form');

  if (!loginForm) {
    return;
  }

  loginForm.addEventListener('submit', tratarLogin);
}

async function tratarLogin(evento) {
  evento.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  const erroEmail = validarEmail(email);
  const erroSenha = senha ? null : 'Informe sua senha.';

  exibirErroCampo('email-error', erroEmail);
  exibirErroCampo('senha-error', erroSenha);

  if (erroEmail || erroSenha) {
    return;
  }

  try {
    const resposta = await usuariosAPI.login(email, senha);
    const { usuario, token } = resposta;

    auth.setUsuario(usuario, token);
    redirecionarPorRole();
  } catch (error) {
    exibirErroLogin(error.message);
  }
}

function redirecionarPorRole() {
  if (auth.isAdmin()) {
    window.location.href = 'admin.html';
  } else if (auth.isEditor()) {
    window.location.href = 'editor.html';
  } else {
    window.location.href = 'catalogo.html';
  }
}

function exibirErroLogin(mensagem) {
  const alertaLogin = document.getElementById('login-alert');

  if (alertaLogin) {
    alertaLogin.hidden = true;
  }

  mostrarErro(
    mensagem || 'Não foi possível fazer login. Tente novamente.',
    'Não foi possível entrar'
  );
}

function exibirErroCampo(id, mensagem) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = mensagem || '';
  }
}

// ============================================
// CATÁLOGO DE CURSOS
// ============================================
let todosCursos = [];
let todasCategorias = [];

async function configurarCatalogo() {
  const grid = document.getElementById('catalogo-grid');

  if (!grid) {
    return;
  }

  const loading = document.getElementById('catalogo-loading');
  const vazio = document.getElementById('catalogo-empty');
  const form = document.getElementById('catalog-filter-form');
  const selectCategoria = document.getElementById('filtro-categoria');
  const inputBusca = document.getElementById('filtro-busca');
  const chipsContainer = document.getElementById('category-chips');

  try {
    const [cursos, categorias] = await Promise.all([cursosAPI.listar(), categoriasAPI.listar()]);

    todosCursos = filtrarPublicados(cursos);
    todasCategorias = categorias;

    popularFiltroCategoria(selectCategoria, categorias);
    popularChipsCategoria(chipsContainer, categorias, selectCategoria);
    renderizarCursos(todosCursos);
  } catch (error) {
    vazio.textContent = 'Não foi possível carregar os cursos.';
    vazio.hidden = false;
  } finally {
    loading.hidden = true;
  }

  function aplicarFiltros() {
    const termo = inputBusca.value.trim().toLowerCase();
    const categoriaId = selectCategoria.value;
    const filtrados = [];

    for (const curso of todosCursos) {
      const combinaBusca = !termo || curso.titulo.toLowerCase().includes(termo);
      const combinaCategoria = !categoriaId || curso.categoriaId === categoriaId;

      if (combinaBusca && combinaCategoria) {
        filtrados.push(curso);
      }
    }

    renderizarCursos(filtrados);
    marcarChipAtivo(chipsContainer, categoriaId);
  }

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    aplicarFiltros();
  });

  form.addEventListener('reset', () => {
    window.setTimeout(aplicarFiltros, 0);
  });

  inputBusca.addEventListener('input', aplicarFiltros);
  selectCategoria.addEventListener('change', aplicarFiltros);
}

function filtrarPublicados(cursos) {
  const publicados = [];

  for (const curso of cursos) {
    if (curso.status === 'publicado') {
      publicados.push(curso);
    }
  }

  return publicados;
}

function popularFiltroCategoria(select, categorias) {
  for (const categoria of categorias) {
    const option = document.createElement('option');
    option.value = categoria.id;
    option.textContent = categoria.nome;
    select.appendChild(option);
  }
}

function popularChipsCategoria(container, categorias, selectCategoria) {
  let html = '<li><button type="button" class="active" data-categoria-id="">Todas</button></li>';

  for (const categoria of categorias) {
    html += `<li><button type="button" data-categoria-id="${categoria.id}">${categoria.nome}</button></li>`;
  }

  container.innerHTML = html;

  container.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button');

    if (!botao) {
      return;
    }

    selectCategoria.value = botao.dataset.categoriaId;
    selectCategoria.dispatchEvent(new Event('change'));
  });
}

function marcarChipAtivo(container, categoriaId) {
  const botoes = container.querySelectorAll('button');

  for (const botao of botoes) {
    botao.classList.toggle('active', botao.dataset.categoriaId === categoriaId);
  }
}

function renderizarCursos(cursos) {
  const grid = document.getElementById('catalogo-grid');
  const vazio = document.getElementById('catalogo-empty');

  if (cursos.length === 0) {
    grid.innerHTML = '';
    vazio.hidden = false;
    return;
  }

  vazio.hidden = true;

  let html = '';
  for (const curso of cursos) {
    const categoria = buscarPorId(todasCategorias, curso.categoriaId);
    html += criarCourseCard(curso, categoria ? categoria.nome : '');
  }

  grid.innerHTML = html;
}

// ============================================
// DETALHES DO CURSO
// ============================================
async function configurarPaginaCurso() {
  const tituloEl = document.getElementById('course-title');

  if (!tituloEl) {
    return;
  }

  const cursoId = new URLSearchParams(window.location.search).get('id');

  if (!cursoId) {
    window.location.href = 'catalogo.html';
    return;
  }

  try {
    const curso = await cursosAPI.buscar(cursoId);
    const [categoria, instrutor, aulas, avaliacoes] = await Promise.all([
      categoriasAPI.buscar(curso.categoriaId),
      usuariosAPI.buscar(curso.instrutorId),
      cursosAPI.listarAulas(cursoId),
      cursosAPI.listarAvaliacoes(cursoId),
    ]);

    renderizarInfoCurso(curso, categoria, instrutor, aulas);
    renderizarAulas(aulas);
    await renderizarAvaliacoes(avaliacoes);
    await configurarMatricula(curso);
  } catch (error) {
    tituloEl.textContent = 'Curso não encontrado';
  }
}

function renderizarInfoCurso(curso, categoria, instrutor, aulas) {
  document.getElementById('course-category').textContent = categoria.nome;
  document.getElementById('course-title').textContent = curso.titulo;
  document.getElementById('course-description').textContent = curso.descricao;
  document.getElementById('course-instructor').textContent = instrutor.nome;
  document.getElementById('course-duration').textContent = `${curso.cargaHoraria}h de carga horária`;

  document.getElementById('sidebar-category').textContent = categoria.nome;
  document.getElementById('sidebar-duration').textContent = `${curso.cargaHoraria}h`;
  document.getElementById('sidebar-lesson-count').textContent = `${aulas.length} aula(s)`;
  document.getElementById('sidebar-status').textContent = curso.status === 'publicado' ? 'Publicado' : 'Rascunho';
}

function renderizarAulas(aulas) {
  const lista = document.getElementById('lesson-list');
  const vazio = document.getElementById('lessons-empty');

  if (aulas.length === 0) {
    lista.innerHTML = '';
    vazio.hidden = false;
    return;
  }

  vazio.hidden = true;

  let html = '';
  for (const aula of aulas) {
    html += `
      <li>
        <span class="lesson-order">${aula.ordem}</span>
        <span>${aula.titulo}</span>
        <span class="lesson-duration">${aula.duracaoMinutos} min</span>
      </li>
    `;
  }

  lista.innerHTML = html;
}

async function renderizarAvaliacoes(avaliacoes) {
  const lista = document.getElementById('review-list');
  const vazio = document.getElementById('reviews-empty');

  if (avaliacoes.length === 0) {
    lista.innerHTML = '';
    vazio.hidden = false;
    return;
  }

  vazio.hidden = true;

  let html = '';
  for (const avaliacao of avaliacoes) {
    const autor = await usuariosAPI.buscar(avaliacao.usuarioId);
    html += `
      <div class="review-item">
        <div class="review-item__header">
          <span class="review-item__author">${autor.nome}</span>
          <span class="review-item__rating">${'★'.repeat(avaliacao.nota)}</span>
        </div>
        <p class="review-item__comment">${avaliacao.comentario || ''}</p>
      </div>
    `;
  }

  lista.innerHTML = html;
}

// Exibe progresso/matrícula para aluno; editor/admin não matriculam (elementos ficam ocultos)
async function configurarMatricula(curso) {
  if (!auth.isAluno()) {
    return;
  }

  const usuario = auth.getUsuario();
  const progressoWrapper = document.getElementById('course-progress-wrapper');
  const enrollButton = document.getElementById('enroll-button');
  const reviewSection = document.getElementById('review-form-section');

  const matriculas = await matriculasAPI.listarPorUsuario(usuario.id);
  const matricula = buscarMatriculaPorCurso(matriculas, curso.id);

  if (!matricula) {
    enrollButton.hidden = false;
    enrollButton.addEventListener('click', () => {
      matricularUsuario(usuario.id, curso.id, enrollButton, progressoWrapper, reviewSection);
    });
    return;
  }

  progressoWrapper.hidden = false;
  document.getElementById('course-progress-value').textContent = `${matricula.progresso}%`;
  document.getElementById('course-progress-fill').style.width = `${matricula.progresso}%`;

  if (matricula.status === 'concluído') {
    reviewSection.hidden = false;
    configurarFormularioAvaliacao(usuario.id, curso.id);
  }
}

function buscarMatriculaPorCurso(matriculas, cursoId) {
  for (const matricula of matriculas) {
    if (matricula.cursoId === cursoId) {
      return matricula;
    }
  }
  return null;
}

async function matricularUsuario(usuarioId, cursoId, enrollButton, progressoWrapper, reviewSection) {
  const textoOriginal = enrollButton.textContent;
  enrollButton.disabled = true;
  enrollButton.textContent = 'Matriculando...';

  try {
    const matricula = await matriculasAPI.criar({
      usuarioId,
      cursoId,
      dataMatricula: new Date().toISOString(),
      progresso: 0,
      status: 'em andamento',
    });
    enrollButton.hidden = true;
    progressoWrapper.hidden = false;
    document.getElementById('course-progress-value').textContent = `${matricula.progresso}%`;
    document.getElementById('course-progress-fill').style.width = `${matricula.progresso}%`;

    if (matricula.progresso === 100) {
      reviewSection.hidden = false;
      configurarFormularioAvaliacao(usuarioId, cursoId);
    }
    mostrarSucesso('Sua matrícula foi confirmada. Bons estudos!', 'Matrícula realizada!');
  } catch (error) {
    mostrarErro(error.message || 'Não foi possível concluir a matrícula.');
    enrollButton.disabled = false;
    enrollButton.textContent = textoOriginal;
  }
}

function configurarFormularioAvaliacao(usuarioId, cursoId) {
  const form = document.getElementById('review-form');

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const nota = Number(document.getElementById('review-nota').value);
    const comentario = document.getElementById('review-comentario').value;
    const alerta = document.getElementById('review-alert');

    const erroValidacao = validarNota(nota) || validarComentario(comentario);
    if (erroValidacao) {
      exibirAlerta(alerta, erroValidacao, true);
      return;
    }

    try {
      await avaliacoesAPI.criar({ usuarioId, cursoId, nota, comentario });
      alerta.hidden = true;
      mostrarSucesso('Sua avaliação foi enviada.', 'Obrigado pela avaliação!');
      form.reset();
    } catch (error) {
      mostrarErro(error.message || 'Não foi possível enviar sua avaliação.');
    }
  });
}

// ============================================
// PERFIL (dados pessoais + matrículas)
// ============================================
function configurarPerfil() {
  const form = document.getElementById('profile-form');

  if (!form) {
    return;
  }

  const usuario = auth.getUsuario();
  document.getElementById('profile-nome').value = usuario.nome;
  document.getElementById('profile-email').value = usuario.email;
  document.getElementById('profile-hero-name').textContent = usuario.nome;
  document.getElementById('profile-hero-role').textContent = usuario.role;
  document.getElementById('profile-hero-avatar').textContent = usuario.nome
    .split(' ')
    .slice(0, 2)
    .map(parte => parte.charAt(0))
    .join('')
    .toUpperCase();

  form.addEventListener('submit', tratarAtualizarPerfil);
  carregarMatriculas(usuario.id);
}

async function tratarAtualizarPerfil(evento) {
  evento.preventDefault();

  const alerta = document.getElementById('profile-alert');
  const usuario = auth.getUsuario();
  const nome = document.getElementById('profile-nome').value;
  const email = document.getElementById('profile-email').value;
  const senhaAtual = document.getElementById('profile-senha-atual').value;
  const senhaNova = document.getElementById('profile-senha-nova').value;
  const senhaConfirmar = document.getElementById('profile-senha-confirmar').value;

  const erroNome = validarNome(nome);
  if (erroNome) {
    exibirAlerta(alerta, erroNome, true);
    return;
  }

  const erroEmail = validarEmail(email);
  if (erroEmail) {
    exibirAlerta(alerta, erroEmail, true);
    return;
  }

  const dados = { nome, email };

  if (senhaAtual || senhaNova || senhaConfirmar) {
    if (!senhaAtual || !senhaNova) {
      exibirAlerta(alerta, 'Preencha a senha atual e a nova senha.', true);
      return;
    }
    if (senhaNova !== senhaConfirmar) {
      exibirAlerta(alerta, 'A confirmação de senha não confere.', true);
      return;
    }
    const erroSenha = validarSenha(senhaNova);
    if (erroSenha) {
      exibirAlerta(alerta, erroSenha, true);
      return;
    }
    dados.senha = senhaNova;
  }

  try {
    const usuarioAtualizado = await usuariosAPI.atualizar(usuario.id, dados);
    auth.setUsuario({ ...usuario, ...usuarioAtualizado }, auth.getToken());
    alerta.hidden = true;
    mostrarToast('Perfil atualizado com sucesso');
    document.getElementById('profile-hero-name').textContent = usuarioAtualizado.nome;
    document.getElementById('profile-hero-avatar').textContent = usuarioAtualizado.nome
      .split(' ')
      .slice(0, 2)
      .map(parte => parte.charAt(0))
      .join('')
      .toUpperCase();

    document.getElementById('profile-senha-atual').value = '';
    document.getElementById('profile-senha-nova').value = '';
    document.getElementById('profile-senha-confirmar').value = '';
  } catch (error) {
    mostrarErro(error.message || 'Não foi possível atualizar seus dados.');
  }
}

async function carregarMatriculas(usuarioId) {
  const lista = document.getElementById('enrollment-list');
  const vazio = document.getElementById('enrollment-empty');

  try {
    const matriculas = await matriculasAPI.listarPorUsuario(usuarioId);
    const contador = document.getElementById('profile-enrollment-count');
    contador.textContent = `${matriculas.length} ${matriculas.length === 1 ? 'curso' : 'cursos'}`;

    if (matriculas.length === 0) {
      lista.innerHTML = '';
      vazio.hidden = false;
      return;
    }

    vazio.hidden = true;

    let html = '';
    for (const matricula of matriculas) {
      const curso = await cursosAPI.buscar(matricula.cursoId);
      html += criarItemMatricula(matricula, curso);
    }

    lista.innerHTML = html;
    configurarAcoesMatricula(usuarioId);
  } catch (error) {
    vazio.textContent = 'Não foi possível carregar suas matrículas.';
    vazio.hidden = false;
  }
}

function criarItemMatricula(matricula, curso) {
  const statusBadge = matricula.status === 'concluído'
    ? '<span class="badge badge-success">Concluído</span>'
    : '<span class="badge badge-warning">Em andamento</span>';

  const botaoProgresso = matricula.status === 'concluído'
    ? ''
    : `<button type="button" class="btn btn-secondary btn-sm progress-btn" data-matricula-id="${matricula.id}" data-progresso="${matricula.progresso}">+25% progresso</button>`;
  const botaoCancelar = matricula.status === 'concluído'
    ? ''
    : `<button type="button" class="btn btn-sm cancel-enrollment-btn" data-matricula-id="${matricula.id}" data-curso-titulo="${curso.titulo}">Cancelar matrícula</button>`;

  return `
    <li class="enrollment-item">
      <div class="enrollment-item__info">
        <div>
          <span class="enrollment-item__label">Curso online</span>
          <h3>${curso.titulo}</h3>
        </div>
        ${statusBadge}
      </div>
      <div class="enrollment-progress">
        <div class="enrollment-progress__label">
          <span>Seu progresso</span>
          <strong>${matricula.progresso}%</strong>
        </div>
        <div class="progress-bar">
          <div class="progress-bar__fill" style="width: ${matricula.progresso}%"></div>
        </div>
      </div>
      <div class="actions-cell enrollment-actions">
        <a href="curso.html?id=${curso.id}" class="btn enrollment-primary-action">Continuar curso <span aria-hidden="true">→</span></a>
        ${botaoProgresso}
        ${botaoCancelar}
      </div>
    </li>
  `;
}

function configurarAcoesMatricula(usuarioId) {
  const botoes = document.querySelectorAll('.progress-btn');

  for (const botao of botoes) {
    botao.addEventListener('click', async () => {
      const matriculaId = botao.dataset.matriculaId;
      const progressoAtual = Number(botao.dataset.progresso);
      const novoProgresso = Math.min(progressoAtual + 25, 100);

      try {
        await matriculasAPI.atualizar(matriculaId, { progresso: novoProgresso });
        carregarMatriculas(usuarioId);
        mostrarToast(`Progresso atualizado para ${novoProgresso}%`);
      } catch (error) {
        mostrarErro(error.message || 'Não foi possível atualizar o progresso.');
      }
    });
  }

  const botoesCancelar = document.querySelectorAll('.cancel-enrollment-btn');

  for (const botao of botoesCancelar) {
    botao.addEventListener('click', async () => {
      const confirmado = await confirmarAcao({
        titulo: 'Cancelar esta matrícula?',
        mensagem: `Seu progresso em "${botao.dataset.cursoTitulo}" será removido. Essa ação não poderá ser desfeita.`,
        textoConfirmar: 'Sim, cancelar',
        perigosa: true,
      });

      if (!confirmado) {
        return;
      }

      botao.disabled = true;

      try {
        await matriculasAPI.deletar(botao.dataset.matriculaId);
        await carregarMatriculas(usuarioId);
        mostrarSucesso(
          'A matrícula foi cancelada e o vínculo com o curso foi removido.',
          'Matrícula cancelada'
        );
      } catch (error) {
        botao.disabled = false;
        mostrarErro(error.message || 'Não foi possível cancelar a matrícula.');
      }
    });
  }
}

// ============================================
// ADMIN (gestão de usuários)
// ============================================
let todosUsuariosAdmin = [];

async function configurarAdmin() {
  const tbody = document.getElementById('user-table-body');

  if (!tbody) {
    return;
  }

  const vazio = document.getElementById('user-table-empty');
  const busca = document.getElementById('user-busca');
  const filtroRole = document.getElementById('user-filtro-role');
  const filtroStatus = document.getElementById('user-filtro-status');
  const limparFiltros = document.getElementById('user-filter-clear');
  const novoUsuario = document.getElementById('user-new-button');

  try {
    await recarregarUsuariosAdmin();
  } catch (error) {
    vazio.textContent = 'Não foi possível carregar os usuários.';
    vazio.hidden = false;
  }

  function aplicarFiltros() {
    const termo = busca.value.trim().toLowerCase();
    const role = filtroRole.value;
    const status = filtroStatus.value;
    const filtrados = [];

    for (const usuario of todosUsuariosAdmin) {
      const combinaBusca = !termo || usuario.nome.toLowerCase().includes(termo) || usuario.email.toLowerCase().includes(termo);
      const combinaRole = !role || usuario.role === role;
      const combinaStatus = !status
        || (status === 'ativo' && usuario.ativo)
        || (status === 'inativo' && !usuario.ativo);

      if (combinaBusca && combinaRole && combinaStatus) {
        filtrados.push(usuario);
      }
    }

    renderizarUsuarios(filtrados);
  }

  busca.addEventListener('input', aplicarFiltros);
  filtroRole.addEventListener('change', aplicarFiltros);
  filtroStatus.addEventListener('change', aplicarFiltros);
  novoUsuario.addEventListener('click', () => abrirModalUsuario());
  limparFiltros.addEventListener('click', () => {
    busca.value = '';
    filtroRole.value = '';
    filtroStatus.value = '';
    aplicarFiltros();
    busca.focus();
  });
  tbody.addEventListener('change', tratarMudancaRole);
  tbody.addEventListener('click', tratarAcoesUsuarioAdmin);
  configurarModalUsuario();
}

async function recarregarUsuariosAdmin() {
  todosUsuariosAdmin = await usuariosAPI.listar();
  atualizarResumoAdmin();
  renderizarUsuarios(todosUsuariosAdmin);
}

function renderizarUsuarios(usuarios) {
  const tbody = document.getElementById('user-table-body');
  const vazio = document.getElementById('user-table-empty');
  const contador = document.getElementById('user-results-count');
  contador.textContent = `${usuarios.length} ${usuarios.length === 1 ? 'resultado' : 'resultados'}`;

  if (usuarios.length === 0) {
    tbody.innerHTML = '';
    vazio.hidden = false;
    return;
  }

  vazio.hidden = true;
  tbody.innerHTML = criarLinhasUsuarios(usuarios);
}

function atualizarResumoAdmin() {
  const ativos = todosUsuariosAdmin.filter(usuario => usuario.ativo).length;
  const alunos = todosUsuariosAdmin.filter(usuario => usuario.role === 'aluno').length;
  const equipe = todosUsuariosAdmin.filter(usuario => usuario.role === 'editor' || usuario.role === 'admin').length;

  document.getElementById('stat-total').textContent = todosUsuariosAdmin.length;
  document.getElementById('stat-active').textContent = ativos;
  document.getElementById('stat-students').textContent = alunos;
  document.getElementById('stat-team').textContent = equipe;
}

async function tratarMudancaRole(evento) {
  const select = evento.target.closest('.role-select');

  if (!select) {
    return;
  }

  const id = select.dataset.id;
  const novoRole = select.value;

  try {
    await usuariosAPI.atualizar(id, { role: novoRole });
    const usuario = buscarPorId(todosUsuariosAdmin, id);
    if (usuario) {
      usuario.role = novoRole;
      atualizarResumoAdmin();
      document.getElementById('user-busca').dispatchEvent(new Event('input'));
    }
    mostrarToast('Perfil de acesso atualizado');
  } catch (error) {
    mostrarErro(error.message || 'Não foi possível alterar o perfil do usuário.');
    renderizarUsuarios(todosUsuariosAdmin);
  }
}

async function tratarToggleStatus(evento) {
  const botao = evento.target.closest('.toggle-status-btn');

  if (!botao) {
    return;
  }

  const id = botao.dataset.id;
  const usuario = buscarPorId(todosUsuariosAdmin, id);

  if (!usuario) {
    return;
  }

  try {
    await usuariosAPI.atualizar(id, { ativo: !usuario.ativo });
    usuario.ativo = !usuario.ativo;
    atualizarResumoAdmin();
    document.getElementById('user-busca').dispatchEvent(new Event('input'));
    mostrarToast(usuario.ativo ? 'Usuário ativado' : 'Usuário desativado');
  } catch (error) {
    mostrarErro(error.message || 'Não foi possível alterar o status.');
  }
}

// ============================================
// EDITOR (abas + CRUD de cursos, aulas e categorias)
// ============================================
let cursosEditor = [];
let categoriasEditor = [];
let aulasEditor = [];
let matriculasEditor = [];
let avaliacoesEditor = [];
let crudTipoAtual = null;
let crudItemAtual = null;

async function configurarEditor() {
  const painelCursos = document.getElementById('tab-cursos');

  if (!painelCursos) {
    return;
  }

  configurarAbas();
  configurarModalCrud();

  try {
    await recarregarDadosEditor();
  } catch (error) {
    mostrarErro('Não foi possível carregar os dados do dashboard.');
  }

  document.getElementById('cursos-busca').addEventListener('input', (evento) => {
    const termo = evento.target.value.trim().toLowerCase();
    const filtrados = [];

    for (const curso of cursosEditor) {
      if (curso.titulo.toLowerCase().includes(termo)) {
        filtrados.push(curso);
      }
    }

    renderizarCursosEditor(filtrados);
  });

  document.getElementById('curso-novo-btn').addEventListener('click', () => abrirModalCrud('curso'));
  document.getElementById('aula-nova-btn').addEventListener('click', () => abrirModalCrud('aula'));
  document.getElementById('categoria-nova-btn').addEventListener('click', () => abrirModalCrud('categoria'));

  document.querySelector('main').addEventListener('click', (evento) => {
    const editarBtn = evento.target.closest('.editar-btn');
    const excluirBtn = evento.target.closest('.excluir-btn');

    if (editarBtn) {
      tratarEditar(editarBtn.dataset.tipo, editarBtn.dataset.id);
    }

    if (excluirBtn) {
      tratarExcluir(excluirBtn.dataset.tipo, excluirBtn.dataset.id);
    }
  });
}

async function recarregarDadosEditor() {
  const [cursos, categorias, aulas, matriculas, avaliacoes] = await Promise.all([
    cursosAPI.listarGerenciados(),
    categoriasAPI.listar(),
    aulasAPI.listarGerenciadas(),
    matriculasAPI.listar(),
    avaliacoesAPI.listar(),
  ]);

  cursosEditor = cursos;
  categoriasEditor = categorias;
  aulasEditor = aulas;
  matriculasEditor = matriculas;
  avaliacoesEditor = avaliacoes;

  atualizarResumoEditor();
  renderizarCursosEditor(cursosEditor);
  renderizarCategoriasEditor(categoriasEditor);
  popularFiltroAulas();
  renderizarAulasEditor(aulasEditor);
}

function tratarAcoesUsuarioAdmin(evento) {
  const editar = evento.target.closest('.edit-user-btn');
  const excluir = evento.target.closest('.delete-user-btn');

  if (editar) {
    const usuario = buscarPorId(todosUsuariosAdmin, editar.dataset.id);
    if (usuario) {
      abrirModalUsuario(usuario);
    }
    return;
  }

  if (excluir) {
    excluirUsuarioAdmin(excluir.dataset.id);
    return;
  }

  tratarToggleStatus(evento);
}

function configurarModalUsuario() {
  const modal = document.getElementById('user-modal');
  document.getElementById('user-modal-close').addEventListener('click', fecharModalUsuario);
  document.getElementById('user-modal-cancel').addEventListener('click', fecharModalUsuario);
  document.getElementById('user-form').addEventListener('submit', salvarUsuarioAdmin);

  modal.addEventListener('click', evento => {
    if (evento.target === modal) {
      fecharModalUsuario();
    }
  });
}

function abrirModalUsuario(usuario = null) {
  const editando = Boolean(usuario);
  document.getElementById('user-modal-title').textContent = editando ? 'Editar usuário' : 'Novo usuário';
  document.getElementById('user-form-id').value = usuario?.id || '';
  document.getElementById('user-form-name').value = usuario?.nome || '';
  document.getElementById('user-form-email').value = usuario?.email || '';
  document.getElementById('user-form-password').value = '';
  document.getElementById('user-form-role').value = usuario?.role || 'aluno';
  document.getElementById('user-form-active').value = String(usuario?.ativo ?? true);
  document.getElementById('user-password-hint').textContent = editando
    ? 'Deixe em branco para manter a senha atual.'
    : 'Mínimo de 6 caracteres.';
  document.getElementById('user-form-password').required = !editando;
  document.getElementById('user-form-submit').textContent = editando ? 'Salvar alterações' : 'Criar usuário';
  document.getElementById('user-modal').hidden = false;
  document.getElementById('user-form-name').focus();
}

function fecharModalUsuario() {
  document.getElementById('user-modal').hidden = true;
  document.getElementById('user-form').reset();
}

async function salvarUsuarioAdmin(evento) {
  evento.preventDefault();

  const id = document.getElementById('user-form-id').value;
  const nome = document.getElementById('user-form-name').value.trim();
  const email = document.getElementById('user-form-email').value.trim();
  const senha = document.getElementById('user-form-password').value;
  const role = document.getElementById('user-form-role').value;
  const ativo = document.getElementById('user-form-active').value === 'true';
  const erro = validarNome(nome) || validarEmail(email) || (senha ? validarSenha(senha) : null);

  if (erro || (!id && !senha)) {
    mostrarAviso(erro || 'Informe uma senha com pelo menos 6 caracteres.', 'Revise os dados');
    return;
  }

  const dados = { nome, email, role, ativo };
  if (senha) {
    dados.senha = senha;
  }

  try {
    if (id) {
      await usuariosAPI.atualizar(id, dados);
    } else {
      await usuariosAPI.criar(dados);
    }

    fecharModalUsuario();
    await recarregarUsuariosAdmin();
    mostrarToast(id ? 'Usuário atualizado com sucesso' : 'Usuário criado com sucesso');
  } catch (error) {
    mostrarErro(error.message || 'Não foi possível salvar o usuário.');
  }
}

async function excluirUsuarioAdmin(id) {
  const usuario = buscarPorId(todosUsuariosAdmin, id);
  if (!usuario) {
    return;
  }

  if (auth.getUsuario()?.id === id) {
    mostrarAviso('Você não pode excluir a conta que está usando nesta sessão.');
    return;
  }

  const confirmado = await confirmarAcao({
    titulo: `Excluir ${usuario.nome}?`,
    mensagem: 'A exclusão só será permitida se o usuário não possuir cursos, matrículas ou avaliações vinculadas.',
    textoConfirmar: 'Sim, excluir',
    perigosa: true,
  });

  if (!confirmado) {
    return;
  }

  try {
    await usuariosAPI.deletar(id);
    await recarregarUsuariosAdmin();
    mostrarSucesso('O usuário foi removido da plataforma.');
  } catch (error) {
    mostrarErro(error.message || 'Não foi possível excluir o usuário.');
  }
}

function atualizarResumoEditor() {
  const publicados = cursosEditor.filter(curso => curso.status === 'publicado').length;
  const totalHoras = cursosEditor.reduce((total, curso) => total + Number(curso.cargaHoraria || 0), 0);
  const mediaAvaliacao = avaliacoesEditor.length
    ? avaliacoesEditor.reduce((total, avaliacao) => total + Number(avaliacao.nota || 0), 0) / avaliacoesEditor.length
    : 0;
  const percentualPublicado = cursosEditor.length
    ? Math.round((publicados / cursosEditor.length) * 100)
    : 0;

  animarNumero('editor-stat-courses', cursosEditor.length);
  animarNumero('editor-stat-published', publicados);
  animarNumero('editor-stat-lessons', aulasEditor.length);
  animarNumero('editor-stat-enrollments', matriculasEditor.length);
  document.getElementById('editor-stat-rating').textContent = mediaAvaliacao.toFixed(1).replace('.', ',');
  document.getElementById('editor-published-percent').textContent = `${percentualPublicado}%`;
  document.getElementById('editor-published-bar').style.width = `${percentualPublicado}%`;
  document.getElementById('editor-total-hours').textContent = `${totalHoras}h`;
  document.getElementById('editor-tab-courses').textContent = cursosEditor.length;
  document.getElementById('editor-tab-lessons').textContent = aulasEditor.length;
  document.getElementById('editor-tab-categories').textContent = categoriasEditor.length;
}

function animarNumero(elementoId, valorFinal) {
  const elemento = document.getElementById(elementoId);
  const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduzirMovimento || valorFinal === 0) {
    elemento.textContent = valorFinal;
    return;
  }

  const inicio = performance.now();
  const duracao = 650;

  function atualizar(agora) {
    const progresso = Math.min((agora - inicio) / duracao, 1);
    const suavizado = 1 - Math.pow(1 - progresso, 3);
    elemento.textContent = Math.round(valorFinal * suavizado);

    if (progresso < 1) {
      requestAnimationFrame(atualizar);
    }
  }

  requestAnimationFrame(atualizar);
}

// ---------- Abas ----------
function configurarAbas() {
  const botoes = document.querySelectorAll('.tab-button');

  for (const botao of botoes) {
    botao.addEventListener('click', () => ativarAba(botao.dataset.tab));
  }
}

function ativarAba(nomeAba) {
  const botoes = document.querySelectorAll('.tab-button');
  const paineis = document.querySelectorAll('.tab-panel');

  for (const botao of botoes) {
    const ativo = botao.dataset.tab === nomeAba;
    botao.classList.toggle('active', ativo);
    botao.setAttribute('aria-selected', String(ativo));
  }

  for (const painel of paineis) {
    const ativo = painel.id === `tab-${nomeAba}`;
    painel.classList.toggle('active', ativo);
    painel.hidden = !ativo;
  }
}

// ---------- Cursos ----------
function renderizarCursosEditor(cursos) {
  const tbody = document.getElementById('cursos-table-body');
  const vazio = document.getElementById('cursos-empty');
  document.getElementById('editor-course-results').textContent =
    `${cursos.length} ${cursos.length === 1 ? 'resultado' : 'resultados'}`;

  if (cursos.length === 0) {
    tbody.innerHTML = '';
    vazio.hidden = false;
    return;
  }

  vazio.hidden = true;

  let html = '';
  for (const curso of cursos) {
    const categoria = buscarPorId(categoriasEditor, curso.categoriaId);
    const statusBadge = curso.status === 'publicado'
      ? '<span class="badge badge-success">Publicado</span>'
      : '<span class="badge badge-neutral">Rascunho</span>';

    html += `
      <tr data-id="${curso.id}">
        <td>${curso.titulo}</td>
        <td>${categoria ? categoria.nome : '—'}</td>
        <td>${curso.cargaHoraria}h</td>
        <td>${statusBadge}</td>
        <td class="actions-cell">
          <button type="button" class="btn btn-secondary btn-sm editar-btn" data-tipo="curso" data-id="${curso.id}">Editar</button>
          <button type="button" class="btn btn-danger btn-sm excluir-btn" data-tipo="curso" data-id="${curso.id}">Excluir</button>
        </td>
      </tr>
    `;
  }

  tbody.innerHTML = html;
}

// ---------- Aulas ----------
function popularFiltroAulas() {
  const select = document.getElementById('aulas-curso-filtro');

  let html = '<option value="">Todos os cursos</option>';
  for (const curso of cursosEditor) {
    html += `<option value="${curso.id}">${curso.titulo}</option>`;
  }
  select.innerHTML = html;

  select.addEventListener('change', () => {
    const cursoId = select.value;

    if (!cursoId) {
      renderizarAulasEditor(aulasEditor);
      return;
    }

    const filtradas = [];
    for (const aula of aulasEditor) {
      if (aula.cursoId === cursoId) {
        filtradas.push(aula);
      }
    }
    renderizarAulasEditor(filtradas);
  });
}

function renderizarAulasEditor(aulas) {
  const tbody = document.getElementById('aulas-table-body');
  const vazio = document.getElementById('aulas-empty');

  if (aulas.length === 0) {
    tbody.innerHTML = '';
    vazio.hidden = false;
    return;
  }

  vazio.hidden = true;

  const ordenadas = [...aulas].sort((a, b) => a.ordem - b.ordem);
  let html = '';
  for (const aula of ordenadas) {
    const curso = buscarPorId(cursosEditor, aula.cursoId);
    html += `
      <tr data-id="${aula.id}">
        <td>${aula.ordem}</td>
        <td>${aula.titulo}</td>
        <td>${curso ? curso.titulo : '—'}</td>
        <td>${aula.duracaoMinutos} min</td>
        <td class="actions-cell">
          <button type="button" class="btn btn-secondary btn-sm editar-btn" data-tipo="aula" data-id="${aula.id}">Editar</button>
          <button type="button" class="btn btn-danger btn-sm excluir-btn" data-tipo="aula" data-id="${aula.id}">Excluir</button>
        </td>
      </tr>
    `;
  }

  tbody.innerHTML = html;
}

// ---------- Categorias ----------
function renderizarCategoriasEditor(categorias) {
  const tbody = document.getElementById('categorias-table-body');
  const vazio = document.getElementById('categorias-empty');

  if (categorias.length === 0) {
    tbody.innerHTML = '';
    vazio.hidden = false;
    return;
  }

  vazio.hidden = true;

  let html = '';
  for (const categoria of categorias) {
    html += `
      <tr data-id="${categoria.id}">
        <td>${categoria.nome}</td>
        <td>${categoria.descricao || '—'}</td>
        <td class="actions-cell">
          <button type="button" class="btn btn-secondary btn-sm editar-btn" data-tipo="categoria" data-id="${categoria.id}">Editar</button>
          <button type="button" class="btn btn-danger btn-sm excluir-btn" data-tipo="categoria" data-id="${categoria.id}">Excluir</button>
        </td>
      </tr>
    `;
  }

  tbody.innerHTML = html;
}

// ---------- Editar / Excluir (comum às 3 abas) ----------
function tratarEditar(tipo, id) {
  const item = buscarItemEditor(tipo, id);

  if (item) {
    abrirModalCrud(tipo, item);
  }
}

async function tratarExcluir(tipo, id) {
  const confirmado = await confirmarAcao({
    titulo: 'Excluir este item?',
    mensagem: 'Essa ação não poderá ser desfeita.',
    textoConfirmar: 'Sim, excluir',
    perigosa: true,
  });

  if (!confirmado) {
    return;
  }

  try {
    if (tipo === 'curso') {
      await cursosAPI.deletar(id);
    } else if (tipo === 'aula') {
      await aulasAPI.deletar(id);
    } else {
      await categoriasAPI.deletar(id);
    }
    await recarregarDadosEditor();
    mostrarSucesso('O item foi removido do sistema.');
  } catch (error) {
    mostrarErro(error.message || 'Não foi possível excluir.');
  }
}

function buscarItemEditor(tipo, id) {
  if (tipo === 'curso') {
    return buscarPorId(cursosEditor, id);
  }
  if (tipo === 'aula') {
    return buscarPorId(aulasEditor, id);
  }
  return buscarPorId(categoriasEditor, id);
}

// ---------- Modal de CRUD ----------
function configurarModalCrud() {
  const modal = document.getElementById('crud-modal');
  const form = document.getElementById('crud-form');

  document.getElementById('crud-modal-close').addEventListener('click', fecharModalCrud);
  document.getElementById('crud-cancel-btn').addEventListener('click', fecharModalCrud);

  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) {
      fecharModalCrud();
    }
  });

  form.addEventListener('submit', tratarSubmitCrud);
}

function abrirModalCrud(tipo, item) {
  crudTipoAtual = tipo;
  crudItemAtual = item || null;

  const modal = document.getElementById('crud-modal');
  const titulo = document.getElementById('crud-modal-title');
  const campos = document.getElementById('crud-fields');
  const rotulos = { curso: 'curso', aula: 'aula', categoria: 'categoria' };

  document.getElementById('crud-id').value = item ? item.id : '';
  titulo.textContent = item ? `Editar ${rotulos[tipo]}` : `Novo(a) ${rotulos[tipo]}`;
  campos.innerHTML = criarCamposCrud(tipo, item);

  modal.hidden = false;
}

function fecharModalCrud() {
  document.getElementById('crud-modal').hidden = true;
  document.getElementById('crud-form').reset();
  crudTipoAtual = null;
  crudItemAtual = null;
}

function criarCamposCrud(tipo, item) {
  if (tipo === 'curso') {
    return criarCamposCurso(item);
  }
  if (tipo === 'aula') {
    return criarCamposAula(item);
  }
  return criarCamposCategoria(item);
}

function criarCamposCurso(curso) {
  let opcoesCategoria = '';
  for (const categoria of categoriasEditor) {
    const selecionado = curso && curso.categoriaId === categoria.id ? 'selected' : '';
    opcoesCategoria += `<option value="${categoria.id}" ${selecionado}>${categoria.nome}</option>`;
  }

  return `
    <div class="form-group">
      <label for="crud-titulo">Título</label>
      <input type="text" id="crud-titulo" name="titulo" value="${curso ? curso.titulo : ''}" minlength="5" required />
    </div>
    <div class="form-group">
      <label for="crud-descricao">Descrição</label>
      <textarea id="crud-descricao" name="descricao" rows="3">${curso ? curso.descricao || '' : ''}</textarea>
    </div>
    <div class="form-group">
      <label for="crud-categoria">Categoria</label>
      <select id="crud-categoria" name="categoriaId" required>${opcoesCategoria}</select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="crud-carga">Carga horária (h)</label>
        <input type="number" id="crud-carga" name="cargaHoraria" value="${curso ? curso.cargaHoraria : ''}" min="1" required />
      </div>
      <div class="form-group">
        <label for="crud-status">Status</label>
        <select id="crud-status" name="status" required>
          <option value="rascunho" ${curso && curso.status === 'rascunho' ? 'selected' : ''}>Rascunho</option>
          <option value="publicado" ${curso && curso.status === 'publicado' ? 'selected' : ''}>Publicado</option>
        </select>
      </div>
    </div>
  `;
}

function criarCamposAula(aula) {
  let opcoesCurso = '';
  for (const curso of cursosEditor) {
    const selecionado = aula && aula.cursoId === curso.id ? 'selected' : '';
    opcoesCurso += `<option value="${curso.id}" ${selecionado}>${curso.titulo}</option>`;
  }

  return `
    <div class="form-group">
      <label for="crud-curso">Curso</label>
      <select id="crud-curso" name="cursoId" required>${opcoesCurso}</select>
    </div>
    <div class="form-group">
      <label for="crud-titulo">Título</label>
      <input type="text" id="crud-titulo" name="titulo" value="${aula ? aula.titulo : ''}" required />
    </div>
    <div class="form-group">
      <label for="crud-conteudo">URL do conteúdo</label>
      <input type="text" id="crud-conteudo" name="conteudo" value="${aula ? aula.conteudo || '' : ''}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="crud-ordem">Ordem</label>
        <input type="number" id="crud-ordem" name="ordem" value="${aula ? aula.ordem : ''}" min="1" step="1" required />
      </div>
      <div class="form-group">
        <label for="crud-duracao">Duração (min)</label>
        <input type="number" id="crud-duracao" name="duracaoMinutos" value="${aula ? aula.duracaoMinutos : ''}" min="1" required />
      </div>
    </div>
  `;
}

function criarCamposCategoria(categoria) {
  return `
    <div class="form-group">
      <label for="crud-nome">Nome</label>
      <input type="text" id="crud-nome" name="nome" value="${categoria ? categoria.nome : ''}" required />
    </div>
    <div class="form-group">
      <label for="crud-descricao">Descrição</label>
      <textarea id="crud-descricao" name="descricao" rows="3">${categoria ? categoria.descricao || '' : ''}</textarea>
    </div>
  `;
}

async function tratarSubmitCrud(evento) {
  evento.preventDefault();

  const id = document.getElementById('crud-id').value;
  const dados = coletarDadosCrud(crudTipoAtual);
  const erroValidacao = validarDadosCrud(crudTipoAtual, dados);

  if (erroValidacao) {
    mostrarAviso(erroValidacao, 'Revise os dados');
    return;
  }

  try {
    if (crudTipoAtual === 'curso') {
      await (id ? cursosAPI.atualizar(id, dados) : cursosAPI.criar(dados));
    } else if (crudTipoAtual === 'aula') {
      await (id ? aulasAPI.atualizar(id, dados) : aulasAPI.criar(dados));
    } else {
      await (id ? categoriasAPI.atualizar(id, dados) : categoriasAPI.criar(dados));
    }

    fecharModalCrud();
    await recarregarDadosEditor();
    mostrarToast(id ? 'Alterações salvas com sucesso' : 'Item criado com sucesso');
  } catch (error) {
    mostrarErro(error.message || 'Não foi possível salvar.');
  }
}

function coletarDadosCrud(tipo) {
  if (tipo === 'curso') {
    // instrutorId é mantido do item original ao editar; em cursos novos, o
    // próprio editor/admin logado vira o instrutor (GET /api/usuarios é
    // admin-only, então não há como oferecer uma lista de instrutores aqui)
    return {
      titulo: document.getElementById('crud-titulo').value,
      descricao: document.getElementById('crud-descricao').value,
      categoriaId: document.getElementById('crud-categoria').value,
      cargaHoraria: Number(document.getElementById('crud-carga').value),
      status: document.getElementById('crud-status').value,
      instrutorId: crudItemAtual ? crudItemAtual.instrutorId : auth.getUsuario().id,
    };
  }

  if (tipo === 'aula') {
    return {
      cursoId: document.getElementById('crud-curso').value,
      titulo: document.getElementById('crud-titulo').value,
      conteudo: document.getElementById('crud-conteudo').value,
      ordem: Number(document.getElementById('crud-ordem').value),
      duracaoMinutos: Number(document.getElementById('crud-duracao').value),
    };
  }

  return {
    nome: document.getElementById('crud-nome').value,
    descricao: document.getElementById('crud-descricao').value,
  };
}

function validarDadosCrud(tipo, dados) {
  if (tipo === 'curso') {
    return validarTituloCurso(dados.titulo) || validarCargaHoraria(dados.cargaHoraria) || validarStatusCurso(dados.status);
  }
  if (tipo === 'aula') {
    return validarOrdemAula(dados.ordem) || validarDuracaoAula(dados.duracaoMinutos);
  }
  return validarNomeCategoria(dados.nome);
}
