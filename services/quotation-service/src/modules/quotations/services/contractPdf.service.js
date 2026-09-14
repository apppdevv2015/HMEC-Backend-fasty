const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

/* ============================================================
   CONSTANTS
============================================================ */

const PRODUCT_NAME = "HME Component Intelligence System";

const LOGO_PATH = path.join(process.cwd(), "assets", "logo.png");
let cachedLogoDataUrl = null;

const COLORS = {
  primary: "#123B73",
  primaryLight: "#EAF2FD",
  border: "#D7E3F2",
  text: "#172B4D",
  muted: "#64748B",
  white: "#FFFFFF",
  success: "#16A34A",
  successLight: "#ECFDF3",
  successBorder: "#B7E4C7",
  tableHeader: "#EDF4FD",
};

/* ============================================================
   LOGO
============================================================ */

function getLogoDataUrl() {
  if (cachedLogoDataUrl !== null) {
    return cachedLogoDataUrl;
  }

  if (!fs.existsSync(LOGO_PATH)) {
    cachedLogoDataUrl = "";
    return cachedLogoDataUrl;
  }

  const ext = path.extname(LOGO_PATH).toLowerCase();
  const mimeMap = {
    ".png": "image/png",
  };
  const mimeType = mimeMap[ext];

  if (!mimeType) {
    cachedLogoDataUrl = "";
    return cachedLogoDataUrl;
  }

  const buffer = fs.readFileSync(LOGO_PATH);
  cachedLogoDataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
  return cachedLogoDataUrl;
}

/* ============================================================
   FORMATTERS
============================================================ */

function formatCurrency(amount) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "R 0.00";
  }

 return `R ${numericAmount.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function displayValue(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "-";
  }

  return escapeHtml(value);
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

/* ============================================================
   SIGNATURE
============================================================ */

function getSignatureDataUrl(signatureUrl) {
  if (!signatureUrl) {
    return null;
  }

  const cleanUrl = String(signatureUrl).split("?")[0];

  const relativePath = cleanUrl.replace(/^\/+/, "").replace(/\//g, path.sep);

  const signaturePath = path.resolve(process.cwd(), relativePath);

  if (!fs.existsSync(signaturePath)) {
    throw new Error(`Contract signature file not found: ${signatureUrl}`);
  }

  const extension = path.extname(signaturePath).toLowerCase();

  const mimeMap = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
  };

  const mimeType = mimeMap[extension];

  if (!mimeType) {
    throw new Error("Unsupported signature image format");
  }

  const imageBuffer = fs.readFileSync(signaturePath);

  return `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
}

/* ============================================================
   HTML HELPERS
============================================================ */

function buildInfoRow(label, value, options = {}) {
  const { strong = false, valueClass = "" } = options;

  return `
        <div class="info-row">
            <div class="info-label">
                ${escapeHtml(label)}
            </div>

            <div class="info-colon">:</div>

            <div class="info-value ${valueClass}">
                ${strong ? `<strong>${value}</strong>` : value}
            </div>
        </div>
    `;
}

function buildSectionHeader(title) {
  return `
        <div class="section-header">
            ${escapeHtml(title)}
        </div>
    `;
}

/* ============================================================
   COMPANY DETAILS
============================================================ */

function buildCompanyDetails(quotation) {
  const rows = [
    buildInfoRow("Company Name", displayValue(quotation?.companyName)),

    buildInfoRow("Contact Person", displayValue(quotation?.contactPerson)),

    buildInfoRow("Email", displayValue(quotation?.contactEmail)),

    buildInfoRow("Phone", displayValue(quotation?.contactPhone)),
  ];

  return `
        <section class="card">
            ${buildSectionHeader("Company Details")}

            <div class="card-body">
                ${rows.join("")}
            </div>
        </section>
    `;
}

/* ============================================================
   QUOTATION DETAILS
============================================================ */

