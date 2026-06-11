
import { chromium } from 'playwright';

async function runChaosTest() {
  console.log('🐒 [CHAOS MONKEY] Initiating Destructive Stress Test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('✅ System loaded. Starting the onslaught...');

    // 1. Command Spamming: Ejecutar todos los comandos en paralelo y en bucle
    const commands = [
      { name: 'system.toggle-theme', payload: null },
      { name: 'system.toggle-hp', payload: null },
      { name: 'system.metrics', payload: null },
      { name: 'app.launch', payload: 'chaos-app-id' },
      { name: 'system.audit-log', payload: null },
      { name: 'system.stress-test', payload: { intensity: 'high' } },
    ];

    console.log('💥 Phase 1: Command Spamming (100 rapid-fire executions)...');
    await page.evaluate((cmds) => {
      const dispatcher = (window as any).dispatcher;
      // Lanzamos 100 comandos casi simultáneamente
      for (let i = 0; i < 100; i++) {
        const cmd = cmds[Math.floor(Math.random() * cmds.length)];
        dispatcher.execute(cmd.name, cmd.payload).catch(() => {});
      }
    }, commands);

    // 2. Application Flood: Lanzar cientos de apps simuladas
    console.log('🌊 Phase 2: Application Flooding (500 app launches)...');
    await page.evaluate(() => {
      const dispatcher = (window as any).dispatcher;
      for (let i = 0; i < 500; i++) {
        dispatcher.execute('app.launch', `flood-app-${i}`).catch(() => {});
      }
    });

    // 3. High-Intensity Stress: Mantener el stress test activo
    console.log('🔥 Phase 3: Sustained High-Intensity Stress...');
    await page.evaluate(() => (window as any).dispatcher.execute('system.stress-test', { intensity: 'high' }));
    
    // Esperamos 5 segundos mientras el sistema lucha por sobrevivir
    console.log('⏳ Waiting 5 seconds for system to process chaos...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. Attempt to Break: Forzar estados contradictorios
    console.log('🛠️ Phase 4: State Conflict Simulation...');
    await page.evaluate(() => {
      const store = (window as any).store;
      // Inyectamos estados incoherentes directamente en el store
      store.setState('system', { hpMode: true, isStressing: true, performanceTier: 'low' });
      store.setState('metrics', { fps: -1, status: 'CRITICAL' });
    });

    // 5. Final Flush & Log Recovery
    console.log('📚 Phase 5: Recovering Audit Logs...');
    await page.evaluate(() => (window as any).auditLogger.flush());
    
    const logs = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('system_audit_log') || '[]');
    });

    console.log('\n--- 📊 CHAOS TEST RESULTS ---');
    console.log(`Total Audit Entries: ${logs.length}`);
    if (logs.length > 0) {
      const successes = logs.filter(l => l.status === 'SUCCESS').length;
      const failures = logs.filter(l => l.status === 'FAILURE').length;
      console.log(`Successes: ${successes}`);
      console.log(`Failures: ${failures}`);
      console.log(`Last Log Hash: ${logs[logs.length - 1].hash.substring(0, 10)}...`);
    }

    // Verificar si la página sigue viva
    const isAlive = await page.evaluate(() => !!document.body);
    console.log(`System Alive: ${isAlive}`);

    if (isAlive && logs.length > 0) {
      console.log('\n🏆 SYSTEM SURVIVED THE CHAOS MONKEY! 🏆');
    } else {
      console.log('\n💀 SYSTEM COLLAPSED UNDER PRESSURE 💀');
    }

  } catch (error) {
    console.error('\n❌ Fatal error during chaos test:');
    console.error(error);
  } finally {
    await browser.close();
  }
}

runChaosTest();
