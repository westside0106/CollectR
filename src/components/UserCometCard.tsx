"use client";

import React from "react";
import { CometCard, CometCardGlow } from "@/components/ui/comet-card";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserCometCardProps {
  /** Display name or username */
  name: string;
  /** Optional tagline / bio */
  bio?: string | null;
  /** Avatar URL */
  avatarUrl?: string | null;
  /** Number of collections this user owns */
  collectionsCount?: number;
  /** Number of items across all collections */
  itemsCount?: number;
  /** Accent colour override (CSS colour string) */
  accentColor?: string;
  className?: string;
  onClick?: () => void;
}

// ─── Avatar Fallback ──────────────────────────────────────────────────────────

function AvatarFallback({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-full text-lg font-semibold text-white"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

// ─── UserCometCard ────────────────────────────────────────────────────────────
// Individual 3‑D user card built on Aceternity UI's CometCard component.
// Works on both mobile (touch) and desktop (mouse).

export function UserCometCard({
  name,
  bio,
  avatarUrl,
  collectionsCount = 0,
  itemsCount = 0,
  accentColor = "#5227FF",
  className,
  onClick,
}: UserCometCardProps) {
  return (
    <CometCard
      className={cn("group", className)}
      tiltDegrees={12}
      stiffness={280}
      damping={28}
    >
      {/* Card shell */}
      <div
        onClick={onClick}
        className={cn(
          // Layout
          "relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl p-6",
          // Background + border
          "bg-white/5 dark:bg-slate-900/80",
          "border border-white/10 dark:border-slate-700/60",
          // Backdrop blur
          "backdrop-blur-md",
          // Shadow
          "shadow-xl shadow-black/20",
          // Hover
          "transition-shadow duration-300 hover:shadow-2xl hover:shadow-black/30",
          // Cursor
          onClick && "cursor-pointer"
        )}
      >
        {/* Subtle glow from top‑left */}
        <CometCardGlow />

        {/* Gradient stripe along the top edge */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl opacity-70"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          }}
        />

        {/* Avatar */}
        <div
          className="relative h-20 w-20 shrink-0 rounded-full p-0.5 sm:h-24 sm:w-24"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, transparent)`,
          }}
        >
          <div className="h-full w-full overflow-hidden rounded-full bg-slate-800">
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarUrl}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <AvatarFallback name={name} color={accentColor} />
            )}
          </div>
        </div>

        {/* Name + bio */}
        <div className="z-10 text-center">
          <p className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
            {name}
          </p>
          {bio && (
            <p className="mt-1 line-clamp-2 max-w-[220px] text-xs text-gray-500 dark:text-slate-400 sm:text-sm">
              {bio}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="z-10 flex w-full divide-x divide-white/10 rounded-xl border border-white/10 bg-white/5 dark:bg-slate-800/50">
          <Stat label="Sammlungen" value={collectionsCount} />
          <Stat label="Items" value={itemsCount} />
        </div>
      </div>
    </CometCard>
  );
}

// ─── Stat ─────────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 py-3">
      <span className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">
        {value.toLocaleString("de-DE")}
      </span>
      <span className="text-[10px] text-gray-500 dark:text-slate-400 sm:text-xs">
        {label}
      </span>
    </div>
  );
}

// ─── UserCometCardGrid ────────────────────────────────────────────────────────
// Convenience wrapper: renders a responsive grid of UserCometCards.

export function UserCometCardGrid({
  users,
  className,
}: {
  users: UserCometCardProps[];
  className?: string;
}) {
  // Cycle through a small palette so every card looks distinct
  const ACCENT_COLORS = [
    "#5227FF",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {users.map((user, index) => (
        <UserCometCard
          key={user.name + index}
          {...user}
          accentColor={
            user.accentColor ?? ACCENT_COLORS[index % ACCENT_COLORS.length]
          }
        />
      ))}
    </div>
  );
}
