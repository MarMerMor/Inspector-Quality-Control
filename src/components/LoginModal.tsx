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
} from 'lucide-react';

interface Props {
  onLoginSuccess: (user: { username: string; name: string; role: string }) => void;
}

export const LoginModal: React.FC<Props> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('qc1');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessUnlocked, setIsSuccessUnlocked] = useState(false);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus automatically on mount
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

    // Validate strictly: only username qc1 and password 123
    if (cleanUser === 'qc1' && cleanPass === '123') {
      setIsSuccessUnlocked(true);
      setTimeout(() => {
        const userObj = {
          username: 'qc1',
          name: 'QC Inspector 01',
          role: 'Quality Control Lead Inspector',
        };
        try {
          localStorage.setItem('QMOLD_QC_AUTH_USER', JSON.stringify(userObj));
        } catch (err) {
          console.error('Failed to save auth to localStorage', err);
        }
        onLoginSuccess(userObj);
      }, 400);
    } else {
      setTimeout(() => {
        setIsSubmitting(false);
        setErrorMessage('Username atau Password salah! Akses khusus: username "qc1" dan password "123".');
      }, 250);
    }
  };

  const handleQuickFill = () => {
    setUsername('qc1');
    setPassword('123');
    setErrorMessage(null);
    usernameInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 select-none relative overflow-x-hidden">
      {/* Crisp industrial grid background pattern - NO BLUR */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]" 
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }} 
      />

      <div className="relative w-full max-w-md my-auto">
        {/* Top Branding Pill */}
        <div className="flex items-center justify-between px-2 mb-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-xs animate-pulse" />
            <span>TERMINAL QC ONLINE</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            VERSI 2.4 (OFFLINE-READY)
          </div>
        </div>

        {/* Main Sharp Card */}
        <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Card Top Navy Industrial Bar */}
          <div className="bg-slate-950 px-6 py-6 border-b border-slate-800 text-white relative">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 shrink-0">
                {isSuccessUnlocked ? (
                  <Unlock className="w-6 h-6 text-white" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold tracking-tight text-white">
                    Q-Mold QC System
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/30 text-blue-300 border border-blue-400/30">
                    ISO 9001
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 font-medium">
                  Manajemen Inspeksi Extruder & Proses 2
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Sistem Terkunci
              </span>
              <span className="text-blue-400 text-[11px] font-medium">
                Otorisasi Petugas QC
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

            {isSuccessUnlocked && (
              <div className="p-3.5 bg-emerald-50 border-2 border-emerald-400 rounded-xl text-xs text-emerald-900 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">Login Berhasil!</div>
                  <div className="text-[11px]">Membuka seluruh instrumen & laporan QC...</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Username Petugas
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
                    placeholder="Masukkan username (qc1)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 transition-all font-mono"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                    QC
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

            {/* Quick Fill Credential Helper Bar */}
            <div className="pt-3 border-t border-slate-200">
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="text-slate-700 font-medium">
                    Akun: <strong className="font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-300">qc1</strong> · Pass: <strong className="font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-300">123</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 font-bold rounded-lg border border-slate-200 shadow-2xs text-[11px] transition-colors cursor-pointer"
                >
                  Isi Cepat
                </button>
              </div>
            </div>

            {/* Unlocked Features Preview Strip */}
            <div className="pt-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                Fitur Terproteksi Setelah Login
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Form Inspeksi Real-time</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Grafik Toleransi SPC</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Penyimpanan Laporan</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Cetak ISO & Excel CSV</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 text-center text-xs text-slate-400">
          Q-Mold SPC Management System © 2026 · Standar Manufaktur Mutu Industri
        </div>
      </div>
    </div>
  );
};
