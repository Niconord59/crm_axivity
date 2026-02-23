import type { FactureData, FactureType, AcompteVerse } from "@/types";

// Format number as currency (EUR)
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

// Format date as French date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Escape HTML to prevent XSS
function escapeHtml(text: string | undefined | null): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Get invoice title based on type
function getFactureTitle(typeFacture?: FactureType): string {
  switch (typeFacture) {
    case "acompte":
      return "FACTURE D'ACOMPTE";
    case "solde":
      return "FACTURE DE SOLDE";
    default:
      return "FACTURE";
  }
}

// Generate acompte mention for acompte invoices
function generateAcompteMention(
  typeFacture: FactureType | undefined,
  pourcentage: number | undefined,
  montantTotal: number | undefined
): string {
  if (typeFacture !== "acompte" || !pourcentage || !montantTotal) return "";

  return `
    <div class="acompte-mention">
      <p><strong>Acompte de ${pourcentage}%</strong> sur un total de ${formatCurrency(montantTotal)} HT</p>
    </div>
  `;
}

// Generate acomptes summary for solde invoices
function generateAcomptesSummary(
  typeFacture: FactureType | undefined,
  acomptesVerses: AcompteVerse[] | undefined,
  montantTotalProjet: number | undefined,
  soldeDuHT: number
): string {
  if (typeFacture !== "solde" || !acomptesVerses || acomptesVerses.length === 0) return "";

  const acomptesLines = acomptesVerses.map((a) => `
    <div class="acompte-line">
      <span class="acompte-ref">${escapeHtml(a.numero)}</span>
      <span class="acompte-date">du ${formatDate(a.date)}</span>
      <span class="acompte-montant">-${formatCurrency(a.montantHT)}</span>
    </div>
  `).join("");

  const totalAcomptes = acomptesVerses.reduce((sum, a) => sum + a.montantHT, 0);

  return `
    <div class="acomptes-summary">
      <div class="summary-title">RÉCAPITULATIF DES ACOMPTES</div>
      <div class="summary-content">
        <div class="total-projet">
          <span>Montant total du projet HT</span>
          <span>${formatCurrency(montantTotalProjet || 0)}</span>
        </div>
        <div class="acomptes-list">
          <div class="acomptes-label">Acomptes versés :</div>
          ${acomptesLines}
        </div>
        <div class="total-acomptes">
          <span>Total des acomptes</span>
          <span>-${formatCurrency(totalAcomptes)}</span>
        </div>
        <div class="solde-du">
          <span>SOLDE DÛ HT</span>
          <span>${formatCurrency(soldeDuHT)}</span>
        </div>
      </div>
    </div>
  `;
}

