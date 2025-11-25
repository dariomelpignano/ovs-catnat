// =============================================================================
// Policy Service
// Aligned with ARCHITECTURE.md - Core Business Layer
// Manages policy creation, renewal, and status
// =============================================================================

import type {
  Policy,
  PolicyStatus,
  Store,
  CoverageType,
  Certificate,
  AuditLog,
} from "~/types";
import { pricingEngine, type PricingResult } from "./pricing-engine";

export interface CreatePolicyInput {
  store: Store;
  coverageType: CoverageType;
  effectiveFrom?: Date;
  durationMonths?: number;
}

export interface PolicyWithDetails {
  policy: Policy;
  store: Store;
  certificate?: Certificate;
  pricing: PricingResult;
}

export class PolicyService {
  private policies: Map<string, Policy> = new Map();
  private certificates: Map<string, Certificate> = new Map();
  private auditLog: AuditLog[] = [];

  /**
   * Create a new policy for a store
   */
  createPolicy(input: CreatePolicyInput): Policy {
    const { store, coverageType, effectiveFrom = new Date(), durationMonths = 12 } = input;

    // Calculate pricing
    const pricing = pricingEngine.calculate(store, coverageType);

    // Calculate effective dates
    const effectiveTo = new Date(effectiveFrom);
    effectiveTo.setMonth(effectiveTo.getMonth() + durationMonths);

    const now = new Date();
    const policy: Policy = {
      policyId: `POL-${store.storeCode}-${Date.now()}`,
      storeCode: store.storeCode,
      coverageType,
      insuredSum: pricing.insuredSum,
      premium: pricing.premium,
      effectiveFrom,
      effectiveTo,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    this.policies.set(policy.policyId, policy);
    this.logAudit("policy_created", policy.policyId, null, policy);

    return policy;
  }

  /**
   * Get policy by ID
   */
  getPolicy(policyId: string): Policy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * Get active policy for a store
   */
  getActivePolicy(storeCode: string): Policy | undefined {
    for (const policy of this.policies.values()) {
      if (policy.storeCode === storeCode && policy.status === "active") {
        return policy;
      }
    }
    return undefined;
  }

  /**
   * Get all policies for a store
   */
  getStorePolicies(storeCode: string): Policy[] {
    return Array.from(this.policies.values()).filter(
      (p) => p.storeCode === storeCode
    );
  }

  /**
   * Cancel a policy
   */
  cancelPolicy(policyId: string, reason?: string): Policy {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    if (policy.status === "cancelled") {
      throw new Error("Policy is already cancelled");
    }

    const updatedPolicy: Policy = {
      ...policy,
      status: "cancelled",
      updatedAt: new Date(),
    };

    this.policies.set(policyId, updatedPolicy);
    this.logAudit("policy_cancelled", policyId, policy, updatedPolicy, { reason });

    return updatedPolicy;
  }

  /**
   * Renew a policy
   */
  renewPolicy(policyId: string, durationMonths = 12): Policy {
    const oldPolicy = this.policies.get(policyId);
    if (!oldPolicy) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    // Mark old policy as expired
    const expiredPolicy: Policy = {
      ...oldPolicy,
      status: "expired",
      updatedAt: new Date(),
    };
    this.policies.set(policyId, expiredPolicy);

    // Create new policy starting from old policy's end date
    const effectiveFrom = new Date(oldPolicy.effectiveTo);
    const effectiveTo = new Date(effectiveFrom);
    effectiveTo.setMonth(effectiveTo.getMonth() + durationMonths);

    const now = new Date();
    const newPolicy: Policy = {
      policyId: `POL-${oldPolicy.storeCode}-${Date.now()}`,
      storeCode: oldPolicy.storeCode,
      coverageType: oldPolicy.coverageType,
      insuredSum: oldPolicy.insuredSum, // Recalculate if needed
      premium: oldPolicy.premium,
      effectiveFrom,
      effectiveTo,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    this.policies.set(newPolicy.policyId, newPolicy);
    this.logAudit("policy_renewed", newPolicy.policyId, oldPolicy, newPolicy);

    return newPolicy;
  }

  /**
   * Update policy pricing (e.g., when store size changes)
   */
  updatePolicyPricing(policyId: string, store: Store): Policy {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    const pricing = pricingEngine.calculate(store, policy.coverageType);

    const updatedPolicy: Policy = {
      ...policy,
      insuredSum: pricing.insuredSum,
      premium: pricing.premium,
      updatedAt: new Date(),
    };

    this.policies.set(policyId, updatedPolicy);
    this.logAudit("premium_calculated", policyId, policy, updatedPolicy);

    return updatedPolicy;
  }

  /**
   * Check and update expired policies
   */
  processExpirations(): Policy[] {
    const now = new Date();
    const expired: Policy[] = [];

    for (const policy of this.policies.values()) {
      if (policy.status === "active" && policy.effectiveTo < now) {
        const updatedPolicy: Policy = {
          ...policy,
          status: "expired",
          updatedAt: now,
        };
        this.policies.set(policy.policyId, updatedPolicy);
        expired.push(updatedPolicy);
      }
    }

    return expired;
  }

  /**
   * Generate certificate for a policy
   */
  generateCertificate(policy: Policy): Certificate {
    const now = new Date();
    const certificate: Certificate = {
      certId: `CERT-${policy.policyId}-${Date.now()}`,
      policyId: policy.policyId,
      issueDate: now,
      documentUrl: `/documents/certificates/${policy.policyId}.pdf`,
      validFrom: policy.effectiveFrom,
      validTo: policy.effectiveTo,
      createdAt: now,
    };

    this.certificates.set(certificate.certId, certificate);
    this.logAudit("certificate_generated", certificate.certId, null, certificate as unknown as Policy);

    return certificate;
  }

  /**
   * Get certificate for a policy
   */
  getPolicyCertificate(policyId: string): Certificate | undefined {
    for (const cert of this.certificates.values()) {
      if (cert.policyId === policyId) {
        return cert;
      }
    }
    return undefined;
  }

  /**
   * Get all policies with summary stats
   */
  getPortfolioSummary(): {
    totalPolicies: number;
    activePolicies: number;
    totalPremium: number;
    totalInsuredSum: number;
    byStatus: Record<PolicyStatus, number>;
  } {
    const policies = Array.from(this.policies.values());
    const byStatus: Record<PolicyStatus, number> = {
      active: 0,
      expired: 0,
      cancelled: 0,
      pending: 0,
    };

    let totalPremium = 0;
    let totalInsuredSum = 0;

    for (const policy of policies) {
      byStatus[policy.status]++;
      if (policy.status === "active") {
        totalPremium += policy.premium;
        totalInsuredSum += policy.insuredSum;
      }
    }

    return {
      totalPolicies: policies.length,
      activePolicies: byStatus.active,
      totalPremium: Math.round(totalPremium * 100) / 100,
      totalInsuredSum: Math.round(totalInsuredSum * 100) / 100,
      byStatus,
    };
  }

  /**
   * Log audit entry
   */
  private logAudit(
    action: string,
    entityId: string,
    previousState: Policy | null,
    newState: Policy,
    metadata?: Record<string, unknown>
  ): void {
    const entry: AuditLog = {
      id: crypto.randomUUID(),
      action: action as AuditLog["action"],
      entityType: "policy",
      entityId,
      previousState: previousState as Record<string, unknown> | null,
      newState: newState as unknown as Record<string, unknown>,
      performedBy: "system",
      timestamp: new Date(),
      metadata,
    };

    this.auditLog.push(entry);
  }

  /**
   * Get audit log
   */
  getAuditLog(): AuditLog[] {
    return [...this.auditLog];
  }
}

// Singleton instance
export const policyService = new PolicyService();
