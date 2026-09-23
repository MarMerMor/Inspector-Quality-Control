import { DefectItem, DimensionSampleRow, ProcessType, ProductionSummary, QCReport, ShiftType } from '../types/qc';
import { calculateDimensionStats, evaluateProductionSummary } from './calculations';

/**
 * Generates an automatic QC report number according to the formula:
 * (QC-EXT-(DD/MM/YY)-(Shift)-(Nomor urut laporan)
 * Example: QC-EXT-23/09/26-1-001
 * For Proses 2 (Kiefel & Thermoforming): QC-P2-23/09/26-1-001
 */
export function generateAutoReportNumber(
  processType: ProcessType,
  dateStr: string,
  shift: ShiftType,
  seqNumber: string | number = '001'
): string {
  // Format dateStr (YYYY-MM-DD) into DD/MM/YY
  let dd = '23';
  let mm = '09';
  let yy = '26';

  if (dateStr && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      mm = parts[1];
      dd = parts[2];
      yy = year.length === 4 ? year.slice(-2) : year;
    }
  }

  // Determine shift number
  let shiftNum = '1';
  if (shift === 'SHIFT_2') shiftNum = '2';
  else if (shift === 'SHIFT_3') shiftNum = '3';

  // Format sequence number to at least 3 digits
  const seqStr = String(seqNumber).padStart(3, '0');

  if (processType === 'PROSES_2') {
    return `QC-P2-${dd}/${mm}/${yy}-${shiftNum}-${seqStr}`;
  }

  // Default: Extruder -> QC-EXT-(DD/MM/YY)-(Shift)-(Nomor urut laporan)
  return `QC-EXT-${dd}/${mm}/${yy}-${shiftNum}-${seqStr}`;
}

