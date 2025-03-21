# astro-annotate

## 1. Overview

astro-annotate is an Astro integration that allows users to highlight text on a webpage and add comments during development. It is designed to help teams collaborate on content editing and review. Once the content is finalized, the integration can be disabled or removed for production.

## 2. Key Features

1. Highlight Text:

   - Users can select text on the page and highlight it.
   - Highlights are visually distinct (e.g., yellow background).

2. Add Comments:

   - Users can add comments to highlighted text.
   - Comments are displayed below the highlighted text.

3. Save Annotations:

   - Annotations (highlights + comments) are saved to a SQLite database.
   - Each annotation includes:
     - Highlighted text.
     - Comment.
     - Page URL.
     - Unique selector for the highlighted element.
     - User ID (to track who created the annotation).
     - Timestamp.

4. Load Annotations:

   - Annotations are loaded when the page is refreshed.
   - Comments are reattached to the correct elements using the saved selector.

5. Disable for Production:

   - The integration can be disabled in the Astro config for production builds.

6. Easy Removal:
   - The integration can be removed without leaving behind artifacts (e.g., database files).

## 3. Project Structure

Here’s the structure of the astro-annotate project:

astro-annotate/
├── src/
│ ├── database/
│ │ └── db.ts # SQLite database setup and utilities
│ ├── api/
│ │ └── annotations.ts # API routes for saving/fetching annotations
│ ├── utils/
│ │ └── selector.ts # Utility to generate unique selectors for elements
│ ├── index.ts # Main integration logic
├── dist/ # Compiled output (generated by `tsc`)
├── package.json # Project dependencies and scripts
├── tsconfig.json # TypeScript configuration
└── README.md # Project documentation

## 4. How It Works

1. Integration Setup:

- The integration injects a script into the Astro project.
- The script handles:
  - Highlighting text.
  - Adding comments.
  - Saving/loading annotations via API routes.

2. Database:

- Annotations are stored in a SQLite database (annotations.db).
- The database is initialized when the integration is enabled.

3. API Routes:

- Two API routes are provided:
  - POST /api/annotations: Saves a new annotation.
  - GET /api/annotations: Fetches annotations for the current page.

4. Frontend Logic:

   - The injected script listens for text selection events.
   - When text is selected, the user is prompted to add a comment.
   - The comment and highlighted text are saved to the database.

5. Loading Annotations:
   - When the page is loaded, the script fetches annotations for the current URL.
   - Comments are reattached to the correct elements using the saved selectors.

## 5. Usage

### Installation

1. Install the integration in your Astro project:

```bash
npm install astro-annotate
```

2. Add the integration to your astro.config.mjs

```js
import { defineConfig } from "astro/config";
import astroAnnotate from "astro-annotate";

export default defineConfig({
  integrations: [
    astroAnnotate({ enabled: true }), // Enable for development
  ],
});
```

3. Run your project

```bash
npm run dev
```

### Using the Integration

1. Highlight Text:

- Select text on the page. It will be highlighted in yellow.

2. Add a Comment:

- After highlighting, a prompt will appear asking for a comment.
- Enter your comment and click "OK".

3. View Annotations:

- Comments are displayed below the highlighted text.
- Annotations persist across page reloads.

### Disabling for Production

To disable the integration for production, set enabled: false in the Astro config:

```js
import { defineConfig } from "astro/config";
import astroAnnotate from "astro-annotate";

export default defineConfig({
  integrations: [
    astroAnnotate({ enabled: false }), // Disable for production
  ],
});
```

### Removing the Integration

- Remove the integration from your astro.config.mjs.
- Delete the annotations.db file from your project directory.

## **6. Future Enhancements**

1. **Switch to Supabase**:

   - Replace SQLite with Supabase for cloud-based storage.
   - Add authentication and API keys for security.

2. **User Management**:

   - Add user roles (e.g., admin, editor) to control who can create/edit annotations.

3. **Export Annotations**:

   - Allow users to export annotations as a JSON or CSV file.

4. **UI Improvements**:
   - Add a sidebar or modal for managing annotations.
   - Improve the visual design of highlights and comments.

---

## **7. Conclusion**

`astro-annotate` is a powerful tool for collaborative content editing during development. By following this outline, you can build a robust and user-friendly integration that meets your needs. Let me know if you need further assistance! 🚀
