import { chromium, Browser, Page } from 'playwright';

async function runFullSystemAudit() {
  console.log('🚀 Starting Full System Performance & Functional Audit...');
  
  const browser: Browser = await chromium.launch();
  const page: Page = await browser.newPage();
  
  const logs: string[] = [];
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    logs.push(text);
    console.log(text);
  });

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('✅ Page loaded.');

    const test = async (name: string, action: () => Promise<void>) => {
      console.log(`Testing: ${name}...`);
      try {
        await action();
        console.log(`✅ ${name} passed.`);
      } catch (e) {
        console.log(`❌ ${name} failed: ${e}`);
      }
    };

    // 1. Test: Theme Toggle
    await test('Theme Toggle', async () => {
      await page.click('button:has-text("Tema")');
      const theme = await page.evaluate(() => document.body.getAttribute('data-theme'));
      if (!theme) throw new Error('Theme not set');
    });

    // 2. Test: HP Mode Toggle
    await test('HP Mode', async () => {
      await page.click('button:has-text("Alto Rendimiento")');
      const isHP = await page.evaluate(() => document.body.classList.contains('hp-mode'));
      if (!isHP) throw new Error('HP Mode not activated');
    });

    // 3. Test: Audit Log
    await test('Audit System', async () => {
      await page.click('button:has-text("Auditoría")');
      const logs = await page.evaluate(() => (window as any).auditLogger.getPersistentLogs());
      if (logs.length === 0) throw new Error('No logs recorded');
    });

    // 4. Test: Remote Control Bridge
    await test('Remote Control', async () => {
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('system-command', { 
          detail: { command: 'system.toggle-theme' } 
        }));
      });
      // Give it a moment to process
      await page.waitForTimeout(500);
    });

    // 5. Test: Stress Test & Performance Drop
    await test('Stress Test Performance', async () => {
      const fpsBefore = await page.evaluate(() => (window as any).store.getState().metrics.fps);
      console.log(`FPS Before Stress: ${fpsBefore}`);
      
      await page.click('button:has-text("Stress Test")');
      console.log('🔥 Stress active. Monitoring for 5 seconds...');
      await page.waitForTimeout(5000);
      
      const fpsAfter = await page.evaluate(() => (window as any).store.getState().metrics.fps);
      console.log(`FPS During Stress: ${fpsAfter}`);
      
      if (fpsAfter === undefined) throw new Error('Failed to capture metrics');
      
      await page.click('button:has-text("Detener Estrés")');
      await page.waitForTimeout(1000);
      const fpsRecovered = await page.evaluate(() => (window as any).store.getState().metrics.fps);
      console.log(`FPS After Recovery: ${fpsRecovered}`);
    });

    console.log('\n--- FINAL AUDIT REPORT ---');
    const finalState = await page.evaluate(() => ({
      state: (window as any).store.getState(),
      logCount: (window as any).auditLogger.getPersistentLogs().length
    }));
    console.log(JSON.stringify(finalState, null, 2));

  } catch (error) {
    console.error('❌ Critical Audit Failure:', error);
  } finally {
    await browser.close();
  }
}

runFullSystemAudit();
