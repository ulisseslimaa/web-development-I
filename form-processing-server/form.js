import console, { error } from "node:console";
import { readdir, readFile } from "node:fs/promises";
import { createServer } from "node:http";

import nunjucks from 'nunjucks'

const PORT = 8080;

const HOST = "0.0.0.0";

nunjucks.configure(".", {
    autoescape: true,
});

const INDEX_BEGIN_TEMPLATE = `
<!DOCTYPE HTML>
<html lang="en">

<head>
    <meta charset="utf-8">
    <style type="text/css">
        :root {
            color-scheme: light dark;
        }
    </style>
    <title>Directory listing for {{FILE_PATH}}</title>
</head>

<body>
    <h1>Directory listing for {{FILE_PATH}}</h1>
    <hr>
    <ul>
`;

const FILE_NAME_TEMPLATE = `
<li>
    <a href="{{FILE_NAME}}">
        {{FILE_NAME}}
    </a>
</li>
`;

const INDEX_END_TEMPLATE = `
    </ul>
    <hr>
</body>

</html>
`;

const NOT_FOUND_TEMPLATE = `
<!DOCTYPE HTML>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <style type="text/css">
            :root {
                color-scheme: light dark;
            }
        </style>
        <title>Error response</title>
    </head>
    <body>
        <h1>Error response</h1>
        <p>Error code: 404</p>
        <p>Message: File not found.</p>
        <p>Error code explanation: 404 - Nothing matches the given URI.</p>
    </body>
</html>
`;

const MIME_TYPES = {
    default: "text/html; charset=utf-8",
    html: "text/html; charset=utf-8",
    txt: "text/plain",
    js: "text/javascript",
    css: "text/css",
    png: "image/png",
    jpg: "image/jpeg",
    gif: "image/gif",
    ico: "image/x-icon",
    svg: "image/svg+xml",
    py: "text/x-python",
};

async function serverStaticFiles(filePath) {
    let form_tmpt = "";
    let location = "";
    let status = 200;
    let headers = {};
    try {
        form_tmpt = await readFile(`.${filePath}`);
    } catch (err) {
        if (err.code === "ENOENT") {
            form_tmpt = NOT_FOUND_TEMPLATE;
            status = 404;
        }

        if (err.code === "EISDIR") {
            if (filePath.endsWith("/")) {
                try {
                    form_tmpt = await readFile(`.${filePath}/index.html`);
                } catch {
                    let files = [];
                    try {
                        files = await readdir(`.${filePath}`, { withFileTypes: true });
                    } catch (err) {
                        console.error(err);
                        status = 500;
                    }

                    form_tmpt = INDEX_BEGIN_TEMPLATE.replaceAll(
                        "{{FILE_PATH}}",
                        filePath,
                    );
                    for (const file of files) {
                        const filepath = `${file.name}${file.isDirectory() ? "/" : ""}`;
                        form_tmpt += FILE_NAME_TEMPLATE.replaceAll(
                            "{{FILE_NAME}}",
                            filepath,
                        );
                    }

                    form_tmpt += INDEX_END_TEMPLATE;
                }
            } else {
                status = 301;
                location = `${filePath}/`;
            }
        }
    }
    const contentLength = Buffer.byteLength(form_tmpt);
    const filePathSlited = filePath.split(".");
    const fileExtension = filePathSlited[filePathSlited.length - 1];

    headers["Content-Type"] = MIME_TYPES[fileExtension] || MIME_TYPES["default"];
    headers["Content-Length"] = contentLength;

    if (status >= 300 && status < 400) {
        headers["Location"] = location;
    }

    return {
        status: status,
        headers: headers,
        body: form_tmpt,
    };
}

