"use client";

import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CometCardProps {
  children: React.ReactNode;
  className?: string;
  /** Degrees of max tilt rotation (default 15) */
  tiltDegrees?: number;
  /** Spring stiffness for tilt animation (default 300) */
  stiffness?: number;
  /** Spring damping for tilt animation (default 30) */
  damping?: number;
}

// ─── CometCard ────────────────────────────────────────────────────────────────
// A perspective 3‑D tilt card inspired by Perplexity Comet's website.
// Based on Aceternity UI's @aceternity/comet-card.

export function CometCard({
  children,
  className,
  tiltDegrees = 15,
  stiffness = 300,
  damping = 30,
}: CometCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const xSpring = useSpring(x, { stiffness, damping });
  const ySpring = useSpring(y, { stiffness, damping });

  const rotateX = useTransform(
    ySpring,
    [-0.5, 0.5],
    [`${tiltDegrees}deg`, `-${tiltDegrees}deg`]
  );
  const rotateY = useTransform(
    xSpring,
    [-0.5, 0.5],
    [`-${tiltDegrees}deg`, `${tiltDegrees}deg`]
  );

  // Gradient highlight that follows the cursor
  const glowX = useTransform(xSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glowY = useTransform(ySpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Touch support for mobile
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!ref.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = ref.current.getBoundingClientRect();
    x.set((touch.clientX - rect.left) / rect.width - 0.5);
    y.set((touch.clientY - rect.top) / rect.height - 0.5);
  };

  const handleTouchEnd = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: "1200px",
      }}
      className={cn("relative cursor-pointer", className)}
    >
      {/* Animated glow overlay */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at ${glowX} ${glowY}, rgba(255,255,255,0.12) 0%, transparent 60%)`,
        }}
      />

      {children}
    </motion.div>
  );
}

// ─── CometCardGlow ────────────────────────────────────────────────────────────
// Optional inner glow layer — place as first child inside CometCard for the
// subtle shimmer that tracks the cursor.

export function CometCardGlow({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        "bg-gradient-to-br from-white/10 via-transparent to-transparent",
        className
      )}
    />
  );
}
