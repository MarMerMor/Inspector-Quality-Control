import { QCReport, ShiftType } from '../types/qc';
import {
  createDefaultExtruderReport,
  createProses2Report,
  generateAutoReportNumber,
} from './sampleData';

const STORAGE_KEY = 'QMOLD_SAVED_REPORTS_V3';
const STORAGE_INIT_KEY = 'QMOLD_REPORTS_INIT_DONE_V3';

export interface SavedReportItem {
  id: string;
  isTemplate?: boolean;
  templateLabel?: string;
  savedAt: string;
  report: QCReport;
}

/**
 * Initializes default templates in storage on the very first visit only
 */
export function initializeDefaultTemplates(): SavedReportItem[] {
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
    localStorage.setItem(STORAGE_INIT_KEY, 'true');
  } catch (e) {
    console.error('Failed to set initial templates in localStorage', e);
  }

  return defaults;
}

/**
 * Loads all saved reports from localStorage
 * Guarantees that deletions (including deleting everything) are never overwritten by auto-reinitialization!
 */
export function getAllSavedReports(): SavedReportItem[] {
  try {
    const isInit = localStorage.getItem(STORAGE_INIT_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);

    // If never initialized at all in browser history:
    if (!isInit && raw === null) {
      return initializeDefaultTemplates();
    }

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (err) {
        console.error('Failed to parse saved reports JSON', err);
      }
    }

    // If initialized but empty, honor the user's deletion and return empty list!
    return [];
  } catch (e) {
    console.error('Error reading saved reports from localStorage', e);
    return [];
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
    localStorage.setItem(STORAGE_INIT_KEY, 'true');
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
    localStorage.setItem(STORAGE_INIT_KEY, 'true');
    return true;
  } catch (e) {
    console.error('Failed to delete report from storage', e);
    return false;
  }
}

/**
 * Completely clears all saved reports from storage
 */
export function clearAllSavedReportsFromStorage(): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(STORAGE_INIT_KEY, 'true');
    return true;
  } catch (e) {
    console.error('Failed to clear saved reports', e);
    return false;
  }
}

/**
 * Restores factory default templates if requested
 */
export function restoreFactoryTemplates(): SavedReportItem[] {
  return initializeDefaultTemplates();
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
