// Prompts for the video components (owner, 2026-11-19: "a setup prompt for every agent, so
// that it works across any harness"). Plain strings with no catalog import, so the components
// page script can use them in the browser as well as the Astro pages at build time.
//
// Only steps that work in any agent: an MCP server added by URL, the shadcn CLI, and Remotion's
// own commands. The registry form and the install command are the ones the site already
// documents (lib/components-catalog.ts installCommand, the blog post on components over MCP).
const SITE = 'https://kuchi.kalarislabs.com';
const MCP = `${SITE}/mcp`;

/** Sets up any coding agent to find, read and install the components. */
export const COMPONENTS_SETUP_PROMPT = `Set up Kuchi's Remotion video components in this project.

1. Connect the Kuchi MCP server at ${MCP} (Streamable HTTP, no sign-in, no API key) and confirm it works by listing its tools.
2. Make sure this is a Remotion project. If it is not, create one with npx create-video@latest.
3. If there is no components.json, run npx shadcn@latest init. Then add the Kuchi registry to components.json: "registries": { "@kuchi": "${SITE}/r/{name}.json" }.
4. When I ask for a component, find it with kuchi_list_components, read its source and usage notes with kuchi_get_component, and install it with npx shadcn@latest add @kuchi/<name>.
5. Use it in a composition with my own text, colours and assets, and start npx remotion studio so I can preview it.`;

/** Installs one component, in any agent that can run a command. */
export const componentPrompt = (name: string, title: string) => `Add the "${title}" video component from Kuchi to this Remotion project.

Run: npx shadcn@latest add ${SITE}/r/${name}.json
It copies the source and everything it depends on. If this is not a Remotion project yet, create one with npx create-video@latest first.

Then use it in a composition with my own text, colours and assets in place of the sample content, and start npx remotion studio so I can preview it.
If the Kuchi MCP server (${MCP}) is connected, read the props and usage notes with kuchi_get_component, name "${name}".`;
