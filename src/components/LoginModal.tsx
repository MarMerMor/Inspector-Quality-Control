import React, { useState, FormEvent, useEffect, useRef } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  ArrowRight,
  ClipboardCheck,
  BarChart3,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  KeyRound,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { AuthUser, UserRole } from '../types/qc';
import { CamiloplasLogo } from './CamiloplasLogo';

interface Props {
  onLoginSuccess: (user: AuthUser) => void;
}

export const VALID_CREDENTIALS: Record<string, AuthUser> = {
  'qc1': {
    username: 'qc1',
    name: 'Bambang Sudirman (QC 1)',
    role: 'QC_INSPECTOR',
    roleLabel: 'Inspector Quality 1',
  },
  'qc2': {
    username: 'qc2',
    name: 'Agus Riyadi (QC 2)',
    role: 'QC_INSPECTOR',
    roleLabel: 'Inspector Quality 2',
  },
  'qc3': {
    username: 'qc3',
    name: 'Siti Rahmawati (QC 3)',
    role: 'QC_INSPECTOR',
    roleLabel: 'Inspector Quality 3',
  },
  'admin qc': {
    username: 'Admin Qc',
    name: 'Hendra Gunawan, S.T. (Admin QC)',
    role: 'ADMIN_QC',
    roleLabel: 'Admin Quality Control & QA Head',
  },
  'adminqc': {
    username: 'Admin Qc',
    name: 'Hendra Gunawan, S.T. (Admin QC)',
    role: 'ADMIN_QC',
    roleLabel: 'Admin Quality Control & QA Head',
  },
  'admin': {
    username: 'Admin Qc',
    name: 'Hendra Gunawan, S.T. (Admin QC)',
    role: 'ADMIN_QC',
    roleLabel: 'Admin Quality Control & QA Head',
  },
};

