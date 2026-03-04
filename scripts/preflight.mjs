/**
 * Module: preflight
 * Role: 9 pre-submit fitness checks for Yandex Games moderation
 * Uses: fs, path, child_process
 * Used by: npm run check
 * Does NOT: modify files, build the project
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { execSync } from 'child_process';

const DIST = 'dist';
const SRC = 'src';
let failures = 0;

function check(name, fn) {
  try {
    const result = fn();
    if (result === true) {
      console.log(`  ✓ ${name}`);
    } else {
      console.error(`  ✗ ${name}: ${result}`);
      failures++;
    }
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    failures++;
  }
}

function readFileSafe(path) {
  try { return readFileSync(path, 'utf-8'); } catch { return ''; }
}

function getAllFiles(dir, ext) {
  const results = [];
  if (!existsSync(dir)) return results;
  const items = readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...getAllFiles(full, ext));
    } else if (!ext || extname(item.name) === ext) {
      results.push(full);
    }
  }
  return results;
}

console.log('\n🔍 Preflight checks:\n');

// 1. No absolute paths in dist/index.html
check('No absolute paths in index.html', () => {
  const html = readFileSafe(join(DIST, 'index.html'));
  if (!html) return 'dist/index.html not found';
  if (/src="\/[^.]/.test(html) || /href="\/[^.]/.test(html)) {
    return 'Found absolute path (src="/" or href="/")';
  }
  return true;
});

// 2. SDK script tag present
check('SDK script tag present', () => {
  const html = readFileSafe(join(DIST, 'index.html'));
  if (!html) return 'dist/index.html not found';
  if (!html.includes('yandex.ru/games/sdk/v2')) {
    return 'Missing SDK script tag';
  }
  return true;
});

// 3. No sourcemaps
check('No sourcemaps in dist', () => {
  const maps = getAllFiles(DIST, '.map');
  if (maps.length > 0) {
    return `Found ${maps.length} .map file(s): ${maps.join(', ')}`;
  }
  return true;
});

// 4. No secrets
check('No secrets in source', () => {
  const files = getAllFiles(SRC, '.ts');
  const pattern = /(?:password|secret|token|api_key)\s*[:=]/i;
  for (const file of files) {
    const content = readFileSafe(file);
    if (pattern.test(content)) {
      return `Potential secret in ${file}`;
    }
  }
  return true;
});

// 5. File LOC check
check('All src/*.ts ≤ 400 LOC', () => {
  const files = getAllFiles(SRC, '.ts');
  const over = [];
  for (const file of files) {
    const lines = readFileSafe(file).split('\n').length;
    if (lines > 400) over.push(`${file} (${lines} LOC)`);
  }
  if (over.length > 0) return `Over limit: ${over.join(', ')}`;
  return true;
});

// 6. TypeScript compiles
check('TypeScript compiles', () => {
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    return true;
  } catch (err) {
    return err.stderr?.toString() || 'tsc failed';
  }
});

// 7. Import direction (depcruise)
check('Import direction (depcruise)', () => {
  if (!existsSync('.depcruise.json')) return '.depcruise.json not found';
  try {
    execSync('npx depcruise --no-config --validate .depcruise.json src/', { stdio: 'pipe' });
    return true;
  } catch (err) {
    return err.stdout?.toString()?.slice(0, 200) || 'depcruise violations found';
  }
});

// 8. Animal names only in config/
check('Animal names only in config/', () => {
  const animalNames = ['hamster', 'rabbit', 'kitten', 'panda'];
  const files = getAllFiles(SRC, '.ts').filter(f => !f.includes('config'));
  for (const file of files) {
    const content = readFileSafe(file).toLowerCase();
    for (const name of animalNames) {
      // Skip if in a comment or string that references config
      if (content.includes(`'${name}'`) || content.includes(`"${name}"`)) {
        return `Animal name "${name}" found in ${file} — should only be in config/`;
      }
    }
  }
  return true;
});

// 9. Module headers on files > 80 LOC
check('Module headers on files > 80 LOC', () => {
  const files = getAllFiles(SRC, '.ts');
  const missing = [];
  for (const file of files) {
    const content = readFileSafe(file);
    const lines = content.split('\n').length;
    if (lines > 80 && !content.includes('Module:')) {
      missing.push(file);
    }
  }
  if (missing.length > 0) return `Missing header: ${missing.join(', ')}`;
  return true;
});

console.log(`\n${failures === 0 ? '✅ All checks passed' : `❌ ${failures} check(s) failed`}\n`);
process.exit(failures === 0 ? 0 : 1);
