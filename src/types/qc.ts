export type ProcessType = 'EXTRUDER' | 'PROSES_2' | 'INJECTION_MOLDING' | 'STAMPING_PRESS';

export type ShiftType = 'SHIFT_1' | 'SHIFT_2' | 'SHIFT_3';

export type InspectionStatus = 'PASS' | 'CONDITIONAL_PASS' | 'REJECT';

export interface HeaderMetadata {
  reportNumber: string; // e.g. QC-EXT-(DD/MM/YY)-(Shift)-(Nomor urut)
  inspectionDate: string;
  shift: ShiftType;
  inspectorName: string;
  operatorName: string;
  supervisorName: string;
  machineId: string;
  machineName: string;
  partNumber: string;
  partName: string;
  workOrderNumber: string; // Nomor SPK (Surat Perintah Kerja)
  customerName: string;
  moldDieCode: string; // Kode Die Lip / Roll Extruder / Mold Kiefel
  materialGrade: string;
  lotNumber: string;
  processType: ProcessType;
}

export interface CavityDetail {
  cavityNumber: number;
  isActive: boolean;
  blockReason?: string;
  targetWeight: number; // in grams
  actualWeight: number; // in grams
  weightDelta: number; // actual - target
  isWeightInSpec: boolean;
}

export interface MoldDieSetup {
  totalCavities: number;
  activeCavities: number;
  blockedCavities: number[];
  targetPartWeight: number; // in grams
  weightToleranceGrams: number; // e.g. ±0.15g
  cavities: CavityDetail[];
}

export interface DefectItem {
  id: string;
  name: string;
  indonesianName: string;
  description: string;
  count: number;
  applicableProcess: ProcessType[];
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  affectedCavities?: number[];
}

export interface ProductionSummary {
  totalOk: number;
  totalNg: number;
  totalRework: number;
  totalProduced: number;
  rejectionRatePct: number;
  reworkRatePct: number;
  rejectionThresholdWarn: number; // default 1.5%
  rejectionThresholdFail: number; // default 3.5%
  status: InspectionStatus;
  statusReasons: string[];
}

export interface DimensionSampleRow {
  id: string;
  parameterName: string;
  toolUsed: string; // Vernier Caliper, Micrometer, Meteran Gulung, dll
  nominal: number; // in mm
  upperSpecLimit: number; // USL
  lowerSpecLimit: number; // LSL
  unit: string; // mm, inch, deg, m, kg
  samples: (number | null)[]; // e.g. 5 samples
  sampleLabels?: string[]; // e.g. ['Sisi Kiri', 'Tengah Kiri', 'Center', 'Tengah Kanan', 'Sisi Kanan']
  mean: number | null;
  min: number | null;
  max: number | null;
  range: number | null;
  stdDev: number | null;
  isAllInSpec: boolean;
  outOfSpecIndices: number[];
  category?: 'THICKNESS_WIDTH' | 'THICKNESS_LENGTH' | 'ROLL_WIDTH' | 'ROLL_LENGTH' | 'ROLL_WEIGHT' | 'OTHER';
}

export interface QCReport {
  id: string;
  header: HeaderMetadata;
  moldSetup: MoldDieSetup;
  defects: DefectItem[];
  production: ProductionSummary;
  criticalDimensions: DimensionSampleRow[];
  notes: string;
  correctiveAction: string;
  approvedBy?: string;
  approvalDate?: string;
  createdAt: string;
  updatedAt: string;
}
