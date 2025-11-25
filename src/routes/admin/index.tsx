// =============================================================================
// Admin Dashboard - Spatial Design
// Apple visionOS / Liquid Glass Aesthetic
// =============================================================================

import { createSignal, onMount, Show, For, JSX } from "solid-js";
import { useNavigate, A } from "@solidjs/router";
import { authStore } from "~/stores/auth.store";
import {
  SpatialBackground,
  GlassCard,
  SpatialButton,
  SpatialBadge,
  StatCard,
  NavItem,
} from "~/components/ui";
import type { Store, FileImport, AdminDashboard } from "~/types";

const mockDashboard: AdminDashboard = {
  totalStores: 1247,
  activeStores: 1189,
  totalPremium: 7432500,
  recentImports: [
    {
      importId: "IMP-001",
      filename: "stores_novembre_2025.csv",
      status: "completed",
      totalRecords: 1250,
      processedRecords: 1247,
      errorRecords: 3,
      errors: [],
      uploadedBy: "admin@mag.it",
      uploadedAt: new Date("2025-11-20"),
      completedAt: new Date("2025-11-20"),
    },
    {
      importId: "IMP-002",
      filename: "stores_ottobre_2025.csv",
      status: "completed",
      totalRecords: 1240,
      processedRecords: 1240,
      errorRecords: 0,
      errors: [],
      uploadedBy: "admin@mag.it",
      uploadedAt: new Date("2025-10-15"),
      completedAt: new Date("2025-10-15"),
    },
  ],
  pendingActions: 3,
};

const mockStores: Store[] = [
  {
    storeCode: "OVS-1247",
    businessName: "OVS Roma Via del Corso",
    address: "Via del Corso 123, Roma",
    squareMeters: 3200,
    status: "active",
    activationDate: new Date("2025-11-15"),
    closureDate: null,
    createdAt: new Date("2025-11-15"),
    updatedAt: new Date("2025-11-15"),
  },
  {
    storeCode: "OVS-1246",
    businessName: "OVS Firenze Centro",
    address: "Via Calzaiuoli 45, Firenze",
    squareMeters: 2800,
    status: "active",
    activationDate: new Date("2025-11-10"),
    closureDate: null,
    createdAt: new Date("2025-11-10"),
    updatedAt: new Date("2025-11-10"),
  },
  {
    storeCode: "OVS-1245",
    businessName: "OVS Napoli Galleria",
    address: "Galleria Umberto I 78, Napoli",
    squareMeters: 2100,
    status: "pending",
    activationDate: null,
    closureDate: null,
    createdAt: new Date("2025-11-08"),
    updatedAt: new Date("2025-11-08"),
  },
];

// Quick Action Card Component
interface QuickActionProps {
  icon: string;
  title: string;
  subtitle: string;
  href: string;
}

function QuickAction(props: QuickActionProps) {
  const [isHovered, setIsHovered] = createSignal(false);

  const cardStyle = (): JSX.CSSProperties => ({
    display: "flex",
    "flex-direction": "column",
    "align-items": "center",
    gap: "12px",
    padding: "24px 20px",
    background: "var(--glass-bg)",
    "backdrop-filter": "blur(32px) saturate(180%)",
    "-webkit-backdrop-filter": "blur(32px) saturate(180%)",
    border: "1px solid var(--glass-border)",
    "border-radius": "var(--radius-xl)",
    "text-decoration": "none",
    color: "inherit",
    "text-align": "center",
    transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
    transform: isHovered() ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
    "box-shadow": isHovered()
      ? "var(--shadow-elevated)"
      : "var(--shadow-ambient)",
  });

  return (
    <A
      href={props.href}
      style={cardStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          "font-size": "2.5rem",
          width: "64px",
          height: "64px",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          background: "rgba(255, 255, 255, 0.08)",
          "border-radius": "var(--radius-xl)",
          transition: "transform 250ms cubic-bezier(0.16, 1, 0.3, 1)",
          transform: isHovered() ? "scale(1.1)" : "scale(1)",
        }}
      >
        {props.icon}
      </div>
      <div>
        <span
          style={{
            "font-weight": "600",
            "font-size": "0.9375rem",
            color: "white",
            display: "block",
            "margin-bottom": "4px",
          }}
        >
          {props.title}
        </span>
        <span
          style={{
            "font-size": "0.75rem",
            color: "rgba(255, 255, 255, 0.5)",
          }}
        >
          {props.subtitle}
        </span>
      </div>
    </A>
  );
}

// Sidebar Component
interface SidebarProps {
  currentPath: string;
  userName: string;
  userRole: string;
  onLogout: () => void;
}

