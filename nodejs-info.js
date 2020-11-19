/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* nodeinfo()                                             (c) Chris Veness 2016-2020 MIT Licence  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const os   = require('os');   // nodejs.org/api/os.html
const http = require('http'); // nodejs.org/api/http.html
const fs   = require('fs');   // nodejs.org/api/fs.html

const handlebars       = require('handlebars');        // handlebars templating
const prettysize       = require('prettysize');        // convert bytes to other sizes
const humanizeDuration = require('humanize-duration'); // convert millisecond durations to English
const cookie           = require('cookie');            // cookie parsing and serialization

let packageJson = null;                                // inspect package.json from parent package;
try { packageJson = require('../../package.json'); } catch (e) {}     // ignore it if not available


const template = `<!doctype html>
<html>
<head>
    <title>NodeInfo</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://unpkg.com/sanitize.css">
    <style>
        main { color: #333333; font: 80% Verdana, Arial, Helvetica, sans-serif; line-height: 1.6; margin: 0.4em; }
        h1 { font-size: 1.6em; }
        h2 { margin: 1em 0; }
        h3 { margin: 0.4em 0; }
        table { background-color: #f4ede2; border: 1px solid #adadad; font-size: 0.8em; width: 100%; }
        td, th { padding: 0.2em 0.8em; vertical-align: top; border-top: 1px solid #adadad; border-bottom: 1px solid #adadad; }
        th { font-weight: normal; text-align: left; white-space: nowrap;  }
        table table { border: none; }
        table table td, table table th { padding: 0 0.4em 0 0; border: none; font-size: 125%; }
        {{{styleOverride}}}
    </style>
</head>
<body>
<main>
    <h1>Node.js {{process.version}}</h1>
    <table>
        {{#if package}}
        <tr><th colspan="2"><h2>Package</h2></th></tr>
        <tr><th>name</th><td>{{package.name}}</td></tr>
        {{#if package.description}}
        <tr><th>description</th><td>{{package.description}}</td></tr>
        {{/if}}
        <tr><th>version</th><td>{{package.version}}</td></tr>
        {{#if package.dependencies}}
        <tr><th>dependencies</th><td>{{package.dependencies}}</td></tr>
        {{/if}}
        {{/if}}
        <tr><th colspan="2"><h2>OS</h2></th></tr>
        <tr><th>hostname</th><td>{{os.hostname}}</td></tr>
        <tr><th>type</th><td>{{os.type}}</td></tr>
        <tr><th>platform</th><td>{{os.platform}}</td></tr>
        <tr><th>release</th><td>{{os.release}}</td></tr>
        <tr><th>cpu models</th><td>{{os.cpus.model}}</td></tr>
        <tr><th>cpu speeds</th><td>{{os.cpus.speed}}</td></tr>
        <tr><th>uptime</th><td>{{os.uptime}}</td></tr>
        <tr><th>load avg</th><td>{{os.loadavg}}</td></tr>
        <tr><th>total memory</th><td>{{os.totalmem}}</td></tr>
        <tr><th>free memory</th><td>{{os.freemem}} ({{os.freemempercent}}%)</td></tr>
        <tr><th colspan="2"><h3>process</h3></th></tr>
        <tr><th>resident set size</th><td>{{process.rss}}</td></tr>
        <tr><th>v8 heap total</th><td>{{process.heapTotal}}</td></tr>
        <tr><th>v8 heap used</th><td>{{process.heapUsed}}</td></tr>
        <tr><th colspan="2"><h3>timezone</h3></th></tr>
        <tr><th>timezone</th><td>{{intlTimezone}}</td></tr>
        <tr><th>offset</th><td>{{dateTzOffset}}</td></tr>

        <tr><th colspan="2"><h2>Node versions</h2></th></tr>
        {{#each process.versions}}
        <tr><th>{{@key}}</th><td>{{this}}</td></tr>
        {{/each}}

        {{#if process.env.NODE_ENV}}
        <tr><th colspan="2">&nbsp;</th></tr>
        <tr><th>NODE_ENV</th><td>{{process.env.NODE_ENV}}</td></tr>
        {{/if}}

        {{#if request}}
        <tr><th colspan="2"><h2>Request</h2></th></tr>
        <tr><th>method</th><td>{{request.method}}</td></tr>
        <tr><th>href</th><td>{{request.href}}</td></tr>
        <tr><th>remote ip</th><td>{{request.ip_addr}}</td></tr>
        <tr><th colspan="2"><h3>headers</h3></th></tr>
        {{#if request.showOriginalUrl}}
        <tr><th>original url</th><td>{{request.originalUrl}}</td></tr>
        {{/if}}
        {{#each request.headers}}
        <tr><th style="white-space:nowrap">{{@key}}</th><td>{{this}}</td></tr>
        {{/each}}
        <tr><th>cookies</th><td>
            <table>
                {{#each request.cookies}}
                <tr><th>{{@key}}</th><td>:</td><td style="word-break:break-all">{{this}}</td></tr>
                {{/each}}
            </table>
        </td></tr>
        {{else}}
        <tr><th colspan="2"><h2>No request object supplied</h2></th></tr>
        {{/if}}
    </table>
</main>
</body>
</html>
`;


