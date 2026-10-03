import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Scale,
  Ruler,
  Layers,
  Sparkles,
  Info,
  RotateCcw,
  CheckCircle2,
  Copy,
  ArrowRight,
  Disc,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import { DimensionSampleRow } from '../types/qc';
import { CleanNumberInput } from './common/CleanNumberInput';
import { formatMeasurement } from '../utils/formatUtils';

interface Props {
  dimensions: DimensionSampleRow[];
  defaultRollWeightKg?: number;
  onApplyCalculatedLength?: (calculatedMeters: number, formulaNote: string) => void;
}

interface MaterialPreset {
  name: string;
  code: string;
  density: number; // g/cm³
  description: string;
  typicalUse: string;
}

const MATERIAL_PRESETS: MaterialPreset[] = [
  {
    name: 'Polypropylene',
    code: 'PP',
    density: 0.91,
    description: 'Tahan panas & elastis',
    typicalUse: 'Cup minuman, microwaveable tray, sedotan',
  },
  {
    name: 'High Impact Polystyrene',
    code: 'HIPS',
    density: 1.045,
    description: 'Kaku & mudah dibentuk',
    typicalUse: 'Tray biskuit, blister elektronik, tutup cup',
  },
  {
    name: 'General Purpose PS',
    code: 'GPPS',
    density: 1.05,
    description: 'Bening & kaku',
    typicalUse: 'Wadah bening, tray kue',
  },
  {
    name: 'APET / PET',
    code: 'PET',
    density: 1.34,
    description: 'Sangat jernih & kuat',
    typicalUse: 'Tray buah, blister obat, wadah salad',
  },
  {
    name: 'Polyvinyl Chloride',
    code: 'PVC',
    density: 1.38,
    description: 'Bening keras & tahan kimia',
    typicalUse: 'Blister pack perkakas, cover dokumen',
  },
  {
    name: 'High Density PE',
    code: 'HDPE',
    density: 0.955,
    description: 'Tahan benturan & liat',
    typicalUse: 'Tray industri, partition sheet',
  },
];

