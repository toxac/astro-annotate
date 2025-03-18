// src/index.ts
import { fileURLToPath } from 'url';
import path from 'path';
import type { AstroIntegration, AstroConfig, AstroIntegrationLogger, InjectedScriptStage } from 'astro';

export default function commentIntegration(options: { enabled?: boolean } = { enabled: true }): AstroIntegration {
  return {
    name: 'astro-annotate',
    hooks: {
      'astro:config:setup': ({ config, command, isRestart, updateConfig, injectScript, logger }: {
        config: AstroConfig;
        command: 'build' | 'dev' | 'preview' | 'sync';
        isRestart: boolean;
        updateConfig: (newConfig: Partial<AstroConfig>) => void; // Use Partial<AstroConfig>
        injectScript: (stage: InjectedScriptStage, content: string) => void; // Correct injectScript type
        logger: AstroIntegrationLogger;
      }) => {
        if (!options.enabled) {
          return; // Disable the integration if 'enabled' is false
        }

        const clientPath = fileURLToPath(new URL('./client.ts', import.meta.url));
        const apiPath = fileURLToPath(new URL('./api/comments.ts', import.meta.url));
        const dbPath = fileURLToPath(new URL('./db.ts', import.meta.url));

        // Inject client-side script
        injectScript('page', `import "${clientPath}";`); // Correct injectScript usage

        // Copy API route and db.js to the project's src/pages/api directory
        const apiDir = path.join(config.srcDir.pathname, 'pages/api');
        const dbDir = path.join(config.srcDir.pathname, 'lib');

        config.vite.plugins?.push({
          name: 'copy-api-and-db',
          generateBundle() {
            this.emitFile({
              type: 'asset',
              fileName: 'pages/api/comments.js',
              source: `import '../../../${path.relative(apiDir, apiPath)}';`,
            });
            this.emitFile({
              type: 'asset',
              fileName: 'lib/db.js',
              source: `import '../../${path.relative(dbDir, dbPath)}';`,
            });
          },
        });
      },
    },
  };
}