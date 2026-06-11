import { auditLogger } from './audit-logger';
import { store } from './store';

export interface Command {
  execute(payload?: any): Promise<any> | any;
}

export class CommandDispatcher {
  private commands: Map<string, Command> = new Map();

  public registerCommand(name: string, command: Command): void {
    this.commands.set(name, command);
  }

  public async execute(name: string, payload?: any): Promise<any> {
    const command = this.commands.get(name);
    if (!command) {
      throw new Error(`[Dispatcher] Command not found: ${name}`);
    }

    const traceId = crypto.randomUUID();
    performance.mark(`${traceId}-start`);
    
    const startTime = performance.now();
    const state = store.getState('system');

    try {
      // T1: Execution phase
      const result = await command.execute(payload);
      const executionEnd = performance.now();
      const executionDuration = executionEnd - startTime;

      // T2: Audit phase
      performance.mark(`${traceId}-audit-start`);
      await auditLogger.log({
        command: name,
        payload,
        result,
        duration: executionDuration,
        platform: state.platform,
        tier: state.performanceTier,
        status: 'SUCCESS',
      });
      performance.mark(`${traceId}-audit-end`);

      const totalDuration = performance.now() - startTime;
      
      // Expose trace for diagnostics
      if (state.performanceTier === 'high') {
        console.debug(`[Trace ${traceId}] Exec: ${executionDuration.toFixed(3)}ms | Audit: ${(totalDuration - executionDuration).toFixed(3)}ms | Total: ${totalDuration.toFixed(3)}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      await auditLogger.log({
        command: name,
        payload,
        result: error instanceof Error ? error.message : String(error),
        duration,
        platform: state.platform,
        tier: state.performanceTier,
        status: 'FAILURE',
      });
      throw error;
    }
  }

  public getAuditLog(): ReadonlyArray<any> {
    return auditLogger.getPersistentLogs();
  }
}

export const dispatcher = new CommandDispatcher();
