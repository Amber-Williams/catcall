import React, { useMemo } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ── Palette ───────────────────────────────────────────────────────────────────
const GREEN = "#76B900";
const GREEN_DIM = "rgba(118,185,0,0.55)";
const GREEN_GLOW = "rgba(118,185,0,0.25)";
const BG = "#ffffff";

const KNEWAVE = "Knewave";

// Load Knewave from the bundled public/ asset so it works without network access.
const fontHandle = delayRender("Loading Knewave font");
const knewave = new FontFace(
  KNEWAVE,
  `url(${staticFile("Knewave.woff2")}) format("woff2")`
);
knewave.load().then((face) => {
  document.fonts.add(face);
  continueRender(fontHandle);
});

// ── Noise texture ─────────────────────────────────────────────────────────────
const Noise: React.FC = () => (
  <svg
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.045 }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <filter id="n">
      <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#n)" />
  </svg>
);

// ── Matrix column ─────────────────────────────────────────────────────────────
const GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ01234567890!@#$%&";

const MatrixColumn: React.FC<{ x: number; seed: number; speed: number; frame: number }> = ({
  x,
  seed,
  speed,
  frame,
}) => {
  const chars = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) =>
        GLYPHS[Math.floor(Math.abs(Math.sin(seed * 997 + i * 137)) * GLYPHS.length)]
      ),
    [seed]
  );

  const yOffset = ((frame * speed) % (1080 + 560)) - 560;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: yOffset,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        fontFamily: "monospace",
        fontSize: 15,
        lineHeight: "20px",
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      {chars.map((_, i) => {
        const charIdx = Math.floor(
          Math.abs(Math.sin(seed * 13 + i * 7 + frame * 0.07)) * GLYPHS.length
        );
        const isHead = i === chars.length - 1;
        return (
          <span
            key={i}
            style={{
              color: isHead ? "#fff" : GREEN,
              opacity: isHead ? 1 : Math.max(0.05, 1 - i * 0.045),
              textShadow: isHead ? `0 0 10px ${GREEN}, 0 0 20px ${GREEN}` : "none",
            }}
          >
            {GLYPHS[charIdx]}
          </span>
        );
      })}
    </div>
  );
};

// ── Corner bracket ────────────────────────────────────────────────────────────
const CornerBracket: React.FC<{
  corner: "tl" | "tr" | "bl" | "br";
  progress: number;
  size?: number;
  thickness?: number;
  margin?: number;
}> = ({ corner, progress, size = 48, thickness = 3, margin = 36 }) => {
  const s = size * progress;
  const style: React.CSSProperties = {
    position: "absolute",
    width: s,
    height: s,
    opacity: progress,
    borderColor: GREEN,
    borderStyle: "solid",
    borderWidth: 0,
    ...(corner === "tl" && {
      top: margin, left: margin,
      borderTopWidth: thickness, borderLeftWidth: thickness,
    }),
    ...(corner === "tr" && {
      top: margin, right: margin,
      borderTopWidth: thickness, borderRightWidth: thickness,
    }),
    ...(corner === "bl" && {
      bottom: margin, left: margin,
      borderBottomWidth: thickness, borderLeftWidth: thickness,
    }),
    ...(corner === "br" && {
      bottom: margin, right: margin,
      borderBottomWidth: thickness, borderRightWidth: thickness,
    }),
  };
  return <div style={style} />;
};

