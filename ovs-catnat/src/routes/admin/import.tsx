// =============================================================================
// Admin Portal - File Import Page
// Aligned with ARCHITECTURE.md - Data Ingestion Layer
// =============================================================================

import { createSignal, onMount, Show, For, createEffect } from "solid-js";
import { useNavigate, A } from "@solidjs/router";
import { authStore } from "~/stores/auth.store";
import { importQueue, type ImportJob } from "~/lib/ingestion";
import "./admin.css";
import "./import.css";

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

    // Load existing jobs
    setJobs(importQueue.getAllJobs());

    // Subscribe to job updates
    const unsubscribe = importQueue.subscribe((job) => {
      setJobs(importQueue.getAllJobs());
    });

    return () => unsubscribe();
  });

  const handleLogout = () => {
    authStore.logout();
    navigate("/login", { replace: true });
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      handleFileSelect(input.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setUploadError("");

    // Validate file type
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const validExtensions = [".csv", ".xls", ".xlsx"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      setUploadError("Formato file non supportato. Usa CSV o Excel.");
      return;
    }

    // Validate file size (max 10MB)
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
      const user = authStore.user();

      importQueue.enqueue(file.name, content, user?.email ?? "unknown");

      setSelectedFile(null);
      // Reset file input
      const input = document.getElementById("file-input") as HTMLInputElement;
      if (input) input.value = "";
    } catch (error) {
      setUploadError("Errore durante il caricamento del file.");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span class="badge badge-success">Completato</span>;
      case "processing":
        return <span class="badge badge-warning">In elaborazione</span>;
      case "queued":
        return <span class="badge badge-info">In coda</span>;
      case "failed":
        return <span class="badge badge-error">Fallito</span>;
      default:
        return <span class="badge">{status}</span>;
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
          <A href="/admin" class="nav-item">
            <span class="nav-icon">📊</span>
            Dashboard
          </A>
          <A href="/admin/stores" class="nav-item">
            <span class="nav-icon">🏪</span>
            Punti Vendita
          </A>
          <A href="/admin/import" class="nav-item active">
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
        {/* Page Header */}
        <header class="page-header">
          <h2>Importazione Dati</h2>
          <p>Carica file Excel o CSV con l'elenco dei punti vendita OVS</p>
        </header>

        {/* Upload Section */}
        <section class="upload-section">
          <div
            class={`upload-zone ${isDragging() ? "dragging" : ""} ${selectedFile() ? "has-file" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Show
              when={!selectedFile()}
              fallback={
                <div class="file-preview">
                  <span class="file-icon">📄</span>
                  <div class="file-info">
                    <span class="file-name">{selectedFile()?.name}</span>
                    <span class="file-size">
                      {((selectedFile()?.size ?? 0) / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    class="btn btn-outline"
                    onClick={() => setSelectedFile(null)}
                  >
                    Rimuovi
                  </button>
                </div>
              }
            >
              <div class="upload-prompt">
                <span class="upload-icon">📥</span>
                <p>Trascina qui il file oppure</p>
                <label class="btn btn-primary">
                  Seleziona File
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileInput}
                    hidden
                  />
                </label>
                <span class="upload-hint">CSV, XLS o XLSX (max 10MB)</span>
              </div>
            </Show>
          </div>

          <Show when={uploadError()}>
            <div class="upload-error">{uploadError()}</div>
          </Show>

          <Show when={selectedFile()}>
            <div class="upload-actions">
              <button
                class="btn btn-primary"
                onClick={handleUpload}
                disabled={isUploading()}
              >
                {isUploading() ? "Caricamento..." : "Avvia Importazione"}
              </button>
            </div>
          </Show>
        </section>

        {/* Expected Format */}
        <section class="format-section">
          <h3>Formato Atteso</h3>
          <div class="card">
            <p>Il file deve contenere le seguenti colonne:</p>
            <table class="table format-table">
              <thead>
                <tr>
                  <th>Colonna</th>
                  <th>Obbligatorio</th>
                  <th>Descrizione</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>Codice Punto Vendita</code></td>
                  <td><span class="badge badge-error">Si</span></td>
                  <td>Identificativo univoco del negozio</td>
                </tr>
                <tr>
                  <td><code>Ragione Sociale</code></td>
                  <td><span class="badge badge-info">No</span></td>
                  <td>Nome del punto vendita</td>
                </tr>
                <tr>
                  <td><code>Indirizzo</code></td>
                  <td><span class="badge badge-info">No</span></td>
                  <td>Ubicazione del rischio assicurato</td>
                </tr>
                <tr>
                  <td><code>Metri Quadri</code></td>
                  <td><span class="badge badge-error">Si</span></td>
                  <td>Superficie in mq per calcolo premio</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Import History */}
        <section class="history-section">
          <h3>Storico Importazioni</h3>
          <div class="card">
            <Show
              when={jobs().length > 0}
              fallback={
                <div class="empty-state">
                  <p>Nessuna importazione effettuata</p>
                </div>
              }
            >
              <table class="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>File</th>
                    <th>Data</th>
                    <th>Progresso</th>
                    <th>Stato</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={jobs()}>
                    {(job) => (
                      <tr>
                        <td class="font-mono">{job.jobId.slice(-8)}</td>
                        <td>{job.filename}</td>
                        <td>{formatDate(job.createdAt)}</td>
                        <td>
                          <div class="progress-cell">
                            <div class="progress-bar">
                              <div
                                class="progress-fill"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                            <span class="progress-text">{job.progress}%</span>
                          </div>
                        </td>
                        <td>{getStatusBadge(job.status)}</td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </Show>
          </div>
        </section>
      </main>
    </div>
  );
}
