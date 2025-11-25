// =============================================================================
// Store Portal - Spatial Design
// Apple visionOS / Liquid Glass Aesthetic
// =============================================================================

import { createSignal, onMount, Show, For, JSX } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { authStore } from "~/stores/auth.store";
import {
  SpatialBackground,
  GlassCard,
  SpatialButton,
  SpatialBadge,
  StatCard,
} from "~/components/ui";
import type { Store, Policy, Certificate } from "~/types";

const mockStore: Store = {
  storeCode: "OVS-001",
  businessName: "OVS Milano Corso Buenos Aires",
  address: "Corso Buenos Aires 45, 20124 Milano (MI)",
  squareMeters: 2500,
  status: "active",
  activationDate: new Date("2025-01-01"),
  closureDate: null,
  createdAt: new Date("2024-12-01"),
  updatedAt: new Date("2025-01-15"),
};

const mockPolicy: Policy = {
  policyId: "POL-OVS-001-2025",
  storeCode: "OVS-001",
  coverageType: "catnat",
  insuredSum: 2500000,
  premium: 6250,
  effectiveFrom: new Date("2025-01-01"),
  effectiveTo: new Date("2025-12-31"),
  status: "active",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

const mockCert: Certificate = {
  certId: "CERT-POL-OVS-001-2025",
  policyId: "POL-OVS-001-2025",
  issueDate: new Date("2025-01-01"),
  documentUrl: "/certificates/POL-OVS-001-2025.pdf",
  validFrom: new Date("2025-01-01"),
  validTo: new Date("2025-12-31"),
  createdAt: new Date("2025-01-01"),
};

// Document Card Component
interface DocumentCardProps {
  icon: string;
  title: string;
  subtitle: string;
  href: string;
}

function DocumentCard(props: DocumentCardProps) {
  const [isHovered, setIsHovered] = createSignal(false);

  const cardStyle = (): JSX.CSSProperties => ({
    display: "flex",
    "align-items": "center",
    gap: "16px",
    padding: "20px",
    background: "var(--glass-bg)",
    "backdrop-filter": "blur(32px) saturate(180%)",
    "-webkit-backdrop-filter": "blur(32px) saturate(180%)",
    border: "1px solid var(--glass-border)",
    "border-radius": "var(--radius-xl)",
    "text-decoration": "none",
    color: "inherit",
    transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
    transform: isHovered() ? "translateY(-2px)" : "translateY(0)",
    "box-shadow": isHovered()
      ? "var(--shadow-elevated)"
      : "var(--shadow-ambient)",
  });

  return (
    <a
      href={props.href}
      style={cardStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          "font-size": "2rem",
          width: "48px",
          height: "48px",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          background: "rgba(255, 255, 255, 0.08)",
          "border-radius": "var(--radius-lg)",
        }}
      >
        {props.icon}
      </div>
      <div style={{ flex: "1" }}>
        <span
          style={{
            "font-weight": "600",
            "font-size": "0.9375rem",
            color: "white",
            display: "block",
            "margin-bottom": "2px",
          }}
        >
          {props.title}
        </span>
        <span
          style={{
            "font-size": "0.8125rem",
            color: "rgba(255, 255, 255, 0.5)",
          }}
        >
          {props.subtitle}
        </span>
      </div>
      <span
        style={{
          color: "var(--color-primary)",
          "font-weight": "600",
          "font-size": "0.875rem",
          transition: "transform 200ms",
          transform: isHovered() ? "translateX(4px)" : "translateX(0)",
        }}
      >
        Scarica →
      </span>
    </a>
  );
}

// Info Row Component
interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow(props: InfoRowProps) {
  return (
    <div>
      <span
        style={{
          "font-size": "0.6875rem",
          "font-weight": "600",
          "letter-spacing": "0.08em",
          "text-transform": "uppercase",
          color: "rgba(255, 255, 255, 0.4)",
          display: "block",
          "margin-bottom": "4px",
        }}
      >
        {props.label}
      </span>
      <p
        style={{
          "font-size": "0.9375rem",
          color: "white",
          "font-weight": "500",
        }}
      >
        {props.value}
      </p>
    </div>
  );
}

