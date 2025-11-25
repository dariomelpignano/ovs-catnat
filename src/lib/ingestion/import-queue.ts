// =============================================================================
// Import Queue - Secure Job Processing
// Handles file import jobs with auth checks, memory management, and session isolation
// =============================================================================

import type { Store, UserRole } from "~/types";
import { fileProcessor, type ImportRow, type ProcessingResult } from "./file-processor";
import { lifecycleManager } from "../core/lifecycle-manager";
import { policyService } from "../core/policy-service";

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface ImportJob {
  jobId: string;
  filename: string;
  uploadedBy: string;
  status: JobStatus;
  progress: number;
  result?: ProcessingResult;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  // Content is now stored separately and cleared after processing
}

// Internal job with content (not exposed via getAllJobs)
interface InternalJob extends ImportJob {
  content?: string;
}

type JobCallback = (job: ImportJob) => void;

// Authorization configuration
const AUTHORIZED_ROLES: UserRole[] = ["admin", "broker"];

// Memory management constants
const MAX_JOBS_PER_SESSION = 100;
const JOB_RETENTION_HOURS = 24;
const CONTENT_CLEAR_DELAY_MS = 5000; // Clear content 5 seconds after job completes

export class ImportQueue {
  private jobs: Map<string, InternalJob> = new Map();
  private queue: string[] = [];
  private processing = false;
  private subscribers: Set<JobCallback> = new Set();
  private stores: Map<string, Store> = new Map();
  private currentSessionId: string | null = null;

  /**
   * Initialize or reset the queue for a new session
   */
  initSession(sessionId: string): void {
    if (this.currentSessionId !== sessionId) {
      // New session - clear previous session data
      this.clearSessionData();
      this.currentSessionId = sessionId;
    }
  }

  /**
   * Clear all session-specific data
   * Called on logout or session change
   */
  clearSessionData(): void {
    this.jobs.clear();
    this.queue = [];
    this.processing = false;
    this.stores.clear();
    this.currentSessionId = null;
    // Note: Subscribers are kept as they may be UI components
  }

