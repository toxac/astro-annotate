// src/api/middleware.ts
import type { AstroIntegration } from 'astro';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { NextHandleFunction } from 'connect';

interface AnnotationData {
  id?: string;
  pageUrl: string;
  selector: string;
  content: string;
  createdAt: string;
}

interface AnnotationsResponse {
  annotations?: AnnotationData[];
  error?: string;
}

export function createAnnotationsMiddleware(
  supabaseUrl: string,
  supabaseKey: string
): NextHandleFunction {
  // Initialize Supabase client
  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
  
  return async (req, res, next) => {
    // Only handle requests to /api/annotations
    if (!req.url?.startsWith('/api/annotations')) {
      return next();
    }
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Set content type to JSON
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'GET') {
      // Handle fetching annotations for a specific page
      const pageUrl = url.searchParams.get('pageUrl');
      
      if (!pageUrl) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Missing pageUrl parameter' }));
        return;
      }
      
      try {
        // Query annotations from Supabase
        const { data, error } = await supabase
          .from('annotations')
          .select('*')
          .eq('page_url', pageUrl)
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        // Map database column names to camelCase for the client
        const annotations = data.map(item => ({
          id: item.id,
          pageUrl: item.page_url,
          selector: item.selector,
          content: item.content,
          createdAt: item.created_at
        }));
        
        res.end(JSON.stringify({ annotations }));
      } catch (error) {
        console.error('Error fetching annotations:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ 
          error: 'Failed to fetch annotations',
          details: error instanceof Error ? error.message : String(error)
        }));
      }
    } 
    else if (req.method === 'POST') {
      // Handle creating a new annotation
      const chunks: Buffer[] = [];
      
      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      req.on('end', async () => {
        try {
          const body = Buffer.concat(chunks).toString();
          const data = JSON.parse(body) as AnnotationData;
          
          // Validate required fields
          if (!data.pageUrl || !data.selector || !data.content) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing required fields' }));
            return;
          }
          
          // Insert into Supabase
          const { data: insertedData, error } = await supabase
            .from('annotations')
            .insert({
              page_url: data.pageUrl,
              selector: data.selector,
              content: data.content,
              created_at: data.createdAt || new Date().toISOString()
            })
            .select()
            .single();
          
          if (error) {
            throw error;
          }
          
          // Map to camelCase for client
          const annotation = {
            id: insertedData.id,
            pageUrl: insertedData.page_url,
            selector: insertedData.selector,
            content: insertedData.content,
            createdAt: insertedData.created_at
          };
          
          res.end(JSON.stringify(annotation));
        } catch (error) {
          console.error('Error creating annotation:', error);
          res.statusCode = error instanceof SyntaxError ? 400 : 500;
          res.end(JSON.stringify({ 
            error: error instanceof SyntaxError ? 'Invalid JSON' : 'Failed to create annotation',
            details: error instanceof Error ? error.message : String(error)
          }));
        }
      });
    }
    else if (req.method === 'DELETE') {
      // Handle deleting an annotation
      const id = url.searchParams.get('id');
      
      if (!id) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Missing id parameter' }));
        return;
      }
      
      try {
        const { error } = await supabase
          .from('annotations')
          .delete()
          .eq('id', id);
        
        if (error) {
          throw error;
        }
        
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('Error deleting annotation:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ 
          error: 'Failed to delete annotation',
          details: error instanceof Error ? error.message : String(error)
        }));
      }
    }
    else {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  };
}