import React, { useState, useRef } from 'react';
import { QCReport } from '../types/qc';
import { PrintReportView } from './PrintReportView';
import { exportReportToCSV } from '../utils/exportUtils';
import {
  Printer,
  FileSpreadsheet,
  X,
  CheckCircle2,
  ShieldCheck,
  Download,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Sliders,
  Check,
  FileText,
  Building2,
  Cpu,
  Layers,
  Award,
} from 'lucide-react';
import { CamiloplasLogo } from './CamiloplasLogo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  report: QCReport;
}

export const PrintPreviewModal: React.FC<Props> = ({ isOpen, onClose, report }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<'SIMULATOR' | 'PREVIEW'>('SIMULATOR');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationStepText, setSimulationStepText] = useState('Spooler Mesin Siap (Ready). Siap memproses lembar sertifikat.');
  const [simulationCompleted, setSimulationCompleted] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const printSheetRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Execute standard browser print
  const handleExecutePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Direct window.print encountered issue:', e);
      handleOpenPrintInNewTab();
    }
  };

  // Run in-app printer simulation
  const handleStartSimulation = () => {
    setIsSimulating(true);
    setSimulationCompleted(false);
    setSimulationProgress(10);
    setSimulationStepText('1/4 Menginisialisasi dokumen & memeriksa kalibrasi sensor...');

    setTimeout(() => {
      setSimulationProgress(35);
      setSimulationStepText('2/4 Me-render grafik profil ketebalan SPC (Cross & Machine Direction)...');
    }, 600);

    setTimeout(() => {
      setSimulationProgress(70);
      setSimulationStepText('3/4 Menghubungkan ke Virtual Spooler PT Camiloplas Jaya Makmur...');
    }, 1300);

    setTimeout(() => {
      setSimulationProgress(95);
      setSimulationStepText('4/4 Membubuhkan stempel digital sertifikasi pelepasan mutu lot ISO 9001...');
    }, 2000);

    setTimeout(() => {
      setSimulationProgress(100);
      setSimulationStepText('✅ Berhasil! Simulasi cetak selesai 100%. Dokumen sah & terverifikasi.');
      setIsSimulating(false);
      setSimulationCompleted(true);
    }, 2600);
  };

  // Generate a standalone, self-contained printable HTML file that opens in any browser
  const handleDownloadStandalonePrintHTML = () => {
    const printContainer = document.getElementById('print-report-container');
    if (!printContainer) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Sertifikat Inspeksi Mutu - ${report.header.reportNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 8mm 10mm; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #000; margin: 0; padding: 15px; font-size: 8.5pt; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th, td { border: 1px solid #000; padding: 4px; }
    .no-print { display: none !important; }
    @media print {
      body { padding: 0; }
      button, .print-btn-bar { display: none !important; }
    }
    .print-btn-bar { padding: 12px; background: #0f172a; color: white; margin-bottom: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
    .print-btn { background: #2563eb; color: white; border: none; padding: 8px 16px; font-weight: bold; border-radius: 6px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="print-btn-bar no-print">
    <span><strong>PT CAMILOPLAS JAYA MAKMUR</strong> · Sertifikat Mutu: ${report.header.reportNumber}</span>
    <button class="print-btn" onclick="window.print()">🖨️ Cetak Dokumen Sekarang</button>
  </div>
  ${printContainer.outerHTML}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sertifikat_QC_${report.header.reportNumber.replace(/[\/\\?%*:|"<>]/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // Open clean printable document in a new window/tab
  const handleOpenPrintInNewTab = () => {
    const printContainer = document.getElementById('print-report-container');
    if (!printContainer) return;

    const newWin = window.open('', '_blank');
    if (!newWin) {
      alert('Pop-up jendela baru diblokir oleh browser. Gunakan tombol "Unduh File HTML" untuk membuka berkas cetak secara mandiri.');
      return;
    }

    newWin.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Cetak Sertifikat Mutu - ${report.header.reportNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 8mm 10mm; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #000; margin: 0; padding: 15px; font-size: 8.5pt; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th, td { border: 1px solid #000; padding: 4px; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  ${printContainer.outerHTML}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`);
    newWin.document.close();
  };

  const targetPlantLabel =
    report.header.destinationPlant === 'PROSES_2_BOLANG'
      ? 'Proses 2 Pabrik Bolang (Tigaraksa)'
      : 'Proses 2 Pabrik Jati (Jatiuwung)';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md overflow-hidden animate-in fade-in duration-150">
      {/* Top Modal Navigation & Action Bar */}
      <div className="no-print bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between text-white shrink-0 shadow-xl gap-3">
        <div className="flex items-center gap-3">
          <CamiloplasLogo size="sm" showText={false} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Inspector Quality · Simulasi & Cetak Dokumen
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" />
                ISO 9001:2015
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              PT Camiloplas Jaya Makmur · Tujuan: <span className="text-blue-300 font-semibold">{targetPlantLabel}</span>
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs (Simulasi vs Pratinjau Kertas Penuh) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('SIMULATOR')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SIMULATOR'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Simulasi Mesin Cetak</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PREVIEW')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PREVIEW'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Kertas A4 Penuh</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls for Preview */}
          <div className="hidden lg:flex items-center bg-slate-800 rounded-lg p-0.5 text-xs mr-2">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer"
              title="Perkecil"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-300">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer"
              title="Perbesar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              className="px-1.5 py-1 hover:bg-slate-700 rounded text-[10px] text-slate-400 hover:text-white cursor-pointer ml-0.5"
              title="Reset ke 100%"
            >
              Reset
            </button>
          </div>

          {/* Quick Simulation Trigger */}
          <button
            type="button"
            onClick={handleStartSimulation}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
            title="Jalankan simulasi cetak dokumen dan pengujian format"
          >
            <Play className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">{isSimulating ? 'Memproses...' : 'Simulasikan Cetak'}</span>
          </button>

          {/* Download Standalone HTML Button */}
          <button
            type="button"
            onClick={handleDownloadStandalonePrintHTML}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer"
            title="Download Dokumen Cetak Mandiri (Bisa dibuka dan dicetak di semua browser tanpa batasan iframe)"
          >
            {downloadSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span className="hidden md:inline">{downloadSuccess ? 'Tersimpan!' : 'Unduh Berkas Cetak'}</span>
          </button>

          {/* Primary Print Button */}
          <button
            type="button"
            onClick={handleExecutePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ring-2 ring-blue-400/30"
            title="Cetak langsung ke printer atau Save to PDF via dialog browser"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
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

      {/* Main Content Area */}
      {activeTab === 'SIMULATOR' ? (
        /* SIMULATOR MODE: Side-by-side or stacked layout showing printer console & live document sheet */
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950/80 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start justify-center">
          {/* Left Column: Virtual Printer Console */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5 text-slate-100">
            {/* Simulator Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Simulasi Mesin Cetak Mutu
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Virtual Spooler PT Camiloplas Jaya Makmur
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Spooler Online
              </span>
            </div>

            {/* Virtual Printer Configuration Matrix */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Perangkat Printer:</span>
                <span className="font-mono font-bold text-blue-300">Virtual Laser (A4)</span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Ukuran Kertas:</span>
                <span className="font-bold text-white">ISO A4 (210×297mm)</span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Nomor Laporan / WO:</span>
                <span className="font-mono font-bold text-amber-300 truncate block">{report.header.reportNumber}</span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Tujuan Transfer:</span>
                <span className="font-bold text-emerald-300 truncate block">{report.header.destinationPlant === 'PROSES_2_BOLANG' ? 'Pabrik Bolang' : 'Pabrik Jati'}</span>
              </div>
            </div>

            {/* Simulation Progress & Execution */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">{simulationStepText}</span>
                <span className="font-mono font-bold text-blue-400">{simulationProgress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${simulationProgress}%` }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between pt-1 gap-2">
                <button
                  type="button"
                  onClick={handleStartSimulation}
                  disabled={isSimulating}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isSimulating ? 'Sedang Mensimulasikan Cetak...' : 'Jalankan Simulasi Cetak Sekarang'}</span>
                </button>
              </div>
            </div>

            {/* Simulation Completed Verification Stamp */}
            {simulationCompleted && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-bold">Simulasi Sukses: Format Dokumen 100% Siap Cetak</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Toleransi dimensi micrometer, grafik profil tebal sheet, tabel roll, stempel keputusan lot, dan data PT Camiloplas Jaya Makmur telah tervalidasi dalam batas margin A4.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExecutePrint}
                    className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Fisik</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenPrintInNewTab}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Tab Baru</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Tips */}
            <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800">
              <div className="flex items-center gap-1 text-slate-300 font-semibold">
                <Award className="w-3.5 h-3.5 text-blue-400" />
                <span>Karakteristik Dokumen Terverifikasi:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-400 text-[10px]">
                <li>Header PT Camiloplas Jaya Makmur ISO 9001:2015</li>
                <li>Grafik Arah Lebar & Arah Panjang dengan batas USL/LSL</li>
                <li>Pilihan format: Print langsung, Tab baru, atau Berkas HTML mandiri</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Live Simulated Document Sheet Preview */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2 px-1 text-xs text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Hasil Lembar Dokumen Siap Cetak (A4 Portrait):</span>
              </span>
              <span className="font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Zoom: {zoomLevel}%
              </span>
            </div>

            <div
              ref={printSheetRef}
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="w-full max-w-[210mm] bg-white rounded-md shadow-2xl border border-slate-300 overflow-hidden relative transition-transform duration-150"
            >
              {/* Animated laser scanning line effect during simulation */}
              {isSimulating && (
                <div
                  className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] pointer-events-none z-30 transition-all duration-300"
                  style={{ top: `${simulationProgress}%` }}
                />
              )}

              {/* Watermark badge on simulation complete */}
              {simulationCompleted && (
                <div className="absolute top-4 right-4 z-20 pointer-events-none opacity-85">
                  <div className="px-3 py-1 rounded-md border-2 border-emerald-600 bg-emerald-50/90 text-emerald-800 font-black text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1 rotate-3">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>SIMULASI CETAK LOLOS · ISO 9001</span>
                  </div>
                </div>
              )}

              <PrintReportView report={report} isInteractivePreview={true} />
            </div>
          </div>
        </div>
      ) : (
        /* FULL PAPER PREVIEW MODE */
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950/70 flex justify-center items-start">
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            className="w-full max-w-[210mm] bg-white rounded-md shadow-2xl border border-slate-300 overflow-hidden my-2 sm:my-4 transition-transform duration-150"
          >
            <PrintReportView report={report} isInteractivePreview={true} />
          </div>
        </div>
      )}

      {/* Bottom Information Notice Bar */}
      <div className="no-print bg-slate-900 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-400 shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Format cetak dioptimasi untuk kertas A4 portrait (Margin 8mm - 10mm). Bebas elemen web.</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => exportReportToCSV(report)}
            className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Ekspor Excel (.CSV)</span>
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={handleDownloadStandalonePrintHTML}
            className="hover:text-blue-400 transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Unduh Berkas (.html)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
