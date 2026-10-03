import React from 'react';
import { QCReport } from '../types/qc';
import { formatMeasurement } from '../utils/formatUtils';
import { CamiloplasLogo } from './CamiloplasLogo';

interface Props {
  report: QCReport;
  isInteractivePreview?: boolean;
}

export const PrintReportView: React.FC<Props> = ({ report, isInteractivePreview = false }) => {
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

  const sheetWidthDim = report.criticalDimensions.find(
    (d) =>
      d.category === 'ROLL_WIDTH' ||
      d.id === 'DIM_EXT_WIDTH' ||
      d.parameterName.toLowerCase().includes('lebar roll') ||
      d.parameterName.toLowerCase().includes('sheet width')
  );

  // Overall Verdict Calculation
  const allDimensionsInSpec = report.criticalDimensions.every((d) => d.isAllInSpec);
  const isRejectRateOk = report.production.rejectionRatePct <= report.production.rejectionThresholdFail;
  const isOverallPass = allDimensionsInSpec && isRejectRateOk;

  // Active defects with count > 0
  const activeDefects = report.defects.filter((d) => d.count > 0);

  // Extruder roll metrology auto-calculation
  const avgWidth = sheetWidthDim?.mean || sheetWidthDim?.nominal || 650;
  const avgThick = widthThickness?.mean || widthThickness?.nominal || 0.5;
  const estimatedRollLengthM = Number(((100 * 1000) / (avgWidth * avgThick * 1.045)).toFixed(1));
  const estimatedGsm = Number((avgThick * 1.045 * 1000).toFixed(1));
  const weightPerMeter = Number(((avgWidth / 1000) * estimatedGsm).toFixed(1));

  // High-precision SVG tolerance chart with natural number formatting
  const generateSvgChart = (
    dim = widthThickness,
    labels = ['Kiri', 'Tg. Kiri', 'Center', 'Tg. Kanan', 'Kanan']
  ) => {
    if (!dim || !dim.samples || dim.samples.length === 0) return null;

    const width = 360;
    const height = 110;
    const padding = { top: 18, right: 42, bottom: 24, left: 42 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const nominal = dim.nominal || 0.5;
    const usl = dim.upperSpecLimit || 0.53;
    const lsl = dim.lowerSpecLimit || 0.47;
    const yMin = lsl - 0.015;
    const yMax = usl + 0.015;

    const getY = (val: number) => {
      const ratio = (val - yMin) / Math.max(0.001, yMax - yMin);
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
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-28">
        {/* Background tolerance band */}
        <rect
          x={padding.left}
          y={uslY}
          width={chartW}
          height={Math.max(1, lslY - uslY)}
          fill="#f0fdf4"
          stroke="#86efac"
          strokeWidth="0.5"
        />

        {/* USL line */}
        <line
          x1={padding.left}
          y1={uslY}
          x2={width - padding.right}
          y2={uslY}
          stroke="#b91c1c"
          strokeDasharray="3 2"
          strokeWidth="0.9"
        />
        <text
          x={width - padding.right + 3}
          y={uslY + 3}
          fill="#b91c1c"
          fontSize="7"
          fontFamily="monospace"
          fontWeight="bold"
        >
          USL {formatMeasurement(usl)}
        </text>

        {/* Nominal line */}
        <line
          x1={padding.left}
          y1={nomY}
          x2={width - padding.right}
          y2={nomY}
          stroke="#047857"
          strokeWidth="1.2"
        />
        <text
          x={width - padding.right + 3}
          y={nomY + 3}
          fill="#047857"
          fontSize="7"
          fontWeight="bold"
          fontFamily="monospace"
        >
          Nom {formatMeasurement(nominal)}
        </text>

        {/* LSL line */}
        <line
          x1={padding.left}
          y1={lslY}
          x2={width - padding.right}
          y2={lslY}
          stroke="#b91c1c"
          strokeDasharray="3 2"
          strokeWidth="0.9"
        />
        <text
          x={width - padding.right + 3}
          y={lslY + 3}
          fill="#b91c1c"
          fontSize="7"
          fontFamily="monospace"
          fontWeight="bold"
        >
          LSL {formatMeasurement(lsl)}
        </text>

        {/* Y Axis line */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#334155"
          strokeWidth="0.9"
        />

        {/* Data curve line */}
        <polyline
          fill="none"
          stroke="#1d4ed8"
          strokeWidth="1.8"
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
                fill={isOk ? '#1d4ed8' : '#b91c1c'}
                stroke="#ffffff"
                strokeWidth="1"
              />
              <text
                x={cx}
                y={cy - 5}
                textAnchor="middle"
                fontSize="7"
                fontWeight="bold"
                fill={isOk ? '#0f172a' : '#b91c1c'}
                fontFamily="monospace"
              >
                {formatMeasurement(s.val)}
              </text>
              <text
                x={cx}
                y={height - padding.bottom + 10}
                textAnchor="middle"
                fontSize="6.5"
                fill="#334155"
                fontWeight="700"
              >
                {label.replace('Sisi ', '').replace(' (Tengah)', '')}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const targetPlantLabel =
    report.header.destinationPlant === 'PROSES_2_BOLANG'
      ? 'Proses 2 Pabrik Bolang (Tigaraksa)'
      : 'Proses 2 Pabrik Jati (Jatiuwung)';

  return (
    <div
      id="print-report-container"
      className={`${
        isInteractivePreview ? 'block w-full max-w-[210mm] mx-auto p-4 sm:p-8' : 'hidden print:block w-full'
      } bg-white text-black font-sans leading-tight`}
    >
      {/* 1. OFFICIAL CORPORATE / FACTORY HEADER */}
      <table className="w-full border-2 border-black border-collapse mb-2.5">
        <tbody>
          <tr>
            {/* Logo / Company Box */}
            <td className="w-56 p-2 border-r-2 border-black align-middle text-center bg-slate-50">
              <div className="flex justify-center mb-1">
                <CamiloplasLogo size="sm" showText={false} />
              </div>
              <div className="font-black text-xs tracking-tight text-blue-950 uppercase">
                PT CAMILOPLAS JAYA MAKMUR
              </div>
              <div className="text-[8.5px] font-black text-blue-700 uppercase tracking-widest mt-0.5">
                INSPECTOR QUALITY SYSTEM
              </div>
              <div className="text-[7.5px] font-semibold text-slate-600 mt-1 border-t border-slate-300 pt-0.5">
                Pabrik Jati & Pabrik Bolang · ISO 9001:2015
              </div>
            </td>

            {/* Document Title Center */}
            <td className="p-2.5 border-r-2 border-black text-center align-middle">
              <div className="text-[10px] font-bold text-slate-700 tracking-wider uppercase mb-0.5">
                SERTIFIKASI INSPEKSI MUTU & PELEPASAN LOT
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-wide uppercase text-black">
                LEMBAR LAPORAN INSPECTOR QUALITY
              </h1>
              <div className="text-[9px] text-slate-700 mt-1 font-semibold italic">
                {report.header.processType === 'EXTRUDER'
                  ? 'Stasiun: Ekstrusi Roll Sheet (Raw Sheet Feed Production)'
                  : 'Stasiun: Thermoforming & Stamping (Mesin Kiefel Stasiun 2)'}
              </div>
              <div className="text-[8.5px] font-bold text-blue-900 mt-0.5">
                Tujuan Transfer: {targetPlantLabel}
              </div>
            </td>

            {/* Document Control Box */}
            <td className="w-56 p-2 align-middle text-[9px] font-sans space-y-1 bg-slate-50">
              <div className="flex justify-between border-b border-slate-300 pb-0.5">
                <span className="text-slate-600 font-semibold">No. Dokumen:</span>
                <span className="font-mono font-bold text-black">QC-CJM-2026/04</span>
              </div>
              <div className="flex justify-between border-b border-slate-300 pb-0.5">
                <span className="text-slate-600 font-semibold">No. Laporan:</span>
                <span className="font-mono font-black text-blue-950">{report.header.reportNumber || 'QC-EXT-001'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-300 pb-0.5">
                <span className="text-slate-600 font-semibold">Tgl Inspeksi:</span>
                <span className="font-bold text-black">{report.header.inspectionDate || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-semibold">Status Dokumen:</span>
                <span className="font-bold text-[8.5px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                  CONTROLLED COPY
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 2. METADATA MATRIX */}
      <table className="w-full border-2 border-black border-collapse mb-2.5 text-[9.5px]">
        <tbody>
          <tr className="border-b border-black bg-slate-100 font-black text-slate-900">
            <td colSpan={6} className="p-1 px-2 uppercase tracking-wider text-[10px]">
              A. INFORMASI SPK, MESIN & SPESIFIKASI PRODUKSI (PT CAMILOPLAS JAYA MAKMUR)
            </td>
          </tr>
          <tr className="border-b border-black">
            <td className="w-24 p-1.5 font-bold text-slate-700 bg-slate-50 border-r border-black">No. SPK / WO:</td>
            <td className="p-1.5 font-mono font-bold border-r border-black text-blue-950">{report.header.workOrderNumber || '-'}</td>
            <td className="w-24 p-1.5 font-bold text-slate-700 bg-slate-50 border-r border-black">Mesin / Line:</td>
            <td className="p-1.5 font-bold border-r border-black">{report.header.machineName || '-'}</td>
            <td className="w-24 p-1.5 font-bold text-slate-700 bg-slate-50 border-r border-black">Operator Mesin:</td>
            <td className="p-1.5 font-bold">{report.header.operatorName || '-'}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-1.5 font-bold text-slate-700 bg-slate-50 border-r border-black">Nama Produk:</td>
            <td className="p-1.5 font-bold border-r border-black text-black">{report.header.partName || '-'}</td>
            <td className="p-1.5 font-bold text-slate-700 bg-slate-50 border-r border-black">Shift Kerja:</td>
            <td className="p-1.5 font-bold border-r border-black">{report.header.shift.replace('_', ' ')}</td>
            <td className="p-1.5 font-bold text-slate-700 bg-slate-50 border-r border-black">Inspector QC:</td>
            <td className="p-1.5 font-bold text-blue-900">{report.header.inspectorName || '-'}</td>
          </tr>
          <tr>
            <td className="p-1.5 font-bold text-slate-700 bg-slate-50 border-r border-black">Nomor LOT:</td>
            <td className="p-1.5 font-mono font-bold border-r border-black">{report.header.partNumber || '-'}</td>
            <td className="p-1.5 font-bold text-slate-700 bg-slate-50 border-r border-black">Tujuan Alokasi:</td>
            <td className="p-1.5 font-bold border-r border-black text-blue-900">{targetPlantLabel}</td>
            <td className="p-1.5 font-bold text-slate-700 bg-slate-50 border-r border-black">Material Grade:</td>
            <td className="p-1.5 font-semibold">{report.header.materialGrade || '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* 3. OUTPUT SUMMARY & TONNAGE (HASIL PRODUKSI) */}
      <table className="w-full border-2 border-black border-collapse mb-2.5 text-[9.5px]">
        <tbody>
          <tr className="border-b border-black bg-slate-100 font-black text-slate-900">
            <td colSpan={5} className="p-1 px-2 uppercase tracking-wider text-[10px]">
              B. RINGKASAN OUTPUT PRODUKSI & EVALUASI TINGKAT REJECT (YIELD)
            </td>
          </tr>
          <tr className="text-center font-bold">
            <td className="p-2 border-r border-black w-1/5 bg-emerald-50/70">
              <div className="text-[9px] uppercase font-black text-emerald-900">Total OK (Lolos)</div>
              <div className="text-base font-mono font-black text-emerald-950 mt-0.5">
                {report.production.totalOk.toLocaleString()}
              </div>
              <div className="text-[8px] text-emerald-800 font-semibold">
                {report.production.totalProduced > 0
                  ? ((report.production.totalOk / report.production.totalProduced) * 100).toFixed(1)
                  : 100}% Lolos Standar
              </div>
            </td>
            <td className="p-2 border-r border-black w-1/5 bg-rose-50/70">
              <div className="text-[9px] uppercase font-black text-rose-900">Roll Hold (Reject)</div>
              <div className="text-base font-mono font-black text-rose-950 mt-0.5">
                {report.production.totalNg.toLocaleString()}
              </div>
              <div className="text-[8px] text-rose-800 font-semibold">Dimensi Out / Hold</div>
            </td>
            <td className="p-2 border-r border-black w-1/5 bg-amber-50/70">
              <div className="text-[9px] uppercase font-black text-amber-900">Total Rework</div>
              <div className="text-base font-mono font-black text-amber-950 mt-0.5">
                {report.production.totalRework.toLocaleString()}
              </div>
              <div className="text-[8px] text-amber-800 font-semibold">Re-trimming / Perbaikan</div>
            </td>
            <td className="p-2 border-r border-black w-1/5 bg-slate-50">
              <div className="text-[9px] uppercase font-black text-slate-800">Total Produksi</div>
              <div className="text-base font-mono font-black text-slate-950 mt-0.5">
                {report.production.totalProduced.toLocaleString()}
              </div>
              <div className="text-[8px] text-slate-600 font-semibold">Akumulasi Roll Diperiksa</div>
            </td>
            <td className={`p-2 w-1/5 ${report.production.rejectionRatePct > report.production.rejectionThresholdFail ? 'bg-rose-100 text-rose-950' : 'bg-slate-50 text-slate-900'}`}>
              <div className="text-[9px] uppercase font-black">Reject Rate (%)</div>
              <div className="text-base font-mono font-black mt-0.5">
                {report.production.rejectionRatePct.toFixed(2)}%
              </div>
              <div className="text-[8px] font-bold">Batas Ambang: {report.production.rejectionThresholdFail}%</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 4. METROLOGI PANJANG ROLL & GRAFIK VISUAL (KHUSUS EXTRUDER) */}
      <div className="border-2 border-black mb-2.5 p-2 bg-white print-avoid-break">
        <div className="flex items-center justify-between border-b border-black pb-1 mb-2">
          <span className="font-black text-[10px] uppercase tracking-wider text-slate-900">
            C. KALKULASI METROLOGI GULUNGAN ROLL & GRAFIK PROFIL KETEBALAN (MICROMETER)
          </span>
          <span className="text-[9px] font-mono text-slate-700 font-bold">
            ρ: 1.045 g/cm³ · Resolusi Sensor: 0.001 mm
          </span>
        </div>

        {/* Metrology Metrics Strip */}
        <div className="grid grid-cols-4 gap-2 mb-2 p-1.5 bg-slate-50 border border-slate-300 text-center text-[9px]">
          <div>
            <span className="text-slate-600 font-bold block">Estimasi Panjang Roll:</span>
            <strong className="text-xs font-mono font-black text-blue-950">{estimatedRollLengthM.toLocaleString()} m</strong>
          </div>
          <div>
            <span className="text-slate-600 font-bold block">Gramatur Sheet (GSM):</span>
            <strong className="text-xs font-mono font-black text-emerald-900">{estimatedGsm} g/m²</strong>
          </div>
          <div>
            <span className="text-slate-600 font-bold block">Berat per Meter:</span>
            <strong className="text-xs font-mono font-black text-slate-950">{weightPerMeter} g/m</strong>
          </div>
          <div>
            <span className="text-slate-600 font-bold block">Lebar Sheet Terukur:</span>
            <strong className="text-xs font-mono font-black text-slate-950">{formatMeasurement(avgWidth)} mm</strong>
          </div>
        </div>

        {/* Visual Thickness Charts */}
        <div className="grid grid-cols-2 gap-3">
          {/* Arah Lebar */}
          <div className="border border-slate-400 p-1.5 rounded bg-slate-50/50">
            <div className="flex justify-between items-center text-[9px] font-bold border-b border-slate-300 pb-0.5 mb-1">
              <span>(1) Ketebalan Arah Lebar (Cross-Direction)</span>
              <span className="font-mono text-slate-700">Nom: {formatMeasurement(widthThickness?.nominal)} mm</span>
            </div>
            {generateSvgChart(widthThickness, ['Kiri', 'Tg. Kiri', 'Center', 'Tg. Kanan', 'Kanan'])}
            <div className="flex justify-between text-[8px] font-mono text-slate-700 mt-1 pt-0.5 border-t border-slate-300 font-semibold">
              <span>x̄: {formatMeasurement(widthThickness?.mean)}</span>
              <span>Min: {formatMeasurement(widthThickness?.min)}</span>
              <span>Max: {formatMeasurement(widthThickness?.max)}</span>
              <span>R: {formatMeasurement(widthThickness?.range)}</span>
              <span>Status: <strong className={widthThickness?.isAllInSpec ? 'text-emerald-800' : 'text-rose-800'}>{widthThickness?.isAllInSpec ? 'OK' : 'OUT'}</strong></span>
            </div>
          </div>

          {/* Arah Panjang */}
          <div className="border border-slate-400 p-1.5 rounded bg-slate-50/50">
            <div className="flex justify-between items-center text-[9px] font-bold border-b border-slate-300 pb-0.5 mb-1">
              <span>(2) Ketebalan Arah Panjang (Machine-Direction)</span>
              <span className="font-mono text-slate-700">Nom: {formatMeasurement(lengthThickness?.nominal || widthThickness?.nominal)} mm</span>
            </div>
            {lengthThickness
              ? generateSvgChart(lengthThickness, ['0m', '50m', '100m', '150m', '200m'])
              : generateSvgChart(widthThickness, ['0m', '50m', '100m', '150m', '200m'])}
            <div className="flex justify-between text-[8px] font-mono text-slate-700 mt-1 pt-0.5 border-t border-slate-300 font-semibold">
              <span>x̄: {formatMeasurement(lengthThickness?.mean ?? widthThickness?.mean)}</span>
              <span>Min: {formatMeasurement(lengthThickness?.min ?? widthThickness?.min)}</span>
              <span>Max: {formatMeasurement(lengthThickness?.max ?? widthThickness?.max)}</span>
              <span>R: {formatMeasurement(lengthThickness?.range ?? widthThickness?.range)}</span>
              <span>Status: <strong className={(lengthThickness?.isAllInSpec ?? widthThickness?.isAllInSpec) ? 'text-emerald-800' : 'text-rose-800'}>{(lengthThickness?.isAllInSpec ?? widthThickness?.isAllInSpec) ? 'OK' : 'OUT'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. TABEL PENGUKURAN DIMENSI KRITIS (SPC SAMPLES S1-S5) */}
      <table className="w-full border-2 border-black border-collapse mb-2.5 text-[8.5px] print-avoid-break">
        <thead>
          <tr className="bg-slate-100 font-black border-b border-black text-slate-950">
            <th colSpan={14} className="p-1 px-2 text-left uppercase tracking-wider text-[10px]">
              D. DATA PENGUKURAN DIMENSI KRITIS (SPC 5-SAMPLE CHECK)
            </th>
          </tr>
          <tr className="bg-slate-200 border-b border-black text-center font-black text-slate-900">
            <th className="p-1 border border-black w-6">No</th>
            <th className="p-1 border border-black text-left">Karakteristik Pengukuran</th>
            <th className="p-1 border border-black w-24">Alat Ukur</th>
            <th className="p-1 border border-black w-14">Nominal</th>
            <th className="p-1 border border-black w-14">LSL (Min)</th>
            <th className="p-1 border border-black w-14">USL (Max)</th>
            <th className="p-1 border border-black w-12 bg-blue-50/50">S1</th>
            <th className="p-1 border border-black w-12 bg-blue-50/50">S2</th>
            <th className="p-1 border border-black w-12 bg-blue-50/50">S3</th>
            <th className="p-1 border border-black w-12 bg-blue-50/50">S4</th>
            <th className="p-1 border border-black w-12 bg-blue-50/50">S5</th>
            <th className="p-1 border border-black w-14">Mean (x̄)</th>
            <th className="p-1 border border-black w-12">Range (R)</th>
            <th className="p-1 border border-black w-20">Status</th>
          </tr>
        </thead>
        <tbody>
          {report.criticalDimensions.map((dim, idx) => (
            <tr key={dim.id} className="border-b border-black text-center font-mono">
              <td className="p-1 border border-black font-bold">{idx + 1}</td>
              <td className="p-1 border border-black text-left font-sans font-bold text-slate-950">{dim.parameterName}</td>
              <td className="p-1 border border-black font-sans text-slate-800">{dim.toolUsed}</td>
              <td className="p-1 border border-black font-bold">{formatMeasurement(dim.nominal)}</td>
              <td className="p-1 border border-black text-slate-700">{formatMeasurement(dim.lowerSpecLimit)}</td>
              <td className="p-1 border border-black text-slate-700">{formatMeasurement(dim.upperSpecLimit)}</td>
              {dim.samples.map((s, sIdx) => {
                const isOos = dim.outOfSpecIndices.includes(sIdx);
                return (
                  <td
                    key={sIdx}
                    className={`p-1 border border-black ${
                      isOos ? 'bg-rose-200 font-black text-rose-950' : ''
                    }`}
                  >
                    {formatMeasurement(s)}
                  </td>
                );
              })}
              <td className="p-1 border border-black font-bold text-slate-950">
                {formatMeasurement(dim.mean)}
              </td>
              <td className="p-1 border border-black text-slate-800">
                {formatMeasurement(dim.range)}
              </td>
              <td className="p-1 border border-black font-sans font-bold">
                {dim.isAllInSpec ? (
                  <span className="text-emerald-900 font-extrabold">IN-SPEC (OK)</span>
                ) : (
                  <span className="text-rose-950 bg-rose-200 px-1 py-0.5 rounded font-black">OUT (HOLD)</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 6. DEFECT CHECKLIST & CAVITY BREAKDOWN (IF ANY DEFECTS REPORTED) */}
      {activeDefects.length > 0 && (
        <table className="w-full border-2 border-black border-collapse mb-2.5 text-[8.5px] print-avoid-break">
          <thead>
            <tr className="bg-slate-100 font-black border-b border-black text-slate-950">
              <th colSpan={4} className="p-1 px-2 text-left uppercase tracking-wider text-[10px]">
                E. RINCIAN TEMUAN CACAT VISUAL & DEFECT LOG
              </th>
            </tr>
            <tr className="bg-slate-200 border-b border-black text-center font-bold">
              <th className="p-1 border border-black w-8">No</th>
              <th className="p-1 border border-black text-left">Jenis Cacat / Defect</th>
              <th className="p-1 border border-black w-28">Jumlah Ditemukan</th>
              <th className="p-1 border border-black w-28">Persentase Reject</th>
            </tr>
          </thead>
          <tbody>
            {activeDefects.map((def, idx) => (
              <tr key={def.id} className="border-b border-black text-center font-mono">
                <td className="p-1 border border-black">{idx + 1}</td>
                <td className="p-1 border border-black text-left font-sans font-bold text-slate-900">{def.name} ({def.indonesianName})</td>
                <td className="p-1 border border-black font-bold text-rose-950">{def.count} pcs</td>
                <td className="p-1 border border-black text-slate-800 font-bold">
                  {report.production.totalProduced > 0
                    ? ((def.count / report.production.totalProduced) * 100).toFixed(2)
                    : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 7. KEPUTUSAN RELEASE, CATATAN & FORMAL SIGNATURE BLOCK */}
      <table className="w-full border-2 border-black border-collapse text-[9px] print-avoid-break">
        <tbody>
          <tr className="border-b border-black bg-slate-100 font-black text-slate-950">
            <td colSpan={3} className="p-1 px-2 uppercase tracking-wider text-[10px]">
              F. KEPUTUSAN PELEPASAN LOT (RELEASE DISPOSITION) & PENGESAHAN
            </td>
          </tr>

          {/* Verdict Seal Stamp */}
          <tr className="border-b border-black">
            <td colSpan={3} className="p-2.5 text-center">
              <div
                className={`inline-block border-2 px-6 py-2 rounded-lg text-center font-black tracking-wider uppercase ${
                  isOverallPass
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-950'
                    : 'border-rose-800 bg-rose-50 text-rose-950'
                }`}
              >
                <div className="text-sm">
                  {isOverallPass
                    ? `✓ KEPUTUSAN: LOT LOLOS INSPEKSI (RELEASED TO ${targetPlantLabel.toUpperCase()})`
                    : '✗ KEPUTUSAN: LOT DITAHAN (ON HOLD / RE-INSPECT)'}
                </div>
                <div className="text-[8.5px] font-semibold normal-case mt-0.5 text-slate-700">
                  {isOverallPass
                    ? `Seluruh dimensi kritis dan spesifikasi toleransi memenuhi standar mutu PT Camiloplas Jaya Makmur (ISO 9001:2015).`
                    : 'Terdapat dimensi atau tingkat reject yang melampaui batas toleransi yang diizinkan.'}
                </div>
              </div>
            </td>
          </tr>

          {/* Notes & Corrective Actions */}
          <tr className="border-b border-black">
            <td colSpan={3} className="p-2 text-[9px]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong className="block text-slate-800 font-bold mb-0.5">Catatan QC & Parameter Proses:</strong>
                  <div className="p-1.5 border border-slate-400 rounded bg-slate-50 min-h-[34px] text-slate-900 font-medium">
                    {report.notes || 'Pengukuran dimensi stabil. Profil ketebalan seragam dan dalam batas kendali.'}
                  </div>
                </div>
                <div>
                  <strong className="block text-slate-800 font-bold mb-0.5">Tindakan Korektif (Jika Ada):</strong>
                  <div className="p-1.5 border border-slate-400 rounded bg-slate-50 min-h-[34px] text-slate-900 font-medium">
                    {report.correctiveAction || 'Tidak ada tindakan korektif khusus. Lanjut transfer ke proses stasiun lanjutan.'}
                  </div>
                </div>
              </div>
            </td>
          </tr>

          {/* Signature Columns */}
          <tr className="text-center font-sans">
            <td className="w-1/3 p-2.5 border-r border-black align-top h-28 flex flex-col justify-between">
              <div>
                <div className="text-[9px] font-bold uppercase text-slate-700">Dibuat Oleh (Operator)</div>
                <div className="text-[8px] text-slate-500">Operasional Produksi Extruder</div>
              </div>
              <div className="mt-8">
                <div className="border-b border-black w-36 mx-auto" />
                <div className="font-bold text-[9.5px] uppercase mt-1">{report.header.operatorName || 'Operator Mesin'}</div>
                <div className="text-[8px] text-slate-600">Tgl: {report.header.inspectionDate}</div>
              </div>
            </td>

            <td className="w-1/3 p-2.5 border-r border-black align-top h-28 flex flex-col justify-between">
              <div>
                <div className="text-[9px] font-bold uppercase text-slate-700">Diperiksa Oleh (Inspector QC)</div>
                <div className="text-[8px] text-slate-500">Inspector Quality PT Camiloplas Jaya Makmur</div>
              </div>
              <div className="mt-8">
                <div className="border-b border-black w-36 mx-auto" />
                <div className="font-bold text-[9.5px] uppercase mt-1 text-blue-950">{report.header.inspectorName || 'QC Inspector'}</div>
                <div className="text-[8px] text-slate-600">Tgl: {report.header.inspectionDate}</div>
              </div>
            </td>

            <td className="w-1/3 p-2.5 align-top h-28 flex flex-col justify-between">
              <div>
                <div className="text-[9px] font-bold uppercase text-slate-700">Disetujui Oleh (QA / QC Lead)</div>
                <div className="text-[8px] text-slate-500">Quality Assurance Section Head</div>
              </div>
              <div className="mt-8">
                <div className="border-b border-black w-36 mx-auto" />
                <div className="font-bold text-[9.5px] uppercase mt-1">{report.approvedBy || 'Hendra Gunawan (QC Lead)'}</div>
                <div className="text-[8px] text-slate-600">Tgl: {report.header.inspectionDate}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer System Stamp */}
      <div className="flex justify-between items-center text-[8px] text-slate-600 mt-2 px-1 font-mono font-semibold">
        <span>PT CAMILOPLAS JAYA MAKMUR · INSPECTOR QUALITY SYSTEM · ISO 9001 COMPLIANT</span>
        <span>Dicetak otomatis: {new Date().toLocaleString('id-ID')}</span>
        <span>Lembar 1 dari 1 (Dokumen Sah)</span>
      </div>
    </div>
  );
};