const server = createServer(async (req, res) => {
    const started_at = Date.now();
    const response = { status: 200, headers: {}, body: "" };

    if (req.method === "GET" && req.url !== "/") {
        Object.assign(response, await serverStaticFiles(req.url));
        res.writeHead(response.status, response.headers);
        res.end(response.body);
        return;
    }

    if (req.method === "GET" && req.url === "/") {
        const form_rendered = nunjucks.render('templates/form.tmpt.html', {});
        response.status = 200;
        response.headers["Content-Type"] = MIME_TYPES.default;
        response.body = form_rendered;
        res.writeHead(response.status, response.headers);
        res.end(response.body);
    }

    if (req.method === "POST" && req.url.startsWith("/usuario/criar/")) {
        const chunks = [];

        req.on("data", (chunk) => {
            chunks.push(chunk);
        });

        req.on("end", async () => {
            const req_body = Buffer.concat(chunks).toString();
            const PROTO = req.socket.encrypted ? "https:" : "http:";
            const url = new URL(`${PROTO}//${HOST}:${PORT}${req.url}?${req_body}`);
            const user_name = url.searchParams.get("user_name");
            const user_email = url.searchParams.get("user_email");
            const user_password = url.searchParams.get("user_password");
            const user_birthday_str = url.searchParams.get("user_birthday");
            const user = {
                'name': user_name,
                'email': user_email,
                'birthday': user_birthday_str,
            }

            const errors = {
                'user_name': [],
                'user_email': [],
                'user_password': [],
                'user_birthday': [],
            }

            if (user_name.length > 256) {
                errors['user_name'].push("Nome de Usuário inválido: não pode ser maior que 256 caracteres")
            }
            if (user_name.length < 6) {
                errors['user_name'].push("Nome de Usuário inválido: não pode ser menor que 6 caracteres")
            }

            if (user_email.length > 256) {
                errors['user_email'].push("E-mail inválido: não pode ser maior que 256 caracteres")
            }
            if (!user_email.includes('@')) {
                errors['user_email'].push("E-mail inválido: deve possuir o @")
            }
            if (!user_email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
                errors['user_email'].push("E-mail inválido")
            }

            const birthdayFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!birthdayFormatRegex.test(user_birthday_str)) {
                errors['user_birthday'].push("Data de Aniversário inválida")
            } else {
                const [year, month, day] = user_birthday_str.split("-");
                const current_date_time = new Date();
                const user_birthday_date = new Date(year, month - 1, day);
                if (!(user_birthday_date instanceof Date) || isNaN(user_birthday_date)) {
                    errors['user_birthday'].push("Data de Aniversário inválida")
                } else if (current_date_time < user_birthday_date) {
                    errors['user_birthday'].push("Data de Aniversário inválida: não pode ser uma data futura")
                }
            }

            if (user_password.length > 128) {
                errors['user_password'].push("Senha inválida: não pode ser maior que 128 caracteres")
            }
            if (user_password.length < 8) {
                errors['user_password'].push("Senha inválida: não pode ser menor que 8 caracteres")
            }
            if (!/[a-zA-Z]/.test(user_password)) {
                errors['user_password'].push("Senha inválida: deve conter pelo menos uma letra");
            }
            if (!/[0-9]/.test(user_password)) {
                errors['user_password'].push("Senha inválida: deve conter pelo menos um número");
            }
            if (!/[@$!%*?&]/.test(user_password)) {
                errors['user_password'].push("Senha inválida: deve conter pelo menos um caractere especial como @$!%*?&");
            }

            let hasError = false;
            for (const error in errors) {
                if (errors[error].length !== 0) {
                    hasError = true;
                    break;
                }
            }
            if (hasError) {
                const form_rendered = nunjucks.render('templates/form.tmpt.html', {
                    'hasError': hasError,
                    'errors': errors,
                    'user': user,
                });
                response.status = 200;
                response.headers["Content-Type"] = MIME_TYPES.default;
                response.body = form_rendered;
                res.writeHead(response.status, response.headers);
                res.end(response.body);
                return
            }

            user.name = user.name.toUpperCase();
            const [year, month, day] = user_birthday_str.split("-");
            user.birthday = new Date(year, month - 1, day).toLocaleDateString("pt-BR");

            const page_rendered = nunjucks.render('templates/user.tmpt.html', {
                'user': user
            });

            response.status = 200;
            response.headers["Content-Type"] = MIME_TYPES.default;
            response.body = page_rendered;
            res.writeHead(response.status, response.headers);
            res.end(response.body);
        });
    }

    const ended_at = Date.now();
    const elapsed = ended_at - started_at;
    console.info(
        `${req.method} ${req.url} -> ${response.status} in ${elapsed} seconds`,
    );
});

server.listen(PORT, HOST, () => {
    const browserHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`Serving HTTP on ${HOST} port ${PORT} (http://${browserHost}:${PORT}/) ...`);
});
