import React, { useState } from 'react';
import { DimensionSampleRow } from '../types/qc';
import { calculateDimensionStats } from '../utils/calculations';
import { Ruler, Plus, Trash2, Check, AlertTriangle, Smartphone, Table as TableIcon, Zap } from 'lucide-react';

interface Props {
  dimensions: DimensionSampleRow[];
  onChange: (updated: DimensionSampleRow[]) => void;
}

export const CriticalDimensionsTable: React.FC<Props> = ({ dimensions, onChange }) => {
  // Mobile card view vs desktop table view toggle
  const [viewMode, setViewMode] = useState<'CARD' | 'TABLE'>('CARD');

  // Quick fill all 5 samples with nominal value
  const handleQuickFillNominal = (dimId: string) => {
    const updated = dimensions.map((dim) => {
      if (dim.id === dimId) {
        const nominalSamples = [dim.nominal, dim.nominal, dim.nominal, dim.nominal, dim.nominal];
        const stats = calculateDimensionStats(
          nominalSamples,
          dim.upperSpecLimit,
          dim.lowerSpecLimit
        );
        return {
          ...dim,
          samples: nominalSamples,
          ...stats,
        };
      }
      return dim;
    });
    onChange(updated);
  };

  // Update a sample value
  const handleSampleChange = (
    dimId: string,
    sampleIndex: number,
    valueStr: string
  ) => {
    const updated = dimensions.map((dim) => {
      if (dim.id === dimId) {
        const newSamples = [...dim.samples];
        newSamples[sampleIndex] = valueStr === '' ? null : parseFloat(valueStr);
        const stats = calculateDimensionStats(
          newSamples,
          dim.upperSpecLimit,
          dim.lowerSpecLimit
        );
        return {
          ...dim,
          samples: newSamples,
          ...stats,
        };
      }
      return dim;
    });
    onChange(updated);
  };

  // Update limit or nominal
  const handleLimitChange = (
    dimId: string,
    field: 'nominal' | 'upperSpecLimit' | 'lowerSpecLimit',
    val: number
  ) => {
    const updated = dimensions.map((dim) => {
      if (dim.id === dimId) {
        const merged = { ...dim, [field]: val };
        const stats = calculateDimensionStats(
          merged.samples,
          merged.upperSpecLimit,
          merged.lowerSpecLimit
        );
        return {
          ...merged,
          ...stats,
        };
      }
      return dim;
    });
    onChange(updated);
  };

  // Update text field
  const handleTextChange = (
    dimId: string,
    field: 'parameterName' | 'toolUsed' | 'unit',
    val: string
  ) => {
    const updated = dimensions.map((dim) =>
      dim.id === dimId ? { ...dim, [field]: val } : dim
    );
    onChange(updated);
  };

  // Load standard Extruder dimensions (Ketebalan Lebar & Panjang: Micrometer, Lebar: Meteran Gulung)
  const handleLoadExtruderPreset = () => {
    const extDims: DimensionSampleRow[] = [
      {
        id: 'DIM_EXT_THICK_WIDTH',
        parameterName: 'Ketebalan Bagian Lebar (Cross-Direction)',
        toolUsed: 'Micrometer',
        nominal: 0.50,
        upperSpecLimit: 0.53,
        lowerSpecLimit: 0.47,
        unit: 'mm',
        sampleLabels: ['Sisi Kiri', 'Tengah Kiri', 'Center', 'Tengah Kanan', 'Sisi Kanan'],
        samples: [0.502, 0.498, 0.504, 0.501, 0.497],
        mean: null,
        min: null,
        max: null,
        range: null,
        stdDev: null,
        isAllInSpec: true,
        outOfSpecIndices: [],
        category: 'THICKNESS_WIDTH',
      },
      {
        id: 'DIM_EXT_THICK_LENGTH',
        parameterName: 'Ketebalan Bagian Panjang (Machine-Direction)',
        toolUsed: 'Micrometer',
        nominal: 0.50,
        upperSpecLimit: 0.53,
        lowerSpecLimit: 0.47,
        unit: 'mm',
        sampleLabels: ['0m (Awal)', '50m', '100m (Tengah)', '150m', '200m (Akhir)'],
        samples: [0.500, 0.503, 0.501, 0.498, 0.502],
        mean: null,
        min: null,
        max: null,
        range: null,
        stdDev: null,
        isAllInSpec: true,
        outOfSpecIndices: [],
        category: 'THICKNESS_LENGTH',
      },
      {
        id: 'DIM_EXT_WIDTH',
        parameterName: 'Lebar Rollsheet (Sheet Width)',
        toolUsed: 'Meteran Gulung',
        nominal: 650.0,
        upperSpecLimit: 653.0,
        lowerSpecLimit: 647.0,
        unit: 'mm',
        sampleLabels: ['Awal', '50m', '100m', '150m', 'Akhir'],
        samples: [650.0, 650.5, 651.0, 649.5, 650.0],
        mean: null,
        min: null,
        max: null,
        range: null,
        stdDev: null,
        isAllInSpec: true,
        outOfSpecIndices: [],
        category: 'ROLL_WIDTH',
      },
      {
        id: 'DIM_EXT_LENGTH',
        parameterName: 'Panjang Rollsheet (Roll Length)',
        toolUsed: 'Meteran Gulung / Counter',
        nominal: 200.0,
        upperSpecLimit: 205.0,
        lowerSpecLimit: 198.0,
        unit: 'm',
        sampleLabels: ['Panjang Roll', '-', '-', '-', '-'],
        samples: [200.5, null, null, null, null],
        mean: null,
        min: null,
        max: null,
        range: null,
        stdDev: null,
        isAllInSpec: true,
        outOfSpecIndices: [],
        category: 'ROLL_LENGTH',
      },
    ];

    const processed = extDims.map((dim) => {
      const stats = calculateDimensionStats(dim.samples, dim.upperSpecLimit, dim.lowerSpecLimit);
      return { ...dim, ...stats };
    });
    onChange(processed);
  };

  // Load standard Proses 2 (Kiefel & Thermoforming) dimensions
  const handleLoadProses2Preset = () => {
    const p2Dims: DimensionSampleRow[] = [
      {
        id: 'DIM_P2_THICK_BASE',
        parameterName: 'Ketebalan Dasar Produk (Base Thickness)',
        toolUsed: 'Micrometer',
        nominal: 0.35,
        upperSpecLimit: 0.40,
        lowerSpecLimit: 0.30,
        unit: 'mm',
        samples: [0.35, 0.36, 0.34, 0.35, 0.35],
        mean: null,
        min: null,
        max: null,
        range: null,
        stdDev: null,
        isAllInSpec: true,
        outOfSpecIndices: [],
      },
      {
        id: 'DIM_P2_HEIGHT',
        parameterName: 'Tinggi Produk / Tray (Depth)',
        toolUsed: 'Digital Caliper 150mm',
        nominal: 45.00,
        upperSpecLimit: 45.50,
        lowerSpecLimit: 44.50,
        unit: 'mm',
        samples: [45.02, 45.08, 44.95, 45.01, 45.04],
        mean: null,
        min: null,
        max: null,
        range: null,
        stdDev: null,
        isAllInSpec: true,
        outOfSpecIndices: [],
      },
      {
        id: 'DIM_P2_FLANGE_WIDTH',
        parameterName: 'Lebar Flange Potong (Cutting Flange)',
        toolUsed: 'Digital Caliper 150mm',
        nominal: 8.50,
        upperSpecLimit: 8.80,
        lowerSpecLimit: 8.20,
        unit: 'mm',
        samples: [8.52, 8.48, 8.55, 8.50, 8.51],
        mean: null,
        min: null,
        max: null,
        range: null,
        stdDev: null,
        isAllInSpec: true,
        outOfSpecIndices: [],
      },
    ];

    const processed = p2Dims.map((dim) => {
      const stats = calculateDimensionStats(dim.samples, dim.upperSpecLimit, dim.lowerSpecLimit);
      return { ...dim, ...stats };
    });
    onChange(processed);
  };

  // Add new dimension row
  const handleAddRow = () => {
    const newId = `DIM_${Date.now().toString().slice(-4)}`;
    const newRow: DimensionSampleRow = {
      id: newId,
      parameterName: 'Pengukuran Baru',
      toolUsed: 'Micrometer',
      nominal: 10.0,
      upperSpecLimit: 10.1,
      lowerSpecLimit: 9.9,
      unit: 'mm',
      samples: [10.0, 10.0, 10.0, 10.0, 10.0],
      mean: 10.0,
      min: 10.0,
      max: 10.0,
      range: 0,
      stdDev: 0,
      isAllInSpec: true,
      outOfSpecIndices: [],
    };
    onChange([...dimensions, newRow]);
  };

  // Delete dimension row
  const handleDeleteRow = (dimId: string) => {
    if (dimensions.length <= 1) return;
    onChange(dimensions.filter((d) => d.id !== dimId));
  };

  const totalOos = dimensions.filter((d) => !d.isAllInSpec).length;

  return (
    <div id="section-dimensions" className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Ruler className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Pengukuran Dimensi Critical (SPC / Sample Check)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspeksi sampel 1-5 dengan evaluasi otomatis toleransi USL / LSL dan perhitungan rata-rata & range
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View mode toggle (Mobile friendly) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('CARD')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                viewMode === 'CARD'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Kartu HP</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                viewMode === 'TABLE'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
          </div>

          {totalOos > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              {totalOos} Out-of-Spec (OOS)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              Semua In-Spec
            </span>
          )}

          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all shadow-2xs active:scale-95 min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dimensi</span>
          </button>
        </div>
      </div>

      {/* Quick Dimension Presets for Extruder & Proses 2 */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
        <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px] sm:text-xs">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          Preset Pengukuran:
        </span>
        <button
          type="button"
          onClick={handleLoadExtruderPreset}
          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-blue-700 font-bold hover:bg-blue-50 active:scale-95 transition-all text-[11px]"
        >
          Extruder
        </button>
        <button
          type="button"
          onClick={handleLoadProses2Preset}
          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-indigo-700 font-bold hover:bg-indigo-50 active:scale-95 transition-all text-[11px]"
        >
          Proses 2
        </button>
      </div>

      {/* MODE KARTU HP (Ideal for Smartphone / Android touch entry) */}
      {viewMode === 'CARD' && (
        <div className="space-y-4 mb-4">
          {dimensions.map((dim, idx) => {
            return (
              <div
                key={dim.id}
                className={`p-4 rounded-xl border transition-all ${
                  !dim.isAllInSpec
                    ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-200 shadow-2xs'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                {/* Header row: Parameter, Tool, and Status */}
                <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={dim.parameterName}
                        onChange={(e) => handleTextChange(dim.id, 'parameterName', e.target.value)}
                        placeholder="Contoh: Ketebalan Dinding"
                        className="font-extrabold text-sm text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 focus:outline-none py-0.5 placeholder:text-slate-400 placeholder:opacity-50 placeholder:font-normal"
                      />
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                      <span>Alat:</span>
                      <input
                        type="text"
                        value={dim.toolUsed}
                        onChange={(e) => handleTextChange(dim.id, 'toolUsed', e.target.value)}
                        placeholder="Contoh: Micrometer"
                        className="bg-transparent border-b border-slate-200 text-xs focus:outline-none focus:border-indigo-600 placeholder:text-slate-400 placeholder:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {dim.isAllInSpec ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        IN-SPEC
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-100 text-rose-800 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        OOS
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={dimensions.length <= 1}
                      onClick={() => handleDeleteRow(dim.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 disabled:opacity-20"
                      title="Hapus dimensi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tolerance & Spec Limits Strip */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs mb-3.5 border border-slate-200/80">
                  <div>
                    <span className="text-[11px] text-slate-500 block font-medium">Nominal</span>
                    <input
                      type="number"
                      step="0.001"
                      inputMode="decimal"
                      value={dim.nominal}
                      onChange={(e) =>
                        handleLimitChange(dim.id, 'nominal', parseFloat(e.target.value) || 0)
                      }
                      className="w-full font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2 py-1 text-center min-h-[34px] mt-0.5"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-rose-600 block font-bold">LSL (Min)</span>
                    <input
                      type="number"
                      step="0.001"
                      inputMode="decimal"
                      value={dim.lowerSpecLimit}
                      onChange={(e) =>
                        handleLimitChange(dim.id, 'lowerSpecLimit', parseFloat(e.target.value) || 0)
                      }
                      className="w-full font-mono font-bold text-rose-800 bg-rose-50/50 border border-rose-200 rounded-lg px-2 py-1 text-center min-h-[34px] mt-0.5"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-rose-600 block font-bold">USL (Max)</span>
                    <input
                      type="number"
                      step="0.001"
                      inputMode="decimal"
                      value={dim.upperSpecLimit}
                      onChange={(e) =>
                        handleLimitChange(dim.id, 'upperSpecLimit', parseFloat(e.target.value) || 0)
                      }
                      className="w-full font-mono font-bold text-rose-800 bg-rose-50/50 border border-rose-200 rounded-lg px-2 py-1 text-center min-h-[34px] mt-0.5"
                    />
                  </div>
                </div>

                {/* Samples S1 - S5 with Large Touch Targets */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-700">
                      Titik Sampel Pengukuran (S1 - S5):
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickFillNominal(dim.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200 active:scale-95"
                    >
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>Isi Semua ({dim.nominal})</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {dim.samples.map((val, sampleIdx) => {
                      const isOos = dim.outOfSpecIndices.includes(sampleIdx);
                      const pointLabel = dim.sampleLabels?.[sampleIdx] || `S${sampleIdx + 1}`;
                      return (
                        <div key={sampleIdx} className="flex flex-col items-center">
                          <span
                            className="text-[10px] font-bold text-slate-600 mb-1 text-center truncate max-w-full"
                            title={pointLabel}
                          >
                            {pointLabel}
                          </span>
                          <input
                            type="number"
                            step="0.001"
                            inputMode="decimal"
                            value={val ?? ''}
                            placeholder="-"
                            onChange={(e) => handleSampleChange(dim.id, sampleIdx, e.target.value)}
                            className={`w-full min-h-[44px] text-center font-mono text-xs sm:text-sm font-bold rounded-xl border-2 transition-all ${
                              isOos
                                ? 'bg-rose-100 text-rose-950 border-rose-500 ring-2 ring-rose-300/60'
                                : val !== null
                                ? 'bg-emerald-50/60 text-emerald-950 border-emerald-300'
                                : 'bg-white border-slate-200 text-slate-400'
                            } focus:outline-none focus:border-indigo-600 focus:bg-white`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Statistics Footer: Mean, Range, Out of Spec Alert */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-slate-400 text-[11px]">Mean (x̄): </span>
                      <span className="font-mono font-bold text-slate-800">
                        {dim.mean !== null ? dim.mean.toFixed(3) : '-'} {dim.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Range (R): </span>
                      <span className="font-mono font-bold text-slate-800">
                        {dim.range !== null ? dim.range.toFixed(3) : '-'} {dim.unit}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500">
                    Tol: {dim.lowerSpecLimit.toFixed(3)} - {dim.upperSpecLimit.toFixed(3)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODE TABEL LEBAR (For Desktop or full data view) */}
      {viewMode === 'TABLE' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 min-w-[180px]">Parameter / Karakteristik</th>
                <th className="py-2.5 px-3 min-w-[140px]">Alat Ukur</th>
                <th className="py-2.5 px-2 text-center w-16">Nominal</th>
                <th className="py-2.5 px-2 text-center w-16 text-rose-700">LSL (Min)</th>
                <th className="py-2.5 px-2 text-center w-16 text-rose-700">USL (Max)</th>
                <th className="py-2.5 px-2 text-center w-16 bg-blue-50/60 text-blue-900">S1</th>
                <th className="py-2.5 px-2 text-center w-16 bg-blue-50/60 text-blue-900">S2</th>
                <th className="py-2.5 px-2 text-center w-16 bg-blue-50/60 text-blue-900">S3</th>
                <th className="py-2.5 px-2 text-center w-16 bg-blue-50/60 text-blue-900">S4</th>
                <th className="py-2.5 px-2 text-center w-16 bg-blue-50/60 text-blue-900">S5</th>
                <th className="py-2.5 px-2 text-center w-16 font-mono">Mean (x̄)</th>
                <th className="py-2.5 px-2 text-center w-16 font-mono">Range (R)</th>
                <th className="py-2.5 px-2 text-center w-20">Status</th>
                <th className="py-2.5 px-2 text-center w-10">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {dimensions.map((dim) => {
                return (
                  <tr
                    key={dim.id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      !dim.isAllInSpec ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    {/* Parameter Name */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={dim.parameterName}
                        onChange={(e) => handleTextChange(dim.id, 'parameterName', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>

                    {/* Tool Used */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={dim.toolUsed}
                        onChange={(e) => handleTextChange(dim.id, 'toolUsed', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>

                    {/* Nominal */}
                    <td className="py-2 px-1 text-center">
                      <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={dim.nominal}
                        onChange={(e) =>
                          handleLimitChange(dim.id, 'nominal', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 px-1 py-1 text-center font-mono text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>

                    {/* LSL */}
                    <td className="py-2 px-1 text-center">
                      <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={dim.lowerSpecLimit}
                        onChange={(e) =>
                          handleLimitChange(dim.id, 'lowerSpecLimit', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 px-1 py-1 text-center font-mono text-xs bg-rose-50/50 border border-rose-200 rounded text-rose-800 font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </td>

                    {/* USL */}
                    <td className="py-2 px-1 text-center">
                      <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={dim.upperSpecLimit}
                        onChange={(e) =>
                          handleLimitChange(dim.id, 'upperSpecLimit', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 px-1 py-1 text-center font-mono text-xs bg-rose-50/50 border border-rose-200 rounded text-rose-800 font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </td>

                    {/* Samples S1 - S5 */}
                    {dim.samples.map((val, sampleIdx) => {
                      const isOos = dim.outOfSpecIndices.includes(sampleIdx);
                      return (
                        <td key={sampleIdx} className="py-2 px-1 text-center">
                          <input
                            type="number"
                            step="0.01"
                            inputMode="decimal"
                            value={val ?? ''}
                            placeholder="-"
                            onChange={(e) => handleSampleChange(dim.id, sampleIdx, e.target.value)}
                            className={`w-16 px-1 py-1 text-center font-mono text-xs rounded border transition-colors ${
                              isOos
                                ? 'bg-rose-100 text-rose-900 border-rose-400 font-bold'
                                : val !== null
                                ? 'bg-emerald-50/40 text-emerald-950 border-slate-200 font-medium'
                                : 'bg-white border-slate-200 text-slate-400'
                            } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                          />
                        </td>
                      );
                    })}

                    {/* Mean */}
                    <td className="py-2 px-2 text-center font-mono font-bold text-slate-800 bg-slate-50/50">
                      {dim.mean !== null ? dim.mean.toFixed(2) : '-'}
                    </td>

                    {/* Range */}
                    <td className="py-2 px-2 text-center font-mono text-slate-600 bg-slate-50/50">
                      {dim.range !== null ? dim.range.toFixed(2) : '-'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2 px-2 text-center">
                      {dim.isAllInSpec ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          IN-SPEC
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                          OUT (OOS)
                        </span>
                      )}
                    </td>

                    {/* Delete Button */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        disabled={dimensions.length <= 1}
                        onClick={() => handleDeleteRow(dim.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 disabled:opacity-20"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 px-1 gap-1">
        <span>
          Catatan SPC: Sampel ditandai merah jika nilai &gt; USL atau &lt; LSL.
        </span>
        <span className="font-mono text-[11px]">
          Toleransi Standar: JIS B 0405-m / ISO 2768-m
        </span>
      </div>
    </div>
  );
};

