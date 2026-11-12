// Builds the gallery data with ../scripts/build_site.py and stages everything
// except index.html (rendered by src/pages/index.astro) into public/.
// MP4s go to ../site-public for scripts/sync_media_r2.py, never into the Worker.
import { execFileSync } from 'node:child_process';
import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(web, '..');
const generated = path.join(web, '.generated');
const env = {
  ...process.env,
  PYTHONUTF8: '1',
  KUCHI_BASE_URL: process.env.KUCHI_BASE_URL ?? 'https://kuchi.kalarislabs.com',
  KUCHI_MEDIA_URL: process.env.KUCHI_MEDIA_URL ?? 'https://kuchi-media.kalarislabs.com',
};
const python = process.env.PYTHON ?? (process.platform === 'win32' ? 'python' : 'python3');
execFileSync(python, ['scripts/build_site.py', '--output', generated, '--media-dir', path.join(root, 'site-public')],
  { cwd: root, env, stdio: 'inherit' });
rmSync(path.join(web, 'public'), { recursive: true, force: true });
mkdirSync(path.join(web, 'public'));
cpSync(generated, path.join(web, 'public'), {
  recursive: true,
  filter: (src) => path.basename(src) !== 'index.html' || path.dirname(src) !== generated,
});
console.log('Staged gallery into web/public');
