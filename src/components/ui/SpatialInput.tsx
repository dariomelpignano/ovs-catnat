// =============================================================================
// SpatialInput Component
// Spatial Design - Glass Form Elements
// =============================================================================

import { JSX, splitProps, mergeProps, createSignal, Show } from "solid-js";

export interface SpatialInputProps
  extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "style"> {
  label?: string;
  error?: string;
  variant?: "dark" | "light";
}

export function SpatialInput(props: SpatialInputProps) {
  const merged = mergeProps({ variant: "dark" as const }, props);
  const [local, others] = splitProps(merged, ["label", "error", "variant"]);

  const [isFocused, setIsFocused] = createSignal(false);
  const [isHovered, setIsHovered] = createSignal(false);

  const isDark = () => local.variant === "dark";

  const containerStyle = (): JSX.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "20px",
  });

  const labelStyle = (): JSX.CSSProperties => ({
    fontSize: "0.8125rem",
    fontWeight: "500",
    letterSpacing: "0.02em",
    color: isDark() ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
  });

  const inputStyle = (): JSX.CSSProperties => {
    const base: JSX.CSSProperties = {
      width: "100%",
      padding: "16px 20px",
      fontFamily: "var(--font-system)",
      fontSize: "1rem",
      fontWeight: "400",
      color: isDark() ? "white" : "#1a1a1a",
      background: isDark() ? "var(--glass-bg)" : "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: `1px solid ${
        local.error
          ? "var(--color-error)"
          : isDark()
            ? "var(--glass-border-subtle)"
            : "rgba(0, 0, 0, 0.08)"
      }`,
      borderRadius: "var(--radius-lg)",
      outline: "none",
      transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
    };

    if (isHovered() && !isFocused()) {
      base.borderColor = isDark() ? "var(--glass-border)" : "rgba(0, 0, 0, 0.15)";
      base.background = isDark()
        ? "var(--glass-bg-hover)"
        : "rgba(255, 255, 255, 0.9)";
    }

    if (isFocused()) {
      base.borderColor = "var(--color-primary)";
      base.boxShadow = "0 0 0 3px var(--color-primary-glow)";
      base.background = isDark()
        ? "var(--glass-bg-hover)"
        : "rgba(255, 255, 255, 0.95)";
    }

    return base;
  };

  const errorStyle = (): JSX.CSSProperties => ({
    fontSize: "0.8125rem",
    color: "var(--color-error)",
    marginTop: "-4px",
  });

  return (
    <div style={containerStyle()}>
      <Show when={local.label}>
        <label style={labelStyle()}>{local.label}</label>
      </Show>
      <input
        style={inputStyle()}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...others}
      />
      <Show when={local.error}>
        <span style={errorStyle()}>{local.error}</span>
      </Show>
    </div>
  );
}
