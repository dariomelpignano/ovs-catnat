// =============================================================================
// Stores Management Page - Spatial Design
// Apple visionOS / Liquid Glass Aesthetic
// =============================================================================

import { createSignal, onMount, Show, For, JSX, createMemo } from "solid-js";
import { useNavigate, A } from "@solidjs/router";
import { authStore } from "~/stores/auth.store";
import {
  SpatialBackground,
  GlassCard,
  SpatialButton,
  SpatialBadge,
  SpatialInput,
  NavItem,
} from "~/components/ui";
import type { Store, StoreStatus } from "~/types";

// Mock data for stores
const mockStores: Store[] = [
  {
    storeCode: "OVS-0001",
    businessName: "OVS Milano Duomo",
    address: "Piazza del Duomo 1, 20121 Milano",
    squareMeters: 4500,
    status: "active",
    activationDate: new Date("2025-01-15"),
    closureDate: null,
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-11-20"),
  },
  {
    storeCode: "OVS-0002",
    businessName: "OVS Roma Via del Corso",
    address: "Via del Corso 123, 00186 Roma",
    squareMeters: 3200,
    status: "active",
    activationDate: new Date("2025-02-01"),
    closureDate: null,
    createdAt: new Date("2025-02-01"),
    updatedAt: new Date("2025-11-18"),
  },
  {
    storeCode: "OVS-0003",
    businessName: "OVS Firenze Centro",
    address: "Via Calzaiuoli 45, 50122 Firenze",
    squareMeters: 2800,
    status: "active",
    activationDate: new Date("2025-03-10"),
    closureDate: null,
    createdAt: new Date("2025-03-10"),
    updatedAt: new Date("2025-11-15"),
  },
  {
    storeCode: "OVS-0004",
    businessName: "OVS Napoli Galleria",
    address: "Galleria Umberto I 78, 80132 Napoli",
    squareMeters: 2100,
    status: "pending",
    activationDate: null,
    closureDate: null,
    createdAt: new Date("2025-11-08"),
    updatedAt: new Date("2025-11-08"),
  },
  {
    storeCode: "OVS-0005",
    businessName: "OVS Torino Centro",
    address: "Via Roma 200, 10121 Torino",
    squareMeters: 3000,
    status: "active",
    activationDate: new Date("2025-04-20"),
    closureDate: null,
    createdAt: new Date("2025-04-20"),
    updatedAt: new Date("2025-10-30"),
  },
  {
    storeCode: "OVS-0006",
    businessName: "OVS Bologna Maggiore",
    address: "Piazza Maggiore 15, 40124 Bologna",
    squareMeters: 2500,
    status: "active",
    activationDate: new Date("2025-05-15"),
    closureDate: null,
    createdAt: new Date("2025-05-15"),
    updatedAt: new Date("2025-11-10"),
  },
  {
    storeCode: "OVS-0007",
    businessName: "OVS Venezia San Marco",
    address: "Calle Larga XXII Marzo, 30124 Venezia",
    squareMeters: 1800,
    status: "suspended",
    activationDate: new Date("2025-06-01"),
    closureDate: null,
    createdAt: new Date("2025-06-01"),
    updatedAt: new Date("2025-11-01"),
  },
  {
    storeCode: "OVS-0008",
    businessName: "OVS Palermo Liberty",
    address: "Via Libertà 100, 90143 Palermo",
    squareMeters: 2200,
    status: "active",
    activationDate: new Date("2025-07-10"),
    closureDate: null,
    createdAt: new Date("2025-07-10"),
    updatedAt: new Date("2025-11-05"),
  },
  {
    storeCode: "OVS-0009",
    businessName: "OVS Genova Porto Antico",
    address: "Via al Porto Antico 4, 16128 Genova",
    squareMeters: 1900,
    status: "inactive",
    activationDate: new Date("2025-03-01"),
    closureDate: new Date("2025-10-15"),
    createdAt: new Date("2025-03-01"),
    updatedAt: new Date("2025-10-15"),
  },
  {
    storeCode: "OVS-0010",
    businessName: "OVS Verona Arena",
    address: "Via Mazzini 50, 37121 Verona",
    squareMeters: 2000,
    status: "active",
    activationDate: new Date("2025-08-20"),
    closureDate: null,
    createdAt: new Date("2025-08-20"),
    updatedAt: new Date("2025-11-12"),
  },
];

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
function getStatusInfo(status: StoreStatus): {
  variant: "success" | "warning" | "error" | "info" | "neutral";
  label: string;
} {
  const map: Record<
    StoreStatus,
    { variant: "success" | "warning" | "error" | "info" | "neutral"; label: string }
  > = {
    active: { variant: "success", label: "Attivo" },
    pending: { variant: "warning", label: "In attesa" },
    inactive: { variant: "neutral", label: "Inattivo" },
    suspended: { variant: "error", label: "Sospeso" },
  };
  return map[status];
}

