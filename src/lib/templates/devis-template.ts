import type { DevisData } from "@/types";

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

export function generateDevisHTML(data: DevisData): string {
  const linesHTML = data.lignes
    .map(
      (ligne, index) => `
      <tr>
        <td class="line-num">${index + 1}</td>
        <td class="description">${ligne.description || ligne.serviceNom || "-"}</td>
        <td class="qty">${ligne.quantite}</td>
        <td class="price">${formatCurrency(ligne.prixUnitaire)}</td>
        <td class="discount">${ligne.remisePourcent > 0 ? `${ligne.remisePourcent}%` : "-"}</td>
        <td class="total">${formatCurrency(ligne.montantHT)}</td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devis ${data.numeroDevis}</title>
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

    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }

    .company {
      max-width: 300px;
    }

    .company-name {
      font-size: 28pt;
      font-weight: 700;
      color: #2563eb;
      margin-bottom: 8px;
    }

    .company-info {
      font-size: 9pt;
      color: #666;
      line-height: 1.6;
    }

    .quote-info {
      text-align: right;
    }

    .quote-title {
      font-size: 24pt;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 10px;
    }

    .quote-number {
      font-size: 14pt;
      color: #2563eb;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .quote-dates {
      font-size: 10pt;
      color: #666;
    }

    .quote-dates p {
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
      background: #f0f9ff;
      border-left: 4px solid #2563eb;
      border-radius: 0 8px 8px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    thead {
      background: #2563eb;
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
      background: #2563eb;
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

    .terms {
      margin-bottom: 40px;
      padding: 20px;
      background: #fffbeb;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
    }

    .terms-title {
      font-size: 11pt;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 8px;
    }

    .terms-content {
      font-size: 10pt;
      color: #78350f;
      line-height: 1.6;
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

    .signature {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      gap: 40px;
    }

    .signature-box {
      flex: 1;
      padding: 20px;
      border: 1px dashed #ccc;
      border-radius: 8px;
      min-height: 120px;
    }

    .signature-label {
      font-size: 9pt;
      color: #666;
      margin-bottom: 60px;
    }

    .signature-line {
      border-top: 1px solid #ccc;
      padding-top: 8px;
      font-size: 9pt;
      color: #999;
    }

    @media print {
      body {
        padding: 20px;
      }

      .signature-box {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      <div class="company-name">AXIVITY</div>
      <div class="company-info">
        Agence d'Intelligence Artificielle<br>
        123 Avenue de l'Innovation<br>
        75001 Paris, France<br>
        SIRET: 123 456 789 00012<br>
        contact@axivity.cloud
      </div>
    </div>
    <div class="quote-info">
      <div class="quote-title">DEVIS</div>
      <div class="quote-number">${data.numeroDevis}</div>
      <div class="quote-dates">
        <p><strong>Date :</strong> ${formatDate(data.dateDevis)}</p>
        <p><strong>Valide jusqu'au :</strong> ${formatDate(data.dateValidite)}</p>
      </div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-label">Client</div>
      <div class="party-name">${data.client.nom}</div>
      <div class="party-details">
        ${data.client.adresse ? `${data.client.adresse}<br>` : ""}
        ${data.client.codePostal || ""} ${data.client.ville || ""}<br>
        ${data.client.pays || "France"}
        ${data.client.siret ? `<br>SIRET: ${data.client.siret}` : ""}
      </div>
    </div>
    ${
      data.contact
        ? `
    <div class="party">
      <div class="party-label">Contact</div>
      <div class="party-name">${data.contact.prenom || ""} ${data.contact.nom}</div>
      <div class="party-details">
        ${data.contact.poste ? `${data.contact.poste}<br>` : ""}
        ${data.contact.email ? `${data.contact.email}<br>` : ""}
        ${data.contact.telephone || ""}
      </div>
    </div>
    `
        : ""
    }
  </div>

  <div class="object">
    <div class="object-label">Objet</div>
    <div class="object-content">
      ${data.opportunite.nom}
      ${data.opportunite.notes ? `<br><br><em>${data.opportunite.notes}</em>` : ""}
    </div>
  </div>

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
        <span class="totals-label">Sous-total HT</span>
        <span class="totals-value">${formatCurrency(data.totalHT)}</span>
      </div>
      <div class="totals-row">
        <span class="totals-label">TVA (20%)</span>
        <span class="totals-value">${formatCurrency(data.tva)}</span>
      </div>
      <div class="totals-row grand-total">
        <span class="totals-label">Total TTC</span>
        <span class="totals-value">${formatCurrency(data.totalTTC)}</span>
      </div>
    </div>
  </div>

  <div class="terms">
    <div class="terms-title">Conditions de paiement</div>
    <div class="terms-content">
      ${data.conditionsPaiement}<br>
      Ce devis est valable 30 jours à compter de sa date d'émission.
    </div>
  </div>

  <div class="signature">
    <div class="signature-box">
      <div class="signature-label">Bon pour accord - Le Client</div>
      <div class="signature-line">Date et signature</div>
    </div>
    <div class="signature-box">
      <div class="signature-label">Le Prestataire - AXIVITY</div>
      <div class="signature-line">Date et signature</div>
    </div>
  </div>

  <div class="footer">
    AXIVITY - SAS au capital de 10 000 € - RCS Paris 123 456 789 - TVA FR12345678900<br>
    123 Avenue de l'Innovation, 75001 Paris - Tél: +33 1 23 45 67 89 - contact@axivity.cloud
  </div>
</body>
</html>
  `;
}
