import type { Express } from "express";
import { createServer, type Server } from "http";

const API_BASE_URL = 'https://jak-doczlapie-hackyeah.b.solvro.pl/api/v1';

export async function registerRoutes(app: Express): Promise<Server> {
  // Proxy all /api/v1/* requests to the external API
  app.all('/api/v1/*', async (req, res) => {
    try {
      const path = req.path.replace('/api/v1', '');
      const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
      const url = `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          ...(req.headers['authorization'] ? { 'Authorization': req.headers['authorization'] as string } : {}),
        },
        ...(req.method !== 'GET' && req.method !== 'HEAD' ? { body: JSON.stringify(req.body) } : {}),
      });

      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        res.status(response.status).json(data);
      } else {
        const text = await response.text();
        res.status(response.status).send(text);
      }
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({ error: 'Proxy error' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
