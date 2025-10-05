import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import multer from "multer";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const API_BASE_URL = 'https://jak-doczlapie-hackyeah.b.solvro.pl/api/v1';

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Schedule import endpoint
  app.post('/api/schedules/import', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      let content = '';
      const fileType = req.file.mimetype;

      // Handle PDF files
      if (fileType === 'application/pdf') {
        const pdfData = await pdfParse(req.file.buffer);
        content = pdfData.text;
      } 
      // Handle image files
      else if (fileType.startsWith('image/')) {
        const base64Image = req.file.buffer.toString('base64');
        
        const visionResponse = await openai.chat.completions.create({
          model: "gpt-5",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all text content from this timetable image. Focus on schedule times, stop names, route information, and conditions."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${fileType};base64,${base64Image}`
                  }
                }
              ],
            },
          ],
          max_completion_tokens: 4096,
        });

        content = visionResponse.choices[0].message.content || '';
      } else {
        return res.status(400).json({ error: 'Unsupported file type. Please upload an image or PDF.' });
      }

      // Process the extracted content with OpenAI to structure it
      const structureResponse = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are a transportation schedule data extraction expert. Extract timetable information from the provided text and return it as JSON.

The JSON format should be:
{
  "data": [
    {
      "route": "route name",
      "operator": "operator name",
      "type": "bus" or "train" or "tram",
      "stops": [
        {
          "name": "stop name",
          "time": "HH:MM",
          "conditions": ["condition1", "condition2"],
          "direction": "destination",
          "run": run_number
        }
      ]
    }
  ]
}

Important rules:
- Extract all stops with their times
- Group stops by route and run number
- Include all conditions/symbols (like D, ą, m, 6x, etc.)
- Time must be in HH:MM format
- Run number should be an integer
- If multiple routes exist, create separate objects in the data array`
          },
          {
            role: "user",
            content: content
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      const scheduleData = JSON.parse(structureResponse.choices[0].message.content || '{"data":[]}');
      
      res.json(scheduleData);
    } catch (error) {
      console.error('Schedule import error:', error);
      res.status(500).json({ 
        error: 'Failed to process schedule file', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

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
