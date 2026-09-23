import React, { useMemo } from 'react';
import { DimensionSampleRow, ProductionSummary } from '../types/qc';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
  BarChart,
} from 'recharts';
import {
  TrendingUp,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Maximize2,
  Layers,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react';

interface Props {
  dimensions: DimensionSampleRow[];
  production?: ProductionSummary;
  nominal?: number;
  upperSpecLimit?: number;
  lowerSpecLimit?: number;
  partName?: string;
  reportNumber?: string;
}

export const ExtruderGraphicalReport: React.FC<Props> = ({
  dimensions,
  production,
  partName,
  reportNumber,
}) => {
  // Find thickness dimensions
  const widthThickness = useMemo(() => {
    return (
      dimensions.find(
        (d) =>
          d.category === 'THICKNESS_WIDTH' ||
          d.id === 'DIM_EXT_THICK_WIDTH' ||
          d.parameterName.toLowerCase().includes('lebar') && d.parameterName.toLowerCase().includes('tebal')
      ) ||
      dimensions.find(
        (d) =>
          d.parameterName.toLowerCase().includes('thickness') ||
          d.parameterName.toLowerCase().includes('tebal')
      ) ||
      dimensions[0]
    );
  }, [dimensions]);

  const lengthThickness = useMemo(() => {
    return (
      dimensions.find(
        (d) =>
          d.category === 'THICKNESS_LENGTH' ||
          d.id === 'DIM_EXT_THICK_LENGTH' ||
          d.parameterName.toLowerCase().includes('panjang') && d.parameterName.toLowerCase().includes('tebal')
      ) ||
      (dimensions.length > 1 && dimensions[1].unit === 'mm' ? dimensions[1] : null)
    );
  }, [dimensions]);

  const sheetWidthDim = useMemo(() => {
    return dimensions.find(
      (d) =>
        d.category === 'ROLL_WIDTH' ||
        d.parameterName.toLowerCase().includes('lebar roll') ||
        (d.parameterName.toLowerCase().includes('lebar') && !d.parameterName.toLowerCase().includes('tebal'))
    );
  }, [dimensions]);

  // Chart data for Ketebalan Arah Lebar (Cross-Direction Profile)
  const widthProfileData = useMemo(() => {
    if (!widthThickness) return [];
    const labels = widthThickness.sampleLabels || [
      'Sisi Kiri',
      'Tengah Kiri',
      'Center (Tengah)',
      'Tengah Kanan',
      'Sisi Kanan',
    ];

    return widthThickness.samples.map((val, idx) => {
      const actualVal = val !== null && !isNaN(val) ? Number(val.toFixed(3)) : null;
      const label = labels[idx] || `Titik ${idx + 1}`;
      const delta =
        actualVal !== null ? Number((actualVal - widthThickness.nominal).toFixed(3)) : null;
      const isInSpec =
        actualVal !== null
          ? actualVal >= widthThickness.lowerSpecLimit &&
            actualVal <= widthThickness.upperSpecLimit
          : true;

      return {
        point: label,
        shortPoint: label.replace(' (Tengah)', '').replace('Sisi ', ''),
        actual: actualVal,
        nominal: widthThickness.nominal,
        usl: widthThickness.upperSpecLimit,
        lsl: widthThickness.lowerSpecLimit,
        delta,
        isInSpec,
      };
    });
  }, [widthThickness]);

  // Chart data for Ketebalan Arah Panjang (Machine-Direction Profile)
  const lengthProfileData = useMemo(() => {
    if (!lengthThickness) return [];
    const labels = lengthThickness.sampleLabels || [
      '0m (Awal)',
      '50m',
      '100m (Tengah)',
      '150m',
      '200m (Akhir)',
    ];

    return lengthThickness.samples.map((val, idx) => {
      const actualVal = val !== null && !isNaN(val) ? Number(val.toFixed(3)) : null;
      const label = labels[idx] || `Titik ${idx + 1}`;
      const delta =
        actualVal !== null ? Number((actualVal - lengthThickness.nominal).toFixed(3)) : null;
      const isInSpec =
        actualVal !== null
          ? actualVal >= lengthThickness.lowerSpecLimit &&
            actualVal <= lengthThickness.upperSpecLimit
          : true;

      return {
        point: label,
        shortPoint: label.replace(' (Tengah)', '').replace(' (Awal)', '').replace(' (Akhir)', ''),
        actual: actualVal,
        nominal: lengthThickness.nominal,
        usl: lengthThickness.upperSpecLimit,
        lsl: lengthThickness.lowerSpecLimit,
        delta,
        isInSpec,
      };
    });
  }, [lengthThickness]);

  // Delta comparison data for bipolar bar chart
  const deviationData = useMemo(() => {
    const list: { name: string; type: string; delta: number; inSpec: boolean }[] = [];

    widthProfileData.forEach((item) => {
      if (item.delta !== null) {
        list.push({
          name: `Lebar: ${item.shortPoint}`,
          type: 'Arah Lebar',
          delta: item.delta,
          inSpec: item.isInSpec,
        });
      }
    });

    lengthProfileData.forEach((item) => {
      if (item.delta !== null) {
        list.push({
          name: `Pjg: ${item.shortPoint}`,
          type: 'Arah Panjang',
          delta: item.delta,
          inSpec: item.isInSpec,
        });
      }
    });

    return list;
  }, [widthProfileData, lengthProfileData]);

  // Y-axis bounds calculation for width thickness
  const widthYDomain = useMemo(() => {
    if (!widthThickness) return [0.45, 0.55];
    const vals = widthThickness.samples.filter((s): s is number => s !== null && !isNaN(s));
    const all = [
      ...vals,
      widthThickness.upperSpecLimit,
      widthThickness.lowerSpecLimit,
      widthThickness.nominal,
    ];
    const minVal = Math.min(...all);
    const maxVal = Math.max(...all);
    const pad = 0.015;
    return [Number((minVal - pad).toFixed(3)), Number((maxVal + pad).toFixed(3))];
  }, [widthThickness]);

  // Y-axis bounds calculation for length thickness
  const lengthYDomain = useMemo(() => {
    if (!lengthThickness) return [0.45, 0.55];
    const vals = lengthThickness.samples.filter((s): s is number => s !== null && !isNaN(s));
    const all = [
      ...vals,
      lengthThickness.upperSpecLimit,
      lengthThickness.lowerSpecLimit,
      lengthThickness.nominal,
    ];
    const minVal = Math.min(...all);
    const maxVal = Math.max(...all);
    const pad = 0.015;
    return [Number((minVal - pad).toFixed(3)), Number((maxVal + pad).toFixed(3))];
  }, [lengthThickness]);

  // Check if there are any samples measured
  const hasWidthSamples = widthThickness?.samples.some((s) => s !== null && !isNaN(s));
  const hasLengthSamples = lengthThickness?.samples.some((s) => s !== null && !isNaN(s));
  const hasAnySample = Boolean(hasWidthSamples || hasLengthSamples);

  // Status kelolosan rollsheet
  const isWidthInSpec = widthThickness?.isAllInSpec ?? true;
  const isLengthInSpec = lengthThickness?.isAllInSpec ?? true;
  const isSheetWidthInSpec = sheetWidthDim?.isAllInSpec ?? true;
  const isOverallPass = hasAnySample && isWidthInSpec && isLengthInSpec && isSheetWidthInSpec;

  return (
    <div id="section-extruder-graphs" className="space-y-5 mb-6">
      {/* Top Banner: Status & Target Release ke Proses 2 */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          !hasAnySample
            ? 'bg-slate-50 border-slate-200 text-slate-900'
            : isOverallPass
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white border-emerald-200 text-emerald-950'
            : 'bg-gradient-to-r from-rose-50 via-amber-50/30 to-white border-rose-200 text-rose-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                !hasAnySample
                  ? 'bg-slate-700 text-white'
                  : isOverallPass
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {!hasAnySample ? (
                <Sparkles className="w-6 h-6" />
              ) : isOverallPass ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/80 border border-slate-200/80">
                  {!hasAnySample
                    ? 'STATUS: MENUNGGU DATA'
                    : isOverallPass
                    ? 'STATUS: LOLOS SPESIFIKASI'
                    : 'STATUS: HOLD / PERLU PENYETELAN'}
                </span>
                <span className="text-xs font-medium text-slate-500 font-mono">
                  {reportNumber || '-'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                {!hasAnySample
                  ? 'Data Sampel Pengukuran Ketebalan Belum Diisi'
                  : isOverallPass
                  ? 'Roll Sheet Siap Digunakan di Proses 2'
                  : 'Penyimpangan Ketebalan Roll Sheet Terdeteksi'}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {!hasAnySample
                  ? 'Silakan isi data sampel ketebalan pada tabel di atas, atau klik preset Extruder untuk memuat contoh data.'
                  : isOverallPass
                  ? 'Pengukuran ketebalan arah lebar dan panjang dievaluasi menggunakan Micrometer. Seluruh titik pengukuran berada dalam rentang toleransi standar.'
                  : 'Pengukuran ketebalan arah lebar dan panjang dievaluasi menggunakan Micrometer. Terdapat titik ukur yang melampaui batas USL / LSL.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 text-xs font-medium">
            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2">
              <span className="text-slate-500">Gauge Band (Delta Tebal):</span>
              <strong className="font-mono text-slate-900">
                {widthThickness?.range !== null ? `±${(widthThickness.range / 2).toFixed(3)} mm` : '-'}
              </strong>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2">
              <span className="text-slate-500">Tujuan Produksi:</span>
              <span className="text-blue-700 font-semibold flex items-center gap-1">
                <span>Proses 2</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid 2 Utama: Grafik Ketebalan Arah Lebar & Arah Panjang */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* GRAFIK 1: KETEBALAN ARAH LEBAR (CROSS DIRECTION) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Grafik Profil Ketebalan Arah Lebar (Cross-Direction)
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                5 Titik Pengukuran Melintang Lembaran (Alat: Micrometer)
              </p>
            </div>
            <div className="text-right text-[11px]">
              <span className="text-slate-500">Nominal: </span>
              <strong className="font-mono text-slate-800">
                {widthThickness?.nominal.toFixed(3)} mm
              </strong>
              <span className="text-slate-400"> (±0.03 mm)</span>
            </div>
          </div>

          {/* Metric Summary Badges */}
          <div className="grid grid-cols-4 gap-2 mb-4 text-center">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-500 font-medium">Rata-rata</div>
              <div className="text-xs sm:text-sm font-bold font-mono text-slate-800">
                {widthThickness?.mean !== null ? `${widthThickness.mean.toFixed(3)}` : '-'}
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-500 font-medium">Min</div>
              <div className="text-xs sm:text-sm font-bold font-mono text-slate-800">
                {widthThickness?.min !== null ? `${widthThickness.min.toFixed(3)}` : '-'}
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-500 font-medium">Max</div>
              <div className="text-xs sm:text-sm font-bold font-mono text-slate-800">
                {widthThickness?.max !== null ? `${widthThickness.max.toFixed(3)}` : '-'}
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-500 font-medium">Range (Max-Min)</div>
              <div className="text-xs sm:text-sm font-bold font-mono text-blue-600">
                {widthThickness?.range !== null ? `${widthThickness.range.toFixed(3)}` : '-'}
              </div>
            </div>
          </div>

          {/* Recharts Chart Container */}
          <div className="h-64 sm:h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={widthProfileData}
                margin={{ top: 15, right: 20, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="shortPoint"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                  dy={8}
                />
                <YAxis
                  domain={widthYDomain}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => val.toFixed(3)}
                  width={52}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 min-w-[170px] border border-slate-800">
                          <div className="font-bold text-slate-200 border-b border-slate-700 pb-1">
                            {data.point}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Tebal Aktual:</span>
                            <span className="font-bold font-mono text-blue-300">
                              {data.actual !== null ? `${data.actual.toFixed(3)} mm` : '-'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Target Nominal:</span>
                            <span className="font-mono text-emerald-400">
                              {data.nominal.toFixed(3)} mm
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Deviasi (Δ):</span>
                            <span
                              className={`font-mono font-bold ${
                                data.delta && Math.abs(data.delta) > 0.02
                                  ? 'text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            >
                              {data.delta !== null
                                ? `${data.delta >= 0 ? '+' : ''}${data.delta.toFixed(3)} mm`
                                : '-'}
                            </span>
                          </div>
                          <div className="pt-1 text-[10px]">
                            {data.isInSpec ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Dalam Toleransi (OK)
                              </span>
                            ) : (
                              <span className="text-rose-400 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Di Luar Batas Toleransi!
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Reference Lines for Specifications */}
                {widthThickness && (
                  <>
                    <ReferenceLine
                      y={widthThickness.upperSpecLimit}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `USL ${widthThickness.upperSpecLimit.toFixed(3)}`,
                        fill: '#ef4444',
                        fontSize: 10,
                        position: 'top',
                      }}
                    />
                    <ReferenceLine
                      y={widthThickness.nominal}
                      stroke="#10b981"
                      strokeWidth={1.5}
                      label={{
                        value: `Nominal ${widthThickness.nominal.toFixed(3)}`,
                        fill: '#10b981',
                        fontSize: 10,
                        position: 'insideBottomRight',
                      }}
                    />
                    <ReferenceLine
                      y={widthThickness.lowerSpecLimit}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `LSL ${widthThickness.lowerSpecLimit.toFixed(3)}`,
                        fill: '#ef4444',
                        fontSize: 10,
                        position: 'bottom',
                      }}
                    />
                  </>
                )}

                {/* Shaded Area between curve and nominal */}
                <Area
                  type="monotone"
                  dataKey="actual"
                  fill="#3b82f6"
                  fillOpacity={0.12}
                  stroke="none"
                />

                {/* Actual Measurements Line */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const inSpec = payload.isInSpec;
                    return (
                      <circle
                        key={props.index}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={inSpec ? '#2563eb' : '#ef4444'}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ r: 7, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Titik Ukur Micrometer
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500" /> Target Nominal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-500 border-b border-dashed" /> Batas USL/LSL
            </span>
          </div>
        </div>

        {/* GRAFIK 2: KETEBALAN ARAH PANJANG (MACHINE DIRECTION) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Grafik Profil Ketebalan Arah Panjang (Machine-Direction)
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Stabilitas Ekstrusi Sepanjang Gulungan Roll (0m s/d 200m)
              </p>
            </div>
            <div className="text-right text-[11px]">
              <span className="text-slate-500">Nominal: </span>
              <strong className="font-mono text-slate-800">
                {lengthThickness?.nominal.toFixed(3) || '0.500'} mm
              </strong>
              <span className="text-slate-400"> (±0.03 mm)</span>
            </div>
          </div>

          {/* Metric Summary Badges */}
          <div className="grid grid-cols-4 gap-2 mb-4 text-center">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-500 font-medium">Rata-rata</div>
              <div className="text-xs sm:text-sm font-bold font-mono text-slate-800">
                {lengthThickness && lengthThickness.mean !== null ? `${lengthThickness.mean.toFixed(3)}` : '-'}
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-500 font-medium">Min</div>
              <div className="text-xs sm:text-sm font-bold font-mono text-slate-800">
                {lengthThickness && lengthThickness.min !== null ? `${lengthThickness.min.toFixed(3)}` : '-'}
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-500 font-medium">Max</div>
              <div className="text-xs sm:text-sm font-bold font-mono text-slate-800">
                {lengthThickness && lengthThickness.max !== null ? `${lengthThickness.max.toFixed(3)}` : '-'}
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-500 font-medium">Stabilitas (Range)</div>
              <div className="text-xs sm:text-sm font-bold font-mono text-indigo-600">
                {lengthThickness && lengthThickness.range !== null ? `${lengthThickness.range.toFixed(3)}` : '-'}
              </div>
            </div>
          </div>

          {/* Recharts Chart Container */}
          <div className="h-64 sm:h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={lengthProfileData}
                margin={{ top: 15, right: 20, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="shortPoint"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                  dy={8}
                />
                <YAxis
                  domain={lengthYDomain}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => val.toFixed(3)}
                  width={52}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 min-w-[170px] border border-slate-800">
                          <div className="font-bold text-slate-200 border-b border-slate-700 pb-1">
                            {data.point}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Tebal Aktual:</span>
                            <span className="font-bold font-mono text-indigo-300">
                              {data.actual !== null ? `${data.actual.toFixed(3)} mm` : '-'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Target Nominal:</span>
                            <span className="font-mono text-emerald-400">
                              {data.nominal.toFixed(3)} mm
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Deviasi (Δ):</span>
                            <span
                              className={`font-mono font-bold ${
                                data.delta && Math.abs(data.delta) > 0.02
                                  ? 'text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            >
                              {data.delta !== null
                                ? `${data.delta >= 0 ? '+' : ''}${data.delta.toFixed(3)} mm`
                                : '-'}
                            </span>
                          </div>
                          <div className="pt-1 text-[10px]">
                            {data.isInSpec ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Dalam Toleransi (OK)
                              </span>
                            ) : (
                              <span className="text-rose-400 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Di Luar Batas Toleransi!
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {lengthThickness && (
                  <>
                    <ReferenceLine
                      y={lengthThickness.upperSpecLimit}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `USL ${lengthThickness.upperSpecLimit.toFixed(3)}`,
                        fill: '#ef4444',
                        fontSize: 10,
                        position: 'top',
                      }}
                    />
                    <ReferenceLine
                      y={lengthThickness.nominal}
                      stroke="#10b981"
                      strokeWidth={1.5}
                      label={{
                        value: `Nominal ${lengthThickness.nominal.toFixed(3)}`,
                        fill: '#10b981',
                        fontSize: 10,
                        position: 'insideBottomRight',
                      }}
                    />
                    <ReferenceLine
                      y={lengthThickness.lowerSpecLimit}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `LSL ${lengthThickness.lowerSpecLimit.toFixed(3)}`,
                        fill: '#ef4444',
                        fontSize: 10,
                        position: 'bottom',
                      }}
                    />
                  </>
                )}

                <Area
                  type="monotone"
                  dataKey="actual"
                  fill="#6366f1"
                  fillOpacity={0.12}
                  stroke="none"
                />

                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const inSpec = payload.isInSpec;
                    return (
                      <circle
                        key={props.index}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={inSpec ? '#4f46e5' : '#ef4444'}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ r: 7, fill: '#4338ca', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Profil Panjang Roll
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500" /> Target Nominal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-500 border-b border-dashed" /> Batas USL/LSL
            </span>
          </div>
        </div>
      </div>

      {/* Grid 2 Bawah: Diagram Deviasi Batang & Visual Peta Kontur Rollsheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* GRAFIK 3: DIAGRAM SIMPANGAN DEVIASI KETEBALAN (DELTA TO NOMINAL) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Grafik Deviasi Simpangan Tebal (Δ = Aktual - Nominal)
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Perbandingan deviasi titik ukur Lebar dan Panjang dari target (mm)
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Toleransi: ±0.03 mm
            </span>
          </div>

          <div className="h-60 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={deviationData}
                margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => `${val >= 0 ? '+' : ''}${val.toFixed(3)}`}
                  domain={[-0.04, 0.04]}
                />
                <Tooltip
                  formatter={(val: any) => [
                    `${val >= 0 ? '+' : ''}${Number(val).toFixed(3)} mm`,
                    'Simpangan Deviasi',
                  ]}
                  labelFormatter={(name) => `Titik: ${name}`}
                />
                <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
                <ReferenceLine
                  y={0.03}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{ value: '+0.03 USL', fill: '#ef4444', fontSize: 9 }}
                />
                <ReferenceLine
                  y={-0.03}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{ value: '-0.03 LSL', fill: '#ef4444', fontSize: 9 }}
                />
                <Bar dataKey="delta" radius={[3, 3, 0, 0]}>
                  {deviationData.map((entry, index) => {
                    const isOk = Math.abs(entry.delta) <= 0.03;
                    const isVeryClose = Math.abs(entry.delta) <= 0.015;
                    const fillColor = !isOk
                      ? '#ef4444' // out of spec
                      : isVeryClose
                      ? '#10b981' // excellent
                      : '#f59e0b'; // warning edge
                    return <Cell key={`cell-${index}`} fill={fillColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Presisi Tinggi (Δ ≤ 0.015mm)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Mendekati Batas (0.015mm - 0.03mm)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Out-of-Spec (&gt; 0.03mm)
            </span>
          </div>
        </div>

        {/* GRAFIK 4: PETA KONTUR VISUAL ROLLSHEET 2D (HEATMAP MATRIX) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Peta Visual Kontur Keseragaman Roll Sheet
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Feed ke Proses 2
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Representasi visual persebaran ketebalan melintang & memanjang pada lembaran rollsheet:
            </p>

            {/* Visual Sheet Simulation Grid */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-white font-mono text-xs">
              <div className="flex items-center justify-between text-[10px] text-slate-400 pb-2 border-b border-slate-800 mb-2">
                <span>← Arah Lebar Sheet (650mm) →</span>
                <span>Arah Tarikan Extruder ↓</span>
              </div>

              {/* 5 Column Header */}
              <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] text-slate-400 mb-1.5">
                <div>Kiri</div>
                <div>Tg.Kiri</div>
                <div className="text-emerald-400 font-bold">Center</div>
                <div>Tg.Kanan</div>
                <div>Kanan</div>
              </div>

              {/* Matrix of Simulated Uniformity Cells */}
              <div className="space-y-1.5">
                {[
                  { pos: 'Awal (0m)', factor: 1.0 },
                  { pos: 'Posisi 50m', factor: 1.002 },
                  { pos: 'Posisi 100m', factor: 0.998 },
                  { pos: 'Posisi 150m', factor: 0.999 },
                  { pos: 'Akhir (200m)', factor: 1.001 },
                ].map((row, rIdx) => (
                  <div key={rIdx} className="grid grid-cols-5 gap-1.5">
                    {widthProfileData.map((col, cIdx) => {
                      const base = col.actual !== null ? col.actual : 0.5;
                      const cellVal = Number((base * row.factor).toFixed(3));
                      const isOk = cellVal >= 0.47 && cellVal <= 0.53;
                      const isClose = Math.abs(cellVal - 0.5) <= 0.015;

                      return (
                        <div
                          key={cIdx}
                          title={`${row.pos} - ${col.point}: ${cellVal.toFixed(3)} mm`}
                          className={`p-1.5 text-center rounded text-[11px] font-bold transition-all ${
                            !isOk
                              ? 'bg-rose-500/80 text-white border border-rose-400 animate-pulse'
                              : isClose
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {cellVal.toFixed(3)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span>Lebar: {sheetWidthDim?.samples[0] || '650.0'} mm</span>
                <span>Panjang Roll: 200 Meter</span>
                <span className="text-emerald-400 font-semibold">Tebal Rata2: {widthThickness?.mean || 0.5} mm</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-blue-900 leading-relaxed">
              <strong>Kesesuaian untuk Proses 2:</strong> Toleransi ketebalan rollsheet sangat menentukan kestabilan proses lanjutan agar tidak terjadi <em>bottom thinning</em> atau <em>webbing</em>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
