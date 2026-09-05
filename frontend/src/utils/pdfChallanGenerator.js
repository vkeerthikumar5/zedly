import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api, { getMediaUrl } from '../api';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';

export const generateChallanPDF = async (challan) => {
  try {
    // Fetch Admin Profile Data
    const profileRes = await api.get('/api/profile/');
    const profileInfo = profileRes.data;
    
    // Convert Export House signature to base64 if it has one
    let signatureB64 = null;
    if (profileInfo.authorized_signature) {
      try {
         const sigUrl = getMediaUrl(profileInfo.authorized_signature);
         const response = await fetch(sigUrl);
         const blob = await response.blob();
         signatureB64 = await new Promise((resolve) => {
           const reader = new FileReader();
           reader.onloadend = () => resolve(reader.result);
           reader.readAsDataURL(blob);
         });
      } catch(e) { console.error("Failed to fetch signature", e); }
    }
    
    // Generate QR Code
    const qrText = `ZEDLY:CHALLAN:${challan.id}:SUB:${challan.subcontractor}`;
    const qrDataUrl = await QRCode.toDataURL(qrText, { margin: 1, width: 150 });

    const doc = new jsPDF('p', 'pt', 'a4');
    
    const copies = ['ORIGINAL FOR CONSIGNEE', 'DUPLICATE FOR TRANSPORTER', 'TRIPLICATE FOR CONSIGNOR'];
    
    copies.forEach((copyLabel, index) => {
      if (index > 0) doc.addPage();
      
      const margin = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = margin;

      const colorDeepBlack = [17, 17, 17];
      const colorCharcoal = [34, 34, 34];
      const colorTextGray = [85, 85, 85];
      const colorLightBg = [245, 245, 245];
      const colorBorder = [204, 204, 204];

      // COPY LABEL TOP RIGHT
      doc.setFont("times", "bolditalic");
      doc.setFontSize(10);
      doc.setTextColor(...colorCharcoal);
      doc.text(copyLabel, pageWidth - margin, currentY, { align: "right" });
      currentY += 20;

      // HEADER
      doc.setFont("times", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...colorDeepBlack);
      doc.text("DELIVERY CHALLAN", pageWidth / 2, currentY, { align: "center" });

      currentY += 14;
      doc.setFont("times", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...colorTextGray);
      doc.text("(Issued under Rule 55 of CGST Rules, 2017)", pageWidth / 2, currentY, { align: "center" });

      currentY += 25;
      
      // REF BADGES
      doc.setFont("times", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...colorDeepBlack);
      doc.text(`Challan No: ${challan.challan_number || 'N/A'}`, margin, currentY);
      
      const dateStr = new Date(challan.created_at || Date.now()).toLocaleDateString();
      doc.text(`Date & Time: ${dateStr}`, pageWidth - margin, currentY, { align: "right" });

      currentY += 15;
      doc.setLineWidth(1.0);
      doc.setDrawColor(...colorDeepBlack);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      
      currentY += 25;

      // PARTIES
      const boxWidth = (pageWidth - (margin * 2) - 15) / 2;
      const boxHeight = 110;

      // LEFT: Consignor
      doc.setDrawColor(...colorBorder);
      doc.setFillColor(...colorLightBg);
      doc.rect(margin, currentY, boxWidth, boxHeight, 'FD');
      
      doc.setFont("times", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...colorTextGray);
      doc.text("CONSIGNOR (EXPORT HOUSE)", margin + 12, currentY + 18);
      
      doc.setFontSize(11);
      doc.setTextColor(...colorDeepBlack);
      doc.text(profileInfo?.company_name || 'Verified Export House', margin + 12, currentY + 36);
      
      doc.setFont("times", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...colorTextGray);
      const addrConsignor = doc.splitTextToSize(profileInfo?.corporate_address || 'Address On Record', boxWidth - 24);
      doc.text(addrConsignor, margin + 12, currentY + 50);
      
      doc.setFont("times", "bold");
      doc.setTextColor(...colorDeepBlack);
      doc.text(`GSTIN: ${profileInfo?.gstin || 'N/A'}`, margin + 12, currentY + boxHeight - 15);

      // RIGHT: Consignee
      const rightX = margin + boxWidth + 15;
      doc.setDrawColor(...colorBorder);
      doc.setFillColor(...colorLightBg);
      doc.rect(rightX, currentY, boxWidth, boxHeight, 'FD');

      doc.setFontSize(9);
      doc.setTextColor(...colorTextGray);
      doc.text("CONSIGNEE (SUBCONTRACTOR)", rightX + 12, currentY + 18);
      
      doc.setFontSize(11);
      doc.setTextColor(...colorDeepBlack);
      doc.text(challan.subcontractor_name || 'Subcontractor Name', rightX + 12, currentY + 36);
      
      doc.setFont("times", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...colorTextGray);
      const addrConsignee = doc.splitTextToSize(challan.destination_address || '-', boxWidth - 24);
      doc.text(addrConsignee, rightX + 12, currentY + 50);
      
      doc.setFont("times", "bold");
      doc.setTextColor(...colorDeepBlack);
      const subIdType = challan.subcontractor_id_type || 'N/A';
      doc.text(`${subIdType}: ${challan.subcontractor_id_number || 'N/A'}`, rightX + 12, currentY + boxHeight - 15);

      currentY += boxHeight + 35;

      // LOGISTICS
      doc.setFontSize(11);
      doc.text("TRANSIT LOGISTICS", margin, currentY);
      doc.setDrawColor(...colorBorder);
      doc.setLineWidth(0.5);
      doc.line(margin, currentY + 5, pageWidth - margin, currentY + 5);
      
      currentY += 25;
      
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.text(`Mode of Transport:`, margin, currentY);
      doc.setFont("times", "bold");
      doc.text(challan.mode_of_transport || '-', margin + 95, currentY);

      doc.setFont("times", "normal");
      doc.text(`Vehicle Number:`, pageWidth / 2, currentY);
      doc.setFont("times", "bold");
      doc.text(challan.vehicle_number || '-', pageWidth / 2 + 80, currentY);

      currentY += 25;
      doc.setFont("times", "normal");
      doc.text(`Contact Person:`, margin, currentY);
      doc.setFont("times", "bold");
      doc.text(challan.subcontractor_contact_person || '-', margin + 95, currentY);

      doc.setFont("times", "normal");
      doc.text(`Contact Number:`, pageWidth / 2, currentY);
      doc.setFont("times", "bold");
      doc.text(challan.subcontractor_contact_number || '-', pageWidth / 2 + 80, currentY);

      currentY += 35;

      // MATERIALS TABLE
      doc.setFontSize(11);
      doc.text("MATERIAL DETAILS", margin, currentY);
      doc.setDrawColor(...colorBorder);
      doc.setLineWidth(0.5);
      doc.line(margin, currentY + 5, pageWidth - margin, currentY + 5);
      
      currentY += 15;

      const tableData = (challan.materials || []).map((m, idx) => {
        const qty = parseFloat(m.quantity) || 0;
        const taxRate = parseFloat(m.taxable_value_per_unit) || 0;
        const totalTaxable = (qty * taxRate).toFixed(2);
        return [
          (idx + 1).toString(),
          m.description || '-',
          m.hsn_code || '-',
          m.quantity ? `${m.quantity} ${m.unit || 'Units'}` : '-',
          `Rs. ${totalTaxable}`
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['S.No', 'Description of Goods', 'HSN Code', 'Quantity', 'Est. Taxable Value']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: colorCharcoal, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', font: 'times' },
        styles: { font: 'times', fontSize: 10, cellPadding: 8, textColor: colorDeepBlack, lineColor: colorBorder },
        columnStyles: {
          0: { halign: 'center', cellWidth: 40 },
          1: { halign: 'left', cellWidth: 'auto' },
          2: { halign: 'center', cellWidth: 80 },
          3: { halign: 'center', cellWidth: 80 },
          4: { halign: 'right', cellWidth: 100 }
        },
        margin: { left: margin, right: margin }
      });

      currentY = Math.round(doc.lastAutoTable.finalY) + 50;

      // SIGNATURE footer
      doc.setFillColor(...colorLightBg);
      doc.setDrawColor(...colorBorder);
      doc.rect(margin, currentY, pageWidth - (margin * 2), 120, 'FD');

      currentY += 20;
      doc.setFont("times", "bold");
      doc.setFontSize(10);
      
      doc.text(`For ${profileInfo?.company_name || 'Issuing Authority'}`, margin + 20, currentY);

      if (signatureB64) {
         doc.addImage(signatureB64, 'PNG', margin + 20, currentY + 10, 100, 50);
      }

      const sigY = currentY + 70;
      
      doc.setDrawColor(...colorCharcoal);
      doc.setLineWidth(0.75);
      doc.line(margin + 20, sigY, margin + 180, sigY);

      doc.setFont("times", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...colorTextGray);
      doc.text("(Authorized Signatory & Stamp)", margin + 20, sigY + 15);

      if (qrDataUrl) {
         doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 80, currentY + 130, 70, 70);
         doc.setFont("times", "italic");
         doc.setFontSize(9);
         doc.setTextColor(...colorTextGray);
         doc.text("Please scan using Zedly mobile app to verify this document.", pageWidth - margin, currentY + 215, { align: "right" });
      }
    });

    const filename = `${challan.challan_number || 'Challan'}.pdf`;
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    
    return { url, filename };
  } catch (err) {
    console.error("PDF Generate Error:", err);
    toast.error("Failed to render PDF");
    return null;
  }
};
