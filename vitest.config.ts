import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/lib/auth/**/*.test.ts', 'src/lib/auth/__tests__/**/*.test.ts', 'src/lib/ai/__tests__/**/*.test.ts'],
    globals: false,
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
