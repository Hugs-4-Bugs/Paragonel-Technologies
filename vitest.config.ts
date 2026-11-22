import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/lib/auth/**/*.test.ts',
      'src/lib/auth/__tests__/**/*.test.ts',
      'src/lib/ai/__tests__/**/*.test.ts',
      // 05R: matching engine + job-alert trigger/processor/dedup/unsubscribe +
      // email content are pure or use the in-memory fake-firestore (no emulator).
      'src/lib/matching/**/*.test.ts',
      'src/lib/job-alerts/**/*.test.ts',
      'src/lib/__tests__/**/*.test.ts',
    ],
    globals: false,
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
