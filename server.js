const express = require('express');
const jsonServer = require('json-server');
const fs = require('fs');
const path = require('path');
const app = jsonServer.create();
const port = Number(process.env.PORT) || 3000;

// ============================================
// MIDDLEWARES GLOBAIS
// ============================================

app.use(jsonServer.bodyParser);

// CORS: o frontend costuma rodar em outra origem (ex.: Live Server em
// 127.0.0.1:5500) enquanto esta API roda em localhost:3000. Como o client
// envia headers customizados (Authorization, X-User-Id), o navegador manda
// um preflight OPTIONS antes de cada requisição — sem isto, o preflight
// falha e o fetch trava com erro de rede antes mesmo de chegar nas rotas.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// ============================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// ============================================

const dadosPath = path.join(__dirname, 'data', 'db.json');

function lerDados() {
  try {
    const dados = fs.readFileSync(dadosPath, 'utf8');
    return JSON.parse(dados);
  } catch (error) {
    console.error('Erro ao ler arquivo JSON:', error);
    return {
      usuarios: [],
      categorias: [],
      cursos: [],
      aulas: [],
      matriculas: [],
      avaliacoes: []
    };
  }
}

function salvarDados(dados) {
  try {
    fs.writeFileSync(dadosPath, JSON.stringify(dados, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar arquivo JSON:', error);
    return false;
  }
}

// ============================================
// MIDDLEWARES DE VALIDAÇÃO E AUTENTICAÇÃO
// ============================================

// Middleware para verificar token (simulado)
function verificarAutenticacao(req, res, next) {
  // Ignorar login. Como este middleware é montado com app.use('/api', ...),
  // req.path já vem sem o prefixo '/api' (é relativo ao ponto de montagem) —
  // comparar com '/api/login' aqui nunca dá match e bloqueia o próprio login.
  if (req.path === '/login') return next();
  
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }
  
  // Em produção: validar JWT aqui
  // Por enquanto, extrair usuário do header (simulado)
  const usuarioId = req.headers['x-user-id'];
  if (!usuarioId) {
    return res.status(401).json({ erro: 'Usuário não identificado' });
  }
  
  const dados = lerDados();
  const usuario = dados.usuarios?.find(u => u.id === usuarioId);
  if (!usuario) {
    return res.status(401).json({ erro: 'Usuário não encontrado' });
  }
  
  if (!usuario.ativo) {
    return res.status(403).json({ erro: 'Usuário inativo' });
  }
  
  req.usuario = usuario;
  next();
}

// Middleware para verificar roles
function verificarRole(rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }
    
    if (!rolesPermitidos.includes(req.usuario.role)) {
      return res.status(403).json({ 
        erro: `Acesso negado. Role '${req.usuario.role}' não tem permissão` 
      });
    }
    next();
  };
}

// Middleware para validar campos obrigatórios
function validarCampos(campos) {
  return (req, res, next) => {
    const body = req.body;
    const faltantes = campos.filter(campo => !body[campo]);
    
    if (faltantes.length > 0) {
      return res.status(400).json({ 
        erro: `Campos obrigatórios faltando: ${faltantes.join(', ')}` 
      });
    }
    next();
  };
}

const ROLES_VALIDAS = ['aluno', 'editor', 'admin'];
const STATUS_CURSO_VALIDOS = ['rascunho', 'publicado'];
const STATUS_MATRICULA_VALIDOS = ['em andamento', 'concluído'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function textoValido(valor, minimo = 1) {
  return typeof valor === 'string' && valor.trim().length >= minimo;
}

function numeroPositivo(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0;
}

function editorGerenciaCurso(usuario, curso) {
  return usuario.role === 'admin'
    || (usuario.role === 'editor' && curso?.instrutorId === usuario.id);
}

// Aplicar middleware de autenticação em todas as rotas /api (exceto login)
app.use('/api', verificarAutenticacao);

// ============================================
// ENDPOINTS - USUÁRIOS
// ============================================

// GET - Listar todos os usuários (apenas admin)
app.get('/api/usuarios', verificarRole(['admin']), (req, res) => {
  const dados = lerDados();
  const usuarios = dados.usuarios?.map(u => {
    const { senha, ...usuarioSemSenha } = u;
    return usuarioSemSenha;
  }) || [];
  res.json(usuarios);
});

// GET - Buscar usuário por ID (perfil completo: admin ou próprio usuário;
// demais usuários autenticados recebem apenas dados públicos de exibição,
// necessários para mostrar nome do instrutor de um curso ou autor de uma avaliação)
app.get('/api/usuarios/:id', (req, res) => {
  const dados = lerDados();
  const usuario = dados.usuarios?.find(u => u.id === req.params.id);

  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }

  if (req.usuario.role === 'admin' || req.usuario.id === req.params.id) {
    const { senha, ...usuarioSemSenha } = usuario;
    return res.json(usuarioSemSenha);
  }

  res.json({ id: usuario.id, nome: usuario.nome, role: usuario.role });
});

// POST - Login
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
  }
  
  const dados = lerDados();
  const usuario = dados.usuarios?.find(u => 
    u.email === email && u.senha === senha && u.ativo === true
  );
  
  if (!usuario) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }
  
  const { senha: _, ...usuarioSemSenha } = usuario;
  res.json({ 
    usuario: usuarioSemSenha,
    token: 'fake-jwt-token-' + Date.now()
  });
});

