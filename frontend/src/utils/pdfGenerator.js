import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api, { getMediaUrl } from '../api';
import { toast } from 'react-hot-toast';

/**
 * Ensures an image is loaded and valid before drawing.
 * Returns a Promise that resolves with a base64 DataURL or false on failure.
 */
const getBase64Image = (url) => {
  return new Promise((resolve, reject) => {
    if (!url) return resolve(false);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (err) {
        resolve(false);
      }
    };
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

export const generateContractPDF = async (job) => {
  try {
    // Fetch Admin Profile Data
    const profileRes = await api.get('/api/profile/');
    const ehProfile = profileRes.data;

    // Initialize PDF (A4 Portrait)
    const doc = new jsPDF('p', 'pt', 'a4');
    
    // Set default standard Serif font for the entire document
    doc.setFont("times");

    // Margins and Dimensions
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = margin;

    // Premium Monochrome Legal Colors
    const colorDeepBlack = [17, 17, 17];      // #111111 (Headers/Titles)
    const colorCharcoal = [34, 34, 34];       // #222222 (Table Headers / Accents)
    const colorTextGray = [85, 85, 85];       // #555555 (Body Content)
    const colorLightBg = [249, 249, 249];     // #F9F9F9 (Soft backgrounds)
    const colorBorder = [204, 204, 204];      // #CCCCCC (Borders/Lines)

    const refId = `REF: ZEDLY/JW/${new Date().getFullYear()}/JOB-${String(job.id).padStart(3, '0')}`;

    // ==========================================
    // DOCUMENT HEADER
    // ==========================================
    // Left: Document Title in Serif
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...colorDeepBlack);
    doc.text("JOB WORK CONTRACT AGREEMENT", margin, currentY + 14);

    // Right: Minimalist Reference Box
    const badgeWidth = 180;
    const badgeHeight = 24;
    doc.setDrawColor(...colorBorder);
    doc.setFillColor(255, 255, 255); // Solid white box
    doc.rect(pageWidth - margin - badgeWidth, currentY - 2, badgeWidth, badgeHeight, 'FD');
    
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...colorDeepBlack);
    doc.text(refId, pageWidth - margin - (badgeWidth / 2), currentY + 13, { align: "center" });

    currentY += 40;

    // Main Divider (Sharp Charcoal line)
    doc.setLineWidth(1.0);
    doc.setDrawColor(...colorDeepBlack);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    
    currentY += 30;

    // ==========================================
    // PARTIES (SIDE-BY-SIDE BOXES)
    // ==========================================
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...colorDeepBlack);
    doc.text("AGREEMENT OF PARTIES", margin, currentY);
    
    currentY += 15;
    
    const boxWidth = (pageWidth - (margin * 2) - 20) / 2;
    const boxHeight = 90;

    // Left Box: Principal
    doc.setDrawColor(...colorBorder);
    doc.setFillColor(...colorLightBg);
    doc.rect(margin, currentY, boxWidth, boxHeight, 'FD'); // Sharp edges for formal look
    
    doc.setFontSize(10);
    doc.setTextColor(...colorTextGray);
    doc.text("PRINCIPAL (EXPORT HOUSE)", margin + 15, currentY + 20);
    
    doc.setTextColor(...colorDeepBlack);
    doc.text(ehProfile.company_name || 'Verified Export House', margin + 15, currentY + 38);
    
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...colorTextGray);
    const addrLines = doc.splitTextToSize(ehProfile.corporate_address || 'Address On Record', boxWidth - 30);
    doc.text(addrLines, margin + 15, currentY + 52);
    
    doc.setFont("times", "bold");
    doc.text(`GSTIN: ${ehProfile.gstin || 'N/A'}`, margin + 15, currentY + boxHeight - 15);

    // Right Box: Subcontractor
    const rightX = margin + boxWidth + 20;
    const subProfile = job.awarded_bid || {};
    
    doc.setDrawColor(...colorBorder);
    doc.setFillColor(...colorLightBg);
    doc.rect(rightX, currentY, boxWidth, boxHeight, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(...colorTextGray);
    doc.text("SERVICE PROVIDER (SUBCONTRACTOR)", rightX + 15, currentY + 20);
    
    doc.setTextColor(...colorDeepBlack);
    doc.text(subProfile.subcontractor_name || 'Subcontractor', rightX + 15, currentY + 38);
    
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...colorTextGray);
    const subAddrLines = doc.splitTextToSize(subProfile.destination_address || 'Address On Record', boxWidth - 30);
    doc.text(subAddrLines, rightX + 15, currentY + 52);
    
    doc.setFont("times", "bold");
    doc.text(`${subProfile.verification_doc_type || 'ID'}: ${subProfile.verification_status || 'VERIFIED'}`, rightX + 15, currentY + boxHeight - 15);

    currentY += boxHeight + 35;

    // ==========================================
    // SECTION 1: SCOPE OF WORK (TABLE)
    // ==========================================
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...colorDeepBlack);
    doc.text("SECTION 1: SCOPE OF WORK & FINANCIALS", margin, currentY);
    
    // Subtle accent line under section header
    doc.setDrawColor(...colorBorder);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY + 5, pageWidth - margin, currentY + 5);
    
    currentY += 20;

    const totalQty = job.total_quantity || 0;
    const rate = subProfile.quoted_price || 0;
    const totalAmount = totalQty * rate;

    const tableData = [
      [
         "1",
         job.title || "Job Work", 
         `${totalQty.toLocaleString()} ${job.unit_of_measurement || 'Units'}`, 
         `Rs. ${Number(rate).toFixed(2)}`,
         `Rs. ${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`
      ]
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['S.No', 'Description', 'Approved Quantity', 'Agreed Rate', 'Total Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: colorCharcoal, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', font: 'times' },
      styles: { font: 'times', fontSize: 10, cellPadding: 10, textColor: colorDeepBlack, lineColor: colorBorder },
      columnStyles: {
        0: { halign: 'center', cellWidth: 40 },
        1: { halign: 'left', cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 90 },
        3: { halign: 'right', cellWidth: 90 },
        4: { halign: 'right', cellWidth: 90, fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin }
    });

    currentY = Math.round(doc.lastAutoTable.finalY) + 35;

    // ==========================================
    // SECTION 2 & 3: COMPLIANCE AND PAYMENTS
    // ==========================================
    doc.setFont("times", "bold");
    doc.setTextColor(...colorDeepBlack);
    doc.setFontSize(12);
    doc.text("SECTION 2: COMPLIANCE & PAYMENT TERMS", margin, currentY);
    
    // Subtle accent line under section header
    doc.setDrawColor(...colorBorder);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY + 5, pageWidth - margin, currentY + 5);
    
    currentY += 25;
    
    // Bullet points for formal terms
    const rules = [
      { label: "Return Timeline", text: "Goods must be processed and physically returned within 365 days as per GST Section 143." },
      { label: "Quality Metrics", text: "Finished textiles must stringently adhere to technical metrics and shrinkage control limits as furnished by the Principal." },
      { label: "Liability Clause", text: "Service Provider assumes absolute logistical liability for the physical safety, integrity, and non-pilferage of raw materials in custody." },
      { label: "Payment Terms", text: "Payment shall be processed within the agreed credit cycle (post-inspection) upon verifiable receipt of formal Tax Invoices." }
    ];

    rules.forEach((rule, idx) => {
      doc.setFont("times", "bold");
      doc.setTextColor(...colorDeepBlack);
      // Formal numeric indexing
      doc.text(`${idx + 1}.`, margin, currentY);
      doc.text(`${rule.label}:`, margin + 18, currentY);
      
      doc.setFont("times", "normal");
      doc.setTextColor(...colorTextGray);
      
      // Use fixed deep indentation for perfect unified block alignment
      const textIndentOffset = 110; 
      const contentX = margin + textIndentOffset;
      const textLines = doc.splitTextToSize(rule.text, pageWidth - contentX - margin);
      
      // Print multi-line wrapped text at contentX
      doc.text(textLines, contentX, currentY);
      
      currentY += (textLines.length * 14) + 8;
    });

    currentY += 35;

    // ==========================================
    // SIGNATURE BLOCK
    // ==========================================
    // Sharp border box for signatures to signify execution
    doc.setFillColor(...colorLightBg);
    doc.setDrawColor(...colorBorder);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 140, 'FD');

    currentY += 25;

    doc.setFont("times", "bold");
    doc.setTextColor(...colorDeepBlack);
    doc.setFontSize(10);
    
    // Left: Admin
    doc.text(`For ${ehProfile.company_name || 'Principal'}`, margin + 20, currentY);
    
    // Right: Subcontractor
    doc.text(`For ${subProfile.subcontractor_name || 'Service Provider'}`, pageWidth / 2 + 20, currentY);

    const sigY = currentY + 10;

    // Load admin stamp and signature imagery if available
    if (ehProfile.company_stamp) {
      const stampUrl = getMediaUrl(ehProfile.company_stamp);
      const stampBase64 = await getBase64Image(stampUrl);
      if (stampBase64) {
        doc.addImage(stampBase64, 'PNG', margin + 20, sigY, 70, 70);
      }
    }

    if (ehProfile.authorized_signature) {
      const sigUrl = getMediaUrl(ehProfile.authorized_signature);
      const sigBase64 = await getBase64Image(sigUrl);
      if (sigBase64) {
        doc.addImage(sigBase64, 'PNG', margin + 40, sigY + 15, 80, 40);
      }
    }

    // Signature lines (Solid dark lines)
    doc.setDrawColor(...colorCharcoal);
    doc.setLineWidth(0.75);
    
    // Left Line
    doc.line(margin + 20, sigY + 80, margin + 180, sigY + 80);
    // Right Line
    doc.line(pageWidth / 2 + 20, sigY + 80, pageWidth - margin - 40, sigY + 80);

    doc.setFont("times", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...colorTextGray);
    doc.text("(Authorized Signatory & Stamp)", margin + 20, sigY + 95);
    doc.text("(Authorized Signatory)", pageWidth / 2 + 20, sigY + 95);

    // ==========================================
    // RETURN
    // ==========================================
    const filename = `${refId.replace(/\//g, '_')}.pdf`;
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    
    return { url, filename };

  } catch (err) {
    console.error("PDF Generation failed:", err);
    toast.error("Failed to generate legal PDF document.");
    return null;
  }
};
