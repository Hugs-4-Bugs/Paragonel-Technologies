/**
 * skill-aliases.ts — careful, conservative skill-name normalization for the
 * explainable matching engine (Prompt 05R §6).
 *
 * Principles (enforced by tests):
 *   - Normalize ONLY obvious surface variants of the SAME technology
 *     (e.g. "ReactJS" / "react.js" / "React 18" -> "react"). Version suffixes,
 *     casing, trailing ".js"/".ts" and whitespace are normalized away.
 *   - NEVER assert that two UNRELATED technologies are equivalent. There is no
 *     "java" -> "javascript", no "c" -> "c++", no "go" -> "rust" mapping. A
 *     missing alias means the names are compared as-is (after casing/trim) —
 *     which is the safe, honest default.
 *   - The alias map is small and auditable. Adding an alias requires evidence
 *     that the two strings refer to the same skill in hiring contexts.
 *
 * This is intentionally NOT an LLM. It is a deterministic, reviewed table so the
 * match score is reproducible from the stored inputs (Prompt 05R §6:
 * "The percentage must be reproducible from the stored inputs and rubric").
 */

/** Lowercase canonical form used for comparison. */
export function normalizeSkill(raw: string): string {
  if (!raw) return '';
  let s = String(raw).trim().toLowerCase();
  if (!s) return '';
  // Strip trailing version numbers / "v"/"ver" + digits, e.g. "react 18",
  // "node v20", "python 2.7". Keep the core name. "python3" (no space) is kept
  // as-is intentionally — it is a distinct runtime name in hiring contexts.
  s = s.replace(/\s+(?:v|ver)?\s*\d+(?:\.\d+)*\s*$/, '');
  // Collapse ".js"/".ts" spelling differences for a few well-known names only
  // (handled by the alias map below, not here, to stay conservative).
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Conservative alias map: canonical -> canonical. Keys/values are normalized
 * (lowercase, no version). Every entry is a widely-accepted synonym in hiring.
 * If you are not sure two names mean the same thing, DO NOT add it here — leave
 * them unmatched so the score stays honest.
 */
const ALIASES: Record<string, string> = {
  // JS ecosystem
  'reactjs': 'react',
  'react.js': 'react',
  'react js': 'react',
  'nextjs': 'next.js',
  'next.js': 'next.js',
  'next js': 'next.js',
  'nodejs': 'node.js',
  'node.js': 'node.js',
  'node js': 'node.js',
  'node': 'node.js',
  'expressjs': 'express',
  'express.js': 'express',
  'vuejs': 'vue',
  'vue.js': 'vue',
  'nuxtjs': 'nuxt',
  'nuxt.js': 'nuxt',
  'angularjs': 'angular', // Angular (2+) is colloquially still "angularjs" in CVs
  'angular.js': 'angular',
  'sveltekit': 'svelte kit',
  // Languages
  'ts': 'typescript',
  'js': 'javascript',
  'golang': 'go',
  'c#': 'csharp',
  'c#.net': 'csharp',
  'objective-c': 'objective-c',
  // Data / infra
  'postgres': 'postgresql',
  'postgres sql': 'postgresql',
  'k8s': 'kubernetes',
  'gcp': 'google cloud',
  'google cloud platform': 'google cloud',
  'aws lambda': 'aws lambda',
  // Python
  'py': 'python',
  // TypeScript/JS libs commonly misspelled
  'tailwindcss': 'tailwind',
  'tailwind css': 'tailwind',
};

/** Apply the alias map on top of normalizeSkill. Returns the canonical key. */
export function canonicalSkill(raw: string): string {
  const n = normalizeSkill(raw);
  if (!n) return '';
  return ALIASES[n] ?? n;
}

/**
 * Build a Set of canonical skills from one or more raw string arrays. Used to
 * assemble the candidate's skill pool (skills + techStack) without double-
 * counting duplicates across the two arrays.
 */
export function canonicalSkillSet(...arrays: (string[] | undefined)[]): Set<string> {
  const out = new Set<string>();
  for (const arr of arrays) {
    if (!arr || !Array.isArray(arr)) continue;
    for (const s of arr) {
      const c = canonicalSkill(s);
      if (c) out.add(c);
    }
  }
  return out;
}

/**
 * Split a raw skills list string into canonical skills. Mirrors splitSkills in
 * cms-schemas (comma-list -> string[]), then canonicalizes each.
 */
export function canonicalSkillsFromString(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(canonicalSkill)
    .filter(Boolean);
}
