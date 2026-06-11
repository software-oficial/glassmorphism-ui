import { store } from './store';
import { platformBridge } from './platform';

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number | null;
  lastHeartbeat: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export class Sentinel {
  private static instance: Sentinel;
  private worker: Worker;

  private constructor() {
    // Inicializamos el worker usando la URL del archivo procesado por Vite
    this.worker = new Worker(
      new URL('./sentinel-worker.ts', import.meta.url), 
      { type: 'module' }
    );

    this.worker.onmessage = async (e) => {
      if (e.data.type === 'METRICS_UPDATE') {
        const { fps, ram: workerRam, status } = e.data.payload;
        
        // Priorizamos métricas reales del PlatformBridge sobre la simulación del worker
        const hardware = await platformBridge.getHardwareMetrics();
        const finalRam = hardware.ram !== null ? hardware.ram : workerRam;

        // Actualizamos el store global en lugar de un estado interno
        store.setState({
          metrics: {
            fps,
            ram: finalRam,
            status: status as any,
          }
        });
      }
    };

    this.worker.postMessage('start');
  }

  public static getInstance(): Sentinel {
    if (!Sentinel.instance) {
      Sentinel.instance = new Sentinel();
    }
    return Sentinel.instance;
  }

  public getMetrics() {
    return {
      ...store.getState().metrics,
      lastHeartbeat: Date.now(),
    };
  }

  public stop(): void {
    this.worker.terminate();
  }
}

export const sentinel = Sentinel.getInstance();
