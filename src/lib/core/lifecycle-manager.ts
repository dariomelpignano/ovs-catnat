// =============================================================================
// Lifecycle Manager - Store Status Management with Session Isolation
// Manages store lifecycle transitions and audit logging
// =============================================================================

import type { Store, StoreStatus, AuditLog, AuditAction } from "~/types";

// Valid state transitions for stores
const VALID_TRANSITIONS: Record<StoreStatus, StoreStatus[]> = {
  pending: ["active", "inactive"],
  active: ["suspended", "inactive"],
  suspended: ["active", "inactive"],
  inactive: ["pending"],
};

export interface LifecycleEvent {
  storeCode: string;
  previousStatus: StoreStatus;
  newStatus: StoreStatus;
  reason?: string;
  effectiveDate: Date;
}

export interface LifecycleResult {
  success: boolean;
  store: Store;
  event?: LifecycleEvent;
  error?: string;
}

export class LifecycleManager {
  private auditLog: AuditLog[] = [];
  private currentSessionId: string | null = null;

  /**
   * Initialize or reset the manager for a new session
   */
  initSession(sessionId: string): void {
    if (this.currentSessionId !== sessionId) {
      this.clearSessionData();
      this.currentSessionId = sessionId;
    }
  }

  /**
   * Clear all session-specific data
   * Called on logout or session change
   */
  clearSessionData(): void {
    this.auditLog = [];
    this.currentSessionId = null;
  }

  /**
   * Check if a state transition is valid
   */
  isValidTransition(from: StoreStatus, to: StoreStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }

  /**
   * Get allowed transitions from a status
   */
  getAllowedTransitions(from: StoreStatus): StoreStatus[] {
    return VALID_TRANSITIONS[from] ?? [];
  }

  /**
   * Activate a store
   */
  activate(store: Store, reason?: string): LifecycleResult {
    if (store.status === "active") {
      return {
        success: false,
        store,
        error: "Lo store è già attivo",
      };
    }

    if (!this.isValidTransition(store.status, "active")) {
      return {
        success: false,
        store,
        error: `Impossibile attivare uno store con stato: ${store.status}`,
      };
    }

    const now = new Date();
    const updatedStore: Store = {
      ...store,
      status: "active",
      activationDate: store.activationDate ?? now,
      closureDate: null,
      updatedAt: now,
    };

    this.logAudit("store_updated", store.storeCode, store, updatedStore);

    return {
      success: true,
      store: updatedStore,
      event: {
        storeCode: store.storeCode,
        previousStatus: store.status,
        newStatus: "active",
        reason,
        effectiveDate: now,
      },
    };
  }

  /**
   * Deactivate a store
   */
  deactivate(store: Store, reason?: string): LifecycleResult {
    if (store.status === "inactive") {
      return {
        success: false,
        store,
        error: "Lo store è già inattivo",
      };
    }

    if (!this.isValidTransition(store.status, "inactive")) {
      return {
        success: false,
        store,
        error: `Impossibile disattivare uno store con stato: ${store.status}`,
      };
    }

    const now = new Date();
    const updatedStore: Store = {
      ...store,
      status: "inactive",
      closureDate: now,
      updatedAt: now,
    };

    this.logAudit("store_deactivated", store.storeCode, store, updatedStore);

    return {
      success: true,
      store: updatedStore,
      event: {
        storeCode: store.storeCode,
        previousStatus: store.status,
        newStatus: "inactive",
        reason,
        effectiveDate: now,
      },
    };
  }

  /**
   * Suspend a store temporarily
   */
  suspend(store: Store, reason?: string): LifecycleResult {
    if (store.status === "suspended") {
      return {
        success: false,
        store,
        error: "Lo store è già sospeso",
      };
    }

    if (!this.isValidTransition(store.status, "suspended")) {
      return {
        success: false,
        store,
        error: `Impossibile sospendere uno store con stato: ${store.status}`,
      };
    }

    const now = new Date();
    const updatedStore: Store = {
      ...store,
      status: "suspended",
      updatedAt: now,
    };

    this.logAudit("store_updated", store.storeCode, store, updatedStore);

    return {
      success: true,
      store: updatedStore,
      event: {
        storeCode: store.storeCode,
        previousStatus: store.status,
        newStatus: "suspended",
        reason,
        effectiveDate: now,
      },
    };
  }

  /**
   * Create a new store in pending status
   */
  createStore(
    data: Omit<Store, "status" | "createdAt" | "updatedAt" | "activationDate" | "closureDate">
  ): Store {
    const now = new Date();
    const store: Store = {
      ...data,
      status: "pending",
      activationDate: null,
      closureDate: null,
      createdAt: now,
      updatedAt: now,
    };

    this.logAudit("store_created", store.storeCode, null, store);
    return store;
  }

  /**
   * Process bulk update from import
   * Compares imported data with existing stores and determines changes
   */
  processBulkUpdate(
    existingStores: Map<string, Store>,
    importedData: Array<{
      storeCode: string;
      businessName: string;
      address: string;
      squareMeters: number;
    }>
  ): { created: Store[]; updated: Store[]; deactivated: Store[] } {
    const created: Store[] = [];
    const updated: Store[] = [];
    const deactivated: Store[] = [];

    const importedCodes = new Set(importedData.map(d => d.storeCode));

    // Process imported stores
    for (const data of importedData) {
      const existing = existingStores.get(data.storeCode);

      if (!existing) {
        // New store - create and activate
        const store = this.createStore(data);
        const result = this.activate(store, "Importazione iniziale");
        if (result.success) {
          created.push(result.store);
        }
      } else if (
        existing.businessName !== data.businessName ||
        existing.address !== data.address ||
        existing.squareMeters !== data.squareMeters
      ) {
        // Existing store with changes - update
        const updatedStore: Store = {
          ...existing,
          businessName: data.businessName,
          address: data.address,
          squareMeters: data.squareMeters,
          updatedAt: new Date(),
        };
        this.logAudit("store_updated", existing.storeCode, existing, updatedStore);
        updated.push(updatedStore);
      }
    }

    // Find stores to deactivate (in existing but not in import)
    for (const [code, store] of existingStores) {
      if (!importedCodes.has(code) && store.status === "active") {
        const result = this.deactivate(store, "Non presente nell'ultima importazione");
        if (result.success) {
          deactivated.push(result.store);
        }
      }
    }

    return { created, updated, deactivated };
  }

  /**
   * Log an audit entry
   */
  private logAudit(
    action: AuditAction,
    entityId: string,
    previousState: Store | null,
    newState: Store
  ): void {
    this.auditLog.push({
      id: crypto.randomUUID(),
      action,
      entityType: "store",
      entityId,
      previousState: previousState as Record<string, unknown> | null,
      newState: newState as unknown as Record<string, unknown>,
      performedBy: "system",
      timestamp: new Date(),
    });
  }

  /**
   * Get the audit log
   */
  getAuditLog(): AuditLog[] {
    return [...this.auditLog];
  }

  /**
   * Get audit entries for a specific store
   */
  getStoreAuditLog(storeCode: string): AuditLog[] {
    return this.auditLog.filter(entry => entry.entityId === storeCode);
  }
}

export const lifecycleManager = new LifecycleManager();
