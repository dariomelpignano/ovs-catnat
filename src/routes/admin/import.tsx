// =============================================================================
// Import Page - Spatial Design
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
  NavItem,
} from "~/components/ui";
import { importQueue, type ImportJob } from "~/lib/ingestion";

// Sidebar Component (shared with admin dashboard)
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
              "linear-gradient(135deg, var(--color-primary) 0%, #c41230 100%)",
            "border-radius": "12px",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            "font-size": "1.25rem",
            "box-shadow": "0 4px 16px var(--color-primary-glow)",
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
          <SpatialBadge variant="error" size="sm">
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
function getStatusInfo(status: string): {
  variant: "success" | "warning" | "error" | "info" | "neutral";
  label: string;
} {
  const map: Record<
    string,
    { variant: "success" | "warning" | "error" | "info" | "neutral"; label: string }
  > = {
    completed: { variant: "success", label: "Completato" },
    processing: { variant: "warning", label: "In elaborazione" },
    queued: { variant: "info", label: "In coda" },
    failed: { variant: "error", label: "Fallito" },
  };
  return map[status] || { variant: "neutral", label: status };
}

// Drop Zone Component
interface DropZoneProps {
  isDragging: boolean;
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

function DropZone(props: DropZoneProps) {
  const [isHovered, setIsHovered] = createSignal(false);

  const zoneStyle = (): JSX.CSSProperties => ({
    border: `2px dashed ${
      props.isDragging
        ? "var(--color-primary)"
        : props.selectedFile
          ? "var(--color-success)"
          : isHovered()
            ? "rgba(255, 255, 255, 0.3)"
            : "var(--glass-border)"
    }`,
    "border-radius": "var(--radius-xl)",
    padding: "48px",
    background: props.isDragging
      ? "rgba(227, 24, 55, 0.1)"
      : props.selectedFile
        ? "rgba(52, 211, 153, 0.1)"
        : "var(--glass-bg)",
    "backdrop-filter": "blur(32px) saturate(180%)",
    "-webkit-backdrop-filter": "blur(32px) saturate(180%)",
    transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
    "text-align": "center",
    transform: props.isDragging ? "scale(1.02)" : "scale(1)",
  });

  return (
    <div
      style={zoneStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer?.files?.[0]) {
          props.onFileSelect(e.dataTransfer.files[0]);
        }
      }}
    >
      <Show
        when={!props.selectedFile}
        fallback={
          <div
            style={{
              display: "flex",
              "align-items": "center",
              gap: "20px",
              "justify-content": "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                background: "rgba(52, 211, 153, 0.2)",
                "border-radius": "var(--radius-lg)",
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                "font-size": "1.75rem",
              }}
            >
              📄
            </div>
            <div style={{ "text-align": "left" }}>
              <span
                style={{
                  "font-weight": "600",
                  color: "white",
                  display: "block",
                  "margin-bottom": "4px",
                }}
              >
                {props.selectedFile?.name}
              </span>
              <span
                style={{
                  "font-size": "0.8125rem",
                  color: "rgba(255, 255, 255, 0.5)",
                }}
              >
                {((props.selectedFile?.size ?? 0) / 1024).toFixed(1)} KB
              </span>
            </div>
            <SpatialButton variant="ghost" size="sm" onClick={props.onRemove}>
              Rimuovi
            </SpatialButton>
          </div>
        }
      >
        <div
          style={{
            "font-size": "3.5rem",
            "margin-bottom": "16px",
            opacity: props.isDragging ? "1" : "0.6",
            transition: "opacity 200ms",
          }}
        >
          📥
        </div>
        <p
          style={{
            color: "rgba(255, 255, 255, 0.6)",
            "margin-bottom": "20px",
            "font-size": "0.9375rem",
          }}
        >
          Trascina qui il file oppure
        </p>
        <label>
          <SpatialButton variant="primary" as="span">
            Seleziona File
          </SpatialButton>
          <input
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={(e) => {
              if (e.currentTarget.files?.[0]) {
                props.onFileSelect(e.currentTarget.files[0]);
              }
            }}
            hidden
          />
        </label>
        <p
          style={{
            "font-size": "0.75rem",
            color: "rgba(255, 255, 255, 0.4)",
            "margin-top": "16px",
          }}
        >
          CSV, XLS o XLSX (max 10MB)
        </p>
      </Show>
    </div>
  );
}

// Progress Bar Component
function ProgressBar(props: { value: number }) {
  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          flex: "1",
          height: "6px",
          background: "rgba(255, 255, 255, 0.1)",
          "border-radius": "var(--radius-full)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            background:
              "linear-gradient(90deg, var(--color-primary) 0%, #ff4d6a 100%)",
            "border-radius": "var(--radius-full)",
            width: `${props.value}%`,
            transition: "width 300ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
      <span
        style={{
          "font-size": "0.75rem",
          color: "rgba(255, 255, 255, 0.5)",
          "min-width": "40px",
          "text-align": "right",
          "font-family": "var(--font-mono)",
        }}
      >
        {props.value}%
      </span>
    </div>
  );
}

