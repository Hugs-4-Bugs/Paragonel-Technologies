/**
 * resume-analysis-error.ts — classified error from the resume parser.
 *
 * Extracted OUT of the `'use server'` flow file (src/ai/flows/analyze-resume-flow.ts)
 * because Next.js requires every export of a `'use server'` module to be an async
 * function — a class export is not allowed. This module is a plain (non-server)
 * module so the class can be imported by the flow, the route, and tests.
 */
import type { FallbackReason } from '@/ai/models';

export class ResumeAnalysisError extends Error {
  constructor(public reason: FallbackReason, message?: string) {
    super(message || reason);
    this.name = 'ResumeAnalysisError';
  }
}