export const SmartRollMetrologyCalculator: React.FC<Props> = ({
  dimensions,
  defaultRollWeightKg = 100,
  onApplyCalculatedLength,
}) => {
  // Find measured thickness and width from dimensions if available
  const detectedWidth = useMemo(() => {
    const dim = dimensions.find(
      (d) =>
        d.id.includes('WIDTH') ||
        d.parameterName.toLowerCase().includes('lebar')
    );
    if (dim) {
      if (dim.mean && dim.mean > 0) return dim.mean;
      if (dim.nominal && dim.nominal > 0) return dim.nominal;
    }
    return 650;
  }, [dimensions]);

  const detectedThickness = useMemo(() => {
    const dim = dimensions.find(
      (d) =>
        d.parameterName.toLowerCase().includes('tebal') ||
        d.id.includes('THICK')
    );
    if (dim) {
      if (dim.mean && dim.mean > 0) return dim.mean;
      if (dim.nominal && dim.nominal > 0) return dim.nominal;
    }
    return 0.5;
  }, [dimensions]);

  // Calculator inputs
  const [rollWeightKg, setRollWeightKg] = useState<number>(defaultRollWeightKg);
  const [sheetWidthMm, setSheetWidthMm] = useState<number>(detectedWidth);
  const [avgThicknessMm, setAvgThicknessMm] = useState<number>(detectedThickness);
  const [selectedMaterialCode, setSelectedMaterialCode] = useState<string>('HIPS');
  const [customDensity, setCustomDensity] = useState<number>(1.045);
  const [coreDiameterInch, setCoreDiameterInch] = useState<number>(3); // 3 inch = 76.2mm, outer ~88mm
  const [feedPitchMm, setFeedPitchMm] = useState<number>(125); // Thermoforming step feed
  const [cavitiesPerRow, setCavitiesPerRow] = useState<number>(4);
  const [copiedToast, setCopiedToast] = useState(false);

  // Sync with live inspection measurements
  const handleSyncWithLiveMeasurements = () => {
    setSheetWidthMm(detectedWidth);
    setAvgThicknessMm(detectedThickness);
  };

  const activeDensity = useMemo(() => {
    if (selectedMaterialCode === 'CUSTOM') {
      return customDensity > 0 ? customDensity : 1.0;
    }
    const preset = MATERIAL_PRESETS.find((p) => p.code === selectedMaterialCode);
    return preset ? preset.density : 1.045;
  }, [selectedMaterialCode, customDensity]);

  // METROLOGY FORMULAS:
  // Volume (cm³) = Weight (g) / Density (g/cm³)
  // Length (m) = [Weight (kg) * 1000] / [Width (mm) * Thickness (mm) * Density (g/cm³)]
  const calculatedLengthMeters = useMemo(() => {
    if (rollWeightKg <= 0 || sheetWidthMm <= 0 || avgThicknessMm <= 0 || activeDensity <= 0) {
      return 0;
    }
    // Length in meters:
    // W in kg, Width in mm (w/1000 m), Thick in mm (t/1000 m), Density in g/cm³ (rho * 1000 kg/m³)
    // Mass = Length * (w/1000) * (t/1000) * (rho * 1000) = Length * w * t * rho / 1000
    // => Length = (Mass * 1000) / (w * t * rho)
    const length = (rollWeightKg * 1000) / (sheetWidthMm * avgThicknessMm * activeDensity);
    return Number(length.toFixed(2));
  }, [rollWeightKg, sheetWidthMm, avgThicknessMm, activeDensity]);

  // Gramatur (GSM - Grams per Square Meter)
  const gsm = useMemo(() => {
    // GSM = t (mm) * density (g/cm³) * 1000
    return Number((avgThicknessMm * activeDensity * 1000).toFixed(1));
  }, [avgThicknessMm, activeDensity]);

  // Linear Weight (gram per meter lari)
  const weightPerMeterLariGram = useMemo(() => {
    // gram/m = (w (mm) / 1000) * GSM
    return Number(((sheetWidthMm / 1000) * gsm).toFixed(1));
  }, [sheetWidthMm, gsm]);

  // Total Area (m²)
  const totalAreaM2 = useMemo(() => {
    return Number((calculatedLengthMeters * (sheetWidthMm / 1000)).toFixed(2));
  }, [calculatedLengthMeters, sheetWidthMm]);

  // Outer Diameter (OD) estimation:
  // Core radius: 3 inch -> 88mm OD (r=44mm), 6 inch -> 168mm OD (r=84mm)
  const estimatedOuterDiameterMm = useMemo(() => {
    if (calculatedLengthMeters <= 0 || avgThicknessMm <= 0) return 0;
    const coreOuterRadiusMm = coreDiameterInch === 6 ? 84 : 44;
    // Spiral volume area = Length * thickness = pi * (R² - r²)
    // R² = r² + (Length_mm * thickness_mm) / pi
    const lengthMm = calculatedLengthMeters * 1000;
    const rSquared = Math.pow(coreOuterRadiusMm, 2) + (lengthMm * avgThicknessMm) / Math.PI;
    const outerRadiusMm = Math.sqrt(rSquared);
    return Number((outerRadiusMm * 2).toFixed(1));
  }, [calculatedLengthMeters, avgThicknessMm, coreDiameterInch]);

  // Estimated Thermoforming yield (pcs):
  const estimatedPcsOutput = useMemo(() => {
    if (calculatedLengthMeters <= 0 || feedPitchMm <= 0 || cavitiesPerRow <= 0) return 0;
    const totalStrokes = Math.floor((calculatedLengthMeters * 1000) / feedPitchMm);
    return totalStrokes * cavitiesPerRow;
  }, [calculatedLengthMeters, feedPitchMm, cavitiesPerRow]);

  const handleCopySummary = () => {
    const text = `Kalkulasi Panjang Roll: Berat=${rollWeightKg}kg, Lebar=${sheetWidthMm}mm, Tebal=${avgThicknessMm}mm, Bahan=${selectedMaterialCode} (rho=${activeDensity}) => Estimasi Panjang = ${calculatedLengthMeters} Meter | OD Roll ≈ ${estimatedOuterDiameterMm}mm | GSM = ${gsm} g/m²`;
    navigator.clipboard?.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl mb-6 relative overflow-hidden">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 mb-5 border-b border-slate-800 gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight">
                Kalkulator Panjang Roll & Metrologi Ekstrusi Otomatis
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Formula Fisika Densitas
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Menghitung panjang meter rollsheet, gramatur (GSM), dan perkiraan diameter gulungan berdasarkan berat netto, lebar, dan tebal aktual.
            </p>
          </div>
        </div>

        {/* Sync Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncWithLiveMeasurements}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Tarik nilai lebar dan tebal rata-rata langsung dari data pengukuran QC"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            <span>Tarik Nilai Dimensi QC</span>
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedToast ? 'Tersalin!' : 'Salin Data'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Inputs */}
        <div className="lg:col-span-7 space-y-4">
          {/* Primary Parameter Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Berat Roll */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                1. Berat Netto Roll
              </label>
              <div className="relative">
                <CleanNumberInput
                  value={rollWeightKg}
                  onChangeValue={(val) => setRollWeightKg(val)}
                  allowDecimals={true}
                  min={0}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-base font-mono font-bold text-white focus:outline-none focus:border-blue-500 text-right pr-9"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  kg
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Berat bersih tanpa core</div>
            </div>

            {/* 2. Lebar Roll */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                2. Lebar Sheet
              </label>
              <div className="relative">
                <CleanNumberInput
                  value={sheetWidthMm}
                  onChangeValue={(val) => setSheetWidthMm(val)}
                  allowDecimals={true}
                  min={0}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-base font-mono font-bold text-white focus:outline-none focus:border-blue-500 text-right pr-9"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  mm
                </span>
              </div>
              <div className="text-[10px] text-blue-400 mt-1 truncate">
                Terkait: {detectedWidth} mm
              </div>
            </div>

            {/* 3. Tebal Rata-rata */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                3. Tebal Aktual
              </label>
              <div className="relative">
                <CleanNumberInput
                  value={avgThicknessMm}
                  onChangeValue={(val) => setAvgThicknessMm(val)}
                  allowDecimals={true}
                  min={0}
                  placeholder="0.000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-base font-mono font-bold text-white focus:outline-none focus:border-blue-500 text-right pr-9"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  mm
                </span>
              </div>
              <div className="text-[10px] text-emerald-400 mt-1 truncate">
                Mean QC: {formatMeasurement(detectedThickness)} mm
              </div>
            </div>
          </div>

          {/* Material & Density Selector */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-blue-400" />
                <span>Jenis Bahan Plastik & Berat Jenis (Densitas)</span>
              </span>
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                ρ = {activeDensity} g/cm³
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {MATERIAL_PRESETS.map((mat) => (
                <button
                  key={mat.code}
                  type="button"
                  onClick={() => setSelectedMaterialCode(mat.code)}
                  className={`p-2 rounded-lg text-center transition-all cursor-pointer ${
                    selectedMaterialCode === mat.code
                      ? 'bg-blue-600 text-white font-bold shadow-sm ring-2 ring-blue-400/30'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <div className="text-xs font-extrabold">{mat.code}</div>
                  <div className="text-[10px] opacity-75 font-mono">{mat.density}</div>
                </button>
              ))}
            </div>

            {/* Core Diameter Selection */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400">Diameter Core Kertas (Paper Core):</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCoreDiameterInch(3)}
                  className={`px-2.5 py-1 rounded-md font-mono text-xs cursor-pointer ${
                    coreDiameterInch === 3
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  3 Inch (OD ~88mm)
                </button>
                <button
                  type="button"
                  onClick={() => setCoreDiameterInch(6)}
                  className={`px-2.5 py-1 rounded-md font-mono text-xs cursor-pointer ${
                    coreDiameterInch === 6
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  6 Inch (OD ~168mm)
                </button>
              </div>
            </div>
          </div>

          {/* Thermoforming Pitch & Output Simulator */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Disc className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-300">Simulasi Output Proses 2 (Kiefel / Forming):</span>
                <div className="text-[11px] text-slate-500">Estimasi produk jadi per 1 roll</div>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px]">Pitch:</span>
                <CleanNumberInput
                  value={feedPitchMm}
                  onChangeValue={(val) => setFeedPitchMm(val)}
                  allowDecimals={false}
                  min={0}
                  placeholder="0"
                  className="w-12 bg-transparent text-white font-bold text-right focus:outline-none"
                />
                <span className="text-slate-400 text-[10px]">mm</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px]">Cavity:</span>
                <CleanNumberInput
                  value={cavitiesPerRow}
                  onChangeValue={(val) => setCavitiesPerRow(val)}
                  allowDecimals={false}
                  min={0}
                  placeholder="0"
                  className="w-8 bg-transparent text-white font-bold text-right focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calculated Results Hero Display */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
          {/* Primary Calculated Metric: Estimasi Panjang Roll */}
          <div className="bg-gradient-to-br from-blue-950 via-slate-950 to-slate-900 p-5 rounded-2xl border-2 border-blue-500/50 shadow-lg text-center relative">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-blue-400" />
              Hasil Estimasi Otomatis
            </div>

            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Panjang Rollsheet Tergulung
            </div>

            <div className="my-2 flex items-baseline justify-center gap-2">
              <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                {calculatedLengthMeters.toLocaleString()}
              </span>
              <span className="text-lg font-bold text-blue-400">Meter</span>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              (≈ {(calculatedLengthMeters / 1000).toFixed(3)} km per roll)
            </div>

            {/* Formula Reference Tag */}
            <div className="mt-3 py-1.5 px-2 bg-slate-900/90 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400">
              L = (W × 1000) / (Lebar × Tebal × ρ)
            </div>
          </div>

          {/* Secondary Calculated Metrology Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* GSM */}
            <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Gramatur (GSM)</span>
              <div className="text-base font-black font-mono text-emerald-400 mt-0.5">
                {gsm.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">g/m²</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">Berat lembar per m²</div>
            </div>

            {/* Linear Weight */}
            <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Berat per Meter</span>
              <div className="text-base font-black font-mono text-blue-400 mt-0.5">
                {weightPerMeterLariGram} <span className="text-[10px] text-slate-400 font-normal">g/m</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">Tarikan berat/meter lari</div>
            </div>

            {/* Outer Diameter (OD) */}
            <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Diameter Luar (OD)</span>
              <div className="text-base font-black font-mono text-amber-400 mt-0.5">
                ≈ {estimatedOuterDiameterMm} <span className="text-[10px] text-slate-400 font-normal">mm</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">Diameter gulungan roll</div>
            </div>

            {/* Thermoforming Yield */}
            <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Estimasi Hasil Jadi</span>
              <div className="text-base font-black font-mono text-indigo-400 mt-0.5">
                ≈ {estimatedPcsOutput.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">pcs</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">Output cetak Proses 2</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