// Filter Chip Component
interface FilterChipProps {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}

function FilterChip(props: FilterChipProps) {
  const [isHovered, setIsHovered] = createSignal(false);

  const chipStyle = (): JSX.CSSProperties => ({
    display: "inline-flex",
    "align-items": "center",
    gap: "8px",
    padding: "8px 16px",
    "font-size": "0.8125rem",
    "font-weight": "500",
    color: props.active ? "var(--color-primary)" : "rgba(255, 255, 255, 0.7)",
    background: props.active
      ? "rgba(251, 186, 7, 0.15)"
      : isHovered()
        ? "rgba(255, 255, 255, 0.08)"
        : "transparent",
    border: `1px solid ${props.active ? "rgba(251, 186, 7, 0.3)" : "var(--glass-border-subtle)"}`,
    "border-radius": "var(--radius-full)",
    cursor: "pointer",
    transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
  });

  return (
    <button
      style={chipStyle()}
      onClick={props.onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {props.label}
      <Show when={props.count !== undefined}>
        <span
          style={{
            "font-size": "0.6875rem",
            padding: "2px 6px",
            background: props.active
              ? "var(--color-accent)"
              : "rgba(255, 255, 255, 0.15)",
            color: props.active ? "var(--color-primary)" : "rgba(255, 255, 255, 0.6)",
            "border-radius": "var(--radius-full)",
            "font-weight": "600",
          }}
        >
          {props.count}
        </span>
      </Show>
    </button>
  );
}

// Store Row Component
interface StoreRowProps {
  store: Store;
  onView: (store: Store) => void;
  onEdit: (store: Store) => void;
}

function StoreRow(props: StoreRowProps) {
  const [isHovered, setIsHovered] = createSignal(false);
  const statusInfo = () => getStatusInfo(props.store.status);

  const formatDate = (d: Date | null) =>
    d
      ? new Intl.DateTimeFormat("it-IT", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(d))
      : "-";

  const formatNumber = (n: number) => n.toLocaleString("it-IT");

  const rowStyle = (): JSX.CSSProperties => ({
    background: isHovered() ? "rgba(255, 255, 255, 0.04)" : "transparent",
    transition: "background 150ms ease",
  });

  return (
    <tr
      style={rowStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td
        style={{
          padding: "16px",
          "border-bottom": "1px solid var(--glass-border-subtle)",
        }}
      >
        <code
          style={{
            "font-family": "var(--font-mono)",
            "font-size": "0.8125rem",
            color: "var(--color-accent)",
            background: "rgba(251, 186, 7, 0.1)",
            padding: "4px 10px",
            "border-radius": "var(--radius-sm)",
          }}
        >
          {props.store.storeCode}
        </code>
      </td>
      <td
        style={{
          padding: "16px",
          "border-bottom": "1px solid var(--glass-border-subtle)",
        }}
      >
        <div style={{ display: "flex", "flex-direction": "column", gap: "4px" }}>
          <span style={{ color: "white", "font-weight": "500" }}>
            {props.store.businessName}
          </span>
          <span
            style={{
              "font-size": "0.75rem",
              color: "rgba(255, 255, 255, 0.5)",
            }}
          >
            {props.store.address}
          </span>
        </div>
      </td>
      <td
        style={{
          padding: "16px",
          color: "rgba(255, 255, 255, 0.8)",
          "border-bottom": "1px solid var(--glass-border-subtle)",
          "text-align": "right",
          "font-family": "var(--font-mono)",
          "font-size": "0.875rem",
        }}
      >
        {formatNumber(props.store.squareMeters)} mq
      </td>
      <td
        style={{
          padding: "16px",
          color: "rgba(255, 255, 255, 0.7)",
          "border-bottom": "1px solid var(--glass-border-subtle)",
        }}
      >
        {formatDate(props.store.activationDate)}
      </td>
      <td
        style={{
          padding: "16px",
          "border-bottom": "1px solid var(--glass-border-subtle)",
        }}
      >
        <SpatialBadge variant={statusInfo().variant} size="sm">
          {statusInfo().label}
        </SpatialBadge>
      </td>
      <td
        style={{
          padding: "16px",
          "border-bottom": "1px solid var(--glass-border-subtle)",
        }}
      >
        <div style={{ display: "flex", gap: "8px", "justify-content": "flex-end" }}>
          <SpatialButton variant="ghost" size="sm" onClick={() => props.onView(props.store)}>
            Dettagli
          </SpatialButton>
          <SpatialButton variant="ghost" size="sm" onClick={() => props.onEdit(props.store)}>
            Modifica
          </SpatialButton>
        </div>
      </td>
    </tr>
  );
}

// Store Detail Modal
interface StoreDetailModalProps {
  store: Store | null;
  onClose: () => void;
}

function StoreDetailModal(props: StoreDetailModalProps) {
  const formatDate = (d: Date | null) =>
    d
      ? new Intl.DateTimeFormat("it-IT", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }).format(new Date(d))
      : "-";

  const formatNumber = (n: number) => n.toLocaleString("it-IT");

  // Calculate estimated premium (mock calculation)
  const estimatedPremium = () => {
    if (!props.store) return 0;
    const ratePerMq = 6; // €6 per mq
    return props.store.squareMeters * ratePerMq;
  };

  return (
    <Show when={props.store}>
      <div
        style={{
          position: "fixed",
          inset: "0",
          background: "rgba(0, 0, 0, 0.6)",
          "backdrop-filter": "blur(8px)",
          "-webkit-backdrop-filter": "blur(8px)",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "z-index": "1000",
          padding: "24px",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) props.onClose();
        }}
      >
        <GlassCard
          variant="elevated"
          padding="xl"
          style={{
            width: "100%",
            "max-width": "600px",
            "max-height": "90vh",
            overflow: "auto",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              "align-items": "flex-start",
              "justify-content": "space-between",
              "margin-bottom": "32px",
            }}
          >
            <div>
              <div style={{ display: "flex", "align-items": "center", gap: "12px", "margin-bottom": "8px" }}>
                <code
                  style={{
                    "font-family": "var(--font-mono)",
                    "font-size": "0.875rem",
                    color: "var(--color-accent)",
                    background: "rgba(251, 186, 7, 0.1)",
                    padding: "6px 12px",
                    "border-radius": "var(--radius-sm)",
                  }}
                >
                  {props.store!.storeCode}
                </code>
                <SpatialBadge variant={getStatusInfo(props.store!.status).variant} size="sm">
                  {getStatusInfo(props.store!.status).label}
                </SpatialBadge>
              </div>
              <h2
                style={{
                  "font-size": "1.5rem",
                  "font-weight": "700",
                  color: "white",
                  "letter-spacing": "-0.02em",
                }}
              >
                {props.store!.businessName}
              </h2>
            </div>
            <button
              onClick={props.onClose}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                "border-radius": "var(--radius-full)",
                width: "36px",
                height: "36px",
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                cursor: "pointer",
                color: "white",
                "font-size": "1.25rem",
                transition: "background 200ms",
              }}
            >
              ×
            </button>
          </div>

          {/* Info Grid */}
          <div
            style={{
              display: "grid",
              "grid-template-columns": "repeat(2, 1fr)",
              gap: "24px",
              "margin-bottom": "32px",
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
                  "margin-bottom": "8px",
                }}
              >
                Indirizzo
              </span>
              <span style={{ color: "white" }}>{props.store!.address}</span>
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
                  "margin-bottom": "8px",
                }}
              >
                Superficie
              </span>
              <span
                style={{
                  color: "white",
                  "font-family": "var(--font-mono)",
                  "font-size": "1.25rem",
                  "font-weight": "600",
                }}
              >
                {formatNumber(props.store!.squareMeters)} mq
              </span>
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
                  "margin-bottom": "8px",
                }}
              >
                Data Attivazione
              </span>
              <span style={{ color: "white" }}>{formatDate(props.store!.activationDate)}</span>
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
                  "margin-bottom": "8px",
                }}
              >
                Ultimo Aggiornamento
              </span>
              <span style={{ color: "white" }}>{formatDate(props.store!.updatedAt)}</span>
            </div>
          </div>

          {/* Premium Estimate */}
          <div
            style={{
              padding: "20px",
              background: "rgba(251, 186, 7, 0.1)",
              border: "1px solid rgba(251, 186, 7, 0.2)",
              "border-radius": "var(--radius-lg)",
              "margin-bottom": "24px",
            }}
          >
            <span
              style={{
                "font-size": "0.6875rem",
                "font-weight": "600",
                "letter-spacing": "0.08em",
                "text-transform": "uppercase",
                color: "rgba(255, 255, 255, 0.5)",
                display: "block",
                "margin-bottom": "8px",
              }}
            >
              Premio Stimato Annuale
            </span>
            <span
              style={{
                "font-size": "1.75rem",
                "font-weight": "700",
                color: "var(--color-accent)",
                "font-family": "var(--font-mono)",
              }}
            >
              €{formatNumber(estimatedPremium())}
            </span>
            <span
              style={{
                "font-size": "0.75rem",
                color: "rgba(255, 255, 255, 0.4)",
                "margin-left": "8px",
              }}
            >
              ({formatNumber(props.store!.squareMeters)} mq × €6/mq)
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "12px", "justify-content": "flex-end" }}>
            <SpatialButton variant="ghost" onClick={props.onClose}>
              Chiudi
            </SpatialButton>
            <SpatialButton variant="primary">
              Genera Certificato
            </SpatialButton>
          </div>
        </GlassCard>
      </div>
    </Show>
  );
}

