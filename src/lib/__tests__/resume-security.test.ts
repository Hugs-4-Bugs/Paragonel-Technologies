/**
 * resume-security.test.ts — pure-helper coverage for the candidate resume
 * lifecycle hardening (Task 3).
 *
 * Covers: filename sanitization (path-traversal rejection), strict resume-path
 * shape validation, magic-byte type detection, and DOCX ZIP container
 * validation (rejects arbitrary zips, zip bombs, malformed/truncated archives).
 *
 * The zip fixtures are crafted by hand (central directory + EOCD) so the tests
 * run without a real DOCX file or a Storage emulator. `isValidDocxZip` only
 * inspects the central directory filenames, never decompresses, so crafted
 * buffers are sufficient.
 */
import { describe, it, expect } from 'vitest';
import {
  sanitizeFileName,
  validateResumePath,
  isValidDocxZip,
  detectResumeKind,
  MAX_RESUME_BYTES,
} from '@/lib/resume-security';

/** Craft a minimal ZIP buffer whose central directory lists `filenames`. */
function craftZip(filenames: string[]): Buffer {
  // A minimal local file header at the very start so detectResumeKind sees the
  // PK\x03\x04 magic. isValidDocxZip does not read local headers.
  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0); // PK\x03\x04

  const cdEntries: Buffer[] = [];
  for (const name of filenames) {
    const nameBuf = Buffer.from(name, 'utf8');
    const cd = Buffer.alloc(46 + nameBuf.length);
    cd.writeUInt32LE(0x02014b50, 0); // PK\x01\x02 (central directory entry)
    cd.writeUInt16LE(nameBuf.length, 28); // filename length
    nameBuf.copy(cd, 46); // filename at offset 46
    cdEntries.push(cd);
  }
  const cdBuf = Buffer.concat(cdEntries);
  const cdOffset = localHeader.length;

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // PK\x05\x06 (end of central directory)
  eocd.writeUInt16LE(filenames.length, 10); // total entries
  eocd.writeUInt32LE(cdBuf.length, 12); // central directory size
  eocd.writeUInt32LE(cdOffset, 16); // central directory offset

  return Buffer.concat([localHeader, cdBuf, eocd]);
}

describe('sanitizeFileName', () => {
  it('keeps alphanumerics, dots, underscores, hyphens', () => {
    expect(sanitizeFileName('resume_v2.pdf')).toBe('resume_v2.pdf');
  });
  it('strips path separators so traversal is impossible', () => {
    // Dots are kept (a leading "." in a flat filename is harmless), but every
    // "/" and "\" is replaced with "_" — so no path separator survives into the
    // Storage object path. The result is a flat filename, never a traversal.
    const out = sanitizeFileName('../etc/passwd');
    expect(out).not.toContain('/');
    expect(out).not.toContain('\\');
    expect(out).toBe('.._etc_passwd');
    expect(sanitizeFileName('a/b\\c')).toBe('a_b_c');
  });
  it('caps the length at 80', () => {
    const long = 'a'.repeat(120);
    expect(sanitizeFileName(long).length).toBe(80);
  });
  it('falls back to "resume" for empty input', () => {
    expect(sanitizeFileName('')).toBe('resume');
    expect(sanitizeFileName(null as unknown as string)).toBe('resume');
  });
});

describe('validateResumePath', () => {
  it('accepts the real stored-path shape', () => {
    expect(validateResumePath('candidates/a@b.com/resumes/1700000000_resume.pdf')).toBe(true);
  });
  it('rejects path traversal', () => {
    expect(validateResumePath('candidates/a@b.com/resumes/../../etc/secrets')).toBe(false);
  });
  it('rejects a leading slash / absolute path', () => {
    expect(validateResumePath('/candidates/a@b.com/resumes/x')).toBe(false);
  });
  it('rejects a gs:// URL', () => {
    expect(validateResumePath('gs://bucket/candidates/a@b.com/resumes/x')).toBe(false);
  });
  it('rejects a query string', () => {
    expect(validateResumePath('candidates/a@b.com/resumes/x?sig=abc')).toBe(false);
  });
  it('rejects a path outside the candidates/.../resumes/ tree', () => {
    expect(validateResumePath('admin/secrets')).toBe(false);
    expect(validateResumePath('candidates/a@b.com/other/x')).toBe(false);
  });
  it('rejects an empty name segment', () => {
    expect(validateResumePath('candidates/a@b.com/resumes/')).toBe(false);
  });
  it('rejects undefined / null / non-string', () => {
    expect(validateResumePath(undefined)).toBe(false);
    expect(validateResumePath(null)).toBe(false);
    expect(validateResumePath('')).toBe(false);
  });
});

describe('isValidDocxZip', () => {
  it('accepts a ZIP whose central directory contains a word/ entry', () => {
    const buf = craftZip(['word/document.xml', '[Content_Types].xml']);
    expect(isValidDocxZip(buf)).toBe(true);
  });
  it('rejects an arbitrary ZIP with no word/ entry (zip bomb / unrelated archive)', () => {
    const buf = craftZip(['notword/foo.txt', 'data/bin']);
    expect(isValidDocxZip(buf)).toBe(false);
  });
  it('rejects a truncated buffer with the PK magic but no EOCD', () => {
    const truncated = Buffer.alloc(40);
    truncated.writeUInt32LE(0x04034b50, 0); // PK\x03\x04 only
    expect(isValidDocxZip(truncated)).toBe(false);
  });
  it('rejects a too-short buffer', () => {
    expect(isValidDocxZip(Buffer.alloc(4))).toBe(false);
  });
});

describe('detectResumeKind', () => {
  it('detects a PDF by the %PDF- magic', () => {
    const pdf = Buffer.from('%PDF-1.7\n...rest...');
    expect(detectResumeKind(pdf)).toBe('pdf');
  });
  it('detects a real DOCX (zip with word/) as docx', () => {
    const docx = craftZip(['word/document.xml']);
    expect(detectResumeKind(docx)).toBe('docx');
  });
  it('rejects an arbitrary ZIP (no word/) even though it starts with PK', () => {
    const zip = craftZip(['random/file.txt']);
    expect(detectResumeKind(zip)).toBeNull();
  });
  it('detects legacy DOC (OLE2) by the D0CF11E0 magic', () => {
    const doc = Buffer.alloc(8);
    doc[0] = 0xd0; doc[1] = 0xcf; doc[2] = 0x11; doc[3] = 0xe0;
    doc[4] = 0xa1; doc[5] = 0xb1; doc[6] = 0x1a; doc[7] = 0xe1;
    expect(detectResumeKind(doc)).toBe('doc');
  });
  it('rejects garbage / an unsupported type', () => {
    expect(detectResumeKind(Buffer.from('hello world this is not a document'))).toBeNull();
    expect(detectResumeKind(Buffer.alloc(0))).toBeNull();
  });
  it('does NOT trust a misleading extension/MIME — only the content', () => {
    // A PNG passed off as a docx by extension is rejected by content.
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectResumeKind(png)).toBeNull();
  });
});

describe('MAX_RESUME_BYTES', () => {
  it('is 5 MB', () => {
    expect(MAX_RESUME_BYTES).toBe(5 * 1024 * 1024);
  });
});
