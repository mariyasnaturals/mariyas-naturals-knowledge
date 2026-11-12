import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
const root = resolve('botanical-review-site');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
};
const server = createServer((req, res) => {
  try {
    let pathname = decodeURIComponent(
      new URL(req.url, 'http://127.0.0.1').pathname,
    );
    if (pathname.endsWith('/')) pathname += 'index.html';
    const path = resolve(root, '.' + pathname);
    if (!path.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    const s = statSync(path);
    if (!s.isFile()) throw new Error();
    const ext = path.slice(path.lastIndexOf('.'));
    const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    const headers = {
      'Content-Type': types[ext] || 'application/octet-stream',
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-store',
      'Accept-Ranges': 'bytes',
    };
    if (range) {
      const start = Number(range[1]),
        end = range[2] ? Math.min(Number(range[2]), s.size - 1) : s.size - 1;
      if (start > end || start >= s.size) {
        res.writeHead(416).end();
        return;
      }
      res.writeHead(206, {
        ...headers,
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${s.size}`,
      });
      createReadStream(path, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { ...headers, 'Content-Length': s.size });
      createReadStream(path).pipe(res);
    }
  } catch {
    res.writeHead(404).end('Not found');
  }
});
server.listen(4322, '127.0.0.1', () =>
  console.log(
    'UNAPPROVED local botanical review: http://127.0.0.1:4322/en/#botanical-journey',
  ),
);