// POST - Criar usuário (apenas admin)
app.post('/api/usuarios', 
  verificarRole(['admin']),
  validarCampos(['nome', 'email', 'senha', 'role']),
  (req, res) => {
    const dados = lerDados();
    const { nome, email, senha, role, ativo = true } = req.body;
    
    // Validações
    if (!textoValido(nome, 3)) {
      return res.status(400).json({ erro: 'Nome deve ter no mínimo 3 caracteres' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ erro: 'Email inválido' });
    }

    if (!textoValido(senha, 6)) {
      return res.status(400).json({ erro: 'Senha deve ter no mínimo 6 caracteres' });
    }

    if (!ROLES_VALIDAS.includes(role)) {
      return res.status(400).json({ erro: 'Role deve ser aluno, editor ou admin' });
    }

    if (typeof ativo !== 'boolean') {
      return res.status(400).json({ erro: 'Ativo deve ser um valor booleano' });
    }
    
    const emailNormalizado = email.trim().toLowerCase();
    const emailExiste = dados.usuarios?.some(u => u.email.toLowerCase() === emailNormalizado);
    if (emailExiste) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }
    
    const novoUsuario = {
      id: 'u' + Date.now() + Math.random().toString(36).substr(2, 4),
      nome: nome.trim(),
      email: emailNormalizado,
      senha,
      role,
      ativo
    };
    
    if (!dados.usuarios) dados.usuarios = [];
    dados.usuarios.push(novoUsuario);
    salvarDados(dados);
    
    const { senha: _, ...usuarioSemSenha } = novoUsuario;
    res.status(201).json(usuarioSemSenha);
  }
);

// PUT - Atualizar usuário (próprio usuário ou admin)
app.put('/api/usuarios/:id', (req, res) => {
  const dados = lerDados();
  const index = dados.usuarios?.findIndex(u => u.id === req.params.id);
  
  if (index === -1 || index === undefined) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }
  
  const usuarioExistente = dados.usuarios[index];
  
  // Verificar permissão: admin ou próprio usuário
  if (req.usuario.role !== 'admin' && req.usuario.id !== req.params.id) {
    return res.status(403).json({ erro: 'Acesso negado' });
  }
  
  // Restrições: apenas admin pode alterar role e ativo
  if (req.usuario.role !== 'admin') {
    delete req.body.role;
    delete req.body.ativo;
    delete req.body.email;
  }

  if (req.body.nome !== undefined && !textoValido(req.body.nome, 3)) {
    return res.status(400).json({ erro: 'Nome deve ter no mínimo 3 caracteres' });
  }

  if (req.body.senha !== undefined && !textoValido(req.body.senha, 6)) {
    return res.status(400).json({ erro: 'Senha deve ter no mínimo 6 caracteres' });
  }

  if (req.body.role !== undefined && !ROLES_VALIDAS.includes(req.body.role)) {
    return res.status(400).json({ erro: 'Role deve ser aluno, editor ou admin' });
  }

  if (req.body.ativo !== undefined && typeof req.body.ativo !== 'boolean') {
    return res.status(400).json({ erro: 'Ativo deve ser um valor booleano' });
  }

  // Validar email único se estiver atualizando
  if (req.body.email && req.body.email !== usuarioExistente.email) {
    req.body.email = req.body.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(req.body.email)) {
      return res.status(400).json({ erro: 'Email inválido' });
    }

    const emailExiste = dados.usuarios?.some(u => 
      u.email.toLowerCase() === req.body.email && u.id !== req.params.id
    );
    if (emailExiste) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }
  }
  
  dados.usuarios[index] = { ...usuarioExistente, ...req.body };
  salvarDados(dados);
  
  const { senha, ...usuarioSemSenha } = dados.usuarios[index];
  res.json(usuarioSemSenha);
});

// DELETE - Remover usuário (apenas admin)
app.delete('/api/usuarios/:id', verificarRole(['admin']), (req, res) => {
  const dados = lerDados();

  const usuario = dados.usuarios?.find(u => u.id === req.params.id);
  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }

  const possuiVinculos = dados.matriculas?.some(m => m.usuarioId === req.params.id)
    || dados.avaliacoes?.some(a => a.usuarioId === req.params.id)
    || dados.cursos?.some(c => c.instrutorId === req.params.id);

  if (possuiVinculos) {
    return res.status(400).json({
      erro: 'Não é possível excluir um usuário com cursos, matrículas ou avaliações vinculadas'
    });
  }

  dados.usuarios = dados.usuarios?.filter(u => u.id !== req.params.id) || [];
  salvarDados(dados);
  res.status(204).send();
});

// ============================================
// ENDPOINTS - CATEGORIAS
// ============================================

// GET - Listar categorias (todos autenticados)
app.get('/api/categorias', (req, res) => {
  const dados = lerDados();
  res.json(dados.categorias || []);
});

// GET - Buscar categoria por ID
app.get('/api/categorias/:id', (req, res) => {
  const dados = lerDados();
  const categoria = dados.categorias?.find(c => c.id === req.params.id);
  if (!categoria) {
    return res.status(404).json({ erro: 'Categoria não encontrada' });
  }
  res.json(categoria);
});

