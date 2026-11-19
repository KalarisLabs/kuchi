// The gooey section nav on the agent guides and the blog: hop between the guides, the posts
// and the component library. The page passes its own path so the right item starts active.
import { GooeyNav } from '@/components/ui/gooey-nav';

const ITEMS = [
  { label: 'Agent guides', href: '/agents' },
  { label: 'Blog', href: '/blog' },
  { label: 'Components', href: '/components' },
];

// One hex for both themes (an SVG gradient stop can't read a CSS variable): Kuchi's accent.
const ACCENT = '#3355ff';

export default function SectionNav({ pathname }: { pathname: string }) {
  return (
    <div className="section-nav">
      <GooeyNav items={ITEMS} pathname={pathname} size="sm" activeColor={ACCENT} aria-label="Guides and posts" />
    </div>
  );
}
