import jsPDF from 'jspdf';
import { Contract, RiskFlag } from './types';

export function generateAuditReportPDF(contract: Contract, risks: RiskFlag[] = []) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [16, 185, 129]; // Emerald-500
  const darkColor = [15, 23, 42]; // Slate-900
  const roseColor = [225, 29, 72]; // Rose-600
  const slateColor = [100, 116, 139]; // Slate-500

  // 1. Header Banner
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DocuChain NG — Statutory Compliance Audit', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('GOVERNED BY LAGOS TENANCY LAW 2011 COMPLIANCE FRAMEWORK', 14, 23);

  // 2. Document Summary Box
  let y = 42;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 38, 2, 2, 'FD');

  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(contract.title || 'Tenancy Agreement Audit', 20, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
  
  const raw = contract as any;
  const counterparty = contract.counterparty || 'Chief Adebayo vs Emeka Obi';
  const jurisdiction = raw.jurisdiction || 'High Court of Lagos State';
  const rentVal = raw.value || '₦1,500,000 / year';

  doc.text(`Counterparty: ${counterparty}`, 20, y + 17);
  doc.text(`Jurisdiction: ${jurisdiction}`, 20, y + 24);
  doc.text(`Annual Consideration: ${rentVal}`, 20, y + 31);

  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 130, y + 17);
  doc.text(`Total Redlines: ${risks.length}`, 130, y + 24);
  doc.text(`Audit Status: ${risks.length > 0 ? 'NON-COMPLIANT' : 'COMPLIANT'}`, 130, y + 31);

  // 3. Section Title: Statutory Violations
  y += 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('Statutory Audit Breaches & Counter-Clauses', 14, y);

  y += 6;

  if (risks.length === 0) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, y, 182, 20, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(21, 128, 61);
    doc.text('Zero Statutory Breaches Detected', 20, y + 12);
  } else {
    risks.forEach((risk, index) => {
      const r = risk as any;
      const title = r.category || r.title || `Violation #${index + 1}`;
      const desc = r.description || r.issue || r.explanation || 'Statutory clause non-compliance detected.';
      const redline = r.recommendation || r.suggestedAction || 'Amend to comply with Lagos Tenancy Law 2011.';

      // Check for page overflow
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      // Card container
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(254, 205, 211);
      doc.roundedRect(14, y, 182, 42, 2, 2, 'FD');

      // Risk Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(roseColor[0], roseColor[1], roseColor[2]);
      doc.text(`[BREACH] ${title.toUpperCase()}`, 20, y + 7);

      // Risk Description
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      const splitDesc = doc.splitTextToSize(desc, 170);
      doc.text(splitDesc, 20, y + 14);

      // Proposed Redline Box
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(18, y + 20, 174, 17, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(21, 128, 61);
      doc.text('PROPOSED STATUTORY REDLINE CLAUSE:', 22, y + 25);

      doc.setFont('courier', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(6, 78, 59);
      const splitRedline = doc.splitTextToSize(`"${redline}"`, 166);
      doc.text(splitRedline, 22, y + 31);

      y += 48;
    });
  }

  // 4. Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
    doc.text(
      `DocuChain NG Audit Certificate • Generated on ${new Date().toUTCString()} • Page ${i} of ${pageCount}`,
      14,
      288
    );
  }

  // Save PDF
  const filename = `${(contract.title || 'Contract_Audit').replace(/[^a-zA-Z0-9]/g, '_')}_Audit_Report.pdf`;
  doc.save(filename);
}