// POST - Criar categoria (apenas editor/admin)
app.post('/api/categorias', 
  verificarRole(['editor', 'admin']),
  validarCampos(['nome']),
  (req, res) => {
    const dados = lerDados();
    const { nome, descricao } = req.body;

    if (!textoValido(nome)) {
      return res.status(400).json({ erro: 'Nome da categoria é obrigatório' });
    }

    const nomeNormalizado = nome.trim();
    const nomeExiste = dados.categorias?.some(
      c => c.nome.toLowerCase() === nomeNormalizado.toLowerCase()
    );
    if (nomeExiste) {
      return res.status(400).json({ erro: 'Categoria já existe' });
    }
    
    const novaCategoria = {
      id: 'cat' + Date.now() + Math.random().toString(36).substr(2, 4),
      nome: nomeNormalizado,
      descricao: descricao || ''
    };
    
    if (!dados.categorias) dados.categorias = [];
    dados.categorias.push(novaCategoria);
    salvarDados(dados);
    res.status(201).json(novaCategoria);
  }
);

// PUT - Atualizar categoria (apenas editor/admin)
app.put('/api/categorias/:id', 
  verificarRole(['editor', 'admin']),
  (req, res) => {
    const dados = lerDados();
    const index = dados.categorias?.findIndex(c => c.id === req.params.id);
    
    if (index === -1 || index === undefined) {
      return res.status(404).json({ erro: 'Categoria não encontrada' });
    }
    
    // Validar nome único
    if (req.body.nome !== undefined) {
      if (!textoValido(req.body.nome)) {
        return res.status(400).json({ erro: 'Nome da categoria é obrigatório' });
      }

      req.body.nome = req.body.nome.trim();
      const nomeExiste = dados.categorias?.some(c => 
        c.nome.toLowerCase() === req.body.nome.toLowerCase() && c.id !== req.params.id
      );
      if (nomeExiste) {
        return res.status(400).json({ erro: 'Categoria já existe' });
      }
    }
    
    dados.categorias[index] = { ...dados.categorias[index], ...req.body };
    salvarDados(dados);
    res.json(dados.categorias[index]);
  }
);

// DELETE - Remover categoria (apenas editor/admin)
app.delete('/api/categorias/:id', 
  verificarRole(['editor', 'admin']),
  (req, res) => {
    const dados = lerDados();
    
    // Verificar se existem cursos nesta categoria
    const temCursos = dados.cursos?.some(c => c.categoriaId === req.params.id);
    if (temCursos) {
      return res.status(400).json({ 
        erro: 'Não é possível excluir categoria com cursos associados' 
      });
    }
    
    dados.categorias = dados.categorias?.filter(c => c.id !== req.params.id) || [];
    salvarDados(dados);
    res.status(204).send();
  }
);

// GET - Cursos por categoria
app.get('/api/categorias/:categoriaId/cursos', (req, res) => {
  const dados = lerDados();
  let cursos = dados.cursos?.filter(c => c.categoriaId === req.params.categoriaId) || [];
  
  // Filtrar rascunhos para alunos
  if (req.usuario.role === 'aluno') {
    cursos = cursos.filter(c => c.status === 'publicado');
  }

  res.json(cursos);
});

// ============================================
// ENDPOINTS - CURSOS
// ============================================

// GET - Cursos que o editor autenticado pode gerenciar
app.get('/api/editor/cursos', verificarRole(['editor', 'admin']), (req, res) => {
  const dados = lerDados();
  const cursos = req.usuario.role === 'admin'
    ? (dados.cursos || [])
    : (dados.cursos || []).filter(c => c.instrutorId === req.usuario.id);
  res.json(cursos);
});

// GET - Listar cursos (todos autenticados)
app.get('/api/cursos', (req, res) => {
  const dados = lerDados();
  let cursos = dados.cursos || [];
  
  // Filtrar rascunhos para alunos
  if (req.usuario.role === 'aluno') {
    cursos = cursos.filter(c => c.status === 'publicado');
  }
  
  res.json(cursos);
});

// GET - Buscar curso por ID
app.get('/api/cursos/:id', (req, res) => {
  const dados = lerDados();
  const curso = dados.cursos?.find(c => c.id === req.params.id);
  
  if (!curso) {
    return res.status(404).json({ erro: 'Curso não encontrado' });
  }
  
  // Aluno não pode ver rascunhos
  if (req.usuario.role === 'aluno' && curso.status === 'rascunho') {
    return res.status(403).json({ erro: 'Acesso negado' });
  }
  
  res.json(curso);
});

// POST - Criar curso (apenas editor/admin)
app.post('/api/cursos',
  verificarRole(['editor', 'admin']),
  validarCampos(['titulo', 'categoriaId', 'instrutorId', 'status', 'cargaHoraria']),
  (req, res) => {
    const dados = lerDados();
    const { titulo, descricao, categoriaId, instrutorId, status, cargaHoraria } = req.body;
    
    // Validações
    if (!textoValido(titulo, 5)) {
      return res.status(400).json({ erro: 'Título deve ter no mínimo 5 caracteres' });
    }

    if (!STATUS_CURSO_VALIDOS.includes(status)) {
      return res.status(400).json({ erro: 'Status deve ser rascunho ou publicado' });
    }

    if (!numeroPositivo(cargaHoraria)) {
      return res.status(400).json({ erro: 'Carga horária deve ser positiva' });
    }
    
    // Verificar se categoria existe
    const categoriaExiste = dados.categorias?.some(c => c.id === categoriaId);
    if (!categoriaExiste) {
      return res.status(400).json({ erro: 'Categoria não encontrada' });
    }
    
    // Verificar se instrutor é editor ou admin
    const instrutor = dados.usuarios?.find(u => u.id === instrutorId);
    if (!instrutor) {
      return res.status(400).json({ erro: 'Instrutor não encontrado' });
    }
    if (!['editor', 'admin'].includes(instrutor.role)) {
      return res.status(400).json({ 
        erro: 'Instrutor deve ter role editor ou admin' 
      });
    }

    if (req.usuario.role === 'editor' && instrutorId !== req.usuario.id) {
      return res.status(403).json({ erro: 'Editor só pode criar cursos sob sua própria gestão' });
    }
    
    const novoCurso = {
      id: 'cur' + Date.now() + Math.random().toString(36).substr(2, 4),
      titulo: titulo.trim(),
      descricao: descricao || '',
      categoriaId,
      instrutorId,
      status,
      cargaHoraria
    };
    
    if (!dados.cursos) dados.cursos = [];
    dados.cursos.push(novoCurso);
    salvarDados(dados);
    res.status(201).json(novoCurso);
  }
);

