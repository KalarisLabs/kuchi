// /agents/<slug>: copy buttons (setup prompt, commands, prompts) and install-link analytics.
// Both events are on the analytics allowlist (analytics-events.mjs) and carry no prompt text.
const telemetry = import('./analytics.mjs').catch(() => null);
const track = (name: string, props: Record<string, string>) =>
  telemetry.then((api) => (api as { track?: (...args: unknown[]) => unknown } | null)?.track?.(name, props)).catch(() => {});

const client = location.pathname.split('/').filter(Boolean)[1] ?? 'agent';
const toast = document.getElementById('toast');
let toastTimer = 0;
function notify(message: string) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2500);
}

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-copy-text]')) {
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copyText ?? '');
      button.dataset.copied = 'true';
      setTimeout(() => button.removeAttribute('data-copied'), 2000);
      notify('Copied to clipboard');
      if (button.classList.contains('ag-copy-wide')) track('setup_prompt_copied', { placement: 'agent-page', client });
    } catch {
      notify('Copy unavailable. Select and copy the text.');
    }
  });
}

document.addEventListener('click', (event) => {
  const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a.ag-btn');
  if (!link || link.getAttribute('href')?.startsWith('#') || link.getAttribute('href')?.startsWith('/')) return;
  const protocol = new URL(link.href, location.href).protocol;
  track('quick_connect_clicked', { client, destination: protocol === 'https:' ? 'web' : 'desktop' });
});
