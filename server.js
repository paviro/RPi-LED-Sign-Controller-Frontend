const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const httpProxy = require('http-proxy');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000; // You can change this to your preferred port
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Create a proxy server with custom settings for SSE
const proxy = httpProxy.createProxyServer({
  // Set proper timeout for long-lived connections
  proxyTimeout: 3600000, // 1 hour
  timeout: 3600000,      // 1 hour
  // Ensures headers are properly passed through
  changeOrigin: true,
  // Don't buffer responses for streaming
  buffer: false
});

// Handle proxy errors so they don't crash the server
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
  }
  res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
});

// Handle upgrade events for WebSocket support if needed
proxy.on('proxyReq', (proxyReq, req, res) => {
  // Ensure proper headers for SSE
  if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
    proxyReq.setHeader('Connection', 'keep-alive');
    proxyReq.setHeader('Cache-Control', 'no-cache');
  }
});

const backendUrl = process.env.BACKEND_URL || 'http://172.20.2.167:3000';
console.log(`\x1b[33m Using API base URL ${backendUrl} for dev server, specify your own via BACKEND_URL environment variable \x1b[0m \n`);

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;
      
      // Proxy API requests (including SSE)
      if (pathname.startsWith('/api/')) {
        // Special handling for SSE
        if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
          console.log('Proxying SSE request to:', backendUrl + pathname);
          return proxy.web(req, res, { 
            target: backendUrl,
            // Additional SSE-specific settings
            selfHandleResponse: false
          });
        }
        
        // Handle regular API requests
        return proxy.web(req, res, { target: backendUrl });
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