// PUT - Atualizar curso (apenas editor/admin)
app.put('/api/cursos/:id',
  verificarRole(['editor', 'admin']),
  (req, res) => {
    const dados = lerDados();
    const index = dados.cursos?.findIndex(c => c.id === req.params.id);
    
    if (index === -1 || index === undefined) {
      return res.status(404).json({ erro: 'Curso não encontrado' });
    }

    const cursoExistente = dados.cursos[index];
    if (!editorGerenciaCurso(req.usuario, cursoExistente)) {
      return res.status(403).json({ erro: 'Editor só pode alterar cursos que gerencia' });
    }

    // Validações
    if (req.body.titulo !== undefined) {
      if (!textoValido(req.body.titulo, 5)) {
        return res.status(400).json({ erro: 'Título deve ter no mínimo 5 caracteres' });
      }
      req.body.titulo = req.body.titulo.trim();
    }

    if (req.body.status !== undefined && !STATUS_CURSO_VALIDOS.includes(req.body.status)) {
      return res.status(400).json({ erro: 'Status deve ser rascunho ou publicado' });
    }

    if (req.body.cargaHoraria !== undefined && !numeroPositivo(req.body.cargaHoraria)) {
      return res.status(400).json({ erro: 'Carga horária deve ser positiva' });
    }
    
    // Verificar categoria se foi alterada
    if (req.body.categoriaId) {
      const categoriaExiste = dados.categorias?.some(c => c.id === req.body.categoriaId);
      if (!categoriaExiste) {
        return res.status(400).json({ erro: 'Categoria não encontrada' });
      }
    }
    
    // Verificar instrutor se foi alterado
    if (req.body.instrutorId) {
      const instrutor = dados.usuarios?.find(u => u.id === req.body.instrutorId);
      if (!instrutor) {
        return res.status(400).json({ erro: 'Instrutor não encontrado' });
      }
      if (!['editor', 'admin'].includes(instrutor.role)) {
        return res.status(400).json({ 
          erro: 'Instrutor deve ter role editor ou admin' 
        });
      }

      if (req.usuario.role === 'editor' && req.body.instrutorId !== req.usuario.id) {
        return res.status(403).json({ erro: 'Editor não pode transferir o curso para outro instrutor' });
      }
    }
    
    dados.cursos[index] = { ...dados.cursos[index], ...req.body };
    salvarDados(dados);
    res.json(dados.cursos[index]);
  }
);

// DELETE - Remover curso (apenas editor/admin)
app.delete('/api/cursos/:id',
  verificarRole(['editor', 'admin']),
  (req, res) => {
    const dados = lerDados();
    const curso = dados.cursos?.find(c => c.id === req.params.id);

    if (!curso) {
      return res.status(404).json({ erro: 'Curso não encontrado' });
    }

    if (!editorGerenciaCurso(req.usuario, curso)) {
      return res.status(403).json({ erro: 'Editor só pode excluir cursos que gerencia' });
    }
    
    // Verificar se tem aulas associadas
    const temAulas = dados.aulas?.some(a => a.cursoId === req.params.id);
    if (temAulas) {
      return res.status(400).json({ 
        erro: 'Não é possível excluir curso com aulas associadas' 
      });
    }
    
    // Verificar se tem matrículas
    const temMatriculas = dados.matriculas?.some(m => m.cursoId === req.params.id);
    if (temMatriculas) {
      return res.status(400).json({ 
        erro: 'Não é possível excluir curso com matrículas associadas' 
      });
    }
    
    dados.cursos = dados.cursos?.filter(c => c.id !== req.params.id) || [];
    salvarDados(dados);
    res.status(204).send();
  }
);

// GET - Aulas de um curso
app.get('/api/cursos/:cursoId/aulas', (req, res) => {
  const dados = lerDados();
  const curso = dados.cursos?.find(c => c.id === req.params.cursoId);
  
  if (!curso) {
    return res.status(404).json({ erro: 'Curso não encontrado' });
  }
  
  // Aluno não pode ver aulas de rascunhos
  if (req.usuario.role === 'aluno' && curso.status === 'rascunho') {
    return res.status(403).json({ erro: 'Acesso negado' });
  }
  
  const aulas = dados.aulas?.filter(a => a.cursoId === req.params.cursoId)
    .sort((a, b) => a.ordem - b.ordem) || [];
  res.json(aulas);
});

