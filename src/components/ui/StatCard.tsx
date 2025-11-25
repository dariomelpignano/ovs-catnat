// =============================================================================
// StatCard Component
// Spatial Design - Dashboard Statistics
// =============================================================================

import { JSX, splitProps, mergeProps, createSignal } from "solid-js";

export interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  trend?: { value: number; direction: "up" | "down" };
  accentColor?: string;
}

export function StatCard(props: StatCardProps) {
  const merged = mergeProps(
    { accentColor: "rgba(227, 24, 55, 0.2)" },
    props
  );

  const [isHovered, setIsHovered] = createSignal(false);

  const cardStyle = (): JSX.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "24px",
    background: "var(--glass-bg)",
    backdropFilter: "blur(32px) saturate(180%)",
    WebkitBackdropFilter: "blur(32px) saturate(180%)",
    border: "1px solid var(--glass-border)",
    borderRadius: "var(--radius-xl)",
    boxShadow: isHovered()
      ? "var(--shadow-elevated)"
      : "var(--shadow-ambient), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
    transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
    transform: isHovered() ? "translateY(-2px)" : "translateY(0)",
  });

  const iconContainerStyle = (): JSX.CSSProperties => ({
    width: "56px",
    height: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.75rem",
    background: merged.accentColor,
    borderRadius: "var(--radius-lg)",
    flexShrink: "0",
    transition: "transform 250ms cubic-bezier(0.16, 1, 0.3, 1)",
    transform: isHovered() ? "scale(1.05)" : "scale(1)",
  });

  const contentStyle: JSX.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  };

  const valueStyle: JSX.CSSProperties = {
    fontSize: "1.75rem",
    fontWeight: "700",
    letterSpacing: "-0.02em",
    lineHeight: "1.2",
    color: "white",
  };

  const labelStyle: JSX.CSSProperties = {
    fontSize: "0.8125rem",
    fontWeight: "500",
    letterSpacing: "0.01em",
    color: "rgba(255, 255, 255, 0.5)",
  };

  return (
    <div
      style={cardStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={iconContainerStyle()}>{merged.icon}</div>
      <div style={contentStyle}>
        <span style={valueStyle}>{merged.value}</span>
        <span style={labelStyle}>{merged.label}</span>
      </div>
    </div>
  );
}
