// Minimal static file server for running tests/manual/index.html in a
// real browser. Development only; never ships in the plugin zip.
//
//   node bin/serve-tests.js
//   open http://localhost:8731/tests/manual/
//
// Listens on the loopback interface only, and serves regular files from
// inside the repository and nothing else.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };

function notFound(res) {
	res.writeHead(404);
	res.end('not found');
}

http.createServer((req, res) => {
	let rel;
	try {
		rel = decodeURIComponent(req.url.split('?')[0]);
	} catch (e) {
		// Malformed percent-encoding. Answer it rather than let the
		// exception take the whole server down.
		res.writeHead(400);
		res.end('bad request');
		return;
	}
	if (rel.endsWith('/')) rel += 'index.html';

	// path.relative() rather than a startsWith() check on the joined
	// path: startsWith() would also accept a sibling folder whose name
	// merely begins with this one's, such as "simple-read-more-backup".
	const file = path.join(ROOT, rel);
	const fromRoot = path.relative(ROOT, file);
	if (fromRoot.startsWith('..') || path.isAbsolute(fromRoot)) {
		notFound(res);
		return;
	}

	let stat;
	try {
		stat = fs.statSync(file);
	} catch (e) {
		notFound(res);
		return;
	}
	if (!stat.isFile()) {
		notFound(res);
		return;
	}

	res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'text/plain' });
	res.end(fs.readFileSync(file));
}).listen(8731, '127.0.0.1', () => console.log('test harness on http://localhost:8731'));
