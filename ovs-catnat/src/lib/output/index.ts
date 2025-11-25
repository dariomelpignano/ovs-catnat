// =============================================================================
// Output & Reporting Layer - Public API
// =============================================================================

export {
  CertificateGenerator,
  certificateGenerator,
  type CertificateData,
  type CertificateTemplate,
} from "./certificate-generator";

export {
  NotificationService,
  notificationService,
  type NotificationType,
  type NotificationPayload,
  type NotificationResult,
} from "./notification-service";

export {
  ExportService,
  exportService,
  type ExportOptions,
  type PortfolioExport,
  type StoreExportRow,
  type VariationExport,
} from "./export-service";
