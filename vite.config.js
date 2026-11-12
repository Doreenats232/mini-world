import { defineConfig } from 'vite';
import fs from 'fs';
const v = JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
export default defineConfig({ base: './', define: { __V__: JSON.stringify(v) }, build: { outDir: 'dist', chunkSizeWarningLimit: 2000 } });
