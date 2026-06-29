import http from 'node:http';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';

const PORT = 3001;
const HOST = '0.0.0.0';
const PUBLIC_ROOT = process.cwd();

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

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

const FOLDER_ICON = `<svg class="item-icon folder-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`;
const FILE_ICON = `<svg class="item-icon file-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`;
const PARENT_ICON = `<svg class="item-icon parent-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`;

function logRequest(req, statusCode) {
    const ip = req.socket.remoteAddress || '-';
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let color = colors.reset;
    if (statusCode >= 200 && statusCode < 300) color = colors.green;
    else if (statusCode >= 300 && statusCode < 400) color = colors.yellow;
    else if (statusCode >= 400) color = colors.red;

    console.log(`[${timestamp}] ${colors.cyan}${ip}${colors.reset} - "${req.method} ${req.url}" ${color}${statusCode}${colors.reset}`);
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(date) {
    return date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
}

async function serveFile(filePath, fileStats, req, res) {
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

    const stream = createReadStream(filePath);
    stream.on('error', (err) => {
        console.error(err);
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('500 Internal Server Error');
        }
    });
    stream.pipe(res);
    logRequest(req, 200);
}

function getListingTemplate({ pathname, breadcrumbsHtml, parentRowHtml, rowsHtml }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Index of ${escapeHtml(pathname)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b0f19;
            --container-bg: rgba(255, 255, 255, 0.02);
            --border-color: rgba(255, 255, 255, 0.06);
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
            --accent-color: #3b82f6;
            --accent-hover: #60a5fa;
            --card-hover: rgba(255, 255, 255, 0.05);
            --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--bg-color);
            background-image: 
                radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.05) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.05) 0px, transparent 50%);
            color: var(--text-primary);
            font-family: var(--font-sans);
            padding: 3rem 1.5rem;
            min-height: 100vh;
            display: flex;
            justify-content: center;
        }

        .container {
            width: 100%;
            max-width: 1000px;
            background: var(--container-bg);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            backdrop-filter: blur(16px);
            padding: 2.5rem;
            box-shadow: 0 20px 50px rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }

        header {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 2rem;
        }

        h1 {
            font-size: 1.75rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            word-break: break-all;
        }

        .breadcrumbs {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.4rem;
            color: var(--text-secondary);
            font-size: 0.95rem;
        }

        .breadcrumbs a {
            color: var(--accent-color);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
        }

        .breadcrumbs a:hover {
            color: var(--accent-hover);
            text-decoration: underline;
        }

        .search-box {
            position: relative;
            width: 100%;
        }

        .search-input {
            width: 100%;
            padding: 0.9rem 1rem 0.9rem 2.8rem;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            color: var(--text-primary);
            font-family: var(--font-sans);
            font-size: 1rem;
            transition: all 0.2s ease-in-out;
        }

        .search-input:focus {
            outline: none;
            border-color: var(--accent-color);
            background: rgba(255, 255, 255, 0.06);
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
        }

        .search-icon {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
            pointer-events: none;
        }

        .list-header {
            display: grid;
            grid-template-columns: 1fr 140px 200px;
            padding: 0.75rem 1.25rem;
            color: var(--text-secondary);
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid var(--border-color);
        }

        .list-items {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
            margin-top: 0.5rem;
        }

        .item-row {
            display: grid;
            grid-template-columns: 1fr 140px 200px;
            align-items: center;
            padding: 0.85rem 1.25rem;
            border-radius: 10px;
            text-decoration: none;
            color: var(--text-primary);
            border: 1px solid transparent;
            transition: all 0.2s ease-out;
        }

        .item-row:hover {
            background: var(--card-hover);
            border-color: var(--border-color);
            transform: translateX(4px);
        }

        .item-name-col {
            display: flex;
            align-items: center;
            gap: 0.85rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .item-icon {
            flex-shrink: 0;
            width: 22px;
            height: 22px;
        }

        .item-size-col {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .item-date-col {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .folder-icon {
            color: #f59e0b;
        }

        .file-icon {
            color: #6b7280;
        }

        .parent-icon {
            color: #8b5cf6;
        }

        .empty-state {
            display: none;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            padding: 4rem 1rem;
            color: var(--text-secondary);
            text-align: center;
        }

        .empty-state svg {
            width: 64px;
            height: 64px;
            color: rgba(255, 255, 255, 0.05);
        }

        @media (max-width: 640px) {
            .list-header, .item-row {
                grid-template-columns: 1fr;
                gap: 0.5rem;
            }
            .item-size-col, .item-date-col {
                padding-left: 2rem;
                font-size: 0.8rem;
            }
            .list-header {
                display: none;
            }
            body {
                padding: 1rem 0.5rem;
            }
            .container {
                padding: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="breadcrumbs">
                ${breadcrumbsHtml}
            </div>
            <h1>Index of ${escapeHtml(pathname)}</h1>
        </header>

        <div class="search-box">
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
            <input type="text" id="search" class="search-input" placeholder="Filter files and folders..." autocomplete="off">
        </div>

        <div>
            <div class="list-header">
                <span>Name</span>
                <span>Size</span>
                <span>Last Modified</span>
            </div>
            <div class="list-items" id="items-list">
                ${parentRowHtml}
                ${rowsHtml}
            </div>
            <div class="empty-state" id="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.008 1.24l.885 1.77a2.25 2.25 0 0 0 2.007 1.24h1.98a2.25 2.25 0 0 0 2.007-1.24l.885-1.77a2.25 2.25 0 0 1 2.007-1.24h3.86m-18 0h18" />
                </svg>
                <p>No matching files or folders found</p>
            </div>
        </div>
    </div>

    <script>
        const searchInput = document.getElementById('search');
        const listItems = document.getElementById('items-list');
        const emptyState = document.getElementById('empty-state');
        const rows = Array.from(listItems.querySelectorAll('.item-row:not(.parent-link)'));

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            let visibleCount = 0;

            rows.forEach(row => {
                const name = row.getAttribute('data-name').toLowerCase();
                if (name.includes(query)) {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            });

            if (visibleCount === 0 && query !== '') {
                emptyState.style.display = 'flex';
            } else {
                emptyState.style.display = 'none';
            }
        });
    </script>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('405 Method Not Allowed');
        logRequest(req, 405);
        return;
    }

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

    const cleanPath = pathname.replace(/^\/+/, '');
    const targetPath = path.resolve(PUBLIC_ROOT, cleanPath);

    const relative = path.relative(PUBLIC_ROOT, targetPath);
    const isSafe = relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));

    if (!isSafe) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 Forbidden');
        logRequest(req, 403);
        return;
    }

    let stats;
    try {
        stats = await fs.stat(targetPath);
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            logRequest(req, 404);
        } else {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('500 Internal Server Error');
            logRequest(req, 500);
        }
        return;
    }

    if (stats.isDirectory()) {
        if (!pathname.endsWith('/')) {
            const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            res.writeHead(301, { 'Location': pathname + '/' + (parsedUrl.search || '') });
            res.end();
            logRequest(req, 301);
            return;
        }

        const indexPath = path.join(targetPath, 'index.html');
        try {
            const indexStats = await fs.stat(indexPath);
            if (indexStats.isFile()) {
                await serveFile(indexPath, indexStats, req, res);
                return;
            }
        } catch {
            // index.html not found, proceed to directory listing
        }

        try {
            const files = await fs.readdir(targetPath, { withFileTypes: true });

            files.sort((a, b) => {
                if (a.isDirectory() && !b.isDirectory()) return -1;
                if (!a.isDirectory() && b.isDirectory()) return 1;
                return a.name.localeCompare(b.name);
            });

            const parts = pathname.split('/').filter(Boolean);
            let breadcrumbsHtml = `<a href="/">Root</a>`;
            let currentPath = '';
            for (let i = 0; i < parts.length; i++) {
                currentPath += '/' + parts[i];
                breadcrumbsHtml += ` <span style="color: var(--text-secondary)">/</span> <a href="${escapeHtml(currentPath)}/">${escapeHtml(parts[i])}</a>`;
            }

            let parentRowHtml = '';
            if (pathname !== '/') {
                const parentPath = path.dirname(pathname.endsWith('/') ? pathname.slice(0, -1) : pathname);
                const parentUrl = parentPath === '/' || parentPath === '.' ? '/' : parentPath + '/';
                parentRowHtml = `
                    <a href="${escapeHtml(parentUrl)}" class="item-row parent-link">
                        <div class="item-name-col">
                            ${PARENT_ICON}
                            <span>.. (Parent Directory)</span>
                        </div>
                        <div class="item-size-col">-</div>
                        <div class="item-date-col">-</div>
                    </a>
                `;
            }

            let rowsHtml = '';
            for (const file of files) {
                const filePath = path.join(targetPath, file.name);
                let fileStats;
                try {
                    fileStats = await fs.stat(filePath);
                } catch {
                    continue;
                }

                const fileUrl = pathname + encodeURIComponent(file.name) + (file.isDirectory() ? '/' : '');
                const icon = file.isDirectory() ? FOLDER_ICON : FILE_ICON;
                const size = file.isDirectory() ? '-' : formatSize(fileStats.size);
                const date = formatDate(fileStats.mtime);

                rowsHtml += `
                    <a href="${escapeHtml(fileUrl)}" class="item-row" data-name="${escapeHtml(file.name)}">
                        <div class="item-name-col">
                            ${icon}
                            <span>${escapeHtml(file.name)}</span>
                        </div>
                        <div class="item-size-col">${size}</div>
                        <div class="item-date-col">${date}</div>
                    </a>
                `;
            }

            const html = getListingTemplate({
                pathname,
                breadcrumbsHtml,
                parentRowHtml,
                rowsHtml
            });

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            if (req.method === 'HEAD') {
                res.end();
            } else {
                res.end(html);
            }
            logRequest(req, 200);

        } catch (err) {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('500 Internal Server Error');
            logRequest(req, 500);
        }

    } else if (stats.isFile()) {
        await serveFile(targetPath, stats, req, res);
    } else {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 Forbidden');
        logRequest(req, 403);
    }
});

server.listen(PORT, HOST, () => {
    const browserHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`Static file server listening on ${HOST}:${PORT}`);
    console.log(`Serving directory: ${PUBLIC_ROOT}`);
    console.log(`Open in browser: http://${browserHost}:${PORT}`);
});