// ── Floating particle ─────────────────────────────────────────────────────────
const Particle: React.FC<{
  x: number;
  y: number;
  size: number;
  shape: "tri" | "hex";
  frame: number;
  delay: number;
  rotSpeed: number;
  floatAmp: number;
  floatFreq: number;
}> = ({ x, y, size, shape, frame, delay, rotSpeed, floatAmp, floatFreq }) => {
  const f = frame - delay;
  if (f < 0) return null;

  const opacity = interpolate(f, [0, 12], [0, 0.55], { extrapolateRight: "clamp" });
  const floatY = Math.sin(f * floatFreq) * floatAmp;
  const rot = f * rotSpeed;

  const triPath = `M${size / 2},0 L${size},${size * 0.87} L0,${size * 0.87} Z`;
  const hexPath = `M${size * 0.5},0 L${size},${size * 0.25} L${size},${size * 0.75} L${size * 0.5},${size} L0,${size * 0.75} L0,${size * 0.25} Z`;

  return (
    <svg
      style={{
        position: "absolute",
        left: x,
        top: y + floatY,
        transform: `rotate(${rot}deg)`,
        opacity,
        overflow: "visible",
      }}
      width={size}
      height={size}
    >
      <path d={shape === "tri" ? triPath : hexPath} fill="none" stroke={GREEN} strokeWidth="1.5" />
    </svg>
  );
};

// ── HUD line item ─────────────────────────────────────────────────────────────
const HudRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: "flex", gap: 20, marginBottom: 12, fontFamily: "monospace", fontSize: 14 }}>
    <span style={{ color: GREEN, minWidth: 90, letterSpacing: 1 }}>{label}</span>
    <span style={{ color: "rgba(255,255,255,0.72)", letterSpacing: 0.5 }}>{value}</span>
  </div>
);

