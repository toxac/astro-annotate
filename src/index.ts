import type { AstroIntegration } from 'astro';
import { initDb } from './database/db.js';
import './api/annotations.js';


export default function astroAnnotate(options: { enabled?: boolean } = { enabled: true }): AstroIntegration {
  return {
    name: 'astro-annotate',
    hooks: {
      'astro:config:setup': ({ injectScript, injectRoute }) => {
        if (!options.enabled) return;

        initDb();

        injectRoute({
          pattern: '/api/annotations',
          entrypoint: 'astro-annotate/dist/api/annotations.js',
        });

        injectScript('page', `
          // Inline the getUniqueSelector function
          function getUniqueSelector(element) {
            if (element.id) {
              return '#' + element.id;
            }

            const path = [];
            let currentElement = element;

            while (currentElement && currentElement.nodeName.toLowerCase() !== 'body') {
              let selector = currentElement.nodeName.toLowerCase();

              if (currentElement.id) {
                selector += '#' + currentElement.id;
                path.unshift(selector);
                break;
              } else {
                let sibling = currentElement;
                let nth = 1;

                while (sibling.previousElementSibling) {
                  sibling = sibling.previousElementSibling;
                  if (sibling.nodeName.toLowerCase() === selector) {
                    nth++;
                  }
                }

                if (nth !== 1) {
                  selector += ':nth-of-type(' + nth + ')';
                }
              }

              path.unshift(selector);
              currentElement = currentElement.parentElement;
            }

            return path.join(' > ');
          }

          const userId = localStorage.getItem('userId') || 'user-' + Math.random().toString(36).substring(7);
          localStorage.setItem('userId', userId);

          async function saveAnnotation(highlightId, text, comment, pageUrl, element) {
            const selector = getUniqueSelector(element);
            const annotation = {
              id: 'annotation-' + Date.now(),
              userId,
              highlightId,
              text,
              comment,
              pageUrl,
              selector,
              timestamp: new Date().toISOString(),
            };

            await fetch('/api/annotations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(annotation),
            });
          }

          async function fetchAnnotations(pageUrl) {
            const response = await fetch('/api/annotations?pageUrl=' + encodeURIComponent(pageUrl));
            const annotations = await response.json();
            annotations.forEach(annotation => {
              const element = document.querySelector(annotation.selector);
              if (element) {
                const commentElement = document.createElement('div');
                commentElement.className = 'astro-annotate-comment';
                commentElement.textContent = annotation.comment + ' (by ' + annotation.userId + ')';
                element.appendChild(commentElement);
              }
            });
          }

          document.addEventListener('mouseup', () => {
            const selection = window.getSelection();
            if (selection.toString().trim()) {
              const range = selection.getRangeAt(0);
              const highlight = document.createElement('span');
              highlight.className = 'astro-annotate-highlight';
              highlight.textContent = selection.toString();

              const highlightId = 'highlight-' + Date.now();
              highlight.setAttribute('data-annotate-id', highlightId);

              range.deleteContents();
              range.insertNode(highlight);

              const comment = prompt('Add a comment:');
              if (comment) {
                saveAnnotation(highlightId, selection.toString(), comment, window.location.href, highlight);
              }
            }
          });

          fetchAnnotations(window.location.href);
        `);
      },
    },
  };
}