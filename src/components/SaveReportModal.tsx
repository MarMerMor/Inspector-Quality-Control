import React, { useState } from 'react';
import { QCReport } from '../types/qc';
import { saveReportToStorage, SavedReportItem } from '../utils/storageUtils';
import {
  Save,
  Sparkles,
  CheckCircle2,
  X,
  FileCheck,
  Tag,
  ShieldCheck,
  Layers,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  report: QCReport;
  existingSavedItem?: SavedReportItem;
  onSavedSuccess: (savedReport: QCReport, isTemplate: boolean, msg: string) => void;
}

export const SaveReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  report,
  existingSavedItem,
  onSavedSuccess,
}) => {
  const [saveMode, setSaveMode] = useState<'UPDATE' | 'NEW' | 'TEMPLATE'>(
    existingSavedItem ? 'UPDATE' : 'NEW'
  );
  const [templateTitle, setTemplateTitle] = useState(
    existingSavedItem?.templateLabel || `Master: ${report.header.partName} (${report.header.partNumber})`
  );
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    let result: { success: boolean; item: SavedReportItem };

    if (saveMode === 'TEMPLATE') {
      result = saveReportToStorage(report, {
        isTemplate: true,
        templateLabel: templateTitle.trim() || `Template ${report.header.partName}`,
        asNew: true,
      });
    } else if (saveMode === 'NEW') {
      result = saveReportToStorage(report, {
        isTemplate: false,
        asNew: true,
      });
    } else {
      // Update existing
      result = saveReportToStorage(report, {
        isTemplate: existingSavedItem?.isTemplate ?? false,
        templateLabel: existingSavedItem?.templateLabel,
        asNew: false,
      });
    }

    if (result.success) {
      setIsSavedSuccess(true);
      const msg =
        saveMode === 'TEMPLATE'
          ? `Template master "${templateTitle}" berhasil disimpan!`
          : `Laporan ${result.item.report.header.reportNumber} berhasil disimpan!`;

      setTimeout(() => {
        setIsSavedSuccess(false);
        onSavedSuccess(result.item.report, saveMode === 'TEMPLATE', msg);
        onClose();
      }, 700);
    } else {
      alert('Gagal menyimpan laporan ke penyimpanan lokal.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Simpan Laporan QC & Master Template</h2>
              <p className="text-xs text-slate-400">
                Simpan data inspeksi ini ke penyimpanan lokal agar dapat digunakan kembali
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Quick Info Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-medium">
              <span className="text-slate-500">No. Laporan:</span>
              <span className="font-mono font-bold text-slate-900">{report.header.reportNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Part:</span>
              <span className="font-bold text-slate-800">
                {report.header.partNumber} - {report.header.partName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Mesin & SPK:</span>
              <span className="text-slate-700">
                {report.header.machineName} · {report.header.workOrderNumber}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
              <span className="text-slate-500">Hasil:</span>
              <span className="font-mono font-bold">
                OK: {report.production.totalOk} pcs | NG: {report.production.totalNg} pcs ({report.production.rejectionRatePct}%)
              </span>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pilih Opsi Penyimpanan:
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {existingSavedItem && (
                <label
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    saveMode === 'UPDATE'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="saveMode"
                    value="UPDATE"
                    checked={saveMode === 'UPDATE'}
                    onChange={() => setSaveMode('UPDATE')}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                      Perbarui Laporan Ini (Update Existing)
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Menimpa perubahan terbaru ke ID laporan yang sedang aktif ({report.header.reportNumber})
                    </div>
                  </div>
                </label>
              )}

              <label
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  saveMode === 'NEW'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="saveMode"
                  value="NEW"
                  checked={saveMode === 'NEW'}
                  onChange={() => setSaveMode('NEW')}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Simpan Sebagai Laporan Baru (Save as New Record)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Membuat entri riwayat inspeksi baru secara permanen di daftar laporan Anda
                  </div>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  saveMode === 'TEMPLATE'
                    ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="saveMode"
                  value="TEMPLATE"
                  checked={saveMode === 'TEMPLATE'}
                  onChange={() => setSaveMode('TEMPLATE')}
                  className="mt-0.5 text-amber-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Simpan Sebagai Master Template Produksi
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Spesifikasi mold, toleransi berat, dimensi kritis & daftar cacat akan disimpan sebagai template baku yang dapat langsung dipakai berkali-kali untuk shift/lot selanjutnya!
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Template Title Input (If template selected) */}
          {saveMode === 'TEMPLATE' && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-medium text-slate-700 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                Nama / Label Template Master:
              </label>
              <input
                type="text"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                placeholder="Contoh: Master Injection Molding - Clip Fender Depan"
                className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
              <p className="text-[11px] text-slate-500">
                Operator lain atau Anda dapat memilih template ini dengan 1-klik untuk memulai inspeksi baru tanpa mengetik ulang spesifikasi.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Tersimpan lokal & aman
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={isSavedSuccess}
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white shadow-xs transition-all ${
                isSavedSuccess
                  ? 'bg-emerald-600'
                  : saveMode === 'TEMPLATE'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSavedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Tersimpan!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {saveMode === 'UPDATE'
                    ? 'Perbarui Laporan'
                    : saveMode === 'TEMPLATE'
                    ? 'Simpan Template Master'
                    : 'Simpan Laporan Baru'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
