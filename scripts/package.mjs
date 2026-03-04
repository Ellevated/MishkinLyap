/**
 * Module: package
 * Role: Creates Yandex Games submission ZIP from dist/ directory
 * Uses: archiver, fs, path
 * Used by: npm run package
 * Does NOT: build the project, run checks
 */

import archiver from 'archiver';
import { createWriteStream, existsSync, statSync } from 'fs';
import { join } from 'path';

const DIST = 'dist';
const OUTPUT = 'zverata.zip';

if (!existsSync(DIST)) {
  console.error('❌ dist/ directory not found. Run "npm run build" first.');
  process.exit(1);
}

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('❌ dist/index.html not found. Build may have failed.');
  process.exit(1);
}

const output = createWriteStream(OUTPUT);
const archive = archiver('zip', { zlib: { level: 9 } });

let fileCount = 0;

output.on('close', () => {
  const sizeKB = (archive.pointer() / 1024).toFixed(1);
  console.log(`\n📦 ${OUTPUT}: ${sizeKB} KB, ${fileCount} files`);
  console.log('✅ Ready for Yandex Games submission');
});

archive.on('error', (err) => {
  console.error('❌ Archive error:', err);
  process.exit(1);
});

archive.on('entry', () => { fileCount++; });

archive.pipe(output);

// Add all files from dist/ with paths relative to dist/
// This ensures index.html is at ZIP root
archive.directory(DIST + '/', false);

await archive.finalize();