// Coverage Detail Card Component
interface CoverageDetailProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function CoverageDetail(props: CoverageDetailProps) {
  return (
    <div
      style={{
        padding: "16px 20px",
        background: props.highlight
          ? "linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.08) 100%)"
          : "rgba(255, 255, 255, 0.04)",
        border: props.highlight
          ? "1px solid rgba(251, 191, 36, 0.3)"
          : "1px solid var(--glass-border-subtle)",
        "border-radius": "var(--radius-lg)",
      }}
    >
      <span
        style={{
          "font-size": "0.6875rem",
          "font-weight": "600",
          "letter-spacing": "0.08em",
          "text-transform": "uppercase",
          color: "rgba(255, 255, 255, 0.4)",
          display: "block",
          "margin-bottom": "6px",
        }}
      >
        {props.label}
      </span>
      <p
        style={{
          "font-size": "1.125rem",
          "font-weight": "600",
          color: "white",
          "letter-spacing": "-0.01em",
        }}
      >
        {props.value}
      </p>
    </div>
  );
}

export default function StorePortal() {
  const navigate = useNavigate();
  const [store, setStore] = createSignal<Store | null>(null);
  const [policy, setPolicy] = createSignal<Policy | null>(null);
  const [certificate, setCertificate] = createSignal<Certificate | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);

  onMount(() => {
    authStore.restoreSession();
    if (!authStore.isAuthenticated()) {
      navigate("/login", { replace: true });
      return;
    }
    if (!authStore.isStoreManager()) {
      navigate("/admin", { replace: true });
      return;
    }
    setTimeout(() => {
      setStore(mockStore);
      setPolicy(mockPolicy);
      setCertificate(mockCert);
      setIsLoading(false);
    }, 300);
  });

  const handleLogout = () => {
    authStore.logout();
    navigate("/login", { replace: true });
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(v);

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(d));

  return (
    <>
      <SpatialBackground animated variant="default" />

      <div
        style={{
          "min-height": "100vh",
          display: "flex",
          "flex-direction": "column",
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: "16px 24px",
            "backdrop-filter": "blur(32px) saturate(180%)",
            "-webkit-backdrop-filter": "blur(32px) saturate(180%)",
            background: "var(--glass-bg)",
            "border-bottom": "1px solid var(--glass-border-subtle)",
            position: "sticky",
            top: "0",
            "z-index": "100",
          }}
        >
          <div
            style={{
              "max-width": "1200px",
              margin: "0 auto",
              display: "flex",
              "align-items": "center",
              "justify-content": "space-between",
            }}
          >
            <div
              style={{ display: "flex", "align-items": "center", gap: "16px" }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  background:
                    "linear-gradient(135deg, var(--color-primary) 0%, #c41230 100%)",
                  "border-radius": "10px",
                  display: "flex",
                  "align-items": "center",
                  "justify-content": "center",
                  "font-size": "1.125rem",
                }}
              >
                🛡️
              </div>
              <div>
                <h1
                  style={{
                    "font-size": "1.125rem",
                    "font-weight": "700",
                    color: "white",
                    "letter-spacing": "-0.02em",
                  }}
                >
                  OVS CatNat
                </h1>
                <span
                  style={{
                    "font-size": "0.75rem",
                    color: "rgba(255, 255, 255, 0.5)",
                  }}
                >
                  La Mia Polizza
                </span>
              </div>
            </div>
            <div
              style={{ display: "flex", "align-items": "center", gap: "16px" }}
            >
              <span
                style={{ "font-size": "0.875rem", color: "rgba(255, 255, 255, 0.7)" }}
              >
                {authStore.user()?.name}
              </span>
              <SpatialButton variant="ghost" size="sm" onClick={handleLogout}>
                Esci
              </SpatialButton>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ flex: "1", padding: "32px 24px" }}>
          <div style={{ "max-width": "1200px", margin: "0 auto" }}>
            <Show
              when={!isLoading()}
              fallback={
                <div
                  style={{
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "center",
                    padding: "80px",
                    color: "rgba(255, 255, 255, 0.5)",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      border: "2px solid var(--color-primary)",
                      "border-top-color": "transparent",
                      "border-radius": "50%",
                      animation: "spin 1s linear infinite",
                      "margin-right": "12px",
                    }}
                  />
                  Caricamento...
                </div>
              }
            >
              {/* Status Banner */}
              <GlassCard
                variant="elevated"
                style={{
                  "margin-bottom": "32px",
                  background:
                    "linear-gradient(135deg, rgba(52, 211, 153, 0.2) 0%, rgba(16, 185, 129, 0.15) 100%)",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    "align-items": "center",
                    gap: "20px",
                    padding: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      background: "rgba(52, 211, 153, 0.3)",
                      "border-radius": "var(--radius-lg)",
                      display: "flex",
                      "align-items": "center",
                      "justify-content": "center",
                      "font-size": "1.75rem",
                    }}
                  >
                    ✓
                  </div>
                  <div style={{ flex: "1" }}>
                    <p
                      style={{
                        "font-size": "1.125rem",
                        "font-weight": "600",
                        color: "white",
                        "margin-bottom": "4px",
                      }}
                    >
                      Il tuo punto vendita è regolarmente assicurato
                    </p>
                    <p
                      style={{
                        "font-size": "0.875rem",
                        color: "rgba(255, 255, 255, 0.6)",
                      }}
                    >
                      Copertura attiva fino al{" "}
                      {policy() ? formatDate(policy()!.effectiveTo) : ""}
                    </p>
                  </div>
                  <SpatialBadge variant="success">Copertura Attiva</SpatialBadge>
                </div>
              </GlassCard>

              {/* Store Details Section */}
              <section style={{ "margin-bottom": "32px" }}>
                <h2
                  style={{
                    "font-size": "0.75rem",
                    "font-weight": "600",
                    "letter-spacing": "0.08em",
                    "text-transform": "uppercase",
                    color: "rgba(255, 255, 255, 0.4)",
                    "margin-bottom": "16px",
                    "padding-left": "4px",
                  }}
                >
                  Dati Punto Vendita
                </h2>
                <GlassCard>
                  <div
                    style={{
                      display: "grid",
                      "grid-template-columns":
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "24px",
                    }}
                  >
                    <InfoRow label="Codice" value={store()?.storeCode ?? ""} />
                    <InfoRow
                      label="Ragione Sociale"
                      value={store()?.businessName ?? ""}
                    />
                    <InfoRow
                      label="Ubicazione Rischio"
                      value={store()?.address ?? ""}
                    />
                    <InfoRow
                      label="Superficie"
                      value={`${store()?.squareMeters?.toLocaleString("it-IT")} mq`}
                    />
                  </div>
                </GlassCard>
              </section>

              {/* Coverage Details Section */}
              <Show when={policy()}>
                <section style={{ "margin-bottom": "32px" }}>
                  <h2
                    style={{
                      "font-size": "0.75rem",
                      "font-weight": "600",
                      "letter-spacing": "0.08em",
                      "text-transform": "uppercase",
                      color: "rgba(255, 255, 255, 0.4)",
                      "margin-bottom": "16px",
                      "padding-left": "4px",
                    }}
                  >
                    Dettagli Copertura
                  </h2>
                  <GlassCard>
                    <div
                      style={{
                        display: "grid",
                        "grid-template-columns":
                          "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "16px",
                      }}
                    >
                      <CoverageDetail
                        label="Somma Assicurata"
                        value={formatCurrency(policy()!.insuredSum)}
                        highlight
                      />
                      <CoverageDetail
                        label="Premio Annuo"
                        value={formatCurrency(policy()!.premium)}
                      />
                      <CoverageDetail
                        label="Tipo Copertura"
                        value="Catastrofi Naturali"
                      />
                      <CoverageDetail
                        label="Validità"
                        value={`${formatDate(policy()!.effectiveFrom)} - ${formatDate(policy()!.effectiveTo)}`}
                      />
                    </div>
                  </GlassCard>
                </section>
              </Show>

              {/* Documents Section */}
              <section style={{ "margin-bottom": "32px" }}>
                <h2
                  style={{
                    "font-size": "0.75rem",
                    "font-weight": "600",
                    "letter-spacing": "0.08em",
                    "text-transform": "uppercase",
                    color: "rgba(255, 255, 255, 0.4)",
                    "margin-bottom": "16px",
                    "padding-left": "4px",
                  }}
                >
                  Documenti
                </h2>
                <div
                  style={{
                    display: "grid",
                    "grid-template-columns":
                      "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "16px",
                  }}
                >
                  <DocumentCard
                    icon="📄"
                    title="Certificato di Assicurazione"
                    subtitle={`Emesso il ${certificate() ? formatDate(certificate()!.issueDate) : ""}`}
                    href={certificate()?.documentUrl ?? "#"}
                  />
                  <DocumentCard
                    icon="📋"
                    title="Condizioni di Polizza"
                    subtitle="Fascicolo Informativo"
                    href="/documents/policy-conditions.pdf"
                  />
                  <DocumentCard
                    icon="🔧"
                    title="Guida Sinistri"
                    subtitle="Cosa fare in caso di sinistro"
                    href="/documents/claims-guide.pdf"
                  />
                </div>
              </section>

              {/* Claims Section */}
              <section>
                <h2
                  style={{
                    "font-size": "0.75rem",
                    "font-weight": "600",
                    "letter-spacing": "0.08em",
                    "text-transform": "uppercase",
                    color: "rgba(255, 255, 255, 0.4)",
                    "margin-bottom": "16px",
                    "padding-left": "4px",
                  }}
                >
                  Hai subito un danno?
                </h2>
                <GlassCard
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(248, 113, 113, 0.15) 0%, rgba(248, 113, 113, 0.08) 100%)",
                    border: "1px solid rgba(248, 113, 113, 0.3)",
                  }}
                >
                  <p
                    style={{
                      "margin-bottom": "16px",
                      color: "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    In caso di sinistro, segui questi passaggi:
                  </p>
                  <ol
                    style={{
                      margin: "0 0 24px 24px",
                      "line-height": "1.8",
                      color: "rgba(255, 255, 255, 0.7)",
                    }}
                  >
                    <li>Metti in sicurezza persone e beni</li>
                    <li>Documenta i danni con foto e video</li>
                    <li>Non effettuare riparazioni prima della perizia</li>
                    <li>Contatta immediatamente i nostri uffici</li>
                  </ol>
                  <div
                    style={{
                      display: "flex",
                      gap: "48px",
                      "padding-top": "20px",
                      "border-top": "1px solid rgba(248, 113, 113, 0.2)",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          "font-size": "0.6875rem",
                          "font-weight": "600",
                          "letter-spacing": "0.08em",
                          "text-transform": "uppercase",
                          color: "rgba(255, 255, 255, 0.4)",
                          display: "block",
                          "margin-bottom": "6px",
                        }}
                      >
                        Numero Verde Sinistri
                      </span>
                      <a
                        href="tel:800123456"
                        style={{
                          color: "var(--color-primary)",
                          "text-decoration": "none",
                          "font-weight": "600",
                          "font-size": "1.125rem",
                        }}
                      >
                        800 123 456
                      </a>
                    </div>
                    <div>
                      <span
                        style={{
                          "font-size": "0.6875rem",
                          "font-weight": "600",
                          "letter-spacing": "0.08em",
                          "text-transform": "uppercase",
                          color: "rgba(255, 255, 255, 0.4)",
                          display: "block",
                          "margin-bottom": "6px",
                        }}
                      >
                        Email
                      </span>
                      <a
                        href="mailto:sinistri@mag.it"
                        style={{
                          color: "var(--color-primary)",
                          "text-decoration": "none",
                          "font-weight": "600",
                          "font-size": "1.125rem",
                        }}
                      >
                        sinistri@mag.it
                      </a>
                    </div>
                  </div>
                </GlassCard>
              </section>
            </Show>
          </div>
        </main>

        {/* Footer */}
        <footer
          style={{
            padding: "24px",
            "text-align": "center",
            "border-top": "1px solid var(--glass-border-subtle)",
            "backdrop-filter": "blur(16px)",
            "-webkit-backdrop-filter": "blur(16px)",
          }}
        >
          <p
            style={{
              "font-size": "0.8125rem",
              color: "rgba(255, 255, 255, 0.4)",
            }}
          >
            © 2025 Gruppo MAG - Tutti i diritti riservati
          </p>
        </footer>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