function Sidebar(props: SidebarProps) {
  return (
    <aside
      style={{
        width: "280px",
        background: "var(--glass-bg-dark)",
        "backdrop-filter": "blur(40px) saturate(200%)",
        "-webkit-backdrop-filter": "blur(40px) saturate(200%)",
        "border-right": "1px solid var(--glass-border-subtle)",
        display: "flex",
        "flex-direction": "column",
        position: "fixed",
        top: "0",
        left: "0",
        bottom: "0",
        "z-index": "200",
      }}
    >
      {/* Logo Section */}
      <div
        style={{
          padding: "24px",
          "border-bottom": "1px solid var(--glass-border-subtle)",
          display: "flex",
          "align-items": "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            background:
              "linear-gradient(135deg, var(--color-accent) 0%, #e5a800 100%)",
            "border-radius": "12px",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            "font-size": "1.25rem",
            "box-shadow": "0 4px 16px var(--color-accent-glow)",
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
          <SpatialBadge variant="brand" size="sm">
            Admin
          </SpatialBadge>
        </div>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: "1",
          padding: "16px",
          display: "flex",
          "flex-direction": "column",
          gap: "4px",
        }}
      >
        <NavItem
          href="/admin"
          icon="📊"
          label="Dashboard"
          active={props.currentPath === "/admin"}
        />
        <NavItem
          href="/admin/stores"
          icon="🏪"
          label="Punti Vendita"
          active={props.currentPath === "/admin/stores"}
        />
        <NavItem
          href="/admin/import"
          icon="📥"
          label="Importazione"
          active={props.currentPath === "/admin/import"}
        />
        <NavItem
          href="/admin/policies"
          icon="📋"
          label="Polizze"
          active={props.currentPath === "/admin/policies"}
        />
        <NavItem
          href="/admin/reports"
          icon="📈"
          label="Report"
          active={props.currentPath === "/admin/reports"}
        />
      </nav>

      {/* User Section */}
      <div
        style={{
          padding: "16px",
          "border-top": "1px solid var(--glass-border-subtle)",
          display: "flex",
          "align-items": "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            background: "rgba(255, 255, 255, 0.1)",
            "border-radius": "var(--radius-lg)",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            "font-size": "1.25rem",
          }}
        >
          👤
        </div>
        <div style={{ flex: "1", "min-width": "0" }}>
          <span
            style={{
              "font-size": "0.875rem",
              "font-weight": "600",
              color: "white",
              display: "block",
              overflow: "hidden",
              "text-overflow": "ellipsis",
              "white-space": "nowrap",
            }}
          >
            {props.userName}
          </span>
          <span
            style={{
              "font-size": "0.75rem",
              color: "rgba(255, 255, 255, 0.5)",
              "text-transform": "capitalize",
            }}
          >
            {props.userRole}
          </span>
        </div>
        <SpatialButton variant="ghost" size="sm" onClick={props.onLogout}>
          Esci
        </SpatialButton>
      </div>
    </aside>
  );
}

