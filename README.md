# 🎓 Plataforma de Cursos Online

Plataforma web para gerenciamento e consumo de cursos online, desenvolvida com **HTML5, CSS3, JavaScript Vanilla, Node.js, Express e JSON Server**.

O sistema permite que alunos visualizem cursos, realizem matrículas, acompanhem seu progresso e publiquem avaliações. Editores podem gerenciar conteúdos educacionais, enquanto administradores possuem controle completo sobre os usuários e os demais recursos da plataforma.

O projeto utiliza uma API REST simulada com seis endpoints integrados e middlewares personalizados para validar as principais regras de negócio.

---

## 👥 Equipe

### Desenvolvedores

- **CHESTER** — Backend, regras de negócio, integração com a API e estrutura de dados.
- **MOURA** — Frontend visual, experiência do usuário, responsividade e identidade visual.

---

## 🤖 Esquadrão de Inteligências Artificiais

Durante o desenvolvimento, a equipe contou com o apoio de diferentes ferramentas de inteligência artificial:

| Inteligência Artificial | Papel no projeto |
|---|---|
| **Qwen** | Arquiteto da solução, planejamento técnico e definição estrutural do projeto. |
| **Codex / ChatGPT** | Desenvolvimento da lógica, serviços da API, validações, regras de negócio e suporte técnico. |
| **Claude Pro** | Revisão de código, análise de requisitos e sugestões de melhorias. |
| **DeepSeek** | Apoio em consultas técnicas, resolução de problemas e validação de alternativas. |

As ferramentas de inteligência artificial foram utilizadas como apoio ao desenvolvimento. As decisões, implementações, integrações e testes foram realizados e validados pela equipe.

---

## 🎯 Objetivo do Projeto

Desenvolver uma plataforma de cursos online capaz de simular um ambiente educacional com diferentes níveis de acesso.

O sistema possui:

- autenticação simulada;
- autorização baseada em roles;
- catálogo de cursos;
- gerenciamento de categorias;
- gerenciamento de cursos e aulas;
- matrículas;
- controle de progresso;
- avaliações;
- gerenciamento de usuários;
- validações de regras de negócio;
- comunicação assíncrona com uma API REST.

---

## 🛠️ Tecnologias Utilizadas

### Frontend

- HTML5 semântico;
- CSS3 puro;
- JavaScript Vanilla;
- JavaScript ES Modules;
- Fetch API;
- Async/Await;
- Local Storage;
- manipulação do DOM;
- layout responsivo.

### Backend simulado

- Node.js;
- JSON Server em modo programático (`jsonServer.create`);
- Express, utilizado pela base do JSON Server e pelos arquivos estáticos;
- middlewares personalizados;
- API REST;
- arquivo JSON como banco de dados.

### Autenticação e autorização simuladas

O JSON Server não oferece autenticação ou autorização nativas. Neste projeto, o login gera um token simulado e mantém a sessão no `localStorage`. O frontend oculta rotas e ações incompatíveis com o role ativo, mas essa proteção visual não é considerada uma barreira de segurança.

Para tornar o exercício verificável e impedir alterações diretas indevidas, o servidor também aplica middlewares personalizados de autenticação, autorização por role e validação de dados antes de persistir no `data/db.json`.

Os três roles aceitos são:

- `aluno`: consulta cursos publicados, gerencia a própria matrícula e avalia cursos concluídos;
- `editor`: gerencia somente os cursos e aulas sob sua responsabilidade e consulta o engajamento desses cursos;
- `admin`: gerencia usuários, roles, status e todos os conteúdos da plataforma.

Embora o administrador tenha acesso total aos recursos, uma matrícula continua exigindo um usuário com `role: aluno`, conforme a validação obrigatória do enunciado.

### Ferramentas

- Visual Studio Code;
- Git;
- GitHub;
- npm;
- Live Server;
- navegador com DevTools.

---

## 🏗️ Arquitetura do Projeto

O frontend foi estruturado com separação de responsabilidades.

```text
cursos-online/
├── data/
│   └── db.json
│
├── public/
│   ├── css/
│   │   ├── auth.css
│   │   ├── catalogo.css
│   │   ├── dashboard.css
│   │   └── global.css
│   │
│   ├── js/
│   │   ├── components/
│   │   │   ├── courseCard.js
│   │   │   ├── header.js
│   │   │   └── userTable.js
│   │   │
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── aulas.js
│   │   │   ├── avaliacoes.js
│   │   │   ├── categorias.js
│   │   │   ├── cursos.js
│   │   │   ├── matriculas.js
│   │   │   └── usuarios.js
│   │   │
│   │   ├── store/
│   │   │   └── authStore.js
│   │   │
│   │   ├── utils/
│   │   │   ├── permissions.js
│   │   │   └── validations.js
│   │   │
│   │   ├── main.js
│   │   └── router.js
│   │
│   ├── admin.html
│   ├── catalogo.html
│   ├── curso.html
│   ├── editor.html
│   ├── index.html
│   └── perfil.html
│
├── package.json
├── README.md
└── server.js


# 📚 Plataforma de Cursos Online

Plataforma educacional com sistema de roles (aluno, editor, admin) e API RESTful.

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js (v14+)
- npm

### Instalação
```bash
# Clone o repositório
git clone <url-do-repositorio>

# Entre na pasta
cd Cursos-online

# Instale as dependências
npm install

# Rode o servidor
npm run server
