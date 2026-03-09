"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { CometCard } from "@/components/ui/comet-card";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserCometCardProps {
  /** Display name or username */
  name: string;
  /** Optional tagline / bio */
  bio?: string | null;
  /** Avatar URL */
  avatarUrl?: string | null;
  /** Number of collections */
  collectionsCount?: number;
  /** Number of items */
  itemsCount?: number;
  /** User ID for unique seeding (falls back to name) */
  userId?: string;
  /** Kept for API compat but ignored – colors are generated per user */
  accentColor?: string;
  className?: string;
  onClick?: () => void;
}

// ─── Seeded PRNG (FNV-1a) ────────────────────────────────────────────────────

function seededRng(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(h ^ seed.charCodeAt(i), 16777619)) >>> 0;
  }
  return () => {
    h = (Math.imul(h ^ (h >>> 17), 0xbf324c81)) >>> 0;
    h = (Math.imul(h ^ (h >>> 11), 0x9a812ca1)) >>> 0;
    h ^= h >>> 15;
    return (h >>> 0) / 0xffffffff;
  };
}

// ─── Per-User Theme ───────────────────────────────────────────────────────────

interface CardTheme {
  bgHue: number;
  bgSat: number;
  bgLight: number;
  goldHue: number;
  goldSat: number;
  goldLight: number;
}

function getTheme(seed: string): CardTheme {
  const rng = seededRng(seed + "||theme_v2");
  const bgHues = [210, 220, 235, 245, 258, 200, 230, 195, 265];
  return {
    bgHue: bgHues[Math.floor(rng() * bgHues.length)],
    bgSat: 35 + rng() * 45,
    bgLight: 4 + rng() * 7,
    goldHue: 20 + rng() * 30,   // 20-50: deep orange → amber → gold
    goldSat: 72 + rng() * 23,
    goldLight: 46 + rng() * 18,
  };
}

interface ThemeColors {
  bg: string;
  bgDeep: string;
  gold: string;
  goldBright: string;
  goldDim: string;
  goldAlpha: (a: number) => string;
}

function themeToColors(t: CardTheme): ThemeColors {
  const gold = `hsl(${t.goldHue.toFixed(1)},${t.goldSat.toFixed(1)}%,${t.goldLight.toFixed(1)}%)`;
  const goldBright = `hsl(${t.goldHue.toFixed(1)},${t.goldSat.toFixed(1)}%,${Math.min(88, t.goldLight + 22).toFixed(1)}%)`;
  const goldDim = `hsl(${t.goldHue.toFixed(1)},${(t.goldSat - 22).toFixed(1)}%,${(t.goldLight - 16).toFixed(1)}%)`;
  return {
    bg: `hsl(${t.bgHue},${t.bgSat.toFixed(1)}%,${t.bgLight.toFixed(1)}%)`,
    bgDeep: `hsl(${t.bgHue},${(t.bgSat + 15).toFixed(1)}%,${(t.bgLight * 0.45).toFixed(1)}%)`,
    gold,
    goldBright,
    goldDim,
    goldAlpha: (a: number) =>
      `hsla(${t.goldHue.toFixed(1)},${t.goldSat.toFixed(1)}%,${t.goldLight.toFixed(1)}%,${a})`,
  };
}

// ─── Canvas Particle Renderer ─────────────────────────────────────────────────

