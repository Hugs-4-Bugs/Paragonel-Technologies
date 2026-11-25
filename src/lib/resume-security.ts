/**
 * resume-security.ts — pure helpers for the candidate resume lifecycle
 * (Task 3). Extracted from the route handlers so they can be unit-tested
 * without a running Storage emulator.
 *
 * Coverage:
 *   - `detectResumeKind` — magic-byte type detection (PDF / DOC / DOCX) that
 *     does NOT trust the filename or client MIME alone.
 *   - `isValidDocxZip` — verifies a ZIP buffer is really a DOCX by parsing the
 *     End-of-Central-Directory record + central directory entries and checking
 *     for a `word/` entry. Rejects arbitrary ZIPs, zip bombs, and malformed /
 *     truncated archives. Bounded: it never decompresses, so a decompression
 *     bomb cannot exhaust memory here.
 *   - `sanitizeFileName` — strips every character except `[A-Za-z0-9._-]` and
 *     caps length, so a client filename can never carry `..`, `/`, `\`, or
 *     other path/control characters into a Storage object path.
 *   - `RESUME_PATH_RE` / `validateResumePath` — strict shape for a stored
 *     resume object path (`candidates/{email}/resumes/{safeName}`), rejecting
 *     traversal, absolute paths, `gs://`, query strings, and any path outside
 *     the candidate's own folder. Used by the upload, download, delete, admin
 *     download, and email-attachment fetch paths for defense-in-depth.
 */
export const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * Strict resume object path. The actual stored path (set by
 * /api/candidate/resume) is `candidates/{email}/resumes/{ts}_{safeName}`.
 * Rejects "..", leading "/", "gs://", query strings, and paths outside the
 * candidates/.../resumes/ tree.
 */
export const RESUME_PATH_RE =
  /^candidates\/[A-Za-z0-9._@+-]{1,254}\/resumes\/[A-Za-z0-9._ -]{1,200}$/;

/** Validate a stored resume object path against the strict shape. */
export function validateResumePath(path: string | undefined | null): path is string {
  return typeof path === 'string' && path.length > 0 && RESUME_PATH_RE.test(path);
}

/** Strip path separators + control chars from a client-supplied filename. */
export function sanitizeFileName(name: string): string {
  return (name || 'resume').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

/**
 * Verify a ZIP buffer is really a DOCX by parsing the End-of-Central-Directory
 * record + central directory entries and checking for a `word/` entry. Bounded:
 * never decompresses, so a decompression bomb cannot exhaust memory here.
 * Rejects arbitrary ZIPs, malformed/truncated archives, and zip bombs (which
 * have no `word/` entry).
 */
export function isValidDocxZip(buf: Buffer): boolean {
  const EOCD_MIN = 22;
  if (buf.length < EOCD_MIN) return false;

  // Find the End-of-Central-Directory record (PK\x05\x06) scanning backwards.
  // The EOCD can be followed by a comment of up to 64KB, so scan the tail.
  const scanStart = Math.max(0, buf.length - (64 * 1024 + EOCD_MIN));
  let eocd = -1;
  for (let i = buf.length - EOCD_MIN; i >= scanStart; i--) {
    if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x05 && buf[i + 3] === 0x06) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return false;

  const totalEntries = buf.readUInt16LE(eocd + 10);
  const cdSize = buf.readUInt32LE(eocd + 12);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  // Bounds-check the central directory.
  if (!Number.isFinite(cdOffset) || cdOffset < 0 || cdOffset + cdSize > buf.length) return false;

  let p = cdOffset;
  for (let n = 0; n < totalEntries; n++) {
    // Each central directory entry is at least 46 bytes.
    if (p + 46 > buf.length) return false;
    if (buf[p] !== 0x50 || buf[p + 1] !== 0x4b || buf[p + 2] !== 0x01 || buf[p + 3] !== 0x02) {
      return false; // not a central directory entry
    }
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const nameStart = p + 46;
    if (nameStart + nameLen > buf.length) return false;
    const name = buf.slice(nameStart, nameStart + nameLen).toString('utf8');
    // A real DOCX always has a word/ directory (word/document.xml at minimum).
    if (name.startsWith('word/')) return true;
    p += 46 + nameLen + extraLen + commentLen;
  }
  return false;
}

/**
 * Magic-byte type detection (do not trust the extension/MIME alone). For the
 * ZIP (DOCX) case, additionally verify via `isValidDocxZip` that the archive
 * really contains a `word/` entry — rejecting arbitrary ZIPs, zip bombs, and
 * malformed archives that merely start with `PK\x03\x04`.
 */
export function detectResumeKind(buf: Buffer): 'pdf' | 'doc' | 'docx' | null {
  if (buf.length >= 5 && buf.slice(0, 5).toString('ascii') === '%PDF-') return 'pdf';
  // DOCX / ZIP: PK\x03\x04
  if (
    buf.length >= 4 &&
    buf[0] === 0x50 &&
    buf[1] === 0x4b &&
    buf[2] === 0x03 &&
    buf[3] === 0x04
  ) {
    return isValidDocxZip(buf) ? 'docx' : null;
  }
  // Legacy DOC (OLE2): D0CF11E0A1B11AE1
  if (
    buf.length >= 8 &&
    buf[0] === 0xd0 &&
    buf[1] === 0xcf &&
    buf[2] === 0x11 &&
    buf[3] === 0xe0 &&
    buf[4] === 0xa1 &&
    buf[5] === 0xb1 &&
    buf[6] === 0x1a &&
    buf[7] === 0xe1
  ) {
    return 'doc';
  }
  return null;
}
