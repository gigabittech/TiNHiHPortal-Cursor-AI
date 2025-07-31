// Utility functions for PDF generation and printing
export const generateInvoicePDF = (invoice: any) => {
  // This would integrate with a PDF library like jsPDF or react-pdf
  // For now, we'll use the browser's print functionality
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .logo { height: 50px; }
        .invoice-title { font-size: 32px; font-weight: bold; }
        .invoice-number { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 10px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .table th { background-color: #f5f5f5; font-weight: bold; }
        .total-section { width: 300px; margin-left: auto; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .total-row.final { border-top: 2px solid #333; font-weight: bold; font-size: 18px; }
        .status-paid { color: #16a34a; font-weight: bold; }
        .status-draft { color: #6b7280; }
        .status-sent { color: #2563eb; }
        .status-overdue { color: #dc2626; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="invoice-title">Invoice</h1>
          <p>TiNHiH Portal Healthcare</p>
        </div>
        <div>
          <div class="invoice-number">#${invoice.invoiceNumber}</div>
          <span class="status-${invoice.status}">${invoice.status.toUpperCase()}</span>
        </div>
      </div>

      <div class="grid">
        <div>
          <div class="section-title">Bill To</div>
          <div>
            <strong>${invoice.patient?.user?.firstName} ${invoice.patient?.user?.lastName}</strong><br>
            ${invoice.patient?.user?.email}<br>
            ${invoice.patient?.phoneNumber || ''}<br>
            ${invoice.patient?.address || ''}
          </div>
        </div>
        <div>
          <div class="section-title">Invoice Details</div>
          <div>
            <strong>Invoice Number:</strong> ${invoice.invoiceNumber}<br>
            <strong>Date Issued:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}<br>
            ${invoice.dueDate ? `<strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}<br>` : ''}
            ${invoice.paidAt ? `<strong>Paid Date:</strong> ${new Date(invoice.paidAt).toLocaleDateString()}<br>` : ''}
          </div>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <div class="section-title">From</div>
        <div>
          <strong>Dr. ${invoice.practitioner?.user?.firstName} ${invoice.practitioner?.user?.lastName}</strong><br>
          ${invoice.practitioner?.specialization || ''}<br>
          ${invoice.practitioner?.user?.email}
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Units</th>
            <th>Price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Healthcare Services</strong><br>
              <small>${invoice.description}</small>
              ${invoice.appointment ? `<br><small>Related to appointment on ${new Date(invoice.appointment.appointmentDate).toLocaleDateString()}</small>` : ''}
            </td>
            <td>1</td>
            <td>$${Number(invoice.amount || 0).toFixed(2)}</td>
            <td>$${Number(invoice.amount || 0).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>$${Number(invoice.amount || 0).toFixed(2)}</span>
        </div>
        ${Number(invoice.tax || 0) > 0 ? `
        <div class="total-row">
          <span>Tax:</span>
          <span>$${Number(invoice.tax || 0).toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="total-row final">
          <span>Total:</span>
          <span>$${Number(invoice.total || 0).toFixed(2)}</span>
        </div>
      </div>

      ${invoice.status === 'paid' ? `
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <div style="color: #16a34a; font-weight: bold;">✓ Payment Received</div>
        <div style="color: #15803d;">This invoice was paid on ${new Date(invoice.paidAt || invoice.updatedAt).toLocaleDateString()}</div>
      </div>
      ` : ''}

      <div style="text-align: center; color: #666; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 40px;">
        <p>Thank you for choosing TiNHiH Portal Healthcare</p>
        <p>For questions about this invoice, please contact us at support@tinhih.com</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(invoiceHTML);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
};

export const downloadInvoicePDF = (invoice: any) => {
  // For a real implementation, you would use jsPDF or similar
  // For now, we'll trigger the print dialog which allows saving as PDF
  generateInvoicePDF(invoice);
};

export const printInvoice = (invoice: any) => {
  generateInvoicePDF(invoice);
};

export const emailInvoice = async (invoice: any, recipientEmail?: string) => {
  // This would integrate with an email service
  // For demo purposes, we'll just return a success response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: `Invoice ${invoice.invoiceNumber} sent to ${recipientEmail || invoice.patient?.user?.email}`
      });
    }, 1000);
  });
};