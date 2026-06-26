import http from 'node:http';

const PORT = 3000;
const HOST = '0.0.0.0'; //é para bind do servidor, não para abrir no navegador.

const server = http.createServer((req, res) => {
    const bodyChunks = [];

    req.on('data', (chunk) => {
        bodyChunks.push(chunk);
    });

    req.on('end', () => {
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const rawBody = Buffer.concat(bodyChunks).toString('utf8');
        const contentType = req.headers['content-type'];
        let parsedBody = rawBody;

        if (rawBody && contentType.includes('application/json')) {
            try {
                parsedBody = JSON.parse(rawBody);
            } catch {
                parsedBody = rawBody;
            }
        }

        const query = Object.fromEntries(parsedUrl.searchParams.entries());
        const response = {
            message: 'Echo Web Server',
            method: req.method,
            url: req.url,
            path: parsedUrl.pathname,
            query,
            httpVersion: req.httpVersion,
            headers: req.headers,
            timestamp: new Date().toISOString(),
            body: parsedBody,
        };

        res.writeHead(200, { 'Content-Type': 'application/json;' });
        res.end(JSON.stringify(response, null, 2));
    });
});

server.listen(PORT, HOST, () => {
    const browserHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`Echo server listening on ${HOST}:${PORT}`);
    console.log(`Open in browser: http://${browserHost}:${PORT}`);
});