// ── Main composition ──────────────────────────────────────────────────────────
export const CatCallIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Title pop-in (scale 3 → 1) ─────────────────────────────────────────────
  const titleScale = spring({ frame, fps, from: 3, to: 1, config: { damping: 14, stiffness: 230, mass: 0.9 } });
  const titleOpacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [18, 32], [0, 1], { extrapolateRight: "clamp" });

  // ── Cat entrance (frame 40, explosive spring) ───────────────────────────────
  const catSpring = spring({ frame: frame - 40, fps, from: 0, to: 1, config: { damping: 5, stiffness: 520, mass: 0.4 } });
  const catScale = interpolate(catSpring, [0, 1], [0, 1]);
  const catEnterX = interpolate(catSpring, [0, 1], [500, 0]);
  const catFloat = Math.sin(frame * 0.055) * 22;
  const catFloatX = Math.cos(frame * 0.038) * 8;

  // Glitch — 5 frames every 65 frames after frame 55
  const glitchCycle = frame % 65;
  const glitching = frame > 55 && glitchCycle < 5;
  const glitchSkew = glitching ? Math.sin(glitchCycle * 40) * 7 : 0;
  const glitchHue = glitching ? glitchCycle * 60 : 0;
  const glitchSlip = glitching ? Math.round(Math.sin(glitchCycle * 25) * 8) : 0;

  // ── HUD panel slide in from frame 28 ───────────────────────────────────────
  const hudSpring = spring({ frame: frame - 28, fps, from: 0, to: 1, config: { damping: 20, stiffness: 130 } });
  const hudX = interpolate(hudSpring, [0, 1], [-660, 0]);

  // HUD text separate slide (slightly later)
  const textSpring = spring({ frame: frame - 46, fps, from: 0, to: 1, config: { damping: 22, stiffness: 110 } });
  const textSlide = interpolate(textSpring, [0, 1], [-600, 0]);
  const textOpacity = interpolate(textSpring, [0, 1], [0, 1]);

  // ── Corner brackets ─────────────────────────────────────────────────────────
  const bracketProgress = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });

  // ── Scanner (vertical line sweeping left→right, loops every 90 frames) ─────
  const scanX = interpolate(frame % 90, [0, 90], [-4, 1924]);

  // ── Ring rotations ──────────────────────────────────────────────────────────
  const r1 = interpolate(frame, [0, 360], [0, 360], { extrapolateRight: "extend" });
  const r2 = interpolate(frame, [0, 360], [0, -360], { extrapolateRight: "extend" });
  const r3 = interpolate(frame, [0, 360], [0, 200], { extrapolateRight: "extend" });

  // Cat position centre
  const CAT_CX = 1390;
  const CAT_CY = 510;

  // Matrix column configs
  const columns = useMemo(
    () =>
      [60, 170, 295, 430, 570, 720, 870, 1010, 1150, 1300, 1450, 1600, 1730, 1840].map(
        (x, i) => ({ x, seed: i + 1, speed: 2.5 + (i % 4) * 0.8 })
      ),
    []
  );

  // Particle configs
  const particles: Array<{
    x: number; y: number; size: number; shape: "tri" | "hex";
    delay: number; rotSpeed: number; floatAmp: number; floatFreq: number;
  }> = useMemo(
    () => [
      { x: 740, y: 180, size: 22, shape: "hex", delay: 12, rotSpeed: 0.6, floatAmp: 16, floatFreq: 0.06 },
      { x: 810, y: 340, size: 16, shape: "tri", delay: 28, rotSpeed: -0.9, floatAmp: 12, floatFreq: 0.05 },
      { x: 670, y: 680, size: 26, shape: "hex", delay: 18, rotSpeed: 0.4, floatAmp: 20, floatFreq: 0.04 },
      { x: 920, y: 820, size: 18, shape: "tri", delay: 38, rotSpeed: 1.1, floatAmp: 14, floatFreq: 0.07 },
      { x: 1120, y: 140, size: 20, shape: "tri", delay: 8,  rotSpeed: -0.7, floatAmp: 18, floatFreq: 0.05 },
      { x: 1240, y: 890, size: 24, shape: "hex", delay: 44, rotSpeed: 0.5, floatAmp: 10, floatFreq: 0.06 },
      { x: 195,  y: 290, size: 18, shape: "hex", delay: 22, rotSpeed: -0.8, floatAmp: 15, floatFreq: 0.045 },
      { x: 290,  y: 760, size: 20, shape: "tri", delay: 42, rotSpeed: 0.7, floatAmp: 19, floatFreq: 0.055 },
      { x: 1660, y: 360, size: 16, shape: "tri", delay: 32, rotSpeed: -0.5, floatAmp: 13, floatFreq: 0.065 },
      { x: 1720, y: 640, size: 22, shape: "hex", delay: 16, rotSpeed: 0.9, floatAmp: 17, floatFreq: 0.05 },
      { x: 500,  y: 920, size: 14, shape: "tri", delay: 50, rotSpeed: -1.0, floatAmp: 11, floatFreq: 0.07 },
      { x: 1490, y: 880, size: 20, shape: "hex", delay: 35, rotSpeed: 0.6, floatAmp: 16, floatFreq: 0.048 },
    ],
    []
  );

  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: "hidden" }}>

      {/* ── Noise texture ──────────────────────────────────────────────────── */}
      <Noise />

      {/* ── Radial vignette ────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 30%, rgba(0,0,0,0.07) 100%)",
        }}
      />

      {/* ── Matrix data streams ────────────────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.14, pointerEvents: "none" }}>
        {columns.map(({ x, seed, speed }) => (
          <MatrixColumn key={x} x={x} seed={seed} speed={speed} frame={frame} />
        ))}
      </div>

      {/* ── Tech rings (SVG, centered on cat) ──────────────────────────────── */}
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }} width={1920} height={1080}>
        {/* Outer tick marks */}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = ((i / 36) * 360 + r1) * (Math.PI / 180);
          return (
            <line
              key={i}
              x1={CAT_CX + Math.cos(angle) * 355}
              y1={CAT_CY + Math.sin(angle) * 355}
              x2={CAT_CX + Math.cos(angle) * 370}
              y2={CAT_CY + Math.sin(angle) * 370}
              stroke={GREEN} strokeWidth="1.5" opacity="0.38"
            />
          );
        })}

        {/* Ring 1 — inner, fast */}
        <circle cx={CAT_CX} cy={CAT_CY} r={220}
          fill="none" stroke={GREEN} strokeWidth="1.5"
          strokeDasharray="14 7"
          transform={`rotate(${r1}, ${CAT_CX}, ${CAT_CY})`}
          opacity="0.48"
        />
        {/* Ring 2 — mid, reverse */}
        <circle cx={CAT_CX} cy={CAT_CY} r={288}
          fill="none" stroke={GREEN} strokeWidth="1"
          strokeDasharray="4 22"
          transform={`rotate(${r2}, ${CAT_CX}, ${CAT_CY})`}
          opacity="0.28"
        />
        {/* Ring 3 — outer, slow */}
        <circle cx={CAT_CX} cy={CAT_CY} r={352}
          fill="none" stroke={GREEN} strokeWidth="2"
          strokeDasharray="28 6 4 6"
          transform={`rotate(${r3}, ${CAT_CX}, ${CAT_CY})`}
          opacity="0.22"
        />
        {/* Crosshair lines */}
        <line x1={CAT_CX - 380} y1={CAT_CY} x2={CAT_CX - 235} y2={CAT_CY}
          stroke={GREEN} strokeWidth="0.75" opacity="0.22" strokeDasharray="4 4" />
        <line x1={CAT_CX + 235} y1={CAT_CY} x2={CAT_CX + 380} y2={CAT_CY}
          stroke={GREEN} strokeWidth="0.75" opacity="0.22" strokeDasharray="4 4" />
        <line x1={CAT_CX} y1={CAT_CY - 380} x2={CAT_CX} y2={CAT_CY - 235}
          stroke={GREEN} strokeWidth="0.75" opacity="0.22" strokeDasharray="4 4" />
        <line x1={CAT_CX} y1={CAT_CY + 235} x2={CAT_CX} y2={CAT_CY + 380}
          stroke={GREEN} strokeWidth="0.75" opacity="0.22" strokeDasharray="4 4" />
      </svg>

      {/* ── Cat face ───────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: CAT_CX - 210 + catEnterX + catFloatX,
          top: CAT_CY - 210 + catFloat,
          width: 420,
          height: 420,
          borderRadius: "50%",
          overflow: "hidden",
          transform: `scale(${catScale}) skewX(${glitchSkew}deg)`,
          transformOrigin: "center center",
          filter: `drop-shadow(0 0 28px ${GREEN_DIM}) drop-shadow(0 0 60px ${GREEN_GLOW}) hue-rotate(${glitchHue}deg)`,
          willChange: "transform",
        }}
      >
        {/* Glitch colour slice */}
        {glitching && (
          <div
            style={{
              position: "absolute",
              top: 80, left: glitchSlip, right: 0, height: 60,
              overflow: "hidden", zIndex: 2, mixBlendMode: "screen",
            }}
          >
            <Img
              src={staticFile("cat.jpg")}
              style={{ width: 420, height: 420, objectFit: "cover", marginTop: -80, filter: "hue-rotate(120deg) saturate(2)" }}
            />
          </div>
        )}
        <Img
          src={staticFile("cat.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "contrast(1.18) brightness(1.04)",
          }}
        />
        {/* Rim glow overlay */}
        <div
          style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            boxShadow: `inset 0 0 40px ${GREEN}55`,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── Glassmorphism HUD panel ────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: 80 + hudX,
          top: "50%",
          transform: "translateY(-50%)",
          width: 590,
          background: "rgba(14, 30, 6, 0.86)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          clipPath: "polygon(0 0, calc(100% - 34px) 0, 100% 34px, 100% 100%, 34px 100%, 0 calc(100% - 34px))",
          padding: "42px 48px 42px 48px",
          border: `1px solid ${GREEN}44`,
          boxShadow: `0 0 80px ${GREEN}1a, inset 0 0 40px rgba(118,185,0,0.04)`,
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            width: "100%", height: 2, marginBottom: 26,
            background: `linear-gradient(90deg, ${GREEN}, ${GREEN}00)`,
            opacity: hudSpring,
          }}
        />

        {/* Text content */}
        <div style={{ transform: `translateX(${textSlide}px)`, opacity: textOpacity }}>

          <div
            style={{
              fontFamily: "monospace", fontSize: 11, letterSpacing: 4,
              color: GREEN, textTransform: "uppercase", marginBottom: 14, opacity: 0.65,
            }}
          >
            {"// system.init ────────────────"}
          </div>

          <div
            style={{
              fontFamily: "monospace", fontSize: 26, fontWeight: 700,
              color: "#fff", lineHeight: 1.35, marginBottom: 24,
              textShadow: `0 0 24px ${GREEN}55`,
            }}
          >
            Summons cats randomly<br />to your terminal.
          </div>

          <div style={{ width: "55%", height: 1, background: `${GREEN}33`, marginBottom: 24 }} />

          <HudRow label="SRC"    value="cataas.com" />
          <HudRow label="RENDER" value="#justparchment8 · half-block" />
          <HudRow label="FIT"    value="auto-fit to terminal size" />
          <HudRow label="TAGS"   value="blep · zoomies · void · loaf" />
          <HudRow label="LANG"   value="Python 3.8+" />

          <div style={{ width: "55%", height: 1, background: `${GREEN}22`, marginTop: 24, marginBottom: 20 }} />

          <div
            style={{
              fontFamily: "monospace", fontSize: 13,
              color: GREEN, letterSpacing: 2, opacity: 0.5,
            }}
          >
            pip install catcall
          </div>
        </div>

        {/* Version badge */}
        <div
          style={{
            position: "absolute", bottom: 18, right: 44,
            fontFamily: "monospace", fontSize: 10,
            color: GREEN, opacity: 0.35, letterSpacing: 2,
          }}
        >
          v1.0.0 · MIT
        </div>

        {/* Corner accent dots */}
        {[[8, 8], [8, "calc(100% - 8px)"], ["calc(100% - 8px)", 8]].map(([t, l], i) => (
          <div
            key={i}
            style={{
              position: "absolute", top: t as number, left: l as number,
              width: 4, height: 4, borderRadius: "50%",
              background: GREEN, opacity: 0.5,
            }}
          />
        ))}
      </div>

      {/* ── CatCall title ──────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute", top: "50%", left: "50%",
          transform: `translate(-50%, -52%) scale(${titleScale})`,
          opacity: titleOpacity,
          textAlign: "center",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontFamily: KNEWAVE,
            fontSize: 192,
            color: GREEN,
            lineHeight: 1,
            letterSpacing: -3,
            textShadow: `0 0 40px ${GREEN}99, 0 0 100px ${GREEN}44, 0 6px 0 rgba(0,0,0,0.12)`,
          }}
        >
          CatCall
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 20,
            color: "rgba(0,0,0,0.45)",
            letterSpacing: 8,
            textTransform: "uppercase",
            marginTop: 12,
            opacity: subtitleOpacity,
          }}
        >
          pip install catcall
        </div>
      </div>

      {/* ── Vertical scanner line ──────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute", top: 0, bottom: 0,
          left: scanX, width: 2,
          background: `linear-gradient(180deg, transparent 0%, ${GREEN}99 20%, ${GREEN} 50%, ${GREEN}99 80%, transparent 100%)`,
          boxShadow: `0 0 18px ${GREEN}, 0 0 40px ${GREEN}66`,
          opacity: 0.55,
          pointerEvents: "none",
        }}
      />

      {/* ── Corner brackets ─────────────────────────────────────────────────── */}
      {(["tl", "tr", "bl", "br"] as const).map((c) => (
        <CornerBracket key={c} corner={c} progress={bracketProgress} />
      ))}

      {/* ── Floating particles ──────────────────────────────────────────────── */}
      {particles.map((p, i) => (
        <Particle key={i} {...p} frame={frame} />
      ))}

    </AbsoluteFill>
  );
};
