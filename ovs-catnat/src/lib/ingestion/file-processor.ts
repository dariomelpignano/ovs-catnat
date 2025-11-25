// =============================================================================
// File Processor
// Aligned with ARCHITECTURE.md - Data Ingestion Layer
// Handles Excel/CSV file parsing and validation
// =============================================================================

import type { FileImport, ImportError, ImportStatus } from "~/types";

// Expected columns in the import file
export interface ImportRow {
  storeCode: string;
  businessName: string;
  address: string;
  squareMeters: number;
}

// Column mapping configuration
export interface ColumnMapping {
  storeCode: string;
  businessName: string;
  address: string;
  squareMeters: string;
}

// Default column mappings (Italian headers from OVS)
const DEFAULT_COLUMN_MAPPING: ColumnMapping = {
  storeCode: "Codice Punto Vendita",
  businessName: "Ragione Sociale",
  address: "Indirizzo",
  squareMeters: "Metri Quadri",
};

// Alternative column names that might be used
const COLUMN_ALIASES: Record<keyof ColumnMapping, string[]> = {
  storeCode: ["store_code", "codice", "cod_pv", "id", "code"],
  businessName: ["business_name", "nome", "ragione_sociale", "name", "denominazione"],
  address: ["indirizzo", "ubicazione", "location", "ubicazione_rischio"],
  squareMeters: ["mq", "square_meters", "superficie", "area", "metri_quadri"],
};

export interface ValidationResult {
  isValid: boolean;
  errors: ImportError[];
  warnings: string[];
}

export interface ProcessingResult {
  import: FileImport;
  rows: ImportRow[];
  validation: ValidationResult;
}

export class FileProcessor {
  private columnMapping: ColumnMapping;

  constructor(mapping: Partial<ColumnMapping> = {}) {
    this.columnMapping = { ...DEFAULT_COLUMN_MAPPING, ...mapping };
  }

  /**
   * Parse CSV content into rows
   */
  parseCSV(content: string): Record<string, string>[] {
    const lines = content.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have at least a header row and one data row");
    }

    const headers = this.parseCSVLine(lines[0]);
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() ?? "";
      });

      rows.push(row);
    }

    return rows;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === "," || char === ";") && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Find the actual column name from headers using aliases
   */
  private findColumn(
    headers: string[],
    field: keyof ColumnMapping
  ): string | null {
    const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

    // Check exact match first
    const exactMatch = this.columnMapping[field];
    if (normalizedHeaders.includes(exactMatch.toLowerCase())) {
      return headers[normalizedHeaders.indexOf(exactMatch.toLowerCase())];
    }

    // Check aliases
    for (const alias of COLUMN_ALIASES[field]) {
      const index = normalizedHeaders.indexOf(alias.toLowerCase());
      if (index !== -1) {
        return headers[index];
      }
    }

    return null;
  }

  /**
   * Map raw rows to ImportRow format
   */
  mapRows(rawRows: Record<string, string>[]): {
    rows: ImportRow[];
    errors: ImportError[];
  } {
    if (rawRows.length === 0) {
      return { rows: [], errors: [] };
    }

    const headers = Object.keys(rawRows[0]);
    const rows: ImportRow[] = [];
    const errors: ImportError[] = [];

    // Find actual column names
    const storeCodeCol = this.findColumn(headers, "storeCode");
    const businessNameCol = this.findColumn(headers, "businessName");
    const addressCol = this.findColumn(headers, "address");
    const squareMetersCol = this.findColumn(headers, "squareMeters");

    // Validate required columns exist
    if (!storeCodeCol) {
      errors.push({
        row: 0,
        field: "storeCode",
        value: "",
        message: "Required column 'Codice Punto Vendita' not found",
      });
    }
    if (!squareMetersCol) {
      errors.push({
        row: 0,
        field: "squareMeters",
        value: "",
        message: "Required column 'Metri Quadri' not found",
      });
    }

    if (errors.length > 0) {
      return { rows: [], errors };
    }

    // Map each row
    rawRows.forEach((raw, index) => {
      const rowNum = index + 2; // 1-indexed + header row
      const storeCode = raw[storeCodeCol!]?.trim() ?? "";
      const businessName = businessNameCol ? raw[businessNameCol]?.trim() ?? "" : "";
      const address = addressCol ? raw[addressCol]?.trim() ?? "" : "";
      const squareMetersStr = raw[squareMetersCol!]?.trim() ?? "";

      // Validate store code
      if (!storeCode) {
        errors.push({
          row: rowNum,
          field: "storeCode",
          value: storeCode,
          message: "Store code is required",
        });
        return;
      }

      // Parse and validate square meters
      const squareMeters = parseFloat(squareMetersStr.replace(",", "."));
      if (isNaN(squareMeters) || squareMeters <= 0) {
        errors.push({
          row: rowNum,
          field: "squareMeters",
          value: squareMetersStr,
          message: "Square meters must be a positive number",
        });
        return;
      }

      rows.push({
        storeCode,
        businessName,
        address,
        squareMeters,
      });
    });

    return { rows, errors };
  }

  /**
   * Validate import rows
   */
  validate(rows: ImportRow[]): ValidationResult {
    const errors: ImportError[] = [];
    const warnings: string[] = [];
    const seenCodes = new Set<string>();

    rows.forEach((row, index) => {
      const rowNum = index + 2;

      // Check for duplicates
      if (seenCodes.has(row.storeCode)) {
        errors.push({
          row: rowNum,
          field: "storeCode",
          value: row.storeCode,
          message: "Duplicate store code",
        });
      }
      seenCodes.add(row.storeCode);

      // Validate square meters range
      if (row.squareMeters < 10) {
        warnings.push(`Row ${rowNum}: Square meters (${row.squareMeters}) seems unusually small`);
      }
      if (row.squareMeters > 50000) {
        warnings.push(`Row ${rowNum}: Square meters (${row.squareMeters}) seems unusually large`);
      }

      // Check for missing optional fields
      if (!row.businessName) {
        warnings.push(`Row ${rowNum}: Business name is empty`);
      }
      if (!row.address) {
        warnings.push(`Row ${rowNum}: Address is empty`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Process a complete file import
   */
  async processFile(
    filename: string,
    content: string,
    uploadedBy: string
  ): Promise<ProcessingResult> {
    const importRecord: FileImport = {
      importId: `IMP-${Date.now()}`,
      filename,
      status: "processing",
      totalRecords: 0,
      processedRecords: 0,
      errorRecords: 0,
      errors: [],
      uploadedBy,
      uploadedAt: new Date(),
      completedAt: null,
    };

    try {
      // Parse CSV
      const rawRows = this.parseCSV(content);
      importRecord.totalRecords = rawRows.length;

      // Map to typed rows
      const { rows, errors: mappingErrors } = this.mapRows(rawRows);
      importRecord.errors.push(...mappingErrors);

      // Validate
      const validation = this.validate(rows);
      importRecord.errors.push(...validation.errors);

      // Update counts
      importRecord.processedRecords = rows.length;
      importRecord.errorRecords = importRecord.errors.length;
      importRecord.status = validation.isValid ? "completed" : "failed";
      importRecord.completedAt = new Date();

      return {
        import: importRecord,
        rows,
        validation,
      };
    } catch (error) {
      importRecord.status = "failed";
      importRecord.errors.push({
        row: 0,
        field: "file",
        value: filename,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      importRecord.completedAt = new Date();

      return {
        import: importRecord,
        rows: [],
        validation: {
          isValid: false,
          errors: importRecord.errors,
          warnings: [],
        },
      };
    }
  }
}

// Singleton instance
export const fileProcessor = new FileProcessor();
