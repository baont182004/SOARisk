import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PACK_ROOT = 'SOARisk_Enhancement_Docs_Pack';

export function readEnhancementPackJson<T>(filename: string): T {
  const relativePath = `${PACK_ROOT}/${filename}`;
  const candidates = [
    resolve(process.cwd(), relativePath),
    resolve(process.cwd(), '..', '..', relativePath),
    resolve(__dirname, '..', '..', '..', '..', relativePath),
    resolve(__dirname, '..', '..', '..', '..', '..', relativePath),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));

  if (!found) {
    throw new Error(`Unable to locate enhancement dataset '${relativePath}'.`);
  }

  return JSON.parse(readFileSync(found, 'utf8')) as T;
}
