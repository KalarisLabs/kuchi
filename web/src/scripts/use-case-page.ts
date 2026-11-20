// /use-cases and /use-cases/<slug>: copy buttons (setup prompt, install commands, prompts).
// Copy only, no analytics: the agent-page events describe a harness, which these pages are not.
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
    } catch {
      notify('Copy unavailable. Select and copy the text.');
    }
  });
}