// GET - Avaliações de um curso
app.get('/api/cursos/:cursoId/avaliacoes', (req, res) => {
  const dados = lerDados();
  const curso = dados.cursos?.find(c => c.id === req.params.cursoId);
  
  if (!curso) {
    return res.status(404).json({ erro: 'Curso não encontrado' });
  }
  
  const avaliacoes = dados.avaliacoes?.filter(a => a.cursoId === req.params.cursoId) || [];
  res.json(avaliacoes);
});

// ============================================
// ENDPOINTS - AULAS
// ============================================

// GET - Aulas dos cursos que o editor autenticado pode gerenciar
app.get('/api/editor/aulas', verificarRole(['editor', 'admin']), (req, res) => {
  const dados = lerDados();
  const cursosGerenciados = req.usuario.role === 'admin'
    ? (dados.cursos || []).map(c => c.id)
    : (dados.cursos || [])
      .filter(c => c.instrutorId === req.usuario.id)
      .map(c => c.id);
  res.json((dados.aulas || []).filter(a => cursosGerenciados.includes(a.cursoId)));
});

// GET - Listar aulas (todos autenticados)
app.get('/api/aulas', (req, res) => {
  const dados = lerDados();
  let aulas = dados.aulas || [];
  
  // Para alunos, só mostrar aulas de cursos publicados
  if (req.usuario.role === 'aluno') {
    const cursosPublicados = dados.cursos?.filter(c => c.status === 'publicado')
      .map(c => c.id) || [];
    aulas = aulas.filter(a => cursosPublicados.includes(a.cursoId));
  }

  res.json(aulas);
});

// GET - Buscar aula por ID
app.get('/api/aulas/:id', (req, res) => {
  const dados = lerDados();
  const aula = dados.aulas?.find(a => a.id === req.params.id);
  
  if (!aula) {
    return res.status(404).json({ erro: 'Aula não encontrada' });
  }
  
  // Verificar se curso é público (para alunos)
  if (req.usuario.role === 'aluno') {
    const curso = dados.cursos?.find(c => c.id === aula.cursoId);
    if (!curso || curso.status === 'rascunho') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
  }
  
  res.json(aula);
});

// POST - Criar aula (apenas editor/admin)
app.post('/api/aulas',
  verificarRole(['editor', 'admin']),
  validarCampos(['cursoId', 'titulo', 'ordem', 'duracaoMinutos']),
  (req, res) => {
    const dados = lerDados();
    const { cursoId, titulo, conteudo, ordem, duracaoMinutos } = req.body;
    
    // Verificar se curso existe
    const curso = dados.cursos?.find(c => c.id === cursoId);
    if (!curso) {
      return res.status(400).json({ erro: 'Curso não encontrado' });
    }

    if (!editorGerenciaCurso(req.usuario, curso)) {
      return res.status(403).json({ erro: 'Editor só pode criar aulas nos cursos que gerencia' });
    }

    if (!textoValido(titulo)) {
      return res.status(400).json({ erro: 'Título da aula é obrigatório' });
    }

    if (ordem <= 0 || !Number.isInteger(ordem)) {
      return res.status(400).json({ erro: 'Ordem deve ser um número inteiro positivo' });
    }
    
    if (!numeroPositivo(duracaoMinutos)) {
      return res.status(400).json({ erro: 'Duração deve ser positiva' });
    }
    
    const novaAula = {
      id: 'aul' + Date.now() + Math.random().toString(36).substr(2, 4),
      cursoId,
      titulo: titulo.trim(),
      conteudo: conteudo || '',
      ordem,
      duracaoMinutos
    };
    
    if (!dados.aulas) dados.aulas = [];
    dados.aulas.push(novaAula);
    salvarDados(dados);
    res.status(201).json(novaAula);
  }
);

// PUT - Atualizar aula (apenas editor/admin)
app.put('/api/aulas/:id',
  verificarRole(['editor', 'admin']),
  (req, res) => {
    const dados = lerDados();
    const index = dados.aulas?.findIndex(a => a.id === req.params.id);
    
    if (index === -1 || index === undefined) {
      return res.status(404).json({ erro: 'Aula não encontrada' });
    }

    const aulaExistente = dados.aulas[index];
    const cursoAtual = dados.cursos?.find(c => c.id === aulaExistente.cursoId);
    if (!editorGerenciaCurso(req.usuario, cursoAtual)) {
      return res.status(403).json({ erro: 'Editor só pode alterar aulas dos cursos que gerencia' });
    }

    // Validações
    if (req.body.titulo !== undefined) {
      if (!textoValido(req.body.titulo)) {
        return res.status(400).json({ erro: 'Título da aula é obrigatório' });
      }
      req.body.titulo = req.body.titulo.trim();
    }

    if (req.body.ordem !== undefined) {
      if (req.body.ordem <= 0 || !Number.isInteger(req.body.ordem)) {
        return res.status(400).json({ erro: 'Ordem deve ser um número inteiro positivo' });
      }
    }
    
    if (req.body.duracaoMinutos !== undefined && !numeroPositivo(req.body.duracaoMinutos)) {
      return res.status(400).json({ erro: 'Duração deve ser positiva' });
    }
    
    // Verificar curso se foi alterado
    if (req.body.cursoId) {
      const curso = dados.cursos?.find(c => c.id === req.body.cursoId);
      if (!curso) {
        return res.status(400).json({ erro: 'Curso não encontrado' });
      }
      if (!editorGerenciaCurso(req.usuario, curso)) {
        return res.status(403).json({ erro: 'Editor só pode vincular aulas aos cursos que gerencia' });
      }
    }
    
    dados.aulas[index] = { ...dados.aulas[index], ...req.body };
    salvarDados(dados);
    res.json(dados.aulas[index]);
  }
);

