const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Middleware para parsear JSON
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Caminho do arquivo JSON
const dadosPath = path.join(__dirname, 'data', 'db.json');

// Função para ler os dados
function lerDados() {
  try {
    const dados = fs.readFileSync(dadosPath, 'utf8');
    return JSON.parse(dados);
  } catch (error) {
    console.error('Erro ao ler arquivo JSON:', error);
    return {};
  }
}

// Função para salvar os dados
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
// ENDPOINTS - USUÁRIOS
// ============================================

app.get('/api/usuarios', (req, res) => {
  const dados = lerDados();
  const usuarios = dados.usuarios?.map(u => {
    const { senha, ...usuarioSemSenha } = u;
    return usuarioSemSenha;
  }) || [];
  res.json(usuarios);
});

app.get('/api/usuarios/:id', (req, res) => {
  const dados = lerDados();
  const usuario = dados.usuarios?.find(u => u.id === req.params.id);
  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }
  const { senha, ...usuarioSemSenha } = usuario;
  res.json(usuarioSemSenha);
});

app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
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

app.post('/api/usuarios', (req, res) => {
  const dados = lerDados();
  const novoUsuario = {
    id: String(Date.now()),
    ...req.body,
    ativo: req.body.ativo ?? true
  };
  
  if (!dados.usuarios) dados.usuarios = [];
  dados.usuarios.push(novoUsuario);
  salvarDados(dados);
  
  const { senha, ...usuarioSemSenha } = novoUsuario;
  res.status(201).json(usuarioSemSenha);
});

app.put('/api/usuarios/:id', (req, res) => {
  const dados = lerDados();
  const index = dados.usuarios?.findIndex(u => u.id === req.params.id);
  if (index === -1 || index === undefined) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }
  
  dados.usuarios[index] = { ...dados.usuarios[index], ...req.body };
  salvarDados(dados);
  
  const { senha, ...usuarioSemSenha } = dados.usuarios[index];
  res.json(usuarioSemSenha);
});

app.delete('/api/usuarios/:id', (req, res) => {
  const dados = lerDados();
  dados.usuarios = dados.usuarios?.filter(u => u.id !== req.params.id) || [];
  salvarDados(dados);
  res.status(204).send();
});

// ============================================
// ENDPOINTS - CATEGORIAS
// ============================================

app.get('/api/categorias', (req, res) => {
  const dados = lerDados();
  res.json(dados.categorias || []);
});

app.get('/api/categorias/:id', (req, res) => {
  const dados = lerDados();
  const categoria = dados.categorias?.find(c => c.id === req.params.id);
  if (!categoria) {
    return res.status(404).json({ erro: 'Categoria não encontrada' });
  }
  res.json(categoria);
});

app.post('/api/categorias', (req, res) => {
  const dados = lerDados();
  const novaCategoria = {
    id: String(Date.now()),
    ...req.body
  };
  if (!dados.categorias) dados.categorias = [];
  dados.categorias.push(novaCategoria);
  salvarDados(dados);
  res.status(201).json(novaCategoria);
});

app.put('/api/categorias/:id', (req, res) => {
  const dados = lerDados();
  const index = dados.categorias?.findIndex(c => c.id === req.params.id);
  if (index === -1 || index === undefined) {
    return res.status(404).json({ erro: 'Categoria não encontrada' });
  }
  dados.categorias[index] = { ...dados.categorias[index], ...req.body };
  salvarDados(dados);
  res.json(dados.categorias[index]);
});

app.delete('/api/categorias/:id', (req, res) => {
  const dados = lerDados();
  dados.categorias = dados.categorias?.filter(c => c.id !== req.params.id) || [];
  salvarDados(dados);
  res.status(204).send();
});

// ============================================
// ENDPOINTS - CURSOS
// ============================================

app.get('/api/cursos', (req, res) => {
  const dados = lerDados();
  res.json(dados.cursos || []);
});

app.get('/api/cursos/:id', (req, res) => {
  const dados = lerDados();
  const curso = dados.cursos?.find(c => c.id === req.params.id);
  if (!curso) {
    return res.status(404).json({ erro: 'Curso não encontrado' });
  }
  res.json(curso);
});

app.post('/api/cursos', (req, res) => {
  const dados = lerDados();
  const novoCurso = {
    id: String(Date.now()),
    ...req.body
  };
  if (!dados.cursos) dados.cursos = [];
  dados.cursos.push(novoCurso);
  salvarDados(dados);
  res.status(201).json(novoCurso);
});

app.put('/api/cursos/:id', (req, res) => {
  const dados = lerDados();
  const index = dados.cursos?.findIndex(c => c.id === req.params.id);
  if (index === -1 || index === undefined) {
    return res.status(404).json({ erro: 'Curso não encontrado' });
  }
  dados.cursos[index] = { ...dados.cursos[index], ...req.body };
  salvarDados(dados);
  res.json(dados.cursos[index]);
});

app.delete('/api/cursos/:id', (req, res) => {
  const dados = lerDados();
  dados.cursos = dados.cursos?.filter(c => c.id !== req.params.id) || [];
  salvarDados(dados);
  res.status(204).send();
});

// ============================================
// ENDPOINTS - AULAS
// ============================================

app.get('/api/aulas', (req, res) => {
  const dados = lerDados();
  res.json(dados.aulas || []);
});

app.get('/api/aulas/:id', (req, res) => {
  const dados = lerDados();
  const aula = dados.aulas?.find(a => a.id === req.params.id);
  if (!aula) {
    return res.status(404).json({ erro: 'Aula não encontrada' });
  }
  res.json(aula);
});

