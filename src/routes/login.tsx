// =============================================================================
// Login Page - Spatial Design
// Apple visionOS / Liquid Glass Aesthetic
// =============================================================================

import { createSignal, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { authStore } from "~/stores/auth.store";
import {
  SpatialBackground,
  GlassCard,
  SpatialButton,
  SpatialInput,
} from "~/components/ui";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    const success = await authStore.login(email(), password());
    if (success) {
      navigate(
        authStore.isAdmin() || authStore.isBroker() ? "/admin" : "/store",
        { replace: true }
      );
    } else {
      setError("Credenziali non valide");
    }
  };

  return (
    <>
      <SpatialBackground animated variant="default" />

      <div
        style={{
          "min-height": "100vh",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          padding: "24px",
        }}
      >
        <GlassCard
          variant="elevated"
          padding="xl"
          style={{
            width: "100%",
            "max-width": "420px",
          }}
        >
          {/* Header */}
          <div
            style={{
              "text-align": "center",
              "margin-bottom": "40px",
            }}
          >
            {/* Logo Mark */}
            <div
              style={{
                width: "72px",
                height: "72px",
                margin: "0 auto 20px",
                background:
                  "linear-gradient(135deg, var(--color-primary) 0%, #c41230 100%)",
                "border-radius": "20px",
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                "font-size": "2rem",
                "box-shadow":
                  "0 8px 32px var(--color-primary-glow), inset 0 1px 1px rgba(255,255,255,0.2)",
              }}
            >
              🛡️
            </div>

            <h1
              style={{
                "font-size": "1.75rem",
                "font-weight": "700",
                "letter-spacing": "-0.02em",
                color: "white",
                "margin-bottom": "8px",
              }}
            >
              OVS CatNat
            </h1>
            <p
              style={{
                "font-size": "0.9375rem",
                color: "rgba(255, 255, 255, 0.5)",
                "letter-spacing": "-0.01em",
              }}
            >
              Gestione Polizze Property & Catastrofi Naturali
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Error Alert */}
            <Show when={error()}>
              <div
                style={{
                  padding: "14px 18px",
                  background: "rgba(248, 113, 113, 0.15)",
                  border: "1px solid rgba(248, 113, 113, 0.3)",
                  "border-radius": "var(--radius-lg)",
                  "margin-bottom": "24px",
                  display: "flex",
                  "align-items": "center",
                  gap: "12px",
                }}
              >
                <span style={{ "font-size": "1.25rem" }}>⚠️</span>
                <span
                  style={{
                    "font-size": "0.9375rem",
                    color: "var(--color-error)",
                  }}
                >
                  {error()}
                </span>
              </div>
            </Show>

            <SpatialInput
              label="Email"
              type="email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              placeholder="nome@esempio.it"
              required
              autocomplete="email"
            />

            <SpatialInput
              label="Password"
              type="password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />

            <SpatialButton
              type="submit"
              variant="primary"
              fullWidth
              loading={authStore.isLoading()}
              style={{ "margin-top": "8px" }}
            >
              Accedi
            </SpatialButton>
          </form>

          {/* Help Link */}
          <div
            style={{
              "margin-top": "32px",
              "text-align": "center",
            }}
          >
            <p
              style={{
                "font-size": "0.875rem",
                color: "rgba(255, 255, 255, 0.5)",
              }}
            >
              Problemi di accesso?{" "}
              <a
                href="mailto:support@mag.it"
                style={{
                  color: "var(--color-primary)",
                  "text-decoration": "none",
                  "font-weight": "500",
                  transition: "opacity 200ms",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Contattaci
              </a>
            </p>
          </div>

          {/* Demo Credentials - Glass Subtle Variant */}
          <div
            style={{
              "margin-top": "24px",
              padding: "16px 20px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--glass-border-subtle)",
              "border-radius": "var(--radius-lg)",
            }}
          >
            <p
              style={{
                "font-size": "0.6875rem",
                "font-weight": "600",
                "letter-spacing": "0.08em",
                "text-transform": "uppercase",
                color: "rgba(255, 255, 255, 0.4)",
                "margin-bottom": "12px",
              }}
            >
              Credenziali Demo
            </p>
            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "8px",
                "font-size": "0.8125rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  "justify-content": "space-between",
                  "align-items": "center",
                }}
              >
                <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Admin</span>
                <code
                  style={{
                    "font-family": "var(--font-mono)",
                    "font-size": "0.75rem",
                    color: "rgba(255, 255, 255, 0.8)",
                    background: "rgba(255, 255, 255, 0.08)",
                    padding: "2px 8px",
                    "border-radius": "6px",
                  }}
                >
                  admin@mag.it
                </code>
              </div>
              <div
                style={{
                  display: "flex",
                  "justify-content": "space-between",
                  "align-items": "center",
                }}
              >
                <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Store</span>
                <code
                  style={{
                    "font-family": "var(--font-mono)",
                    "font-size": "0.75rem",
                    color: "rgba(255, 255, 255, 0.8)",
                    background: "rgba(255, 255, 255, 0.08)",
                    padding: "2px 8px",
                    "border-radius": "6px",
                  }}
                >
                  store001@ovs.it
                </code>
              </div>
              <div
                style={{
                  display: "flex",
                  "justify-content": "space-between",
                  "align-items": "center",
                }}
              >
                <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                  Password
                </span>
                <code
                  style={{
                    "font-family": "var(--font-mono)",
                    "font-size": "0.75rem",
                    color: "rgba(255, 255, 255, 0.8)",
                    background: "rgba(255, 255, 255, 0.08)",
                    padding: "2px 8px",
                    "border-radius": "6px",
                  }}
                >
                  demo123
                </code>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
