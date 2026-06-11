import { Command } from '../core/dispatcher';
import { store } from '../core/store';

export class StressTestCommand implements Command {
  private stressInterval: any = null;
  private stressWorkers: Worker[] = [];

  public async execute(payload?: { intensity: 'low' | 'medium' | 'high' }): Promise<void> {
    const intensity = payload?.intensity || 'medium';
    
    if (this.stressInterval) {
      this.stopStress();
      return;
    }

    console.log(`🔥 [STRESS TEST] Starting stress test with ${intensity} intensity...`);
    store.setState('system', { isStressing: true });

    // 1. CPU STRESS: Crear cálculos intensivos en el hilo principal
    // Esto sirve para ver cómo cae el FPS y si la UI se congela.
    const calculateFibonacci = (n: number): number => {
      if (n <= 1) return n;
      return calculateFibonacci(n - 1) + calculateFibonacci(n - 2);
    };

    const iterations = {
      low: 10,
      medium: 25,
      high: 35
    };

    this.stressInterval = setInterval(() => {
      // Forzamos cálculos pesados cada 100ms
      for (let i = 0; i < iterations[intensity]; i++) {
        calculateFibonacci(20); 
      }
      
      // Forzamos Reflows de la GPU: Manipulamos el DOM rápidamente
      const mockElem = document.createElement('div');
      mockElem.style.opacity = Math.random().toString();
      document.body.appendChild(mockElem);
      document.body.removeChild(mockElem);
      
    }, 100);

    // 2. RAM STRESS: Llenar la memoria con arrays masivos
    if (intensity === 'high') {
      this.stressWorkers = Array.from({ length: 4 }, () => {
        const worker = new Worker(new URL('../core/sentinel-worker.ts', import.meta.url), { type: 'module' });
        worker.postMessage('start');
        return worker;
      });
    }

    // 3. GPU STRESS: Crear elementos con blur y animaciones pesadas
    const stressPanel = document.createElement('div');
    stressPanel.id = 'stress-layer';
    stressPanel.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: -1; opacity: 0.5;
      background: linear-gradient(45deg, red, blue, green, yellow);
      filter: blur(50px); transition: all 0.1s linear;
    `;
    document.body.appendChild(stressPanel);

    // Animación agresiva de la capa de estrés para forzar el repintado de la GPU
    const animateGPU = () => {
      if (!store.getState('system').isStressing) return;
      stressPanel.style.transform = `rotate(${Math.random() * 360}deg) scale(${Math.random() + 1})`;
      requestAnimationFrame(animateGPU);
    };
    animateGPU();
  }

  public stopStress(): void {
    console.log('❄️ [STRESS TEST] Stopping stress test...');
    store.setState('system', { isStressing: false });
    
    if (this.stressInterval) {
      clearInterval(this.stressInterval);
      this.stressInterval = null;
    }

    this.stressWorkers.forEach(w => w.terminate());
    this.stressWorkers = [];

    const layer = document.getElementById('stress-layer');
    if (layer) layer.remove();
  }
}

export const stressTestCommand = new StressTestCommand();
