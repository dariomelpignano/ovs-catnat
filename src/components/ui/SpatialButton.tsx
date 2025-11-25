// =============================================================================
// SpatialButton Component
// Spatial Design - Physics-based Micro-interactions
// =============================================================================

import { JSX, splitProps, mergeProps, createSignal } from "solid-js";

export interface SpatialButtonProps
  extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
}

const sizeStyles = {
  sm: {
    padding: "8px 16px",
    fontSize: "0.8125rem",
    borderRadius: "var(--radius-md)",
  },
  md: {
    padding: "12px 24px",
    fontSize: "0.9375rem",
    borderRadius: "var(--radius-lg)",
  },
  lg: {
    padding: "16px 32px",
    fontSize: "1rem",
    borderRadius: "var(--radius-lg)",
  },
};

const variantStyles = {
  default: {
    background: "var(--glass-bg)",
    border: "1px solid var(--glass-border)",
    color: "white",
    boxShadow: "none",
  },
  primary: {
    background: "linear-gradient(135deg, var(--color-accent) 0%, #e5a800 100%)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "var(--color-primary)",
    boxShadow: "0 8px 32px var(--color-accent-glow), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
  },
  ghost: {
    background: "transparent",
    border: "1px solid var(--glass-border-subtle)",
    color: "white",
    boxShadow: "none",
  },
  danger: {
    background: "linear-gradient(135deg, var(--color-error) 0%, #dc2626 100%)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "white",
    boxShadow: "0 8px 32px var(--color-error-glow), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
  },
};

export function SpatialButton(props: SpatialButtonProps) {
  const merged = mergeProps(
    {
      variant: "default" as const,
      size: "md" as const,
      fullWidth: false,
      loading: false,
    },
    props
  );
  const [local, others] = splitProps(merged, [
    "variant",
    "size",
    "fullWidth",
    "loading",
    "style",
    "children",
    "disabled",
  ]);

  const [isHovered, setIsHovered] = createSignal(false);
  const [isPressed, setIsPressed] = createSignal(false);

  const computedStyle = (): JSX.CSSProperties => {
    const base: JSX.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      fontFamily: "var(--font-system)",
      fontWeight: "500",
      letterSpacing: "-0.01em",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      cursor: local.disabled || local.loading ? "not-allowed" : "pointer",
      userSelect: "none",
      WebkitTapHighlightColor: "transparent",
      transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
      opacity: local.disabled ? 0.5 : 1,
      width: local.fullWidth ? "100%" : "auto",
      ...sizeStyles[local.size],
      ...variantStyles[local.variant],
    };

    // Hover state
    if (isHovered() && !local.disabled && !local.loading) {
      base.transform = "translateY(-1px)";
      base.boxShadow = "var(--shadow-elevated)";
      if (local.variant === "default" || local.variant === "ghost") {
        base.background = "var(--glass-bg-hover)";
        base.borderColor = "var(--glass-border-strong)";
      } else if (local.variant === "primary") {
        base.background =
          "linear-gradient(135deg, #ffc61a 0%, var(--color-accent) 100%)";
        base.boxShadow =
          "0 12px 40px var(--color-accent-glow), inset 0 1px 1px rgba(255, 255, 255, 0.1)";
      }
    }

    // Pressed state
    if (isPressed() && !local.disabled && !local.loading) {
      base.transform = "scale(0.97) translateY(0)";
      base.background = "var(--glass-bg-active)";
    }

    return {
      ...base,
      ...(typeof local.style === "object" ? local.style : {}),
    };
  };

  return (
    <button
      style={computedStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      disabled={local.disabled || local.loading}
      {...others}
    >
      {local.loading ? (
        <>
          <span
            style={{
              width: "16px",
              height: "16px",
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "white",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          Caricamento...
        </>
      ) : (
        local.children
      )}
    </button>
  );
}
