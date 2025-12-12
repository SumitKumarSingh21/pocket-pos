import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Bill, Settings } from './db';

// ============================================
// GST INVOICE PDF GENERATOR
// ============================================

export const generateInvoicePDF = async (
  bill: Bill,
  settings: Settings,
  format: 'a4' | 'thermal' = 'a4'
): Promise<Blob> => {
  if (format === 'thermal') {
    return generateThermalInvoice(bill, settings);
  }
  return generateA4Invoice(bill, settings);
};

const generateA4Invoice = (bill: Bill, settings: Settings): Blob => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.shopName, pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (settings.address) {
    doc.text(settings.address, pageWidth / 2, 28, { align: 'center' });
  }
  if (settings.phone) {
    doc.text(`Ph: ${settings.phone}`, pageWidth / 2, 34, { align: 'center' });
  }
  if (settings.gstin) {
    doc.text(`GSTIN: ${settings.gstin}`, pageWidth / 2, 40, { align: 'center' });
  }

  // TAX INVOICE label
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth / 2, 50, { align: 'center' });
  
  // Invoice details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const invoiceDate = new Date(bill.createdAt).toLocaleDateString('en-IN');
  const invoiceTime = new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  
  doc.text(`Invoice No: ${bill.invoiceNumber}`, 14, 60);
  doc.text(`Date: ${invoiceDate}`, 14, 66);
  doc.text(`Time: ${invoiceTime}`, 14, 72);
  
  // Customer details
  if (bill.customerName || bill.customerPhone) {
    doc.text('Bill To:', pageWidth - 70, 60);
    if (bill.customerName) doc.text(bill.customerName, pageWidth - 70, 66);
    if (bill.customerPhone) doc.text(bill.customerPhone, pageWidth - 70, 72);
  }

  // Line
  doc.setLineWidth(0.5);
  doc.line(14, 78, pageWidth - 14, 78);

  // Items table
  const tableData = bill.items.map((item, index) => [
    index + 1,
    item.name + (item.variant ? ` (${item.variant.size}/${item.variant.color})` : ''),
    item.quantity,
    `₹${item.unitPrice.toFixed(2)}`,
    `${item.gstRate}%`,
    `₹${item.gstAmount.toFixed(2)}`,
    `₹${item.total.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 82,
    head: [['#', 'Item', 'Qty', 'Rate', 'GST%', 'GST Amt', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [66, 66, 66], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 60 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 30, halign: 'right' }
    }
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', pageWidth - 70, finalY);
  doc.text(`₹${bill.subtotal.toFixed(2)}`, pageWidth - 14, finalY, { align: 'right' });
  
  if (bill.discountAmount > 0) {
    doc.text(`Discount (${bill.discountPercent}%):`, pageWidth - 70, finalY + 6);
    doc.text(`-₹${bill.discountAmount.toFixed(2)}`, pageWidth - 14, finalY + 6, { align: 'right' });
  }
  
  doc.text('GST:', pageWidth - 70, finalY + 12);
  doc.text(`₹${bill.taxAmount.toFixed(2)}`, pageWidth - 14, finalY + 12, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', pageWidth - 70, finalY + 20);
  doc.text(`₹${bill.totalAmount.toFixed(2)}`, pageWidth - 14, finalY + 20, { align: 'right' });

  // Payment method
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Payment: ${bill.paymentMethod.toUpperCase()}`, 14, finalY + 20);

  // Footer
  doc.setFontSize(8);
  doc.text('Thank you for your business!', pageWidth / 2, finalY + 35, { align: 'center' });
  doc.text('This is a computer generated invoice', pageWidth / 2, finalY + 40, { align: 'center' });

  return doc.output('blob');
};