/**
 * Returns Node.js configuration information as an HTML page.
 *
 * @param   {Object} req - Node request object.
 * @param   {Object} [options]
 * @param   {string} [options.style] - Optional CSS which can be used to style output.
 * @returns {string} HTML page with configuration information.
 */
function nodeinfo(req, options) {
    const defaults = { style: '' };
    const opt = Object.assign(defaults, options);

    const context = {};

    context.styleOverride = opt.style;

    // package.dependencies
    context.package = packageJson ? Object.assign({}, packageJson) : null;
    if (context.package && context.package.dependencies) { // convert dependencies to list
        context.package.dependencies = Object.keys(context.package.dependencies).join(', ');
    }

    // useful functions from 'os'
    const osFunctions = [ 'cpus', 'freemem', 'hostname', 'loadavg', 'platform', 'release', 'totalmem', 'type', 'uptime' ];
    context.os = {}; // results of executing os functions
    for (const fn of osFunctions) { context.os[fn] = os[fn](); }
    // and some formatting
    context.os.uptime = humanizeDuration(context.os.uptime*1000, { units: [ 'd', 'h', 'm' ], round: true });
    context.os.loadavg.forEach(function(l, i, loadavg) { loadavg[i] = l.toFixed(2); });
    context.os.loadavg = context.os.loadavg.join(' ');
    context.os.freemempercent = Math.round(context.os.freemem/context.os.totalmem*100);
    context.os.totalmem = prettysize(context.os.totalmem);
    context.os.freemem = prettysize(context.os.freemem);
    // bit of magic to generate nice presentation for CPUs info
    const cpus = { model: {}, speed: {} };
    for (let c=0; c<os.cpus().length; c++) {
        cpus.model[os.cpus()[c].model] = (cpus.model[os.cpus()[c].model] || 0) + 1;
        cpus.speed[os.cpus()[c].speed] = (cpus.speed[os.cpus()[c].speed] || 0) + 1;
    }
    context.os.cpus = { model: [], speed: [] };
    for (const p in cpus.model) context.os.cpus.model.push(cpus.model[p]+' × '+p);
    for (const p in cpus.speed) context.os.cpus.speed.push(cpus.speed[p]+' × '+p);
    context.os.cpus.model = context.os.cpus.model.join(', ');
    context.os.cpus.speed = context.os.cpus.speed.join(', ') + ' MHz';

    // everything from process (for process memory and Node versions)
    context.process = process;

    context.process.rss = prettysize(process.memoryUsage().rss);
    context.process.heapTotal = prettysize(process.memoryUsage().heapTotal);
    context.process.heapUsed = prettysize(process.memoryUsage().heapUsed);

    context.intlTimezone = Intl.DateTimeFormat('en').resolvedOptions().timeZone;
    context.dateTzOffset = Date().match(/([A-Z]+[\+-][0-9]{4}.*)/)[1];

    if (req.headers) {
        const protocol = req.socket.encrypted || req.headers['x-forwarded-proto']=='https' ? 'https' : 'http';
        context.request = req;
        // add in href & remote IP address (stackoverflow.com/questions/8107856)
        context.request.href = protocol + '://' + req.headers.host + req.url;
        const remoteAddr = req.connection.remoteAddress
            || req.socket.remoteAddress
            || req.connection.socket.remoteAddress;
        const ipAddr = req.headers['x-forwarded-for']
            ? `${req.headers['x-forwarded-for']} via ${remoteAddr}`
            : remoteAddr;
        context.request.ip_addr = ipAddr;

        // cookies go in separate nested table
        context.request.cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
        delete context.request.headers.cookie;
    }

    const templateFn = handlebars.compile(template);
    const html = templateFn(context);

    return html;
}


module.exports = nodeinfo; // ≡ export default nodeinfo
