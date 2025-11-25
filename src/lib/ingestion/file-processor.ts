// =============================================================================
// File Processor - CSV Import Handler
// Handles parsing, mapping, and validation of store data imports
// =============================================================================

import type { FileImport, ImportError } from "~/types";

export interface ImportRow {
  storeCode: string;
  businessName: string;
  address: string;
  squareMeters: number;
}

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
  /**
   * Parse CSV content into raw row objects
   * Supports both comma and semicolon delimiters
   */
  parseCSV(content: string): Record<string, string>[] {
    const lines = content.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have at least a header row and one data row");
    }

    const headers = lines[0].split(/[,;]/).map(h => h.trim().replace(/"/g, ""));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const values = line.split(/[,;]/).map(v => v.trim().replace(/"/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ?? "";
      });
      rows.push(row);
    }

    return rows;
  }

  /**
   * Map raw CSV rows to typed ImportRow objects
   * Returns both successfully mapped rows and any errors encountered
   */
  mapRows(rawRows: Record<string, string>[]): { rows: ImportRow[]; errors: ImportError[] } {
    if (rawRows.length === 0) {
      return { rows: [], errors: [] };
    }

    const rows: ImportRow[] = [];
    const errors: ImportError[] = [];

    // Find column mappings (case-insensitive, keyword-based)
    const findCol = (keywords: string[]) =>
      Object.keys(rawRows[0]).find(h =>
        keywords.some(k => h.toLowerCase().includes(k))
      );

    const storeCodeCol = findCol(["codice", "store_code", "code", "id"]);
    const businessNameCol = findCol(["ragione", "nome", "name", "business"]);
    const addressCol = findCol(["indirizzo", "address", "ubicazione"]);
    const sqmCol = findCol(["metri", "mq", "square", "superficie"]);

    // Check for required columns
    if (!storeCodeCol) {
      errors.push({
        row: 0,
        field: "storeCode",
        value: "",
        message: "Colonna codice punto vendita non trovata. Attese: 'codice', 'store_code', 'code', o 'id'",
      });
    }

    if (!sqmCol) {
      errors.push({
        row: 0,
        field: "squareMeters",
        value: "",
        message: "Colonna metri quadri non trovata. Attese: 'metri', 'mq', 'square', o 'superficie'",
      });
    }

    // If required columns are missing, return early with errors
    if (!storeCodeCol || !sqmCol) {
      return { rows: [], errors };
    }

    // Process each row
    rawRows.forEach((raw, index) => {
      const rowNum = index + 2; // +2 for 1-based indexing and header row
      const storeCode = raw[storeCodeCol]?.trim() ?? "";
      const squareMetersStr = raw[sqmCol]?.trim() ?? "";

      // Validate store code
      if (!storeCode) {
        errors.push({
          row: rowNum,
          field: "storeCode",
          value: storeCode,
          message: "Codice store obbligatorio",
        });
        return;
      }

      // Validate and parse square meters
      const squareMeters = parseFloat(squareMetersStr.replace(",", "."));
      if (isNaN(squareMeters) || squareMeters <= 0) {
        errors.push({
          row: rowNum,
          field: "squareMeters",
          value: squareMetersStr,
          message: "Metri quadri deve essere un numero positivo",
        });
        return;
      }

      // Successfully mapped row
      rows.push({
        storeCode,
        businessName: businessNameCol ? raw[businessNameCol]?.trim() ?? "" : "",
        address: addressCol ? raw[addressCol]?.trim() ?? "" : "",
        squareMeters,
      });
    });

    return { rows, errors };
  }

  /**
   * Validate mapped rows for business rules
   * Checks for duplicates and suspicious values
   */
  validate(rows: ImportRow[]): ValidationResult {
    const errors: ImportError[] = [];
    const warnings: string[] = [];
    const seenCodes = new Set<string>();

    rows.forEach((row, index) => {
      const rowNum = index + 2;

      // Check for duplicate store codes
      if (seenCodes.has(row.storeCode)) {
        errors.push({
          row: rowNum,
          field: "storeCode",
          value: row.storeCode,
          message: "Codice duplicato nel file",
        });
      }
      seenCodes.add(row.storeCode);

      // Warn about suspicious square meter values
      if (row.squareMeters < 10) {
        warnings.push(`Riga ${rowNum}: mq (${row.squareMeters}) sembra troppo piccolo per un punto vendita`);
      }
      if (row.squareMeters > 50000) {
        warnings.push(`Riga ${rowNum}: mq (${row.squareMeters}) sembra troppo grande, verificare`);
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
   * Combines parsing, mapping, and validation
   * IMPORTANT: Status is based on BOTH mapping errors AND validation errors
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
      // Step 1: Parse CSV
      const rawRows = this.parseCSV(content);
      importRecord.totalRecords = rawRows.length;

      // Step 2: Map to typed rows
      const { rows, errors: mappingErrors } = this.mapRows(rawRows);

      // Step 3: Validate mapped rows
      const validation = this.validate(rows);

      // Combine all errors
      const allErrors = [...mappingErrors, ...validation.errors];
      importRecord.errors = allErrors;
      importRecord.processedRecords = rows.length;
      importRecord.errorRecords = allErrors.length;

      // FIXED: Status depends on BOTH mapping errors AND validation errors
      // Previously only checked validation.isValid, ignoring mappingErrors
      const hasNoErrors = mappingErrors.length === 0 && validation.isValid;

      importRecord.status = hasNoErrors ? "completed" : "failed";
      importRecord.completedAt = new Date();

      // Return combined validation result
      return {
        import: importRecord,
        rows: hasNoErrors ? rows : [], // Only return rows if no errors
        validation: {
          isValid: hasNoErrors,
          errors: allErrors,
          warnings: validation.warnings,
        },
      };
    } catch (error) {
      // Handle parsing errors
      importRecord.status = "failed";
      importRecord.errors.push({
        row: 0,
        field: "file",
        value: filename,
        message: error instanceof Error ? error.message : "Errore sconosciuto durante l'elaborazione",
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

export const fileProcessor = new FileProcessor();
