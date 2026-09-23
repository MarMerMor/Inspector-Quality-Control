import React from 'react';
import { QCReport } from '../types/qc';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  UserCheck,
  Save,
  Layers,
  Copy,
  Sparkles,
} from 'lucide-react';
import { exportReportToCSV, exportReportToJSON } from '../utils/exportUtils';

interface Props {
  report: QCReport;
  onNotesChange: (notes: string, correctiveAction: string) => void;
  onApprovalChange: (approvedBy: string) => void;
  onOpenSchemaModal: () => void;
  onPrint: () => void;
  onOpenSaveModal: () => void;
  onOpenSavedListModal: () => void;
  onDuplicateForNewShift: () => void;
}

export const QCReportSummary: React.FC<Props> = ({
  report,
  onNotesChange,
  onApprovalChange,
  onOpenSchemaModal,
  onPrint,
  onOpenSaveModal,
  onOpenSavedListModal,
  onDuplicateForNewShift,
}) => {
  const getStatusIcon = () => {
    switch (report.production.status) {
      case 'PASS':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'CONDITIONAL_PASS':
        return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'REJECT':
      default:
        return <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
    }
  };

  return (
    <div id="section-summary" className="space-y-4 sm:space-y-6">
      {/* Automated Diagnostic Reasons Box */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 md:p-6">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-3">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          Diagnostik & Justifikasi Status Otomatis
        </h2>

        <div
          className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            report.production.status === 'PASS'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : report.production.status === 'CONDITIONAL_PASS'
              ? 'bg-amber-50/70 border-amber-200 text-amber-950'
              : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}
        >
          {getStatusIcon()}
          <div className="space-y-1.5 flex-1">
            <div className="text-xs font-bold uppercase tracking-wider">
              {report.production.status === 'PASS'
                ? 'Status: LULUS INSPEKSI (PASS)'
                : report.production.status === 'CONDITIONAL_PASS'
                ? 'Status: LULUS DENGAN SYARAT / BUTUH SIGN-OFF (CONDITIONAL PASS)'
                : 'Status: DITOLAK / REJECT (HOLD LOT)'}
            </div>

            <ul className="text-xs space-y-1 list-disc list-inside">
              {report.production.statusReasons.map((reason, idx) => (
                <li key={idx} className="font-medium">
                  {reason}
                </li>
              ))}
            </ul>

            <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-3">
              <span>Status Output: <strong>{report.production.totalOk} Roll OK</strong></span>
              <span>·</span>
              <span>Siap Transfer: <strong>Proses 2 (Mesin Kiefel)</strong></span>
              <span>·</span>
              <span>Total Produksi: <strong>{report.production.totalProduced.toLocaleString()} Roll</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Corrective Actions */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 md:p-6">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          Catatan Lapangan & Rencana Tindakan Korektif (CAPA)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Catatan Observasi Mesin & Kondisi Part:
            </label>
            <textarea
              rows={3}
              value={report.notes}
              onChange={(e) => onNotesChange(e.target.value, report.correctiveAction)}
              placeholder="Contoh: Tekanan oli hidrolik stabil. Terdapat sedikit flash di parting line cavity 2..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Tindakan Korektif / Penyetelan Parameter:
            </label>
            <textarea
              rows={3}
              value={report.correctiveAction}
              onChange={(e) => onNotesChange(report.notes, e.target.value)}
              placeholder="Contoh: Menurunkan holding pressure dari 68 ke 65 MPa, meningkatkan waktu cooling 1.5 detik..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Approval Signoff Row */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-700">Persetujuan QC Leader / QA Spv:</span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={report.approvedBy || ''}
              onChange={(e) => onApprovalChange(e.target.value)}
              placeholder="Nama QA Supervisor / Leader"
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-500 font-mono">
              {report.approvalDate || new Date().toLocaleDateString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Storage & Reusability Section */}
      <div className="bg-white rounded-xl border border-blue-200/90 bg-gradient-to-r from-blue-50/40 via-indigo-50/20 to-transparent p-5 md:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-2xs">
                <Save className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Simpan Laporan & Penggunaan Berulang (Templates)
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                Fitur Pakai Ulang
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl">
              Simpan laporan ini ke database lokal browser Anda agar tidak hilang, atau gunakan spesifikasi mold, dimensi kritis, dan part number ini sebagai template untuk shift dan lot produksi berikutnya tanpa perlu mengetik ulang dari awal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenSaveModal}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Laporan</span>
            </button>

            <button
              type="button"
              onClick={onDuplicateForNewShift}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition-colors"
              title="Salin spesifikasi part, mold & dimensi untuk shift baru (reset hitungan OK/NG)"
            >
              <Copy className="w-4 h-4 text-indigo-600" />
              <span>Salin untuk Shift Baru</span>
            </button>

            <button
              type="button"
              onClick={onOpenSavedListModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-colors"
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Daftar Tersimpan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Bar (Export to PDF, CSV, Architecture) */}
      <div className="no-print bg-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="text-sm font-bold flex items-center gap-2">
            <span>Ekspor Dokumen & Arsitektur Sistem</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Unduh laporan ke format siap cetak standar industri manufaktur atau lihat skema database
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSaveModal}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            Simpan Laporan
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-xs active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan / PDF
          </button>

          <button
            type="button"
            onClick={() => exportReportToCSV(report)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-xs active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor Excel (CSV)
          </button>

          <button
            type="button"
            onClick={() => exportReportToJSON(report)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            JSON
          </button>

          <button
            type="button"
            onClick={onOpenSchemaModal}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-xs"
          >
            <Database className="w-4 h-4" />
            Skema Database & Arsitektur
          </button>
        </div>
      </div>
    </div>
  );
};