// DELETE - Remover aula (apenas editor/admin)
app.delete('/api/aulas/:id',
  verificarRole(['editor', 'admin']),
  (req, res) => {
    const dados = lerDados();
    const aula = dados.aulas?.find(a => a.id === req.params.id);

    if (!aula) {
      return res.status(404).json({ erro: 'Aula não encontrada' });
    }

    const curso = dados.cursos?.find(c => c.id === aula.cursoId);
    if (!editorGerenciaCurso(req.usuario, curso)) {
      return res.status(403).json({ erro: 'Editor só pode excluir aulas dos cursos que gerencia' });
    }

    dados.aulas = dados.aulas?.filter(a => a.id !== req.params.id) || [];
    salvarDados(dados);
    res.status(204).send();
  }
);

// ============================================
// ENDPOINTS - MATRÍCULAS
// ============================================

// GET - Listar matrículas (editor/admin ou aluno filtrado)
app.get('/api/matriculas', (req, res) => {
  const dados = lerDados();
  let matriculas = dados.matriculas || [];
  
  // Aluno só vê suas próprias matrículas
  if (req.usuario.role === 'aluno') {
    matriculas = matriculas.filter(m => m.usuarioId === req.usuario.id);
  }

  if (req.usuario.role === 'editor') {
    const cursosGerenciados = dados.cursos
      ?.filter(c => c.instrutorId === req.usuario.id)
      .map(c => c.id) || [];
    matriculas = matriculas.filter(m => cursosGerenciados.includes(m.cursoId));
  }
  
  res.json(matriculas);
});

// GET - Buscar matrícula por ID
app.get('/api/matriculas/:id', (req, res) => {
  const dados = lerDados();
  const matricula = dados.matriculas?.find(m => m.id === req.params.id);
  
  if (!matricula) {
    return res.status(404).json({ erro: 'Matrícula não encontrada' });
  }
  
  // Aluno só vê suas próprias matrículas
  if (req.usuario.role === 'aluno' && matricula.usuarioId !== req.usuario.id) {
    return res.status(403).json({ erro: 'Acesso negado' });
  }

  if (req.usuario.role === 'editor') {
    const curso = dados.cursos?.find(c => c.id === matricula.cursoId);
    if (!editorGerenciaCurso(req.usuario, curso)) {
      return res.status(403).json({ erro: 'Editor só pode consultar matrículas dos cursos que gerencia' });
    }
  }
  
  res.json(matricula);
});

// POST - Criar matrícula (aluno)
app.post('/api/matriculas',
  verificarRole(['aluno', 'editor', 'admin']),
  validarCampos(['usuarioId', 'cursoId']),
  (req, res) => {
    const dados = lerDados();
    const { usuarioId, cursoId, progresso = 0 } = req.body;
    
    // Aluno só pode matricular a si mesmo
    if (req.usuario.role === 'aluno' && usuarioId !== req.usuario.id) {
      return res.status(403).json({ erro: 'Aluno só pode se matricular' });
    }
    
    // Verificar se usuário existe e é aluno
    const usuario = dados.usuarios?.find(u => u.id === usuarioId);
    if (!usuario) {
      return res.status(400).json({ erro: 'Usuário não encontrado' });
    }
    if (usuario.role !== 'aluno') {
      return res.status(400).json({ erro: 'Apenas alunos podem se matricular' });
    }
    
    // Verificar se curso existe e está publicado
    const curso = dados.cursos?.find(c => c.id === cursoId);
    if (!curso) {
      return res.status(400).json({ erro: 'Curso não encontrado' });
    }
    if (curso.status !== 'publicado') {
      return res.status(400).json({ erro: 'Curso não está disponível' });
    }
    
    // VALIDAÇÃO CRÍTICA: Matrícula duplicada
    const matriculaExistente = dados.matriculas?.find(
      m => m.usuarioId === usuarioId && m.cursoId === cursoId
    );
    if (matriculaExistente) {
      return res.status(200).json(matriculaExistente);
    }
    
    if (typeof progresso !== 'number' || !Number.isFinite(progresso) || progresso < 0 || progresso > 100) {
      return res.status(400).json({ erro: 'Progresso deve estar entre 0 e 100' });
    }
    
    const novaMatricula = {
      id: 'mat' + Date.now() + Math.random().toString(36).substr(2, 4),
      usuarioId,
      cursoId,
      dataMatricula: new Date().toISOString(),
      progresso,
      status: progresso === 100 ? 'concluído' : 'em andamento'
    };
    
    if (!dados.matriculas) dados.matriculas = [];
    dados.matriculas.push(novaMatricula);
    salvarDados(dados);
    res.status(201).json(novaMatricula);
  }
);

