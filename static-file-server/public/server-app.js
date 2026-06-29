const http = require('node:http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Servidor rodando com sucesso!');
});

server.listen(3000, () => {
  console.log('Servidor iniciado em http://localhost:3000');
});