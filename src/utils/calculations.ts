import {
  CavityDetail,
  DimensionSampleRow,
  InspectionStatus,
  MoldDieSetup,
  ProductionSummary,
} from '../types/qc';

/**
 * Calculates SPC metrics for dimensional measurement samples
 */
export function calculateDimensionStats(
  samples: (number | null)[],
  usl: number,
  lsl: number
): {
  mean: number | null;
  min: number | null;
  max: number | null;
  range: number | null;
  stdDev: number | null;
  isAllInSpec: boolean;
  outOfSpecIndices: number[];
} {
  const validNumbers = samples.filter((s): s is number => s !== null && !isNaN(s));
  
  if (validNumbers.length === 0) {
    return {
      mean: null,
      min: null,
      max: null,
      range: null,
      stdDev: null,
      isAllInSpec: true,
      outOfSpecIndices: [],
    };
  }

  const sum = validNumbers.reduce((acc, val) => acc + val, 0);
  const mean = sum / validNumbers.length;
  const min = Math.min(...validNumbers);
  const max = Math.max(...validNumbers);
  const range = max - min;

  // Sample standard deviation
  let stdDev: number | null = null;
  if (validNumbers.length > 1) {
    const variance =
      validNumbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      (validNumbers.length - 1);
    stdDev = Math.sqrt(variance);
  } else {
    stdDev = 0;
  }

  const outOfSpecIndices: number[] = [];
  samples.forEach((val, idx) => {
    if (val !== null && !isNaN(val)) {
      if (val > usl || val < lsl) {
        outOfSpecIndices.push(idx);
      }
    }
  });

  const isAllInSpec = outOfSpecIndices.length === 0;

  return {
    mean: Number(mean.toFixed(3)),
    min: Number(min.toFixed(3)),
    max: Number(max.toFixed(3)),
    range: Number(range.toFixed(3)),
    stdDev: stdDev !== null ? Number(stdDev.toFixed(4)) : null,
    isAllInSpec,
    outOfSpecIndices,
  };
}

/**
 * Recalculates Cavity weights and in-spec status based on tolerance
 */
export function evaluateCavityDetail(
  cavity: CavityDetail,
  targetWeight: number,
  tolerance: number
): CavityDetail {
  const weightDelta = Number((cavity.actualWeight - targetWeight).toFixed(3));
  const isWeightInSpec =
    !cavity.isActive ||
    Math.abs(weightDelta) <= tolerance;

  return {
    ...cavity,
    targetWeight,
    weightDelta,
    isWeightInSpec,
  };
}

/**
 * Evaluates production status (PASS, CONDITIONAL_PASS, REJECT)
 */
export function evaluateProductionSummary(
  totalOk: number,
  totalNg: number,
  totalRework: number,
  warnThreshold: number = 1.5,
  failThreshold: number = 3.5,
  criticalDimensions: DimensionSampleRow[] = [],
  moldSetup?: MoldDieSetup
): ProductionSummary {
  const safeOk = Math.max(0, totalOk);
  const safeNg = Math.max(0, totalNg);
  const safeRework = Math.max(0, totalRework);
  const totalProduced = safeOk + safeNg + safeRework;

  const rejectionRatePct =
    totalProduced > 0 ? Number(((safeNg / totalProduced) * 100).toFixed(2)) : 0;
  const reworkRatePct =
    totalProduced > 0 ? Number(((safeRework / totalProduced) * 100).toFixed(2)) : 0;

  const reasons: string[] = [];
  let status: InspectionStatus = 'PASS';

  // 1. Critical Dimension Check (Hard criteria)
  const oosDimensions = criticalDimensions.filter(
    (dim) => !dim.isAllInSpec && dim.samples.some((s) => s !== null)
  );

  if (oosDimensions.length > 0) {
    status = 'REJECT';
    reasons.push(
      `Dimensi kritis out-of-spec pada: ${oosDimensions
        .map((d) => d.parameterName)
        .join(', ')}`
    );
  }

  // 2. Rejection Rate Check
  if (rejectionRatePct >= failThreshold) {
    status = 'REJECT';
    reasons.push(
      `Rejection rate (${rejectionRatePct}%) melampaui batas kritis (${failThreshold}%)`
    );
  } else if (rejectionRatePct >= warnThreshold && status !== 'REJECT') {
    status = 'CONDITIONAL_PASS';
    reasons.push(
      `Rejection rate (${rejectionRatePct}%) dalam zona peringatan (${warnThreshold}% - ${failThreshold}%)`
    );
  }

  // 3. High Rework Check
  if (reworkRatePct > 5.0 && status === 'PASS') {
    status = 'CONDITIONAL_PASS';
    reasons.push(
      `Tingkat rework tinggi (${reworkRatePct}% > 5.0%), butuh verifikasi ulang supervisor`
    );
  }

  // 4. Blocked Cavities Alert (if more than 25% blocked)
  if (moldSetup && moldSetup.totalCavities > 0) {
    const blockedRatio =
      (moldSetup.totalCavities - moldSetup.activeCavities) / moldSetup.totalCavities;
    if (blockedRatio >= 0.5 && status === 'PASS') {
      status = 'CONDITIONAL_PASS';
      reasons.push(
        `Lebih dari 50% cavity blocked (${moldSetup.blockedCavities.length}/${moldSetup.totalCavities}), kapasitas output kritis`
      );
    }
  }

  if (reasons.length === 0) {
    reasons.push('Semua parameter kualitas dalam toleransi yang diizinkan');
  }

  return {
    totalOk: safeOk,
    totalNg: safeNg,
    totalRework: safeRework,
    totalProduced,
    rejectionRatePct,
    reworkRatePct,
    rejectionThresholdWarn: warnThreshold,
    rejectionThresholdFail: failThreshold,
    status,
    statusReasons: reasons,
  };
}
