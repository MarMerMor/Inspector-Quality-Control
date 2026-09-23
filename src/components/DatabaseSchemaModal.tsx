import React, { useState } from 'react';
import { X, Copy, Check, Database, Code, FileJson, Server } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseSchemaModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'SQL' | 'TS' | 'JSON' | 'ARCH'>('SQL');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlDDL = `-- ====================================================================
-- ARSITEKTUR DATABASE SISTEM QUALITY CONTROL (EXTRUDER & PROSES 2 KIEFEL)
-- Database Engine: PostgreSQL 15+ / Supabase / Cloud SQL / MySQL
-- ====================================================================

-- 1. Master Tabel Laporan QC (Header & Metadata)
CREATE TABLE qc_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_number VARCHAR(50) UNIQUE NOT NULL, -- Format: QC-EXT-(DD/MM/YY)-(Shift)-(Nomor urut)
    inspection_date DATE NOT NULL,
    shift VARCHAR(10) NOT NULL CHECK (shift IN ('SHIFT_1', 'SHIFT_2', 'SHIFT_3')),
    process_type VARCHAR(30) NOT NULL CHECK (process_type IN ('EXTRUDER', 'PROSES_2', 'INJECTION_MOLDING', 'STAMPING_PRESS')),
    
    -- Machine & Tooling Info
    machine_id VARCHAR(50) NOT NULL,
    machine_name VARCHAR(100) NOT NULL,
    mold_die_code VARCHAR(100) NOT NULL, -- T-Die Lip Code / Mold Kiefel
    
    -- Part & SPK (Surat Perintah Kerja)
    spk_number VARCHAR(50) NOT NULL, -- Nomor SPK
    part_number VARCHAR(80) NOT NULL,
    part_name VARCHAR(150) NOT NULL,
    customer_name VARCHAR(150),
    material_grade VARCHAR(100),
    lot_number VARCHAR(50),
    
    -- Operator & Inspection Personnel
    inspector_name VARCHAR(100) NOT NULL,
    operator_name VARCHAR(100),
    supervisor_name VARCHAR(100),
    
    -- Production Aggregates & Automatic Calculated Metrics
    total_ok INT NOT NULL DEFAULT 0,
    total_ng INT NOT NULL DEFAULT 0,
    total_rework INT NOT NULL DEFAULT 0,
    total_produced INT GENERATED ALWAYS AS (total_ok + total_ng + total_rework) STORED,
    rejection_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    rework_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    
    -- Inspection Decision
    rejection_threshold_warn NUMERIC(4, 2) DEFAULT 1.50,
    rejection_threshold_fail NUMERIC(4, 2) DEFAULT 3.50,
    inspection_status VARCHAR(20) NOT NULL CHECK (inspection_status IN ('PASS', 'CONDITIONAL_PASS', 'REJECT')),
    status_reasons JSONB DEFAULT '[]'::jsonb,
    
    -- Notes & Signoff
    notes TEXT,
    corrective_action TEXT,
    approved_by VARCHAR(100),
    approval_date TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Monitoring Cavity Mold / Die
CREATE TABLE qc_cavity_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES qc_reports(id) ON DELETE CASCADE,
    cavity_number INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    block_reason VARCHAR(255),
    target_weight_gram NUMERIC(8, 3) NOT NULL,
    actual_weight_gram NUMERIC(8, 3) NOT NULL,
    weight_delta_gram NUMERIC(8, 3) GENERATED ALWAYS AS (actual_weight_gram - target_weight_gram) STORED,
    is_weight_in_spec BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_id, cavity_number)
);

-- 3. Rincian Checklist Defect / Cacat Produksi
CREATE TABLE qc_defect_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES qc_reports(id) ON DELETE CASCADE,
    defect_code VARCHAR(50) NOT NULL, -- e.g. DEF_SHORT_SHOT, DEF_FLASH_BURR
    defect_name VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'MAJOR', 'MINOR')),
    defect_count INT NOT NULL DEFAULT 0 CHECK (defect_count >= 0),
    affected_cavities INT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Pengukuran Dimensi Kritis (SPC Sample Check)
CREATE TABLE qc_dimension_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES qc_reports(id) ON DELETE CASCADE,
    parameter_name VARCHAR(150) NOT NULL,
    tool_used VARCHAR(100) NOT NULL,
    nominal NUMERIC(8, 3) NOT NULL,
    upper_spec_limit NUMERIC(8, 3) NOT NULL, -- USL
    lower_spec_limit NUMERIC(8, 3) NOT NULL, -- LSL
    unit VARCHAR(10) DEFAULT 'mm',
    samples NUMERIC(8, 3)[] NOT NULL, -- Array of 5 samples [s1, s2, s3, s4, s5]
    sample_mean NUMERIC(8, 3),
    sample_min NUMERIC(8, 3),
    sample_max NUMERIC(8, 3),
    sample_range NUMERIC(8, 3),
    sample_std_dev NUMERIC(8, 4),
    is_all_in_spec BOOLEAN NOT NULL DEFAULT TRUE,
    out_of_spec_indices INT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Fast Querying by Part, Date, Work Order & Status
CREATE INDEX idx_qc_reports_part_no ON qc_reports(part_number);
CREATE INDEX idx_qc_reports_inspection_date ON qc_reports(inspection_date);
CREATE INDEX idx_qc_reports_wo ON qc_reports(work_order_number);
CREATE INDEX idx_qc_reports_status ON qc_reports(inspection_status);
CREATE INDEX idx_qc_defects_report_id ON qc_defect_records(report_id);
CREATE INDEX idx_qc_dimensions_report_id ON qc_dimension_samples(report_id);
`;

  const tsSchema = `/**
 * TypeScript Data Contracts for Manufacturing QC System
 */

export type ProcessType = 'INJECTION_MOLDING' | 'STAMPING_PRESS' | 'DIE_CASTING';
export type ShiftType = 'SHIFT_1' | 'SHIFT_2' | 'SHIFT_3';
export type InspectionStatus = 'PASS' | 'CONDITIONAL_PASS' | 'REJECT';

export interface QCReportEntity {
  id: string;
  header: {
    reportNumber: string;
    inspectionDate: string; // YYYY-MM-DD
    shift: ShiftType;
    inspectorName: string;
    operatorName: string;
    supervisorName: string;
    machineId: string;
    machineName: string;
    partNumber: string;
    partName: string;
    workOrderNumber: string;
    customerName: string;
    moldDieCode: string;
    materialGrade: string;
    lotNumber: string;
    processType: ProcessType;
  };
  moldSetup: {
    totalCavities: number;
    activeCavities: number;
    blockedCavities: number[];
    targetPartWeight: number; // in grams
    weightToleranceGrams: number;
    cavities: Array<{
      cavityNumber: number;
      isActive: boolean;
      blockReason?: string;
      targetWeight: number;
      actualWeight: number;
      weightDelta: number;
      isWeightInSpec: boolean;
    }>;
  };
  defects: Array<{
    id: string;
    name: string;
    indonesianName: string;
    description: string;
    count: number;
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
    affectedCavities?: number[];
  }>;
  production: {
    totalOk: number;
    totalNg: number;
    totalRework: number;
    totalProduced: number;
    rejectionRatePct: number;
    reworkRatePct: number;
    status: InspectionStatus;
    statusReasons: string[];
  };
  criticalDimensions: Array<{
    id: string;
    parameterName: string;
    toolUsed: string;
    nominal: number;
    upperSpecLimit: number;
    lowerSpecLimit: number;
    unit: string;
    samples: (number | null)[];
    mean: number | null;
    min: number | null;
    max: number | null;
    range: number | null;
    stdDev: number | null;
    isAllInSpec: boolean;
  }>;
}
`;

  const jsonSchema = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "QCInspectionReport",
  "type": "object",
  "required": ["reportNumber", "inspectionDate", "shift", "partNumber", "production"],
  "properties": {
    "reportNumber": { "type": "string", "pattern": "^QC-[A-Z0-9-]+$" },
    "inspectionDate": { "type": "string", "format": "date" },
    "shift": { "type": "string", "enum": ["SHIFT_1", "SHIFT_2", "SHIFT_3"] },
    "processType": { "type": "string", "enum": ["INJECTION_MOLDING", "STAMPING_PRESS", "DIE_CASTING"] },
    "production": {
      "type": "object",
      "required": ["totalOk", "totalNg", "totalRework", "totalProduced", "rejectionRatePct", "status"],
      "properties": {
        "totalOk": { "type": "integer", "minimum": 0 },
        "totalNg": { "type": "integer", "minimum": 0 },
        "totalRework": { "type": "integer", "minimum": 0 },
        "totalProduced": { "type": "integer", "minimum": 0 },
        "rejectionRatePct": { "type": "number", "minimum": 0, "maximum": 100 },
        "status": { "type": "string", "enum": ["PASS", "CONDITIONAL_PASS", "REJECT"] }
      }
    }
  }
}`;

  const architectureInfo = `
