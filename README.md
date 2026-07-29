# 🎓 Plataforma de Cursos Online

Plataforma web para gerenciamento e consumo de cursos online, desenvolvida com **HTML5, CSS3, JavaScript Vanilla, Node.js e JSON Server**.

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
- Session Storage;
- manipulação do DOM;
- layout responsivo.

### Backend simulado

- Node.js;
- JSON Server;
- middlewares personalizados;
- API REST;
- arquivo JSON como banco de dados.

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


oi chester