// Plays the logo splash (components/SiteSplash.astro): the Kuchi popcorn rises through a
// liquid-glass tile, "Kuchi BY Kalaris Labs" blurs in under it, and the whole sheet fades away.
// About 2 s from the moment the glass starts. Loaded only when the head script in BaseLayout
// set <html data-splash>: the first page of a browser session, never on later page switches.
import { createRoot } from "react-dom/client"
import { GlassIconReveal } from "@/components/ui/liquid-glass-logo-reveal"
import popcorn from "../../public/favicon.svg?raw"

// leaveAt: ms after the glass starts when the sheet begins to fade; leaveAt + fade is the
// total. giveUp: ms to wait for the logo texture before going on without it. speed: how fast
// the reveal plays (it is 2.5 s long at speed 1).
const TIMING = { leaveAt: 1650, fade: 350, giveUp: 900, speed: 1.55 }

export function playSplash(shell: HTMLElement) {
  const root = document.documentElement
  const stage = shell.querySelector<HTMLElement>("[data-splash-stage]")
  if (!stage) {
    shell.remove()
    delete root.dataset.splash
    return
  }

  const { leaveAt, fade, giveUp, speed } = TIMING
  const dark = root.dataset.theme === "dark"
  const react = createRoot(stage)
  let started = false
  let leaveTimer = 0

  function start() {
    if (started) return
    started = true
    shell.classList.add("is-playing")
    leaveTimer = window.setTimeout(leave, leaveAt)
  }

  function leave() {
    window.clearTimeout(leaveTimer)
    shell.classList.add("is-leaving")
    window.setTimeout(finish, fade)
  }

  function finish() {
    try {
      react?.unmount()
    } catch {
      /* already gone */
    }
    shell.remove()
    delete root.dataset.splash
    window.removeEventListener("keydown", onKey)
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" || e.key === "Enter" || e.key === " ") leave()
  }
  window.addEventListener("keydown", onKey)
  shell.addEventListener("click", leave, { once: true })
  window.setTimeout(start, giveUp)

  react.render(
    <GlassIconReveal
      logo={popcorn}
      label="Kuchi"
      look={dark ? "dark" : "light"}
      background={dark ? "#121212" : "#ffffff"}
      originalColors
      // Dark pages: the popcorn's ink outline would vanish on near-black, so the glass
      // settles into a cream app tile instead of letting go.
      iconPlate={dark}
      keepPlate={dark}
      plateColor="#fff7e6"
      tileSize={168}
      logoScale={0.62}
      finalScale={dark ? 0.9 : 0.82}
      loop={false}
      speed={speed}
      tuning={{ present: 1.4, glide: 1.1, startZoom: 2.2, sheen: 0.7, lightTurn: 0.6 }}
      onReady={start}
      className="h-full w-full cursor-default"
    />,
  )
}
