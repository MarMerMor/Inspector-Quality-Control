import React, { useState } from 'react';
import { CavityDetail, MoldDieSetup, ProcessType } from '../types/qc';
import { evaluateCavityDetail } from '../utils/calculations';
import { Grid, ShieldAlert, CheckCircle2, Scale, AlertTriangle, X } from 'lucide-react';

interface Props {
  moldSetup: MoldDieSetup;
  processType?: ProcessType;
  onChange: (updated: MoldDieSetup) => void;
}

export const MoldCavityConfig: React.FC<Props> = ({ moldSetup, processType = 'EXTRUDER', onChange }) => {
  const [selectedCavityForReason, setSelectedCavityForReason] = useState<number | null>(null);
  const [tempReason, setTempReason] = useState('');

  // Handle changing total cavities
  const handleTotalCavitiesChange = (newTotal: number) => {
    const validTotal = Math.max(1, Math.min(64, newTotal));
    const newCavities: CavityDetail[] = [];

    for (let i = 1; i <= validTotal; i++) {
      const existing = moldSetup.cavities.find((c) => c.cavityNumber === i);
      if (existing) {
        newCavities.push(existing);
      } else {
        newCavities.push({
          cavityNumber: i,
          isActive: true,
          targetWeight: moldSetup.targetPartWeight,
          actualWeight: moldSetup.targetPartWeight,
          weightDelta: 0,
          isWeightInSpec: true,
        });
      }
    }

    const activeCavities = newCavities.filter((c) => c.isActive).length;
    const blockedCavities = newCavities
      .filter((c) => !c.isActive)
      .map((c) => c.cavityNumber);

    onChange({
      ...moldSetup,
      totalCavities: validTotal,
      activeCavities,
      blockedCavities,
      cavities: newCavities,
    });
  };

  // Toggle active / blocked for a cavity
  const handleToggleCavity = (cavityNumber: number) => {
    const target = moldSetup.cavities.find((c) => c.cavityNumber === cavityNumber);
    if (!target) return;

    if (target.isActive) {
      // Opening modal to block with reason
      setSelectedCavityForReason(cavityNumber);
      setTempReason(target.blockReason || 'Ejector pin aus / flash parah');
    } else {
      // Unblock directly
      updateSingleCavity(cavityNumber, { isActive: true, blockReason: undefined });
    }
  };

  const confirmBlock = () => {
    if (selectedCavityForReason !== null) {
      updateSingleCavity(selectedCavityForReason, {
        isActive: false,
        blockReason: tempReason || 'Blocked by inspector',
        actualWeight: 0,
      });
      setSelectedCavityForReason(null);
      setTempReason('');
    }
  };

  const updateSingleCavity = (cavityNumber: number, partial: Partial<CavityDetail>) => {
    const updated = moldSetup.cavities.map((c) => {
      if (c.cavityNumber === cavityNumber) {
        const merged = { ...c, ...partial };
        return evaluateCavityDetail(merged, moldSetup.targetPartWeight, moldSetup.weightToleranceGrams);
      }
      return c;
    });

    const activeCavities = updated.filter((c) => c.isActive).length;
    const blockedCavities = updated.filter((c) => !c.isActive).map((c) => c.cavityNumber);

    onChange({
      ...moldSetup,
      activeCavities,
      blockedCavities,
      cavities: updated,
    });
  };

  // Update target weight or tolerance
  const handleTargetWeightChange = (target: number) => {
    const updated = moldSetup.cavities.map((c) =>
      evaluateCavityDetail(c, target, moldSetup.weightToleranceGrams)
    );
    onChange({
      ...moldSetup,
      targetPartWeight: target,
      cavities: updated,
    });
  };

  const handleToleranceChange = (tol: number) => {
    const updated = moldSetup.cavities.map((c) =>
      evaluateCavityDetail(c, moldSetup.targetPartWeight, tol)
    );
    onChange({
      ...moldSetup,
      weightToleranceGrams: tol,
      cavities: updated,
    });
  };

  const activeRatio = (moldSetup.activeCavities / moldSetup.totalCavities) * 100;

  const isExtruder = processType === 'EXTRUDER';

  return (
    <div id="section-mold" className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 mb-4 sm:mb-5 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Grid className="w-5 h-5 text-indigo-600" />
            {isExtruder
              ? 'Pengaturan Die Lip T-Die & Zona Roll Sheet (Extruder)'
              : 'Pengaturan Mold / Cavity Mesin Kiefel & Thermoforming (Proses 2)'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isExtruder
              ? 'Monitoring zona die lip T-Die melintang sheet (kiri, tengah, kanan) dan keseragaman berat roll'
              : 'Monitoring cavity aktif vs blocked pada cetakan Kiefel dan keseragaman berat produk per rongga'}
          </p>
        </div>

        {/* Status Chip */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-500 font-medium">
              {isExtruder ? 'Zona Beroperasi' : 'Cavity Beroperasi'}
            </div>
            <div className="text-sm font-bold text-slate-900 font-mono">
              {moldSetup.activeCavities} / {moldSetup.totalCavities}{' '}
              <span className="text-xs font-normal text-slate-500">
                ({activeRatio.toFixed(0)}%)
              </span>
            </div>
          </div>
          <div
            className={`w-3 h-3 rounded-full ${
              moldSetup.blockedCavities.length === 0
                ? 'bg-emerald-500 ring-4 ring-emerald-100'
                : 'bg-amber-500 ring-4 ring-amber-100 animate-pulse'
            }`}
          />
        </div>
      </div>

      {/* Target & Tolerance Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-6 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {isExtruder ? 'Total Zona Die Lip / Sheet' : 'Total Cavity Mold Kiefel'}
          </label>
          <div className="flex items-center gap-1.5">
            {(isExtruder ? [3, 6, 8, 12] : [4, 8, 12, 16]).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleTotalCavitiesChange(num)}
                className={`flex-1 min-h-[42px] py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
                  moldSetup.totalCavities === num
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {num} {isExtruder ? 'Zona' : 'Cav'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <Scale className="w-3.5 h-3.5 text-indigo-600" />
            Target Berat Part (gram)
          </label>
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            value={moldSetup.targetPartWeight}
            onChange={(e) => handleTargetWeightChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 min-h-[42px] text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Toleransi Berat (± gram)
          </label>
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            value={moldSetup.weightToleranceGrams}
            onChange={(e) => handleToleranceChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 min-h-[42px] text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-bold"
          />
        </div>
      </div>

      {/* Visual Interactive Cavity Matrix */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Layout Rongga Cavity (Klik nomor untuk Blokir / Aktifkan)
          </span>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Aktif
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Blocked
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
          {moldSetup.cavities.map((cavity) => {
            const isBlocked = !cavity.isActive;
            const isOutOfSpec = cavity.isActive && !cavity.isWeightInSpec;

            return (
              <div
                key={cavity.cavityNumber}
                onClick={() => handleToggleCavity(cavity.cavityNumber)}
                className={`cursor-pointer select-none rounded-xl p-3 border transition-all text-center relative group ${
                  isBlocked
                    ? 'bg-rose-50/80 border-rose-200 hover:border-rose-300'
                    : isOutOfSpec
                    ? 'bg-amber-50/80 border-amber-300 hover:border-amber-400'
                    : 'bg-emerald-50/50 border-emerald-200/80 hover:border-emerald-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold font-mono text-slate-800">
                    Cav #{cavity.cavityNumber}
                  </span>
                  {isBlocked ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </div>

                <div className="text-sm font-extrabold font-mono tracking-tight text-slate-900">
                  {isBlocked ? 'BLOCKED' : `${cavity.actualWeight.toFixed(2)}g`}
                </div>

                <div className="text-[10px] mt-1 font-mono">
                  {isBlocked ? (
                    <span className="text-rose-600 truncate block font-medium" title={cavity.blockReason}>
                      {cavity.blockReason || 'Blocked'}
                    </span>
                  ) : (
                    <span
                      className={`font-semibold ${
                        isOutOfSpec ? 'text-amber-700' : 'text-slate-500'
                      }`}
                    >
                      {cavity.weightDelta >= 0 ? `+${cavity.weightDelta.toFixed(2)}` : cavity.weightDelta.toFixed(2)}g
                    </span>
                  )}
                </div>

                {/* Hover affordance */}
                <div className="absolute inset-0 rounded-xl bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[10px] font-semibold bg-white/95 px-2 py-0.5 rounded shadow-xs text-slate-800">
                    {isBlocked ? 'Buka Blokir' : 'Blokir'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {moldSetup.blockedCavities.length > 0 && (
          <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Perhatian Produksi:</span> Cavity terblokir (
              {moldSetup.blockedCavities.map((c) => `Cav #${c}`).join(', ')}) menyebabkan
              penurunan kapasitas output per shot. Pastikan counter shot mesin dan target WO
              disesuaikan.
            </div>
          </div>
        )}
      </div>

      {/* Cavity Weight Fine Tuning - Mobile Card View (sm:hidden) */}
      <div className="sm:hidden space-y-3 mb-4">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          Input Berat Aktual per Cavity:
        </div>
        {moldSetup.cavities.map((c) => (
          <div
            key={c.cavityNumber}
            className={`p-3.5 rounded-xl border transition-all ${
              !c.isActive
                ? 'bg-rose-50/50 border-rose-200'
                : !c.isWeightInSpec
                ? 'bg-amber-50/50 border-amber-300'
                : 'bg-slate-50/70 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm font-mono text-slate-900">
                  Cavity #{c.cavityNumber}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {c.isActive ? 'Aktif' : 'Blocked'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleToggleCavity(c.cavityNumber)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-colors active:scale-95 ${
                  c.isActive
                    ? 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                    : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {c.isActive ? 'Blokir' : 'Aktifkan'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 items-center">
              <div>
                <label className="text-[11px] text-slate-500 font-medium block mb-1">
                  Target: {c.targetWeight.toFixed(2)}g
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    disabled={!c.isActive}
                    value={c.isActive ? c.actualWeight : ''}
                    placeholder={c.isActive ? '0.00' : 'Blocked'}
                    onChange={(e) =>
                      updateSingleCavity(c.cavityNumber, {
                        actualWeight: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 min-h-[42px] bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">g</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 font-medium block mb-1">
                  Selisih (Delta)
                </span>
                <div className="min-h-[42px] px-3 py-2 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                  {c.isActive ? (
                    <>
                      <span
                        className={`text-xs font-mono font-extrabold ${
                          c.isWeightInSpec ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {c.weightDelta >= 0 ? `+${c.weightDelta.toFixed(2)}` : c.weightDelta.toFixed(2)}g
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          c.isWeightInSpec
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.isWeightInSpec ? 'OK' : 'Out'}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 font-mono">Nonaktif</span>
                  )}
                </div>
              </div>
            </div>

            {!c.isActive && (
              <div className="mt-2 text-xs text-rose-700 bg-rose-100/60 px-2.5 py-1.5 rounded-lg font-medium">
                Alasan: {c.blockReason || 'Blocked by inspector'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cavity Weight Fine Tuning per Cavity Table - Desktop / Tablet (hidden on mobile) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2 px-3">No Cavity</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Target (g)</th>
              <th className="py-2 px-3">Berat Aktual (g)</th>
              <th className="py-2 px-3">Delta / Selisih (g)</th>
              <th className="py-2 px-3">Evaluasi Berat</th>
              <th className="py-2 px-3">Catatan / Alasan Blokir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {moldSetup.cavities.map((c) => (
              <tr key={c.cavityNumber} className={!c.isActive ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}>
                <td className="py-2 px-3 font-mono font-semibold text-slate-800">
                  Cavity #{c.cavityNumber}
                </td>
                <td className="py-2 px-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                      c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {c.isActive ? 'Aktif' : 'Blocked'}
                  </span>
                </td>
                <td className="py-2 px-3 font-mono text-slate-600">{c.targetWeight.toFixed(2)}</td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    disabled={!c.isActive}
                    value={c.isActive ? c.actualWeight : ''}
                    placeholder={c.isActive ? '0.00' : 'N/A'}
                    onChange={(e) =>
                      updateSingleCavity(c.cavityNumber, {
                        actualWeight: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </td>
                <td className="py-2 px-3 font-mono">
                  {c.isActive ? (
                    <span className={c.isWeightInSpec ? 'text-emerald-700' : 'text-amber-700 font-bold'}>
                      {c.weightDelta >= 0 ? `+${c.weightDelta.toFixed(2)}` : c.weightDelta.toFixed(2)} g
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="py-2 px-3">
                  {c.isActive ? (
                    c.isWeightInSpec ? (
                      <span className="text-emerald-700 font-medium">Dalam Toleransi</span>
                    ) : (
                      <span className="text-amber-700 font-bold">Diluar Toleransi (±{moldSetup.weightToleranceGrams}g)</span>
                    )
                  ) : (
                    <span className="text-slate-400">Nonaktif</span>
                  )}
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={c.blockReason || ''}
                    placeholder={!c.isActive ? 'Alasan pemblokiran cavity...' : 'Opsional'}
                    onChange={(e) =>
                      updateSingleCavity(c.cavityNumber, { blockReason: e.target.value })
                    }
                    className="w-full min-w-[140px] px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog for Blocking Cavity Reason */}
      {selectedCavityForReason !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Blokir Cavity #{selectedCavityForReason}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCavityForReason(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Tentukan alasan pemblokiran rongga mold/die ini untuk riwayat pemeliharaan tooling (Maintenance Log):
            </p>

            <div className="space-y-1.5 mb-4">
              {[
                'Pin ejector aus / patah',
                'Flash parah pada parting line',
                'Gate tersumbat / short shot terus-menerus',
                'Permukaan cavity baret / scratch',
                'Pendingin / cooling channel bocor',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setTempReason(reason)}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg border transition-all ${
                    tempReason === reason
                      ? 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Atau masukkan alasan kustom:
              </label>
              <input
                type="text"
                value={tempReason}
                onChange={(e) => setTempReason(e.target.value)}
                placeholder="Contoh: Gas trap berlebih di ujung runner"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedCavityForReason(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmBlock}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Konfirmasi Blokir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
