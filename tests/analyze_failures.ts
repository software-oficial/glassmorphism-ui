
import { chromium } from 'playwright';

async function analyzeFailures() {
  console.log('🔍 [ANALYZER] Extracting failure logs from system...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    
    const failures = await page.evaluate(() => {
      const logs = JSON.parse(localStorage.getItem('system_audit_log') || '[]');
      return logs.filter(log => log.status === 'FAILURE');
    });

    if (failures.length === 0) {
      console.log('✅ No failures found in the audit log.');
      return;
    }

    console.log(`
--- 🚩 FOUND ${failures.length} FAILURES ---
`);
    
    failures.forEach((failure, index) => {
      console.log(`[Failure #${index + 1}]`);
      console.log(`- Command: ${failure.command}`);
      console.log(`- Payload: ${JSON.stringify(failure.payload)}`);
      console.log(`- Error: ${failure.result}`);
      console.log(`- Duration: ${failure.duration.toFixed(3)}ms`);
      console.log(`- Timestamp: ${new Date(failure.timestamp).toISOString()}`);
      console.log('-----------------------------------');
    });

  } catch (error) {
    console.error('❌ Analysis failed:');
    console.error(error);
  } finally {
    await browser.close();
  }
}

analyzeFailures();
