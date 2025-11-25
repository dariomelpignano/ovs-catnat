// =============================================================================
// Store Lifecycle Manager
// Aligned with ARCHITECTURE.md - Core Business Layer
// Manages store status transitions (activation/deactivation)
// =============================================================================

import type { Store, StoreStatus, AuditLog, AuditAction } from "~/types";

// Valid state transitions
const VALID_TRANSITIONS: Record<StoreStatus, StoreStatus[]> = {
  pending: ["active", "inactive"],
  active: ["suspended", "inactive"],
  suspended: ["active", "inactive"],
  inactive: ["pending"], // Can be reactivated through new application
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

  /**
   * Check if a status transition is valid
   */
  isValidTransition(from: StoreStatus, to: StoreStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }

  /**
   * Activate a store
   */
  activate(store: Store, reason?: string): LifecycleResult {
    const previousStatus = store.status;

    if (store.status === "active") {
      return {
        success: false,
        store,
        error: "Store is already active",
      };
    }

    if (!this.isValidTransition(store.status, "active")) {
      return {
        success: false,
        store,
        error: `Cannot activate store from status: ${store.status}`,
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

    const event: LifecycleEvent = {
      storeCode: store.storeCode,
      previousStatus,
      newStatus: "active",
      reason,
      effectiveDate: now,
    };

    this.logAudit("store_updated", store.storeCode, store, updatedStore);

    return {
      success: true,
      store: updatedStore,
      event,
    };
  }

  /**
   * Deactivate a store
   */
  deactivate(store: Store, reason?: string): LifecycleResult {
    const previousStatus = store.status;

    if (store.status === "inactive") {
      return {
        success: false,
        store,
        error: "Store is already inactive",
      };
    }

    if (!this.isValidTransition(store.status, "inactive")) {
      return {
        success: false,
        store,
        error: `Cannot deactivate store from status: ${store.status}`,
      };
    }

    const now = new Date();
    const updatedStore: Store = {
      ...store,
      status: "inactive",
      closureDate: now,
      updatedAt: now,
    };

    const event: LifecycleEvent = {
      storeCode: store.storeCode,
      previousStatus,
      newStatus: "inactive",
      reason,
      effectiveDate: now,
    };

    this.logAudit("store_deactivated", store.storeCode, store, updatedStore);

    return {
      success: true,
      store: updatedStore,
      event,
    };
  }

  /**
   * Suspend a store temporarily
   */
  suspend(store: Store, reason?: string): LifecycleResult {
    const previousStatus = store.status;

    if (store.status !== "active") {
      return {
        success: false,
        store,
        error: "Only active stores can be suspended",
      };
    }

    const now = new Date();
    const updatedStore: Store = {
      ...store,
      status: "suspended",
      updatedAt: now,
    };

    const event: LifecycleEvent = {
      storeCode: store.storeCode,
      previousStatus,
      newStatus: "suspended",
      reason,
      effectiveDate: now,
    };

    this.logAudit("store_updated", store.storeCode, store, updatedStore);

    return {
      success: true,
      store: updatedStore,
      event,
    };
  }

  /**
   * Create a new store in pending status
   */
  createStore(data: Omit<Store, "status" | "createdAt" | "updatedAt" | "activationDate" | "closureDate">): Store {
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
   * Update store details (non-lifecycle changes)
   */
  updateStore(store: Store, updates: Partial<Pick<Store, "businessName" | "address" | "squareMeters">>): Store {
    const now = new Date();
    const updatedStore: Store = {
      ...store,
      ...updates,
      updatedAt: now,
    };

    this.logAudit("store_updated", store.storeCode, store, updatedStore);

    return updatedStore;
  }

  /**
   * Process bulk store updates from import
   */
  processBulkUpdate(
    existingStores: Map<string, Store>,
    importedData: Array<{
      storeCode: string;
      businessName: string;
      address: string;
      squareMeters: number;
    }>
  ): {
    created: Store[];
    updated: Store[];
    deactivated: Store[];
  } {
    const created: Store[] = [];
    const updated: Store[] = [];
    const deactivated: Store[] = [];

    const importedCodes = new Set(importedData.map((d) => d.storeCode));

    // Process imported records
    for (const data of importedData) {
      const existing = existingStores.get(data.storeCode);

      if (!existing) {
        // New store
        const store = this.createStore(data);
        const result = this.activate(store, "Initial import");
        if (result.success) {
          created.push(result.store);
        }
      } else {
        // Existing store - check for updates
        const hasChanges =
          existing.businessName !== data.businessName ||
          existing.address !== data.address ||
          existing.squareMeters !== data.squareMeters;

        if (hasChanges) {
          const updatedStore = this.updateStore(existing, {
            businessName: data.businessName,
            address: data.address,
            squareMeters: data.squareMeters,
          });
          updated.push(updatedStore);
        }

        // Reactivate if was inactive
        if (existing.status === "inactive") {
          const result = this.activate(existing, "Reactivated via import");
          if (result.success) {
            updated.push(result.store);
          }
        }
      }
    }

    // Deactivate stores not in import
    for (const [code, store] of existingStores) {
      if (!importedCodes.has(code) && store.status === "active") {
        const result = this.deactivate(store, "Not present in latest import");
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
    const entry: AuditLog = {
      id: crypto.randomUUID(),
      action,
      entityType: "store",
      entityId,
      previousState: previousState as Record<string, unknown> | null,
      newState: newState as unknown as Record<string, unknown>,
      performedBy: "system",
      timestamp: new Date(),
    };

    this.auditLog.push(entry);
  }

  /**
   * Get audit log entries
   */
  getAuditLog(): AuditLog[] {
    return [...this.auditLog];
  }
}

// Singleton instance
export const lifecycleManager = new LifecycleManager();
