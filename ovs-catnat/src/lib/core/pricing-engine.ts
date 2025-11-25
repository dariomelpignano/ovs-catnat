// =============================================================================
// Pricing Engine
// Aligned with ARCHITECTURE.md - Core Business Layer
// Algorithm: mq × rate = premium/insured sum
// =============================================================================

import type { CoverageType, PricingConfig, Store } from "~/types";

// Default pricing configuration (should be loaded from DB in production)
const DEFAULT_PRICING_CONFIGS: PricingConfig[] = [
  {
    coverageType: "catnat",
    ratePerSquareMeter: 2.5, // €2.50 per mq
    minimumPremium: 500,
    maximumInsuredSum: 10_000_000,
    effectiveFrom: new Date("2025-01-01"),
    effectiveTo: null,
  },
  {
    coverageType: "property",
    ratePerSquareMeter: 4.0, // €4.00 per mq
    minimumPremium: 750,
    maximumInsuredSum: 15_000_000,
    effectiveFrom: new Date("2025-01-01"),
    effectiveTo: null,
  },
  {
    coverageType: "combined",
    ratePerSquareMeter: 5.5, // €5.50 per mq (discounted bundle)
    minimumPremium: 1000,
    maximumInsuredSum: 20_000_000,
    effectiveFrom: new Date("2025-01-01"),
    effectiveTo: null,
  },
];

export interface PricingResult {
  premium: number;
  insuredSum: number;
  breakdown: {
    squareMeters: number;
    rateApplied: number;
    basePremium: number;
    adjustments: number;
  };
}

export interface PricingEngineConfig {
  configs?: PricingConfig[];
}

export class PricingEngine {
  private configs: PricingConfig[];

  constructor(options: PricingEngineConfig = {}) {
    this.configs = options.configs ?? DEFAULT_PRICING_CONFIGS;
  }

  /**
   * Get the active pricing config for a coverage type
   */
  getActiveConfig(
    coverageType: CoverageType,
    effectiveDate: Date = new Date()
  ): PricingConfig | null {
    return (
      this.configs.find(
        (c) =>
          c.coverageType === coverageType &&
          c.effectiveFrom <= effectiveDate &&
          (c.effectiveTo === null || c.effectiveTo >= effectiveDate)
      ) ?? null
    );
  }

  /**
   * Calculate premium and insured sum for a store
   * Core algorithm: mq × rate = premium
   */
  calculate(store: Store, coverageType: CoverageType): PricingResult {
    const config = this.getActiveConfig(coverageType);

    if (!config) {
      throw new Error(
        `No active pricing configuration found for coverage type: ${coverageType}`
      );
    }

    const { squareMeters } = store;
    const { ratePerSquareMeter, minimumPremium, maximumInsuredSum } = config;

    // Base calculation: mq × rate
    const basePremium = squareMeters * ratePerSquareMeter;

    // Apply minimum premium constraint
    const premium = Math.max(basePremium, minimumPremium);

    // Calculate insured sum (typically a multiplier of premium or mq-based)
    // Using standard multiplier: €1000 per mq for property value estimation
    const rawInsuredSum = squareMeters * 1000;
    const insuredSum = Math.min(rawInsuredSum, maximumInsuredSum);

    // Track any adjustments made
    const adjustments = premium - basePremium;

    return {
      premium: Math.round(premium * 100) / 100,
      insuredSum: Math.round(insuredSum * 100) / 100,
      breakdown: {
        squareMeters,
        rateApplied: ratePerSquareMeter,
        basePremium: Math.round(basePremium * 100) / 100,
        adjustments: Math.round(adjustments * 100) / 100,
      },
    };
  }

  /**
   * Bulk calculate for multiple stores
   */
  calculateBulk(
    stores: Store[],
    coverageType: CoverageType
  ): Map<string, PricingResult> {
    const results = new Map<string, PricingResult>();

    for (const store of stores) {
      try {
        results.set(store.storeCode, this.calculate(store, coverageType));
      } catch (error) {
        console.error(
          `Failed to calculate pricing for store ${store.storeCode}:`,
          error
        );
      }
    }

    return results;
  }

  /**
   * Calculate total portfolio premium
   */
  calculatePortfolioTotal(stores: Store[], coverageType: CoverageType): number {
    const results = this.calculateBulk(stores, coverageType);
    let total = 0;

    for (const result of results.values()) {
      total += result.premium;
    }

    return Math.round(total * 100) / 100;
  }
}

// Singleton instance for convenience
export const pricingEngine = new PricingEngine();
