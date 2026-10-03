import React from 'react';
import { QCReport } from '../types/qc';
import { PrintReportView } from './PrintReportView';
import { exportReportToCSV } from '../utils/exportUtils';
import { Printer, FileSpreadsheet, X, CheckCircle2, ShieldCheck, Download, Eye } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  report: QCReport;
}

export const PrintPreviewModal: React.FC<Props> = ({ isOpen, onClose, report }) => {
  if (!isOpen) return null;

  const handleExecutePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      {/* Top Modal Navigation & Action Bar */}
      <div className="no-print bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between text-white shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Inspector Quality · PT Camiloplas Jaya Makmur
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" />
                ISO 9001:2015
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Sertifikasi Hasil Uji Mutu & Pelepasan Lot (Pabrik Jati & Pabrik Bolang). Gunakan "Save as PDF" di dialog cetak.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => exportReportToCSV(report)}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800 rounded-xl transition-all active:scale-95 cursor-pointer"
            title="Download lembar kerja data tabular (.CSV)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel (.CSV)</span>
          </button>

          <button
            type="button"
            onClick={handleExecutePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ring-2 ring-blue-400/30"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup pratinjau"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Document Viewport with Authentic A4 Sheet Simulation */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/60 flex justify-center items-start">
        <div className="w-full max-w-[210mm] bg-white rounded-md shadow-2xl border border-slate-300 overflow-hidden my-auto sm:my-4 transition-all">
          <PrintReportView report={report} isInteractivePreview={true} />
        </div>
      </div>

      {/* Bottom Information Notice Bar */}
      <div className="no-print bg-slate-900 border-t border-slate-800 px-4 py-2 text-center text-xs text-slate-400 shrink-0">
        Format cetak telah dioptimasi untuk kertas A4 portrait dengan margin 8mm-10mm. Semua tombol dan elemen web tidak akan ikut tercetak.
      </div>
    </div>
  );
};
