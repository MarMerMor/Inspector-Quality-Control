import { QCReport, ShiftType } from '../types/qc';
import {
  createDefaultExtruderReport,
  createProses2Report,
  generateAutoReportNumber,
} from './sampleData';

const STORAGE_KEY = 'QMOLD_SAVED_REPORTS_V2';

export interface SavedReportItem {
  id: string;
  isTemplate?: boolean;
  templateLabel?: string;
  savedAt: string;
  report: QCReport;
}

/**
 * Initializes default templates in storage if none exist
 */
function initializeDefaultTemplates(): SavedReportItem[] {
  const extruder = createDefaultExtruderReport();
  const proses2 = createProses2Report();

  const defaults: SavedReportItem[] = [
    {
      id: 'template-ext-master',
      isTemplate: true,
      templateLabel: 'Master Template: Extruder Roll Sheet (Micrometer & Meteran Gulung)',
      savedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      report: {
        ...extruder,
        id: 'template-ext-master',
        header: {
          ...extruder.header,
          reportNumber: 'TPL-EXT-001',
          workOrderNumber: 'SPK-TEMPLATE-EXT',
          lotNumber: 'LOT-MASTER-EXT',
        },
      },
    },
    {
      id: 'template-p2-master',
      isTemplate: true,
      templateLabel: 'Master Template: Proses 2 Mesin Kiefel & Thermoforming',
      savedAt: new Date(Date.now() - 86400000).toISOString(),
      report: {
        ...proses2,
        id: 'template-p2-master',
        header: {
          ...proses2.header,
          reportNumber: 'TPL-P2-001',
          workOrderNumber: 'SPK-TEMPLATE-P2',
          lotNumber: 'LOT-MASTER-P2',
        },
      },
    },
  ];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  } catch (e) {
    console.error('Failed to set initial templates in localStorage', e);
  }

  return defaults;
}

/**
 * Loads all saved reports from localStorage
 */
export function getAllSavedReports(): SavedReportItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initializeDefaultTemplates();
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return initializeDefaultTemplates();
  } catch (e) {
    console.error('Error reading saved reports from localStorage', e);
    return initializeDefaultTemplates();
  }
}

/**
 * Saves or updates a report in localStorage
 */
export function saveReportToStorage(
  report: QCReport,
  options?: { isTemplate?: boolean; templateLabel?: string; asNew?: boolean }
): { success: boolean; item: SavedReportItem } {
  try {
    const items = getAllSavedReports();
    const isNew = options?.asNew || !items.some((i) => i.id === report.id);

    const nowIso = new Date().toISOString();
    const targetId = isNew ? `rep-${Date.now()}` : report.id;

    const updatedReport: QCReport = {
      ...report,
      id: targetId,
      updatedAt: nowIso,
    };

    const newItem: SavedReportItem = {
      id: targetId,
      isTemplate: options?.isTemplate ?? false,
      templateLabel: options?.templateLabel || (options?.isTemplate ? `${report.header.partName} Template` : undefined),
      savedAt: nowIso,
      report: updatedReport,
    };

    let updatedList: SavedReportItem[];
    if (isNew) {
      updatedList = [newItem, ...items];
    } else {
      updatedList = items.map((i) => (i.id === targetId ? newItem : i));
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    return { success: true, item: newItem };
  } catch (e) {
    console.error('Failed to save report to localStorage', e);
    return {
      success: false,
      item: {
        id: report.id,
        savedAt: new Date().toISOString(),
        report,
      },
    };
  }
}

/**
 * Deletes a report from localStorage by ID
 */
export function deleteReportFromStorage(id: string): boolean {
  try {
    const items = getAllSavedReports();
    const filtered = items.filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.error('Failed to delete report from storage', e);
    return false;
  }
}

/**
 * Generates a duplicated fresh report from an existing report / template
 * Preserves tooling specs, dimension nominals, defect catalog, machine and part metadata,
 * but resets inspection date, clears production counts and sample values for a new run.
 */
export function createDuplicateForNewInspection(
  source: QCReport,
  newShift?: ShiftType
): QCReport {
  const todayStr = new Date().toISOString().split('T')[0];
  const shiftToUse = newShift || source.header.shift || 'SHIFT_1';
  const newReportNumber = generateAutoReportNumber(
    source.header.processType,
    todayStr,
    shiftToUse,
    '001'
  );

  // Reset defect counts to 0, preserve catalog & severity & applicable process
  const resetDefects = source.defects.map((d) => ({
    ...d,
    count: 0,
    affectedCavities: [],
  }));

  // Reset critical dimension samples to empty/null while keeping nominals and USL/LSL
  const resetDimensions = source.criticalDimensions.map((dim) => ({
    ...dim,
    samples: [null, null, null, null, null],
    mean: null,
    min: null,
    max: null,
    range: null,
    stdDev: null,
    isAllInSpec: true,
    outOfSpecIndices: [],
  }));

  return {
    ...source,
    id: `rep-${Date.now()}`,
    header: {
      ...source.header,
      reportNumber: newReportNumber,
      inspectionDate: todayStr,
      shift: shiftToUse,
      workOrderNumber: `SPK-${todayStr.slice(2).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      lotNumber: `LOT-${todayStr.slice(5).replace(/-/g, '')}`,
    },
    defects: resetDefects,
    criticalDimensions: resetDimensions,
    production: {
      totalOk: 0,
      totalNg: 0,
      totalRework: 0,
      totalProduced: 0,
      rejectionRatePct: 0,
      reworkRatePct: 0,
      rejectionThresholdWarn: source.production.rejectionThresholdWarn || 1.5,
      rejectionThresholdFail: source.production.rejectionThresholdFail || 3.5,
      status: 'PASS',
      statusReasons: ['Semua parameter inspeksi dalam batas normal standar'],
    },
    notes: '',
    correctiveAction: '',
    approvedBy: '',
    approvalDate: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Exports all saved reports to a JSON file backup
 */
export function exportAllSavedReportsBackup(): void {
  const items = getAllSavedReports();
  const jsonContent = JSON.stringify(items, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `QMold_All_Reports_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports reports from JSON backup string
 */
export function importReportsFromJSON(
  jsonString: string
): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      return { success: false, count: 0, error: 'Format data JSON tidak valid (harus array).' };
    }

    const existing = getAllSavedReports();
    const existingIds = new Set(existing.map((e) => e.id));

    let addedCount = 0;
    const merged = [...existing];

    for (const item of parsed) {
      if (item && item.report && item.report.header) {
        if (!existingIds.has(item.id)) {
          merged.push(item);
          existingIds.add(item.id);
          addedCount++;
        } else {
          // Update existing
          const idx = merged.findIndex((m) => m.id === item.id);
          if (idx !== -1) {
            merged[idx] = item;
            addedCount++;
          }
        }
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return { success: true, count: addedCount };
  } catch (e: any) {
    return { success: false, count: 0, error: e?.message || 'Gagal memproses file JSON.' };
  }
}
