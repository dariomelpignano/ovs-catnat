// =============================================================================
// Export Service
// Aligned with ARCHITECTURE.md - Output & Reporting Layer
// Generates reports for insurance company (appendici, premium adjustments)
// =============================================================================

import type { Store, Policy, AuditLog } from "~/types";

export interface ExportOptions {
  format: "csv" | "json" | "xlsx";
  includeHeaders?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface PortfolioExport {
  generatedAt: Date;
  totalStores: number;
  totalPremium: number;
  totalInsuredSum: number;
  stores: StoreExportRow[];
}

export interface StoreExportRow {
  storeCode: string;
  businessName: string;
  address: string;
  squareMeters: number;
  status: string;
  activationDate: string | null;
  coverageType: string;
  insuredSum: number;
  premium: number;
  policyEffectiveFrom: string;
  policyEffectiveTo: string;
}

export interface VariationExport {
  generatedAt: Date;
  periodFrom: Date;
  periodTo: Date;
  additions: StoreExportRow[];
  modifications: StoreExportRow[];
  removals: StoreExportRow[];
  premiumDelta: number;
}

export class ExportService {
  /**
   * Generate full portfolio export for insurance company
   */
  generatePortfolioExport(
    stores: Store[],
    policies: Map<string, Policy>,
    options: ExportOptions = { format: "csv" }
  ): PortfolioExport {
    const rows: StoreExportRow[] = [];
    let totalPremium = 0;
    let totalInsuredSum = 0;

    for (const store of stores) {
      const policy = policies.get(store.storeCode);

      if (store.status === "active" && policy) {
        totalPremium += policy.premium;
        totalInsuredSum += policy.insuredSum;

        rows.push({
          storeCode: store.storeCode,
          businessName: store.businessName,
          address: store.address,
          squareMeters: store.squareMeters,
          status: store.status,
          activationDate: store.activationDate
            ? this.formatDate(store.activationDate)
            : null,
          coverageType: policy.coverageType,
          insuredSum: policy.insuredSum,
          premium: policy.premium,
          policyEffectiveFrom: this.formatDate(policy.effectiveFrom),
          policyEffectiveTo: this.formatDate(policy.effectiveTo),
        });
      }
    }

    return {
      generatedAt: new Date(),
      totalStores: rows.length,
      totalPremium: Math.round(totalPremium * 100) / 100,
      totalInsuredSum: Math.round(totalInsuredSum * 100) / 100,
      stores: rows,
    };
  }

  /**
   * Generate variation report (appendice) for a period
   */
  generateVariationExport(
    auditLog: AuditLog[],
    stores: Map<string, Store>,
    policies: Map<string, Policy>,
    periodFrom: Date,
    periodTo: Date
  ): VariationExport {
    const additions: StoreExportRow[] = [];
    const modifications: StoreExportRow[] = [];
    const removals: StoreExportRow[] = [];

    // Filter audit entries for the period
    const periodEntries = auditLog.filter(
      (entry) =>
        entry.timestamp >= periodFrom &&
        entry.timestamp <= periodTo &&
        entry.entityType === "store"
    );

    for (const entry of periodEntries) {
      const store = stores.get(entry.entityId);
      const policy = store ? policies.get(store.storeCode) : null;

      if (!store || !policy) continue;

      const row: StoreExportRow = {
        storeCode: store.storeCode,
        businessName: store.businessName,
        address: store.address,
        squareMeters: store.squareMeters,
        status: store.status,
        activationDate: store.activationDate
          ? this.formatDate(store.activationDate)
          : null,
        coverageType: policy.coverageType,
        insuredSum: policy.insuredSum,
        premium: policy.premium,
        policyEffectiveFrom: this.formatDate(policy.effectiveFrom),
        policyEffectiveTo: this.formatDate(policy.effectiveTo),
      };

      switch (entry.action) {
        case "store_created":
          additions.push(row);
          break;
        case "store_updated":
          modifications.push(row);
          break;
        case "store_deactivated":
          removals.push(row);
          break;
      }
    }

    // Calculate premium delta
    const additionsPremium = additions.reduce((sum, r) => sum + r.premium, 0);
    const removalsPremium = removals.reduce((sum, r) => sum + r.premium, 0);
    const premiumDelta = additionsPremium - removalsPremium;

    return {
      generatedAt: new Date(),
      periodFrom,
      periodTo,
      additions,
      modifications,
      removals,
      premiumDelta: Math.round(premiumDelta * 100) / 100,
    };
  }

