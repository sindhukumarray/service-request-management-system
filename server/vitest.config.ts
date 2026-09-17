import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: '',
    fileParallelism: false,
    // Increase timeouts to allow first-time MongoDB binary downloads used by MongoMemoryServer
    // Downloads can be >60s on slow networks; set to 5 minutes (300000ms)
    testTimeout: 300000,
    hookTimeout: 300000,
  },
});
