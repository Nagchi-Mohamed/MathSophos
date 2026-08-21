"use client";

import React from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// MathSophos custom SVG icon — Σ∞ (Sigma + Infinity) monogram
// Deep navy-violet gradient bg, white/pearl symbol with golden glow.
// Completely distinct from Gemini star logo.
// ─────────────────────────────────────────────────────────────────────────────

interface MathSophosIconProps {
  className?: string;
  size?: number;
}

export function MathSophosIcon({ className, size = 40 }: MathSophosIconProps) {
  const id = React.useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-label="MathSophos logo"
    >
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F0A2E" />
          <stop offset="55%" stopColor="#1E1060" />
          <stop offset="100%" stopColor="#3D1F8C" />
        </linearGradient>
        <linearGradient id={`sym-${id}`} x1="8" y1="12" x2="32" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EDE0C4" />
        </linearGradient>
        <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feColorMatrix
            type="matrix"
            values="1 0.8 0 0 0.4  0.8 0.6 0 0 0.2  0 0 0 0 0  0 0 0 0.7 0"
            in="blur"
            result="coloredBlur"
          />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`clip-${id}`}>
          <rect width="40" height="40" rx="10" ry="10" />
        </clipPath>
      </defs>

      {/* Background rounded square */}
      <rect width="40" height="40" rx="10" ry="10" fill={`url(#bg-${id})`} />
      {/* Subtle inner border highlight */}
      <rect
        x="0.5" y="0.5" width="39" height="39" rx="9.5" ry="9.5"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />

      {/* ── Σ∞ monogram ──────────────────────────────── */}
      <g clipPath={`url(#clip-${id})`} filter={`url(#glow-${id})`}>
        {/* Σ (Sigma) — left side */}
        <line x1="8.5" y1="10.5" x2="20.5" y2="10.5" stroke={`url(#sym-${id})`} strokeWidth="2.2" strokeLinecap="round" />
        <line x1="8.5" y1="29.5" x2="20.5" y2="29.5" stroke={`url(#sym-${id})`} strokeWidth="2.2" strokeLinecap="round" />
        <line x1="8.5" y1="10.5" x2="18" y2="20" stroke={`url(#sym-${id})`} strokeWidth="2.2" strokeLinecap="round" />
        <line x1="8.5" y1="29.5" x2="18" y2="20" stroke={`url(#sym-${id})`} strokeWidth="2.2" strokeLinecap="round" />

        {/* ∞ (Infinity) — right side, left lobe */}
        <path
          d="M18 20 C17 16.5 20 13 23.5 14.5 C27 16 28.5 19 27 21.5 C25.5 24 21 24.5 18 20Z"
          stroke={`url(#sym-${id})`}
          strokeWidth="2.1"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* ∞ (Infinity) — right side, right lobe */}
        <path
          d="M18 20 C19 23.5 22 27 25.5 25.5 C29 24 31 21 29.5 18.5 C28 16 23.5 15.5 18 20Z"
          stroke={`url(#sym-${id})`}
          strokeWidth="2.1"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.88"
        />
      </g>
    </svg>
  );
}

// ── Badge variant ─────────────────────────────────────────────────────────
interface MathSophosAiBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
}

export function MathSophosAiBadge({
  className,
  size = "md",
  animate = true,
}: MathSophosAiBadgeProps) {
  const iconSize = { sm: 24, md: 32, lg: 40, xl: 52 }[size];
  const wrapSize = {
    sm: "w-7 h-7 rounded-lg",
    md: "w-9 h-9 rounded-xl",
    lg: "w-11 h-11 rounded-2xl",
    xl: "w-14 h-14 rounded-2xl",
  }[size];

  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 group transition-transform duration-200 hover:scale-105",
        wrapSize,
        className
      )}
    >
      <MathSophosIcon size={iconSize} />
      {animate && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400 border border-white/40" />
        </span>
      )}
    </div>
  );
}

// ── Full logo lockup: icon + wordmark ─────────────────────────────────────
export function MathSophosLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <MathSophosAiBadge size="md" animate={false} />
      <span className="notranslate font-black text-xl tracking-tight text-blue-500 dark:text-blue-400">
        Math<span className="text-foreground">Sophos</span>
      </span>
    </div>
  );
}

// ── Circle variant (auth forms) ───────────────────────────────────────────
export function MathSophosCircleLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full shadow-lg overflow-hidden",
        className
      )}
      style={{
        background:
          "linear-gradient(135deg, #0F0A2E 0%, #1E1060 55%, #3D1F8C 100%)",
        boxShadow:
          "0 4px 20px rgba(61,31,140,0.45), 0 0 0 2px rgba(255,255,255,0.08)",
      }}
    >
      <MathSophosIcon size={38} />
    </div>
  );
}
