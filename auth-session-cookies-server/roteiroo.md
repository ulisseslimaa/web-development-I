# Roteiro da Apresentação

Webdev Cookie, uma aplicação web focada em demonstrar conceitos fundamentais de autenticação e gerenciamento de sessões. 

-> fluxo completo de login e cadastro. 
-> renderizado no lado do servidor (Server-Side Rendering)
-> front (framework Tailwind CSS)
-> dados dos usuários ficam armazenados na memória RAM do servidor ( dicionário Map). 
-> nenhuma senha é salva em texto puro. Quando um usuário se cadastra:
   * gero um salt aleatório.
   * Uso o algoritmo pbkdf2 com a função hash sha512 nativos do Node.js (módulo crypto) para criar um hash forte.
   * n login, para evitar ataques de tempo (timing attacks), faço a comparação das senhas utilizando a função segura timingSafeEqual."
* Quando o usuário acerta as credenciais, o servidor cria uma sessão para ele:
    * Cada sessão guarda o e-mail, a data de criação e quantas vezes (views) a página foi acessada.
    * um setInterval roda de minuto em minuto limpando qualquer sessão que já tenha passado de 30 minutos.
    * O servidor envia para o browser um cookie sessionId. Para garantir segurança contra ataques XSS e CSRF, esse cookie usa as flags HttpOnly (bloqueando acesso via JavaScript), SameSite=Strict e Path=/."

---

## Demonstração das Rotas (Navegação)

* **Rotas Públicas:** "Aqui está a Home (/).apenas os botões de Login e Cadastro. Qualquer tentativa de acessar áreas protegidas sem login retorna um Erro 401 (Acesso não autorizado)."

* **Registro/Login:** criar uma conta e depois fazer login. Ao logar com sucesso (POST /login), o servidor me responde com um código HTTP 302, redirecionando automaticamente para o Dashboard.

* **Rotas Protegidas:** "Agora no Dashboard (/dashboard), o servidor reconhece meu cookie e entra. Se eu tentar ir para uma página que não existe, o sistema me mostra uma página de erro 404 amigável (o Fallback)."

* **A Rota Admin:** lista todas as senhas (em formato Hash) e todas as sessões ativas no momento, salvo na memória."

* **Logout:** ao clicar em Logout, a rota POST /logout destrói minha sessão na memória e manda o browser invalidar meu cookie na hora."

---

## Tecnologias utilizadas

* **Tecnologias Básicas:** Node.js puro (node:http), Nunjucks (Templates SSR), Tailwind CDN (Estilos).
* **Criptografia:** Módulo nativo node:crypto. Hash feito com PBKDF2 + SHA-512 + Salt Aleatório.
* **Segurança da Senha:** Comparação constante de tempo usando crypto.timingSafeEqual.
* **Proteção do Cookie:**
  * **HttpOnly:** Impede que scripts maliciosos roubem a sessão (XSS).
  * **SameSite=Strict:** Impede o cookie de ser enviado por requisições de outros sites (CSRF).
* **Armazenamento:** Memória Volátil (usando estrutura de dados Map()).
* **Limpeza:** Um Garbage Collector manual varre e deleta sessões maiores de 30 minutos.