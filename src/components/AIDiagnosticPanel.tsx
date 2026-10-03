import React, { useState } from 'react';
import { QCReport } from '../types/qc';
import {
  Sparkles,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wrench,
  BookOpen,
  ArrowRight,
  ClipboardCheck,
  Check,
  RotateCw,
  Zap,
} from 'lucide-react';

interface Props {
  report: QCReport;
  onApplyJustification?: (notes: string, correctiveAction: string) => void;
}

interface DiagnosticResult {
  recommendationStatus: 'PASS' | 'CONDITIONAL_PASS' | 'REJECT';
  recommendationTitle: string;
  confidenceScore: number;
  rootCauseLocation: string;
  machineAnalysis: string;
  operatorActionSteps: string[];
  extruderKnowledgeTip: string;
  formalJustification: string;
}

export const AIDiagnosticPanel: React.FC<Props> = ({ report, onApplyJustification }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appliedToast, setAppliedToast] = useState(false);

  const handleRunDiagnostic = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/qc-ai-diagnostic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ report }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal berkomunikasi dengan server AI.');
      }

      const data: DiagnosticResult = await response.json();
      setDiagnostic(data);
    } catch (err: any) {
      console.error('Diagnostic error:', err);
      setError(err.message || 'Terjadi kesalahan saat memproses diagnosa AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToNotes = () => {
    if (!diagnostic || !onApplyJustification) return;
    const noteText = `[Justifikasi AI] ${diagnostic.recommendationTitle} (${diagnostic.confidenceScore}% keyakinan). ${diagnostic.formalJustification}`;
    const actionText = `[Aksi Mesin Extruder - Lokasi: ${diagnostic.rootCauseLocation}]: ${diagnostic.operatorActionSteps.join('; ')}`;
    onApplyJustification(noteText, actionText);
    setAppliedToast(true);
    setTimeout(() => setAppliedToast(false), 3000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          title: 'REKOMENDASI: LOT DILOLOSKAN (RELEASE)',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        };
      case 'CONDITIONAL_PASS':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          title: 'REKOMENDASI: LOLOS BERSYARAT (CONDITIONAL / REWORK)',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        };
      case 'REJECT':
      default:
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          title: 'REKOMENDASI: LOT DITAHAN (HOLD / REJECT)',
          icon: <XCircle className="w-5 h-5 text-rose-400" />,
        };
    }
  };

  return (
    <div id="section-ai-diagnostic" className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-4 sm:p-6 mb-6 shadow-xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight">
                Diagnostik & Justifikasi Status Otomatis AI
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Pakar Ekstrusi Plastik
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Menganalisis anomali ketebalan, mendeteksi titik kerusakan mesin extruder, dan mengevaluasi kelayakan pelepasan lot PT Camiloplas Jaya Makmur
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={handleRunDiagnostic}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
        >
          {isLoading ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin text-white" />
              <span>Menganalisis Mesin Extruder...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{diagnostic ? 'Perbarui Analisis AI' : 'Jalankan Diagnostik AI'}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Initial state before user runs AI */}
      {!diagnostic && !isLoading && (
        <div className="py-6 text-center text-slate-400 space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-blue-400">
            <Zap className="w-6 h-6" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-300">
            AI siap memeriksa seluruh data dimensi micrometer, kestabilan arah lebar/panjang, dan defect roll.
          </p>
          <p className="text-[11px] text-slate-500 max-w-lg mx-auto">
            Klik tombol di atas untuk mendapatkan diagnosa titik kerusakan baut die lip, kondisi roll kalender, serta rekomendasi pelepasan lot standar ISO.
          </p>
        </div>
      )}

      {/* Loading state skeleton */}
      {isLoading && (
        <div className="py-8 space-y-3 animate-pulse">
          <div className="h-10 bg-slate-800 rounded-xl w-3/4 mx-auto" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <div className="h-24 bg-slate-800 rounded-xl" />
            <div className="h-24 bg-slate-800 rounded-xl" />
          </div>
          <div className="h-20 bg-slate-800 rounded-xl" />
        </div>
      )}

      {/* Diagnostic Results Card */}
      {diagnostic && !isLoading && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Status Verdict Header Banner */}
          {(() => {
            const badge = getStatusBadge(diagnostic.recommendationStatus);
            return (
              <div
                className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${badge.bg}`}
              >
                <div className="flex items-center gap-2.5">
                  {badge.icon}
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wider">
                      {badge.title}
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-white">
                      {diagnostic.recommendationTitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right sm:border-r border-slate-700/60 pr-3">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Keyakinan AI</span>
                    <strong className="text-sm font-mono font-black text-white">
                      {diagnostic.confidenceScore}%
                    </strong>
                  </div>

                  {onApplyJustification && (
                    <button
                      type="button"
                      onClick={handleApplyToNotes}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
                    >
                      {appliedToast ? <Check className="w-3.5 h-3.5" /> : <ClipboardCheck className="w-3.5 h-3.5" />}
                      <span>{appliedToast ? 'Tersimpan ke QC!' : 'Terapkan ke Catatan QC'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Grid: Root Cause Location & Machine Mechanics Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. Lokasi Kerusakan / Sumber Masalah Mesin */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
                <Wrench className="w-4 h-4" />
                <span className="uppercase tracking-wider">Lokasi Masalah pada Mesin Extruder:</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-white font-bold text-sm font-mono">
                {diagnostic.rootCauseLocation}
              </div>
              <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                {diagnostic.machineAnalysis}
              </p>
            </div>

            {/* 2. Tindakan Perbaikan Operator / Teknisi */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-2">
                <ArrowRight className="w-4 h-4" />
                <span className="uppercase tracking-wider">Langkah Koreksi Teknisi di Mesin:</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {diagnostic.operatorActionSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-mono text-blue-400 font-bold shrink-0">
                      {idx + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Extruder Engineering Learning Card */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-indigo-500/30">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-1.5">
              <BookOpen className="w-4 h-4" />
              <span className="uppercase tracking-wider">
                Edukasi & Pembelajaran Mesin Extruder Plastik:
              </span>
            </div>
            <p className="text-xs text-slate-300 italic leading-relaxed">
              "{diagnostic.extruderKnowledgeTip}"
            </p>
          </div>

          {/* Formal Justification Text Box */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Teks Justifikasi Mutu (Untuk Audit & Lembar Sah):
            </span>
            <div className="text-slate-300 font-mono text-[11px] bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              {diagnostic.formalJustification}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
