// src/client/annotations.ts
(function() {
    // Get Supabase credentials from the script tag
    const script = document.currentScript as HTMLScriptElement;
    const supabaseUrl = script.dataset.supabaseUrl || '';
    const supabaseKey = script.dataset.supabaseKey || '';
    
    // Type definitions
    interface Annotation {
      id: string;
      pageUrl: string;
      selector: string;
      content: string;
      createdAt: string;
    }
    
    // State management
    let isAnnotating: boolean = false;
    let selectedElement: HTMLElement | null = null;
    let annotations: Annotation[] = [];
    
    // Create UI container
    const container = document.createElement('div');
    container.className = 'astro-annotations-container';
    document.body.appendChild(container);
    
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'astro-annotations-toggle';
    toggleButton.textContent = 'Annotations';
    toggleButton.addEventListener('click', toggleAnnotationMode);
    container.appendChild(toggleButton);
    
    // Create annotation panel
    const panel = document.createElement('div');
    panel.className = 'astro-annotations-panel';
    panel.style.display = 'none';
    container.appendChild(panel);
    
    // Fetch existing annotations for this page
    async function fetchAnnotations(): Promise<void> {
      try {
        const response = await fetch(`/api/annotations?pageUrl=${encodeURIComponent(window.location.pathname)}`);
        const data = await response.json();
        annotations = data.annotations || [];
        renderAnnotations();
      } catch (error) {
        console.error('Failed to fetch annotations:', error);
      }
    }
    
    // Save a new annotation
    async function saveAnnotation(selector: string, content: string): Promise<Annotation | null> {
      try {
        const response = await fetch('/api/annotations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pageUrl: window.location.pathname,
            selector,
            content,
            createdAt: new Date().toISOString()
          })
        });
        
        const data = await response.json() as Annotation;
        annotations.push(data);
        renderAnnotations();
        return data;
      } catch (error) {
        console.error('Failed to save annotation:', error);
        return null;
      }
    }
    
    // Toggle annotation mode
    function toggleAnnotationMode(): void {
      isAnnotating = !isAnnotating;
      
      if (isAnnotating) {
        document.body.classList.add('astro-annotations-active');
        toggleButton.textContent = 'Exit Annotation Mode';
        panel.style.display = 'block';
        addEventListeners();
        fetchAnnotations();
      } else {
        document.body.classList.remove('astro-annotations-active');
        toggleButton.textContent = 'Annotations';
        panel.style.display = 'none';
        removeEventListeners();
        clearHighlights();
      }
    }
    
    // Get a unique CSS selector for an element
    function getSelector(element: Element): string {
      // Simple implementation - in a real-world scenario, you'd want something more robust
      if (element.id) {
        return `#${element.id}`;
      }
      
      if (element.classList.length > 0) {
        const classes = Array.from(element.classList).join('.');
        return `.${classes}`;
      }
      
      const path: string[] = [];
      let current: Element | null = element;
      
      while (current && current !== document.body) {
        let selector = current.tagName.toLowerCase();
        const parent = current.parentNode as Element;
        
        if (parent && parent.children) {
          const siblings = Array.from(parent.children).filter(el => el.tagName === current?.tagName);
          
          if (siblings.length > 1) {
            const index = siblings.indexOf(current) + 1;
            selector += `:nth-of-type(${index})`;
          }
        }
        
        path.unshift(selector);
        current = current.parentNode as Element;
      }
      
      return path.join(' > ');
    }
    
    // Event handlers
    function handleElementClick(event: MouseEvent): void {
      if (!isAnnotating) return;
      
      // Prevent triggering links
      event.preventDefault();
      
      selectedElement = event.target as HTMLElement;
      
      // Clear previous highlights
      clearHighlights();
      
      // Highlight the selected element
      selectedElement.classList.add('astro-annotations-selected');
      
      // Show add annotation form
      showAnnotationForm();
    }
    
    // Add event listeners
    function addEventListeners(): void {
      document.body.addEventListener('click', handleElementClick);
    }
    
    // Remove event listeners
    function removeEventListeners(): void {
      document.body.removeEventListener('click', handleElementClick);
    }
    
    // Clear highlights
    function clearHighlights(): void {
      document.querySelectorAll('.astro-annotations-selected').forEach(el => {
        el.classList.remove('astro-annotations-selected');
      });
    }
    
    // Show the annotation form
    function showAnnotationForm(): void {
      if (!selectedElement) return;
      
      panel.innerHTML = `
        <h3>Add Annotation</h3>
        <p>Selected: ${selectedElement.tagName.toLowerCase()}</p>
        <textarea id="annotation-content" placeholder="Enter your annotation..."></textarea>
        <div class="annotation-buttons">
          <button id="cancel-annotation">Cancel</button>
          <button id="save-annotation">Save</button>
        </div>
      `;
      
      const cancelButton = document.getElementById('cancel-annotation');
      if (cancelButton) {
        cancelButton.addEventListener('click', () => {
          clearHighlights();
          renderAnnotations();
        });
      }
      
      const saveButton = document.getElementById('save-annotation');
      if (saveButton) {
        saveButton.addEventListener('click', async () => {
          const contentEl = document.getElementById('annotation-content') as HTMLTextAreaElement;
          const content = contentEl?.value || '';
          
          if (!content.trim() || !selectedElement) return;
          
          const selector = getSelector(selectedElement);
          await saveAnnotation(selector, content);
          
          clearHighlights();
          renderAnnotations();
        });
      }
    }
    
    // Render annotations panel
    function renderAnnotations(): void {
      if (!isAnnotating) return;
      
      if (annotations.length === 0) {
        panel.innerHTML = `
          <h3>Annotations</h3>
          <p>No annotations yet. Click on any element to add one.</p>
        `;
        return;
      }
      
      panel.innerHTML = `
        <h3>Annotations (${annotations.length})</h3>
        <ul class="annotations-list">
          ${annotations.map((annotation, index) => `
            <li class="annotation-item" data-index="${index}">
              <div class="annotation-header">
                <strong>Element: ${annotation.selector}</strong>
                <span class="annotation-date">${new Date(annotation.createdAt).toLocaleString()}</span>
              </div>
              <div class="annotation-content">${annotation.content}</div>
            </li>
          `).join('')}
        </ul>
      `;
      
      document.querySelectorAll('.annotation-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
          const index = parseInt((item as HTMLElement).dataset.index || '0');
          const annotation = annotations[index];
          try {
            const element = document.querySelector(annotation.selector);
            if (element) {
              element.classList.add('astro-annotations-highlight');
            }
          } catch (e) {
            console.warn('Invalid selector:', annotation.selector);
          }
        });
        
        item.addEventListener('mouseleave', () => {
          document.querySelectorAll('.astro-annotations-highlight').forEach(el => {
            el.classList.remove('astro-annotations-highlight');
          });
        });
      });
    }
    
    // Initialize after a short delay
    setTimeout(() => {
      fetchAnnotations();
    }, 500);
  })();