/**
 * Storage-efficiency configuration for FreshBite
 * Controls retention policy, rollup behavior, and health thresholds
 */

export interface StorageConfig {
  /** Keep full review text for N days (default: 90) */
  keepRawDays: number;
  /** Enable cold-data archival */
  archiveEnabled: boolean;
  /** Archive destination: "none" | "file" | "s3" */
  archiveDestination: 'none' | 'file' | 's3';
  /** Warn when DB usage hits this % of maxStorageMb */
  warnAtPct: number;
  /** Critical alert threshold % */
  criticalAtPct: number;
  /** Max storage in MB (Neon free tier ≈ 512 MB) */
  maxStorageMb: number;
}

export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  keepRawDays: 90,
  archiveEnabled: false,
  archiveDestination: 'none',
  warnAtPct: 70.0,
  criticalAtPct: 85.0,
  maxStorageMb: 512.0,
};

/** Time windows that should use rollups instead of raw review scans */
export const ROLLUP_WINDOWS = ['48h', '5d'] as const;

/** Time windows that should always use raw reviews for freshness */
export const RAW_WINDOWS = ['24h'] as const;

/** Whether a given window should use rollups for stats */
export function shouldUseRollup(window: string): boolean {
  return (ROLLUP_WINDOWS as readonly string[]).includes(window);
}