  /**
   * Convert export data to CSV format
   */
  toCSV(data: PortfolioExport | VariationExport, includeHeaders = true): string {
    const headers = [
      "Codice PV",
      "Ragione Sociale",
      "Indirizzo",
      "mq",
      "Stato",
      "Data Attivazione",
      "Tipo Copertura",
      "Somma Assicurata",
      "Premio",
      "Validità Da",
      "Validità A",
    ];

    const rows: string[][] = [];

    if (includeHeaders) {
      rows.push(headers);
    }

    const storeRows = "stores" in data ? data.stores : [
      ...("additions" in data ? data.additions : []),
      ...("modifications" in data ? data.modifications : []),
    ];

    for (const store of storeRows) {
      rows.push([
        store.storeCode,
        this.escapeCSV(store.businessName),
        this.escapeCSV(store.address),
        store.squareMeters.toString(),
        store.status,
        store.activationDate ?? "",
        store.coverageType,
        store.insuredSum.toFixed(2),
        store.premium.toFixed(2),
        store.policyEffectiveFrom,
        store.policyEffectiveTo,
      ]);
    }

    return rows.map((row) => row.join(";")).join("\n");
  }

  /**
   * Convert export data to JSON format
   */
  toJSON(data: PortfolioExport | VariationExport): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Generate summary report
   */
  generateSummaryReport(
    stores: Store[],
    policies: Map<string, Policy>
  ): {
    totalStores: number;
    activeStores: number;
    inactiveStores: number;
    totalSquareMeters: number;
    totalPremium: number;
    totalInsuredSum: number;
    averagePremiumPerStore: number;
    averagePremiumPerSqm: number;
    byRegion: Record<string, { stores: number; premium: number }>;
  } {
    let activeStores = 0;
    let inactiveStores = 0;
    let totalSquareMeters = 0;
    let totalPremium = 0;
    let totalInsuredSum = 0;
    const byRegion: Record<string, { stores: number; premium: number }> = {};

    for (const store of stores) {
      if (store.status === "active") {
        activeStores++;
        totalSquareMeters += store.squareMeters;

        const policy = policies.get(store.storeCode);
        if (policy) {
          totalPremium += policy.premium;
          totalInsuredSum += policy.insuredSum;
        }

        // Extract region from address (simplified)
        const region = this.extractRegion(store.address);
        if (!byRegion[region]) {
          byRegion[region] = { stores: 0, premium: 0 };
        }
        byRegion[region].stores++;
        byRegion[region].premium += policy?.premium ?? 0;
      } else {
        inactiveStores++;
      }
    }

    return {
      totalStores: stores.length,
      activeStores,
      inactiveStores,
      totalSquareMeters,
      totalPremium: Math.round(totalPremium * 100) / 100,
      totalInsuredSum: Math.round(totalInsuredSum * 100) / 100,
      averagePremiumPerStore:
        activeStores > 0
          ? Math.round((totalPremium / activeStores) * 100) / 100
          : 0,
      averagePremiumPerSqm:
        totalSquareMeters > 0
          ? Math.round((totalPremium / totalSquareMeters) * 100) / 100
          : 0,
      byRegion,
    };
  }

  /**
   * Format date for export
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat("it-IT").format(new Date(date));
  }

  /**
   * Escape CSV value
   */
  private escapeCSV(value: string): string {
    if (value.includes(";") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Extract region from address (simplified)
   */
  private extractRegion(address: string): string {
    const regions = [
      "Lombardia",
      "Lazio",
      "Campania",
      "Sicilia",
      "Veneto",
      "Piemonte",
      "Emilia-Romagna",
      "Toscana",
      "Puglia",
      "Calabria",
    ];

    // Simplified region detection based on city
    if (address.includes("Milano")) return "Lombardia";
    if (address.includes("Roma")) return "Lazio";
    if (address.includes("Napoli")) return "Campania";
    if (address.includes("Torino")) return "Piemonte";
    if (address.includes("Firenze")) return "Toscana";
    if (address.includes("Bologna")) return "Emilia-Romagna";
    if (address.includes("Venezia") || address.includes("Verona"))
      return "Veneto";

    return "Altro";
  }
}

// Singleton instance
export const exportService = new ExportService();
