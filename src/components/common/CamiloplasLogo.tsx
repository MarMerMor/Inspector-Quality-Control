import React from 'react';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  inverted?: boolean;
}

export const CamiloplasLogo: React.FC<Props> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  inverted = false,
}) => {
  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-7 h-7';
      case 'lg':
        return 'w-11 h-11';
      case 'xl':
        return 'w-14 h-14';
      case 'md':
      default:
        return 'w-9 h-9';
    }
  };

  const getTitleClass = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-lg';
      case 'xl':
        return 'text-xl';
      case 'md':
      default:
        return 'text-sm sm:text-base';
    }
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Official Stylized Logo Mark: Monogram 'C' with Polymer Sheet Roll Geometry */}
      <div
        className={`${getIconSize()} rounded-xl bg-gradient-to-br from-blue-700 via-indigo-600 to-cyan-500 p-0.5 flex items-center justify-center shrink-0 shadow-md shadow-blue-900/10 ring-1 ring-blue-400/30`}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1"
        >
          {/* Dynamic Polymer Ribbon Arch */}
          <path
            d="M82 32C76 18 61 10 44 12C24 14 10 31 12 52C14 73 31 87 52 87C68 87 81 77 86 63"
            stroke="white"
            strokeWidth="11"
            strokeLinecap="round"
          />
          {/* Extruded Sheet Core & Flow Arrow */}
          <path
            d="M38 50C38 42 45 36 54 37C63 38 69 45 68 53C67 61 60 67 52 66"
            stroke="#67e8f9"
            strokeWidth="9"
            strokeLinecap="round"
          />
          {/* Precision Extrusion Calender Roll Dot */}
          <circle cx="53" cy="51.5" r="5" fill="#facc15" />
          {/* Shine Accent */}
          <circle cx="76" cy="24" r="3.5" fill="white" />
        </svg>
      </div>

      {/* Corporate Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`font-black tracking-tight leading-none ${getTitleClass()} ${
              inverted ? 'text-white' : 'text-slate-900'
            }`}
          >
            CAMILOPLAS
          </span>
          <span className="text-[10px] sm:text-[11px] font-black tracking-wider text-blue-600 uppercase px-1.5 py-0.2 rounded bg-blue-50 border border-blue-200">
            JAYA MAKMUR
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`text-[9.5px] sm:text-[10.5px] font-semibold tracking-wide uppercase mt-0.5 ${
              inverted ? 'text-blue-200/80' : 'text-slate-500'
            }`}
          >
            Inspector Quality System
          </span>
        )}
      </div>
    </div>
  );
};
