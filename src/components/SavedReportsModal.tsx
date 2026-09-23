import React, { useState, useMemo, useRef } from 'react';
import { QCReport, ShiftType } from '../types/qc';
import {
  SavedReportItem,
  deleteReportFromStorage,
  createDuplicateForNewInspection,
  exportAllSavedReportsBackup,
  importReportsFromJSON,
} from '../utils/storageUtils';
import { exportReportToCSV } from '../utils/exportUtils';
import {
  X,
  Search,
  Copy,
  FolderOpen,
  Trash2,
  Download,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Printer,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Clock,
  Wrench,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  savedItems: SavedReportItem[];
  currentReportId: string;
  onLoadReport: (report: QCReport) => void;
  onUseAsTemplate: (report: QCReport, newShift?: ShiftType) => void;
  onRefreshSavedList: () => void;
  onQuickPrint: (report: QCReport) => void;
}

export const SavedReportsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  savedItems,
  currentReportId,
  onLoadReport,
  onUseAsTemplate,
  onRefreshSavedList,
  onQuickPrint,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'TEMPLATES' | 'EXTRUDER' | 'PROSES_2'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'CONDITIONAL_PASS' | 'REJECT'>('ALL');
  const [importNotification, setImportNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    return savedItems.filter((item) => {
      const rep = item.report;
      const searchTarget = `${rep.header.reportNumber} ${rep.header.partNumber} ${rep.header.partName} ${rep.header.machineName} ${rep.header.moldDieCode} ${rep.header.customerName} ${item.templateLabel || ''}`.toLowerCase();
      const matchesSearch = searchTarget.includes(searchQuery.toLowerCase().trim());

      // Filter by category
      let matchesCategory = true;
      if (filterType === 'TEMPLATES') {
        matchesCategory = Boolean(item.isTemplate);
      } else if (filterType === 'EXTRUDER') {
        matchesCategory = rep.header.processType === 'EXTRUDER' || rep.header.processType === 'INJECTION_MOLDING';
      } else if (filterType === 'PROSES_2') {
        matchesCategory = rep.header.processType === 'PROSES_2' || rep.header.processType === 'STAMPING_PRESS';
      }

      // Filter by status
      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        matchesStatus = rep.production.status === statusFilter;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [savedItems, searchQuery, filterType, statusFilter]);

  if (!isOpen) return null;

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Hapus laporan/template "${name}" dari penyimpanan lokal?`)) {
      deleteReportFromStorage(id);
      onRefreshSavedList();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importReportsFromJSON(content);
        if (res.success) {
          setImportNotification(`Berhasil mengimpor ${res.count} laporan/template.`);
          onRefreshSavedList();
          setTimeout(() => setImportNotification(null), 4000);
        } else {
          alert(res.error || 'Gagal mengimpor file.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Laporan Tersimpan & Master Template</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {savedItems.length} Tersimpan
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pilih laporan untuk dibuka kembali, atau gunakan sebagai template produksi baru berulang kali.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportAllSavedReportsBackup}
              title="Cadangkan Semua Laporan (Download JSON)"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              Backup Semua
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Impor Backup JSON"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              Impor JSON
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Banner */}
        {importNotification && (
          <div className="bg-emerald-50 text-emerald-800 text-xs px-6 py-2.5 flex items-center justify-between border-b border-emerald-200 font-medium">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {importNotification}
            </span>
            <button
              type="button"
              onClick={() => setImportNotification(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search & Filters Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan Part No, Part Name, No. Laporan, Mesin, Mold..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Type Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterType === 'ALL'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Semua ({savedItems.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('TEMPLATES')}
                className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors ${
                  filterType === 'TEMPLATES'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                Template Master ({savedItems.filter((i) => i.isTemplate).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('EXTRUDER')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterType === 'EXTRUDER'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Extruder
              </button>
              <button
                type="button"
                onClick={() => setFilterType('PROSES_2')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterType === 'PROSES_2'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Proses 2 (Kiefel)
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
            <span className="text-slate-500">Status QC:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Status
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PASS')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  statusFilter === 'PASS' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                PASS
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('CONDITIONAL_PASS')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  statusFilter === 'CONDITIONAL_PASS' ? 'bg-amber-500 text-white' : 'text-amber-700 hover:bg-amber-100'
                }`}
              >
                CONDITIONAL
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('REJECT')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  statusFilter === 'REJECT' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-100'
                }`}
              >
                REJECT
              </button>
            </div>
          </div>
        </div>

        {/* Report List Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">Tidak ada laporan yang sesuai</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchQuery
                  ? 'Coba gunakan kata kunci pencarian yang lain atau reset filter.'
                  : 'Belum ada laporan tersimpan. Simpan laporan aktif untuk menggunakannya kembali.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredItems.map((item) => {
                const rep = item.report;
                const isCurrentActive = rep.id === currentReportId;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrentActive
                        ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                            rep.header.processType === 'INJECTION_MOLDING'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          <Wrench className="w-4 h-4" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            {item.isTemplate ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                TEMPLATE MASTER
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                LAPORAN QC
                              </span>
                            )}

                            <span className="font-mono text-xs font-bold text-slate-900">
                              {rep.header.reportNumber}
                            </span>

                            {isCurrentActive && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                                Sedang Dibuka
                              </span>
                            )}

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                rep.production.status === 'PASS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : rep.production.status === 'CONDITIONAL_PASS'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {rep.production.status} ({rep.production.rejectionRatePct}%)
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-slate-900 mt-1">
                            {item.templateLabel || `${rep.header.partNumber} - ${rep.header.partName}`}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1 font-sans">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {rep.header.inspectionDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {rep.header.shift.replace('_', ' ')}
                            </span>
                            <span>Mesin: <strong className="text-slate-700">{rep.header.machineName}</strong></span>
                            <span>{rep.header.processType === 'EXTRUDER' ? 'Die Lip:' : 'Mold:'} <strong className="text-slate-700">{rep.header.moldDieCode}</strong></span>
                            <span>SPK: <strong className="text-slate-700">{rep.header.workOrderNumber}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Summary Metrics */}
                      <div className="flex items-center gap-4 bg-slate-50 px-3 py-2 rounded-lg text-xs self-start md:self-center">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Part</div>
                          <div className="font-bold text-slate-800 font-mono">
                            {rep.production.totalProduced.toLocaleString()} pcs
                          </div>
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">OK / NG</div>
                          <div className="font-bold text-slate-800 font-mono">
                            <span className="text-emerald-700">{rep.production.totalOk}</span> /{' '}
                            <span className="text-rose-700">{rep.production.totalNg}</span>
                          </div>
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Cavity Aktif</div>
                          <div className="font-bold text-slate-800 font-mono">
                            {rep.moldSetup.activeCavities}/{rep.moldSetup.totalCavities}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-400">
                        Disimpan: {new Date(item.savedAt).toLocaleDateString('id-ID')} · {new Date(item.savedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Primary CTA: Gunakan Template / Buat Salinan Baru */}
                        <button
                          type="button"
                          onClick={() => {
                            onUseAsTemplate(rep);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
                          title="Gunakan spesifikasi mold, part, dan dimensi ini untuk inspeksi shift/WO baru (jumlah produksi di-reset)"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Gunakan Ulang (Shift Baru)</span>
                        </button>

                        {/* Open exact report */}
                        <button
                          type="button"
                          onClick={() => {
                            onLoadReport(rep);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          title="Buka laporan ini persis seperti saat disimpan"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-slate-600" />
                          <span>Buka</span>
                        </button>

                        {/* Quick Print */}
                        <button
                          type="button"
                          onClick={() => onQuickPrint(rep)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Cetak PDF Standar ISO"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Export CSV */}
                        <button
                          type="button"
                          onClick={() => exportReportToCSV(rep)}
                          className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Unduh Excel (CSV)"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.templateLabel || rep.header.reportNumber)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus dari penyimpanan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>
              Data tersimpan aman di browser offline perangkat Anda & dapat diekspor kapan saja.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportAllSavedReportsBackup}
              className="sm:hidden px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium"
            >
              Backup JSON
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
