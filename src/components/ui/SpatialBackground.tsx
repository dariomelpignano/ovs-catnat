// =============================================================================
// SpatialBackground Component
// Spatial Design - Abstract Mesh Gradient Background
// =============================================================================

import { JSX, mergeProps } from "solid-js";

interface SpatialBackgroundProps {
  animated?: boolean;
  variant?: "default" | "warm" | "cool" | "monochrome";
}

const gradientVariants = {
  default: `
    radial-gradient(ellipse 80% 50% at 20% 40%, rgba(227, 24, 55, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 80% 20%, rgba(99, 102, 241, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse 50% 60% at 60% 80%, rgba(52, 211, 153, 0.1) 0%, transparent 50%),
    linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)
  `,
  warm: `
    radial-gradient(ellipse 80% 50% at 20% 40%, rgba(251, 146, 60, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 80% 20%, rgba(227, 24, 55, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse 50% 60% at 60% 80%, rgba(251, 191, 36, 0.1) 0%, transparent 50%),
    linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)
  `,
  cool: `
    radial-gradient(ellipse 80% 50% at 20% 40%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 80% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse 50% 60% at 60% 80%, rgba(52, 211, 153, 0.1) 0%, transparent 50%),
    linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)
  `,
  monochrome: `
    radial-gradient(ellipse 80% 50% at 20% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 80% 20%, rgba(255, 255, 255, 0.03) 0%, transparent 50%),
    radial-gradient(ellipse 50% 60% at 60% 80%, rgba(255, 255, 255, 0.04) 0%, transparent 50%),
    linear-gradient(180deg, #0a0a0a 0%, #141414 50%, #0a0a0a 100%)
  `,
};

export function SpatialBackground(props: SpatialBackgroundProps) {
  const merged = mergeProps(
    { animated: true, variant: "default" as const },
    props
  );

  const baseStyle: JSX.CSSProperties = {
    position: "fixed",
    inset: "0",
    "z-index": "-1",
    background: "#0a0a0a",
    overflow: "hidden",
  };

  const gradientStyle = (): JSX.CSSProperties => ({
    position: "absolute",
    width: merged.animated ? "150%" : "100%",
    height: merged.animated ? "150%" : "100%",
    top: merged.animated ? "-25%" : "0",
    left: merged.animated ? "-25%" : "0",
    background: gradientVariants[merged.variant],
    animation: merged.animated ? "meshFloat 20s ease-in-out infinite" : "none",
  });

  return (
    <div style={baseStyle}>
      <div style={gradientStyle()} />
      <style>{`
        @keyframes meshFloat {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(2%, -2%) rotate(1deg); }
          66% { transform: translate(-1%, 1%) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
}