====================================================================
ARSITEKTUR SISTEM QUALITY CONTROL MANUFAKTUR (END-TO-END)
====================================================================

1. Presentation Tier (Frontend UI/UX):
   - Tablet-Friendly Field Client: Dikembangkan dengan React + Tailwind CSS + Lucide Icons.
   - Stepper +/- buttons: Memudahkan operator memasukkan data cacat saat mengenakan sarung tangan safety di shop floor.
   - Real-time SPC Dimension Validator: Langsung mewarnai sel hijau (in-spec) atau merah (OOS).
   - Dynamic Pareto Engine: Recharts yang merender frekuensi cacat dan garis persentase kumulatif 80/20.

2. Application Logic Tier:
   - Automated Calculation Service:
     * Total Produksi = Total OK + Total NG + Total Rework.
     * Rejection Rate (%) = (Total NG / Total Produksi) * 100.
     * Decision Rule Matrix:
       - PASS: Rejection Rate <= Batas Peringatan (1.5%) DAN seluruh dimensi kritis in-spec.
       - CONDITIONAL PASS: Rejection Rate antara 1.5% - 3.5% ATAU ada rework/cavity blocked >50%.
       - REJECT: Rejection Rate > 3.5% ATAU terdapat minimal 1 sampel dimensi kritis Out-Of-Spec (OOS).