export const COMMON_DEFECTS: Omit<DefectItem, 'count' | 'affectedCavities'>[] = [
  // Extruder Defects (Rollsheet Extrusion)
  {
    id: 'DEF_GEL_UNMELT',
    name: 'Gel / Unmelt',
    indonesianName: 'Bintik Gel / Resin Belum Meleleh',
    description: 'Bintik transparan atau partikel resin yang tidak homogen / belum meleleh sempurna dari screw barrel',
    applicableProcess: ['EXTRUDER', 'INJECTION_MOLDING'],
    severity: 'MAJOR',
  },
  {
    id: 'DEF_DIE_LINE',
    name: 'Die Line / Streak',
    indonesianName: 'Garis Alir Die Lip',
    description: 'Garis memanjang searah arah tarikan lembaran rollsheet akibat goresan atau kotoran pada bibir T-Die',
    applicableProcess: ['EXTRUDER'],
    severity: 'MAJOR',
  },
  {
    id: 'DEF_THICKNESS_UNEVEN',
    name: 'Thickness Variation',
    indonesianName: 'Ketebalan Tidak Rata / Gauge Band',
    description: 'Penyimpangan ketebalan lembaran melintang (cross-direction) melebihi batas toleransi micrometer',
    applicableProcess: ['EXTRUDER'],
    severity: 'CRITICAL',
  },
  {
    id: 'DEF_WAVY_SHEET',
    name: 'Wavy Sheet / Curling',
    indonesianName: 'Lembaran Bergelombang / Melengkung',
    description: 'Ketidakrataan permukaan lembaran akibat pendinginan roll chill yang tidak seragam atau tegangan tarikan',
    applicableProcess: ['EXTRUDER'],
    severity: 'CRITICAL',
  },
  {
    id: 'DEF_BLACK_SPOT',
    name: 'Black Spot / Karbon',
    indonesianName: 'Bintik Hitam / Kontaminasi',
    description: 'Bintik hitam partikel resin terdegradasi / gosong atau kontaminasi kotoran',
    applicableProcess: ['EXTRUDER', 'PROSES_2', 'INJECTION_MOLDING', 'STAMPING_PRESS'],
    severity: 'MAJOR',
  },
  {
    id: 'DEF_AIR_BUBBLE',
    name: 'Air Bubble / Blister',
    indonesianName: 'Gelembung Udara pada Sheet',
    description: 'Gelembung udara atau uap lembap (moisture) terperangkap di dalam lembaran rollsheet',
    applicableProcess: ['EXTRUDER'],
    severity: 'MAJOR',
  },
  {
    id: 'DEF_ROLL_SCRATCH',
    name: 'Roll Scratch / Mark',
    indonesianName: 'Goresan Permukaan Roller',
    description: 'Goresan fisik pada permukaan rollsheet akibat gesekan dengan roll pendingin, calender, atau winder',
    applicableProcess: ['EXTRUDER'],
    severity: 'MINOR',
  },
  {
    id: 'DEF_COLOR_STREAK',
    name: 'Color Streak / Belang',
    indonesianName: 'Garis Warna Tidak Merata',
    description: 'Pencampuran masterbatch atau aditif pewarna yang tidak merata di barrel',
    applicableProcess: ['EXTRUDER'],
    severity: 'MINOR',
  },

  // Proses 2 Defects: Mesin Kiefel & Thermoforming
  {
    id: 'DEF_WEBBING',
    name: 'Corner Webbing',
    indonesianName: 'Kerutan Sudut Pembentukan',
    description: 'Lipatan atau kerutan material berlebih pada sudut hasil vakum/tekanan cetakan Kiefel',
    applicableProcess: ['PROSES_2'],
    severity: 'CRITICAL',
  },
  {
    id: 'DEF_SHORT_FORM',
    name: 'Short Forming / Detail Kurang',
    indonesianName: 'Cetakan Tidak Penuh / Kurang Tajam',
    description: 'Lembaran rollsheet kurang menempel ke kontur cetakan mold akibat temperatur pemanas atau vakum kurang',
    applicableProcess: ['PROSES_2', 'INJECTION_MOLDING'],
    severity: 'CRITICAL',
  },
  {
    id: 'DEF_BOTTOM_THIN',
    name: 'Bottom Thinning',
    indonesianName: 'Dinding Bawah Terlalu Tipis',
    description: 'Peregangan berlebih pada dasar produk hasil forming sehingga ketebalan jatuh di bawah batas aman',
    applicableProcess: ['PROSES_2'],
    severity: 'CRITICAL',
  },
  {
    id: 'DEF_CUTTING_BURR',
    name: 'Cutting Burr / Flash',
    indonesianName: 'Sirip Potong Pisau Kiefel',
    description: 'Sisa material tajam / berserabut di sekeliling flange produk akibat pisau potong tumpul atau celah punch',
    applicableProcess: ['PROSES_2', 'STAMPING_PRESS'],
    severity: 'MAJOR',
  },
  {
    id: 'DEF_HEAT_WARPAGE',
    name: 'Heat Warpage / Distorsi',
    indonesianName: 'Melengkung Akibat Panas',
    description: 'Deformasi bentuk produk setelah keluar dari stasiun pemotong akibat pendinginan mold belum selesai',
    applicableProcess: ['PROSES_2', 'STAMPING_PRESS'],
    severity: 'MAJOR',
  },
  {
    id: 'DEF_CUTTING_CRACK',
    name: 'Cutting Crack',
    indonesianName: 'Retak / Pecah Hasil Pemotongan',
    description: 'Pecah atau retak pada tepi produk saat proses punching / die cutting di mesin Kiefel',
    applicableProcess: ['PROSES_2'],
    severity: 'CRITICAL',
  },
];

/**
 * Creates the default Extruder inspection report
 * Focusing on Rollsheet thickness (measured with Micrometer) and width (measured with Meteran Gulung)
 */
