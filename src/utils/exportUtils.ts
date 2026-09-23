import { QCReport } from '../types/qc';

/**
 * Generates and downloads a CSV/Excel file formatted for QC Inspection Reports
 */
export function exportReportToCSV(report: QCReport) {
  const lines: string[] = [];

  // Header info
  lines.push('LAPORAN QUALITY CONTROL (QC) INSPECTION - Q-MOLD SYSTEM');
  lines.push(`Waktu Export,${new Date().toLocaleString('id-ID')}`);
  lines.push('');

  // 1. Metadata
  lines.push('1. INFORMASI LAPORAN & PRODUKSI');
  lines.push(`Nomor Laporan,${report.header.reportNumber}`);
  lines.push(`Tanggal Inspeksi,${report.header.inspectionDate}`);
  lines.push(`Shift,${report.header.shift}`);
  lines.push(`Tipe Proses,${report.header.processType}`);
  lines.push(`Nomor Mesin,${report.header.machineName} (${report.header.machineId})`);
  lines.push(`Nomor Part / Produk,${report.header.partNumber} - ${report.header.partName}`);
  lines.push(`Nomor SPK,${report.header.workOrderNumber}`);
  lines.push(`Customer,${report.header.customerName}`);
  lines.push(`Kode Mold/Die,${report.header.moldDieCode}`);
  lines.push(`Grade Material,${report.header.materialGrade}`);
  lines.push(`Lot Number,${report.header.lotNumber}`);
  lines.push(`Inspector / Operator,${report.header.inspectorName} / ${report.header.operatorName}`);
  lines.push(`Supervisor,${report.header.supervisorName}`);
  lines.push('');

  // 2. Mold Setup
  lines.push('2. STATUS MOLD / DIE & CAVITY');
  lines.push(`Total Cavity,${report.moldSetup.totalCavities}`);
  lines.push(`Cavity Aktif,${report.moldSetup.activeCavities}`);
  lines.push(`Cavity Terblokir,${report.moldSetup.blockedCavities.join('; ') || 'None'}`);
  lines.push(`Target Berat Part (g),${report.moldSetup.targetPartWeight} ± ${report.moldSetup.weightToleranceGrams}g`);
  lines.push('No Cavity,Status,Berat Aktual (g),Delta (g),Toleransi');
  report.moldSetup.cavities.forEach((cav) => {
    lines.push(
      `${cav.cavityNumber},${cav.isActive ? 'ACTIVE' : 'BLOCKED'},${cav.actualWeight},${cav.weightDelta},${cav.isWeightInSpec ? 'IN-SPEC' : 'OUT-OF-SPEC'}`
    );
  });
  lines.push('');

  // 3. Production & Rejection Rate
  lines.push('3. HASIL PRODUKSI & REJECTION RATE');
  lines.push(`Total OK (Good),${report.production.totalOk} pcs`);
  lines.push(`Total NG (Reject),${report.production.totalNg} pcs`);
  lines.push(`Total Rework,${report.production.totalRework} pcs`);
  lines.push(`Total Produksi,${report.production.totalProduced} pcs`);
  lines.push(`Rejection Rate (%),${report.production.rejectionRatePct}%`);
  lines.push(`Rework Rate (%),${report.production.reworkRatePct}%`);
  lines.push(`Status Inspeksi,${report.production.status}`);
  lines.push(`Alasan Status,"${report.production.statusReasons.join('; ')}"`);
  lines.push('');

  // 4. Defect Breakdown
  lines.push('4. RINCIAN CACAT / DEFECT');
  lines.push('Nama Defect,Istilah Teknis,Tingkat Keparahan,Jumlah NG,Cavity Terdampak');
  report.defects.forEach((d) => {
    lines.push(
      `"${d.name}","${d.indonesianName}",${d.severity},${d.count},"${d.affectedCavities?.join(', ') || '-'}"`
    );
  });
  lines.push('');

  // 5. Critical Dimensions (SPC)
  lines.push('5. PENGUKURAN DIMENSI KRITIS (SPC)');
  lines.push('Parameter,Alat Ukur,Nominal,LSL,USL,S1,S2,S3,S4,S5,Rata-rata,Min,Max,Range,StdDev,Status');
  report.criticalDimensions.forEach((dim) => {
    const s = dim.samples;
    lines.push(
      `"${dim.parameterName}","${dim.toolUsed}",${dim.nominal},${dim.lowerSpecLimit},${dim.upperSpecLimit},${s[0] ?? ''},${s[1] ?? ''},${s[2] ?? ''},${s[3] ?? ''},${s[4] ?? ''},${dim.mean ?? ''},${dim.min ?? ''},${dim.max ?? ''},${dim.range ?? ''},${dim.stdDev ?? ''},${dim.isAllInSpec ? 'OK' : 'NG'}`
    );
  });
  lines.push('');

  // 6. Notes & Signatures
  lines.push('6. CATATAN & TINDAKAN KOREKTIF');
  lines.push(`Catatan Lapangan,"${report.notes.replace(/"/g, '""')}"`);
  lines.push(`Tindakan Korektif,"${report.correctiveAction.replace(/"/g, '""')}"`);
  lines.push(`Disetujui Oleh,${report.approvedBy || '-'},Tanggal Disetujui,${report.approvalDate || '-'}`);

  // Create downloadable CSV blob with BOM for Excel UTF-8
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `QC_Report_${report.header.reportNumber || 'QC'}_${report.header.inspectionDate}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads report as formatted JSON
 */
export function exportReportToJSON(report: QCReport) {
  const jsonStr = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `QC_Report_${report.header.reportNumber || 'QC'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
