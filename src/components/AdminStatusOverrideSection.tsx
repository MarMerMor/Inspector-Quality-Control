import React, { useState } from 'react';
import { QCReport, AuthUser, AdminOverrideRecord, InspectionStatus } from '../types/qc';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  RotateCcw,
  Sparkles,
  FileCheck,
  Building2,
} from 'lucide-react';

interface Props {
  report: QCReport;
  currentUser: AuthUser | null;
  onAdminOverrideStatus: (override: AdminOverrideRecord, newStatus: InspectionStatus) => void;
  onResetAdminOverride: () => void;
}

const COMMON_JUSTIFICATIONS = [
  'Dispensasi penggunaan internal Proses 2 Jati dengan pemangkasan tepi ekstra (Edge-trimming disesuaikan).',
  'Toleransi fungsional telah diverifikasi aman dan disetujui oleh Kepala Rekayasa & Pelanggan.',
  'Deviasi ketebalan bersifat lokal/minor dan tidak mengganggu proses thermoforming cup/tray.',
  'Rekomendasi model AI Extruder: Deviasi dapat dikompensasi dengan penyetelan suhu pemanas mesin Kiefel.',
  'Lot sampel uji coba resin baru (Trial Lot) - Diterima dengan pengawasan in-line ketat di Stasiun 2.',
];

