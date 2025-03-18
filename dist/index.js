export * from './api/annotate.js';
export default function astroAnnotate() {
    return {
        name: 'astro-annotate',
        hooks: {
            'astro:config:setup': ({ injectScript }) => {
                // Inject the frontend script
                injectScript('page', `
          // Inject CSS dynamically
          const style = document.createElement('style');
          style.textContent = \`
            .astro-annotate-highlight {
              background-color: yellow;
              cursor: pointer;
            }
            .astro-annotate-comment {
              margin-top: 5px;
              padding: 5px;
              background-color: #f0f0f0;
              border-left: 3px solid #ccc;
            }
          \`;
          document.head.appendChild(style);

          // Highlight and comment logic
          document.addEventListener('mouseup', () => {
            const selection = window.getSelection();
            if (selection.toString().trim()) {
              const range = selection.getRangeAt(0);
              const highlight = document.createElement('span');
              highlight.className = 'astro-annotate-highlight';
              highlight.textContent = selection.toString();

              // Add a unique ID to the highlight
              const highlightId = 'highlight-' + Date.now();
              highlight.setAttribute('data-annotate-id', highlightId);

              range.deleteContents();
              range.insertNode(highlight);

              // Prompt for a comment
              const comment = prompt('Add a comment:');
              if (comment) {
                // Save the highlight and comment
                saveAnnotation(highlightId, selection.toString(), comment, window.location.href);
              }
            }
          });

          function saveAnnotation(highlightId, text, comment, pageUrl) {
            fetch('/api/annotations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ highlightId, text, comment, pageUrl })
            });
          }

          // Fetch and render annotations for the current page
          fetch('/api/annotations?pageUrl=' + encodeURIComponent(window.location.href))
            .then(response => response.json())
            .then(annotations => {
              annotations.forEach(annotation => {
                const element = document.querySelector(\`[data-annotate-id="\${annotation.highlightId}"]\`);
                if (element) {
                  const commentElement = document.createElement('div');
                  commentElement.className = 'astro-annotate-comment';
                  commentElement.textContent = annotation.comment;
                  element.appendChild(commentElement);
                }
              });
            });
        `);
            }
        }
    };
}