function drawParticles(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  seed: string,
  theme: CardTheme
) {
  const rng = seededRng(seed + "||particles_v2");
  const { bg, bgDeep, goldAlpha } = themeToColors(theme);

  ctx.clearRect(0, 0, W, H);

  // Deep space background gradient
  const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.32, 0, W * 0.5, H * 0.55, W * 1.1);
  bgGrad.addColorStop(0, bg);
  bgGrad.addColorStop(1, bgDeep);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Nebula glow layers (3 overlapping blobs)
  const nebulae: [number, number, number, number][] = [
    [W * 0.5, H * 0.3, W * 0.55, 0.13],
    [W * 0.32, H * 0.52, W * 0.38, 0.08],
    [W * 0.68, H * 0.58, W * 0.32, 0.07],
  ];
  for (const [cx, cy, r, alpha] of nebulae) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, goldAlpha(alpha));
    g.addColorStop(0.55, goldAlpha(alpha * 0.4));
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Particles ──────────────────────────────────────────────────────────────
  const TOTAL = 280;
  for (let i = 0; i < TOTAL; i++) {
    // Polar distribution biased toward center-top
    const angle = rng() * Math.PI * 2;
    const t = rng();
    const dist = Math.sqrt(t) * W * 0.68;
    const cx = W * 0.5 + Math.cos(angle) * dist;
    const cy = H * 0.36 + Math.sin(angle) * dist * (H / W);

    const isBig = rng() < 0.07;
    const size = isBig ? 1.8 + rng() * 2.8 : 0.4 + rng() * 1.3;
    const bright = 0.45 + rng() * 0.55;
    const isWhite = rng() < 0.22;

    if (isBig) {
      // Glowing star with radial gradient
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 5);
      glow.addColorStop(0, `rgba(255,255,255,${bright})`);
      glow.addColorStop(0.12, isWhite ? `rgba(255,248,230,${bright * 0.9})` : goldAlpha(bright * 0.7));
      glow.addColorStop(0.5, goldAlpha(bright * 0.2));
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 5, 0, Math.PI * 2);
      ctx.fill();
      // Bright core
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, bright + 0.2)})`;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = isWhite
        ? `rgba(255,255,255,${bright})`
        : goldAlpha(bright);
      ctx.beginPath();
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ─── Avatar Fallback ──────────────────────────────────────────────────────────

function AvatarFallback({ name, gold }: { name: string; gold: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-full text-2xl font-bold text-white"
      style={{
        background: `radial-gradient(circle at 35% 35%, ${gold}, #4a1f00)`,
      }}
    >
      {initials}
    </div>
  );
}

// ─── Corner Ornament ──────────────────────────────────────────────────────────

function CornerOrnament({
  pos,
  color,
}: {
  pos: "tl" | "tr" | "bl" | "br";
  color: string;
}) {
  const isRight = pos === "tr" || pos === "br";
  const isBottom = pos === "bl" || pos === "br";
  const rotDeg = isRight ? (isBottom ? 180 : 90) : isBottom ? 270 : 0;
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        top: isBottom ? undefined : 5,
        bottom: isBottom ? 5 : undefined,
        left: isRight ? undefined : 5,
        right: isRight ? 5 : undefined,
        width: 30,
        height: 30,
        transform: `rotate(${rotDeg}deg)`,
      }}
    >
      <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer L bracket */}
        <path d="M1 1 L13 1 L13 3.5 L3.5 3.5 L3.5 13 L1 13 Z" fill={color} opacity="0.95" />
        {/* Inner L */}
        <path d="M1 1 L7 1 L7 2.5 L2.5 2.5 L2.5 7 L1 7 Z" fill={color} />
        {/* Dot accent */}
        <circle cx="14.5" cy="14.5" r="1.8" fill={color} opacity="0.65" />
      </svg>
    </div>
  );
}

// ─── UserCometCard ────────────────────────────────────────────────────────────

