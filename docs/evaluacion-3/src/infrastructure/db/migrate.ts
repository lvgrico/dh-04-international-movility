import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';
import { config } from '../config';

const here = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(here, '../../../db');

export async function migrate(opts: { reset?: boolean; seed?: boolean; url?: string } = {}): Promise<void> {
  const client = new pg.Client({ connectionString: opts.url ?? config.adminUrl });
  await client.connect();
  try {
    if (opts.reset) {
      await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
    }
    await client.query(readFileSync(path.join(dbDir, 'schema.sql'), 'utf8'));
    if (opts.seed ?? true) {
      await client.query(readFileSync(path.join(dbDir, 'seed.sql'), 'utf8'));
    }
  } finally {
    await client.end();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const reset = process.argv.includes('--reset');
  migrate({ reset })
    .then(() => console.log(reset ? 'Schema reset and seeded.' : 'Schema applied and seeded.'))
    .catch((e) => { console.error(e); process.exit(1); });
}
