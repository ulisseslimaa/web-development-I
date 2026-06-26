import http from 'node:http';

const PORT = 3001;
const HOST = '0.0.0.0';

const server = http.createServer((req, res) => {
    const bodyChunks = [];

    req.on('data', (chunk) => {
        bodyChunks.push(chunk);
    });

    req.on('end', () => {
        const rawBody = Buffer.concat(bodyChunks).toString('utf8');

        const headerLines = [];
        for (let index = 0; index < req.rawHeaders.length; index += 2) {
            headerLines.push(`${req.rawHeaders[index]}: ${req.rawHeaders[index + 1]}`);
        }

        const responseText = [
            `${req.method} ${req.url} HTTP/${req.httpVersion}`,
            ...headerLines,
            '',
            rawBody,
        ].join('\n');

        res.writeHead(200, { 'Content-Type': 'text/plain'});
        res.end(responseText);
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Raw echo server listening on http://localhost:${PORT}`);
});