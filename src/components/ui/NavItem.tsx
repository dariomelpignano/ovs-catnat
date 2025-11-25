// =============================================================================
// NavItem Component
// Spatial Design - Navigation Items
// =============================================================================

import { JSX, splitProps, createSignal } from "solid-js";
import { A } from "@solidjs/router";

export interface NavItemProps {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}

export function NavItem(props: NavItemProps) {
  const [local] = splitProps(props, ["href", "icon", "label", "active"]);
  const [isHovered, setIsHovered] = createSignal(false);

  const linkStyle = (): JSX.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "var(--radius-lg)",
    textDecoration: "none",
    fontSize: "0.9375rem",
    fontWeight: "500",
    letterSpacing: "-0.01em",
    transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
    background: local.active
      ? "linear-gradient(135deg, var(--color-primary) 0%, #c41230 100%)"
      : isHovered()
        ? "var(--glass-bg)"
        : "transparent",
    color: local.active ? "white" : isHovered() ? "white" : "rgba(255, 255, 255, 0.6)",
    border: local.active
      ? "1px solid rgba(255, 255, 255, 0.2)"
      : "1px solid transparent",
    boxShadow: local.active
      ? "0 4px 16px var(--color-primary-glow)"
      : "none",
    transform: isHovered() && !local.active ? "translateX(4px)" : "translateX(0)",
  });

  const iconStyle: JSX.CSSProperties = {
    fontSize: "1.125rem",
    width: "24px",
    textAlign: "center",
  };

  return (
    <A
      href={local.href}
      style={linkStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={iconStyle}>{local.icon}</span>
      {local.label}
    </A>
  );
}
