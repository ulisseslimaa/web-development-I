# Webdev Cookie

Aplicação com autenticação baseada em sessão, renderização server-side.

## Requisitos

- Node.js com suporte a ESM e `node:test:e2e`

## Instalação

```sh
npm install
```

## Testes

Executar a suíte:

```sh
npm test:e2e
```

## Observações

- O estado da aplicação não persiste reinícios do processo.
- A rota `/admin` expõe dados sensíveis de usuários e sessões e hoje serve apenas para estudo, depuração ou demonstração.
