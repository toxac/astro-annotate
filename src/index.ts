// src/index.ts
import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as path from 'path';

interface AnnotationsOptions {
  supabaseUrl: string;
  supabaseKey: string;
  enabled?: boolean; // Enable only in dev mode by default
}

const SCRIPT_PATH = path.resolve(fileURLToPath(import.meta.url), '../client/annotations.js');

export default function annotations(options: AnnotationsOptions): AstroIntegration {
  const enabled = options.enabled ?? process.env.NODE_ENV === 'development';
  
  return {
    name: 'astro-annotations',
    hooks: {
      'astro:config:setup': ({ injectScript, updateConfig }) => {
        // Only enable in development mode by default
        if (!enabled) return;
        
        // Add Supabase as external dependency
        updateConfig({
          vite: {
            optimizeDeps: {
              include: ['@supabase/supabase-js']
            }
          }
        });
        
        // Inject the client-side script that will handle annotations
        injectScript('page', `
          import { createClient } from '@supabase/supabase-js';
          
          // Initialize Supabase client
          const supabase = createClient(
            '${options.supabaseUrl}',
            '${options.supabaseKey}'
          );
          
          // Add annotations functionality
          window.addEventListener('DOMContentLoaded', () => {
            const script = document.createElement('script');
            script.src = '/@astro-annotations/client.js';
            script.dataset.supabaseUrl = '${options.supabaseUrl}';
            script.dataset.supabaseKey = '${options.supabaseKey}';
            document.body.appendChild(script);
            
            const style = document.createElement('link');
            style.rel = 'stylesheet';
            style.href = '/@astro-annotations/styles.css';
            document.head.appendChild(style);
          });
        `);
      },
      
      'astro:server:setup': ({ server }) => {
        if (!enabled) return;
        
        // Serve the client-side script
        server.middlewares.use('/@astro-annotations/client.js', (req, res) => {
          res.setHeader('Content-Type', 'application/javascript');
          fs.createReadStream(SCRIPT_PATH).pipe(res);
        });
        
        // Serve the styles
        server.middlewares.use('/@astro-annotations/styles.css', (req, res) => {
          res.setHeader('Content-Type', 'text/css');
          fs.createReadStream(
            path.resolve(fileURLToPath(import.meta.url), '../client/styles.css')
          ).pipe(res);
        });
        
        // API endpoint for annotations
        server.middlewares.use('/api/annotations', async (req, res) => {
          const url = new URL(req.url!, `http://${req.headers.host}`);
          
          if (req.method === 'GET') {
            // Handle fetching annotations for a specific page
            const pageUrl = url.searchParams.get('pageUrl');
            
            if (!pageUrl) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing pageUrl parameter' }));
              return;
            }
            
            // Proxy the request to Supabase
            // (In a real implementation, you'd use the Supabase SDK here)
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ annotations: [] })); // Placeholder
          } 
          else if (req.method === 'POST') {
            // Handle creating a new annotation
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                // Validate and store in Supabase
                // (In a real implementation, you'd use the Supabase SDK here)
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ id: 'new-id', ...data }));
              } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
          }
          else {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
          }
        });
      }
    }
  };
}


