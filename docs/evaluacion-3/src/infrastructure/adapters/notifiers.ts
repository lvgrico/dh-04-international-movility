import { DependencyUnavailable } from '../../domain/errors';
import type { NotificationPort } from '../../domain/ports';

/** Simulated notification gateway. In demo it prints; in tests it records or fails on demand. */
export class SimulatedNotifier implements NotificationPort {
  failing = false;
  readonly sent: Array<{ to: string; template: string; payload: Record<string, unknown> }> = [];
  constructor(private readonly log: boolean = false) {}

  async send(message: { to: string; template: string; payload: Record<string, unknown> }): Promise<void> {
    if (this.failing) throw new DependencyUnavailable('notification gateway down');
    this.sent.push(message);
    if (this.log) console.log(`[notify] to=${message.to} template=${message.template}`);
  }
}
