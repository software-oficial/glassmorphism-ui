// sentinel-worker.ts
// Este worker procesa las métricas fuera del hilo principal para evitar stutters en la UI.

let frames = 0;
let lastTime = performance.now();
let simulatedRam = 42;

self.onmessage = (e) => {
  if (e.data === 'start') {
    startMonitoring();
  }
};

function startMonitoring() {
  const loop = () => {
    frames++;
    const now = performance.now();
    
    if (now >= lastTime + 1000) {
      const fps = Math.round((frames * 1000) / (now - lastTime));
      frames = 0;
      lastTime = now;
      
      // Simulación de RAM realista
      const fluctuation = (Math.random() * 2) - 1;
      simulatedRam += fluctuation;
      if (simulatedRam < 35) simulatedRam = 35;
      if (simulatedRam > 60) simulatedRam = 60;
      
      let status = 'HEALTHY';
      if (fps < 30) status = 'CRITICAL';
      else if (fps < 50) status = 'WARNING';

      // Enviamos las métricas procesadas al hilo principal
      self.postMessage({
        type: 'METRICS_UPDATE',
        payload: {
          fps,
          ram: Math.round(simulatedRam),
          status,
        }
      });
    }
    // Usamos setTimeout para evitar bloquear el hilo del worker y mantener la precisión
    setTimeout(loop, 16); // ~60fps
  };
  loop();
}
