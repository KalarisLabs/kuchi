// Catalog of the copy-paste video components. Built at build time from
// src/registry/manifest.json (see THIRD_PARTY_LICENSES for the code's licence).
import manifest from '../registry/manifest.json';

export interface RegistryFile { vendored: string; target: string; type: string }
export interface RegistryItem {
  name: string;
  type: string;
  title: string;
  description: string;
  category: string;
  dependencies: string[];
  devDependencies: string[];
  registryDependencies: string[];
  files: RegistryFile[];
}

export const SITE = 'https://kuchi.kalarislabs.com';
const MEDIA = 'https://kuchi-media.kalarislabs.com/components';

export const items = manifest as RegistryItem[];
/** Everything except the shared library items, which install automatically. */
export const components = items.filter((item) => item.category !== 'library');

export const categoryLabels: Record<string, string> = {
  text: 'Text',
  scenes: 'Scenes',
  screens: 'Screens',
  'ai-input': 'AI input',
  captions: 'Captions',
  cursor: 'Cursor',
  logos: 'Logos',
  social: 'Social',
  transitions: 'Transitions',
  effects: 'Effects',
};

export const categories = Object.keys(categoryLabels).filter((key) =>
  components.some((item) => item.category === key),
);

export const installCommand = (name: string) =>
  `npx shadcn@latest add ${SITE}/r/${name}.json`;
export const posterUrl = (name: string) => `${MEDIA}/posters/${name}.webp`;
export const videoUrl = (name: string) => `${MEDIA}/${name}.mp4`;
