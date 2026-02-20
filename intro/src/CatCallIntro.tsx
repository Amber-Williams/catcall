import React from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ── Parchment palette (catcall's #justparchment8) ─────────────────────────────
const P = {
  bg:       "#0d0c09",   // terminal black (warmer than pure black)
  darkest:  "#292418",
  darker:   "#524839",
  mid:      "#8b7d62",
  warm:     "#a48d6a",
  light:    "#cdba94",
  lightest: "#e6ceac",
};

// ── Font ──────────────────────────────────────────────────────────────────────
const fontHandle = delayRender("Loading fonts");
Promise.all([
  new FontFace("Space Mono", `url(${staticFile("SpaceMono-400.woff2")})`, { weight: "400" }).load(),
  new FontFace("Space Mono", `url(${staticFile("SpaceMono-700.woff2")})`, { weight: "700" }).load(),
]).then(([f400, f700]) => {
  document.fonts.add(f400);
  document.fonts.add(f700);
  continueRender(fontHandle);
});

// ── Scanline overlay ──────────────────────────────────────────────────────────
const Scanlines: React.FC = () => (
  <div
    style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)",
      zIndex: 20,
    }}
  />
);

// ── Single screenshot slide ───────────────────────────────────────────────────
const Shot: React.FC<{ src: string; opacity: number; cmd: string }> = ({ src, opacity, cmd }) => (
  <div style={{ position: "absolute", inset: 0, opacity }}>
    <Img
      src={src}
      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
    />
    {/* Command label */}
    <div
      style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "14px 32px",
        background: `linear-gradient(transparent, ${P.bg}ee)`,
        fontFamily: "'Space Mono', monospace",
        fontSize: 22,
        color: P.light,
      }}
    >
      <span style={{ color: P.warm }}>$</span> {cmd}
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export const CatCallIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Crossfade helpers — each shot occupies a time window; fade in/out over 12 frames
  const fade = (start: number, end: number) =>
    interpolate(frame, [start, start + 12, end - 12, end], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  // Overall fade-in from black and fade-out to black
  const masterOpacity = interpolate(
    frame,
    [0, 10, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Title block — visible 0-50 and 100-end
  const titleOpacity = interpolate(
    frame,
    [5, 20, 44, 54, 96, 110],
    [0, 1, 1, 0, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Pip install line — fades in after frame 110
  const installOpacity = interpolate(frame, [115, 130], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: P.bg, opacity: masterOpacity }}>

      {/* ── Screenshots ────────────────────────────────────────────────────── */}
      <Shot src={staticFile("screenshot-simple.png")}  opacity={fade(10, 60)}  cmd="catcall" />
      <Shot src={staticFile("screenshot-blep.png")}    opacity={fade(55, 105)} cmd="catcall -w 100 -H 100 blep" />
      <Shot src={staticFile("screenshot-zoomies.png")} opacity={fade(100, 150)} cmd="catcall -w 100 -H 100 zoomies" />

      {/* ── Scanlines ──────────────────────────────────────────────────────── */}
      <Scanlines />

      {/* ── Title block ────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          opacity: titleOpacity, pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: `${P.bg}cc`,
            backdropFilter: "blur(2px)",
            padding: "36px 64px 40px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 96,
              fontWeight: 700,
              color: P.lightest,
              letterSpacing: -2,
              lineHeight: 1,
              textShadow: `0 0 40px ${P.warm}88`,
            }}
          >
            catcall
          </div>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 20,
              color: P.mid,
              marginTop: 16,
              letterSpacing: 1,
            }}
          >
            display random cats in your terminal
          </div>
        </div>
      </div>

      {/* ── Repo details (end card) ─────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          opacity: installOpacity, pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: `${P.bg}dd`,
            backdropFilter: "blur(2px)",
            padding: "40px 72px",
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 88, fontWeight: 700, color: P.lightest, letterSpacing: -2 }}>
            catcall
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, color: P.mid, marginTop: 12, marginBottom: 32 }}>
            display random cats in your terminal
          </div>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 26,
              color: P.warm,
              background: P.darkest,
              padding: "14px 32px",
              letterSpacing: 1,
            }}
          >
            <span style={{ color: P.mid }}>$</span> pip install catcall
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, color: P.darker, marginTop: 24, letterSpacing: 2 }}>
            github.com/Amber-Williams/catcall
          </div>
        </div>
      </div>

    </AbsoluteFill>
  );
};
