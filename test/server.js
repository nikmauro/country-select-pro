/**
 * Static server για τα tests (Playwright webServer) — ρίζα: το repo, χωρίς εξαρτήσεις.
 *   node test/server.js [port]
 * Σερβίρει dist/, test/fixtures/ και node_modules/ (htmx, idiomorph) — τα tests δεν θέλουν CDN.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2] || process.env.PORT || 4173);
const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.md': 'text/plain; charset=utf-8',
    '.ts': 'text/plain; charset=utf-8'
};

http.createServer((req, res) => {
    let rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT + path.sep)) {
        res.writeHead(403);
        return res.end();
    }
    fs.readFile(file, (err, buf) => {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            return res.end('Not found');
        }
        res.writeHead(200, {'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
        res.end(buf);
    });
}).listen(PORT, '127.0.0.1', () => console.log('test server http://127.0.0.1:' + PORT));
