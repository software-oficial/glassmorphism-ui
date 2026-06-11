// remote-audit-worker.ts
// Este worker se encarga de la comunicación con el servidor de auditoría externa.
// Al estar en un hilo separado, las latencias de red no afectan el FPS de la aplicación.

self.onmessage = async (e) => {
  if (e.data.type === 'SYNC_LOGS') {
    const { logs, endpoint } = e.data.payload;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: Date.now(),
          batchSize: logs.length,
          entries: logs
        })
      });

      if (response.ok) {
        self.postMessage({ type: 'SYNC_SUCCESS', payload: { count: logs.length } });
      } else {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      self.postMessage({ 
        type: 'SYNC_FAILURE', 
        payload: { error: error.message, logs } 
      });
    }
  }
};
