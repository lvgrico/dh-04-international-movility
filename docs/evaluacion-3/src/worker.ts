// Standalone worker process (C-WORKER): retries pending eligibility checks and delivers the outbox.
// Same release and same database as the API (E2-ADR-002). In the demo the API also exposes POST /sim/worker/run.
import pg from 'pg';
import { retryPendingEligibility } from './application/eligibility-service';
import { expireOffers } from './application/offers';
import { processOutbox } from './application/outbox-worker';
import { config } from './infrastructure/config';
import { MockSis, ValidatingSis } from './infrastructure/adapters/mock-sis';
import { SimulatedNotifier } from './infrastructure/adapters/notifiers';

const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 3 });
const deps = {
  pool, sis: new ValidatingSis(new MockSis()), notifier: new SimulatedNotifier(true), clock: () => new Date(),
  config: { offerWindowDays: config.offerWindowDays, sisTimeoutMs: config.sisTimeoutMs },
};

async function tick() {
  try {
    const eligibility = await retryPendingEligibility(deps);
    const offersExpired = await expireOffers(deps);
    const outbox = await processOutbox(deps);
    if (eligibility || offersExpired || outbox.delivered || outbox.failed) console.log('[worker]', { eligibility, offersExpired, outbox });
  } catch (e) { console.error('[worker] error', e); }
}
setInterval(tick, 2000);
console.log('IMAMS worker started (every 2s)');
