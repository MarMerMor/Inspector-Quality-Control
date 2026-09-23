import React from 'react';
import { DefectItem, ProcessType, ProductionSummary } from '../types/qc';
import {
  AlertOctagon,
  CheckCircle,
  HelpCircle,
  Plus,
  Minus,
  CheckCheck,
  TrendingDown,
  RotateCcw,
  Sliders,
} from 'lucide-react';

interface Props {
  defects: DefectItem[];
  production: ProductionSummary;
  totalCavities: number;
  processType?: ProcessType;
  onDefectsChange: (updated: DefectItem[]) => void;
  onProductionChange: (partial: Partial<ProductionSummary>) => void;
}

export const DefectChecklistForm: React.FC<Props> = ({
  defects,
  production,
  totalCavities,
  processType = 'EXTRUDER',
  onDefectsChange,
  onProductionChange,
}) => {
  // Update single defect count
  const handleDefectCountChange = (id: string, delta: number) => {
    const updated = defects.map((d) => {
      if (d.id === id) {
        const newCount = Math.max(0, d.count + delta);
        return { ...d, count: newCount };
      }
      return d;
    });
    onDefectsChange(updated);
  };

  const handleDefectDirectCount = (id: string, count: number) => {
    const validCount = Math.max(0, count);
    const updated = defects.map((d) => (d.id === id ? { ...d, count: validCount } : d));
    onDefectsChange(updated);
  };

  // Toggle cavity tag in defect
  const toggleCavityInDefect = (defectId: string, cavityNum: number) => {
    const updated = defects.map((d) => {
      if (d.id === defectId) {
        const current = d.affectedCavities || [];
        const exists = current.includes(cavityNum);
        const next = exists ? current.filter((c) => c !== cavityNum) : [...current, cavityNum].sort((a, b) => a - b);
        return { ...d, affectedCavities: next };
      }
      return d;
    });
    onDefectsChange(updated);
  };

  const getStatusDisplay = () => {
    switch (production.status) {
      case 'PASS':
        return {
          title: 'LOT LULUS (PASS)',
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
          badge: 'bg-emerald-600 text-white',
          icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
        };
      case 'CONDITIONAL_PASS':
        return {
          title: 'LULUS BERSYARAT (CONDITIONAL)',
          bg: 'bg-amber-50 border-amber-300 text-amber-900',
          badge: 'bg-amber-600 text-white',
          icon: <AlertOctagon className="w-5 h-5 text-amber-600" />,
        };
      case 'REJECT':
      default:
        return {
          title: 'LOT DITOLAK (REJECT)',
          bg: 'bg-rose-50 border-rose-300 text-rose-900',
          badge: 'bg-rose-600 text-white',
          icon: <AlertOctagon className="w-5 h-5 text-rose-600" />,
        };
    }
  };

  const statusStyle = getStatusDisplay();

  return (
    <div id="section-defects" className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
      {/* Header and Live Status Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 mb-5 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <CheckCheck className="w-5 h-5 text-blue-600" />
            Checklist Defect & Kalkulasi Otomatis Hasil Produksi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Input cepat tablet-friendly dengan stepper tombol +1/+5 dan penghitungan otomatis Rejection Rate (%)
          </p>
        </div>

        {/* Big Automated Decision Banner */}
        <div
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${statusStyle.bg} transition-all`}
        >
          {statusStyle.icon}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Status Keputusan QC
            </div>
            <div className="text-sm font-extrabold tracking-tight">
              {statusStyle.title}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards: Total OK, Total NG, Total Rework, Total Produksi, Rejection Rate */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5 mb-6">
        {/* Total OK */}
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Total OK (Good)</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-2">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              pattern="[0-9]*"
              value={production.totalOk}
              onChange={(e) =>
                onProductionChange({ totalOk: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full text-2xl font-black font-mono text-emerald-950 bg-transparent border-b border-emerald-300 focus:outline-none focus:border-emerald-600 py-1"
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onProductionChange({ totalOk: Math.max(0, production.totalOk - 10) })}
              className="px-2.5 py-1.5 min-h-[36px] text-xs font-bold bg-white text-emerald-800 border border-emerald-200 rounded-lg hover:bg-emerald-100 active:scale-95"
            >
              -10
            </button>
            <button
              type="button"
              onClick={() => onProductionChange({ totalOk: production.totalOk + 50 })}
              className="flex-1 py-1.5 min-h-[36px] text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:scale-95 text-center"
            >
              +50
            </button>
            <button
              type="button"
              onClick={() => onProductionChange({ totalOk: production.totalOk + 100 })}
              className="flex-1 py-1.5 min-h-[36px] text-xs font-bold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 active:scale-95 text-center"
            >
              +100
            </button>
          </div>
        </div>

        {/* Total NG (Reject) */}
        <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800">Total NG (Reject)</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-black font-mono text-rose-950 block">
              {production.totalNg} <span className="text-xs font-normal text-rose-700">pcs</span>
            </span>
          </div>
          <div className="text-[11px] text-rose-700 font-medium">
            Akumulasi dari {defects.filter((d) => d.count > 0).length} tipe cacat
          </div>
        </div>

        {/* Total Rework */}
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Total Rework</span>
            <RotateCcw className="w-4 h-4 text-amber-600" />
          </div>
          <div className="my-2">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              pattern="[0-9]*"
              value={production.totalRework}
              onChange={(e) =>
                onProductionChange({ totalRework: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full text-2xl font-black font-mono text-amber-950 bg-transparent border-b border-amber-300 focus:outline-none focus:border-amber-600 py-1"
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                onProductionChange({
                  totalRework: Math.max(0, production.totalRework - 1),
                })
              }
              className="px-2.5 py-1.5 min-h-[36px] text-xs font-bold bg-white text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-100 active:scale-95"
            >
              -1
            </button>
            <button
              type="button"
              onClick={() => onProductionChange({ totalRework: production.totalRework + 1 })}
              className="flex-1 py-1.5 min-h-[36px] text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 active:scale-95 text-center"
            >
              +1
            </button>
            <button
              type="button"
              onClick={() => onProductionChange({ totalRework: production.totalRework + 5 })}
              className="flex-1 py-1.5 min-h-[36px] text-xs font-bold bg-amber-700 text-white rounded-lg hover:bg-amber-800 active:scale-95 text-center"
            >
              +5
            </button>
          </div>
        </div>

        {/* Total Produksi */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Total Produksi</span>
            <Sliders className="w-4 h-4 text-slate-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black font-mono text-slate-900">
              {production.totalProduced.toLocaleString('id-ID')}
              <span className="text-xs font-normal text-slate-500 ml-1">pcs</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            Formula: OK + NG + Rework
          </div>
        </div>

        {/* Rejection Rate % */}
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">Rejection Rate (%)</span>
            <TrendingDown className="w-4 h-4 text-blue-600" />
          </div>
          <div className="my-2">
            <div
              className={`text-2xl font-black font-mono ${
                production.rejectionRatePct >= production.rejectionThresholdFail
                  ? 'text-rose-600'
                  : production.rejectionRatePct >= production.rejectionThresholdWarn
                  ? 'text-amber-600'
                  : 'text-emerald-700'
              }`}
            >
              {production.rejectionRatePct}%
            </div>
          </div>

          {/* Progress bar threshold */}
          <div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${Math.min(100, (production.rejectionRatePct / 5) * 100)}%`,
                }}
                className={`h-full transition-all ${
                  production.rejectionRatePct >= production.rejectionThresholdFail
                    ? 'bg-rose-600'
                    : production.rejectionRatePct >= production.rejectionThresholdWarn
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>Target &lt;{production.rejectionThresholdWarn}%</span>
              <span>Batas {production.rejectionThresholdFail}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Threshold Configuration Strip */}
      <div className="mb-6 flex flex-wrap items-center justify-between p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs gap-3">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="font-bold">Batas Kritis QC:</span>
          <span className="text-slate-500 text-[11px] sm:text-xs">
            Warning &le; {production.rejectionThresholdWarn}% · Tolak &gt;{' '}
            {production.rejectionThresholdFail}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-slate-600">
            <span>Peringatan:</span>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={production.rejectionThresholdWarn}
              onChange={(e) =>
                onProductionChange({
                  rejectionThresholdWarn: parseFloat(e.target.value) || 1.5,
                })
              }
              className="w-14 px-1.5 py-1 min-h-[34px] bg-white border border-slate-200 rounded-lg text-center font-mono font-bold"
            />
            <span>%</span>
          </label>
          <label className="flex items-center gap-1.5 text-slate-600">
            <span>Tolak:</span>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={production.rejectionThresholdFail}
              onChange={(e) =>
                onProductionChange({
                  rejectionThresholdFail: parseFloat(e.target.value) || 3.5,
                })
              }
              className="w-14 px-1.5 py-1 min-h-[34px] bg-white border border-slate-200 rounded-lg text-center font-mono font-bold"
            />
            <span>%</span>
          </label>
        </div>
      </div>

      {/* Defect Items Grid */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Katalog Cacat Produksi (Checklist per Tipe Defect)
          </h3>
          <span className="text-xs text-slate-500">
            Total {defects.length} kriteria cacat
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {defects.map((defect) => {
            const hasDefect = defect.count > 0;
            return (
              <div
                key={defect.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                  hasDefect
                    ? 'bg-rose-50/40 border-rose-300 shadow-2xs ring-1 ring-rose-200/50'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 mb-2.5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-slate-900">
                        {defect.name}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          defect.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : defect.severity === 'MAJOR'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {defect.severity}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-600 mt-0.5">
                      {defect.indonesianName}
                    </div>
                  </div>

                  {/* Smartphone-friendly Stepper Controls with larger touch targets */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      disabled={defect.count === 0}
                      onClick={() => handleDefectCountChange(defect.id, -1)}
                      className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-transform font-bold"
                      title="Kurang 1"
                    >
                      <Minus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>

                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={defect.count}
                      onChange={(e) =>
                        handleDefectDirectCount(defect.id, parseInt(e.target.value, 10) || 0)
                      }
                      className="w-14 h-10 sm:w-12 sm:h-8 text-center font-mono font-black text-base sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />

                    <button
                      type="button"
                      onClick={() => handleDefectCountChange(defect.id, 1)}
                      className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-90 transition-transform font-bold"
                      title="Tambah 1"
                    >
                      <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDefectCountChange(defect.id, 5)}
                      className="min-w-[42px] px-2.5 h-10 sm:h-8 flex items-center justify-center rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-xs active:scale-90 transition-transform shadow-2xs"
                      title="Tambah 5"
                    >
                      +5
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 sm:line-clamp-1 mb-2.5">
                  {defect.description}
                </p>

                {/* Cavity or Zone tag selectors with touch padding */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-semibold mr-1">
                    {processType === 'EXTRUDER' ? 'Zona Sheet:' : 'Cavity Kiefel:'}
                  </span>
                  {Array.from({ length: totalCavities }, (_, i) => i + 1).map((cavNum) => {
                    const isSelected = defect.affectedCavities?.includes(cavNum);
                    return (
                      <button
                        key={cavNum}
                        type="button"
                        onClick={() => toggleCavityInDefect(defect.id, cavNum)}
                        className={`min-h-[32px] min-w-[34px] text-xs font-mono font-bold px-2 py-1 rounded-lg border transition-all active:scale-90 ${
                          isSelected
                            ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {processType === 'EXTRUDER' ? `Z${cavNum}` : `C${cavNum}`}
                      </button>
                    );
                  })}
                  {(!defect.affectedCavities || defect.affectedCavities.length === 0) && (
                    <span className="text-[11px] text-slate-400 italic">Umum / Semua</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