3. Data Persistence Tier:
   - Relational Database: PostgreSQL / Cloud SQL dengan JSONB untuk parameter audit trail fleksibel.
   - Indexing: Dioptimalkan pada part_number, work_order, inspection_date, dan status.
   - Generated Columns: Otomatis menghitung total_produced dan delta berat part langsung di layer database.

4. Export & Compliance:
   - Siap cetak formulir standar ISO 9001 / IATF 16949 (Print CSS).
   - Ekspor Excel CSV dengan BOM UTF-8 untuk pelaporan ERP / SAP / Oracle NetSuite.
`;

  const getContent = () => {
    switch (activeTab) {
      case 'SQL':
        return sqlDDL;
      case 'TS':
        return tsSchema;
      case 'JSON':
        return jsonSchema;
      case 'ARCH':
        return architectureInfo;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6">
      <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Arsitektur & Skema Database Quality Control
              </h3>
              <p className="text-xs text-slate-400">
                Dokumentasi struktur tabel relasional, interface TypeScript, dan diagram arsitektur
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin!' : 'Salin Kode'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-800 bg-slate-900 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('SQL')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'SQL'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            PostgreSQL DDL Schema
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TS')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'TS'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            TypeScript Interfaces
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('JSON')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'JSON'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            JSON Schema
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ARCH')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'ARCH'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Arsitektur Sistem
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed selection:bg-indigo-500 selection:text-white">
          <pre className="whitespace-pre">{getContent()}</pre>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 text-xs text-slate-400 flex items-center justify-between">
          <span>Skema siap pakai untuk PostgreSQL, Supabase, Cloud SQL, atau MySQL.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
