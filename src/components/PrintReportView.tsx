import React from 'react';
import { QCReport } from '../types/qc';

interface Props {
  report: QCReport;
}

export const PrintReportView: React.FC<Props> = ({ report }) => {
  // Find thickness dimensions
  const widthThickness =
    report.criticalDimensions.find(
      (d) =>
        d.category === 'THICKNESS_WIDTH' ||
        d.id === 'DIM_EXT_THICK_WIDTH' ||
        (d.parameterName.toLowerCase().includes('lebar') && d.parameterName.toLowerCase().includes('tebal'))
    ) ||
    report.criticalDimensions.find(
      (d) =>
        d.parameterName.toLowerCase().includes('thickness') ||
        d.parameterName.toLowerCase().includes('tebal')
    ) ||
    report.criticalDimensions[0];

  const lengthThickness =
    report.criticalDimensions.find(
      (d) =>
        d.category === 'THICKNESS_LENGTH' ||
        d.id === 'DIM_EXT_THICK_LENGTH' ||
        (d.parameterName.toLowerCase().includes('panjang') && d.parameterName.toLowerCase().includes('tebal'))
    ) ||
    (report.criticalDimensions.length > 1 && report.criticalDimensions[1].unit === 'mm'
      ? report.criticalDimensions[1]
      : null);

  const isWidthInSpec = widthThickness?.isAllInSpec ?? true;
  const isLengthInSpec = lengthThickness?.isAllInSpec ?? true;
  const isOverallPass = isWidthInSpec && isLengthInSpec;

  // Helper to generate SVG polyline points for profile graph
  const generateSvgChart = (
    dim = widthThickness,
    labels = ['Kiri', 'Tg. Kiri', 'Center', 'Tg. Kanan', 'Kanan']
  ) => {
    if (!dim || !dim.samples) return null;

    const width = 340;
    const height = 110;
    const padding = { top: 20, right: 30, bottom: 25, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const nominal = dim.nominal;
    const usl = dim.upperSpecLimit;
    const lsl = dim.lowerSpecLimit;
    const yMin = lsl - 0.015;
    const yMax = usl + 0.015;

    const getY = (val: number) => {
      const ratio = (val - yMin) / (yMax - yMin);
      return padding.top + (1 - Math.max(0, Math.min(1, ratio))) * chartH;
    };

    const getX = (idx: number, total: number) => {
      return padding.left + (idx / Math.max(1, total - 1)) * chartW;
    };

    const validSamples = dim.samples.map((s, idx) => ({
      val: s !== null && !isNaN(s) ? s : nominal,
      isValid: s !== null && !isNaN(s),
      idx,
    }));

    const pointsStr = validSamples
      .map((s) => `${getX(s.idx, validSamples.length)},${getY(s.val)}`)
      .join(' ');

    const uslY = getY(usl);
    const nomY = getY(nominal);
    const lslY = getY(lsl);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-36">
        {/* Background tolerance area */}
        <rect
          x={padding.left}
          y={uslY}
          width={chartW}
          height={Math.max(1, lslY - uslY)}
          fill="#ecfdf5"
          opacity="0.8"
        />

        {/* Grid lines */}
        <line
          x1={padding.left}
          y1={uslY}
          x2={width - padding.right}
          y2={uslY}
          stroke="#ef4444"
          strokeDasharray="3 3"
          strokeWidth="1"
        />
        <text
          x={width - padding.right + 2}
          y={uslY + 3}
          fill="#ef4444"
          fontSize="7"
          fontFamily="monospace"
        >
          USL {usl.toFixed(3)}
        </text>

        <line
          x1={padding.left}
          y1={nomY}
          x2={width - padding.right}
          y2={nomY}
          stroke="#10b981"
          strokeWidth="1.2"
        />
        <text
          x={width - padding.right + 2}
          y={nomY + 3}
          fill="#059669"
          fontSize="7"
          fontWeight="bold"
          fontFamily="monospace"
        >
          Nom {nominal.toFixed(3)}
        </text>

        <line
          x1={padding.left}
          y1={lslY}
          x2={width - padding.right}
          y2={lslY}
          stroke="#ef4444"
          strokeDasharray="3 3"
          strokeWidth="1"
        />
        <text
          x={width - padding.right + 2}
          y={lslY + 3}
          fill="#ef4444"
          fontSize="7"
          fontFamily="monospace"
        >
          LSL {lsl.toFixed(3)}
        </text>

        {/* Left Y Axis line and ticks */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#94a3b8"
          strokeWidth="1"
        />

        {/* Data curve line */}
        <polyline
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinejoin="round"
          points={pointsStr}
        />

        {/* Data point dots and X-axis labels */}
        {validSamples.map((s) => {
          const cx = getX(s.idx, validSamples.length);
          const cy = getY(s.val);
          const isOk = s.val >= lsl && s.val <= usl;
          const label = dim.sampleLabels?.[s.idx] || labels[s.idx] || `S${s.idx + 1}`;

          return (
            <g key={s.idx}>
              <circle
                cx={cx}
                cy={cy}
                r="3.5"
                fill={isOk ? '#2563eb' : '#dc2626'}
                stroke="#ffffff"
                strokeWidth="1"
              />
              <text
                x={cx}
                y={cy - 5}
                textAnchor="middle"
                fontSize="7"
                fontWeight="bold"
                fill={isOk ? '#1e293b' : '#dc2626'}
                fontFamily="monospace"
              >
                {s.val.toFixed(3)}
              </text>
              <text
                x={cx}
                y={height - padding.bottom + 11}
                textAnchor="middle"
                fontSize="7"
                fill="#475569"
                fontWeight="500"
              >
                {label.replace('Sisi ', '').replace(' (Tengah)', '')}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div id="print-report-container" className="hidden print:block p-6 max-w-4xl mx-auto bg-white text-slate-900 font-sans text-xs">
      {/* Header Document */}
      <div className="border border-slate-400 mb-4 rounded-lg overflow-hidden">
        <div className="flex border-b border-slate-400 bg-slate-50 items-center">
          <div className="w-20 p-2.5 flex items-center justify-center font-extrabold text-blue-800 text-sm border-r border-slate-400">
            QC-EXT
          </div>
          <div className="flex-1 p-2.5 text-center border-r border-slate-400">
            <h1 className="text-sm font-black tracking-wide uppercase">
              LEMBAR LAPORAN QUALITY CONTROL (QC) INSPECTION
            </h1>
            <div className="text-[10px] font-bold text-blue-900">
              PROSES EXTRUDER — PRODUKSI ROLL SHEET (FEED UNTUK PROSES 2)
            </div>
          </div>
          <div className="p-2 text-[10px] space-y-0.5 w-44">
            <div><strong>No. Dok:</strong> <span className="font-mono">{report.header.reportNumber || '-'}</span></div>
            <div><strong>Tgl:</strong> {report.header.inspectionDate || '-'}</div>
            <div><strong>Rev:</strong> 02 / ISO 9001:2015</div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-3 divide-x border-b border-slate-300 text-[11px]">
          <div className="p-2 space-y-1">
            <div><span className="text-slate-500">No. SPK:</span> <strong className="font-mono text-blue-900">{report.header.workOrderNumber || '-'}</strong></div>
            <div><span className="text-slate-500">Nomor LOT:</span> <strong className="font-mono">{report.header.partNumber || '-'}</strong></div>
            <div><span className="text-slate-500">Nama Produk:</span> <strong>{report.header.partName || '-'}</strong></div>
          </div>
          <div className="p-2 space-y-1">
            <div><span className="text-slate-500">Nomor Mesin:</span> <strong>{report.header.machineName || '-'}</strong></div>
            <div><span className="text-slate-500">Material Grade:</span> {report.header.materialGrade || '-'}</div>
            <div><span className="text-slate-500">Shift Kerja:</span> <strong>{report.header.shift.replace('_', ' ')}</strong></div>
          </div>
          <div className="p-2 space-y-1">
            <div><span className="text-slate-500">Inspector QC:</span> {report.header.inspectorName || '-'}</div>
            <div><span className="text-slate-500">Operator Extruder:</span> {report.header.operatorName || '-'}</div>
          </div>
        </div>

        {/* Production Output Summary */}
        <div className="p-2 text-[11px] bg-slate-50 flex items-center justify-between">
          <div>
            <strong>Output Produksi Roll:</strong> OK: <strong className="text-emerald-700">{report.production.totalOk} Roll</strong> | Hold/Reject: <strong className="text-rose-700">{report.production.totalNg} Roll</strong> | Rework: {report.production.totalRework} Roll | Total: {report.production.totalProduced} Roll
          </div>
          <div>
            <strong>Tujuan Distribusi:</strong> <span className="text-blue-800 font-bold">Lanjut Proses 2</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: GRAFIK KETEBALAN ROLL SHEET (VISUAL CHARTS) */}
      <div className="mb-4 border border-slate-300 rounded-lg p-3 bg-white">
        <h2 className="text-xs font-bold uppercase mb-2 pb-1 border-b border-slate-300 flex items-center justify-between">
          <span>1. Grafik Profil Ketebalan Roll Sheet (Thickness Profile Charts)</span>
          <span className="text-[10px] font-normal text-slate-500">Alat Ukur: Micrometer (Resolusi 0.001 mm)</span>
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {/* Grafik Ketebalan Arah Lebar */}
          <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
            <div className="flex justify-between items-center mb-1 text-[10px] font-bold">
              <span>(A) Profil Ketebalan Arah Lebar (Cross-Direction)</span>
              <span className="text-slate-600 font-mono">Nom: {widthThickness?.nominal.toFixed(3)} mm</span>
            </div>
            {generateSvgChart(widthThickness, ['Kiri', 'Tg. Kiri', 'Center', 'Tg. Kanan', 'Kanan'])}
            <div className="text-[9px] text-slate-500 mt-1 flex justify-between">
              <span>Mean: {widthThickness?.mean !== null ? `${widthThickness.mean.toFixed(3)} mm` : '-'}</span>
              <span>Min: {widthThickness?.min !== null ? `${widthThickness.min.toFixed(3)} mm` : '-'}</span>
              <span>Max: {widthThickness?.max !== null ? `${widthThickness.max.toFixed(3)} mm` : '-'}</span>
              <span>Range: {widthThickness?.range !== null ? `${widthThickness.range.toFixed(3)} mm` : '-'}</span>
            </div>
          </div>

          {/* Grafik Ketebalan Arah Panjang */}
          <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
            <div className="flex justify-between items-center mb-1 text-[10px] font-bold">
              <span>(B) Profil Ketebalan Arah Panjang (Machine-Direction)</span>
              <span className="text-slate-600 font-mono">Nom: {lengthThickness?.nominal.toFixed(3) || '0.500'} mm</span>
            </div>
            {lengthThickness
              ? generateSvgChart(lengthThickness, ['0m (Awal)', '50m', '100m', '150m', '200m (Akhir)'])
              : generateSvgChart(widthThickness, ['0m (Awal)', '50m', '100m', '150m', '200m (Akhir)'])}
            <div className="text-[9px] text-slate-500 mt-1 flex justify-between">
              <span>Mean: {lengthThickness && lengthThickness.mean !== null ? `${lengthThickness.mean.toFixed(3)} mm` : '-'}</span>
              <span>Min: {lengthThickness && lengthThickness.min !== null ? `${lengthThickness.min.toFixed(3)} mm` : '-'}</span>
              <span>Max: {lengthThickness && lengthThickness.max !== null ? `${lengthThickness.max.toFixed(3)} mm` : '-'}</span>
              <span>Range: {lengthThickness && lengthThickness.range !== null ? `${lengthThickness.range.toFixed(3)} mm` : '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: TABEL DATA PENGUKURAN DIMENSI */}
      <div className="mb-4">
        <h2 className="text-xs font-bold uppercase mb-1.5 border-b pb-0.5">
          2. Data Pengukuran Dimensi Kritis & Spesifikasi Roll Sheet
        </h2>
        <table className="w-full text-left text-[10px] border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-slate-300">
              <th className="border border-slate-300 p-1">Karakteristik Pengukuran</th>
              <th className="border border-slate-300 p-1">Alat Ukur</th>
              <th className="border border-slate-300 p-1 text-center">Nominal</th>
              <th className="border border-slate-300 p-1 text-center">LSL</th>
              <th className="border border-slate-300 p-1 text-center">USL</th>
              <th className="border border-slate-300 p-1 text-center">S1</th>
              <th className="border border-slate-300 p-1 text-center">S2</th>
              <th className="border border-slate-300 p-1 text-center">S3</th>
              <th className="border border-slate-300 p-1 text-center">S4</th>
              <th className="border border-slate-300 p-1 text-center">S5</th>
              <th className="border border-slate-300 p-1 text-center">Mean (x̄)</th>
              <th className="border border-slate-300 p-1 text-center">Range (R)</th>
              <th className="border border-slate-300 p-1 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {report.criticalDimensions.map((dim) => (
              <tr key={dim.id}>
                <td className="border border-slate-300 p-1 font-medium">{dim.parameterName}</td>
                <td className="border border-slate-300 p-1">{dim.toolUsed}</td>
                <td className="border border-slate-300 p-1 text-center font-mono">{dim.nominal.toFixed(3)}</td>
                <td className="border border-slate-300 p-1 text-center font-mono">{dim.lowerSpecLimit.toFixed(3)}</td>
                <td className="border border-slate-300 p-1 text-center font-mono">{dim.upperSpecLimit.toFixed(3)}</td>
                {dim.samples.map((s, idx) => (
                  <td
                    key={idx}
                    className={`border border-slate-300 p-1 text-center font-mono ${
                      dim.outOfSpecIndices.includes(idx) ? 'bg-red-100 font-bold text-red-700' : ''
                    }`}
                  >
                    {s !== null ? s.toFixed(3) : '-'}
                  </td>
                ))}
                <td className="border border-slate-300 p-1 text-center font-mono font-bold">
                  {dim.mean !== null ? dim.mean.toFixed(3) : '-'}
                </td>
                <td className="border border-slate-300 p-1 text-center font-mono">
                  {dim.range !== null ? dim.range.toFixed(3) : '-'}
                </td>
                <td className="border border-slate-300 p-1 text-center font-bold">
                  {dim.isAllInSpec ? (
                    <span className="text-emerald-700">OK</span>
                  ) : (
                    <span className="text-rose-700">NG (OOS)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SECTION 3: KEPUTUSAN RELEASE & TANDA TANGAN */}
      <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 mb-4">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
            3. Rekomendasi Kelolosan Lot ke Proses 2 Kiefel:
          </div>
          <div
            className={`px-3 py-1 rounded text-xs font-black uppercase ${
              isOverallPass
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {isOverallPass
              ? 'LOLOS INSPEKSI (RELEASED TO PROSES 2)'
              : 'DITAHAN / HOLD (REVISE EXTRUDER SETUP)'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-[10px]">
          <div>
            <strong>Catatan Mesin & Parameter Extruder:</strong>
            <p className="mt-1 text-slate-700 italic border p-1.5 rounded bg-white min-h-[35px]">
              {report.notes || 'Temperatur barrel stabil. Tarikan chill roll seragam.'}
            </p>
          </div>
          <div>
            <strong>Tindakan Korektif / Penyetelan:</strong>
            <p className="mt-1 text-slate-700 italic border p-1.5 rounded bg-white min-h-[35px]">
              {report.correctiveAction || 'Parameter dipertahankan untuk running berikutnya.'}
            </p>
          </div>
        </div>
      </div>

      {/* Signature Grid */}
      <div className="grid grid-cols-3 border border-slate-400 text-[10px] text-center divide-x border-t-0">
        <div className="p-2 flex flex-col justify-between h-20">
          <div className="text-slate-500 font-semibold">Operator Extruder</div>
          <div className="font-bold underline uppercase">{report.header.operatorName || 'Operator'}</div>
        </div>
        <div className="p-2 flex flex-col justify-between h-20">
          <div className="text-slate-500 font-semibold">Inspector QC</div>
          <div className="font-bold underline uppercase">{report.header.inspectorName || 'QC Inspector'}</div>
        </div>
        <div className="p-2 flex flex-col justify-between h-20">
          <div className="text-slate-500 font-semibold">Disetujui QA / QC Leader</div>
          <div className="font-bold underline uppercase">{report.approvedBy || 'Hendra Gunawan (QC Leader)'}</div>
        </div>
      </div>
    </div>
  );
};