// Main Stores Page Component
export default function StoresPage() {
  const navigate = useNavigate();
  const [stores, setStores] = createSignal<Store[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [statusFilter, setStatusFilter] = createSignal<StoreStatus | "all">("all");
  const [selectedStore, setSelectedStore] = createSignal<Store | null>(null);

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
    // Simulate loading
    setTimeout(() => {
      setStores(mockStores);
      setIsLoading(false);
    }, 300);
  });

  const handleLogout = () => {
    authStore.logout();
    navigate("/login", { replace: true });
  };

  // Filter stores based on search and status
  const filteredStores = createMemo(() => {
    let result = stores();

    // Apply search filter
    const query = searchQuery().toLowerCase();
    if (query) {
      result = result.filter(
        (store) =>
          store.storeCode.toLowerCase().includes(query) ||
          store.businessName.toLowerCase().includes(query) ||
          store.address.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter() !== "all") {
      result = result.filter((store) => store.status === statusFilter());
    }

    return result;
  });

  // Count stores by status
  const statusCounts = createMemo(() => {
    const all = stores();
    return {
      all: all.length,
      active: all.filter((s) => s.status === "active").length,
      pending: all.filter((s) => s.status === "pending").length,
      inactive: all.filter((s) => s.status === "inactive").length,
      suspended: all.filter((s) => s.status === "suspended").length,
    };
  });

  const handleViewStore = (store: Store) => {
    setSelectedStore(store);
  };

  const handleEditStore = (store: Store) => {
    // For now, just show the detail modal
    setSelectedStore(store);
  };

  return (
    <>
      <SpatialBackground animated variant="default" />

      <div style={{ display: "flex", "min-height": "100vh" }}>
        {/* Sidebar */}
        <Sidebar
          currentPath="/admin/stores"
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
                    border: "2px solid var(--color-accent)",
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
            <header
              style={{
                display: "flex",
                "align-items": "flex-start",
                "justify-content": "space-between",
                "margin-bottom": "32px",
              }}
            >
              <div>
                <h2
                  style={{
                    "font-size": "1.75rem",
                    "font-weight": "700",
                    color: "white",
                    "letter-spacing": "-0.02em",
                    "margin-bottom": "8px",
                  }}
                >
                  Punti Vendita
                </h2>
                <p
                  style={{
                    "font-size": "0.9375rem",
                    color: "rgba(255, 255, 255, 0.5)",
                  }}
                >
                  Gestisci l'anagrafica dei punti vendita OVS
                </p>
              </div>
              <SpatialButton variant="primary">
                + Aggiungi Store
              </SpatialButton>
            </header>

            {/* Search and Filters */}
            <div style={{ "margin-bottom": "24px" }}>
              {/* Search Input */}
              <div style={{ "margin-bottom": "16px", "max-width": "400px" }}>
                <div
                  style={{
                    display: "flex",
                    "align-items": "center",
                    gap: "12px",
                    padding: "12px 16px",
                    background: "var(--glass-bg)",
                    "backdrop-filter": "blur(20px)",
                    "-webkit-backdrop-filter": "blur(20px)",
                    border: "1px solid var(--glass-border-subtle)",
                    "border-radius": "var(--radius-lg)",
                  }}
                >
                  <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Cerca per codice, nome o indirizzo..."
                    value={searchQuery()}
                    onInput={(e) => setSearchQuery(e.currentTarget.value)}
                    style={{
                      flex: "1",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "white",
                      "font-size": "0.9375rem",
                    }}
                  />
                  <Show when={searchQuery()}>
                    <button
                      onClick={() => setSearchQuery("")}
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "none",
                        "border-radius": "var(--radius-full)",
                        width: "24px",
                        height: "24px",
                        display: "flex",
                        "align-items": "center",
                        "justify-content": "center",
                        cursor: "pointer",
                        color: "rgba(255, 255, 255, 0.6)",
                        "font-size": "0.875rem",
                      }}
                    >
                      ×
                    </button>
                  </Show>
                </div>
              </div>

              {/* Status Filters */}
              <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
                <FilterChip
                  label="Tutti"
                  count={statusCounts().all}
                  active={statusFilter() === "all"}
                  onClick={() => setStatusFilter("all")}
                />
                <FilterChip
                  label="Attivi"
                  count={statusCounts().active}
                  active={statusFilter() === "active"}
                  onClick={() => setStatusFilter("active")}
                />
                <FilterChip
                  label="In attesa"
                  count={statusCounts().pending}
                  active={statusFilter() === "pending"}
                  onClick={() => setStatusFilter("pending")}
                />
                <FilterChip
                  label="Inattivi"
                  count={statusCounts().inactive}
                  active={statusFilter() === "inactive"}
                  onClick={() => setStatusFilter("inactive")}
                />
                <FilterChip
                  label="Sospesi"
                  count={statusCounts().suspended}
                  active={statusFilter() === "suspended"}
                  onClick={() => setStatusFilter("suspended")}
                />
              </div>
            </div>

            {/* Results Summary */}
            <div
              style={{
                "margin-bottom": "16px",
                "font-size": "0.8125rem",
                color: "rgba(255, 255, 255, 0.5)",
              }}
            >
              {filteredStores().length} {filteredStores().length === 1 ? "risultato" : "risultati"}
              {searchQuery() && ` per "${searchQuery()}"`}
            </div>

            {/* Stores Table */}
            <GlassCard padding="none">
              <Show
                when={filteredStores().length > 0}
                fallback={
                  <div
                    style={{
                      padding: "64px",
                      "text-align": "center",
                      color: "rgba(255, 255, 255, 0.4)",
                    }}
                  >
                    <div
                      style={{
                        "font-size": "3rem",
                        "margin-bottom": "16px",
                        opacity: "0.5",
                      }}
                    >
                      🏪
                    </div>
                    <p style={{ "margin-bottom": "8px" }}>Nessun punto vendita trovato</p>
                    <p style={{ "font-size": "0.8125rem" }}>
                      Prova a modificare i filtri di ricerca
                    </p>
                  </div>
                }
              >
                <div style={{ overflow: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      "border-collapse": "collapse",
                      "font-size": "0.875rem",
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
                          Nome / Indirizzo
                        </th>
                        <th
                          style={{
                            padding: "14px 16px",
                            "text-align": "right",
                            "font-weight": "600",
                            color: "rgba(255, 255, 255, 0.5)",
                            "border-bottom": "1px solid var(--glass-border-subtle)",
                            "font-size": "0.6875rem",
                            "letter-spacing": "0.06em",
                            "text-transform": "uppercase",
                          }}
                        >
                          Superficie
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
                          Attivazione
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
                        <th
                          style={{
                            padding: "14px 16px",
                            "text-align": "right",
                            "font-weight": "600",
                            color: "rgba(255, 255, 255, 0.5)",
                            "border-bottom": "1px solid var(--glass-border-subtle)",
                            "font-size": "0.6875rem",
                            "letter-spacing": "0.06em",
                            "text-transform": "uppercase",
                          }}
                        >
                          Azioni
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={filteredStores()}>
                        {(store) => (
                          <StoreRow
                            store={store}
                            onView={handleViewStore}
                            onEdit={handleEditStore}
                          />
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </Show>
            </GlassCard>
          </Show>
        </main>
      </div>

      {/* Store Detail Modal */}
      <StoreDetailModal
        store={selectedStore()}
        onClose={() => setSelectedStore(null)}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
