export const config = {
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://imams_app:imams_app@localhost:5432/imams',
  adminUrl: process.env.DATABASE_ADMIN_URL ?? 'postgres://postgres:imams@localhost:5432/imams',
  port: Number(process.env.PORT ?? 3000),
  enableSimulators: (process.env.ENABLE_SIMULATORS ?? 'false') === 'true',
  offerWindowDays: Number(process.env.OFFER_WINDOW_DAYS ?? 14),
  sisTimeoutMs: Number(process.env.SIS_TIMEOUT_MS ?? 2000),
};
