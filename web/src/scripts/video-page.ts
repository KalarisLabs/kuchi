// /videos/<slug>: the copy button on the remake prompt.
const telemetry = import('./analytics.mjs').catch(() => null);

const button = document.querySelector<HTMLButtonElement>('[data-copy-prompt]');
const prompt = document.getElementById('vp-prompt');
const label = button?.querySelector('[data-copy-label]');
const toast = document.getElementById('toast');
let toastTimer = 0;
let labelTimer = 0;

function notify(message: string) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2500);
}

button?.addEventListener('click', async () => {
  if (!prompt || !label) return;
  try {
    await navigator.clipboard.writeText(prompt.textContent ?? '');
    label.textContent = 'Copied ✓';
    notify('Prompt copied. Paste it into your agent.');
    const id = Number(document.querySelector<HTMLElement>('[data-reference-id]')?.dataset.referenceId);
    telemetry.then((api) => (api as { track?: (...args: unknown[]) => unknown } | null)?.track?.('reference_prompt_copied', { reference_id: id, surface: 'page' })).catch(() => {});
    clearTimeout(labelTimer);
    labelTimer = window.setTimeout(() => { label.textContent = 'Copy prompt'; }, 2000);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(prompt);
    getSelection()?.removeAllRanges();
    getSelection()?.addRange(range);
    notify('Select the prompt and copy it with ⌘C / Ctrl+C.');
  }
});
