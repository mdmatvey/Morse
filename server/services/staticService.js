import fs from 'fs';
import path from 'path';

const staticBasePath = path.dirname(process.execPath);
const userStaticPath = path.resolve(staticBasePath, 'user-static');
const adminStaticPath = path.resolve(staticBasePath, 'admin-static');

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

// Вайтлист адресов, которым разрешен доступ к админке
const whitelist = new Set(['localhost', '127.0.0.1']);

// Функция для установки IP сервера в вайтлист
export function setServerIP(ip) {
    whitelist.add(ip);
}

export function serveStatic(req, res) {
    let requestUrl = req.url;
    let staticPath = userStaticPath;
    const host = req.headers.host.split(':')[0];

    // Проверяем, если запрос начинается с /admin
    if (req.url.startsWith('/admin')) {
        req.url.replace('admin', 'admin-static');

        if (!whitelist.has(host)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('403 Forbidden');
            return;
        }

        const removeAdminPrefix = (path) =>
            path.startsWith('/admin')
                ? path.replace('/admin', '') || '/'
                : path;

        // Для админки ищем файлы в папке admin-static
        staticPath = adminStaticPath;
        requestUrl = removeAdminPrefix(req.url);
    }

    // Формируем полный путь к файлу
    let filePath = path.join(
        staticPath,
        requestUrl === '/' ? 'index.html' : requestUrl,
    );

    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.log(err);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
}
