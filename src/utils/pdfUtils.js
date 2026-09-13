// PDF Report generator for Low Stock Raw Materials

export function generateLowStockPDFReport(lowStockItems) {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    console.warn('Print pop-up window was blocked by the browser. Please allow pop-ups for this POS site.');
    return;
  }
  const dateStr = new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'medium' });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Low Stock Raw Materials Report - Karuna Hotel</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; }
        .header { border-bottom: 3px solid #dc2626; padding-bottom: 15px; margin-bottom: 25px; }
        .header h1 { margin: 0; color: #991b1b; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
        .header p { margin: 5px 0 0 0; color: #64748b; font-size: 13px; }
        .alert-box { background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-weight: 600; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #f8fafc; color: #334155; text-align: left; padding: 12px; font-size: 13px; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .badge-danger { background-color: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 12px; display: inline-block; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>KARUNA HOTEL - LOW STOCK REPORT</h1>
        <p>Generated on: ${dateStr}</p>
      </div>

      <div class="alert-box">
        ⚠️ CRITICAL INVENTORY WARNING: ${lowStockItems.length} item(s) are below minimum threshold levels. Urgent replenishment required.
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Raw Material Name</th>
            <th>Current Stock</th>
            <th>Minimum Threshold</th>
            <th>Unit</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${lowStockItems.map((item, index) => `
            <tr>
              <td><strong>${index + 1}</strong></td>
              <td><strong>${item.name}</strong></td>
              <td style="color: #dc2626; font-weight: bold;">${item.quantity}</td>
              <td>${item.minThreshold}</td>
              <td>${item.unit}</td>
              <td><span class="badge-danger">LOW STOCK</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        Karuna Hotel POS & Inventory ERP Software • Confidential Report
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
