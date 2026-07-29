const jsonServer = require("json-server");
const path = require("path");

const server = jsonServer.create();

const router = jsonServer.router(
  path.join(__dirname, "data", "db.json")
);

const middlewares = jsonServer.defaults({
  static: path.join(__dirname, "public")
});

const PORT = 3001;

server.use(middlewares);
server.use(jsonServer.bodyParser);

server.get("/status", (req, res) => {
  res.status(200).json({
    mensagem: "API da Plataforma de Cursos Online está funcionando.",
    status: "online"
  });
});

server.use(router);

server.listen(PORT, () => {
  console.log("");
  console.log("==========================================");
  console.log("🎓 Plataforma de Cursos Online");
  console.log(`🚀 API executando em http://localhost:${PORT}`);
  console.log(`📚 Cursos: http://localhost:${PORT}/cursos`);
  console.log(`👥 Usuários: http://localhost:${PORT}/usuarios`);
  console.log("==========================================");
  console.log("");
});