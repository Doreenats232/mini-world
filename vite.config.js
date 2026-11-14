import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
const v = JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
const partsDir = path.resolve('src/parts');
// src/main.js is a stub: its real content is every file in src/parts/ joined in filename order (so the game stays one scope).
function concatParts() {
  return {
    name: 'concat-parts', enforce: 'pre',
    load(id) {
      if (!id.replace(/\\/g, '/').endsWith('/src/main.js')) return null;
      const files = fs.readdirSync(partsDir).filter(f => f.endsWith('.js')).sort();
      files.forEach(f => this.addWatchFile(path.join(partsDir, f)));
      return files.map(f => fs.readFileSync(path.join(partsDir, f), 'utf8')).join('');
    },
  };
}
export default defineConfig({ base: './', plugins: [concatParts()], define: { __V__: JSON.stringify(v) }, build: { outDir: 'dist', chunkSizeWarningLimit: 2000 } });
