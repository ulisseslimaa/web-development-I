# WebDev-Form

Aplicação Node.js com formulário de cadastro de cliente e cobertura automatizada para o fluxo principal de submissão.

## Requisitos

- Node.js 24 ou superior
- Dependências instaladas com `npm install`

## Como executar

1. Inicie o servidor:

```bash
node --watch --watch-path=./templates form.mjs
```

2. A aplicação ficará disponível em `http://127.0.0.1:8080/`.

## Como rodar os testes

Com o servidor em execução, execute:

```bash
node --test form.test.mjs
```

## Comportamento esperado do formulário

O formulário possui quatro campos de entrada:

- `user_name` (`Nome Completo`)
- `user_birthday` (`Data de Nascimento`)
- `user_email` (`E-mail`)
- `user_password` (`Senha`)

Quando o envio é válido, a aplicação deve:

- responder com status `200`
- exibir a mensagem `Cliente Cadastrado com Sucesso`
- mostrar o nome em maiúsculas
- mostrar o e-mail enviado
- mostrar a data de nascimento formatada em `dd/mm/aaaa`

Quando existe erro de validação, a aplicação deve:

- responder com status `200`
- renderizar novamente o formulário
- manter os valores digitados em nome, e-mail e data
- marcar o campo inválido com `aria-invalid="true"`
- exibir a mensagem de erro correspondente ao lado do campo

## Regras por campo

### `user_name` (`Nome Completo`)

Deve aceitar um nome com tamanho entre 6 e 256 caracteres.

- Se tiver mais de 256 caracteres, deve exibir: `Nome de Usuário inválido: não pode ser maior que 256 caracteres`
- Se tiver menos de 6 caracteres, deve exibir: `Nome de Usuário inválido: não pode ser menor que 6 caracteres`

### `user_email` (`E-mail`)

Deve aceitar um e-mail com no máximo 256 caracteres e formato convencional.

- Se tiver mais de 256 caracteres, deve exibir: `E-mail inválido: não pode ser maior que 256 caracteres`
- Se não contiver `@`, deve exibir: `E-mail inválido: deve possuir o @`
- Se não corresponder ao formato esperado de e-mail, deve exibir: `E-mail inválido`

Exemplos cobertos nos testes:

- `fulano@example.com`: válido
- `fulano.example.com`: inválido por não conter `@`
- `fulano@localhost`: inválido por não atender ao formato esperado

### `user_birthday` (`Data de Nascimento`)

Deve aceitar uma data no formato `aaaa-mm-dd` e não pode representar uma data futura.

- Se a string da data não estiver no formato esperado, deve exibir: `Data de Aniversário inválida`
- Se a data informada estiver no futuro, deve exibir: `Data de Aniversário inválida: não pode ser uma data futura`

Exemplos cobertos nos testes:

- `2000-05-20`: válido
- `2024-1-1`: inválido por formato incorreto
- `2999-12-31`: inválido por ser futura

### `user_password` (`Senha`)

Deve aceitar uma senha com 8 a 128 caracteres, contendo ao menos:

- uma letra
- um número
- um caractere especial entre `@$!%*?&`

Mensagens esperadas:

- Mais de 128 caracteres: `Senha inválida: não pode ser maior que 128 caracteres`
- Menos de 8 caracteres: `Senha inválida: não pode ser menor que 8 caracteres`
- Sem letras: `Senha inválida: deve conter pelo menos uma letra`
- Sem números: `Senha inválida: deve conter pelo menos um número`
- Sem caractere especial permitido: `Senha inválida: deve conter pelo menos um caractere especial como @$!%*?&`

Exemplos cobertos nos testes:

- `Senha@123`: válido
- `A1@abc`: inválido por ter menos de 8 caracteres
- `1234567@`: inválido por não conter letras
- `Senha@@@`: inválido por não conter números
- `Senha123`: inválido por não conter caractere especial permitido
