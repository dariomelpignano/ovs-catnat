// =============================================================================
// GlassCard Component
// Spatial Design - Liquid Glass Material
// =============================================================================

import { JSX, splitProps, mergeProps } from "solid-js";

export interface GlassCardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "subtle" | "light";
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

const paddingMap = {
  none: "0",
  sm: "var(--space-3)",
  md: "var(--space-5)",
  lg: "var(--space-6)",
  xl: "var(--space-8)",
};

const variantStyles = {
  default: {
    background: "var(--glass-bg)",
    backdropFilter: "blur(32px) saturate(180%)",
    WebkitBackdropFilter: "blur(32px) saturate(180%)",
    border: "1px solid var(--glass-border)",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--shadow-ambient), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
  },
  elevated: {
    background: "var(--glass-bg-elevated)",
    backdropFilter: "blur(48px) saturate(200%)",
    WebkitBackdropFilter: "blur(48px) saturate(200%)",
    border: "1px solid var(--glass-border-strong)",
    borderRadius: "var(--radius-2xl)",
    boxShadow: "var(--shadow-floating), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
  },
  subtle: {
    background: "rgba(255, 255, 255, 0.04)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid var(--glass-border-subtle)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "none",
  },
  light: {
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(32px) saturate(180%)",
    WebkitBackdropFilter: "blur(32px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--shadow-elevated)",
    color: "#1a1a1a",
  },
};

export function GlassCard(props: GlassCardProps) {
  const merged = mergeProps(
    { variant: "default" as const, interactive: false, padding: "lg" as const },
    props
  );
  const [local, others] = splitProps(merged, [
    "variant",
    "interactive",
    "padding",
    "style",
    "children",
  ]);

  const baseStyle = (): JSX.CSSProperties => ({
    ...variantStyles[local.variant],
    padding: paddingMap[local.padding],
    transition: local.interactive
      ? "all 250ms cubic-bezier(0.16, 1, 0.3, 1)"
      : "none",
    cursor: local.interactive ? "pointer" : "default",
    ...(typeof local.style === "object" ? local.style : {}),
  });

  const handleMouseEnter = (e: MouseEvent) => {
    if (!local.interactive) return;
    const target = e.currentTarget as HTMLElement;
    target.style.background = "var(--glass-bg-hover)";
    target.style.borderColor = "var(--glass-border-strong)";
    target.style.transform = "translateY(-2px)";
    target.style.boxShadow = "var(--shadow-elevated)";
  };

  const handleMouseLeave = (e: MouseEvent) => {
    if (!local.interactive) return;
    const target = e.currentTarget as HTMLElement;
    target.style.background = variantStyles[local.variant].background;
    target.style.borderColor =
      local.variant === "elevated"
        ? "var(--glass-border-strong)"
        : "var(--glass-border)";
    target.style.transform = "translateY(0)";
    target.style.boxShadow = variantStyles[local.variant].boxShadow;
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!local.interactive) return;
    const target = e.currentTarget as HTMLElement;
    target.style.transform = "scale(0.98)";
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!local.interactive) return;
    const target = e.currentTarget as HTMLElement;
    target.style.transform = "translateY(-2px)";
  };

  return (
    <div
      style={baseStyle()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...others}
    >
      {local.children}
    </div>
  );
}
