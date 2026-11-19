// The /components directory sidebar: every component under its category heading, with a
// bouncing dot on the one in view. The page script (scripts/components-page.ts) watches the
// cards as the visitor scrolls and sends `kuchi:cmp-active` with the card's name; filtering
// sends `kuchi:cmp-relayout` so the dot re-measures once rows are hidden or shown.
// Rendered on the server, so every link is plain, crawlable HTML before it hydrates.
import { useEffect, useMemo, useRef, useState } from 'react';
import { BounceSidebar, type BounceSidebarItem } from '@/components/ui/bounce-sidebar';

export type SidebarGroup = {
  key: string;
  label: string;
  items: { name: string; title: string }[];
};

export const ACTIVE_EVENT = 'kuchi:cmp-active';
export const RELAYOUT_EVENT = 'kuchi:cmp-relayout';

export default function ComponentsSidebar({ groups }: { groups: SidebarGroup[] }) {
  const { items, indexByName } = useMemo(() => {
    const items: BounceSidebarItem[] = [];
    const indexByName = new Map<string, number>();
    for (const group of groups) {
      items.push({
        label: `${group.label} · ${group.items.length}`,
        heading: true,
        attrs: { 'data-sidebar-heading': group.key },
      });
      for (const item of group.items) {
        indexByName.set(item.name, items.length);
        items.push({
          label: item.title,
          href: `#cmp-${item.name}`,
          attrs: { className: 'cmp-sidebar-link', 'data-name': item.name, 'data-cat': group.key },
        });
      }
    }
    return { items, indexByName };
  }, [groups]);

  const [active, setActive] = useState(1);
  const [layoutKey, setLayoutKey] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onActive = (event: Event) => {
      const index = indexByName.get((event as CustomEvent<{ name: string }>).detail?.name);
      if (index !== undefined) setActive(index);
    };
    const onRelayout = () => setLayoutKey((n) => n + 1);
    window.addEventListener(ACTIVE_EVENT, onActive);
    window.addEventListener(RELAYOUT_EVENT, onRelayout);
    return () => {
      window.removeEventListener(ACTIVE_EVENT, onActive);
      window.removeEventListener(RELAYOUT_EVENT, onRelayout);
    };
  }, [indexByName]);

  // Keep the active row inside the sidebar's own scroll area, without moving the page.
  useEffect(() => {
    const list = listRef.current;
    const pane = list?.closest<HTMLElement>('.cmp-sidebar');
    const row = list?.children[active + 1] as HTMLElement | undefined; // +1: the dot is the first child
    if (!pane || !row) return;
    const top = row.getBoundingClientRect().top - pane.getBoundingClientRect().top;
    const margin = pane.clientHeight * 0.3;
    if (top < margin || top > pane.clientHeight - margin) {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      pane.scrollTo({ top: pane.scrollTop + top - pane.clientHeight / 2, behavior: reduce ? 'auto' : 'smooth' });
    }
  }, [active, layoutKey]);

  return (
    <BounceSidebar
      ref={listRef}
      items={items}
      value={active}
      onChange={setActive}
      layoutKey={layoutKey}
      dotColor="var(--k-accent)"
      headingColor="var(--k-muted)"
      aria-label="Components"
    />
  );
}