// PUT - Atualizar matrícula (aluno próprio ou editor/admin)
app.put('/api/matriculas/:id', (req, res) => {
  const dados = lerDados();
  const index = dados.matriculas?.findIndex(m => m.id === req.params.id);
  
  if (index === -1 || index === undefined) {
    return res.status(404).json({ erro: 'Matrícula não encontrada' });
  }
  
  const matriculaExistente = dados.matriculas[index];
  
  // Aluno só pode atualizar suas próprias matrículas
  if (req.usuario.role === 'aluno' && matriculaExistente.usuarioId !== req.usuario.id) {
    return res.status(403).json({ erro: 'Acesso negado' });
  }

  if (req.usuario.role === 'editor') {
    const curso = dados.cursos?.find(c => c.id === matriculaExistente.cursoId);
    if (!editorGerenciaCurso(req.usuario, curso)) {
      return res.status(403).json({ erro: 'Editor só pode atualizar matrículas dos cursos que gerencia' });
    }
  }

  if (req.body.usuarioId !== undefined || req.body.cursoId !== undefined) {
    return res.status(400).json({ erro: 'Não é permitido alterar o usuário ou o curso da matrícula' });
  }

  const atualizacao = {};

  // Validações
  if (req.body.progresso !== undefined) {
    if (typeof req.body.progresso !== 'number'
      || !Number.isFinite(req.body.progresso)
      || req.body.progresso < 0
      || req.body.progresso > 100) {
      return res.status(400).json({ erro: 'Progresso deve estar entre 0 e 100' });
    }

    atualizacao.progresso = req.body.progresso;

    // Atualizar status automaticamente se progresso for 100
    if (req.body.progresso === 100) {
      atualizacao.status = 'concluído';
      atualizacao.dataConclusao = new Date().toISOString();
    } else if (req.body.progresso < 100 && matriculaExistente.status !== 'concluído') {
      atualizacao.status = 'em andamento';
    }
  }

  if (req.body.status !== undefined) {
    if (!STATUS_MATRICULA_VALIDOS.includes(req.body.status)) {
      return res.status(400).json({
        erro: 'Status deve ser "em andamento" ou "concluído"'
      });
    }
    atualizacao.status = req.body.status;
  }

  if (atualizacao.status && !STATUS_MATRICULA_VALIDOS.includes(atualizacao.status)) {
    return res.status(400).json({ 
      erro: 'Status deve ser "em andamento" ou "concluído"' 
    });
  }

  dados.matriculas[index] = { ...matriculaExistente, ...atualizacao };
  salvarDados(dados);
  res.json(dados.matriculas[index]);
});

// DELETE - Cancelar matrícula (aluno proprietário ou admin)
app.delete('/api/matriculas/:id', (req, res) => {
  const dados = lerDados();
  const matricula = dados.matriculas?.find(m => m.id === req.params.id);

  if (!matricula) {
    return res.status(404).json({ erro: 'Matrícula não encontrada' });
  }

  const alunoProprietario = req.usuario.role === 'aluno'
    && matricula.usuarioId === req.usuario.id;
  const podeRemover = req.usuario.role === 'admin' || alunoProprietario;

  if (!podeRemover) {
    return res.status(403).json({ erro: 'Você não tem permissão para cancelar esta matrícula' });
  }

  if (alunoProprietario && matricula.status === 'concluído') {
    return res.status(400).json({
      erro: 'Matrículas concluídas fazem parte do histórico e não podem ser canceladas'
    });
  }

  dados.matriculas = dados.matriculas?.filter(m => m.id !== req.params.id) || [];

  if (!salvarDados(dados)) {
    return res.status(500).json({ erro: 'Não foi possível cancelar a matrícula' });
  }

  res.status(204).send();
});

// GET - Matrículas por usuário
app.get('/api/usuarios/:usuarioId/matriculas', (req, res) => {
  const dados = lerDados();
  
  // Aluno só vê suas próprias matrículas
  if (req.usuario.role === 'aluno' && req.usuario.id !== req.params.usuarioId) {
    return res.status(403).json({ erro: 'Acesso negado' });
  }
  
  let matriculas = dados.matriculas?.filter(
    m => m.usuarioId === req.params.usuarioId
  ) || [];

  if (req.usuario.role === 'editor') {
    const cursosGerenciados = dados.cursos
      ?.filter(c => c.instrutorId === req.usuario.id)
      .map(c => c.id) || [];
    matriculas = matriculas.filter(m => cursosGerenciados.includes(m.cursoId));
  }

  res.json(matriculas);
});

// ============================================
// ENDPOINTS - AVALIAÇÕES
// ============================================

// GET - Listar avaliações (todos autenticados)
app.get('/api/avaliacoes', (req, res) => {
  const dados = lerDados();
  let avaliacoes = dados.avaliacoes || [];

  if (req.usuario.role === 'editor') {
    const cursosGerenciados = dados.cursos
      ?.filter(c => c.instrutorId === req.usuario.id)
      .map(c => c.id) || [];
    avaliacoes = avaliacoes.filter(a => cursosGerenciados.includes(a.cursoId));
  }

  res.json(avaliacoes);
});

// GET - Buscar avaliação por ID
app.get('/api/avaliacoes/:id', (req, res) => {
  const dados = lerDados();
  const avaliacao = dados.avaliacoes?.find(a => a.id === req.params.id);
  
  if (!avaliacao) {
    return res.status(404).json({ erro: 'Avaliação não encontrada' });
  }

  if (req.usuario.role === 'editor') {
    const curso = dados.cursos?.find(c => c.id === avaliacao.cursoId);
    if (!editorGerenciaCurso(req.usuario, curso)) {
      return res.status(403).json({ erro: 'Editor só pode consultar avaliações dos cursos que gerencia' });
    }
  }
  
  res.json(avaliacao);
});

