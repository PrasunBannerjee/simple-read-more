// Minimal static file server for running tests/manual/index.html in a
// real browser. Development only; never ships in the plugin zip.
//
//   node bin/serve-tests.js
//   open http://localhost:8731/tests/manual/
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };

http.createServer((req, res) => {
	let rel = decodeURIComponent(req.url.split('?')[0]);
	if (rel.endsWith('/')) rel += 'index.html';
	const file = path.join(ROOT, rel);
	if (!file.startsWith(ROOT) || !fs.existsSync(file)) {
		res.writeHead(404); res.end('not found'); return;
	}
	res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'text/plain' });
	res.end(fs.readFileSync(file));
}).listen(8731, () => console.log('test harness on http://localhost:8731'));
