/**
 * preferences.ts — candidate job-alert preference resolution (Prompt 05R §5, §9).
 *
 * The profile schema (candidate-profile.ts) already stores:
 *   - jobAlertPreference: boolean | undefined   (OPT-IN: absent/undefined => NO alerts)
 *   - matchingThreshold:  number  | undefined   (0-100 as stored)
 *
 * This module is the SINGLE place that turns those stored values into the values
 * the matching/notification engine actually uses. Rules (Prompt 05R §5):
 *   - Default minimum match threshold is 80%.
 *   - The candidate may configure a threshold between 75% and 100% (75% is the
 *     hard floor per Prompt §5.2: "The threshold must never be configurable
 *     below 75%").
 *   - Values are validated AND clamped server-side. Out-of-range values are
 *     rejected at the preference endpoint (jobAlertPreferencesSchema) and, as a
 *     belt-and-suspenders defense, clamped at resolution time so a stale/legacy
 *     stored value can never produce an invalid decision.
 *   - job alerts are OPT-IN. A candidate who has never enabled them gets NO
 *     alert. We never silently replace a disabled preference with a hardcoded
 *     "on".
 *
 * These helpers are pure + deterministic so the decision is reproducible.
 */
import { z } from 'zod';

/** Rubric-wide default minimum match threshold (Prompt 05R §5). */
export const DEFAULT_MATCHING_THRESHOLD = 80;
/**
 * Hard floor for any candidate-configured matching threshold (Prompt §5.2:
 * "The threshold must never be configurable below 75%"). The DEFAULT stays at
 * 80 (stricter than the 75 floor) so existing candidates see no increase in
 * alert volume; the floor only tightens previously-allowed 25–74 values up to
 * 75. An admin-configurable raise above 75 is tracked as remaining work.
 */
export const MIN_THRESHOLD = 75;
export const MAX_THRESHOLD = 100;

/**
 * Resolve the effective threshold for a candidate profile.
 *   - undefined / null / non-number  -> DEFAULT_MATCHING_THRESHOLD (80)
 *   - < MIN_THRESHOLD                 -> clamped UP to MIN_THRESHOLD (75)
 *   - > MAX_THRESHOLD                 -> clamped DOWN to MAX_THRESHOLD (100)
 *   - otherwise                       -> the stored integer value
 * Always returns an integer in [75, 100].
 */
export function resolveMatchingThreshold(
  stored: number | undefined | null | unknown
): number {
  if (typeof stored !== 'number' || !Number.isFinite(stored)) {
    return DEFAULT_MATCHING_THRESHOLD;
  }
  let v = Math.round(stored);
  if (v < MIN_THRESHOLD) v = MIN_THRESHOLD;
  if (v > MAX_THRESHOLD) v = MAX_THRESHOLD;
  return v;
}

/**
 * Resolve the effective job-alert opt-in for a candidate profile.
 * OPT-IN: only `true` enables alerts. undefined / false / anything else => off.
 */
export function resolveJobAlertPreference(
  stored: boolean | undefined | null | unknown
): boolean {
  return stored === true;
}

/**
 * Validation schema for the dedicated preference-update endpoint
 * (PATCH /api/candidate/profile/preferences). Rejects out-of-range thresholds
 * (Prompt 05R §5: "Do not accept arbitrary values outside the supported range")
 * and requires an explicit boolean for the alert opt-in. Preferred roles /
 * locations / employment type / work mode are validated against the same enums
 * as the full profile schema.
 */
export const jobAlertPreferencesSchema = z.object({
  jobAlertPreference: z.boolean(),
  matchingThreshold: z
    .coerce
    .number()
    .int(MIN_THRESHOLD + '-' + MAX_THRESHOLD)
    .min(MIN_THRESHOLD, 'Threshold must be between ' + MIN_THRESHOLD + ' and ' + MAX_THRESHOLD)
    .max(MAX_THRESHOLD, 'Threshold must be between ' + MIN_THRESHOLD + ' and ' + MAX_THRESHOLD),
  preferredRoles: z.array(z.string().trim().max(200)).max(20).optional(),
  preferredLocations: z.array(z.string().trim().max(200)).max(20).optional(),
  preferredEmploymentType: z
    .enum(['full-time', 'part-time', 'contract', 'internship', 'any'])
    .optional(),
  workModePreference: z.enum(['remote', 'hybrid', 'on-site', 'any']).optional(),
});
export type JobAlertPreferencesInput = z.infer<typeof jobAlertPreferencesSchema>;
