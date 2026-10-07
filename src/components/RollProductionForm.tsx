import React, { useState } from 'react';
import {
  ProductionSummary,
  ProductionDestination,
  AuthUser,
  AdminOverrideRecord,
  InspectionStatus,
} from '../types/qc';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  ArrowRight,
  RotateCcw,
  MapPin,
  Building2,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { CleanNumberInput } from './common/CleanNumberInput';

interface Props {
  production: ProductionSummary;
  totalRollWeightKg?: number;
  destinationPlant?: ProductionDestination;
  currentUser?: AuthUser | null;
  onDestinationChange?: (destination: ProductionDestination) => void;
  onChange: (updated: Partial<ProductionSummary>) => void;
  onAdminOverrideStatus?: (override: AdminOverrideRecord, newStatus: InspectionStatus) => void;
  onResetAdminOverride?: () => void;
}

export const RollProductionForm: React.FC<Props> = ({
  production,
  totalRollWeightKg = 120,
  destinationPlant = 'PROSES_2_JATI',
  currentUser,
  onDestinationChange,
  onChange,
  onAdminOverrideStatus,
  onResetAdminOverride,
}) => {
  const isAdmin =
    currentUser?.role === 'ADMIN_QC' ||
    currentUser?.username?.toLowerCase() === 'admin qc' ||
    currentUser?.username?.toLowerCase() === 'adminqc' ||
    currentUser?.username?.toLowerCase() === 'admin';

  const [selectedReason, setSelectedReason] = useState<string>(
    'Dispensasi penggunaan internal Proses 2 Jati dengan penyetelan parameter pemangkasan tepi.'
  );
  const [customReason, setCustomReason] = useState<string>('');
  const [isOverriding, setIsOverriding] = useState<boolean>(false);
  const handleOkChange = (val: number) => {
    const safe = Math.max(0, isNaN(val) ? 0 : val);
    onChange({ totalOk: safe });
  };

  const handleNgChange = (val: number) => {
    const safe = Math.max(0, isNaN(val) ? 0 : val);
    onChange({ totalNg: safe });
  };

  const handleReworkChange = (val: number) => {
    const safe = Math.max(0, isNaN(val) ? 0 : val);
    onChange({ totalRework: safe });
  };

  const handleDestinationSelect = (dest: ProductionDestination) => {
    onChange({ destinationPlant: dest });
    if (onDestinationChange) {
      onDestinationChange(dest);
    }
  };

  const currentDest: ProductionDestination =
    production.destinationPlant || destinationPlant || 'PROSES_2_JATI';

  const currentOk = typeof production.totalOk === 'number' && !isNaN(production.totalOk) ? production.totalOk : 0;
  const currentNg = typeof production.totalNg === 'number' && !isNaN(production.totalNg) ? production.totalNg : 0;
  const currentRework = typeof production.totalRework === 'number' && !isNaN(production.totalRework) ? production.totalRework : 0;

  const totalProduced = currentOk + currentNg + currentRework;
  const yieldPct = totalProduced > 0 ? ((currentOk / totalProduced) * 100).toFixed(1) : '100.0';

  return (
    <div id="section-roll-production" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pencatatan Output Roll Extruder
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kuantitas roll sheet hasil ekstrusi PT Camiloplas Jaya Makmur
              </p>
            </div>
          </div>
        </div>

        {/* Plant destination & Yield indicator */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Yield Lolos: {yieldPct}%
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <span className="text-[11px] text-slate-500 font-semibold px-1.5 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Tujuan:
            </span>
            <button
              type="button"
              onClick={() => handleDestinationSelect('PROSES_2_JATI')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                currentDest === 'PROSES_2_JATI'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Proses 2 Jati
            </button>
            <button
              type="button"
              onClick={() => handleDestinationSelect('PROSES_2_BOLANG')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                currentDest === 'PROSES_2_BOLANG'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Proses 2 Bolang
            </button>
          </div>
        </div>
      </div>

      {/* Production Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Roll Lolos / OK */}
        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Roll Lolos (OK)
            </span>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-full">
              Siap {currentDest === 'PROSES_2_JATI' ? 'Pabrik Jati' : 'Pabrik Bolang'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CleanNumberInput
              value={production.totalOk}
              onChangeValue={handleOkChange}
              allowDecimals={false}
              min={0}
              placeholder="0"
              className="w-full text-2xl font-black font-mono text-emerald-950 bg-white border border-emerald-300 rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-300"
            />
            <span className="text-xs font-bold text-emerald-800">Roll</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOkChange(Math.max(0, currentOk - 1));
              }}
              className="w-8 h-8 rounded-lg bg-white border border-emerald-200 text-slate-700 font-bold hover:bg-emerald-100 transition-colors text-sm cursor-pointer active:scale-95"
            >
              -1
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOkChange(currentOk + 1);
              }}
              className="w-8 h-8 rounded-lg bg-white border border-emerald-200 text-slate-700 font-bold hover:bg-emerald-100 transition-colors text-sm cursor-pointer active:scale-95"
            >
              +1
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOkChange(currentOk + 5);
              }}
              className="px-2.5 h-8 rounded-lg bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 transition-colors cursor-pointer active:scale-95 shadow-2xs"
            >
              +5
            </button>
          </div>
        </div>

        {/* Roll Hold / Reject */}
        <div className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              Roll Hold (Reject)
            </span>
            <span className="text-[11px] font-medium text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-full">
              Dimensi Out
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CleanNumberInput
              value={production.totalNg}
              onChangeValue={handleNgChange}
              allowDecimals={false}
              min={0}
              placeholder="0"
              className="w-full text-2xl font-black font-mono text-rose-950 bg-white border border-rose-300 rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder:text-slate-300"
            />
            <span className="text-xs font-bold text-rose-800">Roll</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNgChange(Math.max(0, currentNg - 1));
              }}
              className="w-8 h-8 rounded-lg bg-white border border-rose-200 text-slate-700 font-bold hover:bg-rose-100 transition-colors text-sm cursor-pointer active:scale-95"
              title="Kurang 1 Roll Hold"
            >
              -1
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNgChange(currentNg + 1);
              }}
              className="w-8 h-8 rounded-lg bg-white border border-rose-200 text-slate-700 font-bold hover:bg-rose-100 transition-colors text-sm cursor-pointer active:scale-95"
              title="Tambah 1 Roll Hold"
            >
              +1
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNgChange(currentNg + 5);
              }}
              className="px-2.5 h-8 rounded-lg bg-rose-600 text-white text-xs font-extrabold hover:bg-rose-700 transition-colors cursor-pointer active:scale-95 shadow-2xs"
              title="Tambah 5 Roll Hold"
            >
              +5
            </button>
          </div>
        </div>

        {/* Roll Rework (Re-trimming) */}
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              Roll Rework
            </span>
            <span className="text-[11px] font-medium text-amber-600 bg-amber-100/60 px-2 py-0.5 rounded-full">
              Re-trim Tepi
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CleanNumberInput
              value={production.totalRework}
              onChangeValue={handleReworkChange}
              allowDecimals={false}
              min={0}
              placeholder="0"
              className="w-full text-2xl font-black font-mono text-amber-950 bg-white border border-amber-300 rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-300"
            />
            <span className="text-xs font-bold text-amber-800">Roll</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleReworkChange(Math.max(0, currentRework - 1));
              }}
              className="w-8 h-8 rounded-lg bg-white border border-amber-200 text-slate-700 font-bold hover:bg-amber-100 transition-colors text-sm cursor-pointer active:scale-95"
            >
              -1
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleReworkChange(currentRework + 1);
              }}
              className="w-8 h-8 rounded-lg bg-white border border-amber-200 text-slate-700 font-bold hover:bg-amber-100 transition-colors text-sm cursor-pointer active:scale-95"
            >
              +1
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleReworkChange(currentRework + 5);
              }}
              className="px-2.5 h-8 rounded-lg bg-amber-600 text-white text-xs font-extrabold hover:bg-amber-700 transition-colors cursor-pointer active:scale-95 shadow-2xs"
            >
              +5
            </button>
          </div>
        </div>

        {/* Total Produksi Kumulatif */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Total Produksi
            </span>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">
              W: ~{((production.totalOk + production.totalNg + production.totalRework) * totalRollWeightKg).toLocaleString()} kg
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-slate-900">
              {totalProduced}
            </span>
            <span className="text-xs font-bold text-slate-500">Roll Terinspeksi</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Rejection Rate:</span>
            <strong
              className={`font-mono ${
                production.rejectionRatePct > production.rejectionThresholdFail
                  ? 'text-rose-600 font-bold'
                  : 'text-slate-700'
              }`}
            >
              {production.rejectionRatePct.toFixed(2)}%
            </strong>
          </div>
        </div>
      </div>

      {/* Bagian Status Mutu Roll & Otorisasi Pengubahan Status (Admin QC vs QC Standar) */}
      <div className="mt-5 pt-5 border-t border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Status Roll Hasil Inspeksi:</span>
            </span>
            {production.adminOverride?.isOverridden ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border-2 border-emerald-400 flex items-center gap-1 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>LULUS INSPEKSI (DISPENSASI ADMIN QC)</span>
              </span>
            ) : production.status === 'PASS' ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>LULUS INSPEKSI (PASS)</span>
              </span>
            ) : production.status === 'CONDITIONAL_PASS' ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>LULUS DENGAN SYARAT (CONDITIONAL)</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-800 border border-rose-300 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>DITOLAK / ROLL HOLD (REJECT)</span>
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <span>Hak Akses Saat Ini:</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${isAdmin ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700 border border-slate-300'}`}>
              {isAdmin ? '👑 Admin QC (Hak Penuh)' : `${currentUser?.username || 'QC'} (Inspeksi Standar)`}
            </span>
          </div>
        </div>

        {/* Kondisi 1: Status Roll sudah di-override oleh Admin QC */}
        {production.adminOverride?.isOverridden && (
          <div className="p-4 rounded-xl bg-emerald-50/80 border-2 border-emerald-400 text-emerald-950 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-black uppercase text-emerald-900">
                  Dispensasi Mutu Khusus Diterbitkan oleh Admin QC
                </span>
              </div>
              <span className="text-[11px] font-mono font-semibold text-slate-600">
                Waktu: {production.adminOverride.overriddenAt}
              </span>
            </div>
            <div className="text-xs bg-white p-2.5 rounded-lg border border-emerald-200">
              <div className="text-slate-500 text-[10px] font-bold uppercase mb-0.5">Justifikasi Resmi:</div>
              <p className="font-semibold text-slate-800 italic">"{production.adminOverride.justification}"</p>
              <div className="text-[10px] text-slate-500 mt-1">
                Disetujui oleh: <strong>{production.adminOverride.overriddenBy}</strong> · PT Camiloplas Jaya Makmur
              </div>
            </div>
            {isAdmin && onResetAdminOverride && (
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={onResetAdminOverride}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Batalkan Dispensasi (Kembalikan Status Roll ke REJECT)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Kondisi 2: Status Roll Ditolak (REJECT) dan Login sebagai Admin QC */}
        {!production.adminOverride?.isOverridden && production.status === 'REJECT' && isAdmin && (
          <div className="p-4 rounded-xl bg-amber-50/90 border-2 border-amber-400 space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                  Otorisasi Admin QC: Ubah Status Roll dari Ditolak (REJECT) Menjadi Lulus Inspeksi
                </h4>
                <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                  Roll ini berstatus <strong>Ditolak (REJECT)</strong> karena roll hold atau toleransi dimensi. Sebagai <strong>Admin QC</strong>, Anda memiliki hak khusus untuk meluluskan roll ini dengan justifikasi resmi yang tercatat di laporan.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Pilih Alasan Dispensasi (Concession Note):
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-amber-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Dispensasi penggunaan internal Proses 2 Jati dengan penyetelan parameter pemangkasan tepi.">
                    Dispensasi internal Proses 2 Jati dengan pemangkasan tepi (Edge-trimming disesuaikan)
                  </option>
                  <option value="Dispensasi pengiriman transfer ke Pabrik Bolang untuk stasiun thermoforming sekunder.">
                    Dispensasi pengiriman transfer ke Pabrik Bolang (stasiun sekunder)
                  </option>
                  <option value="Deviasi ketebalan bersifat lokal/minor dan telah diverifikasi aman untuk proses lanjutan.">
                    Deviasi ketebalan lokal/minor - diverifikasi aman untuk proses lanjutan
                  </option>
                  <option value="Lot sampel uji coba resin baru (Trial Lot) - Diterima dengan pengawasan in-line ketat.">
                    Lot sampel uji coba resin (Trial Lot) - diterima dengan pengawasan in-line
                  </option>
                  <option value="Lainnya (Tuliskan catatan khusus di bawah)">
                    Lainnya (Tuliskan justifikasi khusus sendiri)
                  </option>
                </select>
              </div>

              <div>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Tambahkan catatan spesifik persetujuan Admin QC (opsional)..."
                  className="w-full text-xs px-3 py-2 bg-white border border-amber-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-amber-900 font-semibold">
                  Otorisator: <strong>{currentUser?.name || 'Admin QC'}</strong>
                </span>

                <button
                  type="button"
                  disabled={isOverriding}
                  onClick={() => {
                    if (!onAdminOverrideStatus) return;
                    setIsOverriding(true);
                    const finalReason = customReason.trim()
                      ? `${selectedReason}. Catatan: ${customReason.trim()}`
                      : selectedReason;

                    const overrideRecord: AdminOverrideRecord = {
                      isOverridden: true,
                      originalStatus: 'REJECT',
                      overriddenStatus: 'PASS',
                      justification: finalReason,
                      overriddenBy: currentUser?.name || 'Hendra Gunawan, S.T. (Admin QC)',
                      overriddenAt: new Date().toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }),
                    };

                    onAdminOverrideStatus(overrideRecord, 'PASS');
                    setIsOverriding(false);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Ubah Status Roll Menjadi Lulus Inspeksi (PASS)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kondisi 3: Status Roll Ditolak (REJECT) tapi login sebagai QC standar (qc1, qc2, qc3) */}
        {!production.adminOverride?.isOverridden && production.status === 'REJECT' && !isAdmin && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-300 flex items-start gap-3">
            <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>Status Roll: Ditolak (REJECT)</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  Hak Ubah Terkunci
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Pengguna <strong>{currentUser?.username || 'Petugas QC'}</strong> ({currentUser?.roleLabel || 'Inspector Quality'}) tidak memiliki wewenang untuk mengubah status roll yang ditolak.
              </p>
              <p className="text-[11px] text-amber-800 font-semibold">
                🔒 Sesuai prosedur mutu PT Camiloplas Jaya Makmur, hanya akun <strong>Admin Qc</strong> yang berhak mengubah status roll dari ditolak menjadi lulus inspeksi.
              </p>
            </div>
          </div>
        )}

        {/* Kondisi 4: Roll Lulus Inspeksi Normal */}
        {!production.adminOverride?.isOverridden && production.status !== 'REJECT' && (
          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Seluruh toleransi dimensi dan roll hold dalam batas kontrol aman PT Camiloplas Jaya Makmur.</span>
            </div>
            <span className="font-mono text-[11px] font-bold text-emerald-700">Memenuhi ISO 9001</span>
          </div>
        )}
      </div>
    </div>
  );
};