app.get('/api/cursos/:cursoId/aulas', (req, res) => {
  const dados = lerDados();
  const aulas = dados.aulas?.filter(a => a.cursoId === req.params.cursoId) || [];
  res.json(aulas);
});

app.post('/api/aulas', (req, res) => {
  const dados = lerDados();
  const novaAula = {
    id: String(Date.now()),
    ...req.body
  };
  if (!dados.aulas) dados.aulas = [];
  dados.aulas.push(novaAula);
  salvarDados(dados);
  res.status(201).json(novaAula);
});

app.put('/api/aulas/:id', (req, res) => {
  const dados = lerDados();
  const index = dados.aulas?.findIndex(a => a.id === req.params.id);
  if (index === -1 || index === undefined) {
    return res.status(404).json({ erro: 'Aula não encontrada' });
  }
  dados.aulas[index] = { ...dados.aulas[index], ...req.body };
  salvarDados(dados);
  res.json(dados.aulas[index]);
});

app.delete('/api/aulas/:id', (req, res) => {
  const dados = lerDados();
  dados.aulas = dados.aulas?.filter(a => a.id !== req.params.id) || [];
  salvarDados(dados);
  res.status(204).send();
});

// ============================================
// ENDPOINTS - MATRÍCULAS
// ============================================

app.get('/api/matriculas', (req, res) => {
  const dados = lerDados();
  res.json(dados.matriculas || []);
});

app.get('/api/matriculas/:id', (req, res) => {
  const dados = lerDados();
  const matricula = dados.matriculas?.find(m => m.id === req.params.id);
  if (!matricula) {
    return res.status(404).json({ erro: 'Matrícula não encontrada' });
  }
  res.json(matricula);
});

app.get('/api/usuarios/:usuarioId/matriculas', (req, res) => {
  const dados = lerDados();
  const matriculas = dados.matriculas?.filter(m => m.usuarioId === req.params.usuarioId) || [];
  res.json(matriculas);
});

app.post('/api/matriculas', (req, res) => {
  const dados = lerDados();
  const novaMatricula = {
    id: String(Date.now()),
    ...req.body,
    dataMatricula: req.body.dataMatricula || new Date().toISOString().split('T')[0]
  };
  if (!dados.matriculas) dados.matriculas = [];
  dados.matriculas.push(novaMatricula);
  salvarDados(dados);
  res.status(201).json(novaMatricula);
});

app.put('/api/matriculas/:id', (req, res) => {
  const dados = lerDados();
  const index = dados.matriculas?.findIndex(m => m.id === req.params.id);
  if (index === -1 || index === undefined) {
    return res.status(404).json({ erro: 'Matrícula não encontrada' });
  }
  dados.matriculas[index] = { ...dados.matriculas[index], ...req.body };
  salvarDados(dados);
  res.json(dados.matriculas[index]);
});

app.delete('/api/matriculas/:id', (req, res) => {
  const dados = lerDados();
  dados.matriculas = dados.matriculas?.filter(m => m.id !== req.params.id) || [];
  salvarDados(dados);
  res.status(204).send();
});

// ============================================
// ENDPOINTS - AVALIAÇÕES
// ============================================

app.get('/api/avaliacoes', (req, res) => {
  const dados = lerDados();
  res.json(dados.avaliacoes || []);
});

app.get('/api/avaliacoes/:id', (req, res) => {
  const dados = lerDados();
  const avaliacao = dados.avaliacoes?.find(a => a.id === req.params.id);
  if (!avaliacao) {
    return res.status(404).json({ erro: 'Avaliação não encontrada' });
  }
  res.json(avaliacao);
});

app.get('/api/cursos/:cursoId/avaliacoes', (req, res) => {
  const dados = lerDados();
  const avaliacoes = dados.avaliacoes?.filter(a => a.cursoId === req.params.cursoId) || [];
  res.json(avaliacoes);
});

app.post('/api/avaliacoes', (req, res) => {
  const dados = lerDados();
  const novaAvaliacao = {
    id: String(Date.now()),
    ...req.body,
    dataAvaliacao: req.body.dataAvaliacao || new Date().toISOString().split('T')[0]
  };
  if (!dados.avaliacoes) dados.avaliacoes = [];
  dados.avaliacoes.push(novaAvaliacao);
  salvarDados(dados);
  res.status(201).json(novaAvaliacao);
});

app.put('/api/avaliacoes/:id', (req, res) => {
  const dados = lerDados();
  const index = dados.avaliacoes?.findIndex(a => a.id === req.params.id);
  if (index === -1 || index === undefined) {
    return res.status(404).json({ erro: 'Avaliação não encontrada' });
  }
  dados.avaliacoes[index] = { ...dados.avaliacoes[index], ...req.body };
  salvarDados(dados);
  res.json(dados.avaliacoes[index]);
});

app.delete('/api/avaliacoes/:id', (req, res) => {
  const dados = lerDados();
  dados.avaliacoes = dados.avaliacoes?.filter(a => a.id !== req.params.id) || [];
  salvarDados(dados);
  res.status(204).send();
});

// ============================================
// ENDPOINTS - CONSULTAS ESPECIAIS
// ============================================

app.get('/api/categorias/:categoriaId/cursos', (req, res) => {
  const dados = lerDados();
  const cursos = dados.cursos?.filter(c => c.categoriaId === req.params.categoriaId) || [];
  res.json(cursos);
});

app.get('/api/instrutores/:instrutorId/cursos', (req, res) => {
  const dados = lerDados();
  const cursos = dados.cursos?.filter(c => c.instrutorId === req.params.instrutorId) || [];
  res.json(cursos);
});

// ============================================
// ROTA PRINCIPAL
// ============================================

app.get('/', (req, res) => {
  res.json({
    mensagem: 'API Cursos Online',
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
});