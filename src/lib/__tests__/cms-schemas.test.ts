/**
 * cms-schemas.test.ts — job-form skills normalization (Prompt §4.2 / §5.3).
 *
 * splitSkills must trim whitespace, drop empty entries, and de-duplicate
 * (case-insensitive) so duplicate skill strings in an Admin job-form entry
 * cannot inflate the matching engine's required-skills denominator.
 */
import { describe, it, expect } from 'vitest';
import { splitSkills } from '../cms-schemas';

describe('splitSkills (job-form skills normalization, Prompt §4.2/§5.3)', () => {
  it('splits + trims a simple comma list', () => {
    expect(splitSkills('Java, Spring Boot, MySQL')).toEqual([
      'Java',
      'Spring Boot',
      'MySQL',
    ]);
  });

  it('drops empty + whitespace-only entries', () => {
    expect(splitSkills('Java, , , Spring Boot,  ')).toEqual(['Java', 'Spring Boot']);
    expect(splitSkills(' , , ')).toEqual([]);
    expect(splitSkills('')).toEqual([]);
  });

  it('de-duplicates exact repeats (case-sensitive)', () => {
    expect(splitSkills('React, React, Node')).toEqual(['React', 'Node']);
  });

  it('de-duplicates case-insensitively, preserving the first-seen display form', () => {
    // "React" and "react" collapse to the first-seen "React"
    expect(splitSkills('React, react, Node, node')).toEqual(['React', 'Node']);
    // "Java" vs "java" -> keep "Java"; "Spring Boot" vs "spring boot" -> keep "Spring Boot"
    expect(splitSkills('Java, java, Spring Boot, spring boot')).toEqual([
      'Java',
      'Spring Boot',
    ]);
  });

  it('does not collapse distinct skills that share a prefix', () => {
    expect(splitSkills('Java, JavaScript')).toEqual(['Java', 'JavaScript']);
  });

  it('trims surrounding whitespace on each piece', () => {
    expect(splitSkills('  Java  ,  Spring Boot  ')).toEqual(['Java', 'Spring Boot']);
  });
});
