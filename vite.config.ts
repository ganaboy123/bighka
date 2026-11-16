import { cpSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const reactPages = Object.fromEntries(
  readdirSync(projectRoot).filter(file => file.endsWith('.html'))
    .map(file => [path.basename(file, '.html'), path.join(projectRoot, file)])
);

// Every HTML page compiles the shared React background entry.
// Preserve direct static asset URLs and video range support.
function preservePortfolio(): Plugin {
  let outputDirectory: string;

  return {
    name: 'preserve-static-portfolio',
    apply: 'build',
    configResolved(config) {
      outputDirectory = path.resolve(projectRoot, config.build.outDir);
    },
    closeBundle() {
      const legacyScripts = new Set(['app.js', 'world.js', 'playground.js']);

      for (const file of readdirSync(projectRoot, { withFileTypes: true })) {
        const source = path.join(projectRoot, file.name);
        if (file.isFile() &&
            (file.name.endsWith('.css') || legacyScripts.has(file.name))) {
          cpSync(source, path.join(outputDirectory, file.name));
        }
      }

      cpSync(path.join(projectRoot, 'assets'), path.join(outputDirectory, 'assets'), { recursive: true });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), preservePortfolio()],
  publicDir: false,
  resolve: { alias: { '@': path.join(projectRoot, 'src') } },
  server: { port: 5173 },
  build: { rollupOptions: { input: reactPages } }
});
