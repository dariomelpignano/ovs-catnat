// =============================================================================
// Certificate Generator
// Aligned with ARCHITECTURE.md - Output & Reporting Layer
// Generates PDF certificates for policies
// =============================================================================

import type { Store, Policy, Certificate } from "~/types";

export interface CertificateData {
  store: Store;
  policy: Policy;
  contractorName: string;
  contractorAddress: string;
  brokerName: string;
  insurerName: string;
}

export interface CertificateTemplate {
  header: string;
  content: string;
  footer: string;
}

export class CertificateGenerator {
  private baseUrl: string;

  constructor(baseUrl = "/documents/certificates") {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate certificate data structure
   */
  generateCertificateData(data: CertificateData): Certificate {
    const now = new Date();
    const certId = `CERT-${data.policy.policyId}-${Date.now()}`;

    return {
      certId,
      policyId: data.policy.policyId,
      issueDate: now,
      documentUrl: `${this.baseUrl}/${certId}.pdf`,
      validFrom: data.policy.effectiveFrom,
      validTo: data.policy.effectiveTo,
      createdAt: now,
    };
  }

  /**
   * Generate HTML template for certificate
   * In production, this would be converted to PDF using a library like puppeteer or pdfmake
   */
  generateTemplate(data: CertificateData): CertificateTemplate {
    const formatDate = (date: Date) =>
      new Intl.DateTimeFormat("it-IT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(date));

    const formatCurrency = (value: number) =>
      new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR",
      }).format(value);

    const coverageTypeLabel =
      data.policy.coverageType === "catnat"
        ? "Catastrofi Naturali"
        : data.policy.coverageType === "property"
          ? "Property"
          : "Property & Catastrofi Naturali";

    const header = `
      <div class="certificate-header">
        <div class="logo">
          <h1>${data.insurerName}</h1>
        </div>
        <div class="cert-title">
          <h2>CERTIFICATO DI ASSICURAZIONE</h2>
          <p>Polizza n. ${data.policy.policyId}</p>
        </div>
      </div>
    `;

    const content = `
      <div class="certificate-content">
        <section class="section">
          <h3>CONTRAENTE</h3>
          <p><strong>${data.contractorName}</strong></p>
          <p>${data.contractorAddress}</p>
        </section>

        <section class="section">
          <h3>ASSICURATO / UBICAZIONE RISCHIO</h3>
          <p><strong>Codice:</strong> ${data.store.storeCode}</p>
          <p><strong>Denominazione:</strong> ${data.store.businessName}</p>
          <p><strong>Indirizzo:</strong> ${data.store.address}</p>
          <p><strong>Superficie:</strong> ${data.store.squareMeters.toLocaleString("it-IT")} mq</p>
        </section>

        <section class="section">
          <h3>GARANZIE</h3>
          <table class="coverage-table">
            <thead>
              <tr>
                <th>Tipo Copertura</th>
                <th>Somma Assicurata</th>
                <th>Premio</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${coverageTypeLabel}</td>
                <td>${formatCurrency(data.policy.insuredSum)}</td>
                <td>${formatCurrency(data.policy.premium)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="section">
          <h3>VALIDITÀ</h3>
          <p><strong>Dal:</strong> ${formatDate(data.policy.effectiveFrom)}</p>
          <p><strong>Al:</strong> ${formatDate(data.policy.effectiveTo)}</p>
        </section>

        <section class="section">
          <h3>INTERMEDIARIO</h3>
          <p>${data.brokerName}</p>
        </section>
      </div>
    `;

    const footer = `
      <div class="certificate-footer">
        <p>Certificato emesso il ${formatDate(new Date())}</p>
        <p class="disclaimer">
          Il presente certificato attesta l'esistenza della copertura assicurativa
          alle condizioni previste dalla polizza di riferimento.
          Per le condizioni complete si rimanda al fascicolo informativo.
        </p>
      </div>
    `;

    return { header, content, footer };
  }

  /**
   * Generate full HTML document for certificate
   */
  generateHtmlDocument(data: CertificateData): string {
    const template = this.generateTemplate(data);

    return `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <title>Certificato - ${data.policy.policyId}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #333;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .certificate-header {
            text-align: center;
            border-bottom: 2px solid #e31837;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .certificate-header h1 {
            color: #e31837;
            font-size: 24pt;
          }
          .cert-title h2 {
            font-size: 16pt;
            margin-top: 15px;
          }
          .cert-title p {
            color: #666;
          }
          .section {
            margin-bottom: 25px;
          }
          .section h3 {
            font-size: 10pt;
            text-transform: uppercase;
            color: #666;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 10px;
          }
          .coverage-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .coverage-table th,
          .coverage-table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }
          .coverage-table th {
            background: #f5f5f5;
            font-weight: 600;
          }
          .certificate-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 9pt;
            color: #666;
          }
          .disclaimer {
            margin-top: 10px;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        ${template.header}
        ${template.content}
        ${template.footer}
      </body>
      </html>
    `;
  }

  /**
   * Generate certificate for a policy (returns metadata)
   */
  async generate(data: CertificateData): Promise<Certificate> {
    // In a real implementation, this would:
    // 1. Generate the HTML template
    // 2. Convert to PDF using a library
    // 3. Store the PDF in document storage
    // 4. Return the certificate metadata

    const certificate = this.generateCertificateData(data);

    // Generate HTML (for development/preview)
    const html = this.generateHtmlDocument(data);

    // TODO: In production, convert HTML to PDF and store
    console.log(`Certificate generated: ${certificate.certId}`);

    return certificate;
  }
}

// Singleton instance
export const certificateGenerator = new CertificateGenerator();
