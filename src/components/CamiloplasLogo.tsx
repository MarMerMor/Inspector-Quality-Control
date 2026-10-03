import React from 'react';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  inverted?: boolean;
}

export const CamiloplasLogo: React.FC<Props> = ({
  className = '',
  size = 'md',
  showText = false,
  inverted = false,
}) => {
  const sizeMap = {
    sm: { box: 'w-7 h-7', textTitle: 'text-xs', textSub: 'text-[9px]' },
    md: { box: 'w-9 h-9 sm:w-10 sm:h-10', textTitle: 'text-sm sm:text-base', textSub: 'text-[10px] sm:text-[11px]' },
    lg: { box: 'w-12 h-12', textTitle: 'text-base sm:text-lg', textSub: 'text-xs' },
  };

  const { box, textTitle, textSub } = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Precision Geometric Polymer Extrusion 'C' Logo Emblem */}
      <div className={`relative ${box} shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-1.5 shadow-xs ring-1 ring-blue-500/20`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="camilo-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
            <linearGradient id="camilo-grad-accent" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="camilo-grad-amber" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Outer Curved Extrusion Sheet Loop (Letter C) */}
          <path
            d="M 78 22 C 60 8, 30 10, 18 28 C 6 46, 6 68, 22 84 C 36 98, 64 96, 80 80 C 83 77, 80 72, 75 73 C 62 76, 42 77, 30 65 C 18 53, 20 38, 30 28 C 42 16, 66 18, 76 27 C 80 30, 83 26, 78 22 Z"
            fill="url(#camilo-grad-primary)"
          />

          {/* Inner Precision Roll Calender Caliper Layer */}
          <path
            d="M 68 34 C 54 24, 38 27, 30 38 C 22 49, 24 61, 34 68 C 44 75, 58 72, 68 62 C 71 59, 68 55, 64 56 C 56 58, 44 58, 38 50 C 34 44, 37 38, 44 34 C 52 30, 62 33, 68 37 C 71 39, 72 36, 68 34 Z"
            fill="url(#camilo-grad-accent)"
          />

          {/* Center Precision Extruder Core Gauge Dot */}
          <circle cx="58" cy="50" r="7" fill="url(#camilo-grad-amber)" />
        </svg>
      </div>

      {showText && (
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight ${
                inverted ? 'text-white' : 'text-slate-900'
              } ${textTitle}`}
            >
              Inspector Quality
            </span>
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wider">
              QC Extruder
            </span>
          </div>
          <div
            className={`font-semibold uppercase tracking-wider ${
              inverted ? 'text-blue-200' : 'text-blue-700'
            } ${textSub}`}
          >
            PT CAMILOPLAS JAYA MAKMUR
          </div>
        </div>
      )}
    </div>
  );
};
