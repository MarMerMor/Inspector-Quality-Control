import React from 'react';
import { ProductionSummary, ProductionDestination } from '../types/qc';
import { CheckCircle2, XCircle, AlertTriangle, Layers, ArrowRight, RotateCcw, MapPin, Building2 } from 'lucide-react';
import { CleanNumberInput } from './common/CleanNumberInput';

interface Props {
  production: ProductionSummary;
  totalRollWeightKg?: number;
  destinationPlant?: ProductionDestination;
  onDestinationChange?: (destination: ProductionDestination) => void;
  onChange: (updated: Partial<ProductionSummary>) => void;
}

export const RollProductionForm: React.FC<Props> = ({
  production,
  totalRollWeightKg = 120,
  destinationPlant = 'PROSES_2_JATI',
  onDestinationChange,
  onChange,
}) => {
  const handleOkChange = (val: number) => {
    const safe = Math.max(0, isNaN(val) ? 0 : val);
    onChange({ totalOk: safe });
  };

  const handleNgChange = (val: number) => {
    const safe = Math.max(0, isNaN(val) ? 0 : val);
    onChange({ totalNg: safe });
  };

  const handleReworkChange = (val: number) => {
    const safe = Math.max(0, isNaN(val) ? 0 : val);
    onChange({ totalRework: safe });
  };

  const handleDestinationSelect = (dest: ProductionDestination) => {
    onChange({ destinationPlant: dest });
    if (onDestinationChange) {
      onDestinationChange(dest);
    }
  };

  const currentDest: ProductionDestination =
    production.destinationPlant || destinationPlant || 'PROSES_2_JATI';

  const currentOk = typeof production.totalOk === 'number' && !isNaN(production.totalOk) ? production.totalOk : 0;
  const currentNg = typeof production.totalNg === 'number' && !isNaN(production.totalNg) ? production.totalNg : 0;
  const currentRework = typeof production.totalRework === 'number' && !isNaN(production.totalRework) ? production.totalRework : 0;

  const totalProduced = currentOk + currentNg + currentRework;
  const yieldPct = totalProduced > 0 ? ((currentOk / totalProduced) * 100).toFixed(1) : '100.0';

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
                Pencatatan Output Roll Extruder
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kuantitas roll sheet hasil ekstrusi PT Camiloplas Jaya Makmur
              </p>
            </div>
          </div>
        </div>

        {/* Plant destination & Yield indicator */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Yield Lolos: {yieldPct}%
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <span className="text-[11px] text-slate-500 font-semibold px-1.5 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Tujuan:
            </span>
            <button
              type="button"
              onClick={() => handleDestinationSelect('PROSES_2_JATI')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                currentDest === 'PROSES_2_JATI'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Proses 2 Jati
            </button>
            <button
              type="button"
              onClick={() => handleDestinationSelect('PROSES_2_BOLANG')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                currentDest === 'PROSES_2_BOLANG'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Proses 2 Bolang
            </button>
          </div>
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
              Siap {currentDest === 'PROSES_2_JATI' ? 'Pabrik Jati' : 'Pabrik Bolang'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CleanNumberInput
              value={production.totalOk}
              onChangeValue={handleOkChange}
              allowDecimals={false}
              min={0}
              placeholder="0"
              className="w-full text-2xl font-black font-mono text-emerald-950 bg-white border border-emerald-300 rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-300"
            />
            <span className="text-xs font-bold text-emerald-800">Roll</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOkChange(Math.max(0, currentOk - 1));
              }}
              className="w-8 h-8 rounded-lg bg-white border border-emerald-200 text-slate-700 font-bold hover:bg-emerald-100 transition-colors text-sm cursor-pointer active:scale-95"
            >
              -1
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOkChange(currentOk + 1);
              }}
              className="w-8 h-8 rounded-lg bg-white border border-emerald-200 text-slate-700 font-bold hover:bg-emerald-100 transition-colors text-sm cursor-pointer active:scale-95"
            >
              +1
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOkChange(currentOk + 5);
              }}
              className="px-2.5 h-8 rounded-lg bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 transition-colors cursor-pointer active:scale-95 shadow-2xs"
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
            <CleanNumberInput
              value={production.totalNg}
              onChangeValue={handleNgChange}
              allowDecimals={false}
              min={0}
              placeholder="0"
              className="w-full text-2xl font-black font-mono text-rose-950 bg-white border border-rose-300 rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder:text-slate-300"
            />
            <span className="text-xs font-bold text-rose-800">Roll</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNgChange(Math.max(0, currentNg - 1));
              }}
              className="w-8 h-8 rounded-lg bg-white border border-rose-200 text-slate-700 font-bold hover:bg-rose-100 transition-colors text-sm cursor-pointer active:scale-95"
              title="Kurang 1 Roll Hold"
            >
              -1
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNgChange(currentNg + 1);
              }}
              className="w-8 h-8 rounded-lg bg-white border border-rose-200 text-slate-700 font-bold hover:bg-rose-100 transition-colors text-sm cursor-pointer active:scale-95"
              title="Tambah 1 Roll Hold"
            >
              +1
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNgChange(currentNg + 5);
              }}
              className="px-2.5 h-8 rounded-lg bg-rose-600 text-white text-xs font-extrabold hover:bg-rose-700 transition-colors cursor-pointer active:scale-95 shadow-2xs"
              title="Tambah 5 Roll Hold"
            >
              +5
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
            <CleanNumberInput
              value={production.totalRework}
              onChangeValue={handleReworkChange}
              allowDecimals={false}
              min={0}
              placeholder="0"
              className="w-full text-2xl font-black font-mono text-amber-950 bg-white border border-amber-300 rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-300"
            />
            <span className="text-xs font-bold text-amber-800">Roll</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleReworkChange(Math.max(0, currentRework - 1));
              }}
              className="w-8 h-8 rounded-lg bg-white border border-amber-200 text-slate-700 font-bold hover:bg-amber-100 transition-colors text-sm cursor-pointer active:scale-95"
            >
              -1
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleReworkChange(currentRework + 1);
              }}
              className="w-8 h-8 rounded-lg bg-white border border-amber-200 text-slate-700 font-bold hover:bg-amber-100 transition-colors text-sm cursor-pointer active:scale-95"
            >
              +1
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleReworkChange(currentRework + 5);
              }}
              className="px-2.5 h-8 rounded-lg bg-amber-600 text-white text-xs font-extrabold hover:bg-amber-700 transition-colors cursor-pointer active:scale-95 shadow-2xs"
            >
              +5
            </button>
          </div>
        </div>

        {/* Total Produksi Kumulatif */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Total Produksi
            </span>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">
              W: ~{((production.totalOk + production.totalNg + production.totalRework) * totalRollWeightKg).toLocaleString()} kg
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-slate-900">
              {totalProduced}
            </span>
            <span className="text-xs font-bold text-slate-500">Roll Terinspeksi</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Rejection Rate:</span>
            <strong
              className={`font-mono ${
                production.rejectionRatePct > production.rejectionThresholdFail
                  ? 'text-rose-600 font-bold'
                  : 'text-slate-700'
              }`}
            >
              {production.rejectionRatePct.toFixed(2)}%
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