export function UserCometCard({
  name,
  bio,
  avatarUrl,
  collectionsCount = 0,
  itemsCount = 0,
  userId,
  className,
  onClick,
}: UserCometCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seed = (userId || name) + name; // combine both for uniqueness
  const theme = useMemo(() => getTheme(seed), [seed]);
  const colors = useMemo(() => themeToColors(theme), [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawParticles(ctx, canvas.width, canvas.height, seed, theme);
  }, [seed, theme]);

  return (
    <CometCard
      className={cn("group", className)}
      tiltDegrees={20}
      stiffness={180}
      damping={20}
    >
      {/* Gold gradient border wrapper */}
      <div
        style={{
          background: `linear-gradient(145deg,
            ${colors.goldBright} 0%,
            ${colors.goldDim} 25%,
            ${colors.gold} 50%,
            ${colors.goldDim} 75%,
            ${colors.goldBright} 100%)`,
          padding: "3px",
          borderRadius: "16px",
          boxShadow: `0 0 28px ${colors.goldAlpha(0.35)}, 0 0 60px ${colors.goldAlpha(0.18)}, 0 8px 32px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Card body */}
        <div
          onClick={onClick}
          style={{ borderRadius: "13px", background: "#000508", position: "relative" }}
          className={cn("overflow-hidden", onClick && "cursor-pointer")}
        >
          {/* Canvas stars/particles background */}
          <canvas
            ref={canvasRef}
            width={280}
            height={400}
            className="absolute inset-0 w-full h-full"
            style={{ display: "block" }}
          />

          {/* Content layer */}
          <div
            className="relative z-10 flex flex-col items-center"
            style={{ padding: "18px 14px 14px", minHeight: 400 }}
          >
            {/* Brand label */}
            <p
              className="text-[8.5px] font-black tracking-[0.28em] mb-5"
              style={{
                color: colors.gold,
                textShadow: `0 0 10px ${colors.goldAlpha(0.9)}, 0 0 20px ${colors.goldAlpha(0.5)}`,
              }}
            >
              COLLECTORSSPHERE
            </p>

            {/* Avatar with ornate ring */}
            <div className="relative mb-4" style={{ width: 96, height: 96 }}>
              {/* Outer halo */}
              <div
                className="absolute rounded-full pointer-events-none"
                style={{
                  inset: -18,
                  background: `radial-gradient(circle, ${colors.goldAlpha(0.22)} 0%, transparent 65%)`,
                }}
              />
              {/* Conic gradient ring */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(
                    ${colors.goldBright} 0deg,
                    ${colors.goldDim}   55deg,
                    ${colors.gold}      110deg,
                    ${colors.goldBright} 175deg,
                    ${colors.goldDim}   235deg,
                    ${colors.gold}      295deg,
                    ${colors.goldBright} 360deg
                  )`,
                  padding: "3px",
                }}
              >
                <div
                  className="w-full h-full rounded-full overflow-hidden"
                  style={{ background: "#08080f" }}
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AvatarFallback name={name} gold={colors.gold} />
                  )}
                </div>
              </div>
              {/* Ring glow */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  boxShadow: `0 0 14px ${colors.goldAlpha(0.65)}, inset 0 0 6px ${colors.goldAlpha(0.15)}`,
                }}
              />
            </div>

            {/* Name */}
            <p
              className="text-lg font-bold text-white text-center leading-tight"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}
            >
              {name}
            </p>
            {bio && (
              <p
                className="text-[11px] text-center mt-1"
                style={{ color: colors.goldAlpha(0.7) }}
              >
                {bio}
              </p>
            )}

            {/* Divider */}
            <div
              className="w-full mt-4 mb-3"
              style={{
                height: 1,
                background: `linear-gradient(90deg, transparent, ${colors.goldAlpha(0.55)}, transparent)`,
              }}
            />

            {/* Stats */}
            <div className="flex gap-2 w-full justify-center">
              {[
                { val: collectionsCount, label: "Sammlungen" },
                { val: itemsCount, label: "Items" },
              ].map(({ val, label }) => (
                <div
                  key={label}
                  className="flex-1 flex flex-col items-center py-2 px-2 rounded-xl"
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    border: `1px solid ${colors.goldAlpha(0.28)}`,
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <span
                    className="text-xl font-bold text-white"
                    style={{ textShadow: `0 0 12px ${colors.goldAlpha(0.6)}` }}
                  >
                    {val.toLocaleString("de-DE")}
                  </span>
                  <span
                    className="text-[10px] mt-0.5"
                    style={{ color: colors.goldAlpha(0.65) }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer badge */}
            <p
              className="text-[7.5px] font-semibold tracking-[0.22em] mt-3"
              style={{ color: colors.goldAlpha(0.45) }}
            >
              COLLECTOR&apos;S IDENTITY CARD
            </p>
          </div>

          {/* Corner ornaments */}
          <CornerOrnament pos="tl" color={colors.gold} />
          <CornerOrnament pos="tr" color={colors.gold} />
          <CornerOrnament pos="bl" color={colors.gold} />
          <CornerOrnament pos="br" color={colors.gold} />
        </div>
      </div>
    </CometCard>
  );
}

// ─── UserCometCardGrid ────────────────────────────────────────────────────────

export function UserCometCardGrid({
  users,
  className,
}: {
  users: UserCometCardProps[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {users.map((user, index) => (
        <UserCometCard key={user.userId ?? user.name + index} {...user} />
      ))}
    </div>
  );
}