function buildQuotationReference(quotation) {
  const rows = [
    buildInfoRow("Quotation No.", displayValue(quotation?.quotationNumber)),

    buildInfoRow("Machine Count", displayValue(quotation?.machineCount)),

    buildInfoRow(
      "Licensed Machine Allowance",
      displayValue(quotation?.licensedMachineAllowance),
    ),

    buildInfoRow("Payment Terms", displayValue(quotation?.paymentTerms)),
  ];

  return `
        <section class="card">
            ${buildSectionHeader("Quotation Reference")}

            <div class="card-body">
                ${rows.join("")}
            </div>
        </section>
    `;
}

/* ============================================================
   CONTRACT DETAILS
============================================================ */

function buildContractDetails(contract) {
  const rows = [
    buildInfoRow("Description", displayValue(contract?.description)),

    buildInfoRow("Start Date", formatDate(contract?.startDate)),

    buildInfoRow("End Date", formatDate(contract?.endDate)),

    buildInfoRow("PO Number", displayValue(contract?.poNumber)),
  ];

  return `
        <section class="card full-width">
            ${buildSectionHeader("Contract Details")}

            <div class="card-body contract-details">
                ${rows.join("")}
            </div>
        </section>
    `;
}

/* ============================================================
   BASE CHARGES
============================================================ */

function buildBaseCharges(quotation) {
  const baseCharges = [
    {
      name: "Implementation Fee",
      amount: quotation?.implementationFee,
    },
    {
      name: "Monthly Site Licence",
      amount: quotation?.monthlySiteLicence,
    },
    {
      name: "Additional Machine Charge",
      amount: quotation?.additionalMachineCharge,
    },
  ];

  return baseCharges
    .map(
      (item, index) => `
                <tr>
                    <td class="center">
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHtml(item.name)}
                    </td>

                    <td class="amount">
                        ${formatCurrency(item.amount)}
                    </td>
                </tr>
            `,
    )
    .join("");
}

/* ============================================================
   OPTIONAL SERVICES
============================================================ */

