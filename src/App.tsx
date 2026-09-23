import React, { useState, useEffect } from 'react';
import { QCReport, DefectItem, DimensionSampleRow, ProductionSummary, ShiftType } from './types/qc';
import {
  createDefaultExtruderReport,
  createProses2Report,
  createBlankReport,
} from './utils/sampleData';
import { evaluateProductionSummary } from './utils/calculations';
import {
  getAllSavedReports,
  SavedReportItem,
  createDuplicateForNewInspection,
} from './utils/storageUtils';
import { HeaderMetadataForm } from './components/HeaderMetadataForm';
import { MoldCavityConfig } from './components/MoldCavityConfig';
import { DefectChecklistForm } from './components/DefectChecklistForm';
import { CriticalDimensionsTable } from './components/CriticalDimensionsTable';
import { ExtruderGraphicalReport } from './components/ExtruderGraphicalReport';
import { RollProductionForm } from './components/RollProductionForm';
import { DashboardAnalytics } from './components/DashboardAnalytics';
import { QCReportSummary } from './components/QCReportSummary';
import { DatabaseSchemaModal } from './components/DatabaseSchemaModal';
import { PrintReportView } from './components/PrintReportView';
import { SaveReportModal } from './components/SaveReportModal';
import { SavedReportsModal } from './components/SavedReportsModal';
import {
  ClipboardCheck,
  BarChart3,
  FileSpreadsheet,
  Printer,
  Database,
  RotateCcw,
  Sparkles,
  Info,
  Save,
  Layers,
  Copy,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';
import { exportReportToCSV } from './utils/exportUtils';

export default function App() {
  const [report, setReport] = useState<QCReport>(createBlankReport());
  const [activeTab, setActiveTab] = useState<'FORM' | 'ANALYTICS' | 'SUMMARY'>('FORM');
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isSavedListModalOpen, setIsSavedListModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReportItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Smooth scroll to section helper for mobile
  const scrollToSection = (sectionId: string) => {
    setActiveTab('FORM');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Initialize saved reports from storage on mount
  useEffect(() => {
    const items = getAllSavedReports();
    setSavedReports(items);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const refreshSavedList = () => {
    setSavedReports(getAllSavedReports());
  };

  const handleSaveSuccess = (savedReport: QCReport, isTemplate: boolean, msg: string) => {
    setReport(savedReport);
    refreshSavedList();
    showToast(msg);
  };

  const handleLoadReport = (loadedReport: QCReport) => {
    setReport(loadedReport);
    setActiveTab('FORM');
    showToast(`Laporan ${loadedReport.header.reportNumber} berhasil dimuat.`);
  };

  const handleUseAsTemplate = (sourceReport: QCReport, newShift?: ShiftType) => {
    const duplicated = createDuplicateForNewInspection(sourceReport, newShift);
    setReport(duplicated);
    setActiveTab('FORM');
    showToast(
      `Template dimuat! Laporan baru ${duplicated.header.reportNumber} dibuat dan siap untuk inspeksi shift baru.`
    );
  };

  const handleDuplicateCurrentForNewShift = () => {
    const duplicated = createDuplicateForNewInspection(report);
    setReport(duplicated);
    setActiveTab('FORM');
    showToast(
      `Salinan baru ${duplicated.header.reportNumber} dibuat dengan spesifikasi mold & dimensi yang sama untuk shift berikutnya.`
    );
  };

  // Recalculate production summary automatically whenever dependencies change
  const triggerAutoEvaluation = (
    defects: DefectItem[],
    partialProduction: Partial<ProductionSummary>,
    dimensions: DimensionSampleRow[],
    mold = report.moldSetup
  ) => {
    const totalNg = defects.reduce((sum, d) => sum + d.count, 0);
    const totalOk = partialProduction.totalOk ?? report.production.totalOk;
    const totalRework = partialProduction.totalRework ?? report.production.totalRework;
    const warnThresh = partialProduction.rejectionThresholdWarn ?? report.production.rejectionThresholdWarn;
    const failThresh = partialProduction.rejectionThresholdFail ?? report.production.rejectionThresholdFail;

    const newProdSummary = evaluateProductionSummary(
      totalOk,
      totalNg,
      totalRework,
      warnThresh,
      failThresh,
      dimensions,
      mold
    );

    return newProdSummary;
  };

  // Header update
  const handleHeaderChange = (header: QCReport['header']) => {
    setReport((prev) => ({ ...prev, header, updatedAt: new Date().toISOString() }));
  };

  // Mold setup update
  const handleMoldSetupChange = (moldSetup: QCReport['moldSetup']) => {
    setReport((prev) => {
      const updatedProduction = triggerAutoEvaluation(
        prev.defects,
        prev.production,
        prev.criticalDimensions,
        moldSetup
      );
      return {
        ...prev,
        moldSetup,
        production: updatedProduction,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Defects update
  const handleDefectsChange = (defects: DefectItem[]) => {
    setReport((prev) => {
      const updatedProduction = triggerAutoEvaluation(
        defects,
        prev.production,
        prev.criticalDimensions,
        prev.moldSetup
      );
      return {
        ...prev,
        defects,
        production: updatedProduction,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Production quantities change
  const handleProductionChange = (partial: Partial<ProductionSummary>) => {
    setReport((prev) => {
      const updatedProduction = triggerAutoEvaluation(
        prev.defects,
        partial,
        prev.criticalDimensions,
        prev.moldSetup
      );
      return {
        ...prev,
        production: updatedProduction,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Dimensions change
  const handleDimensionsChange = (criticalDimensions: DimensionSampleRow[]) => {
    setReport((prev) => {
      const updatedProduction = triggerAutoEvaluation(
        prev.defects,
        prev.production,
        criticalDimensions,
        prev.moldSetup
      );
      return {
        ...prev,
        criticalDimensions,
        production: updatedProduction,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Notes & corrective action change
  const handleNotesChange = (notes: string, correctiveAction: string) => {
    setReport((prev) => ({
      ...prev,
      notes,
      correctiveAction,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Approval change
  const handleApprovalChange = (approvedBy: string) => {
    setReport((prev) => ({
      ...prev,
      approvedBy,
      approvalDate: new Date().toLocaleDateString('id-ID'),
      updatedAt: new Date().toISOString(),
    }));
  };

  // Load Preset
  const loadPreset = (type: 'EXTRUDER' | 'PROSES_2' | 'BLANK') => {
    if (type === 'EXTRUDER') {
      setReport(createDefaultExtruderReport());
    } else if (type === 'PROSES_2') {
      setReport(createProses2Report());
    } else {
      setReport(createBlankReport());
    }
    setActiveTab('FORM');
    showToast(
      type === 'EXTRUDER'
        ? 'Preset Extruder dimuat.'
        : type === 'PROSES_2'
        ? 'Preset Proses 2 dimuat.'
        : 'Form QC Kosong siap diisi.'
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-28 sm:pb-16">
      {/* Top Application Navbar */}
      <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-xs shrink-0">
                <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                    QC-SYSTEM
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                    QC Mobile
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 hidden sm:block">
                  Laporan Kualitas Extruder & Proses 2
                </div>
              </div>
            </div>

            {/* Template Presets & Action Buttons Container (Desktop & Tablet) */}
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
              <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                <span className="text-slate-500 px-2 font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Preset:
                </span>
                <button
                  type="button"
                  onClick={() => loadPreset('EXTRUDER')}
                  className="px-2.5 py-1 rounded bg-white text-slate-800 font-semibold shadow-2xs hover:text-blue-600"
                >
                  Extruder
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('PROSES_2')}
                  className="px-2.5 py-1 rounded bg-white text-slate-800 font-semibold shadow-2xs hover:text-blue-600"
                >
                  Proses 2
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('BLANK')}
                  className="px-2 py-1 rounded hover:bg-white text-slate-600"
                  title="Form Kosong"
                >
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                  Kosong
                </button>
              </div>

              {/* Primary Save Action */}
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-all active:scale-95"
                title="Simpan Laporan Saat Ini atau Jadikan Template Master"
              >
                <Save className="w-4 h-4" />
                <span>Simpan</span>
              </button>

              {/* Saved Reports & Templates Library */}
              <button
                type="button"
                onClick={() => setIsSavedListModalOpen(true)}
                className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/90 rounded-lg shadow-2xs transition-colors"
                title="Buka Daftar Laporan & Template Tersimpan"
              >
                <Layers className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Tersimpan</span>
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white">
                  {savedReports.length}
                </span>
              </button>

              {/* Duplicate for New Shift */}
              <button
                type="button"
                onClick={handleDuplicateCurrentForNewShift}
                className="hidden xl:flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                title="Salin part, mold & spesifikasi dimensi untuk shift/lot baru"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Shift Baru</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                title="Cetak Laporan Standar ISO"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Cetak</span>
              </button>

              <button
                type="button"
                onClick={() => exportReportToCSV(report)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-2xs transition-colors"
                title="Download file Excel (.csv)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSchemaModalOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                title="Lihat Arsitektur & Skema Database"
              >
                <Database className="w-4 h-4 text-slate-500" />
                <span className="hidden lg:inline">Skema DB</span>
              </button>
            </div>

            {/* Mobile Header Quick Buttons */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg shadow-2xs active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                title="Menu Lengkap"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive Navigation Tabs (Desktop & Tablet) */}
          <div className="hidden sm:flex items-center border-t border-slate-100 space-x-1 sm:space-x-3 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('FORM')}
              className={`py-2 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'FORM'
                  ? 'border-blue-600 text-blue-700 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Form QC Extruder</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ANALYTICS')}
              className={`py-2 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'ANALYTICS'
                  ? 'border-blue-600 text-blue-700 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Laporan Grafik Ketebalan (SPC)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SUMMARY')}
              className={`py-2 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'SUMMARY'
                  ? 'border-blue-600 text-blue-700 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Ringkasan & Approval Sign-off</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="no-print max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* Quick KPI Strip Banner */}
        <div className="mb-4 sm:mb-6 bg-slate-900 text-white rounded-xl p-3 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Laporan QC Otomatis</div>
              <div className="text-xs sm:text-sm font-mono font-bold text-white">
                {report.header.reportNumber || '-'}
              </div>
            </div>
            <div className="h-7 sm:h-8 w-px bg-slate-800" />
            <div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Nomor LOT</div>
              <div className="text-xs sm:text-sm font-mono font-semibold text-blue-300">
                {report.header.partNumber || '-'}
              </div>
            </div>
            <div className="h-7 sm:h-8 w-px bg-slate-800 hidden sm:block" />
            <div className="hidden sm:block">
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Mesin & SPK</div>
              <div className="text-xs sm:text-sm text-slate-200">
                {report.header.machineName || '-'} · <span className="font-mono text-blue-300">{report.header.workOrderNumber || '-'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            <div className="text-right">
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Hasil Produksi Roll</div>
              <div className="text-xs sm:text-sm font-mono font-bold text-slate-100">
                OK: {report.production.totalOk} Roll | NG: {report.production.totalNg} Roll
              </div>
            </div>

            <div
              className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-black tracking-wider uppercase ${
                report.production.status === 'PASS'
                  ? 'bg-emerald-500 text-slate-950'
                  : report.production.status === 'CONDITIONAL_PASS'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {report.production.status} ({report.production.rejectionRatePct}%)
            </div>
          </div>
        </div>

        {/* Smartphone Section Navigation Pills (Quick Horizontal Scroll on Mobile) */}
        {activeTab === 'FORM' && (
          <div className="sm:hidden mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => scrollToSection('section-dimensions')}
              className="shrink-0 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 active:bg-blue-50 active:text-blue-700 shadow-2xs"
            >
              📏 Pengukuran Tebal & Lebar
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('section-graph-report')}
              className="shrink-0 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 active:bg-blue-50 active:text-blue-700 shadow-2xs"
            >
              📊 Laporan Grafik
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('section-summary')}
              className="shrink-0 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 active:bg-blue-50 active:text-blue-700 shadow-2xs"
            >
              ✅ Approval Sign-off
            </button>
          </div>
        )}

        {/* Tab 1: Form Input QC Extruder */}
        {activeTab === 'FORM' && (
          <div className="space-y-6">
            {/* 1. Header & SPK Metadata */}
            <HeaderMetadataForm header={report.header} onChange={handleHeaderChange} />

            {/* Extruder Process: Cavity & Defect Checklist are REMOVED per user request */}
            {report.header.processType === 'EXTRUDER' ? (
              <>
                {/* 2. Roll Sheet Production Quantities */}
                <div id="section-production">
                  <RollProductionForm
                    production={report.production}
                    onChange={handleProductionChange}
                  />
                </div>

                {/* 3. Critical Dimensions (Ketebalan Arah Lebar & Panjang: Micrometer, Lebar: Meteran Gulung) */}
                <div id="section-dimensions">
                  <CriticalDimensionsTable
                    dimensions={report.criticalDimensions}
                    onChange={handleDimensionsChange}
                  />
                </div>

                {/* 4. Laporan Grafik Profil Ketebalan Roll Sheet (Cross-Direction & Machine-Direction) */}
                <div id="section-graph-report">
                  <ExtruderGraphicalReport
                    dimensions={report.criticalDimensions}
                    nominal={report.criticalDimensions[0]?.nominal ?? 0.50}
                    upperSpecLimit={report.criticalDimensions[0]?.upperSpecLimit ?? 0.53}
                    lowerSpecLimit={report.criticalDimensions[0]?.lowerSpecLimit ?? 0.47}
                    partName={report.header.partName}
                    reportNumber={report.header.reportNumber}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Fallback for Proses 2 (Kiefel & Thermoforming) */}
                <MoldCavityConfig
                  moldSetup={report.moldSetup}
                  processType={report.header.processType}
                  onChange={handleMoldSetupChange}
                />
                <DefectChecklistForm
                  defects={report.defects}
                  production={report.production}
                  totalCavities={report.moldSetup.totalCavities}
                  processType={report.header.processType}
                  onDefectsChange={handleDefectsChange}
                  onProductionChange={handleProductionChange}
                />
                <div id="section-dimensions">
                  <CriticalDimensionsTable
                    dimensions={report.criticalDimensions}
                    onChange={handleDimensionsChange}
                  />
                </div>
              </>
            )}

            {/* 5. Summary, Notes, CAPA & Signoff */}
            <div id="section-summary">
              <QCReportSummary
                report={report}
                onNotesChange={handleNotesChange}
                onApprovalChange={handleApprovalChange}
                onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
                onPrint={handlePrint}
                onOpenSaveModal={() => setIsSaveModalOpen(true)}
                onOpenSavedListModal={() => setIsSavedListModalOpen(true)}
                onDuplicateForNewShift={handleDuplicateCurrentForNewShift}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Laporan Grafik & Analytics */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-6">
            <DashboardAnalytics
              dimensions={report.criticalDimensions}
              production={report.production}
              partName={report.header.partName}
              reportNumber={report.header.reportNumber}
            />

            <ExtruderGraphicalReport
              dimensions={report.criticalDimensions}
              nominal={report.criticalDimensions[0]?.nominal ?? 0.50}
              upperSpecLimit={report.criticalDimensions[0]?.upperSpecLimit ?? 0.53}
              lowerSpecLimit={report.criticalDimensions[0]?.lowerSpecLimit ?? 0.47}
              partName={report.header.partName}
              reportNumber={report.header.reportNumber}
            />

            {/* Action Bar from Analytics view */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Ingin mengubah titik sampel pengukuran atau jumlah roll?
                </h3>
                <p className="text-xs text-slate-500">
                  Semua grafik profil ketebalan dihitung secara realtime dari input micrometer dan meteran gulung
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('FORM')}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
              >
                Kembali ke Form Input
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Summary & Action Bar */}
        {activeTab === 'SUMMARY' && (
          <div className="space-y-6">
            <QCReportSummary
              report={report}
              onNotesChange={handleNotesChange}
              onApprovalChange={handleApprovalChange}
              onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
              onPrint={handlePrint}
              onOpenSaveModal={() => setIsSaveModalOpen(true)}
              onOpenSavedListModal={() => setIsSavedListModalOpen(true)}
              onDuplicateForNewShift={handleDuplicateCurrentForNewShift}
            />

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-2">
                Pemeriksaan Status Sebelum Rilis Produk (Release Gate)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-1">
                    1. Rejection Rate Check
                  </span>
                  <span
                    className={
                      report.production.rejectionRatePct <= report.production.rejectionThresholdWarn
                        ? 'text-emerald-700 font-bold'
                        : 'text-rose-700 font-bold'
                    }
                  >
                    {report.production.rejectionRatePct}% (Batas:{' '}
                    {report.production.rejectionThresholdWarn}%)
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-1">
                    2. Toleransi Dimensi SPC
                  </span>
                  <span
                    className={
                      report.criticalDimensions.every((d) => d.isAllInSpec)
                        ? 'text-emerald-700 font-bold'
                        : 'text-rose-700 font-bold'
                    }
                  >
                    {report.criticalDimensions.every((d) => d.isAllInSpec)
                      ? '100% In-Spec'
                      : 'Terdapat Out-of-Spec'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-1">
                    3. Kesiapan Cetak Dokumen
                  </span>
                  <span className="text-blue-700 font-bold">
                    Standar ISO 9001 / IATF 16949 Siap
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE STICKY BOTTOM NAVIGATION BAR (Thumb-friendly on Android) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 flex justify-around items-center shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('FORM')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-bold ${
            activeTab === 'FORM' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <ClipboardCheck className="w-5 h-5 mb-0.5" />
          <span>Form QC</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ANALYTICS')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-bold ${
            activeTab === 'ANALYTICS' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span>Grafik SPC</span>
        </button>

        {/* Floating Thumb Save Button */}
        <button
          type="button"
          onClick={() => setIsSaveModalOpen(true)}
          className="flex flex-col items-center justify-center -mt-4 bg-blue-600 text-white w-12 h-12 rounded-full shadow-lg active:scale-95 transition-transform"
          title="Simpan Laporan"
        >
          <Save className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SUMMARY')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-bold ${
            activeTab === 'SUMMARY' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <Info className="w-5 h-5 mb-0.5" />
          <span>Ringkasan</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSavedListModalOpen(true)}
          className="flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-bold text-slate-500 relative"
        >
          <div className="relative">
            <Layers className="w-5 h-5 mb-0.5" />
            {savedReports.length > 0 && (
              <span className="absolute -top-1 -right-2 px-1 rounded-full text-[9px] bg-indigo-600 text-white font-extrabold">
                {savedReports.length}
              </span>
            )}
          </div>
          <span>Tersimpan</span>
        </button>
      </nav>

      {/* MOBILE ACTIONS BOTTOM SHEET / DRAWER */}
      {isMobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-extrabold text-sm text-slate-900">
                Menu & Aksi QC Lengkap
              </span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets */}
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Pilih Preset Part / Mesin:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    loadPreset('EXTRUDER');
                  }}
                  className="p-2.5 text-left border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100"
                >
                  <div className="text-xs font-bold text-slate-900">Extruder</div>
                  <div className="text-[10px] text-slate-500">Micrometer & Meteran</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    loadPreset('PROSES_2');
                  }}
                  className="p-2.5 text-left border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100"
                >
                  <div className="text-xs font-bold text-slate-900">Proses 2</div>
                  <div className="text-[10px] text-slate-500">Stasiun Lanjutan</div>
                </button>
              </div>
            </div>

            {/* Quick Actions List */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleDuplicateCurrentForNewShift();
                }}
                className="w-full flex items-center gap-3 p-3 text-left rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800"
              >
                <Copy className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <div>Salin untuk Shift Baru</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    Gunakan spesifikasi mold & dimensi yang sama untuk shift berikutnya
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handlePrint();
                }}
                className="w-full flex items-center gap-3 p-3 text-left rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800"
              >
                <Printer className="w-4 h-4 text-slate-600 shrink-0" />
                <div>
                  <div>Cetak / Simpan PDF</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    Format cetak resmi ISO 9001 / IATF 16949
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  exportReportToCSV(report);
                }}
                className="w-full flex items-center gap-3 p-3 text-left rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-emerald-800"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div>Download File Excel (.CSV)</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    Export data produksi, cacat, dan dimensi SPC
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSchemaModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 text-left rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700"
              >
                <Database className="w-4 h-4 text-slate-600 shrink-0" />
                <div>
                  <div>Arsitektur & Skema Database</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    Dokumentasi relasional SQL & JSON payload
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Print View (Only rendered during physical/PDF printing) */}
      <PrintReportView report={report} />

      {/* Database Schema & System Architecture Modal */}
      <DatabaseSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />

      {/* Save Report & Template Modal */}
      <SaveReportModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        report={report}
        existingSavedItem={savedReports.find((s) => s.id === report.id)}
        onSavedSuccess={handleSaveSuccess}
      />

      {/* Saved Reports & Master Templates Library Modal */}
      <SavedReportsModal
        isOpen={isSavedListModalOpen}
        onClose={() => setIsSavedListModalOpen(false)}
        savedItems={savedReports}
        currentReportId={report.id}
        onLoadReport={handleLoadReport}
        onUseAsTemplate={handleUseAsTemplate}
        onRefreshSavedList={refreshSavedList}
        onQuickPrint={(rep) => {
          setReport(rep);
          setTimeout(() => window.print(), 200);
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed bottom-20 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-200 flex-1">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
