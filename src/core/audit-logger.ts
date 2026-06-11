export interface AuditEntry {
  id: string;
  timestamp: number;
  platform: string;
  tier: string;
  command: string;
  payload: any;
  result: any;
  duration: number;
  status: 'SUCCESS' | 'FAILURE';
  hash: string; // Firma de integridad
  previousHash: string; // Encadenamiento para detectar borrados
}

export class AuditLogger {
  private static instance: AuditLogger;
  private buffer: AuditEntry[] = [];
  private readonly BUFFER_LIMIT = 10; // Reducido de 20 para liberar memoria más rápido
  private readonly FLUSH_INTERVAL = 5000; // Flush más frecuente para evitar acumulación
  private syncWorker: Worker;

  private lastHash: string = '0'.repeat(64);

  private constructor() {
    // Inicializamos el Worker de sincronización remota
    this.syncWorker = new Worker(
      new URL('./remote-audit-worker.ts', import.meta.url), 
      { type: 'module' }
    );

    this.syncWorker.onmessage = (e) => {
      if (e.data.type === 'SYNC_SUCCESS') {
        console.log(`📡 [AuditLogger] Synchronized ${e.data.payload.count} logs to remote server.`);
      } else if (e.data.type === 'SYNC_FAILURE') {
        console.error(`❌ [AuditLogger] Sync failed: ${e.data.payload.error}. Pending logs: ${e.data.payload.logs.length}`);
      }
    };

    this.startFlushCycle();
  }

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Genera un hash simple para garantizar la inmutabilidad del log.
   * En producción, esto usaría SubtleCrypto para SHA-256.
   */
  private async generateHash(entry: any): Promise<string> {
    const msg = JSON.stringify(entry);
    const encoder = new TextEncoder();
    const data = encoder.encode(msg);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  public async log(entry: Omit<AuditEntry, 'id' | 'timestamp' | 'hash' | 'previousHash'>): Promise<void> {
    const timestamp = Date.now();
    const id = crypto.randomUUID();

    // Creamos la entrada con el encadenamiento de hashes
    const tempEntry = {
      ...entry,
      id,
      timestamp,
      previousHash: this.lastHash,
    };

    const hash = await this.generateHash(tempEntry);
    const fullEntry: AuditEntry = {
      ...tempEntry,
      hash,
    };

    this.lastHash = hash;
    this.buffer.push(fullEntry);

    if (this.buffer.length >= this.BUFFER_LIMIT) {
      this.flush();
    }
  }

  public async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logsToSave = [...this.buffer];
    this.buffer = [];

    // 1. Persistencia Local
    try {
      const existingLogs = this.getPersistentLogs();
      const updatedLogs = [...existingLogs, ...logsToSave].slice(-1000);
      localStorage.setItem('system_audit_log', JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('[AuditLogger] Local save failed:', error);
    }

    // 2. Sincronización Remota via Worker
    this.syncWorker.postMessage({
      type: 'SYNC_LOGS',
      payload: {
        logs: logsToSave,
        endpoint: 'https://audit-api.enterprise.com/logs' // Endpoint ficticio
      }
    });
  }

  public getPersistentLogs(): AuditEntry[] {
    const data = localStorage.getItem('system_audit_log');
    return data ? JSON.parse(data) : [];
  }

  public clearLogs(): void {
    localStorage.removeItem('system_audit_log');
    this.buffer = [];
    this.lastHash = '0'.repeat(64);
  }

  private startFlushCycle(): void {
    setInterval(() => this.flush(), this.FLUSH_INTERVAL);
  }
}

export const auditLogger = AuditLogger.getInstance();