export const LoginModal: React.FC<Props> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('qc1');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessUnlocked, setIsSuccessUnlocked] = useState(false);
  const [matchedUser, setMatchedUser] = useState<AuthUser | null>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Harap masukkan username dan password.');
      return;
    }

    setIsSubmitting(true);

    const foundUser = VALID_CREDENTIALS[cleanUser];

    // Password must be '123'
    if (foundUser && cleanPass === '123') {
      setMatchedUser(foundUser);
      setIsSuccessUnlocked(true);
      setTimeout(() => {
        try {
          localStorage.setItem('QMOLD_QC_AUTH_USER', JSON.stringify(foundUser));
        } catch (err) {
          console.error('Failed to save auth to localStorage', err);
        }
        onLoginSuccess(foundUser);
      }, 400);
    } else {
      setTimeout(() => {
        setIsSubmitting(false);
        setErrorMessage(
          'Username atau Password salah! Pilihan akun: "qc1", "qc2", "qc3", atau "Admin Qc" dengan password "123".'
        );
      }, 250);
    }
  };

  const handleQuickFill = (userKey: string) => {
    const u = VALID_CREDENTIALS[userKey];
    if (u) {
      setUsername(u.username);
      setPassword('123');
      setErrorMessage(null);
      usernameInputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 select-none relative overflow-x-hidden">
      {/* Subtle industrial dot grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative w-full max-w-md my-auto">
        {/* Top Branding Pill */}
        <div className="flex items-center justify-between px-2 mb-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-xs animate-pulse" />
            <span>TERMINAL QC ONLINE · PT CAMILOPLAS JAYA MAKMUR</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            PABRIK JATI & BOLANG
          </div>
        </div>

        {/* Main Sharp Card */}
        <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Card Top Navy Industrial Bar */}
          <div className="bg-slate-950 px-6 py-6 border-b border-slate-800 text-white relative">
            <div className="flex items-center gap-3.5">
              <CamiloplasLogo size="md" showText={false} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold tracking-tight text-white">
                    Inspector Quality
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/30 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                    ISO 9001
                  </span>
                </div>
                <p className="text-xs text-blue-300 mt-0.5 font-semibold uppercase tracking-wider">
                  PT CAMILOPLAS JAYA MAKMUR
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                {isSuccessUnlocked ? (
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{isSuccessUnlocked ? 'Akses Terverifikasi' : 'Sistem Terkunci'}</span>
              </span>
              <span className="text-blue-400 text-[11px] font-medium">
                Otorisasi Petugas Mutu
              </span>
            </div>
          </div>

          {/* Form Body - Sharp High Contrast */}
          <div className="p-6 sm:p-7 bg-white space-y-5">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-xl text-xs text-rose-900 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Gagal Masuk</div>
                  <div className="font-medium mt-0.5">{errorMessage}</div>
                </div>
              </div>
            )}

            {isSuccessUnlocked && matchedUser && (
              <div className="p-3.5 bg-emerald-50 border-2 border-emerald-400 rounded-xl text-xs text-emerald-900 flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">Login Berhasil: {matchedUser.name}</div>
                  <div className="text-[11px] font-semibold text-emerald-700">
                    Peran: {matchedUser.roleLabel} · Hak Akses: {matchedUser.role === 'ADMIN_QC' ? 'Supervisi Penuh (Hapus Laporan & Override Reject ke Lulus)' : 'Inspeksi & Pelaporan Standar'}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Username Petugas / ID
                </label>
                <div className="relative">
                  <input
                    ref={usernameInputRef}
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Masukkan qc1, qc2, qc3, atau Admin Qc"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 transition-all font-mono"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                    ID
                  </span>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? 'Sembunyikan' : 'Lihat'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Masukkan password (123)"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 transition-all font-mono"
                    required
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting || isSuccessUnlocked}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Masuk & Buka Kunci Fitur</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Fill Credential Helper Bar with 4 explicit accounts */}
            <div className="pt-3 border-t border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Pilihan Akun & Otorisasi Cepat (Password: 123):</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('qc1')}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    username.toLowerCase() === 'qc1'
                      ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-bold font-mono">qc1</div>
                  <div className="text-[10px] text-slate-500">Inspector QC 1</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('qc2')}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    username.toLowerCase() === 'qc2'
                      ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-bold font-mono">qc2</div>
                  <div className="text-[10px] text-slate-500">Inspector QC 2</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('qc3')}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    username.toLowerCase() === 'qc3'
                      ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-bold font-mono">qc3</div>
                  <div className="text-[10px] text-slate-500">Inspector QC 3</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('admin qc')}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    username.toLowerCase().includes('admin')
                      ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-2 ring-amber-400/30'
                      : 'bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-amber-200 text-amber-900 hover:bg-amber-100/60'
                  }`}
                >
                  <div className="text-xs font-bold font-mono flex items-center justify-between">
                    <span>Admin Qc</span>
                    <span className="text-[9px] px-1 bg-amber-200 text-amber-900 rounded font-extrabold">ADMIN</span>
                  </div>
                  <div className="text-[10px] text-amber-800">Hak Hapus & Override Status</div>
                </button>
              </div>
            </div>

            {/* Differential Access Matrix Info */}
            <div className="pt-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                <span>Ketentuan Hak Akses Sistem:</span>
              </div>
              <ul className="space-y-1 text-slate-600 pl-4 list-disc">
                <li>
                  <strong className="text-slate-800">qc1, qc2, qc3:</strong> Input data inspeksi, toleransi micrometer, grafik profil, dan cetak laporan. (Tidak berhak hapus laporan atau ubah status reject).
                </li>
                <li>
                  <strong className="text-amber-800">Admin Qc:</strong> Memiliki wewenang khusus untuk <span className="underline font-bold">menghapus laporan tersimpan</span> dan <span className="underline font-bold">mengubah status roll dari Ditolak (Reject) menjadi Lulus Inspeksi (Special Concession)</span>.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 text-center text-xs text-slate-400">
          Inspector Quality System · PT Camiloplas Jaya Makmur © 2026
        </div>
      </div>
    </div>
  );
};
