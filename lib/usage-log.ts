import { mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';

import type { ChatResponse } from '@/lib/contracts';

export type UsageLogEntry = {
  timestamp: string;
  sessionId: string;
  userId: string | null;
  message: string;
  grounded: ChatResponse['grounded'];
  citationIds: string[];
};

const dataDirectory = path.join(process.cwd(), 'data');
const usageLogPath = path.join(dataDirectory, 'usage-log.jsonl');

export async function appendUsageLog(entry: UsageLogEntry) {
  try {
    await mkdir(dataDirectory, { recursive: true });
    await appendFile(usageLogPath, `${JSON.stringify(entry)}\n`, 'utf8');
  } catch (error) {
    console.warn('[usage-log] Skipping local file log write.', error);
  }
}
