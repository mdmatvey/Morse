import fs from 'fs';
import path from 'path';

const staticBasePath = path.dirname(process.execPath);
const userStaticPath = path.resolve(staticBasePath, 'user-static');
const adminStaticPath = path.resolve(staticBasePath, 'admin-static');

// Вайтлист адресов, которым разрешён доступ к админке
// setServerIP добавляет сюда IP вашего сервера
const whitelist = new Set(['127.0.0.1', '::1']);

export function setServerIP(ip) {
    whitelist.add(ip);
}

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
};

export function serveStatic(req, res) {
    let requestUrl = req.url;
    let staticPath = userStaticPath;

    // отдаём PDF инструкцию по /guide
    if (requestUrl === '/guide') {
        const pdfPath = path.resolve(staticBasePath, 'guide.pdf');
        fs.readFile(pdfPath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/pdf' });
                res.end(data);
            }
        });
        return;
    }

    // доступ к админке только с whitelist IP
    if (requestUrl.startsWith('/admin')) {
        // получаем реальный IP клиента
        let remote = req.socket.remoteAddress || '';
        // обрезаем IPv4-маппинг, если есть
        if (remote.startsWith('::ffff:')) {
            remote = remote.slice(7);
        }

        if (!whitelist.has(remote)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('403 Forbidden');
            return;
        }

        // переключаем папку на admin-static и убираем префикс '/admin'
        staticPath = adminStaticPath;
        requestUrl = requestUrl.replace(/^\/admin/, '') || '/';
    }

    // формируем полный путь к файлу
    const filePath = path.join(
        staticPath,
        requestUrl === '/' ? 'index.html' : requestUrl,
    );

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`Error serving ${filePath}:`, err);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
}
