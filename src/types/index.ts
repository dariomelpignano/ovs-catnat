// =============================================================================
// OVS-CatNat Type Definitions
// Aligned with ARCHITECTURE.md Section 5.2 Data Model
// =============================================================================

// -----------------------------------------------------------------------------
// Store Entity
// -----------------------------------------------------------------------------
export type StoreStatus = "active" | "inactive" | "pending" | "suspended";

export interface Store {
  storeCode: string;
  businessName: string;
  address: string;
  squareMeters: number;
  status: StoreStatus;
  activationDate: Date | null;
  closureDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// -----------------------------------------------------------------------------
// Policy Entity
// -----------------------------------------------------------------------------
export type PolicyStatus = "active" | "expired" | "cancelled" | "pending";
export type CoverageType = "catnat" | "property" | "combined";

export interface Policy {
  policyId: string;
  storeCode: string;
  coverageType: CoverageType;
  insuredSum: number;
  premium: number;
  effectiveFrom: Date;
  effectiveTo: Date;
  status: PolicyStatus;
  createdAt: Date;
  updatedAt: Date;
}

// -----------------------------------------------------------------------------
// Certificate Entity
// -----------------------------------------------------------------------------
export interface Certificate {
  certId: string;
  policyId: string;
  issueDate: Date;
  documentUrl: string;
  validFrom: Date;
  validTo: Date;
  createdAt: Date;
}

// -----------------------------------------------------------------------------
// Audit Log
// -----------------------------------------------------------------------------
export type AuditAction =
  | "store_created"
  | "store_updated"
  | "store_deactivated"
  | "policy_created"
  | "policy_renewed"
  | "policy_cancelled"
  | "certificate_generated"
  | "file_imported"
  | "premium_calculated";

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: "store" | "policy" | "certificate" | "import";
  entityId: string;
  previousState: Record<string, unknown> | null;
  newState: Record<string, unknown> | null;
  performedBy: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// File Import
// -----------------------------------------------------------------------------
export type ImportStatus = "pending" | "processing" | "completed" | "failed";

export interface FileImport {
  importId: string;
  filename: string;
  status: ImportStatus;
  totalRecords: number;
  processedRecords: number;
  errorRecords: number;
  errors: ImportError[];
  uploadedBy: string;
  uploadedAt: Date;
  completedAt: Date | null;
}

export interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

// -----------------------------------------------------------------------------
// Pricing Configuration
// -----------------------------------------------------------------------------
export interface PricingConfig {
  coverageType: CoverageType;
  ratePerSquareMeter: number;
  minimumPremium: number;
  maximumInsuredSum: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

// -----------------------------------------------------------------------------
// User & Authentication
// -----------------------------------------------------------------------------
export type UserRole = "store_manager" | "admin" | "broker";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  storeCode: string | null;
  name: string;
  createdAt: Date;
  lastLogin: Date | null;
}

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: Date;
}

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// -----------------------------------------------------------------------------
// Dashboard View Models
// -----------------------------------------------------------------------------
export interface StoreDashboard {
  store: Store;
  policy: Policy | null;
  certificate: Certificate | null;
  coverageStatus: "covered" | "not_covered" | "expiring_soon";
}

export interface AdminDashboard {
  totalStores: number;
  activeStores: number;
  totalPremium: number;
  recentImports: FileImport[];
  pendingActions: number;
}
