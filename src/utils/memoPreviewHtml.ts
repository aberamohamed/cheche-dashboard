import type { MemoLineItem, MemoType } from '@/types/invoiceAdjustment';
import { formatCurrency } from '@/utils/format';
import { computeMemoTaxSummary } from '@/utils/memoTax';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildMemoPreviewHtml(
  memoType: MemoType,
  reason: string,
  items: MemoLineItem[]
): string {
  const isCredit = memoType === 'CRE';
  const title = isCredit ? 'Credit Note (CRE)' : 'Debit Note (DEB)';
  const tax = computeMemoTaxSummary(items);
  const lines = items.filter((item) => {
    const qty = Number(item.qty) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    return qty > 0 && unitPrice > 0;
  });

  const rows = lines
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.product_name)}</td>
        <td style="text-align:center">${item.qty}</td>
        <td style="text-align:right">${formatCurrency(item.unit_price)}</td>
        <td style="text-align:right">${formatCurrency(item.qty * item.unit_price)}</td>
      </tr>`
    )
    .join('');

  const reasonBlock = reason.trim()
    ? `<div class="meta"><strong>Reason:</strong> ${escapeHtml(reason.trim())}</div>`
    : '';

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 16px; color: #1C1C1E; margin: 0; }
      .header { text-align: center; margin-bottom: 16px; }
      .brand { color: #E30074; font-size: 18px; font-weight: 700; }
      .doc-type { font-size: 13px; color: #8E8E93; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0; }
      th { text-align: left; font-size: 11px; color: #8E8E93; padding: 8px 4px; border-bottom: 1px solid #D1D1D6; text-transform: uppercase; }
      td { padding: 8px 4px; font-size: 13px; border-bottom: 1px solid #F2F2F7; vertical-align: top; }
      .meta { font-size: 12px; color: #8E8E93; margin-top: 6px; line-height: 1.4; }
      .summary { margin-top: 12px; padding-top: 10px; border-top: 1px solid #D1D1D6; }
      .summary-row { display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px; }
      .total { font-size: 16px; font-weight: 700; color: #E30074; margin-top: 8px; text-align: right; }
      .note { font-size: 11px; color: #AEAEB2; text-align: center; margin-top: 16px; }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="brand">Cheche POS</div>
      <div class="doc-type">${title}</div>
    </div>
    ${reasonBlock}
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Price</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="summary">
      <div class="summary-row"><span>Gross subtotal</span><span>${formatCurrency(tax.grossSubtotal)}</span></div>
      <div class="summary-row"><span>Excise</span><span>${formatCurrency(tax.excise)}</span></div>
      <div class="summary-row"><span>VAT 15%</span><span>${formatCurrency(tax.vat)}</span></div>
      <div class="total">Total incl. tax: ${formatCurrency(tax.grandTotal)}</div>
    </div>
    <div class="note">Live preview — final document may differ after submission.</div>
  </body>
</html>`;
}
