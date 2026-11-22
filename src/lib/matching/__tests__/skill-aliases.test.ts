/**
 * skill-aliases.test.ts — normalization + conservative alias map (Prompt 05R §6).
 * Crucially verifies that UNRELATED technologies are never treated as equivalent.
 */
import { describe, it, expect } from 'vitest';
import { normalizeSkill, canonicalSkill, canonicalSkillSet, canonicalSkillsFromString } from '../skill-aliases';

describe('skill-aliases (Prompt 05R §6)', () => {
  describe('normalizeSkill', () => {
    it('lowercases + trims', () => {
      expect(normalizeSkill('  React  ')).toBe('react');
    });
    it('strips trailing version numbers', () => {
      expect(normalizeSkill('React 18')).toBe('react');
      expect(normalizeSkill('Node v20')).toBe('node');
      expect(normalizeSkill('Python3')).toBe('python3'); // no space -> not stripped (kept as-is)
    });
    it('returns empty for empty input', () => {
      expect(normalizeSkill('')).toBe('');
      expect(normalizeSkill(undefined as unknown as string)).toBe('');
    });
  });

  describe('canonicalSkill (alias application)', () => {
    it('maps obvious synonyms to one canonical form', () => {
      expect(canonicalSkill('ReactJS')).toBe('react');
      expect(canonicalSkill('react.js')).toBe('react');
      expect(canonicalSkill('Node')).toBe('node.js');
      expect(canonicalSkill('NodeJS')).toBe('node.js');
      expect(canonicalSkill('TS')).toBe('typescript');
      expect(canonicalSkill('Golang')).toBe('go');
      expect(canonicalSkill('K8s')).toBe('kubernetes');
      expect(canonicalSkill('Postgres')).toBe('postgresql');
    });
    it('leaves unmapped names canonicalized only (no fabrication)', () => {
      expect(canonicalSkill('Rust')).toBe('rust');
      expect(canonicalSkill('Java')).toBe('java');
    });
    it('NEVER equates unrelated technologies', () => {
      // java is NOT javascript; c is NOT c++; go is NOT rust.
      expect(canonicalSkill('Java')).not.toBe(canonicalSkill('JavaScript'));
      expect(canonicalSkill('C')).not.toBe(canonicalSkill('C++'));
      expect(canonicalSkill('Go')).not.toBe(canonicalSkill('Rust'));
      expect(canonicalSkill('Python')).not.toBe(canonicalSkill('PyTorch'));
    });
  });

  describe('canonicalSkillSet (no double-count across arrays)', () => {
    it('merges skills + techStack without duplicates', () => {
      const set = canonicalSkillSet(['React', 'ReactJS'], ['TypeScript', 'TS']);
      expect(set.size).toBe(2); // react + typescript
      expect(set.has('react')).toBe(true);
      expect(set.has('typescript')).toBe(true);
    });
    it('ignores empty/garbage', () => {
      const set = canonicalSkillSet(['', '  ', 'Go']);
      expect(set.size).toBe(1);
      expect(set.has('go')).toBe(true);
    });
  });

  it('canonicalSkillsFromString splits a comma list', () => {
    expect(canonicalSkillsFromString('React, TypeScript , Node')).toEqual(['react', 'typescript', 'node.js']);
  });
});
