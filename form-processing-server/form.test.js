import assert from "node:assert/strict";
import { test } from "node:test";

const HOST = "127.0.0.1";
const PORT = "8080";
const BASE_URL = `http://${HOST}:${PORT}`;

async function request(pathname, options = {}) {
    const response = await fetch(`${BASE_URL}${pathname}`, options);
    const body = Buffer.from(await response.arrayBuffer());

    return {
        body,
        headers: response.headers,
        status: response.status,
        text: body.toString("utf8"),
    };
}

async function submitForm(overrides = {}) {
    const payload = new URLSearchParams({
        user_name: "Fulano Silva",
        user_email: "fulano@example.com",
        user_password: "Senha@123",
        user_birthday: "2000-05-20",
        ...overrides,
    });

    return request("/usuario/criar/", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
    });
}

test("GET / renderiza o formulário inicial", async () => {
    const response = await request("/");

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^text\/html/);
    assert.match(response.text, /<h1>WebDev-Form<\/h1>/);
    assert.match(response.text, /Cadastro de Cliente/);
});

test("GET de arquivo estático existente retorna o conteúdo com mime type correto", async () => {
    const response = await request("/static/scripts/index.js");

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "text/javascript");
    assert.match(response.text, /alert\("E aew!"\);/);
});

test("GET de arquivo estático existente retorna o conteúdo com mime type correto", async () => {
    const response = await request("/static/styles/thema.css");

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "text/css");
});

test("GET de arquivo estático existente retorna o conteúdo com mime type correto", async () => {
    const response = await request("/static/images/gameboy.png");

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/png");
});

test("GET de diretório sem barra final responde com redirecionamento", async () => {
    const response = await request("/static", { redirect: "manual" });

    assert.equal(response.status, 301);
    assert.equal(response.headers.get("location"), "/static/");
});

test("GET de diretório com barra final retorna listagem de arquivos", async () => {
    const response = await request("/static/");

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^text\/html/);
    assert.match(response.text, /Directory listing for \/static\//);
    assert.match(response.text, /scripts\//);
    assert.match(response.text, /styles\//);
    assert.match(response.text, /images\//);
});

test("GET de caminho inexistente retorna 404", async () => {
    const response = await request("/nao-existe");

    assert.equal(response.status, 404);
    assert.match(response.headers.get("content-type"), /^text\/html/);
    assert.match(response.text, /Error code: 404/);
});

test("POST válido renderiza a página de sucesso", async () => {
    const response = await submitForm();

    assert.equal(response.status, 200);
    assert.match(response.text, /Cliente Cadastrado com Sucesso/);
    assert.match(response.text, /FULANO SILVA/);
    assert.match(response.text, /fulano@example\.com/);
    assert.match(response.text, /20\/05\/2000/);
});

test("POST com nome maior que 256 caracteres mostra erro", async () => {
    const response = await submitForm({
        user_name: "a".repeat(257),
    });

    assert.equal(response.status, 200);
    assert.match(
        response.text,
        /Nome de Usuário inválido: não pode ser maior que 256 caracteres/,
    );
    assert.match(response.text, /name="user_name"[^>]*aria-invalid="true"/);
});

test("POST com nome menor que 6 caracteres mostra erro", async () => {
    const response = await submitForm({
        user_name: "Abc",
    });

    assert.equal(response.status, 200);
    assert.match(
        response.text,
        /Nome de Usuário inválido: não pode ser menor que 6 caracteres/,
    );
});

test("POST com e-mail maior que 256 caracteres mostra erro", async () => {
    const response = await submitForm({
        user_email: `${"a".repeat(248)}@mail.com`,
    });

    assert.equal(response.status, 200);
    assert.match(
        response.text,
        /E-mail inválido: não pode ser maior que 256 caracteres/,
    );
    assert.match(response.text, /name="user_email"[^>]*aria-invalid="true"/);
});

test("POST com e-mail sem @ mostra erro específico", async () => {
    const response = await submitForm({
        user_email: "fulano.example.com",
    });

    assert.equal(response.status, 200);
    assert.match(response.text, /E-mail inválido: deve possuir o @/);
});

test("POST com e-mail fora do formato esperado mostra erro genérico", async () => {
    const response = await submitForm({
        user_email: "fulano@localhost",
    });

    assert.equal(response.status, 200);
    assert.match(response.text, /E-mail inválido/);
});

test("POST com data de aniversário fora do formato esperado mostra erro", async () => {
    const response = await submitForm({
        user_birthday: "2024-1-1",
    });

    assert.equal(response.status, 200);
    assert.match(response.text, /Data de Aniversário inválida/);
    assert.match(response.text, /name="user_birthday"[^>]*aria-invalid="true"/);
});

test("POST com data de aniversário futura mostra erro", async () => {
    const response = await submitForm({
        user_birthday: "2999-12-31",
    });

    assert.equal(response.status, 200);
    assert.match(
        response.text,
        /Data de Aniversário inválida: não pode ser uma data futura/,
    );
});

test("POST com senha maior que 128 caracteres mostra erro", async () => {
    const response = await submitForm({
        user_password: `A1@${"a".repeat(126)}`,
    });

    assert.equal(response.status, 200);
    assert.match(
        response.text,
        /Senha inválida: não pode ser maior que 128 caracteres/,
    );
    assert.match(response.text, /name="user_password"[^>]*aria-invalid="true"/);
});

test("POST com senha menor que 8 caracteres mostra erro", async () => {
    const response = await submitForm({
        user_password: "A1@abc",
    });

    assert.equal(response.status, 200);
    assert.match(
        response.text,
        /Senha inválida: não pode ser menor que 8 caracteres/,
    );
});

test("POST com senha sem letras mostra erro", async () => {
    const response = await submitForm({
        user_password: "1234567@",
    });

    assert.equal(response.status, 200);
    assert.match(
        response.text,
        /Senha inválida: deve conter pelo menos uma letra/,
    );
});

test("POST com senha sem números mostra erro", async () => {
    const response = await submitForm({
        user_password: "Senha@@@",
    });

    assert.equal(response.status, 200);
    assert.match(
        response.text,
        /Senha inválida: deve conter pelo menos um número/,
    );
});

test("POST com senha sem caractere especial mostra erro", async () => {
    const response = await submitForm({
        user_password: "Senha123",
    });

    assert.equal(response.status, 200);
    assert.match(
        response.text,
        /Senha inválida: deve conter pelo menos um caractere especial como @\$!%\*\?&/,
    );
});