function buildOptionalServices(quotation) {
  const services = Array.isArray(quotation?.optionalServices)
    ? quotation.optionalServices
    : [];

  if (services.length === 0) {
    return "";
  }

  const rows = services
    .map(
      (service, index) => `
                <tr>
                    <td class="center">
                        ${index + 1}
                    </td>

                    <td>
                        ${displayValue(service?.name)}
                    </td>

                    <td class="amount">
                        ${formatCurrency(service?.price)}
                    </td>
                </tr>
            `,
    )
    .join("");

  return `
        <div class="subsection-title">
            Optional Services
        </div>

        <table class="data-table optional-table">
            <thead>
                <tr>
                    <th class="index-column">#</th>
                    <th>Item / Service</th>
                    <th class="amount-column">
                        Amount (R)
                    </th>
                </tr>
            </thead>

            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

/* ============================================================
   COMMERCIAL DETAILS
============================================================ */

function buildCommercialDetails(quotation) {
  return `
        <section class="card full-width commercial-card">
            ${buildSectionHeader("Commercial Details")}
            <div class="commercial-body">
                <div class="subsection-title">
                    Base Charges
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th class="index-column">#</th>
                            <th>
                                Item / Service
                            </th>
                            <th class="amount-column">
                                Amount (K)
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        ${buildBaseCharges(quotation)}
                    </tbody>
                </table>

                ${buildOptionalServices(quotation)}

            </div>
        </section>
    `;
}

/* ============================================================
   ACCEPTANCE / SIGNATURE
============================================================ */

function buildSignatureBlock(label, signatureUrl, signedBy, signedAt) {
  const signatureDataUrl = getSignatureDataUrl(signatureUrl);

  const signatureHtml = signatureDataUrl
    ? `
            <div class="signature-box">
                <img
                    src="${signatureDataUrl}"
                    alt="${escapeHtml(label)}"
                    class="signature-image"
                />
            </div>
        `
    : `
            <div class="signature-box signature-empty">
                No digital signature available
            </div>
        `;

  return `
        <div class="signature-column">

            <div class="signature-label">
                ${escapeHtml(label)}
            </div>

            ${signatureHtml}

            <div class="signature-meta">

                ${buildInfoRow("Signed By", displayValue(signedBy), {
                  strong: true,
                })}

                ${buildInfoRow("Signed On", formatDateTime(signedAt))}

            </div>

        </div>
    `;
}

function buildDigitalSignature(contract) {
  return `
        <section class="card full-width signature-card">
            ${buildSectionHeader("Digital Signatures")}

            <div class="signature-body">

                ${buildSignatureBlock(
                  "Super Admin Signature",
                  contract?.superAdminSignatureUrl,
                  contract?.superAdminSignedBy,
                  contract?.superAdminSignedAt,
                )}

                <div class="signature-divider"></div>

                ${buildSignatureBlock(
                  "Company Admin Signature",
                  contract?.companySignatureUrl,
                  contract?.companySignedBy,
                  contract?.companySignedAt,
                )}

            </div>

            ${
              contract?.acceptanceDescription
                ? `
                <div class="acceptance-description-row">
                    ${buildInfoRow(
                      "Acceptance Description",
                      displayValue(contract.acceptanceDescription),
                    )}
                </div>
            `
                : ""
            }

        </section>
    `;
}

/* ============================================================
   CONTRACT SUMMARY
============================================================ */

function buildContractSummary(contract) {
  const status = normalizeStatus(contract?.status);

  return `
        <div class="summary-card">

            ${buildInfoRow(
              "Contract No.",
              displayValue(contract?.contractNumber),
              { strong: true },
            )}

            ${buildInfoRow("Contract Date", formatDate(contract?.sentAt))}

            ${buildInfoRow(
              "Contract Period",
              `${formatDate(contract?.startDate)}
                 - ${formatDate(contract?.endDate)}`,
            )}

            <div class="info-row">
                <div class="info-label">
                    Status
                </div>

                <div class="info-colon">
                    :
                </div>

                <div class="info-value">
                    <span class="status-badge">
                        ${escapeHtml(status || "-")}
                    </span>
                </div>
            </div>

        </div>
    `;
}

/* ============================================================
   MAIN HTML
============================================================ */

function buildContractHtml(contract) {
  if (!contract) {
    throw new Error("Contract data is required to generate PDF");
  }

  const status = normalizeStatus(contract.status);

  if (status !== "ACCEPTED") {
    throw new Error(
      `Contract PDF can only be generated for an ACCEPTED contract. Current status: ${status || "UNKNOWN"}`,
    );
  }

  if (!contract.superAdminSignatureUrl) {
    throw new Error(
      "Cannot generate contract PDF without Super Admin digital signature",
    );
  }

  if (!contract.companySignatureUrl) {
    throw new Error(
      "Cannot generate contract PDF without Company Admin digital signature",
    );
  }

  const quotation = contract.quotation || {};
  const logoDataUrl = getLogoDataUrl();

  return `
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8" />

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
/>

<title>
    ${escapeHtml(contract.contractNumber || "Contract")}
</title>

<style>

    * {
        box-sizing: border-box;
    }

    @page {
        size: A4;
        margin: 12mm 13mm 12mm 13mm;
    }

    html,
    body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: ${COLORS.text};
        font-family:
            Arial,
            Helvetica,
            sans-serif;
        font-size: 10px;
        line-height: 1.4;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    body {
        width: 100%;
    }

    .page {
        width: 100%;
        max-width: 210mm;
        margin: 0 auto;
    }

    /* ========================================================
       HEADER / BANNER
    ======================================================== */

    .header {
        padding-bottom: 8px;
        margin-bottom: 9px;
        border-bottom: 1.5px solid ${COLORS.primary};
    }

    .header-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 8px;
        border-bottom: 1px solid ${COLORS.border};
    }

    .logo-title-wrap {
        display: flex;
        align-items: center;
        gap: 14px;
    }

    .header-logo {
        width: 42px;
        height: 42px;
        object-fit: contain;
        flex-shrink: 0;
    }

    .header-divider {
        width: 2px;
        height: 30px;
        background: #cbd5e1;
    }

    .product-title {
        margin: 0;
        color: ${COLORS.primary};
        font-size: 17px;
        line-height: 1.15;
        font-weight: 700;
        letter-spacing: -0.35px;
    }

    .document-title {
        margin-top: 2px;
        color: #607A9F;
        font-size: 12px;
        font-weight: 400;
    }

    .header-bottom {
        padding-top: 9px;
    }

    .summary-card {
        width: 100%;
        padding: 1px 0 0;
    }

    .summary-card .info-row {
        grid-template-columns: 165px 16px minmax(0, 1fr);
        min-height: 21px;
        font-size: 11px;
    }

    .summary-card .info-label {
        color: ${COLORS.muted};
    }

    .summary-card .info-value strong {
        font-size: 11.5px;
    }

    /* ========================================================
       INTRO
    ======================================================== */

    .intro {
        margin: 9px 0 10px;
        color: ${COLORS.text};
        font-size: 10px;
    }

    /* ========================================================
       GRID
    ======================================================== */

    .two-column {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 9px;
    }

    .card {
        border: 1px solid ${COLORS.border};
        border-radius: 6px;
        overflow: hidden;
        background: ${COLORS.white};
        break-inside: avoid;
    }

    .full-width {
        width: 100%;
        margin-bottom: 9px;
    }

    .section-header {
        padding: 6px 12px;
        background: ${COLORS.primaryLight};
        color: ${COLORS.primary};
        font-size: 12.5px;
        font-weight: 700;
        border-bottom: 1px solid ${COLORS.border};
    }

    .card-body {
        padding: 8px 12px;
    }

    /* ========================================================
       INFO ROW
    ======================================================== */

    .info-row {
        display: grid;
        grid-template-columns: 155px 12px minmax(0, 1fr);
        gap: 0;
        align-items: baseline;
        min-height: 19px;
    }

    .info-label {
        color: ${COLORS.text};
        white-space: nowrap;
    }

    .info-colon {
        text-align: center;
        color: ${COLORS.muted};
    }

    .info-value {
        min-width: 0;
        color: ${COLORS.text};
        overflow-wrap: anywhere;
    }

    .info-value strong {
        font-weight: 700;
    }

    /* ========================================================
       STATUS
    ======================================================== */

    .status-badge {
        display: inline-block;
        padding: 4px 11px;
        border-radius: 5px;
        background: ${COLORS.success};
        color: #ffffff;
        font-size: 10px;
        line-height: 1.1;
        font-weight: 700;
        letter-spacing: 0.2px;
    }

    /* ========================================================
       CONTRACT DETAILS
    ======================================================== */

    .contract-details {
        padding-top: 7px;
        padding-bottom: 7px;
    }

    /* ========================================================
       COMMERCIAL
    ======================================================== */

    .commercial-card {
        break-inside: auto;
    }

    .commercial-body {
        padding: 8px 12px 9px;
    }

    .subsection-title {
        margin: 1px 0 5px;
        color: ${COLORS.primary};
        font-size: 11px;
        font-weight: 700;
    }

    .optional-table {
        margin-top: 8px;
    }

    /* ========================================================
       TABLE
    ======================================================== */

    .data-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        border: 1px solid ${COLORS.border};
        border-radius: 5px;
        overflow: hidden;
        font-size: 10px;
    }

    .data-table th {
        padding: 5px 9px;
        background: ${COLORS.tableHeader};
        color: ${COLORS.primary};
        text-align: left;
        font-weight: 700;
        border-bottom: 1px solid ${COLORS.border};
    }

    .data-table td {
        padding: 4px 9px;
        border-bottom: 1px solid #E4EAF2;
        color: ${COLORS.text};
        vertical-align: middle;
    }

    .data-table tbody tr:last-child td {
        border-bottom: 0;
    }

    .data-table .index-column {
        width: 45px;
        text-align: center;
    }

    .data-table .amount-column {
        width: 180px;
        text-align: right;
    }

    .data-table .center {
        text-align: center;
    }

    .data-table .amount {
        text-align: right;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
    }

    /* ========================================================
       SIGNATURE
    ======================================================== */

    .signature-card {
        background: #FFFFFF;
    }

        .signature-body {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 1px minmax(0, 1fr);
        gap: 14px;
        align-items: start;
        padding: 10px 12px;
    }

    .signature-column {
        min-width: 0;
    }

    .signature-meta {
        margin-top: 8px;
    }

    .signature-meta .info-row {
        grid-template-columns: 90px 10px minmax(0, 1fr);
        font-size: 9px;
    }

    .acceptance-description-row {
        padding: 0 12px 10px;
    }

    .signature-divider {
        width: 1px;
        height: 100%;
        min-height: 76px;
        background: ${COLORS.border};
    }

    .signature-area {
        min-width: 0;
    }

    .signature-label {
        margin-bottom: 5px;
        color: ${COLORS.text};
        font-size: 10px;
        font-weight: 500;
    }

    .signature-box {
        height: 68px;
        border: 1px solid ${COLORS.border};
        border-radius: 5px;
        background: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    .signature-image {
        display: block;
        max-width: 90%;
        max-height: 56px;
        object-fit: contain;
    }

    .signature-empty {
        color: ${COLORS.muted};
        font-size: 9px;
    }

    /* ========================================================
       FOOTER
    ======================================================== */

    .footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 20px;
        margin-top: 8px;
        padding-top: 6px;
        border-top: 1.5px solid ${COLORS.primary};
        color: ${COLORS.text};
        font-size: 9px;
    }

    .footer-left {
        font-weight: 700;
        color: ${COLORS.primary};
    }

    .footer-right {
        text-align: right;
    }


    .card,
    .summary-card,
    .signature-card {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    @media print {

        body {
            background: #FFFFFF;
        }

        .page {
            width: 100%;
        }

        .card {
            break-inside: avoid;
        }

        .data-table {
            break-inside: auto;
        }

        .data-table tr {
            break-inside: avoid;
            page-break-inside: avoid;
        }

        .signature-card {
            break-inside: avoid;
        }
    }

</style>

</head>

<body>

<div class="page">


    <header class="header">

        <div class="header-top">
            <div class="logo-title-wrap">
                ${logoDataUrl ? `<img src="${logoDataUrl}" alt="Logo" class="header-logo" />` : ""}
                <div class="header-divider"></div>
                <div>
                    <h1 class="product-title">
                        ${escapeHtml(PRODUCT_NAME)}
                    </h1>

                    <div class="document-title">
                        Contract Agreement
                    </div>
                </div>
            </div>
        </div>

        <div class="header-bottom">
            ${buildContractSummary(contract)}
        </div>

    </header>
    <div class="intro">
        Contract generated from the accepted quotation
        and digitally signed contract record.
    </div>

    <div class="two-column">

        ${buildCompanyDetails(quotation)}

        ${buildQuotationReference(quotation)}

    </div>

    ${buildContractDetails(contract)}

    ${buildCommercialDetails(quotation)}

    ${buildDigitalSignature(contract)}

    <footer class="footer">

        <div class="footer-left">
            ${escapeHtml(PRODUCT_NAME)}
        </div>

        <div class="footer-right">
            Contract No.:
            ${displayValue(contract.contractNumber)}
            &nbsp;&nbsp;|&nbsp;&nbsp;
            Page <span class="pageNumber"></span>
        </div>

    </footer>

</div>

</body>

</html>
    `;
}

/* ============================================================
   SERVICE
============================================================ */

class ContractPdfService {
  /**
   * Generate PDF as a Buffer.
   *
   * @param {object} contract
   * @returns {Promise<Buffer>}
   */
  async generatePdfBuffer(contract) {
    if (!contract) {
      throw new Error("Contract data is required");
    }

    const html = buildContractHtml(contract);

    const browser = await puppeteer.launch({
      headless: "new",

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--font-render-hinting=none",
      ],
    });

    try {
      const page = await browser.newPage();

      await page.setViewport({
        width: 1240,
        height: 1754,
        deviceScaleFactor: 1,
      });

      await page.setContent(html, {
        waitUntil: "networkidle0",
      });

      const pdfBuffer = await page.pdf({
        format: "A4",

        printBackground: true,

        preferCSSPageSize: true,

        displayHeaderFooter: false,

        margin: {
          top: "0",
          right: "0",
          bottom: "0",
          left: "0",
        },
      });

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }
}

module.exports = new ContractPdfService();
