// =============================================================================
// Policy Service - Policy Management with Session Isolation
// Manages insurance policies with proper session cleanup
// =============================================================================

import type { Policy, Store, CoverageType, Certificate, AuditLog } from "~/types";
import { pricingEngine } from "./pricing-engine";

export interface CreatePolicyInput {
  store: Store;
  coverageType: CoverageType;
  effectiveFrom?: Date;
  durationMonths?: number;
}

export class PolicyService {
  private policies: Map<string, Policy> = new Map();
  private certificates: Map<string, Certificate> = new Map();
  private currentSessionId: string | null = null;

  /**
   * Initialize or reset the service for a new session
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
    this.policies.clear();
    this.certificates.clear();
    this.currentSessionId = null;
  }

  /**
   * Create a new policy for a store
   */
  createPolicy(input: CreatePolicyInput): Policy {
    const {
      store,
      coverageType,
      effectiveFrom = new Date(),
      durationMonths = 12,
    } = input;

    // Calculate pricing
    const pricing = pricingEngine.calculate(store, coverageType);

    // Calculate policy end date
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
    return policy;
  }

  /**
   * Get a policy by ID
   */
  getPolicy(policyId: string): Policy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * Get the active policy for a store
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
      p => p.storeCode === storeCode
    );
  }

  /**
   * Cancel a policy
   */
  cancelPolicy(policyId: string, reason?: string): Policy {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Polizza non trovata: ${policyId}`);
    }
    if (policy.status === "cancelled") {
      throw new Error("La polizza è già stata annullata");
    }

    const updatedPolicy: Policy = {
      ...policy,
      status: "cancelled",
      updatedAt: new Date(),
    };

    this.policies.set(policyId, updatedPolicy);
    return updatedPolicy;
  }

  /**
   * Update policy pricing based on store changes
   */
  updatePolicyPricing(policyId: string, store: Store): Policy {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Polizza non trovata: ${policyId}`);
    }

    const pricing = pricingEngine.calculate(store, policy.coverageType);

    const updatedPolicy: Policy = {
      ...policy,
      insuredSum: pricing.insuredSum,
      premium: pricing.premium,
      updatedAt: new Date(),
    };

    this.policies.set(policyId, updatedPolicy);
    return updatedPolicy;
  }

  /**
   * Generate a certificate for a policy
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
    return certificate;
  }

  /**
   * Get certificate by ID
   */
  getCertificate(certId: string): Certificate | undefined {
    return this.certificates.get(certId);
  }

  /**
   * Get all certificates for a policy
   */
  getPolicyCertificates(policyId: string): Certificate[] {
    return Array.from(this.certificates.values()).filter(
      c => c.policyId === policyId
    );
  }

  /**
   * Get portfolio summary statistics
   */
  getPortfolioSummary() {
    const policies = Array.from(this.policies.values());
    let totalPremium = 0;
    let totalInsuredSum = 0;
    let activePolicies = 0;

    for (const policy of policies) {
      if (policy.status === "active") {
        activePolicies++;
        totalPremium += policy.premium;
        totalInsuredSum += policy.insuredSum;
      }
    }

    return {
      totalPolicies: policies.length,
      activePolicies,
      totalPremium: Math.round(totalPremium * 100) / 100,
      totalInsuredSum: Math.round(totalInsuredSum * 100) / 100,
    };
  }

  /**
   * Get all policies (for admin dashboard)
   */
  getAllPolicies(): Policy[] {
    return Array.from(this.policies.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
}

export const policyService = new PolicyService();
