import http from 'node:http';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';

const PORT = 3000;
const HOST = '0.0.0.0';
const PUBLIC_ROOT = process.cwd(); //pega a pasta raiz atual

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4'
};

function logRequest(req, statusCode) {
    const ip = req.socket.remoteAddress || '-';
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const path = req.url.split('?')[0]
    console.log(`[${timestamp}] ${ip} - "${req.method} ${decodeURI(path)}" ${statusCode}`);
}
// Função para escapar caracteres especiais em strings para evitar XSS
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function serveFile(filePath, fileStats, req, res) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': fileStats.size
    });

    if (req.method === 'HEAD') {
        res.end();
        logRequest(req, 200);
        return;
    }

    const stream = createReadStream(filePath); //fs.readFile

    stream.on('error', (err) => {
        console.error(err);
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('500 Internal Server Error');
        }
    });

    stream.pipe(res); // Envia o arquivo para o cliente
    logRequest(req, 200);
}

function generateDirectoryListing(pathname, files) {
    const escapedPathname = escapeHtml(pathname);
    let html = `
        <!DOCTYPE HTML>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Directory listing for ${escapedPathname}</title>
        </head>
            <body>
            <h1>Directory listing for ${escapedPathname}</h1>
            <hr>
            <ul> 
        `;

    if (pathname !== '/') {
        html += `<li><a href="..">..</a></li>\n`;
    }

    for (const file of files) {
        const isDir = file.isDirectory();
        const displayName = file.name + (isDir ? '/' : '');
        const escapedName = escapeHtml(displayName);
        const linkUrl = encodeURIComponent(file.name) + (isDir ? '/' : ''); //%20 --> " " (espaço),& ou ? --> broken  
        html += `<li><a href="${linkUrl}">${escapedName}</a></li>\n`;
    }

    html += `</ul>
        <hr>
        </body>
        </html>
        `;
    return html;
}

function handleFileSystemError(err, req, res) {
    if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        logRequest(req, 404);
        return;
    }
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Server Error');
    logRequest(req, 500);
}

function handleForbiddenError(req, res) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    logRequest(req, 403);
}

const server = http.createServer(async (req, res) => {
    // GET e HEAD permitidos. Retorna 405 Method Not Allowed se o método for diferente
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('405 Method Not Allowed');
        logRequest(req, 405);
        return;
    }

    // URL parsing e decoding. Retorna 400 Bad Request se a URL for inválida
    let pathname;
    try {
        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        pathname = decodeURIComponent(parsedUrl.pathname);
    } catch {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('400 Bad Request');
        logRequest(req, 400);
        return;
    }

    // Proteção contra path traversal. Retorna 403 Forbidden se o caminho for inválido
    const cleanPath = pathname.replace(/^\/+/, '');
    const targetPath = path.resolve(PUBLIC_ROOT, cleanPath);
    const isSafe = targetPath.startsWith(PUBLIC_ROOT);

    if (!isSafe) {
        handleForbiddenError(req, res);
        return;
    }

    let stats;
    try {
        // Verifica se o arquivo existe
        stats = await fs.stat(targetPath);
    } catch (err) {
        handleFileSystemError(err, req, res);
        return;
    }

    // Verifica se é um diretório
    if (stats.isDirectory()) {
        if (!pathname.endsWith('/')) {
            // Se não terminar com /, redireciona para o mesmo caminho com /
            const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            res.writeHead(301, { 'Location': pathname + '/' + parsedUrl.search });
            res.end();
            logRequest(req, 301);
            return;
        }

        // Tenta servir index.html
        const indexPath = path.join(targetPath, 'index.html');
        try {
            const indexStats = await fs.stat(indexPath);
            if (indexStats.isFile()) {
                serveFile(indexPath, indexStats, req, res);
                return;
            }
        } catch (err) { // Se o erro for ENOENT, significa que o arquivo não existe, então apenas ignore.
            if (err.code !== 'ENOENT') {
                handleFileSystemError(err, req, res);
                return;
            }
        }
        // Gera a listagem do diretório se não tiver index.html
        try {
            const files = await fs.readdir(targetPath, { withFileTypes: true }); //--> retorna um array de Dirent

            files.sort((a, b) => {
                return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
            });

            const html = generateDirectoryListing(pathname, files);

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            if (req.method === 'HEAD') {
                res.end();
                logRequest(req, 200);
                return;
            }
            res.end(html);
            logRequest(req, 200);
            return;

        } catch (err) {
            handleFileSystemError(err, req, res);
        }
    }

    // Verifica se é um arquivo
    if (stats.isFile()) {
        serveFile(targetPath, stats, req, res);
        return;
    }
    handleForbiddenError(req, res);
});

server.listen(PORT, HOST, () => {
    const browserHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`Serving HTTP on ${HOST} port ${PORT} (http://${browserHost}:${PORT}/) ...`);
});