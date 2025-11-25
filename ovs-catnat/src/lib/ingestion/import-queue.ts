// =============================================================================
// Import Queue
// Aligned with ARCHITECTURE.md - Data Ingestion Layer
// Async processing queue for file imports (Design Principle #2)
// =============================================================================

import type { FileImport, Store } from "~/types";
import { fileProcessor, type ImportRow, type ProcessingResult } from "./file-processor";
import { lifecycleManager } from "../core/lifecycle-manager";
import { policyService } from "../core/policy-service";

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface ImportJob {
  jobId: string;
  filename: string;
  content: string;
  uploadedBy: string;
  status: JobStatus;
  progress: number;
  result?: ProcessingResult;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface QueueStats {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
}

type JobCallback = (job: ImportJob) => void;

export class ImportQueue {
  private jobs: Map<string, ImportJob> = new Map();
  private queue: string[] = [];
  private processing = false;
  private subscribers: Set<JobCallback> = new Set();

  // In-memory store (would be database in production)
  private stores: Map<string, Store> = new Map();

  /**
   * Add a new import job to the queue
   */
  enqueue(filename: string, content: string, uploadedBy: string): ImportJob {
    const job: ImportJob = {
      jobId: `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename,
      content,
      uploadedBy,
      status: "queued",
      progress: 0,
      createdAt: new Date(),
    };

    this.jobs.set(job.jobId, job);
    this.queue.push(job.jobId);
    this.notifySubscribers(job);

    // Start processing if not already running
    this.processNext();

    return job;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): ImportJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): ImportJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const jobs = Array.from(this.jobs.values());
    return {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter((j) => j.status === "queued").length,
      processingJobs: jobs.filter((j) => j.status === "processing").length,
      completedJobs: jobs.filter((j) => j.status === "completed").length,
      failedJobs: jobs.filter((j) => j.status === "failed").length,
    };
  }

  /**
   * Subscribe to job updates
   */
  subscribe(callback: JobCallback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Process the next job in the queue
   */
  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const jobId = this.queue.shift()!;
    const job = this.jobs.get(jobId)!;

    try {
      // Update status to processing
      job.status = "processing";
      job.startedAt = new Date();
      job.progress = 10;
      this.notifySubscribers(job);

      // Process the file
      const result = await fileProcessor.processFile(
        job.filename,
        job.content,
        job.uploadedBy
      );
      job.progress = 50;
      this.notifySubscribers(job);

      // Apply changes to stores if validation passed
      if (result.validation.isValid) {
        await this.applyImportChanges(result.rows);
        job.progress = 90;
        this.notifySubscribers(job);
      }

      // Update job with result
      job.result = result;
      job.status = result.validation.isValid ? "completed" : "failed";
      job.progress = 100;
      job.completedAt = new Date();

      if (!result.validation.isValid) {
        job.error = `Validation failed with ${result.validation.errors.length} errors`;
      }
    } catch (error) {
      job.status = "failed";
      job.error = error instanceof Error ? error.message : "Unknown error";
      job.completedAt = new Date();
    }

    this.notifySubscribers(job);
    this.processing = false;

    // Process next job if available
    if (this.queue.length > 0) {
      // Small delay between jobs
      setTimeout(() => this.processNext(), 100);
    }
  }

  /**
   * Apply import changes to stores
   */
  private async applyImportChanges(rows: ImportRow[]): Promise<void> {
    const { created, updated, deactivated } = lifecycleManager.processBulkUpdate(
      this.stores,
      rows
    );

    // Update store map
    for (const store of [...created, ...updated]) {
      this.stores.set(store.storeCode, store);

      // Create or update policy for active stores
      if (store.status === "active") {
        const existingPolicy = policyService.getActivePolicy(store.storeCode);
        if (!existingPolicy) {
          policyService.createPolicy({
            store,
            coverageType: "catnat",
          });
        } else {
          policyService.updatePolicyPricing(existingPolicy.policyId, store);
        }
      }
    }

    // Handle deactivated stores
    for (const store of deactivated) {
      this.stores.set(store.storeCode, store);
      const policy = policyService.getActivePolicy(store.storeCode);
      if (policy) {
        policyService.cancelPolicy(policy.policyId, "Store deactivated");
      }
    }
  }

  /**
   * Notify all subscribers of job update
   */
  private notifySubscribers(job: ImportJob): void {
    for (const callback of this.subscribers) {
      try {
        callback(job);
      } catch (error) {
        console.error("Subscriber callback error:", error);
      }
    }
  }

  /**
   * Get all stores
   */
  getStores(): Store[] {
    return Array.from(this.stores.values());
  }

  /**
   * Get store by code
   */
  getStore(storeCode: string): Store | undefined {
    return this.stores.get(storeCode);
  }

  /**
   * Clear completed/failed jobs older than specified hours
   */
  cleanupOldJobs(olderThanHours = 24): number {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - olderThanHours);

    let removed = 0;
    for (const [jobId, job] of this.jobs) {
      if (
        (job.status === "completed" || job.status === "failed") &&
        job.completedAt &&
        job.completedAt < cutoff
      ) {
        this.jobs.delete(jobId);
        removed++;
      }
    }

    return removed;
  }
}

// Singleton instance
export const importQueue = new ImportQueue();
