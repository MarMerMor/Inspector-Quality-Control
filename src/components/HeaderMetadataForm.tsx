import React, { useState } from 'react';
import { HeaderMetadata, ProcessType, ShiftType } from '../types/qc';
import { generateAutoReportNumber } from '../utils/sampleData';
import {
  Factory,
  Calendar,
  Clock,
  User,
  Wrench,
  Hash,
  Layers,
  ChevronDown,
  ChevronUp,
  Package,
  RefreshCw,
  Sparkles,
  X,
  Building2,
  MapPin,
} from 'lucide-react';

interface Props {
  header: HeaderMetadata;
  onChange: (updated: HeaderMetadata) => void;
}

export const HeaderMetadataForm: React.FC<Props> = ({ header, onChange }) => {
  const [showMoreFields, setShowMoreFields] = useState(false);

  const updateField = <K extends keyof HeaderMetadata>(key: K, value: HeaderMetadata[K]) => {
    onChange({
      ...header,
      [key]: value,
    });
  };

  // Generate automated report number according to formula:
  // (QC-EXT-(DD/MM/YY)-(Shift)-(Nomor urut laporan)
  const handleAutoGenerateNumber = (
    processType = header.processType,
    dateStr = header.inspectionDate,
    shift = header.shift
  ) => {
    // Determine sequence number from existing or default to 001
    let seq = '001';
    if (header.reportNumber) {
      const match = header.reportNumber.match(/-(\d{3})$/);
      if (match) {
        const nextNum = parseInt(match[1], 10) + 1;
        seq = String(nextNum).padStart(3, '0');
      }
    }
    const autoNo = generateAutoReportNumber(processType, dateStr, shift, seq);
    onChange({
      ...header,
      processType,
      inspectionDate: dateStr,
      shift,
      reportNumber: autoNo,
    });
  };

  const handleProcessChange = (newType: ProcessType) => {
    onChange({
      ...header,
      processType: newType,
      reportNumber: header.reportNumber
        ? generateAutoReportNumber(newType, header.inspectionDate, header.shift, '001')
        : '',
    });
  };

  const handleShiftChange = (newShift: ShiftType) => {
    onChange({
      ...header,
      shift: newShift,
      reportNumber: header.reportNumber
        ? generateAutoReportNumber(header.processType, header.inspectionDate, newShift, '001')
        : '',
    });
  };

  const handleDateChange = (newDate: string) => {
    onChange({
      ...header,
      inspectionDate: newDate,
      reportNumber: header.reportNumber
        ? generateAutoReportNumber(header.processType, newDate, header.shift, '001')
        : '',
    });
  };

  return (
    <div id="section-header" className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 mb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Factory className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Informasi Laporan QC & Parameter Mesin</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identifikasi nomor SPK, lot produksi, dan penugasan operator/inspector
          </p>
        </div>

        {/* Process Type Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto w-full sm:w-auto scrollbar-none">
          {(
            [
              { type: 'EXTRUDER', label: 'Extruder' },
              { type: 'PROSES_2', label: 'Proses 2' },
            ] as const
          ).map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => handleProcessChange(item.type as ProcessType)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[40px] flex items-center justify-center ${
                header.processType === item.type
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 active:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Essential Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Nomor Laporan QC dengan Auto-Generator */}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-blue-600" />
              Nomor Laporan QC
            </label>
            <button
              type="button"
              onClick={() => handleAutoGenerateNumber()}
              title="Generate nomor laporan otomatis sesuai format"
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 active:scale-95 bg-blue-50 px-2 py-0.5 rounded-md"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Otomatis</span>
            </button>
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              value={header.reportNumber}
              onChange={(e) => updateField('reportNumber', e.target.value)}
              placeholder="Contoh: QC-EXT-23/09/26-1-001"
              className="w-full pl-3 pr-8 py-2.5 sm:py-2 min-h-[44px] text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold text-slate-900 placeholder:text-slate-400 placeholder:opacity-50 placeholder:font-normal"
            />
            {header.reportNumber && (
              <button
                type="button"
                onClick={() => updateField('reportNumber', '')}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
                title="Hapus nomor laporan"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Format: QC-EXT-(DD/MM/YY)-(Shift)-(Urut) · Klik "Otomatis" untuk generate</span>
          </div>
        </div>

        {/* Tanggal Inspeksi */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Tanggal Inspeksi
          </label>
          <input
            type="date"
            value={header.inspectionDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full px-3 py-2.5 sm:py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Shift Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Shift Kerja
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['SHIFT_1', 'SHIFT_2', 'SHIFT_3'] as ShiftType[]).map((s, idx) => (
              <button
                key={s}
                type="button"
                onClick={() => handleShiftChange(s)}
                className={`min-h-[44px] py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all flex items-center justify-center active:scale-95 ${
                  header.shift === s
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                Shift {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Nomor SPK (Surat Perintah Kerja) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Nomor SPK
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={header.workOrderNumber}
              onChange={(e) => updateField('workOrderNumber', e.target.value)}
              placeholder="Contoh: SPK-2026-09-001"
              className="w-full pl-3 pr-8 py-2.5 sm:py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold placeholder:text-slate-400 placeholder:opacity-50 placeholder:font-normal"
            />
            {header.workOrderNumber && (
              <button
                type="button"
                onClick={() => updateField('workOrderNumber', '')}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
                title="Hapus SPK"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Nomor LOT */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-blue-600" />
            Nomor LOT
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={header.partNumber}
              onChange={(e) => updateField('partNumber', e.target.value)}
              placeholder={header.processType === 'EXTRUDER' ? 'Contoh: LOT-EXT-260923-01' : 'Contoh: LOT-P2-260923-01'}
              className="w-full pl-3 pr-8 py-2.5 sm:py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-medium placeholder:text-slate-400 placeholder:opacity-50 placeholder:font-normal"
            />
            {header.partNumber && (
              <button
                type="button"
                onClick={() => updateField('partNumber', '')}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
                title="Hapus Nomor LOT"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Part Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Nama Part / Produk
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={header.partName}
              onChange={(e) => updateField('partName', e.target.value)}
              placeholder={header.processType === 'EXTRUDER' ? 'Contoh: Roll Sheet Clear 0.50mm x 650mm' : 'Contoh: Food Packaging Tray'}
              className="w-full pl-3 pr-8 py-2.5 sm:py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium placeholder:text-slate-400 placeholder:opacity-50 placeholder:font-normal"
            />
            {header.partName && (
              <button
                type="button"
                onClick={() => updateField('partName', '')}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
                title="Hapus nama part"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Mesin */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-blue-600" />
            Nama & ID Mesin
          </label>
          {header.processType === 'EXTRUDER' ? (
            <div className="space-y-1.5">
              <select
                value={header.machineName}
                onChange={(e) => updateField('machineName', e.target.value)}
                className={`w-full px-3 py-2.5 sm:py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold ${
                  header.machineName ? 'text-slate-900' : 'text-slate-400 font-normal'
                }`}
              >
                <option value="">Pilih Mesin Extruder...</option>
                <option value="Extruder 1">Extruder 1</option>
                <option value="Extruder 2">Extruder 2</option>
                <option value="Extruder 4">Extruder 4</option>
                <option value="Extruder 5">Extruder 5</option>
              </select>

              {/* Quick Chip Selection */}
              <div className="flex flex-wrap items-center gap-1">
                {(['Extruder 1', 'Extruder 2', 'Extruder 4', 'Extruder 5'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updateField('machineName', m)}
                    className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                      header.machineName === m
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 active:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <input
              type="text"
              value={header.machineName}
              onChange={(e) => updateField('machineName', e.target.value)}
              placeholder="Contoh: Mesin Kiefel KMD 78"
              className="w-full px-3 py-2.5 sm:py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 placeholder:opacity-50 placeholder:font-normal"
            />
          )}
        </div>

        {/* Inspector Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" />
            Nama Inspector QC
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={header.inspectorName}
              onChange={(e) => updateField('inspectorName', e.target.value)}
              placeholder="Contoh: Bambang Sudirman (QC)"
              className="w-full pl-3 pr-8 py-2.5 sm:py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium placeholder:text-slate-400 placeholder:opacity-50 placeholder:font-normal"
            />
            {header.inspectorName && (
              <button
                type="button"
                onClick={() => updateField('inspectorName', '')}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
                title="Hapus nama inspector"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tujuan Alokasi Pabrik / Produksi (Pabrik Jati & Pabrik Bolang) */}
      <div className="mt-3.5 p-3 rounded-xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-blue-600 text-white shadow-2xs">
            <Building2 className="w-4 h-4" />
          </span>
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              Tujuan Alokasi Produksi (Pabrik PT Camiloplas Jaya Makmur):
            </span>
            <span className="text-[11px] text-slate-500">
              Pilih tujuan pabrik lanjutan untuk transfer raw sheet extruder
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:w-auto w-full">
          <button
            type="button"
            onClick={() => updateField('destinationPlant', 'PROSES_2_JATI')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
              (header.destinationPlant || 'PROSES_2_JATI') === 'PROSES_2_JATI'
                ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/30'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <div>
              <div>Proses 2 Jati</div>
              <div className="text-[9.5px] opacity-80 font-normal">Pabrik Jatiuwung</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => updateField('destinationPlant', 'PROSES_2_BOLANG')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
              header.destinationPlant === 'PROSES_2_BOLANG'
                ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/30'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0 text-cyan-300" />
            <div>
              <div>Proses 2 Bolang</div>
              <div className="text-[9.5px] opacity-80 font-normal">Pabrik Tigaraksa</div>
            </div>
          </button>
        </div>
      </div>

      {/* Toggle More Details (Operator, Material Grade) */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowMoreFields(!showMoreFields)}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 py-1.5 focus:outline-none"
        >
          <span>
            {showMoreFields
              ? 'Sembunyikan Parameter Tambahan'
              : '+ Tampilkan Parameter Tambahan (Operator Mesin & Grade Material)'}
          </span>
          {showMoreFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showMoreFields && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mt-3 animate-in fade-in duration-150">
            {/* Operator Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Nama Operator Mesin
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={header.operatorName}
                  onChange={(e) => updateField('operatorName', e.target.value)}
                  placeholder="Contoh: Agus Riyadi"
                  className="w-full pl-3 pr-8 py-2.5 sm:py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 placeholder:opacity-50 placeholder:font-normal"
                />
                {header.operatorName && (
                  <button
                    type="button"
                    onClick={() => updateField('operatorName', '')}
                    className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
                    title="Hapus nama operator"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Material & Grade */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Material / Grade Bahan
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={header.materialGrade}
                  onChange={(e) => updateField('materialGrade', e.target.value)}
                  placeholder={header.processType === 'EXTRUDER' ? 'Contoh: PET Virgin + Regrind' : 'Contoh: Roll Sheet Clear 0.50mm'}
                  className="w-full pl-3 pr-8 py-2.5 sm:py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 placeholder:opacity-50 placeholder:font-normal"
                />
                {header.materialGrade && (
                  <button
                    type="button"
                    onClick={() => updateField('materialGrade', '')}
                    className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
                    title="Hapus material grade"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
