const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mp4': 'video/mp4', '.webm': 'video/webm' };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const filename = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!filename.startsWith(root + path.sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  fs.stat(filename, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    const contentType = types[path.extname(filename)] || 'application/octet-stream';
    const rangeHeader = request.headers.range;
    if (contentType.startsWith('video/') && rangeHeader) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
      if (!match) {
        response.writeHead(416, { 'Content-Range': `bytes */${stats.size}` }).end();
        return;
      }
      const suffixLength = match[1] ? null : Number(match[2]);
      const start = match[1] ? Number(match[1]) : Math.max(0, stats.size - suffixLength);
      const end = match[2] && match[1] ? Math.min(Number(match[2]), stats.size - 1) : stats.size - 1;
      if (start >= stats.size || start > end) {
        response.writeHead(416, { 'Content-Range': `bytes */${stats.size}` }).end();
        return;
      }
      response.writeHead(206, {
        'Content-Type': contentType,
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes'
      });
      fs.createReadStream(filename, { start, end }).pipe(response);
      return;
    }
    if (contentType.startsWith('video/')) response.setHeader('Accept-Ranges', 'bytes');
    response.writeHead(200, { 'Content-Type': contentType, 'Content-Length': stats.size });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    fs.createReadStream(filename).pipe(response);
  });
});

const port = Number(process.env.PORT) || 5173;
server.listen(port, '0.0.0.0', () => console.log(`Portfolio listening on port ${port}`));

