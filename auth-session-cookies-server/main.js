import http from 'node:http';
import crypto from 'node:crypto';
import nunjucks from 'nunjucks';

const PORT = 8080;
const HOST = '0.0.0.0';

nunjucks.configure('templates', { autoescape: true, noCache: true});

// ficam apenas em memória
const users = new Map();
const sessions = new Map();

// Executa a rotina de limpeza periodicamente a cada 60 segundos
function cleanupSessions() {
    const now = Date.now();
    for (const [sid, session] of sessions.entries()) {
        if (!session.createdAt || (now - new Date(session.createdAt).getTime() > 30 * 60 * 1000)) {
            sessions.delete(sid);
        };
    };
};
setInterval(cleanupSessions, 60 * 1000);

// parsear cookies da requisição
function parseCookies(req) {
    const list = {};
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURI(parts.join('='));
        });
    };
    return list;
};

// requisições POST
function getRequestBody(req) {
    return new Promise((resolve) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            const bodyStr = Buffer.concat(chunks).toString();
            resolve(new URLSearchParams(bodyStr));
        });
    });
};

const server = http.createServer(async (req, res) => {
    const cookies = parseCookies(req);
    // cookie sessionId
    const sessionId = cookies.sessionId;
    
    let currentSession = null;
    if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId);
        const now = Date.now();
        if (session.createdAt && (now - new Date(session.createdAt).getTime() <= 30 * 60 * 1000)) {
            currentSession = session;
        } else {
            sessions.delete(sessionId);
        };
    };

    const { pathname } = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    // GET /
    if (pathname === '/' && req.method === 'GET') {
        const email = currentSession ? currentSession.email : null;
        const html = nunjucks.render('home.html', { email });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
    };

    // GET /register
    if (pathname === '/register' && req.method === 'GET') {
        const html = nunjucks.render('auth.html', { type: 'register' });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
    };

    // POST /register
    if (pathname === '/register' && req.method === 'POST') {
        const body = await getRequestBody(req);
        const email = body.get('email');
        const password = body.get('password');

        if (!email || !password || password.length < 8) {
            const html = nunjucks.render('message.html', {
                title: 'Cadastro não concluído',
                message: 'Parâmetros de cadastro inválidos ou senha menor que 8 caracteres.',
                statusType: 'error',
                links: [{ href: '/register', text: 'Tentar novamente' }]
            });
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            return;
        };

        if (users.has(email)) {
            // retorna 409 quando o e-mail já está cadastrado
            const html = nunjucks.render('message.html', {
                title: 'Cadastro não concluído',
                message: 'Já existe um usuário cadastrado com esse e-mail.',
                statusType: 'error',
                links: [
                    { href: '/register', text: 'Tentar novamente' },
                    { href: '/login', text: 'Ir para login' }
                ]
            });
            res.writeHead(409, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            return;
        };

        // salt aleatório e pbkdf2 com sha512
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

        users.set(email, { email, salt, hash });

        // retorna página de sucesso quando o cadastro é concluído
        const html = nunjucks.render('message.html', {
            title: 'Usuário criado',
            message: 'A conta foi criada com sucesso. Agora você já pode fazer login.',
            statusType: 'success',
            links: [{ href: '/login', text: 'Fazer login' }]
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
    };

    // GET /login
    if (pathname === '/login' && req.method === 'GET') {
        const html = nunjucks.render('auth.html', { type: 'login' });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
    };

    // POST /login
    if (pathname === '/login' && req.method === 'POST') {
        const body = await getRequestBody(req);
        const email = body.get('email');
        const password = body.get('password');

        const user = users.get(email);
        let isValid = false;

        if (user) {
            // validação de senha usa comparação segura com timingSafeEqual
            const computedHash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
            const bufferComputed = Buffer.from(computedHash, 'hex');
            const bufferStored = Buffer.from(user.hash, 'hex');
            
            if (bufferComputed.length === bufferStored.length) {
                isValid = crypto.timingSafeEqual(bufferComputed, bufferStored);
            };
        };

        if (!isValid) {
            // retorna 401 se as credenciais forem inválidas
            const html = nunjucks.render('message.html', {
                title: 'Login inválido',
                message: 'As credenciais informadas não conferem.',
                statusType: 'error',
                links: [{ href: '/login', text: 'Fazer login' }]
            });
            res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            return;
        };

        // Criando a sessão
        const newSessionId = crypto.randomUUID();

        sessions.set(newSessionId, {
            email: user.email,
            createdAt: new Date(),
            views: 0
        });

        // O cookie de login é enviado com HttpOnly, Path=/ e SameSite=Strict
        // retorna 302 redirecionando para /dashboard quando o login é válido
        res.writeHead(302, {
            'Location': '/dashboard',
            'Set-Cookie': `sessionId=${newSessionId}; HttpOnly; Path=/; SameSite=Strict`
        });
        res.end();
        return;
    };

    // ROTAS PROTEGIDAS
    if (['/dashboard', '/admin', '/logout'].includes(pathname)) {
        if (!currentSession) {
            // GET /dashboard, GET /admin, POST /logout
            // exigem autenticação
            const html = nunjucks.render('message.html', {
                title: 'Acesso não autorizado',
                message: 'Você precisa fazer login para acessar esta área.',
                statusType: 'error',
                links: [
                    { href: '/login', text: 'Fazer login' },
                    { href: '/register', text: 'Criar conta' }
                ]
            });
            res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            return;
        };
    };

    // GET /dashboard
    if (pathname === '/dashboard' && req.method === 'GET') {
        //guarda pelo menos quantidade de acessos
        currentSession.views = (currentSession.views || 0) + 1;
        
        // mostra o e-mail do usuário autenticado
        const html = nunjucks.render('dashboard.html', { email: currentSession.email });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
    };

    // GET /admin
    if (pathname === '/admin' && req.method === 'GET') {
        // lista todos os usuários
        const allUsers = Array.from(users.values());
        
        // lista todas as sessões registradas
        const allSessions = Array.from(sessions.entries()).map(([id, session]) => {
            const formattedDate = session.createdAt ? new Date(session.createdAt).toLocaleDateString('pt-BR') : null;
            return {
                id,
                email: session.email,
                createdAtFormatted: formattedDate,
                views: session.views
            };
        });

        const html = nunjucks.render('admin.html', {
            users: allUsers,
            sessionsList: allSessions
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
    };

    // POST /logout e GET /logout
    if (pathname === '/logout' && (req.method === 'POST' || req.method === 'GET')) {
        // remove a sessão atual
        if (sessionId) {
            sessions.delete(sessionId);
        };

        // envia um cookie expirado para limpar sessionId com Max-Age=0
        const html = nunjucks.render('message.html', {
            title: 'Logout realizado',
            message: 'A sessão foi encerrada com sucesso.',
            statusType: 'success',
            links: [{ href: '/login', text: 'Fazer login' }]
        });
        res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Set-Cookie': 'sessionId=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0'
        });
        res.end(html);
        return;
    };

    // fallback
    const html = nunjucks.render('message.html', {
        title: 'Página não encontrada',
        message: 'O recurso solicitado não existe.',
        statusType: 'error',
        links: [{ href: '/', text: 'Voltar ao início' }]
    });
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
});

server.listen(PORT, HOST, () => {
    console.log(`Servidor rodando em: http://${HOST}:${PORT}`);
});