export function createDefaultExtruderReport(): QCReport {
  const todayStr = new Date().toISOString().split('T')[0];
  const autoReportNo = generateAutoReportNumber('EXTRUDER', todayStr, 'SHIFT_1', '001');

  // Extruder QC: Pengukuran ketebalan arah lebar & panjang (Micrometer) dan lebar rollsheet (Meteran Gulung)
  const initialDimensions: DimensionSampleRow[] = [
    {
      id: 'DIM_EXT_THICK_WIDTH',
      parameterName: 'Ketebalan Bagian Lebar (Cross-Direction)',
      toolUsed: 'Micrometer',
      nominal: 0.50,
      upperSpecLimit: 0.53,
      lowerSpecLimit: 0.47,
      unit: 'mm',
      sampleLabels: ['Sisi Kiri', 'Tengah Kiri', 'Center', 'Tengah Kanan', 'Sisi Kanan'],
      samples: [0.502, 0.498, 0.504, 0.501, 0.497],
      mean: null,
      min: null,
      max: null,
      range: null,
      stdDev: null,
      isAllInSpec: true,
      outOfSpecIndices: [],
      category: 'THICKNESS_WIDTH',
    },
    {
      id: 'DIM_EXT_THICK_LENGTH',
      parameterName: 'Ketebalan Bagian Panjang (Machine-Direction)',
      toolUsed: 'Micrometer',
      nominal: 0.50,
      upperSpecLimit: 0.53,
      lowerSpecLimit: 0.47,
      unit: 'mm',
      sampleLabels: ['0m (Awal)', '50m', '100m (Tengah)', '150m', '200m (Akhir)'],
      samples: [0.500, 0.503, 0.501, 0.498, 0.502],
      mean: null,
      min: null,
      max: null,
      range: null,
      stdDev: null,
      isAllInSpec: true,
      outOfSpecIndices: [],
      category: 'THICKNESS_LENGTH',
    },
    {
      id: 'DIM_EXT_WIDTH',
      parameterName: 'Lebar Rollsheet (Sheet Width)',
      toolUsed: 'Meteran Gulung',
      nominal: 650.0,
      upperSpecLimit: 653.0,
      lowerSpecLimit: 647.0,
      unit: 'mm',
      sampleLabels: ['Awal', '50m', '100m', '150m', 'Akhir'],
      samples: [650.0, 650.5, 651.0, 649.5, 650.0],
      mean: null,
      min: null,
      max: null,
      range: null,
      stdDev: null,
      isAllInSpec: true,
      outOfSpecIndices: [],
      category: 'ROLL_WIDTH',
    },
    {
      id: 'DIM_EXT_LENGTH',
      parameterName: 'Panjang Rollsheet (Roll Length)',
      toolUsed: 'Meteran Gulung / Counter',
      nominal: 200.0,
      upperSpecLimit: 205.0,
      lowerSpecLimit: 198.0,
      unit: 'm',
      sampleLabels: ['Panjang Roll', '-', '-', '-', '-'],
      samples: [200.5, null, null, null, null],
      mean: null,
      min: null,
      max: null,
      range: null,
      stdDev: null,
      isAllInSpec: true,
      outOfSpecIndices: [],
      category: 'ROLL_LENGTH',
    },
  ];

  // Calculate SPC for initial dimensions
  const processedDimensions = initialDimensions.map((dim) => {
    const stats = calculateDimensionStats(dim.samples, dim.upperSpecLimit, dim.lowerSpecLimit);
    return { ...dim, ...stats };
  });

  // Extruder roll sheet: Cavity & Die Lip configuration removed (not needed for rollsheet feed)
  const cavities: any[] = [];
  const defects: DefectItem[] = [];

  const totalNg = 1; // 1 roll sheet hold
  const totalRework = 1; // 1 roll re-trimming
  const totalOk = 48; // 48 roll sheet lolos siap Proses 2

  const moldSetup = {
    totalCavities: 0,
    activeCavities: 0,
    blockedCavities: [],
    targetPartWeight: 120.0, // Berat standar roll (kg)
    weightToleranceGrams: 1.5,
    cavities,
  };

  const production = evaluateProductionSummary(
    totalOk,
    totalNg,
    totalRework,
    1.5,
    3.5,
    processedDimensions,
    moldSetup
  );

  return {
    id: `QC-EXT-${todayStr.replace(/-/g, '')}-001`,
    header: {
      reportNumber: autoReportNo,
      inspectionDate: todayStr,
      shift: 'SHIFT_1',
      inspectorName: 'Bambang Sudirman (QC-Extruder)',
      operatorName: 'Agus Riyadi',
      supervisorName: 'Hendra Gunawan',
      machineId: 'Extruder 1',
      machineName: 'Extruder 1',
      partNumber: 'LOT-EXT-260923-01',
      partName: 'Roll Sheet Clear (t=0.50mm, w=650mm)',
      workOrderNumber: 'SPK-2026-09-8812',
      customerName: 'Internal Produksi (Lanjut Proses 2)',
      moldDieCode: '',
      materialGrade: 'PET Resin Grade A',
      lotNumber: 'LOT-EXT-260923-01',
      processType: 'EXTRUDER',
    },
    moldSetup,
    defects,
    production,
    criticalDimensions: processedDimensions,
    notes: 'Kondisi mesin Extruder stabil. Temperatur barrel zona 1-5 sesuai profil (245°C - 265°C). Ketebalan dan lebar roll sheet diperiksa berkala menggunakan Micrometer dan Meteran Gulung.',
    correctiveAction: 'Toleransi ketebalan melintang dan memanjang stabil, roll sheet siap dikirim ke stasiun uncoiler Mesin Kiefel.',
    approvedBy: 'Hendra Gunawan (QC Leader)',
    approvalDate: `${todayStr} 14:15 WIB`,
    createdAt: `${todayStr}T07:30:00Z`,
    updatedAt: `${todayStr}T14:15:00Z`,
  };
}