const generateThermalInvoice = (bill: Bill, settings: Settings): Blob => {
  // Thermal receipt: 58mm or 80mm width
  const width = settings.thermalPrinterWidth === 80 ? 80 : 58;
  const doc = new jsPDF({
    unit: 'mm',
    format: [width, 200] // Will auto-extend height
  });

  let y = 5;
  const lineHeight = 4;
  const margin = 2;

  // Header - centered
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.shopName, width / 2, y, { align: 'center' });
  y += lineHeight;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  if (settings.address) {
    const lines = doc.splitTextToSize(settings.address, width - 4);
    lines.forEach((line: string) => {
      doc.text(line, width / 2, y, { align: 'center' });
      y += lineHeight - 1;
    });
  }
  if (settings.phone) {
    doc.text(`Ph: ${settings.phone}`, width / 2, y, { align: 'center' });
    y += lineHeight;
  }
  if (settings.gstin) {
    doc.text(`GSTIN: ${settings.gstin}`, width / 2, y, { align: 'center' });
    y += lineHeight;
  }

  // Dashed line
  y += 2;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, width - margin, y);
  y += 3;

  // Invoice details
  doc.setFontSize(7);
  const invoiceDate = new Date(bill.createdAt).toLocaleDateString('en-IN');
  const invoiceTime = new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  
  doc.text(`Bill: ${bill.invoiceNumber}`, margin, y);
  doc.text(invoiceDate, width - margin, y, { align: 'right' });
  y += lineHeight;
  
  doc.text(`Time: ${invoiceTime}`, margin, y);
  y += lineHeight;

  if (bill.customerName) {
    doc.text(`Customer: ${bill.customerName}`, margin, y);
    y += lineHeight;
  }

  // Line
  y += 1;
  doc.line(margin, y, width - margin, y);
  y += 3;

  // Items
  doc.setFontSize(6);
  bill.items.forEach(item => {
    const name = item.name + (item.variant ? ` ${item.variant.size}/${item.variant.color}` : '');
    const truncatedName = name.length > 20 ? name.substring(0, 18) + '..' : name;
    
    doc.text(truncatedName, margin, y);
    y += lineHeight - 1;
    
    doc.text(`  ${item.quantity} x ₹${item.unitPrice}`, margin, y);
    doc.text(`₹${item.total.toFixed(0)}`, width - margin, y, { align: 'right' });
    y += lineHeight;
  });

  // Line
  y += 1;
  doc.line(margin, y, width - margin, y);
  y += 3;

  // Totals
  doc.setFontSize(7);
  doc.text('Subtotal:', margin, y);
  doc.text(`₹${bill.subtotal.toFixed(0)}`, width - margin, y, { align: 'right' });
  y += lineHeight;

  if (bill.discountAmount > 0) {
    doc.text(`Discount (${bill.discountPercent}%):`, margin, y);
    doc.text(`-₹${bill.discountAmount.toFixed(0)}`, width - margin, y, { align: 'right' });
    y += lineHeight;
  }

  doc.text('GST:', margin, y);
  doc.text(`₹${bill.taxAmount.toFixed(0)}`, width - margin, y, { align: 'right' });
  y += lineHeight;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL:', margin, y);
  doc.text(`₹${bill.totalAmount.toFixed(0)}`, width - margin, y, { align: 'right' });
  y += lineHeight + 2;

  // Payment method
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Paid by: ${bill.paymentMethod.toUpperCase()}`, width / 2, y, { align: 'center' });
  y += lineHeight + 2;

  // Footer
  doc.setFontSize(6);
  doc.text('Thank you! Visit again.', width / 2, y, { align: 'center' });

  return doc.output('blob');
};

// ============================================
// P&L REPORT PDF
// ============================================

interface PLData {
  period: string;
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  gstCollected: number;
  gstPaid: number;
}

export const generatePLReport = (data: PLData, settings: Settings): Blob => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.shopName, pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text('Profit & Loss Statement', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${data.period}`, pageWidth / 2, 38, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth / 2, 44, { align: 'center' });

  // Line
  doc.setLineWidth(0.5);
  doc.line(14, 50, pageWidth - 14, 50);

  let y = 60;

  // Revenue section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('REVENUE', 14, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Total Sales', 20, y);
  doc.text(`₹${data.totalSales.toLocaleString('en-IN')}`, pageWidth - 20, y, { align: 'right' });
  y += 6;
  
  doc.text('GST Collected', 20, y);
  doc.text(`₹${data.gstCollected.toLocaleString('en-IN')}`, pageWidth - 20, y, { align: 'right' });
  y += 10;

  // Cost section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('COSTS', 14, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Purchases', 20, y);
  doc.text(`₹${data.totalPurchases.toLocaleString('en-IN')}`, pageWidth - 20, y, { align: 'right' });
  y += 6;

  doc.text('Expenses', 20, y);
  doc.text(`₹${data.totalExpenses.toLocaleString('en-IN')}`, pageWidth - 20, y, { align: 'right' });
  y += 6;

  doc.text('GST Paid', 20, y);
  doc.text(`₹${data.gstPaid.toLocaleString('en-IN')}`, pageWidth - 20, y, { align: 'right' });
  y += 10;

  // Line
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  // Profit section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Gross Profit', 14, y);
  doc.text(`₹${data.grossProfit.toLocaleString('en-IN')}`, pageWidth - 20, y, { align: 'right' });
  y += 8;

  doc.setFontSize(14);
  const netProfitColor = data.netProfit >= 0 ? [0, 128, 0] : [255, 0, 0];
  doc.setTextColor(netProfitColor[0], netProfitColor[1], netProfitColor[2]);
  doc.text('Net Profit', 14, y);
  doc.text(`₹${data.netProfit.toLocaleString('en-IN')}`, pageWidth - 20, y, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  return doc.output('blob');
};

// ============================================
// SHARE UTILITIES
// ============================================

export const shareInvoiceViaWhatsApp = async (
  pdfBlob: Blob,
  bill: Bill,
  settings: Settings
): Promise<void> => {
  const filename = `${bill.invoiceNumber}.pdf`;
  const message = `Invoice ${bill.invoiceNumber} from ${settings.shopName}\nTotal: ₹${bill.totalAmount.toFixed(2)}\nThank you for your purchase!`;

  // Try Web Share API first (works on mobile)
  if (navigator.share && navigator.canShare) {
    const file = new File([pdfBlob], filename, { type: 'application/pdf' });
    
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Invoice ${bill.invoiceNumber}`,
          text: message,
          files: [file]
        });
        return;
      } catch (err) {
        console.log('Share cancelled or failed, falling back to WhatsApp link');
      }
    }
  }

  // Fallback: Open WhatsApp with message (PDF needs to be sent manually)
  const encodedMessage = encodeURIComponent(message);
  const phone = bill.customerPhone?.replace(/\D/g, '') || '';
  
  if (phone) {
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  } else {
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  }

  // Also download the PDF
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const downloadPDF = (pdfBlob: Blob, filename: string): void => {
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
