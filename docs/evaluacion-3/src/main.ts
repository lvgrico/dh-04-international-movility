import pg from 'pg';
import { createApp } from './http/app';
import { config } from './infrastructure/config';
import { MockSis, ValidatingSis } from './infrastructure/adapters/mock-sis';
import { SimulatedNotifier } from './infrastructure/adapters/notifiers';

const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 });
const mockSis = new MockSis();
const notifier = new SimulatedNotifier(true);

const app = createApp({
  deps: {
    pool, sis: new ValidatingSis(mockSis), notifier, clock: () => new Date(),
    config: { offerWindowDays: config.offerWindowDays, sisTimeoutMs: config.sisTimeoutMs },
  },
  simulators: config.enableSimulators ? { sis: mockSis, notifier } : null,
});

app.listen(config.port, () => {
  console.log(`IMAMS increment 1 listening on http://localhost:${config.port}  (simulators: ${config.enableSimulators})`);
});
