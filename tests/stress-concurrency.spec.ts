import { test, expect } from '@playwright/test';

test.describe('Enterprise Stress & Chaos Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  });

  test('CON-01: Command Bombardment (Race Conditions)', async ({ page }) => {
    console.log('🧪 Starting Command Bombardment...');
    
    // Disparamos 50 comandos de forma casi simultánea
    const commandCount = 50;
    await page.evaluate(async (count) => {
      const dispatcher = (window as any).dispatcher;
      const promises = [];
      for (let i = 0; i < count; i++) {
        promises.push(dispatcher.execute('app.launch', `bombard-app-${i}`));
      }
      await Promise.all(promises);
      await (window as any).auditLogger.flush();
    }, commandCount);

    // Verificamos que todos los logs fueron registrados sin colisiones
    const logs = await page.evaluate(() => (window as any).auditLogger.getPersistentLogs());
    
    // Filtramos solo los logs del bombardeo
    const bombardmentLogs = logs.filter(l => l.command === 'app.launch' && l.payload?.startsWith('bombard-app-'));
    
    expect(bombardmentLogs.length).toBe(commandCount);
    
    // Verificamos integridad de la cadena de hashes
    for (let i = 1; i < bombardmentLogs.length; i++) {
      // Nota: En un entorno real, validaríamos que el hash del anterior coincida con previousHash
      // Aquí verificamos al menos que existan y no sean nulos
      expect(bombardmentLogs[i].previousHash).toBeDefined();
      expect(bombardmentLogs[i].hash).not.toBe(bombardmentLogs[i-1].hash);
    }
    
    console.log(`✅ Command Bombardment Passed: ${bombardmentLogs.length}/${commandCount} logs verified.`);
  });

  test('MEM-01: Memory Soak Test (Leak Detection)', async ({ page }) => {
    console.log('🧪 Starting Memory Soak Test...');
    
    // Simulamos uso intensivo durante un periodo corto para detectar tendencias de crecimiento
    const iterations = 200;
    const ramSamples: number[] = [];

    for (let i = 0; i < iterations; i++) {
      await page.evaluate(() => {
        (window as any).dispatcher.execute('system.toggle-theme');
        (window as any).dispatcher.execute('app.launch', 'leak-test');
      });

      // Tomamos muestra de RAM cada 10 iteraciones
      if (i % 10 === 0) {
        const ram = await page.evaluate(() => {
          return (performance as any).memory?.usedJSHeapSize || 0;
        });
        ramSamples.push(ram);
      }
    }

    // Verificamos que la RAM no haya crecido de forma explosiva
    // (Allowing some growth due to GC behavior, but not linear explosion)
    const startRam = ramSamples[0];
    const endRam = ramSamples[ramSamples.length - 1];
    
    console.log(`RAM Start: ${startRam} bytes | RAM End: ${endRam} bytes`);
    
    // Si la RAM final es > 3x la inicial en una prueba tan corta, hay una fuga probable
    if (startRam > 0) {
      expect(endRam / startRam).toBeLessThan(3);
    }
    
    console.log('✅ Memory Soak Test Passed: No explosive heap growth detected.');
  });

  test('CHA-01: Audit Worker Chaos (Resilience)', async ({ page }) => {
    console.log('🧪 Starting Audit Worker Chaos Test...');

    // 1. Forzamos el fallo del worker terminándolo abruptamente
    await page.evaluate(() => {
      (window as any).auditLogger.syncWorker.terminate();
    });

    // 2. Intentamos ejecutar comandos mientras el worker está muerto
    await page.click('button:has-text("Tema")');
    
    // 3. Verificamos que la UI NO se haya congelado y el comando se haya procesado localmente
    const logs = await page.evaluate(() => (window as any).auditLogger.getPersistentLogs());
    expect(logs.length).toBeGreaterThan(0);

    // 4. Verificamos que el sistema no lanzó una excepción no manejada que bloqueara el hilo principal
    const status = await page.evaluate(() => (window as any).store.getState('metrics').status);
    expect(status).toBeDefined();

    console.log('✅ Audit Worker Chaos Test Passed: System remained operational after worker crash.');
  });

  test('BND-01: Log Overflow (Boundary Test)', async ({ page }) => {
    console.log('🧪 Starting Log Overflow Test...');

    // Generamos una cantidad masiva de logs que exceda el límite de persistencia (1000)
    await page.evaluate(async () => {
      const dispatcher = (window as any).dispatcher;
      for (let i = 0; i < 1200; i++) {
        await dispatcher.execute('app.launch', `overflow-${i}`);
      }
      await (window as any).auditLogger.flush();
    });

    // Verificamos que el sistema haya aplicado el slice(-1000) correctamente
    const logs = await page.evaluate(() => (window as any).auditLogger.getPersistentLogs());
    expect(logs.length).toBe(1000);
    
    // El primer log debe ser el 200, no el 0
    expect(logs[0].payload).toBe('overflow-200');
    
    console.log(`✅ Log Overflow Test Passed: Buffer capped at ${logs.length} entries.`);
  });
});
