import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ALERT_TYPE_LABELS } from '../data/mockData';
import { formatDisplayDate } from './dateUtils';

export async function exportDriverReportPdf(driver, alerts) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const generatedAt = new Date().toLocaleString('id-ID');

  doc.setFillColor(44, 62, 80);
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('Smart Fleet Management', 14, 14);
  doc.setFontSize(10);
  doc.text('PT. Indoefti — Laporan Peringatan Sopir', 14, 22);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.text('Data Sopir', 14, 44);
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Nama        : ${driver.name}`, 14, 52);
  doc.text(`ID Sopir    : ${driver.id}`, 14, 58);
  if (driver.vehiclePlate) {
    doc.text(`Kendaraan   : ${driver.vehiclePlate}`, 14, 64);
  }
  doc.text(`Total Peringatan : ${alerts.length}`, 14, driver.vehiclePlate ? 70 : 64);
  doc.text(`Dicetak pada : ${generatedAt}`, 14, driver.vehiclePlate ? 76 : 70);

  const tableStartY = driver.vehiclePlate ? 86 : 80;

  if (alerts.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text('Tidak ada riwayat peringatan untuk sopir ini.', 14, tableStartY);
  } else {
    const rows = alerts.map((a) => [
      ALERT_TYPE_LABELS[a.violation_type ?? a.type] ?? (a.violation_type ?? a.type),
      formatDisplayDate(String(a.timestamp ?? a.date ?? '').split('T')[0] || String(a.date ?? '')),
      a.timestamp && a.timestamp.includes('T')
        ? new Date(a.timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : a.time ?? '-',
      a.location ?? a.violation_description ?? '-',
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['Jenis', 'Tanggal', 'Jam', 'Lokasi']],
      body: rows,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [44, 62, 80], textColor: 255 },
      alternateRowStyles: { fillColor: [250, 248, 245] },
      columnStyles: {
        3: { cellWidth: 60 },
      },
      margin: { left: 14, right: 14 },
    });
  }

  const safeName = driver.name.replace(/\s+/g, '-').toLowerCase();
  doc.save(`laporan-peringatan-${safeName}-${driver.id}.pdf`);
}
