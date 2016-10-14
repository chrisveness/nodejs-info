NodeInfo
--------

Outputs information about Node.js configuration, somewhat comparably to PHP’s `phpinfo()`.

Includes information about the npm package, operating system, process memory, versions of Node and 
Node components, the request, and the headers.

The `nodeinfo()` function returns an HTML page as a string, which can be rendered through any tool:
Connect, Express, Koa, etc.

Example usage (Node)

    const http     = require('http');
    const nodeinfo = require('nodejs-info');
    
    const server = http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(nodeinfo(req));
    });
    
    server.listen(8080);

Example usage (Koa)

    const app      = require('koa');
    const nodeinfo = require('nodejs-info');

    app.use(ctx => {
        ctx.body = nodeinfo(ctx.req);
    });
    
    app.listen(3000);

CSS styling can be provided via the optional `style` parameter.

    const html = nodeinfo(req, { style: 'table { background-color: #cccccc }' }); 

![Screenshot](nodejs-info.png)

Requires Node.js v4.0+.

