// =============================================================================
// Notification Service
// Aligned with ARCHITECTURE.md - Output & Reporting Layer
// Handles transactional email notifications
// =============================================================================

import type { Store, Policy, User } from "~/types";

export type NotificationType =
  | "store_activated"
  | "store_deactivated"
  | "policy_created"
  | "policy_expiring"
  | "policy_renewed"
  | "certificate_ready"
  | "import_completed"
  | "import_failed";

export interface NotificationPayload {
  type: NotificationType;
  recipient: {
    email: string;
    name: string;
  };
  data: Record<string, unknown>;
}

export interface NotificationResult {
  id: string;
  type: NotificationType;
  recipient: string;
  status: "sent" | "failed" | "queued";
  sentAt?: Date;
  error?: string;
}

export interface EmailTemplate {
  subject: string;
  textBody: string;
  htmlBody: string;
}

export class NotificationService {
  private templates: Map<NotificationType, (data: Record<string, unknown>) => EmailTemplate> =
    new Map();
  private notificationLog: NotificationResult[] = [];

  constructor() {
    this.registerDefaultTemplates();
  }

  /**
   * Register default email templates
   */
  private registerDefaultTemplates(): void {
    // Store Activated
    this.templates.set("store_activated", (data) => ({
      subject: "OVS CatNat - Copertura Attivata",
      textBody: `
Gentile ${data.storeName},

La informiamo che la copertura assicurativa per il punto vendita ${data.storeCode} è stata attivata con successo.

Dettagli copertura:
- Ubicazione: ${data.address}
- Superficie: ${data.squareMeters} mq
- Somma Assicurata: ${data.insuredSum}
- Validità: dal ${data.effectiveFrom} al ${data.effectiveTo}

Può accedere al portale per visualizzare i dettagli e scaricare il certificato.

Cordiali saluti,
Gruppo MAG
      `.trim(),
      htmlBody: this.wrapHtml(`
        <h2>Copertura Attivata</h2>
        <p>Gentile ${data.storeName},</p>
        <p>La informiamo che la copertura assicurativa per il punto vendita <strong>${data.storeCode}</strong> è stata attivata con successo.</p>

        <div class="info-box">
          <h3>Dettagli Copertura</h3>
          <ul>
            <li><strong>Ubicazione:</strong> ${data.address}</li>
            <li><strong>Superficie:</strong> ${data.squareMeters} mq</li>
            <li><strong>Somma Assicurata:</strong> ${data.insuredSum}</li>
            <li><strong>Validità:</strong> dal ${data.effectiveFrom} al ${data.effectiveTo}</li>
          </ul>
        </div>

        <p>Può accedere al <a href="${data.portalUrl}">portale</a> per visualizzare i dettagli e scaricare il certificato.</p>
      `),
    }));

    // Store Deactivated
    this.templates.set("store_deactivated", (data) => ({
      subject: "OVS CatNat - Cessazione Copertura",
      textBody: `
Gentile ${data.storeName},

La informiamo che la copertura assicurativa per il punto vendita ${data.storeCode} è stata cessata.

Data cessazione: ${data.closureDate}

Per informazioni contattare support@mag.it

Cordiali saluti,
Gruppo MAG
      `.trim(),
      htmlBody: this.wrapHtml(`
        <h2>Cessazione Copertura</h2>
        <p>Gentile ${data.storeName},</p>
        <p>La informiamo che la copertura assicurativa per il punto vendita <strong>${data.storeCode}</strong> è stata cessata.</p>

        <div class="info-box warning">
          <p><strong>Data cessazione:</strong> ${data.closureDate}</p>
        </div>

        <p>Per informazioni contattare <a href="mailto:support@mag.it">support@mag.it</a></p>
      `),
    }));

    // Policy Expiring
    this.templates.set("policy_expiring", (data) => ({
      subject: "OVS CatNat - Polizza in Scadenza",
      textBody: `
Gentile ${data.storeName},

La informiamo che la polizza per il punto vendita ${data.storeCode} è in scadenza.

Data scadenza: ${data.expiryDate}
Giorni rimanenti: ${data.daysRemaining}

La polizza verrà rinnovata automaticamente salvo diversa comunicazione.

Cordiali saluti,
Gruppo MAG
      `.trim(),
      htmlBody: this.wrapHtml(`
        <h2>Polizza in Scadenza</h2>
        <p>Gentile ${data.storeName},</p>
        <p>La informiamo che la polizza per il punto vendita <strong>${data.storeCode}</strong> è in scadenza.</p>

        <div class="info-box warning">
          <p><strong>Data scadenza:</strong> ${data.expiryDate}</p>
          <p><strong>Giorni rimanenti:</strong> ${data.daysRemaining}</p>
        </div>

        <p>La polizza verrà rinnovata automaticamente salvo diversa comunicazione.</p>
      `),
    }));

    // Import Completed
    this.templates.set("import_completed", (data) => ({
      subject: "OVS CatNat - Importazione Completata",
      textBody: `
Importazione dati completata.

File: ${data.filename}
Record processati: ${data.processedRecords}/${data.totalRecords}
Errori: ${data.errorRecords}

Accedi al portale admin per i dettagli.

Gruppo MAG
      `.trim(),
      htmlBody: this.wrapHtml(`
        <h2>Importazione Completata</h2>
        <p>L'importazione dati è stata completata.</p>

        <div class="info-box">
          <h3>Riepilogo</h3>
          <ul>
            <li><strong>File:</strong> ${data.filename}</li>
            <li><strong>Record processati:</strong> ${data.processedRecords}/${data.totalRecords}</li>
            <li><strong>Errori:</strong> ${data.errorRecords}</li>
          </ul>
        </div>

        <p><a href="${data.adminUrl}">Accedi al portale admin</a> per i dettagli.</p>
      `),
    }));

    // Import Failed
    this.templates.set("import_failed", (data) => ({
      subject: "OVS CatNat - Importazione Fallita",
      textBody: `
ATTENZIONE: Importazione dati fallita.

File: ${data.filename}
Errore: ${data.error}

Verificare il file e riprovare.

Gruppo MAG
      `.trim(),
      htmlBody: this.wrapHtml(`
        <h2 style="color: #dc2626;">Importazione Fallita</h2>
        <p>L'importazione dati ha riscontrato un errore.</p>

        <div class="info-box error">
          <p><strong>File:</strong> ${data.filename}</p>
          <p><strong>Errore:</strong> ${data.error}</p>
        </div>

        <p>Verificare il file e riprovare.</p>
      `),
    }));
  }

