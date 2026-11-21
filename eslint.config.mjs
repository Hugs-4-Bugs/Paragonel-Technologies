// Non-interactive ESLint flat config (Prompt 05J §8).
// Replaces the deprecated `next lint` (interactive prompt in Next 15.5+) with a
// runnable `eslint .` via `npm run lint`. Uses FlatCompat to extend the
// Next.js core-web-vitals + typescript shared configs (eslintrc-format, adapted
// to ESLint 9 flat config). The build is NOT gated on lint
// (next.config.ts `eslint.ignoreDuringBuilds: true`); this is dev hygiene.
import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      '**/.next/**',
      '**/node_modules/**',
      '**/out/**',
      '**/coverage/**',
      '**/dist/**',
      '**/scripts/**',
      '**/next-env.d.ts',
    ],
  },
];

export default eslintConfig;
