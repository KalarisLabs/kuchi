// The site-wide video player. Every video on the site opens here (see lib/play-video.js):
// the animated modal plays the full video at once, with a details panel underneath
// for the title, the install command and an action. The modal lives inside a
// <dialog> shown with showModal(), so it also stacks above other open dialogs.
import { useCallback, useEffect, useRef, useState } from "react";
import { VideoPlayer } from "./sora-ui/effects/video-player";
import { favButtonsHTML } from "../lib/favorites.js";

export interface PlayVideoRequest {
  /** MP4 to play. */
  src: string;
  /** Heading shown under the video, also the dialog's accessible name. */
  title: string;
  /** Short line under the title (account, category, description). */
  subtitle?: string;
  /** Install command shown with a copy button (components page). */
  command?: string;
  /** Link shown in the details panel, e.g. the original post. */
  link?: { href: string; label: string };
  /** Prompt shown beside the video with a copy button (launch videos: the remake brief). */
  prompt?: { label: string; text: string; hint?: string };
  /**
   * The boxed details card in the panel. With `href` it is a link (the video's or
   * component's own page); with `run` it is a button that runs after the player closes.
   */
  action?: { label: string; hint?: string; href?: string; run?: () => void };
  /** Copy button feedback; defaults to a quiet label change. */
  onCopy?: (ok: boolean, what: "command" | "prompt") => void;
  /** Like and save toggles for this video or component (lib/favorites.js). */
  favorite?: { kind: "video" | "component"; id: string };
  /** data-* attributes for the main <video>, so play analytics keep working. */
  videoAttributes?: Record<string, string>;
}

declare global {
  interface Window {
    kuchiPlay?: (request: PlayVideoRequest) => void;
    __kuchiPlayQueue?: PlayVideoRequest[];
  }
}

interface Current extends PlayVideoRequest {
  key: number;
}

export function KuchiPlayer() {
  const [layer, setLayer] = useState<HTMLDialogElement | null>(null);
  const [current, setCurrent] = useState<Current | null>(null);
  const [copied, setCopied] = useState<"command" | "prompt" | null>(null);
  const pendingAction = useRef<(() => void) | null>(null);
  const counter = useRef(0);

  const play = useCallback((request: PlayVideoRequest) => {
    counter.current += 1;
    pendingAction.current = null;
    setCopied(null);
    setCurrent({ ...request, key: counter.current });
  }, []);

  useEffect(() => {
    window.kuchiPlay = play;
    const queued = window.__kuchiPlayQueue?.splice(0);
    const last = queued?.at(-1);
    if (last) play(last);
    return () => {
      delete window.kuchiPlay;
    };
  }, [play]);

  useEffect(() => {
    if (current && layer && !layer.open) layer.showModal();
  }, [current, layer]);

  const handleClose = useCallback(() => {
    layer?.close();
    setCurrent(null);
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.();
  }, [layer]);

  const closePlayer = () => {
    layer?.querySelector<HTMLButtonElement>(".media-01 button.close")?.click();
  };

  const copyText = async (text: string, what: "command" | "prompt") => {
    let ok = true;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      ok = false;
    }
    current?.onCopy?.(ok, what);
    if (ok) {
      setCopied(what);
      window.setTimeout(() => setCopied((value) => (value === what ? null : value)), 1800);
    }
  };

  const action = current?.action;
  const actionBody = action ? (
    <>
      <span className="kp-card-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M7 8h10M7 12h10M7 16h6" />
        </svg>
      </span>
      <span className="kp-card-text">
        <span className="kp-card-label">{action.label}</span>
        {action.hint ? <span className="kp-card-hint">{action.hint}</span> : null}
      </span>
      <svg className="kp-card-arrow" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </>
  ) : null;

  const details = current ? (
    <div className="kp-details">
      <div className="kp-head">
        <div className="kp-title-row">
          <h2 className="kp-title">{current.title}</h2>
          {current.favorite ? (
            // Plain markup from lib/favorites.js: its document-level handler toggles it and
            // keeps it pressed in step with the cards behind the player.
            <span
              className="kp-fav"
              dangerouslySetInnerHTML={{ __html: favButtonsHTML(current.favorite.kind, current.favorite.id, current.title) }}
            />
          ) : null}
        </div>
        {current.subtitle ? <p className="kp-subtitle">{current.subtitle}</p> : null}
      </div>
      {current.prompt ? (
        <div className="kp-prompt">
          <div className="kp-prompt-head">
            <span className="kp-prompt-label">{current.prompt.label}</span>
            {current.prompt.hint ? <span className="kp-prompt-hint">{current.prompt.hint}</span> : null}
          </div>
          <pre className="kp-prompt-text" tabIndex={0}>{current.prompt.text}</pre>
          <button type="button" className="kp-btn kp-btn-primary kp-copy" onClick={() => copyText(current.prompt!.text, "prompt")}>
            {copied === "prompt" ? "Copied ✓" : "Copy prompt"}
          </button>
        </div>
      ) : null}
      {current.command ? (
        <div className="kp-install">
          <code className="kp-cmd">{current.command}</code>
          <button type="button" className="kp-btn kp-btn-primary" onClick={() => copyText(current.command!, "command")}>
            {copied === "command" ? "Copied ✓" : "Copy command"}
          </button>
        </div>
      ) : null}
      {action ? (
        action.href ? (
          <a className="kp-card" href={action.href}>{actionBody}</a>
        ) : (
          <button
            type="button"
            className="kp-card"
            onClick={() => {
              pendingAction.current = action.run ?? null;
              closePlayer();
            }}
          >
            {actionBody}
          </button>
        )
      ) : null}
      {current.link ? (
        <a className="kp-link" href={current.link.href} target="_blank" rel="noopener">
          {current.link.label}
        </a>
      ) : null}
    </div>
  ) : null;

  return (
    <dialog
      ref={setLayer}
      className="kp-layer"
      aria-label={current?.title ?? "Video player"}
      data-lenis-prevent
      // The player handles Escape itself and animates out; keep the dialog from snapping shut.
      onCancel={(event) => event.preventDefault()}
    >
      {current && layer ? (
        <VideoPlayer
          key={current.key}
          src={current.src}
          dialogLabel={current.title}
          details={details}
          playerClassName={current.prompt || current.command ? "details-side" : undefined}
          portalContainer={layer}
          videoAttributes={current.videoAttributes}
          autoPlay
          defaultOpen
          hideTrigger
          onClose={handleClose}
        />
      ) : null}
    </dialog>
  );
}
