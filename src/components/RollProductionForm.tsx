import React from 'react';
import { ProductionSummary } from '../types/qc';
import { CheckCircle2, XCircle, AlertTriangle, Layers, ArrowRight, Scale, RotateCcw } from 'lucide-react';

interface Props {
  production: ProductionSummary;
  totalRollWeightKg?: number;
  onChange: (updated: Partial<ProductionSummary>) => void;
}

export const RollProductionForm: React.FC<Props> = ({
  production,
  totalRollWeightKg = 120,
  onChange,
}) => {
  const handleOkChange = (val: number) => {
    onChange({ totalOk: Math.max(0, val) });
  };

  const handleNgChange = (val: number) => {
    onChange({ totalNg: Math.max(0, val) });
  };

  const handleReworkChange = (val: number) => {
    onChange({ totalRework: Math.max(0, val) });
  };

  const totalProduced = production.totalOk + production.totalNg + production.totalRework;
  const yieldPct = totalProduced > 0 ? ((production.totalOk / totalProduced) * 100).toFixed(1) : '100.0';

  return (
    <div id="section-roll-production" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Catatan Hasil Produksi (Extruder)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencatatan kuantitas roll hasil ekstrusi sebelum ditransfer ke Proses 2
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Yield Lolos: {yieldPct}%
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <span>Transfer ke Proses 2</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Production Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Roll Lolos / OK */}
        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Roll Lolos (OK)
            </span>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-full">
              Siap Proses 2
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={production.totalOk === 0 ? '' : production.totalOk}
              placeholder="0"
              onChange={(e) => handleOkChange(parseInt(e.target.value, 10) || 0)}
              className="w-full text-2xl font-black font-mono text-emerald-950 bg-white border border-emerald-300 rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-300 placeholder:opacity-50"
            />
            <span className="text-xs font-bold text-emerald-800">Roll</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <button
              type="button"
              onClick={() => handleOkChange(production.totalOk - 1)}
              className="w-8 h-8 rounded-lg bg-white border border-emerald-200 text-slate-700 font-bold hover:bg-emerald-100 transition-colors text-sm"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => handleOkChange(production.totalOk + 1)}
              className="w-8 h-8 rounded-lg bg-white border border-emerald-200 text-slate-700 font-bold hover:bg-emerald-100 transition-colors text-sm"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => handleOkChange(production.totalOk + 5)}
              className="px-2 h-8 rounded-lg bg-white border border-emerald-200 text-slate-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
            >
              +5
            </button>
          </div>
        </div>

        {/* Roll Hold / Reject */}
        <div className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              Roll Hold (Reject)
            </span>
            <span className="text-[11px] font-medium text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-full">
              Dimensi Out
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={production.totalNg === 0 ? '' : production.totalNg}
              placeholder="0"
              onChange={(e) => handleNgChange(parseInt(e.target.value, 10) || 0)}
              className="w-full text-2xl font-black font-mono text-rose-950 bg-white border border-rose-300 rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder:text-slate-300 placeholder:opacity-50"
            />
            <span className="text-xs font-bold text-rose-800">Roll</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <button
              type="button"
              onClick={() => handleNgChange(production.totalNg - 1)}
              className="w-8 h-8 rounded-lg bg-white border border-rose-200 text-slate-700 font-bold hover:bg-rose-100 transition-colors text-sm"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => handleNgChange(production.totalNg + 1)}
              className="w-8 h-8 rounded-lg bg-white border border-rose-200 text-slate-700 font-bold hover:bg-rose-100 transition-colors text-sm"
            >
              +
            </button>
          </div>
        </div>

        {/* Roll Rework (Re-trimming) */}
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              Roll Rework
            </span>
            <span className="text-[11px] font-medium text-amber-600 bg-amber-100/60 px-2 py-0.5 rounded-full">
              Re-trim Tepi
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={production.totalRework === 0 ? '' : production.totalRework}
              placeholder="0"
              onChange={(e) => handleReworkChange(parseInt(e.target.value, 10) || 0)}
              className="w-full text-2xl font-black font-mono text-amber-950 bg-white border border-amber-300 rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-300 placeholder:opacity-50"
            />
            <span className="text-xs font-bold text-amber-800">Roll</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <button
              type="button"
              onClick={() => handleReworkChange(production.totalRework - 1)}
              className="w-8 h-8 rounded-lg bg-white border border-amber-200 text-slate-700 font-bold hover:bg-amber-100 transition-colors text-sm"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => handleReworkChange(production.totalRework + 1)}
              className="w-8 h-8 rounded-lg bg-white border border-amber-200 text-slate-700 font-bold hover:bg-amber-100 transition-colors text-sm"
            >
              +
            </button>
          </div>
        </div>

        {/* Total Roll & Estimasi Berat */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-slate-500" />
              Total Roll Diproduksi
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Extruder Line
            </span>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-slate-900 text-center py-2 bg-white rounded-xl border border-slate-200">
              {totalProduced} <span className="text-xs font-bold text-slate-500">Roll</span>
            </div>
            <div className="text-[11px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1">
              <span>Estimasi Berat:</span>
              <strong className="font-mono text-slate-800">
                {(totalProduced * totalRollWeightKg).toLocaleString()} kg
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