export function generateFactureHTML(data: FactureData): string {
  // Get company info with fallback values
  const company = data.entreprise || {
    nom: "Mon Entreprise",
    couleurPrincipale: "#16a34a", // Green for invoices
  };

  const primaryColor = company.couleurPrincipale || "#16a34a";

  // Get invoice type-specific content
  const factureTitle = getFactureTitle(data.typeFacture);
  const acompteMentionHTML = generateAcompteMention(
    data.typeFacture,
    data.pourcentageAcompte,
    data.montantTotalProjet
  );
  const acomptesSummaryHTML = generateAcomptesSummary(
    data.typeFacture,
    data.acomptesVerses,
    data.montantTotalProjet,
    data.totalHT
  );

  // Build company info lines for header
  const companyInfoLines: string[] = [];
  if (company.formeJuridique) {
    companyInfoLines.push(escapeHtml(company.formeJuridique));
  }
  if (company.adresse) {
    companyInfoLines.push(escapeHtml(company.adresse));
  }
  if (company.codePostal || company.ville) {
    companyInfoLines.push(
      `${escapeHtml(company.codePostal)} ${escapeHtml(company.ville)}`.trim()
    );
  }
  if (company.pays && company.pays !== "France") {
    companyInfoLines.push(escapeHtml(company.pays));
  }
  if (company.siret) {
    companyInfoLines.push(`SIRET: ${escapeHtml(company.siret)}`);
  }
  if (company.email) {
    companyInfoLines.push(escapeHtml(company.email));
  }

  // Build footer info
  const footerParts: string[] = [];
  footerParts.push(escapeHtml(company.nom));
  if (company.formeJuridique && company.capital) {
    footerParts[0] += ` - ${escapeHtml(company.formeJuridique)} au capital de ${escapeHtml(company.capital)}`;
  }
  if (company.rcs) {
    footerParts.push(escapeHtml(company.rcs));
  }
  if (company.tvaIntracommunautaire) {
    footerParts.push(`TVA ${escapeHtml(company.tvaIntracommunautaire)}`);
  }

  const footerLine1 = footerParts.join(" - ");

  const footerAddressParts: string[] = [];
  if (company.adresse) {
    footerAddressParts.push(escapeHtml(company.adresse));
  }
  if (company.codePostal || company.ville) {
    footerAddressParts.push(
      `${escapeHtml(company.codePostal)} ${escapeHtml(company.ville)}`.trim()
    );
  }
  if (company.telephone) {
    footerAddressParts.push(`Tél: ${escapeHtml(company.telephone)}`);
  }
  if (company.email) {
    footerAddressParts.push(escapeHtml(company.email));
  }

  const footerLine2 = footerAddressParts.join(" - ");

  const linesHTML = data.lignes
    .map(
      (ligne, index) => `
      <tr>
        <td class="line-num">${index + 1}</td>
        <td class="description">${escapeHtml(ligne.description || ligne.serviceNom) || "-"}</td>
        <td class="qty">${ligne.quantite}</td>
        <td class="price">${formatCurrency(ligne.prixUnitaire)}</td>
        <td class="discount">${ligne.remisePourcent > 0 ? `${ligne.remisePourcent}%` : "-"}</td>
        <td class="total">${formatCurrency(ligne.montantHT)}</td>
      </tr>
    `
    )
    .join("");

  // Build header HTML (logo or custom header image or text)
  let headerHTML = "";

  if (company.headerDevisUrl) {
    // Custom header image
    headerHTML = `
      <div class="custom-header">
        <img src="${escapeHtml(company.headerDevisUrl)}" alt="En-tête" class="header-image" />
      </div>
      <div class="header-below">
        <div class="invoice-info">
          <div class="invoice-title">${factureTitle}</div>
          <div class="invoice-number">${escapeHtml(data.numeroFacture)}</div>
          <div class="invoice-dates">
            <p><strong>Date d'émission :</strong> ${formatDate(data.dateEmission)}</p>
            <p><strong>Date d'échéance :</strong> ${formatDate(data.dateEcheance)}</p>
          </div>
        </div>
      </div>
    `;
  } else {
    // Default header with logo or company name
    const logoOrName = company.logoUrl
      ? `<img src="${escapeHtml(company.logoUrl)}" alt="${escapeHtml(company.nom)}" class="company-logo" />`
      : `<div class="company-name">${escapeHtml(company.nom)}</div>`;

    headerHTML = `
      <div class="header">
        <div class="company">
          ${logoOrName}
          <div class="company-info">
            ${companyInfoLines.join("<br>")}
          </div>
        </div>
        <div class="invoice-info">
          <div class="invoice-title">${factureTitle}</div>
          <div class="invoice-number">${escapeHtml(data.numeroFacture)}</div>
          <div class="invoice-dates">
            <p><strong>Date d'émission :</strong> ${formatDate(data.dateEmission)}</p>
            <p><strong>Date d'échéance :</strong> ${formatDate(data.dateEcheance)}</p>
          </div>
        </div>
      </div>
    `;
  }

  // Devis reference if available
  const devisRefHTML = data.devisReference
    ? `<p class="devis-ref">Référence devis : ${escapeHtml(data.devisReference)}</p>`
    : "";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${escapeHtml(data.numeroFacture)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      background: white;
      padding: 40px;
    }

    .custom-header {
      margin-bottom: 20px;
    }

    .header-image {
      width: 100%;
      max-height: 150px;
      object-fit: contain;
    }

    .header-below {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${primaryColor};
    }

    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${primaryColor};
    }

    .company {
      max-width: 300px;
    }

    .company-logo {
      max-width: 200px;
      max-height: 80px;
      object-fit: contain;
      margin-bottom: 12px;
    }

    .company-name {
      font-size: 28pt;
      font-weight: 700;
      color: ${primaryColor};
      margin-bottom: 8px;
    }

    .company-info {
      font-size: 9pt;
      color: #666;
      line-height: 1.6;
    }

    .invoice-info {
      text-align: right;
    }

    .invoice-title {
      font-size: 24pt;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 10px;
    }

    .invoice-number {
      font-size: 14pt;
      color: ${primaryColor};
      font-weight: 600;
      margin-bottom: 8px;
    }

    .invoice-dates {
      font-size: 10pt;
      color: #666;
    }

    .invoice-dates p {
      margin: 4px 0;
    }

    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      gap: 40px;
    }

    .party {
      flex: 1;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .party-label {
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 8px;
    }

    .party-name {
      font-size: 14pt;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 8px;
    }

    .party-details {
      font-size: 10pt;
      color: #444;
      line-height: 1.6;
    }

    .object {
      margin-bottom: 30px;
    }

    .object-label {
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 8px;
    }

    .object-content {
      font-size: 12pt;
      color: #1a1a1a;
      padding: 15px;
      background: #f0fdf4;
      border-left: 4px solid ${primaryColor};
      border-radius: 0 8px 8px 0;
    }

    .devis-ref {
      font-size: 10pt;
      color: #666;
      margin-top: 8px;
      font-style: italic;
    }

    /* Acompte mention section */
    .acompte-mention {
      margin-bottom: 30px;
      padding: 15px 20px;
      background: #f3e8ff;
      border-left: 4px solid #9333ea;
      border-radius: 0 8px 8px 0;
    }

    .acompte-mention p {
      font-size: 11pt;
      color: #581c87;
      margin: 0;
    }

    /* Acomptes summary section (for solde invoices) */
    .acomptes-summary {
      margin-bottom: 30px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .acomptes-summary .summary-title {
      background: #f3f4f6;
      padding: 12px 20px;
      font-size: 10pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
    }

    .acomptes-summary .summary-content {
      padding: 15px 20px;
    }

    .acomptes-summary .total-projet {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 11pt;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 12px;
    }

    .acomptes-summary .acomptes-list {
      margin-bottom: 12px;
    }

    .acomptes-summary .acomptes-label {
      font-size: 10pt;
      color: #666;
      margin-bottom: 8px;
    }

    .acomptes-summary .acompte-line {
      display: flex;
      gap: 12px;
      padding: 6px 0;
      font-size: 10pt;
      color: #374151;
    }

    .acomptes-summary .acompte-ref {
      font-weight: 500;
      color: ${primaryColor};
    }

    .acomptes-summary .acompte-date {
      color: #666;
      flex: 1;
    }

    .acomptes-summary .acompte-montant {
      font-weight: 500;
      color: #dc2626;
    }

    .acomptes-summary .total-acomptes {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 10pt;
      border-top: 1px solid #e5e7eb;
      color: #dc2626;
    }

    .acomptes-summary .solde-du {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 12pt;
      font-weight: 700;
      border-top: 2px solid ${primaryColor};
      margin-top: 8px;
      color: ${primaryColor};
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    thead {
      background: ${primaryColor};
      color: white;
    }

    th {
      padding: 12px 15px;
      text-align: left;
      font-weight: 600;
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    th:first-child {
      border-radius: 8px 0 0 0;
    }

    th:last-child {
      border-radius: 0 8px 0 0;
      text-align: right;
    }

    th.qty, th.price, th.discount {
      text-align: center;
    }

    td {
      padding: 12px 15px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:nth-child(even) {
      background: #f9fafb;
    }

    .line-num {
      width: 40px;
      color: #999;
      font-size: 10pt;
    }

    .description {
      max-width: 300px;
    }

    .qty, .price, .discount {
      text-align: center;
      white-space: nowrap;
    }

    .total {
      text-align: right;
      font-weight: 600;
      white-space: nowrap;
    }

    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }

    .totals-box {
      width: 300px;
      background: #f8fafc;
      border-radius: 8px;
      overflow: hidden;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 20px;
      border-bottom: 1px solid #e5e7eb;
    }

    .totals-row:last-child {
      border-bottom: none;
    }

    .totals-row.grand-total {
      background: ${primaryColor};
      color: white;
      font-size: 14pt;
      font-weight: 700;
    }

    .totals-label {
      color: #666;
    }

    .grand-total .totals-label {
      color: white;
    }

    .totals-value {
      font-weight: 600;
    }

    .payment-info {
      margin-bottom: 40px;
      padding: 20px;
      background: #f0fdf4;
      border-radius: 8px;
      border-left: 4px solid ${primaryColor};
    }

    .payment-title {
      font-size: 11pt;
      font-weight: 600;
      color: #166534;
      margin-bottom: 12px;
    }

    .payment-content {
      font-size: 10pt;
      color: #166534;
      line-height: 1.6;
    }

    .payment-content strong {
      font-weight: 600;
    }

    .legal-notice {
      margin-bottom: 30px;
      padding: 15px;
      background: #fef3c7;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
    }

    .legal-notice p {
      font-size: 9pt;
      color: #92400e;
      margin: 4px 0;
    }

    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 8pt;
      color: #999;
      line-height: 1.8;
    }

    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  ${headerHTML}

  <div class="parties">
    <div class="party">
      <div class="party-label">Facturé à</div>
      <div class="party-name">${escapeHtml(data.client.nom)}</div>
      <div class="party-details">
        ${data.client.adresse ? `${escapeHtml(data.client.adresse)}<br>` : ""}
        ${escapeHtml(data.client.codePostal) || ""} ${escapeHtml(data.client.ville) || ""}<br>
        ${escapeHtml(data.client.pays) || "France"}
        ${data.client.siret ? `<br>SIRET: ${escapeHtml(data.client.siret)}` : ""}
      </div>
    </div>
    ${
      data.contact
        ? `
    <div class="party">
      <div class="party-label">Contact</div>
      <div class="party-name">${escapeHtml(data.contact.prenom) || ""} ${escapeHtml(data.contact.nom)}</div>
      <div class="party-details">
        ${data.contact.poste ? `${escapeHtml(data.contact.poste)}<br>` : ""}
        ${data.contact.email ? `${escapeHtml(data.contact.email)}<br>` : ""}
        ${escapeHtml(data.contact.telephone) || ""}
      </div>
    </div>
    `
        : ""
    }
  </div>

  <div class="object">
    <div class="object-label">Objet</div>
    <div class="object-content">
      ${escapeHtml(data.objet)}
      ${devisRefHTML}
    </div>
  </div>

  ${acompteMentionHTML}

  ${acomptesSummaryHTML}

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th class="qty">Qté</th>
        <th class="price">Prix unitaire</th>
        <th class="discount">Remise</th>
        <th style="text-align: right;">Total HT</th>
      </tr>
    </thead>
    <tbody>
      ${linesHTML}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row">
        <span class="totals-label">Total HT</span>
        <span class="totals-value">${formatCurrency(data.totalHT)}</span>
      </div>
      <div class="totals-row">
        <span class="totals-label">TVA (${data.tauxTva}%)</span>
        <span class="totals-value">${formatCurrency(data.tva)}</span>
      </div>
      <div class="totals-row grand-total">
        <span class="totals-label">Total TTC</span>
        <span class="totals-value">${formatCurrency(data.totalTTC)}</span>
      </div>
    </div>
  </div>

  <div class="payment-info">
    <div class="payment-title">Modalités de paiement</div>
    <div class="payment-content">
      ${escapeHtml(data.conditionsPaiement)}<br><br>
      <strong>Date d'échéance :</strong> ${formatDate(data.dateEcheance)}<br>
      <strong>Mode de paiement :</strong> Virement bancaire<br>
      ${
        company.iban
          ? `<strong>IBAN :</strong> ${escapeHtml(company.iban)}<br>`
          : ""
      }
      ${company.bic ? `<strong>BIC :</strong> ${escapeHtml(company.bic)}` : ""}
    </div>
  </div>

  <div class="legal-notice">
    <p><strong>Pénalités de retard :</strong> En cas de retard de paiement, des pénalités de retard seront appliquées au taux de 3 fois le taux d'intérêt légal.</p>
    <p><strong>Indemnité forfaitaire :</strong> Une indemnité forfaitaire de 40€ pour frais de recouvrement sera due en cas de retard de paiement (article L.441-10 du Code de commerce).</p>
  </div>

  <div class="footer">
    ${footerLine1}<br>
    ${footerLine2}
  </div>
</body>
</html>
  `;
}