export default function ImportPage() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = createSignal(false);
  const [jobs, setJobs] = createSignal<ImportJob[]>([]);
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null);
  const [isUploading, setIsUploading] = createSignal(false);
  const [uploadError, setUploadError] = createSignal("");

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
    setJobs(importQueue.getAllJobs());
    const unsubscribe = importQueue.subscribe(() =>
      setJobs(importQueue.getAllJobs())
    );
    return () => unsubscribe();
  });

  const handleLogout = () => {
    authStore.logout();
    navigate("/login", { replace: true });
  };

  const handleFileSelect = (file: File) => {
    setUploadError("");
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (![".csv", ".xls", ".xlsx"].includes(ext)) {
      setUploadError("Formato file non supportato. Usa CSV o Excel.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File troppo grande. Massimo 10MB.");
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    const file = selectedFile();
    if (!file) return;
    setIsUploading(true);
    setUploadError("");
    try {
      const content = await file.text();
      const userRole = authStore.getCurrentRole();
      if (!userRole) {
        setUploadError("Sessione scaduta. Effettuare nuovamente il login.");
        return;
      }
      importQueue.enqueue(
        file.name,
        content,
        authStore.user()?.email ?? "unknown",
        userRole
      );
      setSelectedFile(null);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Errore durante il caricamento del file."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(d));

  return (
    <>
      <SpatialBackground animated variant="default" />

      <div style={{ display: "flex", "min-height": "100vh" }}>
        {/* Sidebar */}
        <Sidebar
          currentPath="/admin/import"
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
              Importazione Dati
            </h2>
            <p
              style={{
                "font-size": "0.9375rem",
                color: "rgba(255, 255, 255, 0.5)",
              }}
            >
              Carica file Excel o CSV con l'elenco dei punti vendita OVS
            </p>
          </header>

          {/* Upload Section */}
          <section style={{ "margin-bottom": "32px" }}>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={() => setIsDragging(false)}
            >
              <DropZone
                isDragging={isDragging()}
                selectedFile={selectedFile()}
                onFileSelect={handleFileSelect}
                onRemove={() => setSelectedFile(null)}
              />
            </div>

            {/* Error Message */}
            <Show when={uploadError()}>
              <div
                style={{
                  "margin-top": "16px",
                  padding: "14px 18px",
                  background: "rgba(248, 113, 113, 0.15)",
                  border: "1px solid rgba(248, 113, 113, 0.3)",
                  "border-radius": "var(--radius-lg)",
                  display: "flex",
                  "align-items": "center",
                  gap: "12px",
                }}
              >
                <span style={{ "font-size": "1.25rem" }}>⚠️</span>
                <span
                  style={{
                    "font-size": "0.875rem",
                    color: "var(--color-error)",
                  }}
                >
                  {uploadError()}
                </span>
              </div>
            </Show>

            {/* Upload Button */}
            <Show when={selectedFile()}>
              <div
                style={{
                  "margin-top": "20px",
                  display: "flex",
                  "justify-content": "flex-end",
                }}
              >
                <SpatialButton
                  variant="primary"
                  onClick={handleUpload}
                  loading={isUploading()}
                >
                  Avvia Importazione
                </SpatialButton>
              </div>
            </Show>
          </section>

          {/* Expected Format Section */}
          <section style={{ "margin-bottom": "32px" }}>
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
              Formato Atteso
            </h3>
            <GlassCard>
              <p
                style={{
                  "margin-bottom": "20px",
                  color: "rgba(255, 255, 255, 0.6)",
                  "font-size": "0.9375rem",
                }}
              >
                Il file deve contenere le seguenti colonne:
              </p>
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
                        Colonna
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
                        Obbligatorio
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
                        Descrizione
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        style={{
                          padding: "14px 16px",
                          "border-bottom": "1px solid var(--glass-border-subtle)",
                        }}
                      >
                        <code
                          style={{
                            background: "rgba(255, 255, 255, 0.08)",
                            padding: "4px 10px",
                            "border-radius": "var(--radius-sm)",
                            "font-family": "var(--font-mono)",
                            "font-size": "0.75rem",
                            color: "white",
                          }}
                        >
                          Codice Punto Vendita
                        </code>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          "border-bottom": "1px solid var(--glass-border-subtle)",
                        }}
                      >
                        <SpatialBadge variant="error" size="sm">
                          Si
                        </SpatialBadge>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          color: "rgba(255, 255, 255, 0.7)",
                          "border-bottom": "1px solid var(--glass-border-subtle)",
                        }}
                      >
                        Identificativo univoco del negozio
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          padding: "14px 16px",
                          "border-bottom": "1px solid var(--glass-border-subtle)",
                        }}
                      >
                        <code
                          style={{
                            background: "rgba(255, 255, 255, 0.08)",
                            padding: "4px 10px",
                            "border-radius": "var(--radius-sm)",
                            "font-family": "var(--font-mono)",
                            "font-size": "0.75rem",
                            color: "white",
                          }}
                        >
                          Ragione Sociale
                        </code>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          "border-bottom": "1px solid var(--glass-border-subtle)",
                        }}
                      >
                        <SpatialBadge variant="info" size="sm">
                          No
                        </SpatialBadge>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          color: "rgba(255, 255, 255, 0.7)",
                          "border-bottom": "1px solid var(--glass-border-subtle)",
                        }}
                      >
                        Nome del punto vendita
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          padding: "14px 16px",
                          "border-bottom": "1px solid var(--glass-border-subtle)",
                        }}
                      >
                        <code
                          style={{
                            background: "rgba(255, 255, 255, 0.08)",
                            padding: "4px 10px",
                            "border-radius": "var(--radius-sm)",
                            "font-family": "var(--font-mono)",
                            "font-size": "0.75rem",
                            color: "white",
                          }}
                        >
                          Indirizzo
                        </code>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          "border-bottom": "1px solid var(--glass-border-subtle)",
                        }}
                      >
                        <SpatialBadge variant="info" size="sm">
                          No
                        </SpatialBadge>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          color: "rgba(255, 255, 255, 0.7)",
                          "border-bottom": "1px solid var(--glass-border-subtle)",
                        }}
                      >
                        Ubicazione del rischio assicurato
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          padding: "14px 16px",
                          "border-bottom": "1px solid var(--glass-border-subtle)",
                        }}
                      >
                        <code
                          style={{
                            background: "rgba(255, 255, 255, 0.08)",
                            padding: "4px 10px",
                            "border-radius": "var(--radius-sm)",
                            "font-family": "var(--font-mono)",
                            "font-size": "0.75rem",
                            color: "white",
                          }}
                        >
                          Metri Quadri
                        </code>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          "border-bottom": "1px solid var(--glass-border-subtle)",
                        }}
                      >
                        <SpatialBadge variant="error" size="sm">
                          Si
                        </SpatialBadge>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          color: "rgba(255, 255, 255, 0.7)",
                          "border-bottom": "1px solid var(--glass-border-subtle)",
                        }}
                      >
                        Superficie in mq per calcolo premio
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </section>

          {/* Import History Section */}
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
              Storico Importazioni
            </h3>
            <GlassCard padding="none">
              <Show
                when={jobs().length > 0}
                fallback={
                  <div
                    style={{
                      padding: "48px",
                      "text-align": "center",
                      color: "rgba(255, 255, 255, 0.4)",
                    }}
                  >
                    <div
                      style={{
                        "font-size": "2.5rem",
                        "margin-bottom": "12px",
                        opacity: "0.5",
                      }}
                    >
                      📂
                    </div>
                    <p>Nessuna importazione effettuata</p>
                  </div>
                }
              >
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
                          ID
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
                            width: "200px",
                          }}
                        >
                          Progresso
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
                      <For each={jobs()}>
                        {(job) => {
                          const statusInfo = getStatusInfo(job.status);
                          return (
                            <tr>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  "font-family": "var(--font-mono)",
                                  "font-size": "0.75rem",
                                  color: "rgba(255, 255, 255, 0.6)",
                                  "border-bottom":
                                    "1px solid var(--glass-border-subtle)",
                                }}
                              >
                                {job.jobId.slice(-8)}
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  color: "white",
                                  "border-bottom":
                                    "1px solid var(--glass-border-subtle)",
                                }}
                              >
                                {job.filename}
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  color: "rgba(255, 255, 255, 0.7)",
                                  "border-bottom":
                                    "1px solid var(--glass-border-subtle)",
                                }}
                              >
                                {formatDate(job.createdAt)}
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  "border-bottom":
                                    "1px solid var(--glass-border-subtle)",
                                }}
                              >
                                <ProgressBar value={job.progress} />
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  "border-bottom":
                                    "1px solid var(--glass-border-subtle)",
                                }}
                              >
                                <SpatialBadge
                                  variant={statusInfo.variant}
                                  size="sm"
                                >
                                  {statusInfo.label}
                                </SpatialBadge>
                              </td>
                            </tr>
                          );
                        }}
                      </For>
                    </tbody>
                  </table>
                </div>
              </Show>
            </GlassCard>
          </section>
        </main>
      </div>
    </>
  );
}
