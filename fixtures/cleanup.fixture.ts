import { test as base, expect, request } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

type CleanupFixtures = {
  trackProgram: (id: string) => void;
};

export const test = base.extend<CleanupFixtures>({
  trackProgram: async ({}, use, testInfo) => {
    const createdProgramIds = new Set<string>();
    await use((id: string) => createdProgramIds.add(id));

    if (createdProgramIds.size === 0) {
      return;
    }

    const didaxisUrl = process.env.DIDAXIS_URL;
    const token = process.env.DIDAXIS_API_TOKEN;
    if (!didaxisUrl || !token) {
      throw new Error(
        'DIDAXIS_URL and DIDAXIS_API_TOKEN must be defined in .env to run API cleanup.',
      );
    }

    const api = await request.newContext({
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    try {
      const cleanupFailures: string[] = [];
      for (const id of createdProgramIds) {
        const response = await api.delete(`${didaxisUrl}/api/programs/${id}`);
        if (!response.ok() && response.status() !== 404) {
          cleanupFailures.push(`${id}: ${response.status()} ${response.statusText()}`);
        }
      }

      if (cleanupFailures.length > 0) {
        await testInfo.attach('cleanup-failures', {
          body: cleanupFailures.join('\n'),
          contentType: 'text/plain',
        });
        throw new Error(
          `Program cleanup failed for ${cleanupFailures.length} item(s). See attachment: cleanup-failures.`,
        );
      }
    } finally {
      await api.dispose();
    }
  },
});

export { expect } from '@playwright/test';
