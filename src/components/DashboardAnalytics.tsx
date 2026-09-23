import React, { useMemo } from 'react';
import { DimensionSampleRow, ProductionSummary } from '../types/qc';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface Props {
  dimensions: DimensionSampleRow[];
  production: ProductionSummary;
  partName?: string;
  reportNumber?: string;
}

export const DashboardAnalytics: React.FC<Props> = ({
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
          (d.parameterName.toLowerCase().includes('lebar') && d.parameterName.toLowerCase().includes('tebal'))
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
          (d.parameterName.toLowerCase().includes('panjang') && d.parameterName.toLowerCase().includes('tebal'))
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

  // Combined Profile Chart Data for Width & Length
  const combinedProfileData = useMemo(() => {
    const widthLabels = widthThickness?.sampleLabels || ['Kiri', 'Tg. Kiri', 'Center', 'Tg. Kanan', 'Kanan'];
    const lengthLabels = lengthThickness?.sampleLabels || ['0m', '50m', '100m', '150m', '200m'];

    return [0, 1, 2, 3, 4].map((idx) => {
      const wVal = widthThickness?.samples[idx] ?? null;
      const lVal = lengthThickness?.samples[idx] ?? null;
      const wPoint = widthLabels[idx] || `W${idx + 1}`;
      const lPoint = lengthLabels[idx] || `L${idx + 1}`;

      return {
        pointIdx: idx + 1,
        widthLabel: wPoint.replace('Sisi ', '').replace(' (Tengah)', ''),
        lengthLabel: lPoint.replace(' (Awal)', '').replace(' (Akhir)', ''),
        widthThickness: wVal !== null && !isNaN(wVal) ? Number(wVal.toFixed(3)) : null,
        lengthThickness: lVal !== null && !isNaN(lVal) ? Number(lVal.toFixed(3)) : null,
        nominal: widthThickness?.nominal ?? 0.5,
        usl: widthThickness?.upperSpecLimit ?? 0.53,
        lsl: widthThickness?.lowerSpecLimit ?? 0.47,
      };
    });
  }, [widthThickness, lengthThickness]);

  // Delta deviation data for bipolar bar chart
  const deviationData = useMemo(() => {
    const items: { name: string; delta: number; isOk: boolean; category: string }[] = [];
    const nom = widthThickness?.nominal ?? 0.5;

    if (widthThickness) {
      const wLabels = widthThickness.sampleLabels || ['Kiri', 'Tg.Kiri', 'Center', 'Tg.Kanan', 'Kanan'];
      widthThickness.samples.forEach((val, idx) => {
        if (val !== null && !isNaN(val)) {
          const delta = Number((val - nom).toFixed(3));
          items.push({
            name: `Lebar: ${wLabels[idx] || `W${idx + 1}`}`,
            delta,
            isOk: Math.abs(delta) <= 0.03,
            category: 'Arah Lebar',
          });
        }
      });
    }

    if (lengthThickness) {
      const lLabels = lengthThickness.sampleLabels || ['0m', '50m', '100m', '150m', '200m'];
      lengthThickness.samples.forEach((val, idx) => {
        if (val !== null && !isNaN(val)) {
          const delta = Number((val - nom).toFixed(3));
          items.push({
            name: `Pjg: ${lLabels[idx] || `L${idx + 1}`}`,
            delta,
            isOk: Math.abs(delta) <= 0.03,
            category: 'Arah Panjang',
          });
        }
      });
    }

    return items;
  }, [widthThickness, lengthThickness]);

  // Production Roll Breakdown Pie Chart Data
  const productionPieData = useMemo(() => {
    return [
      { name: 'Roll Lolos (Siap Proses 2)', value: production.totalOk, color: '#10b981' },
      { name: 'Roll Hold (Reject Dimensi)', value: production.totalNg, color: '#f43f5e' },
      { name: 'Roll Rework (Re-trimming)', value: production.totalRework, color: '#f59e0b' },
    ].filter((item) => item.value > 0);
  }, [production]);

  const totalProduced = production.totalOk + production.totalNg + production.totalRework;
  const yieldPct = totalProduced > 0 ? ((production.totalOk / totalProduced) * 100).toFixed(1) : '100.0';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 md:p-6 mb-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Laporan Analisis Grafik Ketebalan Roll Sheet (Extruder SPC)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluasi komparasi profil ketebalan arah lebar vs panjang dan verifikasi kesiapan rollsheet untuk Proses 2 (Mesin Kiefel)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200">
            Nominal: {widthThickness?.nominal.toFixed(3) || '0.500'} mm (±0.03 mm)
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Yield: {yieldPct}%</span>
          </span>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-medium text-slate-500 block">Tebal Rata-rata (x̄ Lebar)</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1">
            {widthThickness?.mean !== null ? `${widthThickness.mean.toFixed(3)} mm` : '-'}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
            Target: {widthThickness?.nominal.toFixed(3)} mm
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-medium text-slate-500 block">Gauge Band (Delta Tebal)</span>
          <div className="text-lg font-bold font-mono text-blue-600 mt-1">
            {widthThickness?.range !== null ? `±${(widthThickness.range / 2).toFixed(3)} mm` : '-'}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Batas Maks: ±0.030 mm
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-medium text-slate-500 block">Stabilitas Panjang (Roll Run)</span>
          <div className="text-lg font-bold font-mono text-indigo-600 mt-1">
            {lengthThickness && lengthThickness.range !== null ? `${lengthThickness.range.toFixed(3)} mm` : '-'}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Deviasi 0m s/d 200m
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-medium text-slate-500 block">Output Siap Transfer</span>
          <div className="text-lg font-bold font-mono text-emerald-600 mt-1">
            {production.totalOk} <span className="text-xs text-slate-500">/ {totalProduced} Roll</span>
          </div>
          <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block flex items-center gap-1">
            <span>Ke Mesin Kiefel</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Komparasi Kurva Profil Arah Lebar vs Arah Panjang */}
        <div className="bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-600" />
                Grafik Komparasi Profil Ketebalan (Lebar vs Panjang)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kurva biru: Ketebalan arah Lebar · Kurva ungu: Ketebalan arah Panjang (Alat: Micrometer)
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={combinedProfileData}
                margin={{ top: 15, right: 20, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="widthLabel"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  dy={6}
                />
                <YAxis
                  domain={[0.46, 0.54]}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => val.toFixed(3)}
                  width={50}
                />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toFixed(3)} mm`, 'Tebal']}
                  labelFormatter={(lbl) => `Posisi Ukur: ${lbl}`}
                />
                <ReferenceLine
                  y={widthThickness?.upperSpecLimit ?? 0.53}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: 'USL 0.530', fill: '#ef4444', fontSize: 9 }}
                />
                <ReferenceLine
                  y={widthThickness?.nominal ?? 0.5}
                  stroke="#10b981"
                  strokeWidth={1.5}
                  label={{ value: 'Nominal 0.500', fill: '#10b981', fontSize: 9 }}
                />
                <ReferenceLine
                  y={widthThickness?.lowerSpecLimit ?? 0.47}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: 'LSL 0.470', fill: '#ef4444', fontSize: 9 }}
                />

                <Line
                  type="monotone"
                  dataKey="widthThickness"
                  name="Ketebalan Arah Lebar"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="lengthThickness"
                  name="Ketebalan Arah Panjang"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-5 text-[11px] text-slate-500 pt-2 border-t border-slate-200">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-blue-600 rounded" /> Arah Lebar (Cross Direction)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-purple-500 rounded border-dashed border-b" /> Arah Panjang (Machine Direction)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500" /> Target Nominal
            </span>
          </div>
        </div>

        {/* CHART 2: Grafik Simpangan Deviasi Seluruh Titik */}
        <div className="bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Grafik Simpangan Deviasi Titik Ukur (Δ to Nominal)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Deviasi aktual dari target nominal 0.500 mm (Batas: ±0.030 mm)
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={deviationData}
                margin={{ top: 15, right: 15, left: -10, bottom: 35 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={45}
                />
                <YAxis
                  domain={[-0.035, 0.035]}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => `${val >= 0 ? '+' : ''}${val.toFixed(3)}`}
                />
                <Tooltip
                  formatter={(val: any) => [
                    `${val >= 0 ? '+' : ''}${Number(val).toFixed(3)} mm`,
                    'Simpangan Deviasi',
                  ]}
                />
                <ReferenceLine y={0} stroke="#475569" />
                <ReferenceLine y={0.03} stroke="#ef4444" strokeDasharray="3 3" />
                <ReferenceLine y={-0.03} stroke="#ef4444" strokeDasharray="3 3" />

                <Bar dataKey="delta" radius={[3, 3, 0, 0]}>
                  {deviationData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isOk ? '#10b981' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-200">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Deviasi Dalam Toleransi (OK)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Di Luar Batas Toleransi (OOS)
            </span>
          </div>
        </div>
      </div>

      {/* Distribution & Process 2 Feed Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Pie Chart: Status Roll Output */}
        <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Distribusi Output Roll Produksi
          </h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productionPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {productionPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val} Roll`, 'Kuantitas']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 text-xs pt-2 border-t border-slate-200">
            {productionPieData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}:
                </span>
                <strong className="font-mono text-slate-900">{item.value} Roll</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Process 2 Requirement Guidance Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-blue-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Spesifikasi Roll Sheet untuk Proses 2 (Mesin Kiefel)
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Thermoforming Feed
              </span>
            </div>

            <p className="text-xs text-blue-100 leading-relaxed mb-4">
              Roll sheet yang diproduksi mesin Extruder ini akan di-loading langsung ke stasiun uncoiler mesin Kiefel untuk pembentukan produk (thermoforming).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-blue-300 text-[11px]">Keseragaman Tebal</div>
                <div className="font-bold text-white mt-1">±0.030 mm (Micrometer)</div>
                <div className="text-[10px] text-blue-200 mt-0.5">Mencegah bottom thinning</div>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-blue-300 text-[11px]">Lebar Roll Sheet</div>
                <div className="font-bold text-white mt-1">650 mm (Meteran Gulung)</div>
                <div className="text-[10px] text-blue-200 mt-0.5">Sesuai rel rantai transport Kiefel</div>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-blue-300 text-[11px]">Tegangan Gulungan</div>
                <div className="font-bold text-white mt-1">Rata Tanpa Gelombang</div>
                <div className="text-[10px] text-blue-200 mt-0.5">Mencegah kerutan sudut (webbing)</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-blue-800/80 flex items-center justify-between text-xs text-blue-200">
            <span>Nomor SPK: <strong className="text-white font-mono">{dimensions[0]?.id ? 'Tersinkron' : '-'}</strong></span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Siap Lolos ke Proses 2 Kiefel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