/**
 * Creates the default Proses 2 (Mesin Kiefel & Thermoforming) inspection report
 */
export function createProses2Report(): QCReport {
  const todayStr = new Date().toISOString().split('T')[0];
  const autoReportNo = generateAutoReportNumber('PROSES_2', todayStr, 'SHIFT_1', '001');

  const initialDimensions: DimensionSampleRow[] = [
    {
      id: 'DIM_P2_THICK_BASE',
      parameterName: 'Ketebalan Dasar Produk (Base Thickness)',
      toolUsed: 'Micrometer',
      nominal: 0.35,
      upperSpecLimit: 0.40,
      lowerSpecLimit: 0.30,
      unit: 'mm',
      samples: [0.35, 0.36, 0.34, 0.35, 0.35],
      mean: null,
      min: null,
      max: null,
      range: null,
      stdDev: null,
      isAllInSpec: true,
      outOfSpecIndices: [],
    },
    {
      id: 'DIM_P2_HEIGHT',
      parameterName: 'Tinggi Produk / Tray (Depth)',
      toolUsed: 'Digital Caliper 150mm',
      nominal: 45.00,
      upperSpecLimit: 45.50,
      lowerSpecLimit: 44.50,
      unit: 'mm',
      samples: [45.02, 45.08, 44.95, 45.01, 45.04],
      mean: null,
      min: null,
      max: null,
      range: null,
      stdDev: null,
      isAllInSpec: true,
      outOfSpecIndices: [],
    },
    {
      id: 'DIM_P2_FLANGE_WIDTH',
      parameterName: 'Lebar Flange Potong (Cutting Flange)',
      toolUsed: 'Digital Caliper 150mm',
      nominal: 8.50,
      upperSpecLimit: 8.80,
      lowerSpecLimit: 8.20,
      unit: 'mm',
      samples: [8.52, 8.48, 8.55, 8.50, 8.51],
      mean: null,
      min: null,
      max: null,
      range: null,
      stdDev: null,
      isAllInSpec: true,
      outOfSpecIndices: [],
    },
  ];

  const processedDimensions = initialDimensions.map((dim) => {
    const stats = calculateDimensionStats(dim.samples, dim.upperSpecLimit, dim.lowerSpecLimit);
    return { ...dim, ...stats };
  });

  // 12 Cavity Thermoforming Mold on Kiefel machine
  const cavities = Array.from({ length: 12 }, (_, i) => ({
    cavityNumber: i + 1,
    isActive: i !== 5, // Cavity 6 is blocked
    blockReason: i === 5 ? 'Plug assist aus / web melipat' : undefined,
    targetWeight: 18.50,
    actualWeight: i === 5 ? 0 : 18.48 + (i % 3) * 0.05,
    weightDelta: i === 5 ? -18.50 : Number(((18.48 + (i % 3) * 0.05) - 18.50).toFixed(2)),
    isWeightInSpec: true,
  }));

  const defects: DefectItem[] = COMMON_DEFECTS.filter((d) =>
    d.applicableProcess.includes('PROSES_2')
  ).map((d) => {
    let count = 0;
    let affectedCavities: number[] = [];
    if (d.id === 'DEF_WEBBING') {
      count = 4;
      affectedCavities = [3, 8];
    } else if (d.id === 'DEF_CUTTING_BURR') {
      count = 6;
      affectedCavities = [2, 11];
    } else if (d.id === 'DEF_SHORT_FORM') {
      count = 2;
      affectedCavities = [7];
    }
    return { ...d, count, affectedCavities };
  });

  const totalNg = defects.reduce((sum, d) => sum + d.count, 0); // 12
  const totalRework = 5;
  const totalOk = 3200;

  const moldSetup = {
    totalCavities: 12,
    activeCavities: 11,
    blockedCavities: [6],
    targetPartWeight: 18.50,
    weightToleranceGrams: 0.35,
    cavities,
  };

  const production = evaluateProductionSummary(
    totalOk,
    totalNg,
    totalRework,
    1.5,
    3.5,
    processedDimensions,
    moldSetup
  );

  return {
    id: `QC-P2-${todayStr.replace(/-/g, '')}-001`,
    header: {
      reportNumber: autoReportNo,
      inspectionDate: todayStr,
      shift: 'SHIFT_1',
      inspectorName: 'Doni Pratama (QC-Proses 2)',
      operatorName: 'Suryanto',
      supervisorName: 'Kurniawan Santoso',
      machineId: 'KIEFEL-KMD-78',
      machineName: 'Mesin Kiefel KMD 78 (Thermoforming)',
      partNumber: 'TRAY-FOOD-180',
      partName: 'Food Packaging Tray (Thermoforming)',
      workOrderNumber: 'SPK-2026-09-7744',
      customerName: 'PT Fast Consumer Goods',
      moldDieCode: 'MOLD-KIEFEL-12CAV-REV2',
      materialGrade: 'Roll Sheet Clear 0.50mm (Hasil Extruder)',
      lotNumber: 'LOT-P2-260923-01',
      processType: 'PROSES_2',
    },
    moldSetup,
    defects,
    production,
    criticalDimensions: processedDimensions,
    notes: 'Kondisi mesin Kiefel stabil. Vakum pembentukan dan pemotong punch presisi. Cavity 6 diblok sementara karena plug assist aus, sudah diserahkan ke teknisi cetakan.',
    correctiveAction: 'Suhu pemanas atas diturunkan 2°C pada zona 3 untuk mengurangi ketegangan sudut (webbing).',
    approvedBy: 'Kurniawan Santoso (QA Supervisor)',
    approvalDate: `${todayStr} 15:00 WIB`,
    createdAt: `${todayStr}T07:30:00Z`,
    updatedAt: `${todayStr}T15:00:00Z`,
  };
}

