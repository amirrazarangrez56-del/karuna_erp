// Thermal Receipt & KOT Printing Utilities for Karuna Hotel POS
// Matches exact user layout specifications (Cash-Memo Bill & K.O.T. Ticket)

export function printKOTReceipt({ tableNo, tokenNo, kotRunNo = 1, items, orderNote, waiter }) {
  if (!items || items.length === 0) return;

  const printWindow = window.open('', '_blank', 'width=420,height=600');
  if (!printWindow) {
    console.warn('Print pop-up window was blocked by the browser. Please allow pop-ups for this POS site.');
    return;
  }
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>KOT - Karuna Hotel</title>
      <meta charset="utf-8">
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html, body {
          width: 78mm;
          max-width: 78mm;
          margin: 0 auto;
          padding: 6px;
          background: #fff;
          color: #000;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 13px;
          line-height: 1.35;
        }
        .kot-card {
          border: 2px dashed #000;
          border-radius: 6px;
          padding: 10px 12px;
          background: #fff;
          width: 100%;
        }
        .kot-title {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 2px;
          margin: 0;
          color: #000;
        }
        .kot-subtitle {
          font-size: 11px;
          font-weight: 800;
          color: #334155;
          letter-spacing: 0.8px;
          margin-top: 1px;
          text-transform: uppercase;
        }
        .dashed-divider {
          border-top: 1.5px dashed #000;
          margin: 8px 0;
        }
        .meta-group {
          font-size: 13px;
          font-weight: 800;
          line-height: 1.45;
          color: #000;
        }
        .items-header {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 900;
          color: #000;
          padding: 2px 0;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 4px 0;
          font-size: 14px;
          font-weight: 900;
          color: #000;
        }
        .item-name {
          flex: 1;
          padding-right: 8px;
        }
        .item-qty {
          font-size: 15px;
          font-weight: 900;
          text-align: right;
          white-space: nowrap;
        }
        .footer-text {
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          margin-top: 4px;
        }
        @media print {
          html, body {
            width: 78mm !important;
            max-width: 78mm !important;
            margin: 0 auto !important;
            padding: 2px !important;
          }
          .kot-card {
            border: 2px dashed #000 !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="kot-card">
        <h1 class="kot-title">K. O. T.</h1>
        <div class="kot-subtitle">KITCHEN ORDER TICKET</div>
        
        <div class="dashed-divider"></div>
        
        <div class="meta-group">
          <div>Table: ${tableNo || 'Takeaway'}</div>
          <div>KOT No: #${kotRunNo}</div>
          <div>Waiter: ${waiter || 'Staff'}</div>
          <div>Time: ${timeStr}</div>
          ${orderNote ? `<div style="margin-top: 3px; font-size: 11px; color: #b91c1c;">Note: ${orderNote}</div>` : ''}
        </div>
        
        <div class="dashed-divider"></div>
        
        <div class="items-header">
          <span>Item</span>
          <span>Qty</span>
        </div>
        
        <div class="dashed-divider" style="margin: 4px 0;"></div>
        
        <div>
          ${items.map(item => {
            const qtyStr = item.unit || item.qtyDisplay || item.qty;
            const isParcel = item.isParcel || (item.customNote && item.customNote.toLowerCase().includes('parcel'));
            const displayName = `${item.name}${isParcel ? ' <span style="color:#b91c1c; font-weight:900;">[PARCEL]</span>' : ''}`;
            return `
              <div class="item-row">
                <div class="item-name">
                  ${displayName}
                  ${item.customNote && !item.customNote.toLowerCase().includes('parcel') ? `<div style="font-size: 10px; font-weight: normal; font-style: italic; color: #475569;">(${item.customNote})</div>` : ''}
                </div>
                <div class="item-qty">${qtyStr}</div>
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="dashed-divider"></div>
        
        <div class="footer-text">
          Karuna Hotel Kitchen System
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function printThermalReceipt(billData) {
  const printWindow = window.open('', '_blank', 'width=440,height=650');
  if (!printWindow) {
    console.warn('Print pop-up window was blocked by the browser. Please allow pop-ups for this POS site.');
    return;
  }
  const billDate = new Date(billData.createdAt || Date.now());
  
  const day = String(billDate.getDate()).padStart(2, '0');
  const month = String(billDate.getMonth() + 1).padStart(2, '0');
  const year = billDate.getFullYear();
  const dateFormatted = `${day}-${month}-${year}`;

  const timeFormatted = billDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const billNumber = billData.id || billData.tokenNo || '1';
  const tableName = billData.tableNo || '14A';
  const sectionName = (billData.sectionName || 'Dine In Area').toUpperCase();
  const waiterName = billData.waiter || billData.paymentDetails?.waiter || 'Raju';
  const grandTotal = billData.total || 0;

  // Generate UPI Payment QR Code string for phone scanning
  const upiString = `upi://pay?pa=8446091809@upi&pn=KarunaHotel&am=${grandTotal}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(upiString)}&margin=1`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cash Memo - Karuna Hotel</title>
      <meta charset="utf-8">
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html, body {
          width: 78mm;
          max-width: 78mm;
          margin: 0 auto;
          padding: 8px 6px;
          color: #000;
          background: #fff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 13px;
          line-height: 1.3;
        }
        .bill-container {
          width: 100%;
          max-width: 78mm;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 6px;
        }
        .hotel-name {
          font-size: 22px;
          font-weight: 900;
          margin: 0 0 2px 0;
          letter-spacing: -0.2px;
          color: #000;
        }
        .location, .phone {
          font-size: 13px;
          font-weight: 700;
          margin: 1px 0;
          color: #000;
        }
        .cash-memo-title {
          font-size: 18px;
          font-weight: 900;
          margin: 6px 0 6px 0;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #000;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 800;
          margin-bottom: 2.5px;
          color: #000;
        }
        .dashed-line {
          border-top: 1.5px dashed #000;
          margin: 6px 0;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .items-table th {
          padding: 3px 0;
          font-weight: 900;
          color: #000;
        }
        .items-table td {
          padding: 3.5px 0;
          font-weight: 800;
          color: #000;
        }
        .bottom-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-top: 6px;
        }
        .qr-block {
          width: 48%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .scan-title {
          font-size: 10.5px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.2px;
          margin-bottom: 3px;
          color: #000;
        }
        .qr-wrapper {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .phone-icon {
          width: 20px;
          height: 36px;
          border: 2px solid #000;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 2px 1px;
        }
        .phone-screen {
          width: 13px;
          height: 22px;
          background: #f1f5f9;
          border: 1px solid #000;
          border-radius: 1px;
        }
        .phone-button {
          width: 3.5px;
          height: 3.5px;
          background: #000;
          border-radius: 50%;
        }
        .qr-img {
          width: 72px;
          height: 72px;
          display: block;
        }
        .total-block {
          width: 50%;
          text-align: right;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 80px;
          padding-left: 4px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 17px;
          font-weight: 900;
          color: #000;
        }
        .total-amount {
          font-size: 21px;
          font-weight: 900;
          color: #000;
        }
        .thank-you {
          font-size: 11.5px;
          font-weight: 800;
          text-align: center;
          margin-top: 8px;
          color: #000;
        }
        @media print {
          html, body {
            width: 78mm !important;
            max-width: 78mm !important;
            margin: 0 auto !important;
            padding: 2px 4px !important;
          }
          .bill-container {
            width: 78mm !important;
            max-width: 78mm !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="bill-container">
        <div class="header">
          <h1 class="hotel-name">Karuna Hotel</h1>
          <div class="location">Solapur</div>
          <div class="phone">8446091809</div>
          <h2 class="cash-memo-title">CASH-MEMO</h2>
        </div>

        <div class="info-row">
          <div>Table No : ${tableName}</div>
          <div>Bill No : ${billNumber}</div>
        </div>
        <div class="info-row">
          <div>Section : ${sectionName}</div>
          <div>Date : ${dateFormatted}</div>
        </div>
        <div class="info-row">
          <div>Waiter : ${waiterName}</div>
          <div>Time : ${timeFormatted}</div>
        </div>

        <div class="dashed-line"></div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="text-align: left; width: 48%;">Item</th>
              <th style="text-align: center; width: 26%;">Qty / Unit</th>
              <th style="text-align: right; width: 26%;">Amount</th>
            </tr>
          </thead>
        </table>

        <div class="dashed-line" style="margin: 3px 0;"></div>

        <table class="items-table">
          <tbody>
            ${(billData.items || []).map(item => {
              const itemQty = parseFloat(item.qty) || 1;
              const isKgItem = item.weightKg !== undefined || (item.unit && (item.unit.includes('g') || item.unit.toLowerCase().includes('kg'))) || item.hasMultiplePrices;
              let qtyDisplay;
              if (isKgItem) {
                if (itemQty > 1 && item.unit && !item.unit.startsWith(`${itemQty} `) && !item.unit.startsWith(`${itemQty}×`)) {
                  qtyDisplay = `${itemQty} × ${item.unit}`;
                } else {
                  qtyDisplay = item.unit || `${itemQty} Kg`;
                }
              } else {
                qtyDisplay = `${itemQty}`;
              }
              const lineAmount = Math.round(((item.price || 0) * itemQty) * 100) / 100;
              const isParcel = item.isParcel || (item.customNote && item.customNote.toLowerCase().includes('parcel'));
              const displayName = `${item.name}${isParcel ? ' (Parcel)' : ''}`;
              return `
                <tr>
                  <td style="text-align: left; width: 48%; padding-right: 4px;">
                    ${displayName}
                  </td>
                  <td style="text-align: center; width: 26%; font-weight: 900;">${qtyDisplay}</td>
                  <td style="text-align: right; width: 26%;">${lineAmount.toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="dashed-line"></div>

        <div class="bottom-section">
          <div class="qr-block">
            <div class="scan-title">SCAN ME TO PAY!</div>
            <div class="qr-wrapper">
              <div class="phone-icon">
                <div style="width: 5px; height: 1px; background: #000; border-radius: 1px;"></div>
                <div class="phone-screen"></div>
                <div class="phone-button"></div>
              </div>
              <img class="qr-img" src="${qrCodeUrl}" alt="UPI QR" />
            </div>
          </div>

          <div class="total-block">
            <div>
              <div class="total-row">
                <span>Total:</span>
                <span class="total-amount">₹${grandTotal}</span>
              </div>
              <div class="dashed-line" style="margin: 5px 0;"></div>
            </div>
            <div class="thank-you">
              Thank You! Visit Again!
            </div>
          </div>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
