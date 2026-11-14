// Fails when the current branch changes a path the frontend migration must not touch.
// See web/docs/FRONTEND_PLAN.md, section 2. Checks commits on this branch (against main)
// and staged changes. Uncommitted edits by other sessions in the shared working tree are
// deliberately not examined here.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const base = process.env.SCOPE_BASE ?? 'main';

// Never edit (plan section 2). Prefix match on repo-relative, forward-slash paths.
const FORBIDDEN = [
  'agent-service/', 'agent/', 'plugin/', 'server.json', 'directory-submission/',
  'site-worker/', 'site/', 'data/', 'scripts/', 'videos/', 'previews/',
  'web/src/pages/relay/', 'web/src/pages/assets/', 'web/public/',
];
// Allowed only with explicit user approval: reported as a warning, not a failure.
const NEEDS_APPROVAL = ['web/wrangler.jsonc', 'web/scripts/stage.mjs', '.github/'];

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);

let changed;
try {
  changed = new Set([...git('diff', '--name-only', `${base}...HEAD`), ...git('diff', '--name-only', '--cached')]);
} catch (error) {
  console.error(`check-scope: could not diff against "${base}": ${error.message}`);
  process.exit(2);
}

const matches = (file, list) => list.some((p) => (p.endsWith('/') ? file.startsWith(p) : file === p));
const forbidden = [...changed].filter((f) => matches(f, FORBIDDEN));
const approval = [...changed].filter((f) => matches(f, NEEDS_APPROVAL));

for (const f of approval) console.warn(`needs explicit user approval: ${f}`);
if (forbidden.length) {
  console.error('Frontend scope violation, these paths must not change:');
  for (const f of forbidden) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`check-scope: ok (${changed.size} changed file(s) against ${base})`);
