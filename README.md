# Web Development I

Repositório de estudos e projetos da disciplina **Desenvolvimento Web I**, do curso de Sistemas para Internet do IFPI, campus São Raimundo Nonato (PI).

Os projetos exploram a construção de aplicações web com Node.js puro, partindo do protocolo HTTP e evoluindo até formulários server-side, autenticação, sessões e testes automatizados.

## Tecnologias

- **JavaScript moderno** com módulos ES (`import`/`export`) e APIs nativas do Node.js
- **Node.js HTTP** sem frameworks, incluindo criação de servidores, rotas, métodos HTTP, headers, status codes e streams
- **Sistema de arquivos** com `fs/promises`, `createReadStream`, resolução de caminhos e tipos MIME
- **Nunjucks** para renderização server-side com autoescape
- **HTML, CSS e JavaScript no navegador** para páginas e recursos estáticos
- **Segurança web**: escape de HTML, prevenção de path traversal, validação de entradas, hash PBKDF2, comparação com `timingSafeEqual` e cookies `HttpOnly`/`SameSite`
- **Testes automatizados** com `node:test`, testes de integração/E2E e especificações em Gherkin

## Projetos

### [Static File Server](static-file-server/)

Servidor de arquivos estáticos semelhante a `python3 -m http.server`, implementado com módulos nativos do Node.js.

Habilidades demonstradas:

- Servir arquivos com `createReadStream` e `Content-Length`
- Suporte a `GET` e `HEAD`
- Detecção de tipos MIME
- Redirecionamento de diretórios e suporte a `index.html`
- Listagem de diretórios ordenada, com links codificados e escape contra XSS
- Tratamento de erros `400`, `403`, `404`, `405` e `500`
- Prevenção de acesso fora da raiz pública com resolução segura de caminhos
- Versão alternativa com listagem visual, breadcrumbs, busca e logs coloridos

Para executar:

```bash
cd static-file-server
npm install
npm start
```

Servidores disponíveis em `http://localhost:3000` e, na versão elegante, `http://localhost:3001`.

### [Echo Web Server](echo-web-server/)

Servidor HTTP que inspeciona e devolve em JSON os dados da requisição recebida.

Habilidades demonstradas:

- Leitura do corpo da requisição por chunks
- Parsing de URL, query string e JSON
- Inspeção de método, headers, versão HTTP e timestamp
- Serialização de respostas JSON formatadas

Para executar:

```bash
cd echo-web-server
npm start
```

Também há uma demonstração publicada em [Render](https://web-development-i-y03y.onrender.com/).

### [Form Processing Server](form-processing-server/)

Aplicação de cadastro de cliente com formulário HTML, processamento `POST`, renderização server-side e validações de domínio.

Habilidades demonstradas:

- Uso de Nunjucks para templates e autoescape
- Validação de nome, e-mail, data de nascimento e senha
- Preservação dos valores informados após erro
- Mensagens de validação associadas aos campos e uso de `aria-invalid`
- Tratamento de arquivos estáticos e listagem de diretórios
- Testes automatizados com `node:test`

Para executar e testar:

```bash
cd form-processing-server
npm install
npm start
npm test
```

### [Auth Session Cookies Server](auth-session-cookies-server/)

Aplicação server-side com cadastro, login, logout, áreas protegidas e painel administrativo.

Habilidades demonstradas:

- Cadastro e autenticação com respostas HTTP apropriadas (`400`, `401`, `409`, `302`)
- Hash de senhas com salt aleatório, PBKDF2 e SHA-512
- Comparação de credenciais com `crypto.timingSafeEqual`
- Sessões em memória com expiração e limpeza periódica
- Cookies de sessão com `HttpOnly`, `Path`, `SameSite=Strict` e invalidação no logout
- Proteção de rotas e renderização contextual com Nunjucks
- Cenários de comportamento em Gherkin e testes E2E com `node:test`

Para executar:

```bash
cd auth-session-cookies-server
npm install
npm start
```

Em outro terminal, com o servidor ativo:

```bash
npm run test:e2e
```

## Habilidades praticadas

Este repositório evidencia a evolução dos seguintes conhecimentos:

1. Construção de servidores web usando apenas APIs nativas do Node.js.
2. Entendimento prático do ciclo de uma requisição HTTP e de seus status codes.
3. Manipulação segura de URLs, caminhos, arquivos, streams e dados de formulários.
4. Renderização server-side e criação de interfaces HTML acessíveis.
5. Validação de dados e tratamento explícito de erros.
6. Fundamentos de autenticação, criptografia aplicada, cookies e sessões.
7. Desenvolvimento orientado a comportamento com testes automatizados.

## Requisitos gerais

- Node.js com suporte a módulos ES.
- Node.js 24 ou superior para o projeto de processamento de formulários.
- Dependências locais instaladas com `npm install` em cada pasta que possui `package.json`.