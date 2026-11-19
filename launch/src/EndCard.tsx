import type React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { TitleSweep } from "@/components/kuchi/title-sweep";
import { C, FONT } from "./brand";
import { Caption } from "./Caption";

// The sweep's colour where the type sits is the colour it reads in. Both ends are
// the page, so a title arrives and leaves by the white passing over it. The last
// title parks around -6em, so the band from -11 to -3 is ink: the URL holds ink.
const STOPS = [
  { at: -17.6, color: C.paper },
  { at: -14, color: C.paper },
  { at: -10.5, color: C.ink },
  { at: -3, color: C.ink },
  { at: -1, color: C.popcorn },
  { at: 0, color: "#F5806A" },
  { at: 1, color: C.popcorn },
  { at: 3, color: C.ink },
  { at: 10.5, color: C.ink },
  { at: 14, color: C.paper },
  { at: 17.6, color: C.paper },
];

/** The popcorn arrives over the URL once the URL has settled. */
const MARK_IN = 88;
/** The call to action rises under the URL just after the mark. */
const CTA_IN = 100;

export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [MARK_IN, MARK_IN + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <TitleSweep
        titles={["Kuchi", "kuchi.kalarislabs.com"]}
        titleScale={[1.6, 1]}
        fontFamily={FONT}
        fontWeight={600}
        background={C.paper}
        stops={STOPS}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Img
          src={staticFile("popcorn.svg")}
          style={{
            width: 96,
            height: 96,
            marginTop: -260,
            opacity: p,
            transform: `translateY(${(1 - p) * 18}px) scale(${0.92 + 0.08 * p})`,
          }}
        />
      </AbsoluteFill>
      {/* The ask: one line telling the viewer what to do next. */}
      <Caption text="Add it to your agent and make yours. Free, no sign-in." top={640} delay={CTA_IN} size={46} color={C.muted} />
    </AbsoluteFill>
  );
};