export const AdminStatusOverrideSection: React.FC<Props> = ({
  report,
  currentUser,
  onAdminOverrideStatus,
  onResetAdminOverride,
}) => {
  const isAdmin =
    currentUser?.role === 'ADMIN_QC' ||
    currentUser?.username?.toLowerCase() === 'admin qc' ||
    currentUser?.username?.toLowerCase() === 'adminqc';

  const [selectedPreset, setSelectedPreset] = useState(COMMON_JUSTIFICATIONS[0]);
  const [customJustification, setCustomJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCurrentlyOverridden = report.production.adminOverride?.isOverridden;
  const isCurrentlyRejected = report.production.status === 'REJECT';

  const handleApplyOverride = () => {
    if (!isAdmin) return;

    const justification = customJustification.trim() || selectedPreset;

    const overrideRecord: AdminOverrideRecord = {
      isOverridden: true,
      originalStatus: report.production.adminOverride?.originalStatus || 'REJECT',
      overriddenStatus: 'PASS',
      justification,
      overriddenBy: currentUser?.name || 'Hendra Gunawan, S.T. (Admin QC)',
      overriddenAt: new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    };

    setIsSubmitting(true);
    setTimeout(() => {
      onAdminOverrideStatus(overrideRecord, 'PASS');
      setIsSubmitting(false);
    }, 200);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-xs">
      {/* Top Banner Bar */}
      <div
        className={`px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b ${
          isAdmin
            ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-amber-200 text-amber-950'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl shrink-0 ${
              isAdmin ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {isAdmin ? <ShieldAlert className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">
                Otorisasi Status Roll & Dispensasi Mutu (Admin QC)
              </h3>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isAdmin
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-200 text-slate-600 border-slate-300'
                }`}
              >
                {isAdmin ? 'Hak Akses: Admin QC Aktif' : 'Terkunci: Khusus Admin QC'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Wewenang penyesuaian status lot dari Ditolak (Reject) menjadi Lulus Inspeksi (Special Concession Release)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-slate-500">Petugas Saat Ini:</span>
          <span className="font-mono bg-white px-2 py-1 rounded-lg border border-slate-300 text-slate-800 shadow-2xs font-bold">
            {currentUser?.username || 'Belum Login'} ({currentUser?.role === 'ADMIN_QC' ? 'Admin QC' : 'Inspector'})
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* CASE 1: Status Currently Overridden by Admin QC */}
        {isCurrentlyOverridden && report.production.adminOverride && (
          <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                      Dispensasi Mutu Aktif
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      {report.production.adminOverride.overriddenAt}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-emerald-900 mt-1">
                    Status Lot Diubah: Dari Ditolak (REJECT) Menjadi LULUS INSPEKSI (PASS)
                  </h4>
                  <div className="mt-2 text-xs bg-white p-3 rounded-lg border border-emerald-200 text-slate-800 space-y-1">
                    <span className="font-bold text-emerald-800 block text-[11px] uppercase tracking-wider">
                      Alasan / Justifikasi Pelepasan Resmi:
                    </span>
                    <p className="italic font-medium">"{report.production.adminOverride.justification}"</p>
                    <div className="pt-1 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 mt-2">
                      <span>Diverifikasi & Disetujui Oleh: <strong>{report.production.adminOverride.overriddenBy}</strong></span>
                      <span className="font-mono">PT Camiloplas Jaya Makmur</span>
                    </div>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={onResetAdminOverride}
                  className="shrink-0 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                  title="Batalkan dispensasi dan kembalikan status ke Ditolak (REJECT)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Batalkan Override (Reset ke Reject)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* CASE 2: Status is REJECT and Admin QC is logged in -> Can Override */}
        {!isCurrentlyOverridden && isCurrentlyRejected && isAdmin && (
          <div className="p-4 sm:p-5 rounded-xl bg-amber-50/70 border-2 border-amber-300 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-950">
                  Formulir Pelepasan Mutu Khusus (Ubah Status Roll: REJECT ➔ PASS)
                </h4>
                <p className="text-xs text-amber-900/80 leading-relaxed">
                  Lot roll sheet ini terhitung <strong>Ditolak (REJECT)</strong> oleh sistem SPC. Sebagai <strong>Admin QC</strong>, Anda memiliki kewenangan untuk meluluskan lot ini dengan catatan dispensasi mutu resmi yang akan tercatat di sertifikat cetak ISO dan CAPA.
                </p>
              </div>
            </div>

            {/* Quick Justification Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Pilih Alasan Dispensasi Standar:
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                {COMMON_JUSTIFICATIONS.map((just, idx) => (
                  <option key={idx} value={just}>
                    {just}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Notes / Justification */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Atau Tuliskan Justifikasi Tambahan / Catatan Spesifik Lot:
              </label>
              <textarea
                rows={2}
                value={customJustification}
                onChange={(e) => setCustomJustification(e.target.value)}
                placeholder="Contoh: Telah diperiksa visual oleh Spv QC, variasi tebal berada di area trim tepi 15mm sehingga produk cup thermoforming tetap presisi..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            {/* Override Action CTA */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-amber-200">
              <span className="text-[11px] text-amber-900 font-medium">
                Persetujuan: <strong>{currentUser?.name || 'Admin QC'}</strong> · PT Camiloplas Jaya Makmur
              </span>

              <button
                type="button"
                onClick={handleApplyOverride}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl font-extrabold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>Setujui Dispensasi & Ubah Status Menjadi LULUS (PASS)</span>
              </button>
            </div>
          </div>
        )}

        {/* CASE 3: Status is REJECT but User is NOT Admin QC (qc1, qc2, qc3) */}
        {!isCurrentlyOverridden && isCurrentlyRejected && !isAdmin && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800">
                Hak Pengubahan Status Terkunci (Khusus Akun Admin QC)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Lot roll ini berstatus <strong>Ditolak / REJECT</strong>. Petugas inspeksi standar (<strong>qc1, qc2, qc3</strong>) tidak diizinkan mengubah status mutu yang berada di luar spesifikasi teknis.
              </p>
              <p className="text-[11px] text-amber-800 font-semibold pt-0.5">
                Hubungi Admin QC (username: "Admin Qc") untuk otorisasi dispensasi pelepasan mutu jika lot ini memenuhi syarat penggunaan bersyarat.
              </p>
            </div>
          </div>
        )}

        {/* CASE 4: Status is already PASS and no override */}
        {!isCurrentlyOverridden && !isCurrentlyRejected && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Status hasil uji lot ini saat ini adalah <strong>LULUS (PASS)</strong>. Tidak diperlukan dispensasi khusus.
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              In-Spec Normal
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