// Status Badge Helper
function getStatusVariant(
  status: string
): "success" | "warning" | "error" | "info" | "neutral" {
  const map: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
    active: "success",
    completed: "success",
    pending: "warning",
    processing: "warning",
    inactive: "error",
    failed: "error",
  };
  return map[status] || "neutral";
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = createSignal<AdminDashboard | null>(null);
  const [recentStores, setRecentStores] = createSignal<Store[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);

  onMount(() => {
    authStore.restoreSession();
    if (!authStore.isAuthenticated()) {
      navigate("/login", { replace: true });
      return;
    }
    if (authStore.isStoreManager()) {
      navigate("/store", { replace: true });
      return;
    }
    setTimeout(() => {
      setDashboard(mockDashboard);
      setRecentStores(mockStores);
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
      maximumFractionDigits: 0,
    }).format(v);

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(d));

  return (
    <>
      <SpatialBackground animated variant="default" />

      <div style={{ display: "flex", "min-height": "100vh" }}>
        {/* Sidebar */}
        <Sidebar
          currentPath="/admin"
          userName={authStore.user()?.name ?? ""}
          userRole={authStore.user()?.role ?? ""}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main
          style={{
            flex: "1",
            "margin-left": "280px",
            padding: "32px",
          }}
        >
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
            {/* Header */}
            <header style={{ "margin-bottom": "32px" }}>
              <h2
                style={{
                  "font-size": "1.75rem",
                  "font-weight": "700",
                  color: "white",
                  "letter-spacing": "-0.02em",
                  "margin-bottom": "8px",
                }}
              >
                Dashboard
              </h2>
              <p
                style={{
                  "font-size": "0.9375rem",
                  color: "rgba(255, 255, 255, 0.5)",
                }}
              >
                Panoramica della gestione polizze OVS
              </p>
            </header>

            {/* Stats Grid */}
            <div
              style={{
                display: "grid",
                "grid-template-columns": "repeat(4, 1fr)",
                gap: "20px",
                "margin-bottom": "32px",
              }}
            >
              <StatCard
                icon="🏪"
                value={dashboard()?.totalStores.toLocaleString("it-IT") ?? "0"}
                label="Punti Vendita Totali"
                accentColor="rgba(251, 186, 7, 0.2)"
              />
              <StatCard
                icon="✓"
                value={dashboard()?.activeStores.toLocaleString("it-IT") ?? "0"}
                label="Store Attivi"
                accentColor="rgba(52, 211, 153, 0.2)"
              />
              <StatCard
                icon="💰"
                value={formatCurrency(dashboard()?.totalPremium ?? 0)}
                label="Premio Totale"
                accentColor="rgba(251, 191, 36, 0.2)"
              />
              <StatCard
                icon="⚡"
                value={dashboard()?.pendingActions?.toString() ?? "0"}
                label="Azioni Pendenti"
                accentColor="rgba(96, 165, 250, 0.2)"
              />
            </div>

            {/* Tables Grid */}
            <div
              style={{
                display: "grid",
                "grid-template-columns": "repeat(2, 1fr)",
                gap: "24px",
                "margin-bottom": "32px",
              }}
            >
              {/* Recent Imports */}
              <section>
                <div
                  style={{
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "space-between",
                    "margin-bottom": "16px",
                  }}
                >
                  <h3
                    style={{
                      "font-size": "0.75rem",
                      "font-weight": "600",
                      "letter-spacing": "0.08em",
                      "text-transform": "uppercase",
                      color: "rgba(255, 255, 255, 0.4)",
                    }}
                  >
                    Importazioni Recenti
                  </h3>
                  <A
                    href="/admin/import"
                    style={{
                      "font-size": "0.8125rem",
                      color: "var(--color-accent)",
                      "text-decoration": "none",
                      "font-weight": "500",
                    }}
                  >
                    Vedi tutte →
                  </A>
                </div>
                <GlassCard padding="none">
                  <div style={{ overflow: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        "border-collapse": "collapse",
                        "font-size": "0.8125rem",
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              padding: "14px 16px",
                              "text-align": "left",
                              "font-weight": "600",
                              color: "rgba(255, 255, 255, 0.5)",
                              "border-bottom": "1px solid var(--glass-border-subtle)",
                              "font-size": "0.6875rem",
                              "letter-spacing": "0.06em",
                              "text-transform": "uppercase",
                            }}
                          >
                            File
                          </th>
                          <th
                            style={{
                              padding: "14px 16px",
                              "text-align": "left",
                              "font-weight": "600",
                              color: "rgba(255, 255, 255, 0.5)",
                              "border-bottom": "1px solid var(--glass-border-subtle)",
                              "font-size": "0.6875rem",
                              "letter-spacing": "0.06em",
                              "text-transform": "uppercase",
                            }}
                          >
                            Data
                          </th>
                          <th
                            style={{
                              padding: "14px 16px",
                              "text-align": "left",
                              "font-weight": "600",
                              color: "rgba(255, 255, 255, 0.5)",
                              "border-bottom": "1px solid var(--glass-border-subtle)",
                              "font-size": "0.6875rem",
                              "letter-spacing": "0.06em",
                              "text-transform": "uppercase",
                            }}
                          >
                            Record
                          </th>
                          <th
                            style={{
                              padding: "14px 16px",
                              "text-align": "left",
                              "font-weight": "600",
                              color: "rgba(255, 255, 255, 0.5)",
                              "border-bottom": "1px solid var(--glass-border-subtle)",
                              "font-size": "0.6875rem",
                              "letter-spacing": "0.06em",
                              "text-transform": "uppercase",
                            }}
                          >
                            Stato
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={dashboard()?.recentImports}>
                          {(imp) => (
                            <tr
                              style={{
                                transition: "background 150ms",
                              }}
                            >
                              <td
                                style={{
                                  padding: "14px 16px",
                                  color: "white",
                                  "border-bottom": "1px solid var(--glass-border-subtle)",
                                }}
                              >
                                {imp.filename}
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  color: "rgba(255, 255, 255, 0.7)",
                                  "border-bottom": "1px solid var(--glass-border-subtle)",
                                }}
                              >
                                {formatDate(imp.uploadedAt)}
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  color: "rgba(255, 255, 255, 0.7)",
                                  "border-bottom": "1px solid var(--glass-border-subtle)",
                                }}
                              >
                                {imp.processedRecords}/{imp.totalRecords}
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  "border-bottom": "1px solid var(--glass-border-subtle)",
                                }}
                              >
                                <SpatialBadge
                                  variant={getStatusVariant(imp.status)}
                                  size="sm"
                                >
                                  {imp.status}
                                </SpatialBadge>
                              </td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </section>

              {/* Recent Stores */}
              <section>
                <div
                  style={{
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "space-between",
                    "margin-bottom": "16px",
                  }}
                >
                  <h3
                    style={{
                      "font-size": "0.75rem",
                      "font-weight": "600",
                      "letter-spacing": "0.08em",
                      "text-transform": "uppercase",
                      color: "rgba(255, 255, 255, 0.4)",
                    }}
                  >
                    Store Recenti
                  </h3>
                  <A
                    href="/admin/stores"
                    style={{
                      "font-size": "0.8125rem",
                      color: "var(--color-accent)",
                      "text-decoration": "none",
                      "font-weight": "500",
                    }}
                  >
                    Vedi tutti →
                  </A>
                </div>
                <GlassCard padding="none">
                  <div style={{ overflow: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        "border-collapse": "collapse",
                        "font-size": "0.8125rem",
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              padding: "14px 16px",
                              "text-align": "left",
                              "font-weight": "600",
                              color: "rgba(255, 255, 255, 0.5)",
                              "border-bottom": "1px solid var(--glass-border-subtle)",
                              "font-size": "0.6875rem",
                              "letter-spacing": "0.06em",
                              "text-transform": "uppercase",
                            }}
                          >
                            Codice
                          </th>
                          <th
                            style={{
                              padding: "14px 16px",
                              "text-align": "left",
                              "font-weight": "600",
                              color: "rgba(255, 255, 255, 0.5)",
                              "border-bottom": "1px solid var(--glass-border-subtle)",
                              "font-size": "0.6875rem",
                              "letter-spacing": "0.06em",
                              "text-transform": "uppercase",
                            }}
                          >
                            Nome
                          </th>
                          <th
                            style={{
                              padding: "14px 16px",
                              "text-align": "left",
                              "font-weight": "600",
                              color: "rgba(255, 255, 255, 0.5)",
                              "border-bottom": "1px solid var(--glass-border-subtle)",
                              "font-size": "0.6875rem",
                              "letter-spacing": "0.06em",
                              "text-transform": "uppercase",
                            }}
                          >
                            mq
                          </th>
                          <th
                            style={{
                              padding: "14px 16px",
                              "text-align": "left",
                              "font-weight": "600",
                              color: "rgba(255, 255, 255, 0.5)",
                              "border-bottom": "1px solid var(--glass-border-subtle)",
                              "font-size": "0.6875rem",
                              "letter-spacing": "0.06em",
                              "text-transform": "uppercase",
                            }}
                          >
                            Stato
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={recentStores()}>
                          {(store) => (
                            <tr
                              style={{
                                transition: "background 150ms",
                              }}
                            >
                              <td
                                style={{
                                  padding: "14px 16px",
                                  "font-family": "var(--font-mono)",
                                  "font-size": "0.75rem",
                                  color: "var(--color-accent)",
                                  "border-bottom": "1px solid var(--glass-border-subtle)",
                                }}
                              >
                                {store.storeCode}
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  color: "white",
                                  "border-bottom": "1px solid var(--glass-border-subtle)",
                                }}
                              >
                                {store.businessName}
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  color: "rgba(255, 255, 255, 0.7)",
                                  "border-bottom": "1px solid var(--glass-border-subtle)",
                                }}
                              >
                                {store.squareMeters.toLocaleString("it-IT")}
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  "border-bottom": "1px solid var(--glass-border-subtle)",
                                }}
                              >
                                <SpatialBadge
                                  variant={getStatusVariant(store.status)}
                                  size="sm"
                                >
                                  {store.status}
                                </SpatialBadge>
                              </td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </section>
            </div>

            {/* Quick Actions */}
            <section>
              <h3
                style={{
                  "font-size": "0.75rem",
                  "font-weight": "600",
                  "letter-spacing": "0.08em",
                  "text-transform": "uppercase",
                  color: "rgba(255, 255, 255, 0.4)",
                  "margin-bottom": "16px",
                }}
              >
                Azioni Rapide
              </h3>
              <div
                style={{
                  display: "grid",
                  "grid-template-columns": "repeat(4, 1fr)",
                  gap: "16px",
                }}
              >
                <QuickAction
                  icon="📥"
                  title="Importa Store"
                  subtitle="Carica file Excel/CSV"
                  href="/admin/import"
                />
                <QuickAction
                  icon="📤"
                  title="Esporta Report"
                  subtitle="Per compagnia assicurativa"
                  href="/admin/reports/export"
                />
                <QuickAction
                  icon="➕"
                  title="Aggiungi Store"
                  subtitle="Inserimento manuale"
                  href="/admin/stores/add"
                />
                <QuickAction
                  icon="📜"
                  title="Audit Log"
                  subtitle="Storico variazioni"
                  href="/admin/audit"
                />
              </div>
            </section>
          </Show>
        </main>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
