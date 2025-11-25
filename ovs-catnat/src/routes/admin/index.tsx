// =============================================================================
// Admin Portal - Dashboard
// Aligned with ARCHITECTURE.md - Admin Portal (MAG/OVS HQ)
// =============================================================================

import { createSignal, onMount, Show, For } from "solid-js";
import { useNavigate, A } from "@solidjs/router";
import { authStore } from "~/stores/auth.store";
import type { Store, FileImport, AdminDashboard } from "~/types";
import "./admin.css";

// Mock data for development
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

const mockRecentStores: Store[] = [
  {
    storeCode: "OVS-1247",
    businessName: "OVS Roma Via del Corso",
    address: "Via del Corso 123, 00186 Roma",
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
    address: "Via Calzaiuoli 45, 50122 Firenze",
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
    address: "Galleria Umberto I 78, 80132 Napoli",
    squareMeters: 2100,
    status: "pending",
    activationDate: null,
    closureDate: null,
    createdAt: new Date("2025-11-08"),
    updatedAt: new Date("2025-11-08"),
  },
];

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

    // Load dashboard data
    setTimeout(() => {
      setDashboard(mockDashboard);
      setRecentStores(mockRecentStores);
      setIsLoading(false);
    }, 500);
  });

  const handleLogout = () => {
    authStore.logout();
    navigate("/login", { replace: true });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
      case "completed":
        return <span class="badge badge-success">{status}</span>;
      case "pending":
      case "processing":
        return <span class="badge badge-warning">{status}</span>;
      case "inactive":
      case "failed":
        return <span class="badge badge-error">{status}</span>;
      default:
        return <span class="badge badge-info">{status}</span>;
    }
  };

  return (
    <div class="admin-portal">
      {/* Sidebar */}
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <h1 class="sidebar-logo">OVS CatNat</h1>
          <span class="sidebar-badge">Admin</span>
        </div>

        <nav class="sidebar-nav">
          <A href="/admin" class="nav-item active">
            <span class="nav-icon">📊</span>
            Dashboard
          </A>
          <A href="/admin/stores" class="nav-item">
            <span class="nav-icon">🏪</span>
            Punti Vendita
          </A>
          <A href="/admin/import" class="nav-item">
            <span class="nav-icon">📥</span>
            Importazione
          </A>
          <A href="/admin/policies" class="nav-item">
            <span class="nav-icon">📋</span>
            Polizze
          </A>
          <A href="/admin/reports" class="nav-item">
            <span class="nav-icon">📈</span>
            Report
          </A>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <span class="user-avatar">👤</span>
            <div class="user-details">
              <span class="user-name">{authStore.user()?.name}</span>
              <span class="user-role">{authStore.user()?.role}</span>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" onClick={handleLogout}>
            Esci
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main class="admin-main">
        <Show when={!isLoading()} fallback={<div class="loading">Caricamento...</div>}>
          {/* Page Header */}
          <header class="page-header">
            <h2>Dashboard</h2>
            <p>Panoramica della gestione polizze OVS</p>
          </header>

          {/* Stats Cards */}
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon stat-icon-primary">🏪</div>
              <div class="stat-content">
                <span class="stat-value">{dashboard()?.totalStores.toLocaleString("it-IT")}</span>
                <span class="stat-label">Punti Vendita Totali</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon stat-icon-success">✓</div>
              <div class="stat-content">
                <span class="stat-value">{dashboard()?.activeStores.toLocaleString("it-IT")}</span>
                <span class="stat-label">Store Attivi</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon stat-icon-warning">💰</div>
              <div class="stat-content">
                <span class="stat-value">{formatCurrency(dashboard()?.totalPremium ?? 0)}</span>
                <span class="stat-label">Premio Totale</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon stat-icon-info">⚡</div>
              <div class="stat-content">
                <span class="stat-value">{dashboard()?.pendingActions}</span>
                <span class="stat-label">Azioni Pendenti</span>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div class="content-grid">
            {/* Recent Imports */}
            <section class="content-section">
              <div class="section-header">
                <h3>Importazioni Recenti</h3>
                <A href="/admin/import" class="btn btn-outline btn-sm">
                  Vedi tutte
                </A>
              </div>
              <div class="card">
                <table class="table">
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Data</th>
                      <th>Record</th>
                      <th>Stato</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={dashboard()?.recentImports}>
                      {(imp) => (
                        <tr>
                          <td>{imp.filename}</td>
                          <td>{formatDate(imp.uploadedAt)}</td>
                          <td>
                            {imp.processedRecords}/{imp.totalRecords}
                            <Show when={imp.errorRecords > 0}>
                              <span class="text-error"> ({imp.errorRecords} errori)</span>
                            </Show>
                          </td>
                          <td>{getStatusBadge(imp.status)}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Recent Stores */}
            <section class="content-section">
              <div class="section-header">
                <h3>Store Recenti</h3>
                <A href="/admin/stores" class="btn btn-outline btn-sm">
                  Vedi tutti
                </A>
              </div>
              <div class="card">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Codice</th>
                      <th>Nome</th>
                      <th>mq</th>
                      <th>Stato</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={recentStores()}>
                      {(store) => (
                        <tr>
                          <td class="font-mono">{store.storeCode}</td>
                          <td>{store.businessName}</td>
                          <td>{store.squareMeters.toLocaleString("it-IT")}</td>
                          <td>{getStatusBadge(store.status)}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Quick Actions */}
          <section class="quick-actions">
            <h3>Azioni Rapide</h3>
            <div class="actions-grid">
              <A href="/admin/import" class="action-card">
                <span class="action-icon">📥</span>
                <span class="action-title">Importa Store</span>
                <span class="action-desc">Carica file Excel/CSV</span>
              </A>
              <A href="/admin/reports/export" class="action-card">
                <span class="action-icon">📤</span>
                <span class="action-title">Esporta Report</span>
                <span class="action-desc">Per compagnia assicurativa</span>
              </A>
              <A href="/admin/stores/add" class="action-card">
                <span class="action-icon">➕</span>
                <span class="action-title">Aggiungi Store</span>
                <span class="action-desc">Inserimento manuale</span>
              </A>
              <A href="/admin/audit" class="action-card">
                <span class="action-icon">📜</span>
                <span class="action-title">Audit Log</span>
                <span class="action-desc">Storico variazioni</span>
              </A>
            </div>
          </section>
        </Show>
      </main>
    </div>
  );
}
