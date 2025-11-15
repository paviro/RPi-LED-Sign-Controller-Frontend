const http = require('http');
const https = require('https');
const { pipeline } = require('stream');
const next = require('next');

const { createServer } = http;

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000; // You can change this to your preferred port
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const API_PROXY_TIMEOUT = 3600000; // 1 hour
const backendUrl = process.env.BACKEND_URL || 'http://172.20.2.167:3000';
const backendOrigin = new URL(backendUrl);
console.log(`\x1b[33m Using API base URL ${backendOrigin.origin} for dev server, specify your own via BACKEND_URL environment variable \x1b[0m \n`);

function proxyApiRequest(req, res) {
  const isSse = req.headers.accept && req.headers.accept.includes('text/event-stream');
  const targetUrl = new URL(req.url, backendOrigin);
  const transport = targetUrl.protocol === 'https:' ? https : http;

  const proxyHeaders = {
    ...req.headers,
    host: targetUrl.host,
    origin: targetUrl.origin
  };

  if (isSse) {
    proxyHeaders.connection = 'keep-alive';
    proxyHeaders['cache-control'] = 'no-cache';
    proxyHeaders.accept = 'text/event-stream';
  }

  const proxyReq = transport.request(
    {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
      path: `${targetUrl.pathname}${targetUrl.search}`,
      method: req.method,
      headers: proxyHeaders,
      timeout: API_PROXY_TIMEOUT
    },
    (proxyRes) => {
      const responseHeaders = {
        ...proxyRes.headers
      };

      if (isSse) {
        responseHeaders['cache-control'] = 'no-cache';
        responseHeaders.connection = 'keep-alive';
        responseHeaders['content-type'] = 'text/event-stream';
      }

      res.writeHead(proxyRes.statusCode || 500, responseHeaders);
      pipeline(proxyRes, res, (err) => {
        if (err && !res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Proxy stream error', message: err.message }));
        }
      });
    }
  );

  proxyReq.on('timeout', () => {
    proxyReq.destroy(new Error('Proxy request timed out'));
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
    } else {
      res.end();
    }
  });

  res.on('close', () => {
    proxyReq.destroy();
  });

  if (req.readableEnded) {
    proxyReq.end();
  } else {
    pipeline(req, proxyReq, (err) => {
      if (err && !res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy request error', message: err.message }));
      }
    });
  }
}

function buildParsedUrl(req) {
  const reqUrl = req.url || '/';
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const hostHeader = req.headers.host || `${hostname}:${port}`;
  const base = `${protocol}://${hostHeader}`;
  const isAbsolute = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(reqUrl);

  const url = new URL(reqUrl, base);

  const query = {};
  url.searchParams.forEach((value, key) => {
    if (Object.prototype.hasOwnProperty.call(query, key)) {
      if (Array.isArray(query[key])) {
        query[key].push(value);
      } else {
        query[key] = [query[key], value];
      }
    } else {
      query[key] = value;
    }
  });

  const search = url.search ? url.search : null;
  const hash = url.hash ? url.hash : null;

  return {
    pathname: url.pathname,
    query,
    path: url.pathname + (search || ''),
    href: reqUrl,
    search,
    hash,
    hostname: isAbsolute ? url.hostname : null,
    host: isAbsolute ? url.host : null,
    protocol: isAbsolute ? url.protocol : null,
    slashes: isAbsolute ? url.href.startsWith(`${url.protocol}//`) : null
  };
}

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = buildParsedUrl(req);
      const { pathname } = parsedUrl;
      
      // Proxy API requests (including SSE)
      if (pathname.startsWith('/api/')) {
        if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
          console.log('Proxying SSE request to:', backendOrigin.origin + pathname);
        }
        proxyApiRequest(req, res);
        return;
      }
      
      // Let Next.js handle everything else
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}); 