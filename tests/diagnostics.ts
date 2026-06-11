import { chromium, Browser, Page } from 'playwright';

async function runDiagnostics() {
  console.log('🔍 Starting deep diagnostic for Glassmorphism OS...');
  
  const browser: Browser = await chromium.launch();
  const page: Page = await browser.newPage();
  
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    console.log('🌐 Connecting to localhost:5173...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    
    console.log('⏳ Checking for .glass-panel...');
    try {
      await page.waitForSelector('.glass-panel', { timeout: 5000 });
      console.log('✅ UI Element found!');
    } catch (e) {
      console.log('❌ UI Element NOT found. Page might be empty or crashed.');
    }

    console.log('📈 Checking Sentinel...');
    const metrics = await page.evaluate(() => {
      const s = (window as any).sentinel;
      return s ? s.getMetrics() : { error: 'Sentinel not found' };
    });
    console.log('Metrics:', JSON.stringify(metrics, null, 2));

    console.log('📜 Checking Dispatcher...');
    const auditLog = await page.evaluate(() => {
      const d = (window as any).dispatcher;
      return d ? d.getAuditLog() : { error: 'Dispatcher not found' };
    });
    console.log('Audit Log Size:', Array.isArray(auditLog) ? auditLog.length : 'N/A');

  } catch (error) {
    console.error('❌ Diagnostic Error:', error);
  } finally {
    await browser.close();
  }
}

runDiagnostics();
