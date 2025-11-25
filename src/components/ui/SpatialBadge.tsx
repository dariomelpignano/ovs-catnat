// =============================================================================
// SpatialBadge Component
// Spatial Design - Status Indicators
// =============================================================================

import { JSX, splitProps, mergeProps } from "solid-js";

export interface SpatialBadgeProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "error" | "info" | "neutral";
  size?: "sm" | "md";
}

const variantStyles = {
  success: {
    background: "rgba(52, 211, 153, 0.2)",
    color: "var(--color-success)",
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  warning: {
    background: "rgba(251, 191, 36, 0.2)",
    color: "var(--color-warning)",
    borderColor: "rgba(251, 191, 36, 0.3)",
  },
  error: {
    background: "rgba(248, 113, 113, 0.2)",
    color: "var(--color-error)",
    borderColor: "rgba(248, 113, 113, 0.3)",
  },
  info: {
    background: "rgba(96, 165, 250, 0.2)",
    color: "var(--color-info)",
    borderColor: "rgba(96, 165, 250, 0.3)",
  },
  neutral: {
    background: "rgba(255, 255, 255, 0.1)",
    color: "rgba(255, 255, 255, 0.7)",
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
};

const sizeStyles = {
  sm: {
    padding: "2px 8px",
    fontSize: "0.6875rem",
  },
  md: {
    padding: "4px 12px",
    fontSize: "0.75rem",
  },
};

export function SpatialBadge(props: SpatialBadgeProps) {
  const merged = mergeProps(
    { variant: "neutral" as const, size: "md" as const },
    props
  );
  const [local, others] = splitProps(merged, [
    "variant",
    "size",
    "style",
    "children",
  ]);

  const computedStyle = (): JSX.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontWeight: "600",
    letterSpacing: "0.02em",
    borderRadius: "var(--radius-full)",
    border: `1px solid ${variantStyles[local.variant].borderColor}`,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    whiteSpace: "nowrap",
    ...sizeStyles[local.size],
    background: variantStyles[local.variant].background,
    color: variantStyles[local.variant].color,
    ...(typeof local.style === "object" ? local.style : {}),
  });

  return (
    <span style={computedStyle()} {...others}>
      {local.children}
    </span>
  );
}