  /**
   * Wrap HTML content in email template
   */
  private wrapHtml(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          h2 {
            color: #e31837;
            border-bottom: 2px solid #e31837;
            padding-bottom: 10px;
          }
          .info-box {
            background: #f8fafc;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
          }
          .info-box.warning {
            border-left-color: #f59e0b;
            background: #fffbeb;
          }
          .info-box.error {
            border-left-color: #dc2626;
            background: #fef2f2;
          }
          .info-box h3 {
            margin-top: 0;
            font-size: 14px;
            color: #666;
          }
          .info-box ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          a {
            color: #e31837;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="color: #e31837; font-size: 20px;">OVS CatNat</h1>
        </div>
        ${content}
        <div class="footer">
          <p>Gruppo MAG - Gestione Polizze OVS</p>
          <p>Questa è una comunicazione automatica, non rispondere a questa email.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send a notification
   */
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const template = this.templates.get(payload.type);

    if (!template) {
      const result: NotificationResult = {
        id: `NOTIF-${Date.now()}`,
        type: payload.type,
        recipient: payload.recipient.email,
        status: "failed",
        error: `Unknown notification type: ${payload.type}`,
      };
      this.notificationLog.push(result);
      return result;
    }

    const email = template(payload.data);

    // In production, this would call an email service (SendGrid, SES, etc.)
    // For now, we just log the email
    console.log(`
      ========== EMAIL NOTIFICATION ==========
      To: ${payload.recipient.email}
      Subject: ${email.subject}
      Body: ${email.textBody}
      =========================================
    `);

    const result: NotificationResult = {
      id: `NOTIF-${Date.now()}`,
      type: payload.type,
      recipient: payload.recipient.email,
      status: "sent",
      sentAt: new Date(),
    };

    this.notificationLog.push(result);
    return result;
  }

  /**
   * Send store activation notification
   */
  async notifyStoreActivated(store: Store, policy: Policy): Promise<NotificationResult> {
    const formatDate = (date: Date) =>
      new Intl.DateTimeFormat("it-IT").format(new Date(date));
    const formatCurrency = (value: number) =>
      new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);

    return this.send({
      type: "store_activated",
      recipient: {
        email: `${store.storeCode.toLowerCase()}@ovs.it`,
        name: store.businessName,
      },
      data: {
        storeName: store.businessName,
        storeCode: store.storeCode,
        address: store.address,
        squareMeters: store.squareMeters.toLocaleString("it-IT"),
        insuredSum: formatCurrency(policy.insuredSum),
        effectiveFrom: formatDate(policy.effectiveFrom),
        effectiveTo: formatDate(policy.effectiveTo),
        portalUrl: "https://catnat.ovs.it/store",
      },
    });
  }

  /**
   * Send store deactivation notification
   */
  async notifyStoreDeactivated(store: Store): Promise<NotificationResult> {
    const formatDate = (date: Date) =>
      new Intl.DateTimeFormat("it-IT").format(new Date(date));

    return this.send({
      type: "store_deactivated",
      recipient: {
        email: `${store.storeCode.toLowerCase()}@ovs.it`,
        name: store.businessName,
      },
      data: {
        storeName: store.businessName,
        storeCode: store.storeCode,
        closureDate: formatDate(store.closureDate ?? new Date()),
      },
    });
  }

  /**
   * Send import completion notification
   */
  async notifyImportCompleted(
    user: User,
    filename: string,
    totalRecords: number,
    processedRecords: number,
    errorRecords: number
  ): Promise<NotificationResult> {
    return this.send({
      type: "import_completed",
      recipient: {
        email: user.email,
        name: user.name,
      },
      data: {
        filename,
        totalRecords,
        processedRecords,
        errorRecords,
        adminUrl: "https://catnat.ovs.it/admin/import",
      },
    });
  }

  /**
   * Get notification log
   */
  getLog(): NotificationResult[] {
    return [...this.notificationLog];
  }
}

// Singleton instance
export const notificationService = new NotificationService();
