const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const LOGO_PATH = path.join(process.cwd(), "assets", "logo.png");
let cachedLogoDataUrl = null;

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

function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildInvoiceHtml(invoice) {
  const issuer = invoice.issuerSnapshot || {};
  const bank = invoice.bankDetailsSnapshot || {};
  const lineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
        font-family: 'Helvetica', 'Arial', sans-serif;
        color: #1f2937;
        font-size: 12px;
        padding: 32px 40px;
    }

    /* ===== Header ===== */
    .header {
        margin-bottom: 20px;
    }
    .header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 16px;
        border-bottom: 2px solid #e5e7eb;
    }
    .logo-wrap {
        display: flex;
        align-items: center;
    }
    .issuer-logo {
        width: 56px;
        height: 56px;
        object-fit: contain;
        flex-shrink: 0;
    }
    .title-wrap {
        display: flex;
        align-items: center;
        gap: 18px;
    }
    .title-wrap .divider {
        width: 2px;
        height: 34px;
        background: #cbd5e1;
    }
    .title-wrap .title {
        font-size: 26px;
        font-weight: bold;
        color: #2563eb;
        letter-spacing: 1px;
    }
    .header-bottom {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-top: 16px;
    }
    .issuer h1 { font-size: 18px; color: #111827; margin-bottom: 6px; }
    .issuer p { font-size: 11px; color: #4b5563; line-height: 1.5; }
    .invoice-meta {
        text-align: right;
    }
    .invoice-meta table { font-size: 11px; }
    .invoice-meta td { padding: 1px 0; }
    .invoice-meta td:first-child { color: #6b7280; padding-right: 10px; text-align: right; }
    .invoice-meta td:last-child { font-weight: 600; color: #111827; }
    /* ===== End Header ===== */

    .info-grid {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
    }
    .info-box {
        flex: 1;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 12px 14px;
        background: #f9fafb;
    }
    .info-box h3 { font-size: 11px; color: #111827; margin-bottom: 8px; }
    .info-box p { font-size: 11px; color: #374151; line-height: 1.6; }

    table.items { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
    table.items thead th {
        background: #eff6ff;
        color: #1e3a8a;
        font-size: 10.5px;
        text-align: left;
        padding: 8px 10px;
        border-bottom: 1px solid #dbeafe;
    }
    table.items thead th.num { text-align: right; }
    table.items tbody td {
        padding: 8px 10px;
        border-bottom: 1px solid #f0f0f0;
        font-size: 11px;
        color: #374151;
    }
    table.items td.num { text-align: right; }
    table.items td.idx { width: 24px; color: #6b7280; }

    .totals-row td { font-weight: 600; }
    .grand-total td { font-weight: bold; background: #eff6ff; color: #1e3a8a; font-size: 12px; }

    .payment-terms { margin-bottom: 18px; }
    .payment-terms h3 { font-size: 11.5px; margin-bottom: 4px; }
    .payment-terms p { font-size: 11px; color: #4b5563; }

    .bottom-grid {
        display: flex;
        justify-content: space-between;
        border-top: 1px solid #e5e7eb;
        padding-top: 16px;
        margin-bottom: 18px;
    }
    .bank-details h3 { font-size: 11.5px; margin-bottom: 6px; }
    .bank-details p { font-size: 11px; color: #374151; line-height: 1.7; }
    .bank-details b { color: #111827; }

    .notes { margin-top: 12px; }
    .notes h3 { font-size: 11.5px; margin-bottom: 4px; }
    .notes p { font-size: 11px; color: #4b5563; }

    .footer {
        background: #eff6ff;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
        margin-top: 10px;
    }
    .footer p.thanks { font-weight: bold; font-size: 13px; color: #111827; margin-bottom: 4px; }
    .footer p.query { font-size: 11px; color: #4b5563; }
</style>
</head>
<body>

    <div class="header">
        <div class="header-top">
            <div class="logo-wrap">
                ${getLogoDataUrl() ? `<img src="${getLogoDataUrl()}" alt="Logo" class="issuer-logo" />` : ""}
            </div>
            <div class="title-wrap">
                <div class="divider"></div>
                <div class="title">INVOICE</div>
            </div>
        </div>
        <div class="header-bottom">
            <div class="issuer">
                <h1>${escapeHtml(issuer.businessName)}</h1>
                <p>
                    ${escapeHtml(issuer.addressLine)}<br/>
                    ${issuer.gstin ? `GSTIN: ${escapeHtml(issuer.gstin)}<br/>` : ""}
                    ${issuer.phone ? `Phone: ${escapeHtml(issuer.phone)}<br/>` : ""}
                    ${issuer.email ? `Email: ${escapeHtml(issuer.email)}` : ""}
                </p>
            </div>
            <div class="invoice-meta">
                <table>
                    <tr><td>Invoice No:</td><td>${escapeHtml(invoice.invoiceNumber)}</td></tr>
                    <tr><td>Invoice Date:</td><td>${formatDate(invoice.invoiceDate)}</td></tr>
                    <tr><td>Due Date:</td><td>${formatDate(invoice.dueDate)}</td></tr>
                </table>
            </div>
        </div>
    </div>

    <div class="info-grid">
        <div class="info-box">
            <h3>Bill To:</h3>
            <p>
                <b>${escapeHtml(invoice.billToName)}</b><br/>
                ${invoice.billToAddress ? `${escapeHtml(invoice.billToAddress)}<br/>` : ""}
                ${invoice.billToGstin ? `GSTIN: ${escapeHtml(invoice.billToGstin)}` : ""}
            </p>
        </div>
        <div class="info-box">
            <h3>Contract Details:</h3>
            <p>
                Contract No: ${escapeHtml(invoice.contractNumber)}<br/>
                ${invoice.quotationNumber ? `Quotation No: ${escapeHtml(invoice.quotationNumber)}<br/>` : ""}
                Contract Period: ${formatDate(invoice.contractPeriodStart)} - ${formatDate(invoice.contractPeriodEnd)}
            </p>
        </div>
    </div>

        <table class="items">
        <tbody>
            <tr class="totals-row">
                <td style="text-align:left; padding: 8px 10px;">Description</td>
                <td class="num">Subtotal</td>
            </tr>
            <tr>
                <td style="padding: 8px 10px; color:#374151; font-size:11px;">
                    ${escapeHtml(invoice.contractNumber ? `Services as per contract ${invoice.contractNumber}` : "")}
                </td>
                <td class="num">${formatCurrency(invoice.subtotal)}</td>
            </tr>
            <tr class="grand-total">
                <td style="text-align:left; padding: 8px 10px;">Total</td>
                <td class="num">${formatCurrency(invoice.totalAmount)}</td>
            </tr>
        </tbody>
    </table>

    <div class="payment-terms">
        <h3>Payment Terms:</h3>
        <p>${escapeHtml(invoice.paymentTerms)}</p>
    </div>

    <div class="bottom-grid">
        <div class="bank-details">
            <h3>Bank Details:</h3>
            <p>
                <b>Bank Name:</b> ${escapeHtml(bank.bankName)}<br/>
                <b>Account Holder Name:</b> ${escapeHtml(bank.accountHolderName)}<br/>
                <b>Account Number:</b> ${escapeHtml(bank.accountNumber)}<br/>
                <b>IFSC Code:</b> ${escapeHtml(bank.ifscCode)}<br/>
                ${bank.branch ? `<b>Branch:</b> ${escapeHtml(bank.branch)}` : ""}
            </p>
        </div>
    </div>

    ${
      invoice.notes
        ? `
    <div class="notes">
        <h3>Additional Notes:</h3>
        <p>${escapeHtml(invoice.notes)}</p>
    </div>`
        : ""
    }

    <div class="footer">
        <p class="thanks">Thank you for your business!</p>
        <p class="query">For any queries, please contact ${escapeHtml(issuer.email || "")}</p>
    </div>

</body>
</html>`;
}

class InvoicePdfService {
  /**
   * @param {object} invoice 
   * @returns {Promise<Buffer>}
   */
  async generatePdfBuffer(invoice) {
    const html = buildInvoiceHtml(invoice);
        const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--font-render-hinting=none",
      ],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 60000 });



      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
      });

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }
}

module.exports = new InvoicePdfService();
