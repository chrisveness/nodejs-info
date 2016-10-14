const http     = require('http');
const nodeinfo = require('../nodejs-info.js');

// respond to any request with node-info page
const server = http.createServer((req, res) => {
    if (req.url == '/favicon.ico') { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(nodeinfo(req));
});

server.listen(8080);
console.log('Listening on localhost:8080');
