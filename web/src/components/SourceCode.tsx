// Component source on the site, in the code-block UI: Kuchi's accent, line numbers, a copy
// button, and a height cap so long files scroll inside the frame. Rendered on the server on
// /components/<name> (the code stays in the HTML for search) and mounted on demand in the
// /components "View code" dialog via mountSourceCode.
import { createRoot, type Root } from 'react-dom/client';
import { CodeBlock } from '@/components/ui/code-block';

// One hex for both themes: the block derives its light and dark palettes from it.
export const ACCENT = '#3355ff';

export type SourceCodeProps = {
  code: string;
  filename?: string;
  language?: string;
  maxHeight?: number;
};

export default function SourceCode({ code, filename, language = 'tsx', maxHeight = 640 }: SourceCodeProps) {
  return (
    <CodeBlock
      code={code}
      filename={filename}
      language={language}
      accent={ACCENT}
      style={{ maxHeight }}
      // The page scrolls with Lenis; this lets the code area scroll on its own.
      data-lenis-prevent=""
    />
  );
}

const roots = new WeakMap<Element, Root>();

/** Renders (or re-renders) a SourceCode into `el`. Used by the /components dialog. */
export function mountSourceCode(el: Element, props: SourceCodeProps) {
  let root = roots.get(el);
  if (!root) {
    root = createRoot(el);
    roots.set(el, root);
  }
  root.render(<SourceCode {...props} />);
}
