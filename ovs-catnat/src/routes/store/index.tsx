// =============================================================================
// Store Portal - My Policy Dashboard
// Aligned with ARCHITECTURE.md Section 3.2 Frontend (Store Manager UX)
// =============================================================================

import { createSignal, onMount, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { authStore } from "~/stores/auth.store";
import type { Store, Policy, Certificate } from "~/types";
import "./store.css";

// Mock data for development - will be replaced with API calls
const mockStoreData: Store = {
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

const mockPolicyData: Policy = {
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

const mockCertificate: Certificate = {
  certId: "CERT-POL-OVS-001-2025",
  policyId: "POL-OVS-001-2025",
  issueDate: new Date("2025-01-01"),
  documentUrl: "/documents/certificates/POL-OVS-001-2025.pdf",
  validFrom: new Date("2025-01-01"),
  validTo: new Date("2025-12-31"),
  createdAt: new Date("2025-01-01"),
};

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

    // Load store data
    // TODO: Replace with actual API call
    setTimeout(() => {
      setStore(mockStoreData);
      setPolicy(mockPolicyData);
      setCertificate(mockCertificate);
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
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  };

  const getCoverageStatus = () => {
    const p = policy();
    if (!p) return "not_covered";
    if (p.status !== "active") return "not_covered";

    const daysUntilExpiry = Math.ceil(
      (new Date(p.effectiveTo).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry <= 30) return "expiring_soon";
    return "covered";
  };

  const getStatusBadge = () => {
    const status = getCoverageStatus();
    switch (status) {
      case "covered":
        return <span class="badge badge-success">Copertura Attiva</span>;
      case "expiring_soon":
        return <span class="badge badge-warning">In Scadenza</span>;
      default:
        return <span class="badge badge-error">Non Coperto</span>;
    }
  };

  return (
    <div class="store-portal">
      {/* Header */}
      <header class="store-header">
        <div class="container">
          <div class="header-content">
            <div class="header-brand">
              <h1>OVS CatNat</h1>
              <span class="header-divider">|</span>
              <span class="header-subtitle">La Mia Polizza</span>
            </div>
            <div class="header-user">
              <span class="user-name">{authStore.user()?.name}</span>
              <button class="btn btn-outline" onClick={handleLogout}>
                Esci
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main class="store-main">
        <div class="container">
          <Show when={!isLoading()} fallback={<div class="loading">Caricamento...</div>}>
            {/* Coverage Status Banner */}
            <div class={`status-banner status-${getCoverageStatus()}`}>
              <div class="status-content">
                <div class="status-icon">
                  <Show when={getCoverageStatus() === "covered"} fallback="⚠️">
                    ✓
                  </Show>
                </div>
                <div class="status-text">
                  <Show
                    when={getCoverageStatus() === "covered"}
                    fallback={
                      <p>La tua copertura assicurativa richiede attenzione</p>
                    }
                  >
                    <p>Il tuo punto vendita è regolarmente assicurato</p>
                  </Show>
                </div>
                {getStatusBadge()}
              </div>
            </div>

            {/* Store Info Card */}
            <section class="dashboard-section">
              <h2 class="section-title">Dati Punto Vendita</h2>
              <div class="card">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Codice</span>
                    <span class="info-value">{store()?.storeCode}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Ragione Sociale</span>
                    <span class="info-value">{store()?.businessName}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Ubicazione Rischio</span>
                    <span class="info-value">{store()?.address}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Superficie</span>
                    <span class="info-value">{store()?.squareMeters?.toLocaleString("it-IT")} mq</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Policy Details Card */}
            <Show when={policy()}>
              <section class="dashboard-section">
                <h2 class="section-title">Dettagli Copertura</h2>
                <div class="card">
                  <div class="coverage-grid">
                    <div class="coverage-item coverage-highlight">
                      <span class="coverage-label">Somma Assicurata</span>
                      <span class="coverage-value">{formatCurrency(policy()!.insuredSum)}</span>
                    </div>
                    <div class="coverage-item">
                      <span class="coverage-label">Premio Annuo</span>
                      <span class="coverage-value">{formatCurrency(policy()!.premium)}</span>
                    </div>
                    <div class="coverage-item">
                      <span class="coverage-label">Tipo Copertura</span>
                      <span class="coverage-value coverage-type">
                        {policy()!.coverageType === "catnat" ? "Catastrofi Naturali" : "Property"}
                      </span>
                    </div>
                    <div class="coverage-item">
                      <span class="coverage-label">Validità</span>
                      <span class="coverage-value">
                        {formatDate(policy()!.effectiveFrom)} - {formatDate(policy()!.effectiveTo)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </Show>

            {/* Documents Section */}
            <section class="dashboard-section">
              <h2 class="section-title">Documenti</h2>
              <div class="documents-grid">
                <Show when={certificate()}>
                  <a href={certificate()!.documentUrl} class="document-card" download>
                    <div class="document-icon">📄</div>
                    <div class="document-info">
                      <span class="document-title">Certificato di Assicurazione</span>
                      <span class="document-meta">
                        Emesso il {formatDate(certificate()!.issueDate)}
                      </span>
                    </div>
                    <span class="document-action">Scarica</span>
                  </a>
                </Show>

                <a href="/documents/policy-conditions.pdf" class="document-card" download>
                  <div class="document-icon">📋</div>
                  <div class="document-info">
                    <span class="document-title">Condizioni di Polizza</span>
                    <span class="document-meta">Fascicolo Informativo</span>
                  </div>
                  <span class="document-action">Scarica</span>
                </a>

                <a href="/documents/claims-guide.pdf" class="document-card" download>
                  <div class="document-icon">🔧</div>
                  <div class="document-info">
                    <span class="document-title">Guida Sinistri</span>
                    <span class="document-meta">Cosa fare in caso di sinistro</span>
                  </div>
                  <span class="document-action">Scarica</span>
                </a>
              </div>
            </section>

            {/* Claims Section */}
            <section class="dashboard-section">
              <h2 class="section-title">Hai subito un danno?</h2>
              <div class="card claims-card">
                <div class="claims-content">
                  <p>
                    In caso di sinistro, segui questi passaggi:
                  </p>
                  <ol class="claims-steps">
                    <li>Metti in sicurezza persone e beni</li>
                    <li>Documenta i danni con foto e video</li>
                    <li>Non effettuare riparazioni prima della perizia</li>
                    <li>Contatta immediatamente i nostri uffici</li>
                  </ol>
                  <div class="claims-contacts">
                    <div class="contact-item">
                      <strong>Numero Verde Sinistri</strong>
                      <a href="tel:800123456">800 123 456</a>
                    </div>
                    <div class="contact-item">
                      <strong>Email</strong>
                      <a href="mailto:sinistri@mag.it">sinistri@mag.it</a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </Show>
        </div>
      </main>

      {/* Footer */}
      <footer class="store-footer">
        <div class="container">
          <p>© 2025 Gruppo MAG - Tutti i diritti riservati</p>
        </div>
      </footer>
    </div>
  );
}
