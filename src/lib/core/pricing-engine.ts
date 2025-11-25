// =============================================================================
// Pricing Engine - Premium Calculation
// Calculates insurance premiums based on store square meters and coverage type
// =============================================================================

import type { CoverageType, PricingConfig, Store } from "~/types";

// Default pricing configurations
// NOTE: effectiveFrom set to a past date to ensure configs are always active
const DEFAULT_PRICING_CONFIGS: PricingConfig[] = [
  {
    coverageType: "catnat",
    ratePerSquareMeter: 2.5,
    minimumPremium: 500,
    maximumInsuredSum: 10_000_000,
    effectiveFrom: new Date("2024-01-01"), // Changed from 2025-01-01
    effectiveTo: null,
  },
  {
    coverageType: "property",
    ratePerSquareMeter: 4.0,
    minimumPremium: 750,
    maximumInsuredSum: 15_000_000,
    effectiveFrom: new Date("2024-01-01"),
    effectiveTo: null,
  },
  {
    coverageType: "combined",
    ratePerSquareMeter: 5.5,
    minimumPremium: 1000,
    maximumInsuredSum: 20_000_000,
    effectiveFrom: new Date("2024-01-01"),
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

export interface PricingError {
  storeCode: string;
  coverageType: CoverageType;
  error: string;
}

export interface BulkPricingResult {
  results: Map<string, PricingResult>;
  errors: PricingError[];
}

export class PricingEngine {
  private configs: PricingConfig[];

  constructor(configs?: PricingConfig[]) {
    this.configs = configs ?? DEFAULT_PRICING_CONFIGS;
  }

  /**
   * Get the active pricing configuration for a coverage type
   * Returns null if no config is active for the given date
   */
  getActiveConfig(
    coverageType: CoverageType,
    effectiveDate: Date = new Date()
  ): PricingConfig | null {
    return (
      this.configs.find(
        c =>
          c.coverageType === coverageType &&
          c.effectiveFrom <= effectiveDate &&
          (c.effectiveTo === null || c.effectiveTo >= effectiveDate)
      ) ?? null
    );
  }

  /**
   * Check if pricing is available for a coverage type at a given date
   */
  hasPricingConfig(
    coverageType: CoverageType,
    effectiveDate: Date = new Date()
  ): boolean {
    return this.getActiveConfig(coverageType, effectiveDate) !== null;
  }

  /**
   * Calculate premium for a single store
   * Throws an error if no pricing config is available
   */
  calculate(
    store: Store,
    coverageType: CoverageType,
    effectiveDate: Date = new Date()
  ): PricingResult {
    const config = this.getActiveConfig(coverageType, effectiveDate);

    if (!config) {
      const formattedDate = effectiveDate.toISOString().split("T")[0];
      throw new Error(
        `Nessuna configurazione di pricing attiva per "${coverageType}" alla data ${formattedDate}. ` +
        `Verificare che esista una configurazione valida per il periodo richiesto.`
      );
    }

    const { squareMeters } = store;
    const { ratePerSquareMeter, minimumPremium, maximumInsuredSum } = config;

    // Calculate base premium: square meters × rate
    const basePremium = squareMeters * ratePerSquareMeter;

    // Apply minimum premium floor
    const premium = Math.max(basePremium, minimumPremium);

    // Calculate insured sum: square meters × €1000, capped at maximum
    const rawInsuredSum = squareMeters * 1000;
    const insuredSum = Math.min(rawInsuredSum, maximumInsuredSum);

    // Track adjustments (minimum premium enforcement)
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
   * Calculate premiums for multiple stores
   * Returns both successful results AND errors (instead of silently swallowing them)
   */
  calculateBulk(
    stores: Store[],
    coverageType: CoverageType,
    effectiveDate: Date = new Date()
  ): BulkPricingResult {
    const results = new Map<string, PricingResult>();
    const errors: PricingError[] = [];

    for (const store of stores) {
      try {
        const result = this.calculate(store, coverageType, effectiveDate);
        results.set(store.storeCode, result);
      } catch (error) {
        // FIXED: Collect errors instead of silently ignoring them
        errors.push({
          storeCode: store.storeCode,
          coverageType,
          error: error instanceof Error ? error.message : "Errore sconosciuto nel calcolo del premio",
        });
      }
    }

    return { results, errors };
  }

  /**
   * Get all available pricing configurations
   */
  getConfigs(): PricingConfig[] {
    return [...this.configs];
  }

  /**
   * Add or update a pricing configuration
   */
  setConfig(config: PricingConfig): void {
    const existingIndex = this.configs.findIndex(
      c =>
        c.coverageType === config.coverageType &&
        c.effectiveFrom.getTime() === config.effectiveFrom.getTime()
    );

    if (existingIndex >= 0) {
      this.configs[existingIndex] = config;
    } else {
      this.configs.push(config);
    }
  }
}

export const pricingEngine = new PricingEngine();