// POST - Criar avaliação (aluno com curso concluído)
app.post('/api/avaliacoes',
  verificarRole(['aluno', 'admin']),
  validarCampos(['usuarioId', 'cursoId', 'nota']),
  (req, res) => {
    const dados = lerDados();
    const { usuarioId, cursoId, nota, comentario = '' } = req.body;
    
    // Aluno só pode avaliar seus próprios cursos
    if (req.usuario.role === 'aluno' && usuarioId !== req.usuario.id) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    const usuario = dados.usuarios?.find(u => u.id === usuarioId);
    if (!usuario || usuario.role !== 'aluno') {
      return res.status(400).json({ erro: 'Avaliação deve pertencer a um usuário com role aluno' });
    }
    
    // VALIDAÇÃO CRÍTICA: Só pode avaliar se curso estiver concluído
    const matricula = dados.matriculas?.find(
      m => m.usuarioId === usuarioId && m.cursoId === cursoId
    );
    
    if (!matricula) {
      return res.status(400).json({ erro: 'Usuário não está matriculado neste curso' });
    }
    
    if (matricula.status !== 'concluído') {
      return res.status(400).json({ 
        erro: 'Apenas cursos concluídos podem ser avaliados' 
      });
    }
    
    // VALIDAÇÃO CRÍTICA: Avaliação única por usuário/curso
    const avaliacaoExistente = dados.avaliacoes?.find(
      a => a.usuarioId === usuarioId && a.cursoId === cursoId
    );
    if (avaliacaoExistente) {
      return res.status(400).json({ 
        erro: 'Usuário já avaliou este curso' 
      });
    }
    
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      return res.status(400).json({ erro: 'Nota deve ser um número inteiro entre 1 e 5' });
    }
    
    if (comentario.length > 500) {
      return res.status(400).json({ erro: 'Comentário deve ter no máximo 500 caracteres' });
    }
    
    const novaAvaliacao = {
      id: 'ava' + Date.now() + Math.random().toString(36).substr(2, 4),
      usuarioId,
      cursoId,
      nota,
      comentario,
      data: new Date().toISOString()
    };
    
    if (!dados.avaliacoes) dados.avaliacoes = [];
    dados.avaliacoes.push(novaAvaliacao);
    salvarDados(dados);
    res.status(201).json(novaAvaliacao);
  }
);

// PUT - Atualizar avaliação (aluno próprio ou admin)
app.put('/api/avaliacoes/:id', (req, res) => {
  const dados = lerDados();
  const index = dados.avaliacoes?.findIndex(a => a.id === req.params.id);
  
  if (index === -1 || index === undefined) {
    return res.status(404).json({ erro: 'Avaliação não encontrada' });
  }
  
  const avaliacaoExistente = dados.avaliacoes[index];

  const podeAtualizar = req.usuario.role === 'admin'
    || (req.usuario.role === 'aluno' && avaliacaoExistente.usuarioId === req.usuario.id);
  if (!podeAtualizar) {
    return res.status(403).json({ erro: 'Acesso negado' });
  }
  
  // Validações
  if (req.body.nota !== undefined) {
    if (!Number.isInteger(req.body.nota) || req.body.nota < 1 || req.body.nota > 5) {
      return res.status(400).json({ erro: 'Nota deve ser um número inteiro entre 1 e 5' });
    }
  }
  
  if (req.body.comentario !== undefined && req.body.comentario.length > 500) {
    return res.status(400).json({ erro: 'Comentário deve ter no máximo 500 caracteres' });
  }
  
  dados.avaliacoes[index] = { ...avaliacaoExistente, ...req.body };
  salvarDados(dados);
  res.json(dados.avaliacoes[index]);
});

// DELETE - Remover avaliação (apenas admin)
app.delete('/api/avaliacoes/:id', verificarRole(['admin']), (req, res) => {
  const dados = lerDados();
  dados.avaliacoes = dados.avaliacoes?.filter(a => a.id !== req.params.id) || [];
  salvarDados(dados);
  res.status(204).send();
});

// GET - Avaliações por usuário
app.get('/api/usuarios/:usuarioId/avaliacoes', (req, res) => {
  const dados = lerDados();
  
  // Aluno só vê suas próprias avaliações
  if (req.usuario.role === 'aluno' && req.usuario.id !== req.params.usuarioId) {
    return res.status(403).json({ erro: 'Acesso negado' });
  }
  
  const avaliacoes = dados.avaliacoes?.filter(
    a => a.usuarioId === req.params.usuarioId
  ) || [];
  res.json(avaliacoes);
});

// GET - Avaliações por curso (já existe: /api/cursos/:cursoId/avaliacoes)

// ============================================
// ROTA PRINCIPAL
// ============================================

app.get('/', (req, res) => {
  res.json({
    mensagem: 'API Cursos Online',
    versao: '1.0.0',
    endpoints: [
      '/api/usuarios',
      '/api/categorias',
      '/api/cursos',
      '/api/aulas',
      '/api/matriculas',
      '/api/avaliacoes',
      '/api/login'
    ]
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  console.log(`📚 Endpoints disponíveis:`);
  console.log(`   GET    /api/usuarios`);
  console.log(`   GET    /api/categorias`);
  console.log(`   GET    /api/cursos`);
  console.log(`   GET    /api/aulas`);
  console.log(`   GET    /api/matriculas`);
  console.log(`   GET    /api/avaliacoes`);
  console.log(`   POST   /api/login`);
  console.log(`\n🔒 Sistema de Roles ativo:`);
  console.log(`   👤 Aluno: Visualizar cursos, matricular, avaliar`);
  console.log(`   ✏️ Editor: Gerenciar cursos, aulas, categorias`);
  console.log(`   👑 Admin: Gerenciar usuários e tudo mais`);
});