  /**
   * Enqueue a new import job with authorization check
   */
  enqueue(
    filename: string,
    content: string,
    uploadedBy: string,
    userRole: UserRole
  ): ImportJob {
    // Authorization check
    if (!AUTHORIZED_ROLES.includes(userRole)) {
      throw new Error(
        `Accesso negato: solo ${AUTHORIZED_ROLES.join(", ")} possono eseguire importazioni`
      );
    }

    // Memory management: prune old jobs if limit reached
    this.pruneOldJobs();

    if (this.jobs.size >= MAX_JOBS_PER_SESSION) {
      throw new Error(
        `Limite massimo di ${MAX_JOBS_PER_SESSION} job per sessione raggiunto. ` +
        `Attendere il completamento o eliminare job esistenti.`
      );
    }

    const job: InternalJob = {
      jobId: `JOB-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      filename,
      content, // Stored temporarily, cleared after processing
      uploadedBy,
      status: "queued",
      progress: 0,
      createdAt: new Date(),
    };

    this.jobs.set(job.jobId, job);
    this.queue.push(job.jobId);
    this.notifySubscribers(this.sanitizeJob(job));
    this.processNext();

    return this.sanitizeJob(job);
  }

  /**
   * Get a job by ID (without content)
   */
  getJob(jobId: string): ImportJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? this.sanitizeJob(job) : undefined;
  }

  /**
   * Get all jobs (without content, sorted by date descending)
   */
  getAllJobs(): ImportJob[] {
    return Array.from(this.jobs.values())
      .map(job => this.sanitizeJob(job))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Delete a specific job (requires authorization)
   */
  deleteJob(jobId: string, userRole: UserRole): boolean {
    if (!AUTHORIZED_ROLES.includes(userRole)) {
      throw new Error("Accesso negato: permessi insufficienti per eliminare job");
    }

    const job = this.jobs.get(jobId);
    if (!job) return false;

    // Don't allow deleting jobs that are processing
    if (job.status === "processing") {
      throw new Error("Impossibile eliminare un job in elaborazione");
    }

    this.jobs.delete(jobId);
    return true;
  }

  /**
   * Subscribe to job updates
   */
  subscribe(callback: JobCallback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Get stores managed by this queue
   */
  getStores(): Store[] {
    return Array.from(this.stores.values());
  }

  /**
   * Get a specific store
   */
  getStore(storeCode: string): Store | undefined {
    return this.stores.get(storeCode);
  }

  /**
   * Process the next job in queue
   */
  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const jobId = this.queue.shift()!;
    const job = this.jobs.get(jobId)!;

    try {
      job.status = "processing";
      job.startedAt = new Date();
      job.progress = 10;
      this.notifySubscribers(this.sanitizeJob(job));

      // Process file (content is available here)
      const content = job.content;
      if (!content) {
        throw new Error("Contenuto del file non disponibile");
      }

      const result = await fileProcessor.processFile(
        job.filename,
        content,
        job.uploadedBy
      );
      job.progress = 50;
      this.notifySubscribers(this.sanitizeJob(job));

      // Apply changes only if validation passed
      if (result.validation.isValid && result.rows.length > 0) {
        await this.applyImportChanges(result.rows);
        job.progress = 90;
        this.notifySubscribers(this.sanitizeJob(job));
      }

      job.result = result;
      job.status = result.validation.isValid ? "completed" : "failed";
      job.progress = 100;
      job.completedAt = new Date();

      if (!result.validation.isValid) {
        job.error = `Validazione fallita con ${result.validation.errors.length} errori`;
      }

      // Clear content after successful processing (memory management)
      this.scheduleClearContent(jobId);

    } catch (error) {
      job.status = "failed";
      job.error = error instanceof Error ? error.message : "Errore sconosciuto";
      job.completedAt = new Date();
      // Clear content on error too
      this.scheduleClearContent(jobId);
    }

    this.notifySubscribers(this.sanitizeJob(job));
    this.processing = false;

    // Process next job if any
    if (this.queue.length > 0) {
      setTimeout(() => this.processNext(), 100);
    }
  }

  /**
   * Apply import changes to stores and policies
   */
  private async applyImportChanges(rows: ImportRow[]): Promise<void> {
    const { created, updated, deactivated } = lifecycleManager.processBulkUpdate(
      this.stores,
      rows
    );

    // Process created and updated stores
    for (const store of [...created, ...updated]) {
      this.stores.set(store.storeCode, store);

      if (store.status === "active") {
        const existingPolicy = policyService.getActivePolicy(store.storeCode);
        if (!existingPolicy) {
          policyService.createPolicy({ store, coverageType: "catnat" });
        } else {
          policyService.updatePolicyPricing(existingPolicy.policyId, store);
        }
      }
    }

    // Process deactivated stores
    for (const store of deactivated) {
      this.stores.set(store.storeCode, store);
      const policy = policyService.getActivePolicy(store.storeCode);
      if (policy) {
        policyService.cancelPolicy(policy.policyId, "Store disattivato");
      }
    }
  }

  /**
   * Schedule clearing of job content to free memory
   */
  private scheduleClearContent(jobId: string): void {
    setTimeout(() => {
      const job = this.jobs.get(jobId);
      if (job) {
        delete job.content;
      }
    }, CONTENT_CLEAR_DELAY_MS);
  }

  /**
   * Prune old completed/failed jobs to manage memory
   */
  private pruneOldJobs(): void {
    const now = Date.now();
    const retentionMs = JOB_RETENTION_HOURS * 60 * 60 * 1000;

    for (const [jobId, job] of this.jobs) {
      // Only prune completed or failed jobs
      if (job.status === "completed" || job.status === "failed") {
        const jobAge = now - job.createdAt.getTime();
        if (jobAge > retentionMs) {
          this.jobs.delete(jobId);
        }
      }
    }
  }

  /**
   * Remove content from job object before exposing to consumers
   */
  private sanitizeJob(job: InternalJob): ImportJob {
    const { content, ...sanitized } = job;
    return sanitized;
  }

  /**
   * Notify all subscribers of job update
   */
  private notifySubscribers(job: ImportJob): void {
    for (const callback of this.subscribers) {
      try {
        callback(job);
      } catch (error) {
        console.error("[ImportQueue] Subscriber error:", error);
      }
    }
  }
}

export const importQueue = new ImportQueue();