/**
 * Creates an empty fresh blank report for user input with all fields cleared
 */
export function createBlankReport(): QCReport {
  const todayStr = new Date().toISOString().split('T')[0];

  const cavities: any[] = [];
  const defects: DefectItem[] = [];

  // Standard Extruder dimensions with null (empty) initial samples
  const initialDimensions: DimensionSampleRow[] = [
    {
      id: 'DIM_EXT_THICK_WIDTH',
      parameterName: 'Ketebalan Bagian Lebar (Cross-Direction)',
      toolUsed: 'Micrometer',
      nominal: 0.50,
      upperSpecLimit: 0.53,
      lowerSpecLimit: 0.47,
      unit: 'mm',
      sampleLabels: ['Sisi Kiri', 'Tengah Kiri', 'Center', 'Tengah Kanan', 'Sisi Kanan'],
      samples: [null, null, null, null, null],
      mean: null,
      min: null,
      max: null,
      range: null,
      stdDev: null,
      isAllInSpec: true,
      outOfSpecIndices: [],
      category: 'THICKNESS_WIDTH',
    },
    {
      id: 'DIM_EXT_THICK_LENGTH',
      parameterName: 'Ketebalan Bagian Panjang (Machine-Direction)',
      toolUsed: 'Micrometer',
      nominal: 0.50,
      upperSpecLimit: 0.53,
      lowerSpecLimit: 0.47,
      unit: 'mm',
      sampleLabels: ['0m (Awal)', '50m', '100m (Tengah)', '150m', '200m (Akhir)'],
      samples: [null, null, null, null, null],
      mean: null,
      min: null,
      max: null,
      range: null,
      stdDev: null,
      isAllInSpec: true,
      outOfSpecIndices: [],
      category: 'THICKNESS_LENGTH',
    },
    {
      id: 'DIM_EXT_WIDTH',
      parameterName: 'Lebar Rollsheet (Sheet Width)',
      toolUsed: 'Meteran Gulung',
      nominal: 650.0,
      upperSpecLimit: 653.0,
      lowerSpecLimit: 647.0,
      unit: 'mm',
      sampleLabels: ['Awal', '50m', '100m', '150m', 'Akhir'],
      samples: [null, null, null, null, null],
      mean: null,
      min: null,
      max: null,
      range: null,
      stdDev: null,
      isAllInSpec: true,
      outOfSpecIndices: [],
      category: 'ROLL_WIDTH',
    },
    {
      id: 'DIM_EXT_LENGTH',
      parameterName: 'Panjang Rollsheet (Roll Length)',
      toolUsed: 'Meteran Gulung / Counter',
      nominal: 200.0,
      upperSpecLimit: 205.0,
      lowerSpecLimit: 198.0,
      unit: 'm',
      sampleLabels: ['Panjang Roll', '-', '-', '-', '-'],
      samples: [null, null, null, null, null],
      mean: null,
      min: null,
      max: null,
      range: null,
      stdDev: null,
      isAllInSpec: true,
      outOfSpecIndices: [],
      category: 'ROLL_LENGTH',
    },
  ];

  const moldSetup = {
    totalCavities: 0,
    activeCavities: 0,
    blockedCavities: [],
    targetPartWeight: 0,
    weightToleranceGrams: 0,
    cavities,
  };

  const production: ProductionSummary = {
    totalOk: 0,
    totalNg: 0,
    totalRework: 0,
    totalProduced: 0,
    rejectionRatePct: 0,
    reworkRatePct: 0,
    rejectionThresholdWarn: 1.5,
    rejectionThresholdFail: 3.5,
    status: 'PASS',
    statusReasons: ['Menunggu input data pengukuran dan produksi'],
  };

  return {
    id: `QC-NEW-${Date.now().toString().slice(-4)}`,
    header: {
      reportNumber: '',
      inspectionDate: todayStr,
      shift: 'SHIFT_1',
      inspectorName: '',
      operatorName: '',
      supervisorName: '',
      machineId: '',
      machineName: '',
      partNumber: '',
      partName: '',
      workOrderNumber: '',
      customerName: '',
      moldDieCode: '',
      materialGrade: '',
      lotNumber: '',
      processType: 'EXTRUDER',
    },
    moldSetup,
    defects,
    production,
    criticalDimensions: initialDimensions,
    notes: '',
    correctiveAction: '',
    approvedBy: '',
    approvalDate: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Backward compatibility export aliases
export const createDefaultInjectionMoldingReport = createDefaultExtruderReport;
export const createStampingPressReport = createProses2Report;
