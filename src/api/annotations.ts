import type { APIRoute } from 'astro';
import { openDb } from '../database/db.js';

export const post: APIRoute = async ({ request }) => {
  const db = await openDb();
  const annotation = await request.json();

  await db.run(
    'INSERT INTO annotations (id, userId, highlightId, text, comment, pageUrl, selector, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      annotation.id,
      annotation.userId,
      annotation.highlightId,
      annotation.text,
      annotation.comment,
      annotation.pageUrl,
      annotation.selector,
      annotation.timestamp,
    ]
  );

  await db.close();
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const get: APIRoute = async ({ url }) => {
  const db = await openDb();
  const pageUrl = url.searchParams.get('pageUrl');

  if (!pageUrl) {
    return new Response(JSON.stringify({ error: 'pageUrl is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const annotations = await db.all(
    'SELECT * FROM annotations WHERE pageUrl = ?',
    [pageUrl]
  );

  await db.close();
  return new Response(JSON.stringify(annotations), {
    headers: { 'Content-Type': 'application/json' },
  });
};