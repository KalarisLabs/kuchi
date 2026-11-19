// /blog and /blog/<slug>: copy buttons, and analytics (page views come from loading
// analytics.mjs; copying the setup prompt sends the allowlisted setup_prompt_copied event,
// with no prompt text).
const telemetry = import('./analytics.mjs').catch(() => null);
const track = (name: string, props: Record<string, string>) =>
  telemetry.then((api) => (api as { track?: (...args: unknown[]) => unknown } | null)?.track?.(name, props)).catch(() => {});

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
      if (button.hasAttribute('data-setup-prompt')) track('setup_prompt_copied', { placement: 'blog', client: 'any' });
    } catch {
      notify('Copy unavailable. Select and copy the text.');
    }
  });
}
