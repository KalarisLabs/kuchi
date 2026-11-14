"use client";

import { Fragment, useId, useState } from "react";
import type {
  ComponentProps,
  CSSProperties,
  KeyboardEvent,
  ReactNode,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "motion/react";
import { cn } from "@/lib/utils";

const SEND: Transition = { type: "spring", visualDuration: 0.42, bounce: 0.28 };
const SHIFT: Transition = { type: "spring", visualDuration: 0.4, bounce: 0.1 };
const LEAVE: Transition = { duration: 0.16, ease: [0.4, 0, 1, 1] };
const INSTANT: Transition = { duration: 0 };

const QUESTION = '[data-slot="faq-question"]';
const KEY_STEPS: Record<string, (index: number, last: number) => number> = {
  ArrowDown: (index) => index + 1,
  ArrowUp: (index) => index - 1,
  Home: () => 0,
  End: (_, last) => last,
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string | ReactNode;
};

function KuchiAvatar() {
  return (
    <img
      src="/favicon.svg"
      alt=""
      aria-hidden="true"
      className="size-5 object-contain"
    />
  );
}

type BubbleProps = {
  item: FaqItem;
  ids: { question: string; answer: string };
  open: boolean;
  openId: string | null;
  reduced: boolean;
};

function Question({
  item,
  ids,
  open,
  openId,
  reduced,
  onToggle,
}: BubbleProps & { onToggle: () => void }) {
  return (
    <motion.button
      id={ids.question}
      type="button"
      data-slot="faq-question"
      aria-expanded={open}
      aria-controls={open ? ids.answer : undefined}
      onClick={onToggle}
      layout="position"
      layoutDependency={openId}
      transition={reduced ? INSTANT : SHIFT}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      className={cn(
        "max-w-[85%] sm:max-w-[78%] cursor-pointer self-start rounded-[18px] rounded-bl-[6px] px-4.5 py-3 text-left text-[15px] font-medium leading-[1.45] tracking-[-0.01em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--k-accent)]",
        open
          ? "bg-[var(--k-paper)] text-[var(--k-ink)] border border-[var(--k-line)] shadow-sm"
          : "bg-[var(--k-wash)] text-[var(--k-ink)] hover:bg-[var(--k-wash-hover)] border border-[var(--k-line)]",
      )}
    >
      {item.question}
    </motion.button>
  );
}

function Answer({
  item,
  ids,
  open,
  openId,
  reduced,
  avatar,
}: BubbleProps & { avatar: ReactNode }) {
  const content =
    typeof item.answer === "string" ? (
      <span dangerouslySetInnerHTML={{ __html: item.answer }} />
    ) : (
      item.answer
    );

  return (
    <>
      <AnimatePresence mode="popLayout" initial={false}>
        {open && (
          <motion.div
            key="answer"
            data-slot="faq-answer"
            layout="position"
            layoutDependency={openId}
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.92,
              transition: reduced ? INSTANT : LEAVE,
            }}
            transition={reduced ? INSTANT : SEND}
            style={{ originX: 1, originY: 1 }}
            className="flex items-end justify-end gap-2.5 my-1"
          >
            <div
              id={ids.answer}
              role="region"
              aria-labelledby={ids.question}
              className="max-w-[88%] sm:max-w-[82%] rounded-[18px] rounded-br-[6px] bg-[var(--faq-accent,var(--k-ink))] px-4.5 py-3 text-[15px] leading-[1.55] tracking-[-0.01em] text-[var(--faq-accent-foreground,var(--k-on-ink))] shadow-sm [&_a]:text-current [&_a]:underline [&_a]:underline-offset-2 [&_a]:font-medium hover:[&_a]:opacity-80 [&_code]:font-mono [&_code]:text-[13px] [&_code]:bg-white/20 dark:[&_code]:bg-black/30 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded"
            >
              {content}
            </div>
            {avatar != null && (
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--k-line)] bg-[var(--k-paper)] shadow-sm mb-0.5"
              >
                {avatar}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* SSR fallback and SEO crawlable content: always in initial HTML */}
      <div
        id={`${ids.answer}-seo`}
        className={open ? "hidden" : "sr-only"}
        aria-hidden={open ? "true" : undefined}
      >
        {content}
      </div>
    </>
  );
}

export type FaqProps = Omit<ComponentProps<"div">, "defaultValue"> & {
  items: FaqItem[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  accent?: string;
  avatar?: ReactNode;
};

export function Faq({
  items,
  value,
  defaultValue = "what-is-kuchi",
  onValueChange,
  accent = "var(--k-ink)",
  avatar = <KuchiAvatar />,
  className,
  style,
  ...props
}: FaqProps) {
  const reduced = useReducedMotion() ?? false;
  const uid = useId();
  const [own, setOwn] = useState(defaultValue);
  const openId = value === undefined ? own : value;

  const toggle = (id: string) => {
    const next = openId === id ? null : id;
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = KEY_STEPS[event.key];
    const target = event.target as HTMLElement;
    if (!step || !target.matches(QUESTION)) return;

    const questions = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(QUESTION),
    ];
    const next = step(questions.indexOf(target), questions.length - 1);
    event.preventDefault();
    questions[(next + questions.length) % questions.length]?.focus();
  };

  return (
    <div
      data-slot="faq"
      onKeyDown={onKeyDown}
      style={{ "--faq-accent": accent, ...style } as CSSProperties}
      className={cn("relative flex w-full max-w-2xl mx-auto flex-col gap-3.5", className)}
      {...props}
    >
      {items.map((item) => {
        const bubble = {
          item,
          ids: {
            question: `${uid}-${item.id}-question`,
            answer: `${uid}-${item.id}-answer`,
          },
          open: openId === item.id,
          openId,
          reduced,
        };

        return (
          <Fragment key={item.id}>
            <Question {...bubble} onToggle={() => toggle(item.id)} />
            <Answer {...bubble} avatar={avatar} />
          </Fragment>
        );
      })}
    </div>
  );
}

export default Faq;
